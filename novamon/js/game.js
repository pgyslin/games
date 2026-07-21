// ============================================================
//  NOVAMON — Moteur : monde multi-cartes, combats, dresseurs,
//  arènes, capture, XP, sauvegarde, rendu "HD-2D"
// ============================================================
"use strict";

const TILE = 32;
const SAVE_KEY = "novamon_save_v1";

const cv = document.getElementById("game");
const ctx = cv.getContext("2d");
let W = 0, H = 0, ZOOM = 2;

// Tampons du pipeline de rendu (scène, flou, réduction)
let worldBuf, wctx, blurBuf, bctx, smallBuf, sctx2;
function resize() {
  W = cv.width = window.innerWidth;
  H = cv.height = window.innerHeight;
  ZOOM = W < 700 ? 1.6 : 2;
  worldBuf = document.createElement("canvas"); worldBuf.width = W; worldBuf.height = H;
  wctx = worldBuf.getContext("2d");
  blurBuf = document.createElement("canvas"); blurBuf.width = W; blurBuf.height = H;
  bctx = blurBuf.getContext("2d");
  smallBuf = document.createElement("canvas");
  smallBuf.width = Math.max(8, W >> 2); smallBuf.height = Math.max(8, H >> 2);
  sctx2 = smallBuf.getContext("2d");
}
window.addEventListener("resize", resize);
resize();

// ---------- État global ----------
const G = {
  mode: "title",           // title | world | battle
  mapId: "kaelis",
  hero: { x: 29, y: 26, px: 29, py: 26, dir: "down", moving: false, prog: 0, tx: 29, ty: 26, phase: 0 },
  team: [], box: [],
  items: { ball: 0, superball: 0, potion: 0, superpotion: 0 },
  dex: { seen: {}, caught: {} },
  badges: {},
  taken: {},
  flags: {},
  lastHeal: { map: "kaelis", x: 6, y: 25 },
  steps: 0,
  muted: false,
  fx: true,                // effets HD (profondeur de champ, étalonnage)
  fade: 0,
  transition: false
};
let B = null;              // état du combat en cours
let time = 0, lastT = 0;
let shake = 0;
let modalOpen = false;

function CM() { return MAPS[G.mapId]; }
function tileAt(x, y) { return tileOf(CM(), x, y); }

let NPC_AT = {};
function setupMap() {
  NPC_AT = {};
  for (const n of CM().npcs) NPC_AT[n.x + "," + n.y] = n;
  buildAmbient();
}

// ============================================================
//  Sons (WebAudio, généré)
// ============================================================
let AC = null;
function beep(freq, dur, delay = 0, type = "square", vol = .12) {
  if (G.muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, AC.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(.001, AC.currentTime + delay + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(AC.currentTime + delay); o.stop(AC.currentTime + delay + dur + .02);
  } catch (e) { /* audio indisponible */ }
}
const SFX = {
  select: () => beep(660, .06, 0, "square", .07),
  confirm: () => { beep(520, .07); beep(780, .09, .07); },
  hit: () => beep(160, .12, 0, "sawtooth", .16),
  superhit: () => { beep(200, .1, 0, "sawtooth", .18); beep(120, .14, .08, "sawtooth", .18); },
  faint: () => { beep(300, .12); beep(200, .14, .1); beep(120, .2, .2); },
  throw: () => beep(480, .1, 0, "triangle", .1),
  shakeB: () => beep(240, .08, 0, "square", .1),
  catchOk: () => { beep(523, .1); beep(659, .1, .1); beep(784, .1, .2); beep(1046, .22, .3); },
  breakout: () => { beep(400, .08); beep(300, .12, .08); },
  heal: () => { beep(660, .09); beep(880, .09, .09); beep(1100, .14, .18); },
  levelup: () => { beep(523, .08); beep(659, .08, .08); beep(784, .08, .16); beep(1046, .16, .24); },
  badge: () => { beep(392, .1); beep(523, .1, .1); beep(659, .1, .2); beep(784, .12, .3); beep(1046, .3, .42); },
  run: () => { beep(700, .06); beep(500, .08, .06); },
  encounter: () => { beep(300, .08); beep(360, .08, .08); beep(300, .08, .16); }
};

// ============================================================
//  Création / stats des Novamon
// ============================================================
function calcStats(spId, lv) {
  const b = SPECIES[spId].base;
  return {
    maxHp: Math.floor(b.hp * 2 * lv / 100) + lv + 10,
    atk: Math.floor(b.atk * 2 * lv / 100) + 5,
    def: Math.floor(b.def * 2 * lv / 100) + 5,
    spd: Math.floor(b.spd * 2 * lv / 100) + 5
  };
}
function movesAtLevel(spId, lv) {
  return SPECIES[spId].moves.filter(m => m[0] <= lv).map(m => m[1]).slice(-4);
}
function createMon(spId, lv) {
  const st = calcStats(spId, lv);
  return { sp: spId, level: lv, xp: 0, hp: st.maxHp, stats: st, moves: movesAtLevel(spId, lv) };
}
function xpNeed(lv) { return 18 + lv * 12; }
function monName(m) { return SPECIES[m.sp].name; }
function markSeen(spId) { G.dex.seen[spId] = true; }
function markCaught(spId) { G.dex.seen[spId] = true; G.dex.caught[spId] = true; }
function firstAlive() { return G.team.findIndex(m => m.hp > 0); }

// ============================================================
//  Dialogue (partagé monde / combat)
// ============================================================
const dlgEl = document.getElementById("dialog");
const dlgName = document.getElementById("dlgname");
const dlgText = document.getElementById("dlgtext");
let sayResolve = null;

function say(text, name = "") {
  return new Promise(res => {
    dlgName.textContent = name;
    dlgName.style.display = name ? "block" : "none";
    dlgText.textContent = text;
    dlgEl.style.display = "block";
    sayResolve = res;
  });
}
function hideDialog() { dlgEl.style.display = "none"; }
function advanceDialog() {
  if (sayResolve) { const r = sayResolve; sayResolve = null; SFX.select(); r(); }
}
dlgEl.addEventListener("click", advanceDialog);

async function runDialog(lines, name) {
  for (const l of lines) await say(l, name);
  hideDialog();
}

// ---------- Toast + bannière de zone ----------
const toastEl = document.getElementById("toast");
let toastTimer = null;
function toast(msg, ms = 2600) {
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.style.display = "none"; }, ms);
}
const bannerEl = document.getElementById("banner");
let bannerTimer = null;
function banner(text) {
  bannerEl.textContent = text;
  bannerEl.classList.remove("show");
  void bannerEl.offsetWidth; // relance l'animation
  bannerEl.classList.add("show");
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => bannerEl.classList.remove("show"), 3200);
}

// ============================================================
//  Entrées clavier / tactile
// ============================================================
const keys = {};
const DIRKEYS = {
  arrowup: "up", z: "up", w: "up",
  arrowdown: "down", s: "down",
  arrowleft: "left", q: "left", a: "left",
  arrowright: "right", d: "right"
};
window.addEventListener("keydown", e => {
  const k = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
  keys[k] = true;
  // un appui bref pivote immédiatement le héros (maintenir pour marcher)
  if (DIRKEYS[k] && G.mode === "world" && !modalOpen && !sayResolve && !G.hero.moving) G.hero.dir = DIRKEYS[k];
  if (k === "enter" || k === " " || k === "e") {
    // une même pression ne doit pas à la fois fermer un dialogue ET interagir
    if (sayResolve) { advanceDialog(); return; }
    if ((k === "e" || k === "enter") && G.mode === "world" && !modalOpen && !G.transition) interact();
    return;
  }
  if (k === "escape") {
    if (modalOpen) closeModal();
    else if (G.mode === "world" && !sayResolve) openMenuModal();
  }
});
window.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

// Tactile
if ("ontouchstart" in window) {
  document.getElementById("touch").style.display = "block";
  const bind = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener("touchstart", e => { e.preventDefault(); keys[key] = true; }, { passive: false });
    el.addEventListener("touchend", e => { e.preventDefault(); keys[key] = false; }, { passive: false });
  };
  bind("t-up", "arrowup"); bind("t-down", "arrowdown");
  bind("t-left", "arrowleft"); bind("t-right", "arrowright");
  const a = document.getElementById("t-a");
  a.addEventListener("touchstart", e => {
    e.preventDefault();
    if (sayResolve) advanceDialog();
    else if (G.mode === "world" && !modalOpen && !G.transition) interact();
  }, { passive: false });
}

// ============================================================
//  Monde : déplacement, transitions, interactions, rencontres
// ============================================================
function heldDir() {
  for (const k of Object.keys(DIRKEYS)) if (keys[k]) return DIRKEYS[k];
  return null;
}
function walkable(x, y) {
  const t = tileAt(x, y);
  if (SOLID_TILES.has(t)) return false;
  if (NPC_AT[x + "," + y]) return false;
  return true;
}
const DELTA = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function updateWorld(dt) {
  const h = G.hero;
  if (!h.moving && !sayResolve && !modalOpen && !G.transition) {
    const dir = heldDir();
    if (dir) {
      h.dir = dir;
      const [dx, dy] = DELTA[dir];
      const nx = h.x + dx, ny = h.y + dy;
      const t = tileAt(nx, ny);
      if (ENCOUNTER_TILES.has(t) && G.team.length === 0) {
        toast("Il est dangereux d'aller dans les hautes herbes sans Novamon !");
      } else if (walkable(nx, ny)) {
        h.moving = true; h.prog = 0; h.tx = nx; h.ty = ny;
      }
    }
  }
  if (h.moving) {
    const speed = (keys.shift ? 7.5 : 4.6);
    h.prog += dt * speed;
    h.phase += dt * speed * .8;
    if (h.prog >= 1) {
      h.x = h.tx; h.y = h.ty;
      h.px = h.x; h.py = h.y;
      h.moving = false; h.prog = 0;
      G.steps++;
      onArrive();
    } else {
      h.px = h.x + (h.tx - h.x) * h.prog;
      h.py = h.y + (h.ty - h.y) * h.prog;
    }
  } else {
    h.phase *= .8;
  }
}

