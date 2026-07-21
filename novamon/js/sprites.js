// ============================================================
//  NOVAMON — Rendu procédural des créatures, du héros et décors
//  Style "2D-HD" : formes vectorielles, dégradés, contours doux,
//  lumière de bord et animations d'inactivité.
// ============================================================
"use strict";

// ============================================================
//  Assets images (packs CC0 — voir assets/README.md).
//  Chaque image est optionnelle : si elle manque, le jeu retombe
//  sur le rendu par code ci-dessous.
// ============================================================
let ART_V = 0;            // incrémenté à chaque image chargée (invalide les caches)
function loadArt(path) {
  const img = new Image();
  img.ready = false;
  img.onload = () => { img.ready = true; ART_V++; };
  img.onerror = () => {};
  // data URI embarquée si disponible (pas de « tainted canvas » en file://),
  // sinon le fichier de assets/
  img.src = (typeof ASSET_DATA !== "undefined" && ASSET_DATA[path]) || ("assets/" + path);
  return img;
}
const artOk = img => !!(img && img.ready && img.naturalWidth > 0);

const ART = {
  tiles: {},
  obj: {},
  hero: { down: [], up: [], left: [], right: [] },
  npc: {}
};
for (const n of ["grass0", "grass1", "flowers", "flowers2", "sprout", "path0", "path1",
  "sand0", "sand1", "water0", "water1", "plank", "plank1",
  "carpet_Plante", "carpet_Roche", "carpet_Eau", "wallstone", "doormat"]) {
  ART.tiles[n] = loadArt("tiles/" + n + ".png");
}
for (const n of ["tree0", "tree1", "tree2", "tree3", "bush0", "bush1", "rock", "sign",
  "lamp", "pot", "house", "heal", "lab", "gym", "gymdoor"]) {
  ART.obj[n] = loadArt("obj/" + n + ".png");
}
for (const d of ["down", "up", "left", "right"]) {
  for (let i = 0; i < 3; i++) ART.hero[d].push(loadArt(`chars/hero_${d}_${i}.png`));
}
for (const n of ["prof", "villager", "villager2", "trainer", "trainer2", "leader", "wizard"]) {
  ART.npc[n] = loadArt("chars/npc_" + n + ".png");
}

// Variantes teintées (chefs d'arène : couleur de robe)
const TINT_CACHE = {};
function tintedSprite(img, color, strength = .45) {
  const key = img.src + "|" + color;
  if (TINT_CACHE[key]) return TINT_CACHE[key];
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext("2d");
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.globalAlpha = strength;
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  TINT_CACHE[key] = c;
  return c;
}

// Petits utilitaires couleur
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r * f)));
  g = Math.max(0, Math.min(255, Math.round(g * f)));
  b = Math.max(0, Math.min(255, Math.round(b * f)));
  return `rgb(${r},${g},${b})`;
}

// Ellipse remplie + contour, avec dégradé sphérique
function orb(ctx, x, y, rx, ry, color, outline, lit = true) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (lit) {
    const g = ctx.createRadialGradient(x - rx * .35, y - ry * .45, Math.min(rx, ry) * .15, x, y, Math.max(rx, ry) * 1.15);
    g.addColorStop(0, shade(color, 1.25));
    g.addColorStop(.55, color);
    g.addColorStop(1, shade(color, .72));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = color;
  }
  ctx.fill();
  if (outline) {
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
}

function monEye(ctx, x, y, r, accent, closed) {
  if (closed) {
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(x, y, r * .8, Math.PI * .15, Math.PI * .85);
    ctx.stroke();
    return;
  }
  orb(ctx, x, y, r, r * 1.15, "#ffffff", "#333", false);
  orb(ctx, x - r * .12, y + r * .1, r * .55, r * .68, accent, null, false);
  orb(ctx, x - r * .12, y + r * .1, r * .3, r * .38, "#1a1a1a", null, false);
  orb(ctx, x - r * .3, y - r * .25, r * .18, r * .2, "#ffffff", null, false);
}

