// Test de bout en bout de Novamon (Playwright + Chromium).
// Couvre : démarrage, choix du starter, déplacement, transition de carte,
// combat sauvage, capture, combat de dresseur, arène/badge, sauvegarde,
// Novadex (25 espèces), FPS et repli automatique WebGL → canvas.
//
// Lancement :
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
//   NODE_PATH="$(npm root -g)" node novamon/tests/e2e.js
//
// Le script crée des captures e2e_*.png dans le dossier courant et sort avec
// le code 0 si tous les contrôles sont verts, 1 sinon.
const { chromium } = require('playwright');

const SHOTS = [];
let failures = 0;
function check(name, cond, extra = '') {
  const ok = !!cond;
  if (!ok) failures++;
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  return ok;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', err => { failures++; console.log('❌ PAGE ERROR:', err.message); });

  const shot = async name => { await page.screenshot({ path: `e2e_${name}.png` }); SHOTS.push(name); };

  // ferme tous les dialogues en attente (say) — via advanceDialog() pour être
  // indépendant du focus clavier (les clics DOM peuvent détourner le focus)
  async function clearDialogs(maxMs = 8000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      const open = await page.evaluate(() => !!sayResolve);
      if (!open) return true;
      await page.evaluate(() => advanceDialog());
      await page.waitForTimeout(140);
    }
    return false;
  }

  // avance les dialogues jusqu'à retrouver soit le menu de combat, soit le monde
  // avance les dialogues jusqu'à un état stable : menu de combat, ou monde.
  // NB : les dialogues d'un dresseur défilent alors que G.mode vaut encore
  // 'world' (le combat ne démarre qu'après) — on avance donc TOUJOURS les
  // dialogues en priorité, et on ne conclut 'world' qu'après 2 sondages
  // consécutifs sans dialogue (évite la course pendant la transition).
  // NB : le jeu laisse l'élément #dialog en display:block (texte figé) même
  // quand le menu de combat s'affiche — le signal fiable d'un dialogue en
  // attente est donc sayResolve, pas l'affichage de #dialog.
  async function driveBattle(maxMs = 30000) {
    const t0 = Date.now();
    let worldIdle = 0;
    while (Date.now() - t0 < maxMs) {
      const st = await page.evaluate(() => ({
        mode: G.mode,
        say: !!sayResolve,
        menu: document.getElementById('bmenu').style.display === 'block'
      }));
      if (st.say) { worldIdle = 0; await page.evaluate(() => advanceDialog()); await page.waitForTimeout(120); continue; }
      if (st.menu) return 'menu';
      if (st.mode === 'world') { if (++worldIdle >= 2) return 'world'; await page.waitForTimeout(150); continue; }
      await page.waitForTimeout(120);
    }
    return 'timeout';
  }

  // ---------- 1. Démarrage ----------
  await page.goto('file:///home/user/games/novamon/index.html');
  await page.waitForTimeout(1500);
  check('Écran titre affiché', await page.isVisible('#title'));
  await shot('title');
  await page.click('#btn-new');
  await page.waitForTimeout(500);
  await clearDialogs();
  check('Mode monde', await page.evaluate(() => G.mode === 'world'));

  // ---------- 2. Starter ----------
  await page.keyboard.press('ArrowUp');           // face à la Prof. Aralia (29,25)
  await page.waitForTimeout(250);
  await page.keyboard.press('e');
  await page.waitForTimeout(400);
  // avance les 2 répliques d'intro jusqu'à l'ouverture de la modale
  for (let i = 0; i < 6 && !(await page.isVisible('#starters')); i++) {
    await page.keyboard.press('e'); await page.waitForTimeout(220);
  }
  const starterVisible = await page.isVisible('#starters');
  check('Modale du starter ouverte', starterVisible);
  await shot('starter');
  if (starterVisible) {
    await page.click('.startercell');             // Flamizar
    await page.waitForTimeout(300);
    await clearDialogs();
  }
  check('Starter dans l\'équipe', await page.evaluate(() => G.team.length === 1 && G.items.ball >= 8));

  // ---------- 3. Déplacement ----------
  const p0 = await page.evaluate(() => ({ x: G.hero.x, y: G.hero.y }));
  await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(700); await page.keyboard.up('ArrowLeft');
  await page.waitForTimeout(300);
  const p1 = await page.evaluate(() => ({ x: G.hero.x, y: G.hero.y }));
  check('Déplacement du héros', p1.x !== p0.x || p1.y !== p0.y, `(${p0.x},${p0.y}) → (${p1.x},${p1.y})`);

  // ---------- 4. Transition de carte (Bourg Kaelis → Route 1) ----------
  await page.evaluate(() => {
    const h = G.hero;
    h.x = h.tx = 19; h.y = h.ty = 1; h.px = 19; h.py = 1; h.moving = false;
  });
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(900); await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(1200);
  check('Transition vers la Route 1', await page.evaluate(() => G.mapId === 'route1'));
  await shot('route1');

  // ---------- 5. Combat sauvage (hautes herbes) ----------
  await page.evaluate(() => {
    const h = G.hero;
    h.x = h.tx = 5; h.y = h.ty = 2; h.px = 5; h.py = 2; h.moving = false;
    G.team[0].level = 14; G.team[0].stats = calcStats(G.team[0].sp, 14);
    G.team[0].hp = G.team[0].stats.maxHp;
    G.team[0].moves = movesAtLevel(G.team[0].sp, 14);
  });
  let inBattle = false;
  for (let i = 0; i < 40 && !inBattle; i++) {
    const dir = i % 2 ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.down(dir); await page.waitForTimeout(260); await page.keyboard.up(dir);
    await page.waitForTimeout(160);
    inBattle = await page.evaluate(() => G.mode === 'battle');
  }
  check('Combat sauvage déclenché', inBattle);
  let st = await driveBattle();
  check('Menu de combat affiché', st === 'menu');
  await shot('battle');

  // ---------- 6. Capture ----------
  // ennemi affaibli + RNG forcé bas => capture garantie, pour tester le flux complet
  await page.evaluate(() => {
    B.enemy.hp = 1; updateCards();
    window.__realRandom = Math.random;
    Math.random = () => 0.001;   // rend la capture certaine
  });
  await page.click('button[data-a="bag"]');
  await page.waitForTimeout(250);
  await page.click('button[data-item="ball"]');
  await page.waitForTimeout(400);
  st = await driveBattle();
  await page.evaluate(() => { Math.random = window.__realRandom; });
  const captured = await page.evaluate(() => G.team.length + G.box.length >= 2);
  check('Capture réussie', captured);
  await shot('after_capture');
  check('Retour au monde après capture', await page.evaluate(() => G.mode === 'world'));

  // ---------- 7. Combat de dresseur (Gamin Théo, Route 1) ----------
  await clearDialogs();
  await page.evaluate(() => {
    const h = G.hero;
    h.x = h.tx = 8; h.y = h.ty = 14; h.px = 8; h.py = 14; h.moving = false; h.dir = 'up';
    for (const m of G.team) { m.hp = m.stats.maxHp; }
  });
  await page.waitForTimeout(200);
  // interaction via interact() (indépendant du focus clavier après des clics DOM)
  await page.evaluate(() => { G.hero.dir = 'up'; interact(); });
  await page.waitForTimeout(300);
  st = await driveBattle();
  check('Combat de dresseur lancé', await page.evaluate(() => G.mode === 'battle' && !!B && !!B.trainer));
  let guard = 0;
  while (st === 'menu' && guard++ < 20) {
    await page.click('button[data-a="fight"]');
    await page.waitForTimeout(250);
    const mv = await page.$$('[data-mv]');
    if (!mv.length) { st = await driveBattle(); continue; }
    await mv[mv.length - 1].click();
    await page.waitForTimeout(200);
    st = await driveBattle();
  }
  check('Victoire contre le dresseur', await page.evaluate(() => G.mode === 'world' && G.flags['beat_r1t1']));
  await shot('trainer_won');

  // ---------- 8. Arène et badge (Sylvia, arène de Verdicité) ----------
  await page.evaluate(() => {
    G.mapId = 'gym1';
    const h = G.hero;
    h.x = h.tx = 7; h.y = h.ty = 2; h.px = 7; h.py = 2; h.moving = false;
    for (const m of G.team) { m.hp = m.stats.maxHp; }
    G.team[0].level = 22; G.team[0].stats = calcStats(G.team[0].sp, 22);
    G.team[0].hp = G.team[0].stats.maxHp;
    G.team[0].moves = movesAtLevel(G.team[0].sp, 22);
    G.hero.dir = 'up';
    setupMap();
  });
  await page.waitForTimeout(400);
  await shot('gym');
  await clearDialogs();
  await page.evaluate(() => { G.hero.dir = 'up'; interact(); });
  await page.waitForTimeout(300);
  st = await driveBattle(45000);
  guard = 0;
  while (st === 'menu' && guard++ < 16) {
    await page.click('button[data-a="fight"]');
    await page.waitForTimeout(250);
    const mv = await page.$$('[data-mv]');
    await mv[mv.length - 1].click();
    await page.waitForTimeout(200);
    st = await driveBattle(45000);
  }
  check('Badge Feuille obtenu', await page.evaluate(() => !!G.badges.feuille));
  await shot('badge');

  // ---------- 9. Sauvegarde et rechargement ----------
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.click('#m-save');
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForTimeout(1200);
  check('Bouton Continuer visible', await page.isVisible('#btn-continue'));
  await page.click('#btn-continue');
  await page.waitForTimeout(600);
  const loaded = await page.evaluate(() => ({
    team: G.team.length, badge: !!G.badges.feuille, map: G.mapId, dex: Object.keys(G.dex.caught).length
  }));
  check('Sauvegarde restaurée', loaded.team >= 2 && loaded.badge && loaded.map === 'gym1',
    JSON.stringify(loaded));

  // ---------- 10. Novadex (nouvelles espèces présentes) ----------
  await page.click('#btn-dex');
  await page.waitForTimeout(500);
  const dexCount = await page.evaluate(() => document.querySelectorAll('.dexcell').length);
  check('Novadex : 25 espèces listées', dexCount === 25, 'cellules = ' + dexCount);
  await shot('dex');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // ---------- 11. FPS ----------
  // En headless, WebGL passe par SwiftShader (logiciel, lent) : on mesure donc
  // la performance du cœur de rendu canvas (effets HD désactivés), qui reflète
  // le pipeline utilisé sur les machines sans GPU, puis on vérifie que le repli
  // automatique WebGL→canvas s'enclenche bien.
  const measureFps = () => page.evaluate(() => new Promise(res => {
    let n = 0; const t0 = performance.now();
    function cnt() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(cnt); else res(Math.round(n / 2)); }
    requestAnimationFrame(cnt);
  }));
  await page.evaluate(() => { G.fx = false; });   // rendu canvas pur
  await page.waitForTimeout(300);
  const fps3d = await measureFps();
  await page.evaluate(() => { G.view3d = false; });
  await page.waitForTimeout(300);
  const fps2d = await measureFps();
  await page.evaluate(() => { G.view3d = true; G.fx = true; });
  console.log(`ℹ️ FPS cœur canvas (sans effets HD) : Paper 3D ~${fps3d}, 2D ~${fps2d}`);
  check('FPS 3D ≥ 30 (canvas pur)', fps3d >= 30, fps3d + ' fps');
  check('FPS 2D ≥ 30 (canvas pur)', fps2d >= 30, fps2d + ' fps');

  // repli automatique WebGL→canvas quand le rendu logiciel est trop lent
  const glState = await page.evaluate(async () => {
    // attendre que la détection de lenteur ait eu le temps de statuer
    const t0 = performance.now();
    while (performance.now() - t0 < 8000 && GLFX.ok && !GLFX.slow) {
      await new Promise(r => setTimeout(r, 200));
    }
    return { ok: GLFX.ok, slow: !!GLFX.slow };
  });
  const fpsHd = await measureFps();
  console.log(`ℹ️ Effets HD : GLFX.ok=${glState.ok} slow=${glState.slow} → FPS ~${fpsHd}`);
  check('Repli WebGL→canvas OK (ou WebGL rapide)', fpsHd >= 24, fpsHd + ' fps');

  await browser.close();
  console.log(failures === 0 ? 'E2E: TOUT EST VERT' : `E2E: ${failures} ÉCHEC(S)`);
  process.exit(failures === 0 ? 0 : 1);
})();