async function switchMap(to, tx, ty, dir) {
  if (G.transition) return;
  G.transition = true;
  await tween(G, "fade", G.fade, 1, 240);
  G.mapId = to;
  const h = G.hero;
  h.x = h.tx = tx; h.y = h.ty = ty;
  h.px = tx; h.py = ty; h.moving = false; h.prog = 0;
  if (dir) h.dir = dir;
  setupMap();
  banner(CM().label);
  await tween(G, "fade", 1, 0, 320);
  G.transition = false;
  saveGame();
}

function onArrive() {
  const h = G.hero;
  const m = CM();
  // sortie de carte ?
  const ex = (m.exits || []).find(e => e.x === h.x && e.y === h.y);
  if (ex) { switchMap(ex.to, ex.tx, ex.ty, ex.dir); return; }
  // objets au sol
  const pk = (m.pickups || []).find(p => p.x === h.x && p.y === h.y && !G.taken[p.id]);
  if (pk) {
    G.taken[pk.id] = true;
    G.items[pk.item] += pk.n;
    SFX.confirm();
    toast(`Vous trouvez ${pk.n}× ${ITEMS[pk.item].name} !`);
    updateHud(); saveGame();
    return;
  }
  // rencontres
  const t = tileAt(h.x, h.y);
  if (ENCOUNTER_TILES.has(t) && G.team.length > 0 && Math.random() < .13) {
    startBattle(encounterFor(m, h.x, h.y));
  }
}

function interact() {
  const h = G.hero;
  const [dx, dy] = DELTA[h.dir];
  const tx = h.x + dx, ty = h.y + dy;
  const npc = NPC_AT[tx + "," + ty];
  if (npc) {
    if (npc.kind === "prof" && !G.flags.starter) { starterSequence(); return; }
    if (npc.kind === "trainer" || npc.kind === "leader") { trainerInteract(npc); return; }
    runDialog(npc.lines, npc.name);
    return;
  }
  const t = tileAt(tx, ty);
  if (t === "H") { useHealCenter(); return; }
  if (t === "L") { runDialog(["Le laboratoire du Professeur Aralia. Ça sent la fougère et le café."], "Laboratoire"); return; }
  if (t === "G") { runDialog(["L'arène de la ville. L'entrée est la porte centrale."], "Arène"); return; }
  if (t === "F") { runDialog(["L'eau de la fontaine est d'une clarté étonnante."], "Fontaine"); return; }
  if (t === "w") { runDialog(["L'eau scintille... Des ombres nagent sous la surface."], ""); return; }
}

async function useHealCenter() {
  if (G.team.length === 0) { await runDialog(["Le centre de soins est ouvert, mais vous n'avez aucun Novamon."], "Centre de soins"); return; }
  for (const m of G.team) { m.hp = m.stats.maxHp; }
  G.lastHeal = { map: G.mapId, x: G.hero.x, y: G.hero.y };
  SFX.heal();
  await runDialog(["Votre équipe a été soignée. Toute la forme !"], "Centre de soins");
  updateHud(); saveGame();
  toast("Partie sauvegardée ✓");
}

// ---------- Séquence du starter ----------
async function starterSequence() {
  await say("Ah, te voilà ! Je suis la Professeure Aralia, j'étudie les Novamon de Kaelis.", "Prof. Aralia");
  await say("Un dresseur ne part jamais à l'aventure sans compagnon. Choisis ton premier Novamon !", "Prof. Aralia");
  hideDialog();
  openModal(`<h2>Choisis ton Novamon de départ</h2><div class="starters" id="starters"></div>`, false);
  const cont = document.getElementById("starters");
  for (const id of STARTERS) {
    const sp = SPECIES[id];
    const cell = document.createElement("div");
    cell.className = "startercell";
    const c = document.createElement("canvas");
    c.width = 120; c.height = 110;
    cell.appendChild(c);
    const nm = document.createElement("div");
    nm.className = "sname"; nm.textContent = sp.name;
    cell.appendChild(nm);
    const ty = document.createElement("div");
    ty.innerHTML = sp.types.map(t => `<span class="typetag" style="background:${TYPES[t].c}">${t}</span>`).join("");
    cell.appendChild(ty);
    cell.addEventListener("click", () => chooseStarter(id));
    cont.appendChild(cell);
    const cctx = c.getContext("2d");
    const animCell = () => {
      if (!c.isConnected) return;
      cctx.clearRect(0, 0, 120, 110);
      pixMon(cctx, sp, 60, 100, 78, { t: time }, 2);
      requestAnimationFrame(animCell);
    };
    animCell();
  }
}
async function chooseStarter(id) {
  closeModal();
  const mon = createMon(id, 5);
  G.team.push(mon);
  markCaught(id);
  G.items.ball += 8;
  G.items.potion += 3;
  G.flags.starter = true;
  SFX.catchOk();
  await say(`Félicitations ! ${SPECIES[id].name} rejoint ton équipe !`, "Prof. Aralia");
  await say("Tiens, prends aussi 8 Novaballs et 3 Potions. La Route 1, au nord, mène à Verdicité et à sa cheffe d'arène !", "Prof. Aralia");
  hideDialog();
  updateHud(); saveGame();
  toast("Partie sauvegardée ✓");
}

// ============================================================
//  Combat (sauvage et dresseur)
// ============================================================
const bmenuEl = document.getElementById("bmenu");
const eCard = document.getElementById("enemycard");
const aCard = document.getElementById("allycard");

function rollEncounter(zone) {
  const total = zone.table.reduce((s, e) => s + e[1], 0);
  let r = Math.random() * total;
  let spId = zone.table[0][0];
  for (const [id, w] of zone.table) { r -= w; if (r <= 0) { spId = id; break; } }
  const lv = zone.lv[0] + Math.floor(Math.random() * (zone.lv[1] - zone.lv[0] + 1));
  return createMon(spId, lv);
}

function mine() { return G.team[B.allyIdx]; }

function freshBattleState(enemy, zone) {
  return {
    enemy, zone,
    allyIdx: firstAlive(),
    over: false, particles: [],
    eAnim: { dx: 0, dy: 0, flash: 0, scale: 1, alpha: 1 },
    aAnim: { dx: 0, dy: 0, flash: 0, scale: 1, alpha: 1 },
    ball: null, choose: null,
    trainer: null, tTeam: null, tIdx: 0
  };
}

async function startBattle(zone) {
  SFX.encounter();
  const wild = rollEncounter(zone);
  markSeen(wild.sp);
  B = freshBattleState(wild, zone);
  G.mode = "battle";
  updateCards();
  eCard.style.display = "block";
  aCard.style.display = "block";
  await say(`Un ${monName(wild)} sauvage apparaît ! (Nv. ${wild.level})`);
  await say(`${monName(mine())}, en avant !`);
  hideDialog();
  battleLoop();
}

async function trainerInteract(npc) {
  if (G.flags["beat_" + npc.id]) { runDialog(npc.post, npc.name); return; }
  await runDialog(npc.pre, npc.name);
  startTrainerBattle(npc);
}

async function startTrainerBattle(npc) {
  SFX.encounter();
  const team = npc.team.map(([id, lv]) => createMon(id, lv));
  B = freshBattleState(team[0], { label: CM().label });
  B.trainer = npc;
  B.tTeam = team;
  B.tIdx = 0;
  markSeen(team[0].sp);
  G.mode = "battle";
  updateCards();
  eCard.style.display = "block";
  aCard.style.display = "block";
  await say(`${npc.name} veut se battre !`);
  await say(`${npc.name} envoie ${monName(team[0])} ! (Nv. ${team[0].level})`);
  await say(`${monName(mine())}, en avant !`);
  hideDialog();
  battleLoop();
}

function updateCards() {
  const e = B.enemy, a = mine();
  document.getElementById("e-name").textContent = (B.trainer ? "⚔ " : "") + monName(e);
  document.getElementById("e-lv").textContent = "Nv. " + e.level +
    (B.trainer ? `  (${B.tIdx + 1}/${B.tTeam.length})` : "");
  setBar(document.getElementById("e-hp"), e.hp / e.stats.maxHp);
  document.getElementById("a-name").textContent = monName(a);
  document.getElementById("a-lv").textContent = "Nv. " + a.level;
  setBar(document.getElementById("a-hp"), a.hp / a.stats.maxHp);
  document.getElementById("a-hpnum").textContent = `${a.hp} / ${a.stats.maxHp} PV`;
  document.getElementById("a-xp").style.width = Math.min(100, (a.xp / xpNeed(a.level)) * 100) + "%";
  updateHud();
}
function setBar(el, ratio) {
  const p = Math.max(0, Math.min(1, ratio));
  el.style.width = (p * 100) + "%";
  el.className = p < .25 ? "low" : (p < .55 ? "mid" : "");
}