// --- Dessin principal d'un Novamon -------------------------------------
// (cx, cy) = centre au sol ; size = hauteur approximative en pixels
// opts : { t: temps, mirror: bool, alpha, shadow (défaut true), squash }
function drawMon(ctx, sp, cx, cy, size, opts = {}) {
  const d = sp.draw;
  const t = opts.t || 0;
  const scaleMod = (d.big || 1) * (d.small || 1);
  const s = (size / 100) * scaleMod;
  const bob = Math.sin(t * 2.4 + (sp.id.length || 0)) * 2.2;
  const floats = (d.shape === "ghost" || d.shape === "fish" || (d.feat || []).includes("wingsFairy"));
  const lift = floats ? 14 + bob * 1.6 : Math.max(0, bob * .5);

  ctx.save();
  ctx.globalAlpha = opts.alpha !== undefined ? opts.alpha : 1;

  // Ombre au sol
  if (opts.shadow !== false) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 34 * s * (floats ? .8 : 1), 9 * s, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,30,25,0.28)";
    ctx.fill();
  }

  // Sprite personnalisé (assets/<id>.png) : priorité si présent
  if (sp.custom && sp.custom.complete && sp.custom.naturalWidth > 0) {
    const img = sp.custom;
    const h = size * scaleMod, w = h * (img.naturalWidth / img.naturalHeight);
    ctx.save();
    ctx.translate(cx, cy - lift * s);
    if (opts.mirror) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, -w / 2, -h, w, h);
    ctx.restore();
    ctx.restore();
    return;
  }

  ctx.translate(cx, cy - lift * s);
  if (opts.mirror) ctx.scale(-1, 1);
  ctx.scale(s, s * (opts.squash || 1));

  const M = d.main, B = d.belly, A = d.accent;
  const OUT = shade(M, .45);
  const feat = d.feat || [];
  const has = f => feat.includes(f);

  // ---- Aura (derrière tout) ----
  if (has("aura")) {
    const g = ctx.createRadialGradient(0, -45, 6, 0, -45, 62 + Math.sin(t * 3) * 5);
    g.addColorStop(0, shade(M, 1.4).replace("rgb", "rgba").replace(")", ",0.5)"));
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -45, 70, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Ailes (derrière le corps) ----
  if (has("wings")) {
    const flap = Math.sin(t * 5) * 8;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(side * 14, -42);
      ctx.rotate(side * (-.12 - flap * .015));
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * 26, -20 - flap, side * 48, -14);
      ctx.quadraticCurveTo(side * 44, -2, side * 30, 2);
      ctx.quadraticCurveTo(side * 14, 6, 0, 0);
      ctx.fillStyle = shade(A, 1.1);
      ctx.fill();
      ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();
      // membrure
      ctx.strokeStyle = shade(A, .8); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(side * 8, -2); ctx.quadraticCurveTo(side * 26, -12 - flap * .5, side * 42, -10); ctx.stroke();
      ctx.restore();
    }
  }
  if (has("wingsFairy")) {
    for (const side of [-1, 1]) {
      const flap = Math.sin(t * 9 + side) * .25;
      ctx.save();
      ctx.translate(side * 14, -48);
      ctx.rotate(side * (-.4 + flap));
      ctx.globalAlpha *= .6;
      orb(ctx, side * 16, -12, 16, 24, "#dff6ff", "rgba(150,190,220,.8)");
      orb(ctx, side * 20, 6, 10, 13, "#dff6ff", "rgba(150,190,220,.8)");
      ctx.restore();
    }
  }

  // ---- Corps selon la forme ----
  const shape = d.shape;
  if (shape === "blob") {
    if (has("tailBolt")) drawBolt(ctx, 26, -30, A, OUT, t);
    orb(ctx, 0, -34, 38, 34, M, OUT);
    orb(ctx, 0, -26, 26, 20, B, null);
    if (has("rocky")) {
      for (const [rx, ry, rr] of [[-18, -58, 9], [4, -64, 11], [22, -54, 8]]) {
        orb(ctx, rx, ry, rr, rr * .8, shade(M, .85), OUT);
      }
    }
    monEye(ctx, -14, -42, 7, A);
    monEye(ctx, 12, -42, 7, A);
    mouthSmile(ctx, -1, -28, 8);
    if (has("earsRound")) { orb(ctx, -24, -64, 10, 12, M, OUT); orb(ctx, 22, -64, 10, 12, M, OUT); }
    if (has("finHead")) fin(ctx, 0, -68, 14, 20, A, OUT);
    if (has("crest")) { fin(ctx, -16, -62, 9, 14, A, OUT); fin(ctx, 16, -62, 9, 14, A, OUT); }
    if (has("antennae")) {
      for (const sd of [-1, 1]) {
        ctx.strokeStyle = OUT; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(sd * 10, -66); ctx.quadraticCurveTo(sd * 16, -82, sd * 22, -80); ctx.stroke();
        orb(ctx, sd * 22, -80, 4, 4, shade(A, 1.3), OUT);
      }
    }
    if (has("cheeks")) { orb(ctx, -26, -32, 6, 5, shade(A, 1.35), null); orb(ctx, 24, -32, 6, 5, shade(A, 1.35), null); }
    if (has("spots")) { orb(ctx, -12, -14, 4, 4, shade(M, .8), null); orb(ctx, 10, -12, 3.5, 3.5, shade(M, .8), null); }
  }

  else if (shape === "biped") {
    // queue + flamme
    if (has("tailFlame")) {
      ctx.strokeStyle = M; ctx.lineWidth = 9; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(18, -22); ctx.quadraticCurveTo(38, -18, 42, -34); ctx.stroke();
      ctx.strokeStyle = OUT; ctx.lineWidth = 12; ctx.globalCompositeOperation = "destination-over";
      ctx.beginPath(); ctx.moveTo(18, -22); ctx.quadraticCurveTo(38, -18, 42, -34); ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
      flame(ctx, 42, -38, 12 + Math.sin(t * 8) * 2, t);
    }
    // jambes
    orb(ctx, -13, -7, 9, 8, M, OUT);
    orb(ctx, 13, -7, 9, 8, M, OUT);
    // corps
    orb(ctx, 0, -30, 25, 27, M, OUT);
    orb(ctx, 0, -24, 16, 18, B, null);
    // bras
    orb(ctx, -24, -32, 7, 11, M, OUT);
    orb(ctx, 24, -32, 7, 11, M, OUT);
    // tête
    orb(ctx, 0, -66, 23, 21, M, OUT);
    if (has("earsPointy")) { spike(ctx, -16, -82, -8, 14, M, OUT); spike(ctx, 16, -82, 8, 14, M, OUT); }
    if (has("horns")) { spike(ctx, -12, -84, -4, 12, B, OUT); spike(ctx, 12, -84, 4, 12, B, OUT); }
    if (has("crescent")) crescent(ctx, 0, -88, 10, shade(A, 1.4), OUT);
    if (has("crystals")) {
      spike(ctx, -8, -84, -2, 10, "#e8fbff", "#7fb8d4");
      spike(ctx, 6, -86, 2, 12, "#e8fbff", "#7fb8d4");
    }
    monEye(ctx, -9, -68, 6, A);
    monEye(ctx, 9, -68, 6, A);
    mouthSmile(ctx, 0, -56, 6);
  }

  else if (shape === "quad") {
    // queue
    if (has("tailBolt")) drawBolt(ctx, 34, -34, "#f2c218", "#a8860e", t);
    else {
      ctx.strokeStyle = M; ctx.lineWidth = 7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(30, -30); ctx.quadraticCurveTo(44, -34, 46, -48); ctx.stroke();
    }
    // pattes
    for (const lx of [-24, -8, 10, 26]) orb(ctx, lx, -6, 7, 7, M, OUT);
    // corps
    orb(ctx, 2, -26, 34, 21, M, OUT);
    orb(ctx, 6, -18, 22, 11, B, null);
    if (has("spots")) { orb(ctx, 10, -34, 5, 5, shade(M, .78), null); orb(ctx, 22, -28, 4, 4, shade(M, .78), null); }
    // tête (à gauche)
    orb(ctx, -28, -44, 18, 17, M, OUT);
    if (has("earsPointy")) { spike(ctx, -38, -58, -6, 12, M, OUT); spike(ctx, -20, -60, 4, 12, M, OUT); }
    if (has("leaf")) leaf(ctx, -28, -60, t, "#4d9e3a", "#2c6420");
    if (has("petals")) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * .6;
        orb(ctx, -28 + Math.cos(a) * 20, -46 + Math.sin(a) * 20, 6, 9, "#ffd9ec", "#d488b4");
      }
      orb(ctx, -28, -44, 18, 17, M, OUT); // redessine la tête devant les pétales
    }
    monEye(ctx, -34, -46, 5.5, A);
    monEye(ctx, -21, -46, 5.5, A);
    mouthSmile(ctx, -29, -36, 5);
    if (has("cheeks")) { orb(ctx, -42, -40, 4.5, 4, shade(A, 1.3), null); orb(ctx, -14, -40, 4.5, 4, shade(A, 1.3), null); }
  }

  else if (shape === "bird") {
    // queue plumes
    for (const a of [-.5, 0, .5]) {
      ctx.save(); ctx.translate(20, -34); ctx.rotate(a * .5 + .35);
      orb(ctx, 12, 0, 12, 5, shade(M, .9), OUT);
      ctx.restore();
    }
    // pattes
    ctx.strokeStyle = "#c98a2a"; ctx.lineWidth = 3.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(-7, 0); ctx.moveTo(7, -14); ctx.lineTo(7, 0); ctx.stroke();
    // corps
    orb(ctx, 0, -34, 24, 26, M, OUT);
    orb(ctx, -3, -28, 15, 17, B, null);
    // aile
    const flap = has("wings") ? Math.sin(t * 6) * 10 : Math.sin(t * 3) * 3;
    ctx.save(); ctx.translate(8, -40); ctx.rotate(.3 - flap * .03);
    orb(ctx, 8, 4, 15, 9, shade(M, .88), OUT);
    ctx.restore();
    // tête
    orb(ctx, -6, -62, 17, 16, M, OUT);
    if (has("crest")) { fin(ctx, -8, -78, 7, 12, A, OUT); fin(ctx, -1, -76, 6, 10, A, OUT); }
    // bec
    ctx.beginPath(); ctx.moveTo(-22, -62); ctx.lineTo(-34, -58); ctx.lineTo(-22, -54); ctx.closePath();
    ctx.fillStyle = "#f2b53a"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#a8760e"; ctx.stroke();
    monEye(ctx, -12, -64, 5, A);
    monEye(ctx, 2, -64, 5, A);
  }

  else if (shape === "serpent") {
    // corps en S : anneaux du plus grand au plus petit
    const sway = Math.sin(t * 2.2) * 3;
    orb(ctx, 24, -14, 17, 13, M, OUT);
    orb(ctx, 8, -22, 15, 13, M, OUT);
    orb(ctx, -4, -38, 13, 13, M, OUT);
    orb(ctx, -8 + sway * .4, -56, 12, 12, M, OUT);
    // ventre
    orb(ctx, 20, -12, 10, 6, B, null);
    orb(ctx, 6, -20, 9, 6, B, null);
    if (has("stripes")) {
      ctx.strokeStyle = shade(A, 1.1); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(24, -14, 13, -.8, .8); ctx.stroke();
      ctx.beginPath(); ctx.arc(8, -22, 11, -.8, .8); ctx.stroke();
    }
    // tête
    const hx = -10 + sway, hy = -74;
    orb(ctx, hx, hy, 15, 14, M, OUT);
    if (has("earsRound")) { orb(ctx, hx - 10, hy - 12, 6, 7, B, OUT); orb(ctx, hx + 10, hy - 12, 6, 7, B, OUT); }
    if (has("horns")) { spike(ctx, hx - 8, hy - 14, -3, 10, B, OUT); spike(ctx, hx + 8, hy - 14, 3, 10, B, OUT); }
    if (has("crescent")) crescent(ctx, hx, hy - 18, 8, "#fff3b0", OUT);
    monEye(ctx, hx - 6, hy - 1, 5, A);
    monEye(ctx, hx + 6, hy - 1, 5, A);
    mouthSmile(ctx, hx, hy + 8, 5);
  }

  else if (shape === "fish") {
    // queue
    ctx.beginPath();
    ctx.moveTo(26, -42);
    ctx.lineTo(44, -56);
    ctx.lineTo(44, -28);
    ctx.closePath();
    ctx.fillStyle = shade(A, 1.15); ctx.fill();
    ctx.lineWidth = 2.4; ctx.strokeStyle = OUT; ctx.stroke();
    // corps
    orb(ctx, 0, -42, 30, 20, M, OUT);
    orb(ctx, -4, -36, 18, 10, B, null);
    if (has("tailFin")) fin(ctx, 0, -60, 12, 14, A, OUT);
    // nageoire latérale
    ctx.save(); ctx.translate(6, -38); ctx.rotate(.5 + Math.sin(t * 5) * .2);
    orb(ctx, 6, 4, 9, 5, shade(A, 1.15), OUT);
    ctx.restore();
    if (has("spots")) { orb(ctx, 10, -48, 4, 4, shade(M, .8), null); orb(ctx, 18, -42, 3, 3, shade(M, .8), null); }
    monEye(ctx, -16, -44, 6, A);
    mouthSmile(ctx, -25, -37, 4);
  }

  else if (shape === "ghost") {
    // corps fantôme à base ondulée
    ctx.beginPath();
    ctx.moveTo(-30, -30);
    ctx.quadraticCurveTo(-34, -70, 0, -76);
    ctx.quadraticCurveTo(34, -70, 30, -30);
    for (let i = 0; i < 4; i++) {
      const x0 = 30 - i * 15, wob = Math.sin(t * 4 + i) * 3;
      ctx.quadraticCurveTo(x0 - 7.5, -14 + wob, x0 - 15, -28);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(-8, -60, 5, 0, -50, 55);
    g.addColorStop(0, shade(M, 1.3));
    g.addColorStop(1, shade(M, .75));
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 2.6; ctx.strokeStyle = OUT; ctx.stroke();
    orb(ctx, 0, -44, 16, 12, B, null);
    monEye(ctx, -11, -56, 6.5, A);
    monEye(ctx, 11, -56, 6.5, A);
    // sourire malicieux
    ctx.strokeStyle = "#2a2140"; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(0, -46, 8, .15 * Math.PI, .85 * Math.PI); ctx.stroke();
  }

  ctx.restore();
}