// ---------- Menus de combat ----------
function showMainMenu() {
  bmenuEl.innerHTML = `<div class="grid">
    <button class="primary" data-a="fight">⚔️ Attaque</button>
    <button data-a="bag">🎒 Sac</button>
    <button data-a="team">👥 Équipe</button>
    <button data-a="flee">💨 Fuite</button>
  </div>`;
  bmenuEl.style.display = "block";
  bmenuEl.querySelectorAll("button").forEach(b => b.addEventListener("click", () => {
    SFX.select();
    const a = b.dataset.a;
    if (a === "fight") showMoveMenu();
    else if (a === "bag") showBagMenu();
    else if (a === "team") showTeamMenu(false);
    else if (a === "flee") B.choose && B.choose({ type: "flee" });
  }));
}
function showMoveMenu() {
  const a = mine();
  let html = `<h3>Quelle attaque ?</h3><div class="grid">`;
  for (const mv of a.moves) {
    const m = MOVES[mv];
    html += `<button class="movebtn" data-mv="${mv}">${mv}
      <span class="tag" style="background:${TYPES[m.type].c}">${m.type}</span>
      <small>${m.pow} PWR</small></button>`;
  }
  html += `</div><div style="margin-top:8px;text-align:right"><button data-back="1">↩ Retour</button></div>`;
  bmenuEl.innerHTML = html;
  bmenuEl.querySelectorAll("[data-mv]").forEach(b => b.addEventListener("click", () => {
    B.choose && B.choose({ type: "move", mv: b.dataset.mv });
  }));
  bmenuEl.querySelector("[data-back]").addEventListener("click", showMainMenu);
}
function showBagMenu() {
  let html = `<h3>Sac</h3><div class="grid">`;
  for (const id of ["ball", "superball", "potion", "superpotion"]) {
    const n = G.items[id];
    html += `<button data-item="${id}" ${n <= 0 ? "disabled style='opacity:.4'" : ""}>${ITEMS[id].name} ×${n}</button>`;
  }
  html += `</div><div style="margin-top:8px;text-align:right"><button data-back="1">↩ Retour</button></div>`;
  bmenuEl.innerHTML = html;
  bmenuEl.querySelectorAll("[data-item]").forEach(b => b.addEventListener("click", () => {
    if (b.disabled) return;
    B.choose && B.choose({ type: "item", item: b.dataset.item });
  }));
  bmenuEl.querySelector("[data-back]").addEventListener("click", showMainMenu);
}
function showTeamMenu(forced) {
  let html = `<h3>${forced ? "Choisis un remplaçant !" : "Envoyer qui ?"}</h3>`;
  G.team.forEach((m, i) => {
    const dis = (m.hp <= 0 || i === B.allyIdx);
    html += `<button style="width:100%;margin-bottom:6px;text-align:left;${dis ? "opacity:.4" : ""}" data-idx="${i}" ${dis ? "disabled" : ""}>
      ${monName(m)} — Nv.${m.level} — ${m.hp}/${m.stats.maxHp} PV</button>`;
  });
  if (!forced) html += `<div style="text-align:right"><button data-back="1">↩ Retour</button></div>`;
  bmenuEl.innerHTML = html;
  bmenuEl.querySelectorAll("[data-idx]").forEach(b => b.addEventListener("click", () => {
    if (b.disabled) return;
    B.choose && B.choose({ type: "switch", idx: parseInt(b.dataset.idx, 10) });
  }));
  const back = bmenuEl.querySelector("[data-back]");
  if (back) back.addEventListener("click", showMainMenu);
}
function hideMenus() { bmenuEl.style.display = "none"; }

function playerChoice() {
  return new Promise(res => { B.choose = res; showMainMenu(); });
}
function forcedSwitch() {
  return new Promise(res => { B.choose = res; showTeamMenu(true); bmenuEl.style.display = "block"; });
}

// ---------- Tweens ----------
const tweens = [];
function tween(obj, prop, from, to, ms) {
  return new Promise(res => {
    tweens.push({ obj, prop, from, to, ms, t0: performance.now(), res });
  });
}
function updateTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    let p = (now - tw.t0) / tw.ms;
    if (p >= 1) { tw.obj[tw.prop] = tw.to; tweens.splice(i, 1); tw.res(); }
    else {
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      tw.obj[tw.prop] = tw.from + (tw.to - tw.from) * e;
    }
  }
}
const wait = ms => new Promise(r => setTimeout(r, ms));

function burst(x, y, color, n = 16, spd = 3) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = (Math.random() * .6 + .4) * spd;
    B.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 1, color, r: 3 + Math.random() * 4 });
  }
}

// ---------- Résolution d'un tour ----------
function enemyPickMove(e, target) {
  let best = null, bestScore = -1;
  for (const mv of e.moves) {
    const m = MOVES[mv];
    const score = m.pow * typeMult(m.type, SPECIES[target.sp].types) * (0.8 + Math.random() * 0.5);
    if (score > bestScore) { bestScore = score; best = mv; }
  }
  return best;
}
function calcDamage(att, def, mv) {
  const m = MOVES[mv];
  const stab = SPECIES[att.sp].types.includes(m.type) ? 1.5 : 1;
  const eff = typeMult(m.type, SPECIES[def.sp].types);
  const rnd = .85 + Math.random() * .15;
  const dmg = Math.max(1, Math.floor((((2 * att.level / 5 + 2) * m.pow * att.stats.atk / Math.max(1, def.stats.def)) / 50 + 2) * stab * eff * rnd));
  return { dmg: eff === 0 ? 0 : dmg, eff };
}

async function doMove(attacker, defender, mv, allyAttacks) {
  const attAnim = allyAttacks ? B.aAnim : B.eAnim;
  const defAnim = allyAttacks ? B.eAnim : B.aAnim;
  const m = MOVES[mv];
  await say(`${monName(attacker)} utilise ${mv} !`);
  if (Math.random() * 100 > m.acc) {
    await say("L'attaque échoue !");
    return;
  }
  const dir = allyAttacks ? 1 : -1;
  await tween(attAnim, "dx", 0, dir * 46, 130);
  const { dmg, eff } = calcDamage(attacker, defender, mv);
  if (eff === 0) {
    tween(attAnim, "dx", attAnim.dx, 0, 160);
    await say(`Ça n'affecte pas ${monName(defender)}...`);
    return;
  }
  const tx = allyAttacks ? W * .72 : W * .3;
  const ty = allyAttacks ? H * .42 : H * .62;
  burst(tx, ty, TYPES[m.type].c, eff > 1 ? 26 : 16, eff > 1 ? 4.4 : 3);
  defAnim.flash = 1;
  shake = eff > 1 ? 14 : 8;
  (eff > 1 ? SFX.superhit : SFX.hit)();
  tween(defAnim, "flash", 1, 0, 340);
  tween(attAnim, "dx", attAnim.dx, 0, 180);
  defender.hp = Math.max(0, defender.hp - dmg);
  updateCards();
  await wait(360);
  if (eff > 1) await say("C'est super efficace !");
  else if (eff < 1) await say("Ce n'est pas très efficace...");
}

async function gainXp(mon, amount) {
  await say(`${monName(mon)} gagne ${amount} XP !`);
  mon.xp += amount;
  while (mon.xp >= xpNeed(mon.level)) {
    mon.xp -= xpNeed(mon.level);
    mon.level++;
    const old = mon.stats;
    mon.stats = calcStats(mon.sp, mon.level);
    mon.hp = Math.min(mon.stats.maxHp, mon.hp + (mon.stats.maxHp - old.maxHp));
    SFX.levelup();
    updateCards();
    await say(`${monName(mon)} monte au niveau ${mon.level} !`);
    for (const [lvl, mv] of SPECIES[mon.sp].moves) {
      if (lvl === mon.level && !mon.moves.includes(mv)) {
        if (mon.moves.length >= 4) mon.moves.shift();
        mon.moves.push(mv);
        await say(`${monName(mon)} apprend ${mv} !`);
      }
    }
    const evo = SPECIES[mon.sp].evolve;
    if (evo && mon.level >= evo.level) {
      const oldName = monName(mon);
      await say(`Hein ?! ${oldName} évolue !`);
      const anim = B ? B.aAnim : null;
      if (anim) { await tween(anim, "flash", 0, 1, 500); }
      mon.sp = evo.to;
      const old2 = mon.stats;
      mon.stats = calcStats(mon.sp, mon.level);
      mon.hp = Math.min(mon.stats.maxHp, mon.hp + (mon.stats.maxHp - old2.maxHp));
      for (const [lvl, mv] of SPECIES[mon.sp].moves) {
        if (lvl <= mon.level && !mon.moves.includes(mv) && mon.moves.length < 4) mon.moves.push(mv);
      }
      markCaught(mon.sp);
      if (anim) { await tween(anim, "flash", 1, 0, 500); }
      SFX.catchOk();
      updateCards();
      await say(`${oldName} a évolué en ${monName(mon)} !`);
    }
  }
  updateCards();
}

async function tryCapture(kind) {
  G.items[kind]--;
  updateHud();
  const e = B.enemy;
  await say(`Vous lancez une ${ITEMS[kind].name} !`);
  SFX.throw();
  B.ball = { x: W * .3, y: H * .62, r: 10, rot: 0, vis: true };
  const px = W * .72, py = H * .42;
  tween(B.ball, "rot", 0, Math.PI * 4, 500);
  tween(B.ball, "y", B.ball.y, py - 120, 250).then(() => tween(B.ball, "y", py - 120, py, 250));
  await tween(B.ball, "x", B.ball.x, px, 500);
  await tween(B.eAnim, "scale", 1, 0, 300);
  B.eAnim.alpha = 0;
  const p = Math.min(.95, SPECIES[e.sp].catch * ITEMS[kind].mult * (1 - .65 * e.hp / e.stats.maxHp) * 1.6);
  const success = Math.random() < p;
  const shakes = success ? 3 : (Math.random() < .5 ? 1 : 2);
  for (let i = 0; i < shakes; i++) {
    await wait(420);
    SFX.shakeB();
    await tween(B.ball, "rot", -.35, .35, 180);
    await tween(B.ball, "rot", .35, 0, 120);
  }
  await wait(420);
  if (success) {
    SFX.catchOk();
    burst(px, py, "#ffd98a", 24, 3.6);
    markCaught(e.sp);
    await say(`Et hop ! ${monName(e)} est capturé !`);
    if (G.team.length < 6) {
      G.team.push(e);
      await say(`${monName(e)} rejoint votre équipe !`);
    } else {
      G.box.push(e);
      await say(`${monName(e)} est envoyé dans la Boîte (équipe pleine).`);
    }
    B.over = true; B.captured = true;
  } else {
    SFX.breakout();
    B.ball.vis = false;
    B.eAnim.alpha = 1;
    await tween(B.eAnim, "scale", 0, 1, 250);
    await say(`Oh non ! ${monName(e)} s'est libéré !`);
  }
  B.ball = null;
}

async function trainerVictory() {
  const npc = B.trainer;
  hideMenus();
  for (const l of npc.win) await say(l, npc.name);
  if (npc.reward) {
    G.items[npc.reward.item] += npc.reward.n;
    SFX.confirm();
    await say(`Vous recevez ${npc.reward.n}× ${ITEMS[npc.reward.item].name} !`);
  }
  if (npc.badge && !G.badges[npc.badge]) {
    G.badges[npc.badge] = true;
    SFX.badge();
    await say(`Vous obtenez le ${BADGES[npc.badge].name} ${BADGES[npc.badge].icon} !`);
    const count = Object.keys(G.badges).length;
    if (count >= 3) await say("Les trois badges de Kaelis sont à vous. La Ligue vous attend… bientôt !");
  }
  G.flags["beat_" + npc.id] = true;
}

async function battleLoop() {
  while (!B.over) {
    const e = B.enemy;
    updateCards();
    const act = await playerChoice();
    hideMenus();
    let enemyActs = true;

    if (act.type === "flee") {
      if (B.trainer) {
        await say("On ne fuit pas un combat de dresseur !");
        continue;
      }
      const chance = Math.max(.3, Math.min(.95, mine().stats.spd / e.stats.spd * .75));
      if (Math.random() < chance) {
        SFX.run();
        await say("Vous prenez la fuite !");
        endBattle();
        return;
      }
      await say("Impossible de fuir !");
    }
    else if (act.type === "item") {
      const it = ITEMS[act.item];
      if (it.mult) {
        if (B.trainer) {
          await say("On ne capture pas le Novamon d'un autre dresseur !");
          continue;
        }
        await tryCapture(act.item);
        if (B.over) break;
      } else {
        G.items[act.item]--;
        const m = mine();
        m.hp = Math.min(m.stats.maxHp, m.hp + it.heal);
        SFX.heal();
        updateCards();
        await say(`${monName(m)} récupère des PV grâce à la ${it.name} !`);
      }
    }
    else if (act.type === "switch") {
      B.allyIdx = act.idx;
      updateCards();
      await say(`${monName(mine())}, à toi de jouer !`);
    }
    else if (act.type === "move") {
      const a = mine();
      const eMv = enemyPickMove(e, a);
      const allyFirst = a.stats.spd >= e.stats.spd;
      const order = allyFirst
        ? [[a, e, act.mv, true], [e, a, eMv, false]]
        : [[e, a, eMv, false], [a, e, act.mv, true]];
      for (const [att, def, mv, isAlly] of order) {
        if (att.hp <= 0) continue;
        await doMove(att, def, mv, isAlly);
        if (e.hp <= 0 || a.hp <= 0) break;
      }
      enemyActs = false;
    }

    if (enemyActs && !B.over && e.hp > 0) {
      const a = mine();
      await doMove(e, a, enemyPickMove(e, a), false);
    }

    // K.O. ennemi ?
    if (e.hp <= 0 && !B.over) {
      SFX.faint();
      await tween(B.eAnim, "dy", 0, 60, 400);
      B.eAnim.alpha = 0;
      await say(`${monName(e)} ${B.trainer ? "ennemi" : "sauvage"} est K.O. !`);
      const xp = Math.floor(SPECIES[e.sp].xp * e.level / 5 * (B.trainer ? 1.4 : 1));
      await gainXp(mine(), xp);
      if (B.trainer && B.tIdx < B.tTeam.length - 1) {
        // le dresseur envoie son Novamon suivant
        B.tIdx++;
        B.enemy = B.tTeam[B.tIdx];
        markSeen(B.enemy.sp);
        B.eAnim.dx = 0; B.eAnim.dy = 0; B.eAnim.flash = 0; B.eAnim.scale = 1; B.eAnim.alpha = 1;
        updateCards();
        await say(`${B.trainer.name} envoie ${monName(B.enemy)} ! (Nv. ${B.enemy.level})`);
        continue;
      }
      if (B.trainer) {
        await trainerVictory();
      } else if (Math.random() < .28) {
        G.items.ball++;
        await say("Vous ramassez une Novaball laissée sur place !");
      }
      B.over = true;
    }
    if (mine().hp <= 0 && !B.over) {
      SFX.faint();
      await tween(B.aAnim, "dy", 0, 60, 400);
      await say(`${monName(mine())} est K.O. !`);
      if (firstAlive() >= 0) {
        const act2 = await forcedSwitch();
        hideMenus();
        B.allyIdx = act2.idx;
        B.aAnim.dy = 0;
        updateCards();
        await say(`${monName(mine())}, à toi de jouer !`);
      } else {
        await say("Tous vos Novamon sont K.O. ! Vous courez au centre de soins...");
        for (const m of G.team) m.hp = m.stats.maxHp;
        G.mapId = G.lastHeal.map;
        const h = G.hero;
        h.x = h.tx = G.lastHeal.x; h.y = h.ty = G.lastHeal.y;
        h.px = h.x; h.py = h.y; h.moving = false;
        setupMap();
        endBattle();
        SFX.heal();
        return;
      }
    }
  }
  endBattle();
}

function endBattle() {
  hideDialog(); hideMenus();
  eCard.style.display = "none";
  aCard.style.display = "none";
  B = null;
  G.mode = "world";
  updateHud();
  saveGame();
}

// ============================================================
//  Modales (équipe, dex, sac, menu)
// ============================================================
const modalWrap = document.getElementById("modalwrap");
const modalEl = document.getElementById("modal");
function openModal(html, closable = true) {
  modalEl.innerHTML = html + (closable ? `<div class="closebar"><button id="mclose">Fermer</button></div>` : "");
  modalWrap.style.display = "flex";
  modalOpen = true;
  const mc = document.getElementById("mclose");
  if (mc) mc.addEventListener("click", closeModal);
}
function closeModal() { modalWrap.style.display = "none"; modalOpen = false; }
modalWrap.addEventListener("click", e => { if (e.target === modalWrap && document.getElementById("mclose")) closeModal(); });

function openTeamModal() {
  if (G.mode !== "world") return;
  let html = `<h2>👥 Mon équipe</h2>`;
  if (G.team.length === 0) html += `<p>Aucun Novamon pour l'instant. Va voir la Prof. Aralia !</p>`;
  G.team.forEach((m, i) => {
    const sp = SPECIES[m.sp];
    const pct = Math.round(m.hp / m.stats.maxHp * 100);
    html += `<div class="teamrow">
      <canvas width="56" height="56" data-mon="${i}"></canvas>
      <div class="tinfo"><b>${sp.name}</b> — Nv.${m.level}
        ${sp.types.map(t => `<span class="typetag" style="background:${TYPES[t].c}">${t}</span>`).join("")}
        <div class="minibar" style="margin-top:3px"><div class="${pct < 25 ? "low" : pct < 55 ? "mid" : ""}" style="width:${pct}%"></div></div>
        <small style="color:#9fb0c4">${m.hp}/${m.stats.maxHp} PV — ${m.moves.join(", ")}</small>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px">
        ${i > 0 ? `<button data-lead="${i}">⭐ En tête</button>` : ""}
        <button data-heal="${i}" ${G.items.potion + G.items.superpotion <= 0 || m.hp >= m.stats.maxHp ? "disabled style='opacity:.4'" : ""}>🧪 Potion</button>
      </div>
    </div>`;
  });
  if (G.box.length) html += `<p style="font-size:12px;color:#9fb0c4">📦 Boîte : ${G.box.map(m => monName(m) + " Nv." + m.level).join(", ")}</p>`;
  openModal(html);
  modalEl.querySelectorAll("[data-mon]").forEach(c => {
    const m = G.team[parseInt(c.dataset.mon, 10)];
    pixMon(c.getContext("2d"), SPECIES[m.sp], 28, 52, 42, { t: 1 }, 2);
  });
  modalEl.querySelectorAll("[data-lead]").forEach(b => b.addEventListener("click", () => {
    const i = parseInt(b.dataset.lead, 10);
    const [m] = G.team.splice(i, 1);
    G.team.unshift(m);
    SFX.confirm(); updateHud(); openTeamModal();
  }));
  modalEl.querySelectorAll("[data-heal]").forEach(b => b.addEventListener("click", () => {
    if (b.disabled) return;
    const m = G.team[parseInt(b.dataset.heal, 10)];
    const kind = G.items.potion > 0 ? "potion" : "superpotion";
    G.items[kind]--;
    m.hp = Math.min(m.stats.maxHp, m.hp + ITEMS[kind].heal);
    SFX.heal(); updateHud(); openTeamModal();
  }));
}

function openDexModal() {
  const caught = Object.keys(G.dex.caught).length;
  const seen = Object.keys(G.dex.seen).length;
  let html = `<h2>📘 Novadex — vus : ${seen} / capturés : ${caught} / ${DEX_ORDER.length}</h2><div class="dexgrid">`;
  DEX_ORDER.forEach((id, i) => {
    const sp = SPECIES[id];
    const s = G.dex.seen[id], c = G.dex.caught[id];
    html += `<div class="dexcell">
      <div style="font-size:10px;color:#9fb0c4">#${String(i + 1).padStart(3, "0")} ${c ? "●" : s ? "○" : ""}</div>
      <canvas width="80" height="72" data-dex="${id}"></canvas>
      <div class="dexname">${s ? sp.name : "???"}</div>
      ${s ? sp.types.map(t => `<span class="typetag" style="background:${TYPES[t].c}">${t}</span>`).join("") : ""}
      ${c ? `<div class="dexdesc">${sp.desc}</div>` : ""}
    </div>`;
  });
  html += `</div>`;
  openModal(html);
  modalEl.querySelectorAll("[data-dex]").forEach(cnv => {
    const id = cnv.dataset.dex;
    const c2 = cnv.getContext("2d");
    if (G.dex.seen[id]) {
      pixMon(c2, SPECIES[id], 40, 68, 52, { t: 2 }, 2);
    } else {
      c2.save();
      pixMon(c2, SPECIES[id], 40, 68, 52, { t: 2, shadow: false }, 2);
      c2.globalCompositeOperation = "source-atop";
      c2.fillStyle = "rgba(10,14,22,.94)";
      c2.fillRect(0, 0, 80, 72);
      c2.restore();
    }
  });
}