// ---- Petites formes réutilisées ----
function mouthSmile(ctx, x, y, r) {
  ctx.strokeStyle = "#33231a";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(x, y, r, .2 * Math.PI, .8 * Math.PI);
  ctx.stroke();
}
function spike(ctx, x, y, dx, len, color, outline) {
  ctx.beginPath();
  ctx.moveTo(x - 6, y + len);
  ctx.lineTo(x + dx, y - len * .4);
  ctx.lineTo(x + 6, y + len);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = outline; ctx.stroke();
}
function fin(ctx, x, y, w, h, color, outline) {
  ctx.beginPath();
  ctx.moveTo(x - w, y + h * .5);
  ctx.quadraticCurveTo(x, y - h, x + w, y + h * .5);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 2.2; ctx.strokeStyle = outline; ctx.stroke();
}
function leaf(ctx, x, y, t, color, outline) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 2) * .12 - .2);
  ctx.strokeStyle = outline; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, -6); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.quadraticCurveTo(14, -18, 4, -30);
  ctx.quadraticCurveTo(-10, -20, 0, -6);
  ctx.fillStyle = color; ctx.fill(); ctx.stroke();
  ctx.restore();
}
function crescent(ctx, x, y, r, color, outline) {
  ctx.beginPath();
  ctx.arc(x, y, r, .15 * Math.PI, 1.85 * Math.PI);
  ctx.arc(x + r * .5, y, r * .62, 1.75 * Math.PI, .25 * Math.PI, true);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = outline; ctx.stroke();
}
function flame(ctx, x, y, r, t) {
  const flick = Math.sin(t * 11) * 2;
  for (const [f, c] of [[1, "#f2662c"], [.66, "#f8a13c"], [.36, "#ffe08a"]]) {
    ctx.beginPath();
    ctx.moveTo(x - r * f * .7, y + r * .4);
    ctx.quadraticCurveTo(x - r * f * .8, y - r * f * .6, x + flick * f * .3, y - r * f * 1.5);
    ctx.quadraticCurveTo(x + r * f * .8, y - r * f * .5, x + r * f * .7, y + r * .4);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
  }
}
function drawBolt(ctx, x, y, color, outline, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(t * 3) * .1);
  ctx.beginPath();
  ctx.moveTo(-6, 10); ctx.lineTo(4, -2); ctx.lineTo(-2, -4);
  ctx.lineTo(10, -18); ctx.lineTo(16, -14); ctx.lineTo(8, -4);
  ctx.lineTo(14, -2); ctx.lineTo(0, 14);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = outline; ctx.stroke();
  ctx.restore();
}