function openBagModal() {
  let html = `<h2>🎒 Sac</h2>`;
  for (const id of ["ball", "superball", "potion", "superpotion"]) {
    html += `<div class="itemrow"><div>${ITEMS[id].name}<small>${ITEMS[id].desc}</small></div><b>×${G.items[id]}</b></div>`;
  }
  const bl = Object.keys(BADGES).map(b => G.badges[b] ? BADGES[b].icon + " " + BADGES[b].name : "❔ ———").join(" • ");
  html += `<div class="itemrow"><div>Badges<small>${bl}</small></div><b>${Object.keys(G.badges).length}/3</b></div>`;
  html += `<p style="font-size:12px;color:#9fb0c4">Les potions s'utilisent depuis l'écran Équipe ou en combat.</p>`;
  openModal(html);
}

function openMenuModal() {
  let html = `<h2>⚙️ Menu</h2>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button id="m-save">💾 Sauvegarder</button>
      <button id="m-fx">${G.fx ? "✨ Effets HD : activés" : "✨ Effets HD : désactivés"}</button>
      <button id="m-sound">${G.muted ? "🔇 Son : coupé" : "🔊 Son : activé"}</button>
      <button id="m-help">❓ Aide</button>
      <button class="danger" id="m-reset">🗑️ Recommencer à zéro</button>
    </div>`;
  openModal(html);
  document.getElementById("m-save").addEventListener("click", () => { saveGame(); toast("Partie sauvegardée ✓"); closeModal(); });
  document.getElementById("m-fx").addEventListener("click", () => { G.fx = !G.fx; saveGame(); openMenuModal(); });
  document.getElementById("m-sound").addEventListener("click", () => { G.muted = !G.muted; saveGame(); openMenuModal(); });
  document.getElementById("m-help").addEventListener("click", () => {
    openModal(`<h2>❓ Aide</h2><p style="line-height:1.7;font-size:14px">
      • Déplacement : ZQSD / flèches — Maj pour courir.<br>
      • E ou Entrée : parler, interagir, passer les dialogues.<br>
      • Les <b>hautes herbes</b> et les <b>plages</b> cachent des Novamon sauvages.<br>
      • Affaiblissez un Novamon avant de lancer une Novaball pour le capturer.<br>
      • Trois <b>arènes</b> vous attendent : Verdicité (Plante), Rocheville (Roche) et Cité Azur (Eau).<br>
      • Parlez aux <b>dresseurs</b> des routes pour les affronter et gagner des objets.<br>
      • Le <b>centre de soins</b> de chaque ville soigne votre équipe et sert de point de retour.<br>
      • Vos Novamon gagnent de l'XP, montent de niveau et <b>évoluent</b> !</p>`);
  });
  document.getElementById("m-reset").addEventListener("click", () => {
    if (confirm("Effacer la sauvegarde et recommencer ?")) {
      localStorage.removeItem(SAVE_KEY);
      location.reload();
    }
  });
}

document.getElementById("btn-team").addEventListener("click", () => { if (!modalOpen) openTeamModal(); else closeModal(); });
document.getElementById("btn-dex").addEventListener("click", () => { if (!modalOpen) openDexModal(); else closeModal(); });
document.getElementById("btn-bag").addEventListener("click", () => { if (!modalOpen) openBagModal(); else closeModal(); });
document.getElementById("btn-menu").addEventListener("click", () => { if (!modalOpen) openMenuModal(); else closeModal(); });

// ---------- HUD ----------
const hudMonCv = document.getElementById("hudmon");
function updateHud() {
  const lead = G.team[0];
  document.getElementById("hudballs").textContent =
    `Novaballs : ${G.items.ball + G.items.superball}`;
  document.getElementById("hudbadges").textContent =
    Object.keys(BADGES).map(b => G.badges[b] ? BADGES[b].icon : "◌").join(" ");
  const hctx = hudMonCv.getContext("2d");
  hctx.clearRect(0, 0, 52, 52);
  if (lead) {
    document.getElementById("hudname").textContent = `${monName(lead)} Nv.${lead.level}`;
    const bar = document.getElementById("hudhp");
    const p = lead.hp / lead.stats.maxHp;
    bar.style.width = (p * 100) + "%";
    bar.className = p < .25 ? "low" : p < .55 ? "mid" : "";
    pixMon(hctx, SPECIES[lead.sp], 26, 48, 38, { t: 1 }, 2);
  } else {
    document.getElementById("hudname").textContent = "Aucun Novamon";
    document.getElementById("hudhp").style.width = "0%";
  }
}

// ============================================================
//  Sauvegarde
// ============================================================
function saveGame() {
  if (!G.flags.starter && G.team.length === 0 && G.mode === "title") return;
  const data = {
    team: G.team, box: G.box, items: G.items, dex: G.dex, taken: G.taken,
    flags: G.flags, steps: G.steps, muted: G.muted, fx: G.fx,
    badges: G.badges, mapId: G.mapId, lastHeal: G.lastHeal,
    hero: { x: G.hero.x, y: G.hero.y, dir: G.hero.dir }
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) { /* stockage plein */ }
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
    G.team = d.team || []; G.box = d.box || [];
    Object.assign(G.items, d.items || {});
    G.dex = d.dex || { seen: {}, caught: {} };
    G.taken = d.taken || {};
    G.flags = d.flags || {};
    G.badges = d.badges || {};
    G.steps = d.steps || 0;
    G.muted = !!d.muted;
    G.fx = d.fx !== undefined ? !!d.fx : true;
    G.mapId = (d.mapId && MAPS[d.mapId]) ? d.mapId : "kaelis";
    G.lastHeal = d.lastHeal || { map: "kaelis", x: 6, y: 25 };
    if (d.hero) {
      G.hero.x = G.hero.tx = d.hero.x; G.hero.y = G.hero.ty = d.hero.y;
      G.hero.px = d.hero.x; G.hero.py = d.hero.y;
      G.hero.dir = d.hero.dir || "down";
    }
    return true;
  } catch (e) { return false; }
}

// ============================================================
//  Sprites personnalisés (assets/<id>.png) + espèces bonus
// ============================================================
function tryCustomSprite(id) {
  const img = new Image();
  img.onload = () => { SPECIES[id].custom = img; };
  img.onerror = () => {};
  img.src = "assets/" + id + ".png";
}
for (const id of Object.keys(SPECIES)) tryCustomSprite(id);

fetch("assets/extra-species.json")
  .then(r => (r.ok ? r.json() : null))
  .then(list => {
    if (!Array.isArray(list)) return;
    for (const s of list) {
      if (!s.id || SPECIES[s.id]) continue;
      s.draw = s.draw || { shape: "blob", main: "#9a8fd0", belly: "#e8e2ff", accent: "#5a4fa0", feat: [] };
      s.moves = s.moves || [[1, "Charge"]];
      SPECIES[s.id] = s;
      DEX_ORDER.push(s.id);
      if (s.zone) {
        if (ZONES[s.zone]) ZONES[s.zone].table.push([s.id, s.weight || 15]);
        else if (MAPS[s.zone] && MAPS[s.zone].enc) MAPS[s.zone].enc.table.push([s.id, s.weight || 15]);
      }
      tryCustomSprite(s.id);
    }
  })
  .catch(() => {});

// ============================================================
//  Rendu du monde (pré-rendu des cartes + effets HD-2D)
// ============================================================
const RENDER_CACHE = {};

function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 2654435761;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

const GYM_CARPET = { "Plante": "#4e8a3c", "Roche": "#8a6f4e", "Eau": "#3c6f9e" };

function getRender(mapId) {
  if (RENDER_CACHE[mapId]) return RENDER_CACHE[mapId];
  const map = MAPS[mapId];
  const c = document.createElement("canvas");
  c.width = map.w * TILE; c.height = map.h * TILE;
  const m = c.getContext("2d");
  const R = { canvas: c, water: [], tufts: [], lamps: [], fountains: [], flowers: [] };
  const interior = map.theme === "interior";

  // --- passe 1 : sols ---
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const t = map.grid[y][x], px = x * TILE, py = y * TILE;
      const h = hash2(x, y);
      if (interior) {
        // parquet
        m.fillStyle = `hsl(28, 32%, ${30 + (y % 2) * 3 + h * 3}%)`;
        m.fillRect(px, py, TILE, TILE);
        m.strokeStyle = "rgba(0,0,0,.25)"; m.lineWidth = 1;
        m.strokeRect(px + .5, py + .5, TILE, TILE);
      } else {
        m.fillStyle = `hsl(${104 + h * 10}, 42%, ${38 + h * 7}%)`;
        m.fillRect(px, py, TILE, TILE);
        if (h > .6) {
          m.fillStyle = "rgba(255,255,255,.05)";
          m.fillRect(px + h * 20, py + h * 14, 3, 3);
        }
      }
      if (t === "p") {
        m.fillStyle = `hsl(38, 40%, ${58 + h * 6}%)`;
        m.fillRect(px, py, TILE, TILE);
        m.fillStyle = "rgba(120,90,40,.25)";
        for (let i = 0; i < 3; i++) m.fillRect(px + ((h * 91 + i * 37) % 26), py + ((h * 53 + i * 17) % 26), 3, 2);
      } else if (t === "s") {
        m.fillStyle = `hsl(46, 52%, ${68 + h * 6}%)`;
        m.fillRect(px, py, TILE, TILE);
        m.fillStyle = "rgba(160,130,60,.3)";
        m.fillRect(px + h * 22, py + h * 16, 3, 3);
      } else if (t === "w") {
        m.fillStyle = `hsl(210, 55%, ${interior ? 45 : 40 + h * 5}%)`;
        m.fillRect(px, py, TILE, TILE);
        R.water.push([x, y]);
      } else if (t === "b") {
        m.fillStyle = "hsl(210, 55%, 42%)";
        m.fillRect(px, py, TILE, TILE);
        m.fillStyle = "#a0703c";
        m.fillRect(px + 2, py, TILE - 4, TILE);
        m.strokeStyle = "#6e4a22";
        for (let i = 0; i < 4; i++) { m.beginPath(); m.moveTo(px + 2, py + i * 8 + 4); m.lineTo(px + TILE - 2, py + i * 8 + 4); m.stroke(); }
      } else if (t === "c") {
        const cc = GYM_CARPET[map.gymType] || "#7a4e8a";
        m.fillStyle = cc;
        m.fillRect(px, py, TILE, TILE);
        m.fillStyle = "rgba(255,255,255,.08)";
        if ((x + y) % 2 === 0) m.fillRect(px, py, TILE, TILE);
      } else if (t === "D" && interior) {
        m.fillStyle = "#8a6a48";
        m.fillRect(px, py, TILE, TILE);
      }
    }
  }
  // bord lumineux de l'eau
  for (const [x, y] of R.water) {
    const px = x * TILE, py = y * TILE;
    if (tileOf(map, x, y - 1) !== "w") { m.fillStyle = "rgba(255,255,255,.35)"; m.fillRect(px, py, TILE, 3); }
  }

  // ombre portée du soleil (direction sud-ouest) pour arbres/maisons
  function castShadow(px, py, rx, ry) {
    if (interior) return;
    m.save();
    m.fillStyle = "rgba(25,35,25,.25)";
    m.beginPath();
    m.ellipse(px - 8, py + 3, rx, ry, .3, 0, Math.PI * 2);
    m.fill();
    m.restore();
  }

  // --- passe 2 : décors ---
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const t = map.grid[y][x], px = x * TILE + TILE / 2, py = y * TILE + TILE;
      const h = hash2(x, y);
      if (t === ",") {
        for (let i = 0; i < 3; i++) {
          const fx = x * TILE + 5 + ((h * 97 + i * 41) % 22), fy = y * TILE + 6 + ((h * 61 + i * 29) % 20);
          m.fillStyle = ["#ffd9ec", "#fff3b0", "#ffffff"][i % 3];
          m.beginPath(); m.arc(fx, fy, 2.6, 0, Math.PI * 2); m.fill();
          m.fillStyle = "#e8a838";
          m.beginPath(); m.arc(fx, fy, 1, 0, Math.PI * 2); m.fill();
        }
        R.flowers.push([x, y]);
      } else if (t === ";") {
        R.tufts.push([x, y]);
      } else if (t === "r") {
        castShadow(px, py - 8, 14, 6);
        const g = m.createRadialGradient(px - 5, py - 18, 3, px, py - 10, 16);
        g.addColorStop(0, "#b8aca0"); g.addColorStop(1, "#6e6258");
        m.fillStyle = g;
        m.beginPath(); m.ellipse(px, py - 10, 13, 10, 0, 0, Math.PI * 2); m.fill();
        m.strokeStyle = "#4a4038"; m.lineWidth = 2; m.stroke();
        m.fillStyle = "rgba(255,255,255,.25)";
        m.beginPath(); m.ellipse(px - 4, py - 15, 4, 2.5, -.4, 0, Math.PI * 2); m.fill();
      } else if (t === "T") {
        castShadow(px, py - 6, 17, 7);
        m.fillStyle = "#7a5230";
        m.fillRect(px - 4, py - 14, 8, 14);
        const g = m.createRadialGradient(px - 5, py - 34, 4, px, py - 28, 20);
        g.addColorStop(0, "#6fae4e"); g.addColorStop(1, "#2f6130");
        m.fillStyle = g;
        m.beginPath();
        m.arc(px - 8, py - 24, 11, 0, Math.PI * 2);
        m.arc(px + 8, py - 24, 11, 0, Math.PI * 2);
        m.arc(px, py - 34, 12, 0, Math.PI * 2);
        m.fill();
        m.fillStyle = "rgba(255,255,255,.14)";
        m.beginPath(); m.arc(px - 6, py - 36, 5, 0, Math.PI * 2); m.fill();
      } else if (t === "#") {
        m.fillStyle = `hsl(220, 12%, ${24 + h * 4}%)`;
        m.fillRect(x * TILE, y * TILE, TILE, TILE);
        m.strokeStyle = "rgba(0,0,0,.4)"; m.lineWidth = 2;
        m.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
        m.fillStyle = "rgba(255,255,255,.06)";
        m.fillRect(x * TILE, y * TILE, TILE, 4);
      } else if (t === "%") {
        m.fillStyle = "#a0623c"; m.strokeStyle = "#6e3f22"; m.lineWidth = 2;
        m.beginPath(); m.moveTo(px - 9, py - 14); m.lineTo(px + 9, py - 14); m.lineTo(px + 6, py - 2); m.lineTo(px - 6, py - 2); m.closePath();
        m.fill(); m.stroke();
        m.fillStyle = "#4d9e3a";
        for (const [lx, ly, lr] of [[-6, -20, 6], [0, -25, 7], [6, -19, 6]]) {
          m.beginPath(); m.ellipse(px + lx, py + ly, lr, lr * 1.3, lx * .05, 0, Math.PI * 2); m.fill();
        }
      } else if (t === "!") {
        castShadow(px, py - 4, 8, 4);
        m.strokeStyle = "#3a4048"; m.lineWidth = 4; m.lineCap = "round";
        m.beginPath(); m.moveTo(px, py - 2); m.lineTo(px, py - 40); m.stroke();
        m.fillStyle = "#2c3138";
        m.beginPath(); m.arc(px, py - 44, 7, 0, Math.PI * 2); m.fill();
        m.fillStyle = "#ffd98a";
        m.beginPath(); m.arc(px, py - 44, 4.5, 0, Math.PI * 2); m.fill();
        R.lamps.push([px, py - 44]);
      } else if (t === "F") {
        m.fillStyle = "#9aa4ae"; m.strokeStyle = "#5f6870"; m.lineWidth = 2.4;
        m.beginPath(); m.ellipse(px, py - 10, 15, 11, 0, 0, Math.PI * 2); m.fill(); m.stroke();
        m.fillStyle = "#4a90e2";
        m.beginPath(); m.ellipse(px, py - 10, 11, 7.5, 0, 0, Math.PI * 2); m.fill();
        m.fillStyle = "#9aa4ae";
        m.beginPath(); m.arc(px, py - 16, 4, 0, Math.PI * 2); m.fill(); m.stroke();
        R.fountains.push([px, py - 12]);
      } else if (t === "h" || t === "H" || t === "L" || t === "G" || (t === "D" && !interior)) {
        const isGym = (t === "G" || (t === "D" && !interior));
        const wall = t === "h" ? "#e0c9a0" : isGym ? "#d8dce4" : "#f0e8dc";
        const roof = t === "H" ? "#e87a9c" : t === "L" ? "#4a8ee0" : isGym ? "#c4a03c" : "#c05a3c";
        castShadow(px, py - 4, 18, 6);
        m.fillStyle = wall;
        m.fillRect(px - 15, py - 20, 30, 20);
        m.strokeStyle = "#8a7050"; m.lineWidth = 2;
        m.strokeRect(px - 15, py - 20, 30, 20);
        if (t === "D") { // porte de l'arène
          m.fillStyle = "#5a4a6e";
          m.beginPath(); m.moveTo(px - 7, py); m.lineTo(px - 7, py - 14); m.arc(px, py - 14, 7, Math.PI, 0); m.lineTo(px + 7, py); m.closePath(); m.fill();
          m.fillStyle = "#ffd98a";
          m.beginPath(); m.arc(px, py - 24, 4, 0, Math.PI * 2); m.fill();
        } else if (t !== "G") {
          m.fillStyle = "#6e4a2a";
          m.fillRect(px - 5, py - 12, 10, 12);
        } else {
          // fenêtre d'arène
          m.fillStyle = "#8fb8d8";
          m.fillRect(px - 8, py - 15, 16, 8);
        }
        m.fillStyle = roof;
        m.beginPath();
        m.moveTo(px - 19, py - 20); m.lineTo(px, py - 36); m.lineTo(px + 19, py - 20);
        m.closePath(); m.fill();
        m.strokeStyle = shade(roof, .6); m.stroke();
        if (t === "H") {
          m.fillStyle = "#fff";
          m.fillRect(px - 2, py - 32, 4, 10);
          m.fillRect(px - 5, py - 29, 10, 4);
        }
        if (t === "L") {
          m.strokeStyle = "#555"; m.lineWidth = 2;
          m.beginPath(); m.moveTo(px + 10, py - 30); m.lineTo(px + 10, py - 42); m.stroke();
          m.fillStyle = "#e84a4a";
          m.beginPath(); m.arc(px + 10, py - 43, 3, 0, Math.PI * 2); m.fill();
        }
        R.lamps.push([px, py - 14, .35]); // fenêtres faiblement lumineuses la nuit
      }
    }
  }
  RENDER_CACHE[mapId] = R;
  return R;
}