// --- Héros -------------------------------------------------------------
// dir : 'down' | 'up' | 'left' | 'right' ; phase : cycle de marche 0..1
function drawHero(ctx, cx, cy, size, dir, phase, t) {
  const s = size / 100;
  const step = Math.sin(phase * Math.PI * 2) * 6;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  // ombre
  ctx.beginPath(); ctx.ellipse(0, 0, 22, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(20,30,25,.3)"; ctx.fill();
  if (dir === "left") ctx.scale(-1, 1);
  const side = (dir === "left" || dir === "right");
  // jambes
  ctx.fillStyle = "#3d4a63";
  ctx.strokeStyle = "#252d3d"; ctx.lineWidth = 2;
  for (const [lx, off] of [[-8, step], [8, -step]]) {
    ctx.beginPath();
    ctx.ellipse(lx + (side ? off * .5 : 0), -8 - Math.max(0, side ? 0 : off * .3), 6.5, 9, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
  // corps (tunique)
  orb(ctx, 0, -30, 17, 20, "#d8563e", "#7d2a1a");
  orb(ctx, 0, -24, 10, 11, "#f2b03c", null);
  // bras
  orb(ctx, -16, -32, 5.5, 10, "#d8563e", "#7d2a1a");
  orb(ctx, 16, -32, 5.5, 10, "#d8563e", "#7d2a1a");
  // tête
  orb(ctx, 0, -60, 16, 15, "#f5c9a2", "#9c7350");
  // cheveux + casquette
  ctx.beginPath();
  ctx.arc(0, -63, 15.4, Math.PI, Math.PI * 2);
  ctx.fillStyle = "#4a3626"; ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -66, 14, Math.PI, Math.PI * 2);
  ctx.fillStyle = "#3d6ed8"; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = "#22407d"; ctx.stroke();
  // visière
  if (dir !== "up") {
    ctx.beginPath();
    ctx.ellipse(side ? -12 : 0, -66, side ? 8 : 15, 3.4, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#2c55ab"; ctx.fill();
  }
  // visage
  if (dir === "down") {
    monEye(ctx, -6, -59, 3.4, "#4a72c4");
    monEye(ctx, 6, -59, 3.4, "#4a72c4");
    mouthSmile(ctx, 0, -52, 3.4);
  } else if (side) {
    monEye(ctx, -8, -59, 3.4, "#4a72c4");
    mouthSmile(ctx, -12, -53, 2.6);
  }
  ctx.restore();
}

// --- PNJ ---------------------------------------------------------------
function drawNpc(ctx, npc, cx, cy, size, t) {
  const s = size / 100;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  if (npc.kind === "sign") {
    ctx.fillStyle = "#8a6238"; ctx.strokeStyle = "#54381c"; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.rect(-3.5, -26, 7, 26); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(-22, -48, 44, 26); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#e8d5a8"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-15, -40); ctx.lineTo(15, -40);
    ctx.moveTo(-15, -32); ctx.lineTo(9, -32); ctx.stroke();
    ctx.restore();
    return;
  }
  const prof = npc.kind === "prof";
  const trainer = npc.kind === "trainer";
  const leader = npc.kind === "leader";
  const robe = leader ? (npc.robe || "#8a5ac4") : prof ? "#e9edf2" : trainer ? "#c4553a" : "#5e9c58";
  const robeOut = shade(robe, .55);
  ctx.beginPath(); ctx.ellipse(0, 0, 21, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(20,30,25,.3)"; ctx.fill();
  // cape du chef d'arène
  if (leader) {
    ctx.beginPath();
    ctx.moveTo(-16, -46);
    ctx.quadraticCurveTo(-26 - Math.sin(t * 2) * 2, -20, -18, -2);
    ctx.lineTo(18, -2);
    ctx.quadraticCurveTo(26 + Math.sin(t * 2) * 2, -20, 16, -46);
    ctx.closePath();
    ctx.fillStyle = shade(robe, .7); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = robeOut; ctx.stroke();
  }
  orb(ctx, 0, -26, 18, 25, robe, robeOut);
  if (trainer) orb(ctx, 0, -20, 10, 12, "#f0e0c0", null);
  if (leader) { // emblème
    orb(ctx, 0, -34, 6, 6, "#ffd98a", "#a8781e");
  }
  orb(ctx, 0, -58, 15, 14, "#f5c9a2", "#9c7350");
  // cheveux / couvre-chef
  ctx.beginPath();
  ctx.arc(0, -61, 14.6, Math.PI * .95, Math.PI * 2.05);
  ctx.fillStyle = prof ? "#b9c4cc" : leader ? shade(robe, .8) : trainer ? "#4a3626" : "#6b4a2e";
  ctx.fill();
  if (trainer) { // casquette
    ctx.beginPath();
    ctx.arc(0, -64, 13.6, Math.PI, Math.PI * 2);
    ctx.fillStyle = "#3d8a48"; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = "#1f4a26"; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -64, 14.5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#2c6636"; ctx.fill();
  }
  if (leader) { // diadème
    ctx.beginPath();
    ctx.moveTo(-10, -70); ctx.lineTo(0, -78); ctx.lineTo(10, -70);
    ctx.strokeStyle = "#ffd98a"; ctx.lineWidth = 3; ctx.stroke();
  }
  monEye(ctx, -5.5, -58, 3, "#555");
  monEye(ctx, 5.5, -58, 3, "#555");
  mouthSmile(ctx, 0, -51, 3);
  if (prof) { // lunettes
    ctx.strokeStyle = "#444"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(-5.5, -58, 4.6, 0, Math.PI * 2);
    ctx.moveTo(4.6 + 5.5, -58); ctx.arc(5.5, -58, 4.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================
//  Rendu "HD-2D" : les personnages et créatures sont dessinés en
//  basse résolution puis ré-agrandis au plus proche voisin, pour
//  obtenir des sprites pixel-art nets sur des décors adoucis.
// ============================================================
const PIXBUF = document.createElement("canvas");
PIXBUF.width = PIXBUF.height = 192;
const PIXCTX = PIXBUF.getContext("2d");

// cb(bufCtx, feetX, feetY, taille) dessine le sprite dans le tampon.
// destH = hauteur voulue à l'écran ; pixel = taille d'un "pixel" du sprite.
function pixelSprite(mainCtx, cb, cx, cy, destH, pixel) {
  const bsize = Math.max(10, Math.round(destH / pixel));
  const k = destH / bsize;
  PIXCTX.clearRect(0, 0, 192, 192);
  cb(PIXCTX, 96, 186, bsize);
  const prev = mainCtx.imageSmoothingEnabled;
  mainCtx.imageSmoothingEnabled = false;
  mainCtx.drawImage(PIXBUF, 0, 0, 192, 192, cx - 96 * k, cy - 186 * k, 192 * k, 192 * k);
  mainCtx.imageSmoothingEnabled = prev;
}

function pixMon(ctx, sp, cx, cy, size, opts = {}, pixel = 3) {
  // sprite image (assets/<id>.png) : dessin direct, net, sans passe de pixelisation
  if (sp.custom && sp.custom.complete && sp.custom.naturalWidth > 0) {
    drawMon(ctx, sp, cx, cy, size, opts);
    return;
  }
  pixelSprite(ctx, (c, x, y, s) => drawMon(c, sp, x, y, s, opts), cx, cy, size, pixel);
}
function pixHero(ctx, cx, cy, size, dir, phase, t, pixel = 2) {
  const frames = ART.hero[dir] || ART.hero.down;
  const seq = [0, 1, 0, 2];
  const idx = phase > 0.001 ? seq[Math.floor(phase * 4) % 4] : 0;
  const img = frames[idx];
  if (artOk(img)) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy - size * .02, size * .30, size * .10, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(20,30,25,.3)"; ctx.fill();
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, cx - size / 2, cy - size * .96, size, size);
    ctx.imageSmoothingEnabled = prev;
    ctx.restore();
    return;
  }
  pixelSprite(ctx, (c, x, y, s) => drawHero(c, x, y, s, dir, phase, t), cx, cy, size, pixel);
}
// image de PNJ selon son rôle (null => rendu par code)
function npcArtFor(npc) {
  if (npc.kind === "sign") return artOk(ART.obj.sign) ? ART.obj.sign : null;
  if (npc.kind === "prof") return artOk(ART.npc.prof) ? ART.npc.prof : null;
  if (npc.kind === "leader") {
    if (!artOk(ART.npc.leader)) return null;
    return npc.robe ? tintedSprite(ART.npc.leader, npc.robe, .4) : ART.npc.leader;
  }
  const v = (npc.name || "").length % 2;
  if (npc.kind === "trainer") {
    const img = v ? ART.npc.trainer : ART.npc.trainer2;
    if (artOk(img)) return img;
    return artOk(ART.npc.trainer) ? ART.npc.trainer : null;
  }
  const img = v ? ART.npc.villager : ART.npc.villager2;
  if (artOk(img)) return img;
  return artOk(ART.npc.villager) ? ART.npc.villager : null;
}
function pixNpc(ctx, npc, cx, cy, size, t, pixel = 2) {
  const img = npcArtFor(npc);
  if (img) {
    ctx.save();
    if (npc.kind !== "sign") {
      ctx.beginPath();
      ctx.ellipse(cx, cy - size * .02, size * .30, size * .10, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(20,30,25,.3)"; ctx.fill();
    }
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, cx - size / 2, cy - size * .96, size, size);
    ctx.imageSmoothingEnabled = prev;
    ctx.restore();
    return;
  }
  pixelSprite(ctx, (c, x, y, s) => drawNpc(c, npc, x, y, s, t), cx, cy, size, pixel);
}

// --- Novaball ----------------------------------------------------------
function drawBall(ctx, x, y, r, kind = "ball", rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const top = kind === "superball" ? "#3d6ed8" : "#e34a4a";
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
  ctx.fillStyle = top; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI);
  ctx.fillStyle = "#f4f4f4"; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1.6, r * .14); ctx.strokeStyle = "#2b2b2b"; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * .3, 0, Math.PI * 2);
  ctx.fillStyle = "#fff"; ctx.fill(); ctx.stroke();
  // reflet
  ctx.beginPath(); ctx.arc(-r * .35, -r * .4, r * .18, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.fill();
  ctx.restore();
}