// ---------- Particules d'ambiance (lucioles, poussière) ----------
let ambient = [];
function buildAmbient() {
  ambient = [];
  const R = getRender(G.mapId);
  const spots = R.flowers.length ? R.flowers : R.tufts;
  const n = Math.min(36, spots.length * 3);
  for (let i = 0; i < n; i++) {
    const [tx, ty] = spots[Math.floor(Math.random() * spots.length)];
    ambient.push({
      x: tx * TILE + Math.random() * TILE,
      y: ty * TILE + Math.random() * TILE,
      ph: Math.random() * Math.PI * 2,
      r: 1.2 + Math.random() * 1.6
    });
  }
}

function dayFactor() { return (Math.sin(time * .008) + 1) / 2; } // 1 = plein jour

function renderWorld() {
  const map = CM();
  const R = getRender(G.mapId);
  const h = G.hero;
  const mapPW = map.w * TILE * ZOOM, mapPH = map.h * TILE * ZOOM;
  let camX = h.px * TILE * ZOOM + TILE * ZOOM / 2 - W / 2;
  let camY = h.py * TILE * ZOOM + TILE * ZOOM / 2 - H / 2;
  camX = Math.max(0, Math.min(mapPW - W, camX));
  camY = Math.max(0, Math.min(mapPH - H, camY));
  if (mapPW < W) camX = (mapPW - W) / 2;
  if (mapPH < H) camY = (mapPH - H) / 2;

  const day = map.theme === "interior" ? .85 : dayFactor();
  const night = 1 - day;

  const w = wctx;
  w.save();
  w.setTransform(1, 0, 0, 1, 0, 0);
  if (shake > 0) w.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
  w.imageSmoothingEnabled = false;
  w.fillStyle = map.theme === "interior" ? "#14100c" : "#1a2e1c";
  w.fillRect(0, 0, W, H);
  w.translate(-camX, -camY);
  w.scale(ZOOM, ZOOM);
  w.drawImage(R.canvas, 0, 0);

  // eau animée
  w.fillStyle = "rgba(255,255,255,.22)";
  for (const [x, y] of R.water) {
    const ph = (time * 1.2 + hash2(x, y) * 6.28);
    const yy = y * TILE + 10 + Math.sin(ph) * 5;
    w.fillRect(x * TILE + 5 + Math.cos(ph * .7) * 4, yy, 9, 2);
  }
  // fontaines
  for (const [fx, fy] of R.fountains) {
    w.fillStyle = "rgba(255,255,255,.5)";
    for (let i = 0; i < 5; i++) {
      const ph = time * 3 + i * 1.3;
      const dx = Math.sin(ph) * 6, dy = -Math.abs(Math.cos(ph)) * 9;
      w.beginPath(); w.arc(fx + dx, fy + dy - 4, 1.4, 0, Math.PI * 2); w.fill();
    }
  }

  // hautes herbes (animées)
  for (const [x, y] of R.tufts) {
    const hh = hash2(x, y);
    const sway = Math.sin(time * 2 + hh * 6.28) * 1.6;
    w.fillStyle = `hsl(${112 + hh * 12}, 48%, ${26 + hh * 6}%)`;
    for (let i = 0; i < 3; i++) {
      const bx = x * TILE + 4 + i * 10, by = y * TILE + TILE;
      w.beginPath();
      w.moveTo(bx, by);
      w.quadraticCurveTo(bx + 3 + sway, by - 12, bx + 5 + sway * 1.6, by - 18);
      w.quadraticCurveTo(bx + 8 + sway, by - 10, bx + 10, by);
      w.closePath();
      w.fill();
    }
  }

  // objets au sol (scintillement)
  for (const p of (map.pickups || [])) {
    if (G.taken[p.id]) continue;
    const cx = p.x * TILE + TILE / 2, cy = p.y * TILE + TILE / 2;
    const tw = (Math.sin(time * 4 + p.x) + 1) / 2;
    drawBall(w, cx, cy + 2, 6, p.item.includes("super") ? "superball" : "ball");
    w.globalAlpha = .5 + tw * .5;
    w.fillStyle = "#fff8c0";
    for (const [sx, sy] of [[-9, -8], [8, -10], [0, -13]]) {
      w.beginPath();
      w.arc(cx + sx, cy + sy, 1.6 + tw, 0, Math.PI * 2);
      w.fill();
    }
    w.globalAlpha = 1;
  }

  // PNJ + héros triés par y — sprites pixel-art
  const actors = (map.npcs || []).map(n => ({
    y: n.y,
    draw: () => pixNpc(w, n, n.x * TILE + TILE / 2, n.y * TILE + TILE, 44, time, 2)
  }));
  actors.push({
    y: h.py,
    draw: () => pixHero(w, h.px * TILE + TILE / 2, h.py * TILE + TILE, 46, h.dir, h.moving ? h.phase : 0, time, 2)
  });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  // touffe d'herbe devant le héros s'il est dedans
  const ht = tileAt(Math.round(h.px), Math.round(h.py));
  if (ht === ";") {
    const x = Math.round(h.px), y = Math.round(h.py);
    w.fillStyle = "hsl(114, 48%, 27%)";
    for (let i = 0; i < 4; i++) {
      const bx = x * TILE + 2 + i * 8, by = y * TILE + TILE;
      w.beginPath();
      w.moveTo(bx, by);
      w.quadraticCurveTo(bx + 4, by - 10, bx + 5, by - 13);
      w.quadraticCurveTo(bx + 7, by - 8, bx + 9, by);
      w.closePath();
      w.fill();
    }
  }

  // lucioles / pollen lumineux (additif)
  w.globalCompositeOperation = "lighter";
  for (const f of ambient) {
    const tw = (Math.sin(time * 2 + f.ph) + 1) / 2;
    const a = (.12 + .3 * tw) * (.45 + .55 * night);
    const fx = f.x + Math.sin(time * .8 + f.ph) * 6;
    const fy = f.y + Math.cos(time * .6 + f.ph * 2) * 5 - tw * 4;
    const g = w.createRadialGradient(fx, fy, 0, fx, fy, f.r * 4);
    g.addColorStop(0, `rgba(255,235,150,${a})`);
    g.addColorStop(1, "rgba(255,235,150,0)");
    w.fillStyle = g;
    w.beginPath(); w.arc(fx, fy, f.r * 4, 0, Math.PI * 2); w.fill();
  }
  // halos des lampadaires et fenêtres (plus forts la nuit)
  for (const [lx, ly, base] of R.lamps.map(l => [l[0], l[1], l[2] || 1])) {
    const a = base * (.12 + .5 * night);
    if (a < .03) continue;
    const rr = 46 * base + Math.sin(time * 6 + lx) * 2;
    const g = w.createRadialGradient(lx, ly, 2, lx, ly, rr);
    g.addColorStop(0, `rgba(255,200,110,${a})`);
    g.addColorStop(1, "rgba(255,200,110,0)");
    w.fillStyle = g;
    w.beginPath(); w.arc(lx, ly, rr, 0, Math.PI * 2); w.fill();
  }
  w.globalCompositeOperation = "source-over";
  w.restore();

  // ---------- Composition finale ----------
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(worldBuf, 0, 0);

  if (G.fx) {
    // Profondeur de champ "tilt-shift" : flou par sous-échantillonnage,
    // masqué en haut et en bas de l'écran
    sctx2.imageSmoothingEnabled = true;
    sctx2.clearRect(0, 0, smallBuf.width, smallBuf.height);
    sctx2.drawImage(worldBuf, 0, 0, smallBuf.width, smallBuf.height);
    bctx.clearRect(0, 0, W, H);
    bctx.imageSmoothingEnabled = true;
    bctx.drawImage(smallBuf, 0, 0, smallBuf.width, smallBuf.height, 0, 0, W, H);
    bctx.globalCompositeOperation = "destination-in";
    const mg = bctx.createLinearGradient(0, 0, 0, H);
    mg.addColorStop(0, "rgba(0,0,0,.85)");
    mg.addColorStop(.32, "rgba(0,0,0,0)");
    mg.addColorStop(.68, "rgba(0,0,0,0)");
    mg.addColorStop(1, "rgba(0,0,0,.85)");
    bctx.fillStyle = mg;
    bctx.fillRect(0, 0, W, H);
    bctx.globalCompositeOperation = "source-over";
    ctx.drawImage(blurBuf, 0, 0);

    // Étalonnage cinématique : centre chaud, bords froids
    ctx.globalCompositeOperation = "soft-light";
    const cg = ctx.createRadialGradient(W / 2, H * .42, H * .1, W / 2, H / 2, Math.max(W, H) * .75);
    cg.addColorStop(0, "rgba(255,214,150,.55)");
    cg.addColorStop(1, "rgba(40,60,120,.5)");
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";

    // rayons de soleil obliques (jour, extérieur)
    if (map.theme !== "interior" && day > .45) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (let i = 0; i < 3; i++) {
        const rx = W * (.15 + i * .3) + Math.sin(time * .3 + i) * 30;
        const grad = ctx.createLinearGradient(rx, 0, rx - W * .18, H);
        const al = .05 * (day - .45) / .55;
        grad.addColorStop(0, `rgba(255,240,200,${al * 1.6})`);
        grad.addColorStop(1, "rgba(255,240,200,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(rx - 30, -10); ctx.lineTo(rx + 60, -10);
        ctx.lineTo(rx - W * .12, H); ctx.lineTo(rx - W * .2, H);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  // lumière douce + vignette + cycle jour/nuit (toujours actifs)
  const lg = ctx.createRadialGradient(W / 2, H * .35, H * .1, W / 2, H / 2, Math.max(W, H) * .75);
  lg.addColorStop(0, "rgba(255,250,220,.08)");
  lg.addColorStop(.6, "rgba(0,0,0,0)");
  lg.addColorStop(1, "rgba(10,15,30,.42)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, W, H);
  if (map.theme !== "interior") {
    ctx.fillStyle = `rgba(20,30,80,${night * .22})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = `rgba(255,160,60,${Math.max(0, (day - .7)) * .18})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ============================================================
//  Rendu du combat (arrière-plan adouci + sprites pixel nets)
// ============================================================
const BATTLE_BG = {
  "Plaine de Kaelis":        { sky: ["#8fd0f0", "#d8f0c8"], ground: "#8cc571", plat: "#6fae56" },
  "Crêtes Rocheuses":        { sky: ["#c9b8a8", "#e8d8c0"], ground: "#a89478", plat: "#8a7860" },
  "Forêt Murmurante":        { sky: ["#4a7a58", "#8fb87a"], ground: "#5a8a4a", plat: "#3f6b38" },
  "Lac Azuré":               { sky: ["#7ab8e8", "#c8e8f8"], ground: "#e0cf98", plat: "#c4ae78" },
  "Route 1":                 { sky: ["#8fd0f0", "#e8f0c8"], ground: "#8cc571", plat: "#6fae56" },
  "Route 2 — Forêt Sombre":  { sky: ["#31543c", "#6b9560"], ground: "#4a7440", plat: "#335530" },
  "Route 3 — Prés du Lac":   { sky: ["#88c8f0", "#e8f0d0"], ground: "#96c47c", plat: "#78a860" },
  "Cité Azur — Plage":       { sky: ["#78c0f0", "#d8f0f8"], ground: "#e8d8a0", plat: "#c9b478" },
  "Arène de Verdicité":      { sky: ["#2c4a2c", "#5a8a4e"], ground: "#6ea055", plat: "#4e8a3c", interior: true },
  "Arène de Rocheville":     { sky: ["#4a4038", "#8a7458"], ground: "#a08a6e", plat: "#8a6f4e", interior: true },
  "Arène de la Cité Azur":   { sky: ["#1f3a5f", "#3a6f9e"], ground: "#5f9ec4", plat: "#3c6f9e", interior: true }
};

function renderBattle() {
  const bg = BATTLE_BG[B.zone.label] || BATTLE_BG["Plaine de Kaelis"];

  // --- arrière-plan dans le tampon, puis adouci ---
  const w = wctx;
  w.setTransform(1, 0, 0, 1, 0, 0);
  const g = w.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, bg.sky[0]); g.addColorStop(1, bg.sky[1]);
  w.fillStyle = g;
  w.fillRect(0, 0, W, H);
  const sg = w.createRadialGradient(W * .8, H * .12, 10, W * .8, H * .12, 260);
  sg.addColorStop(0, bg.interior ? "rgba(255,230,170,.5)" : "rgba(255,250,220,.75)");
  sg.addColorStop(1, "rgba(255,250,220,0)");
  w.fillStyle = sg;
  w.fillRect(0, 0, W, H);
  w.fillStyle = bg.ground;
  w.beginPath();
  w.ellipse(W / 2, H * 1.06, W * .8, H * .5, 0, Math.PI, Math.PI * 2);
  w.fill();
  // silhouettes lointaines (relief adouci)
  w.fillStyle = "rgba(30,50,40,.18)";
  for (let i = 0; i < 4; i++) {
    const bx = W * (.1 + i * .26), br = 90 + (i % 2) * 50;
    w.beginPath(); w.arc(bx, H * .34, br, Math.PI, Math.PI * 2); w.fill();
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.fx) {
    // fond légèrement flou (bokeh doux) : sous-échantillonnage
    sctx2.imageSmoothingEnabled = true;
    sctx2.clearRect(0, 0, smallBuf.width, smallBuf.height);
    sctx2.drawImage(worldBuf, 0, 0, smallBuf.width, smallBuf.height);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(smallBuf, 0, 0, smallBuf.width, smallBuf.height, 0, 0, W, H);
  } else {
    ctx.drawImage(worldBuf, 0, 0);
  }

  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);

  // plateformes nettes
  ctx.fillStyle = bg.plat;
  ctx.beginPath(); ctx.ellipse(W * .72, H * .45, 150, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W * .3, H * .66, 180, 42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.15)";
  ctx.beginPath(); ctx.ellipse(W * .72, H * .44, 130, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(W * .3, H * .65, 158, 33, 0, 0, Math.PI * 2); ctx.fill();

  // ennemi (sprite pixel-art)
  const e = B.enemy, eA = B.eAnim;
  if (eA.alpha > 0 && eA.scale > 0) {
    ctx.save();
    ctx.globalAlpha = eA.alpha;
    const esz = 150 * eA.scale;
    pixMon(ctx, SPECIES[e.sp], W * .72 + eA.dx, H * .45 + eA.dy, esz, { t: time }, 3);
    if (eA.flash > 0) {
      ctx.globalAlpha = eA.flash * .7;
      ctx.globalCompositeOperation = "lighter";
      pixMon(ctx, SPECIES[e.sp], W * .72 + eA.dx, H * .45 + eA.dy, esz, { t: time, shadow: false }, 3);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
  }
  // allié
  const a = mine(), aA = B.aAnim;
  if (a) {
    ctx.save();
    ctx.globalAlpha = aA.alpha;
    pixMon(ctx, SPECIES[a.sp], W * .3 - aA.dx, H * .66 + aA.dy, 195 * aA.scale, { t: time, mirror: true }, 3);
    if (aA.flash > 0) {
      ctx.globalAlpha = aA.flash * .7;
      ctx.globalCompositeOperation = "lighter";
      pixMon(ctx, SPECIES[a.sp], W * .3 - aA.dx, H * .66 + aA.dy, 195 * aA.scale, { t: time, mirror: true, shadow: false }, 3);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
  }
  if (B.ball && B.ball.vis) drawBall(ctx, B.ball.x, B.ball.y, B.ball.r, "ball", B.ball.rot);

  // particules
  for (let i = B.particles.length - 1; i >= 0; i--) {
    const p = B.particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += .12; p.life -= .025;
    if (p.life <= 0) { B.particles.splice(i, 1); continue; }
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  if (G.fx) {
    // rais de lumière + étalonnage
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 2; i++) {
      const rx = W * (.6 + i * .25) + Math.sin(time * .4 + i * 2) * 24;
      const grad = ctx.createLinearGradient(rx, 0, rx - W * .2, H);
      grad.addColorStop(0, "rgba(255,240,200,.10)");
      grad.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(rx - 40, -10); ctx.lineTo(rx + 50, -10);
      ctx.lineTo(rx - W * .14, H); ctx.lineTo(rx - W * .22, H);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation = "soft-light";
    const cg = ctx.createRadialGradient(W / 2, H * .45, H * .1, W / 2, H / 2, Math.max(W, H) * .8);
    cg.addColorStop(0, "rgba(255,214,150,.5)");
    cg.addColorStop(1, "rgba(40,60,120,.45)");
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }

  const vg = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, Math.max(W, H) * .75);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(10,10,25,.38)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

// ---------- Écran titre (fond animé) ----------
function renderTitle() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#1c2e52"); g.addColorStop(.6, "#3f6288"); g.addColorStop(1, "#6f9a76");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 40; i++) {
    const sx = (hash2(i, 7) * W), sy = hash2(i, 13) * H * .5;
    ctx.globalAlpha = .3 + Math.sin(time * 2 + i) * .25;
    ctx.fillStyle = "#fff";
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#4a7a52";
  ctx.beginPath(); ctx.ellipse(W / 2, H * 1.1, W * .9, H * .38, 0, Math.PI, Math.PI * 2); ctx.fill();
  const parade = ["flamizar", "aquano", "feuillune", "rongelec", "pioupiou", "lucioline"];
  parade.forEach((id, i) => {
    const px = ((time * 40 + i * (W + 200) / parade.length) % (W + 200)) - 100;
    pixMon(ctx, SPECIES[id], px, H * .88, 70, { t: time + i }, 3);
  });
  if (G.fx) {
    ctx.globalCompositeOperation = "soft-light";
    const cg = ctx.createRadialGradient(W / 2, H * .4, H * .1, W / 2, H / 2, Math.max(W, H) * .8);
    cg.addColorStop(0, "rgba(255,214,150,.5)");
    cg.addColorStop(1, "rgba(40,60,120,.5)");
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";
  }
}

// ============================================================
//  Boucle principale
// ============================================================
function frame(now) {
  const dt = Math.min(.05, (now - lastT) / 1000 || .016);
  lastT = now;
  time += dt;
  if (shake > 0) shake = Math.max(0, shake - dt * 40);
  updateTweens(now);

  if (G.mode === "title") renderTitle();
  else if (G.mode === "world") { updateWorld(dt); renderWorld(); }
  else if (G.mode === "battle" && B) renderBattle();

  // fondu de transition entre cartes
  if (G.fade > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(6,8,14,${G.fade})`;
    ctx.fillRect(0, 0, W, H);
  }

  requestAnimationFrame(frame);
}

// ---------- Démarrage ----------
const titleEl = document.getElementById("title");
if (localStorage.getItem(SAVE_KEY)) document.getElementById("btn-continue").style.display = "inline-block";

document.getElementById("btn-new").addEventListener("click", () => {
  localStorage.removeItem(SAVE_KEY);
  titleEl.style.display = "none";
  G.mode = "world";
  setupMap();
  banner(CM().label);
  SFX.confirm();
  updateHud();
  (async () => {
    await say("Bienvenue à Kaelis ! La Professeure Aralia t'attend devant son laboratoire (la maison au toit bleu, à droite).", "");
    await say("Approche-toi d'elle et appuie sur E pour lui parler.", "");
    hideDialog();
  })();
});
document.getElementById("btn-continue").addEventListener("click", () => {
  loadGame();
  titleEl.style.display = "none";
  G.mode = "world";
  setupMap();
  banner(CM().label);
  SFX.confirm();
  updateHud();
  toast("Partie chargée ✓");
});

setupMap();
updateHud();
requestAnimationFrame(frame);
