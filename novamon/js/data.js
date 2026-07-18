// ============================================================
//  NOVAMON — Données du jeu : types, attaques, espèces, carte
// ============================================================
"use strict";

// ---------- Types ----------
const TYPES = {
  "Normal":   { c: "#a8a596" },
  "Feu":      { c: "#f0752e" },
  "Eau":      { c: "#4a90e2" },
  "Plante":   { c: "#63bc4a" },
  "Électrik": { c: "#f2c218" },
  "Roche":    { c: "#b8a860" },
  "Vol":      { c: "#8fa8dd" },
  "Spectre":  { c: "#6f5aa0" },
  "Glace":    { c: "#79cfe0" },
  "Poison":   { c: "#a05aa0" },
  "Fée":      { c: "#ee9ac6" },
  "Psy":      { c: "#f06a8a" },
  "Dragon":   { c: "#6a5ae0" }
};

// CHART[attaquant][défenseur] = multiplicateur (1 par défaut)
const CHART = {
  "Feu":      { "Plante": 2, "Glace": 2, "Eau": .5, "Roche": .5, "Feu": .5, "Dragon": .5 },
  "Eau":      { "Feu": 2, "Roche": 2, "Eau": .5, "Plante": .5, "Dragon": .5 },
  "Plante":   { "Eau": 2, "Roche": 2, "Feu": .5, "Plante": .5, "Vol": .5, "Poison": .5 },
  "Électrik": { "Eau": 2, "Vol": 2, "Plante": .5, "Roche": .5, "Électrik": .5, "Dragon": .5 },
  "Roche":    { "Feu": 2, "Vol": 2, "Glace": 2, "Roche": .5 },
  "Vol":      { "Plante": 2, "Électrik": .5, "Roche": .5 },
  "Spectre":  { "Spectre": 2, "Psy": 2, "Normal": 0 },
  "Glace":    { "Plante": 2, "Vol": 2, "Dragon": 2, "Feu": .5, "Eau": .5, "Glace": .5 },
  "Poison":   { "Plante": 2, "Fée": 2, "Poison": .5, "Roche": .5, "Spectre": .5 },
  "Fée":      { "Dragon": 2, "Spectre": 2, "Feu": .5, "Poison": .5 },
  "Psy":      { "Poison": 2, "Psy": .5, "Spectre": .5 },
  "Dragon":   { "Dragon": 2, "Fée": 0 },
  "Normal":   { "Roche": .5, "Spectre": 0 }
};
function typeMult(att, defTypes) {
  let m = 1;
  for (const t of defTypes) m *= (CHART[att] && CHART[att][t] !== undefined) ? CHART[att][t] : 1;
  return m;
}

// ---------- Attaques ----------
const MOVES = {
  "Charge":         { type: "Normal",   pow: 40, acc: 100 },
  "Vive-Attaque":   { type: "Normal",   pow: 45, acc: 100 },
  "Plaquage":       { type: "Normal",   pow: 70, acc: 95 },
  "Flammèche":      { type: "Feu",      pow: 40, acc: 100 },
  "Crocs Feu":      { type: "Feu",      pow: 65, acc: 95 },
  "Lance-Flammes":  { type: "Feu",      pow: 85, acc: 100 },
  "Pistolet à O":   { type: "Eau",      pow: 40, acc: 100 },
  "Bulles d'O":     { type: "Eau",      pow: 60, acc: 100 },
  "Hydrocanon":     { type: "Eau",      pow: 95, acc: 90 },
  "Fouet Lianes":   { type: "Plante",   pow: 45, acc: 100 },
  "Tranch'Herbe":   { type: "Plante",   pow: 60, acc: 95 },
  "Tempête Verte":  { type: "Plante",   pow: 85, acc: 95 },
  "Éclair":         { type: "Électrik", pow: 40, acc: 100 },
  "Étincelle":      { type: "Électrik", pow: 60, acc: 100 },
  "Tonnerre":       { type: "Électrik", pow: 90, acc: 85 },
  "Jet-Pierres":    { type: "Roche",    pow: 50, acc: 95 },
  "Éboulement":     { type: "Roche",    pow: 80, acc: 90 },
  "Tornade":        { type: "Vol",      pow: 40, acc: 100 },
  "Cru-Aile":       { type: "Vol",      pow: 65, acc: 100 },
  "Aéro-Lame":      { type: "Vol",      pow: 85, acc: 95 },
  "Ombre Portée":   { type: "Spectre",  pow: 45, acc: 100 },
  "Ball'Ombre":     { type: "Spectre",  pow: 80, acc: 100 },
  "Éclat Glace":    { type: "Glace",    pow: 45, acc: 100 },
  "Laser Glace":    { type: "Glace",    pow: 85, acc: 95 },
  "Dard-Venin":     { type: "Poison",   pow: 40, acc: 100 },
  "Bombe Acide":    { type: "Poison",   pow: 70, acc: 95 },
  "Vent Féérique":  { type: "Fée",      pow: 40, acc: 100 },
  "Éclat Magique":  { type: "Fée",      pow: 80, acc: 100 },
  "Choc Mental":    { type: "Psy",      pow: 50, acc: 100 },
  "Psyko":          { type: "Psy",      pow: 90, acc: 95 },
  "Draco-Souffle":  { type: "Dragon",   pow: 60, acc: 100 },
  "Colère Draco":   { type: "Dragon",   pow: 90, acc: 90 }
};

// ---------- Espèces (fakemons originaux) ----------
// base : stats de base ; catch : taux de capture (0-1) ; evolve : {to, level}
// draw : paramètres du rendu procédural (voir sprites.js)
const SPECIES = {
  flamizar: {
    id: "flamizar", name: "Flamizar", types: ["Feu"],
    base: { hp: 45, atk: 58, def: 40, spd: 55 }, catch: .45, xp: 62,
    evolve: { to: "pyroclast", level: 16 },
    moves: [[1, "Charge"], [1, "Flammèche"], [8, "Vive-Attaque"], [13, "Crocs Feu"], [20, "Lance-Flammes"]],
    draw: { shape: "biped", main: "#e8623d", belly: "#ffd9a0", accent: "#a33518", feat: ["tailFlame", "earsPointy"] },
    desc: "Petit lézard vif dont la queue s'embrase quand il est excité. Il adore les siestes au soleil."
  },
  pyroclast: {
    id: "pyroclast", name: "Pyroclast", types: ["Feu", "Dragon"],
    base: { hp: 62, atk: 84, def: 58, spd: 72 }, catch: .2, xp: 142,
    moves: [[1, "Flammèche"], [1, "Crocs Feu"], [18, "Draco-Souffle"], [24, "Lance-Flammes"], [32, "Colère Draco"]],
    draw: { shape: "biped", main: "#c9432c", belly: "#ffc178", accent: "#701d0e", feat: ["tailFlame", "horns", "wings"], big: 1.25 },
    desc: "Sa flamme caudale atteint 800 °C. On raconte qu'un ancêtre dragon sommeille dans son sang."
  },
  aquano: {
    id: "aquano", name: "Aquano", types: ["Eau"],
    base: { hp: 50, atk: 48, def: 52, spd: 42 }, catch: .45, xp: 63,
    evolve: { to: "torrentide", level: 16 },
    moves: [[1, "Charge"], [1, "Pistolet à O"], [8, "Vive-Attaque"], [13, "Bulles d'O"], [22, "Hydrocanon"]],
    draw: { shape: "blob", main: "#4da3e8", belly: "#cfeaff", accent: "#2b6cae", feat: ["finHead", "cheeks"] },
    desc: "Cette petite goutte espiègle stocke de l'eau dans ses joues pour arroser les curieux."
  },
  torrentide: {
    id: "torrentide", name: "Torrentide", types: ["Eau"],
    base: { hp: 70, atk: 68, def: 75, spd: 55 }, catch: .2, xp: 140,
    moves: [[1, "Pistolet à O"], [1, "Bulles d'O"], [18, "Plaquage"], [26, "Hydrocanon"], [30, "Laser Glace"]],
    draw: { shape: "blob", main: "#2f7fc4", belly: "#bfe3ff", accent: "#1c5486", feat: ["finHead", "crest", "spots"], big: 1.3 },
    desc: "Gardien des lacs, il peut créer un raz-de-marée d'un simple battement de nageoire."
  },
  feuillune: {
    id: "feuillune", name: "Feuillune", types: ["Plante"],
    base: { hp: 48, atk: 50, def: 50, spd: 48 }, catch: .45, xp: 64,
    evolve: { to: "sylvoria", level: 16 },
    moves: [[1, "Charge"], [1, "Fouet Lianes"], [8, "Vive-Attaque"], [13, "Tranch'Herbe"], [21, "Tempête Verte"]],
    draw: { shape: "quad", main: "#7bc95e", belly: "#e5f7d0", accent: "#3f7d2c", feat: ["leaf", "spots"] },
    desc: "La feuille sur sa tête indique son humeur : dressée quand il est content, repliée quand il boude."
  },
  sylvoria: {
    id: "sylvoria", name: "Sylvoria", types: ["Plante", "Fée"],
    base: { hp: 66, atk: 72, def: 66, spd: 60 }, catch: .2, xp: 141,
    moves: [[1, "Fouet Lianes"], [1, "Tranch'Herbe"], [18, "Vent Féérique"], [24, "Tempête Verte"], [30, "Éclat Magique"]],
    draw: { shape: "quad", main: "#5aab4e", belly: "#f2ffd9", accent: "#2f6b2f", feat: ["petals", "aura", "leaf"], big: 1.25 },
    desc: "Les fleurs poussent sur son passage. Son parfum apaise les querelles les plus vives."
  },
  rongelec: {
    id: "rongelec", name: "Rongelec", types: ["Électrik"],
    base: { hp: 38, atk: 52, def: 32, spd: 70 }, catch: .5, xp: 55,
    moves: [[1, "Charge"], [3, "Éclair"], [9, "Vive-Attaque"], [15, "Étincelle"], [24, "Tonnerre"]],
    draw: { shape: "quad", main: "#7fd8d0", belly: "#eafffb", accent: "#2f9e94", feat: ["earsPointy", "tailBolt", "cheeks"] },
    desc: "Ce rongeur turquoise accumule l'électricité statique en frottant sa queue contre les rochers."
  },
  pioupiou: {
    id: "pioupiou", name: "Pioupiou", types: ["Vol"],
    base: { hp: 40, atk: 45, def: 35, spd: 60 }, catch: .5, xp: 52,
    evolve: { to: "rafalaile", level: 14 },
    moves: [[1, "Charge"], [4, "Tornade"], [10, "Vive-Attaque"], [16, "Cru-Aile"]],
    draw: { shape: "bird", main: "#e8a13d", belly: "#fff1cf", accent: "#a86416", feat: ["crest"] },
    desc: "Un oisillon rondouillard qui s'entraîne à planer en sautant du haut des fleurs."
  },
  rafalaile: {
    id: "rafalaile", name: "Rafalaile", types: ["Vol", "Normal"],
    base: { hp: 58, atk: 70, def: 50, spd: 85 }, catch: .25, xp: 122,
    moves: [[1, "Tornade"], [1, "Cru-Aile"], [17, "Plaquage"], [25, "Aéro-Lame"]],
    draw: { shape: "bird", main: "#d07f2a", belly: "#ffe9c2", accent: "#8c4f0e", feat: ["crest", "wings"], big: 1.25 },
    desc: "Ses ailes tranchent le vent. Il peut traverser la région de Kaelis en une matinée."
  },
  mousserond: {
    id: "mousserond", name: "Mousserond", types: ["Normal"],
    base: { hp: 55, atk: 40, def: 45, spd: 35 }, catch: .6, xp: 48,
    moves: [[1, "Charge"], [6, "Vive-Attaque"], [14, "Plaquage"]],
    draw: { shape: "blob", main: "#e8d5b7", belly: "#fff8ea", accent: "#b09a72", feat: ["earsRound", "cheeks"] },
    desc: "Une boule de mousse duveteuse. Il roule sur lui-même pour se déplacer plus vite."
  },
  rocmite: {
    id: "rocmite", name: "Rocmite", types: ["Roche"],
    base: { hp: 52, atk: 62, def: 78, spd: 25 }, catch: .4, xp: 70,
    moves: [[1, "Charge"], [5, "Jet-Pierres"], [13, "Plaquage"], [21, "Éboulement"]],
    draw: { shape: "blob", main: "#9a8f85", belly: "#c9c0b6", accent: "#5f574f", feat: ["rocky"] },
    desc: "Il dort si longtemps entre deux repas que la mousse pousse sur son dos de granit."
  },
  spectrio: {
    id: "spectrio", name: "Spectrio", types: ["Spectre"],
    base: { hp: 44, atk: 66, def: 40, spd: 66 }, catch: .3, xp: 78,
    moves: [[1, "Ombre Portée"], [8, "Choc Mental"], [16, "Ball'Ombre"]],
    draw: { shape: "ghost", main: "#7d6bb5", belly: "#c8bcf0", accent: "#463a72", feat: ["aura"] },
    desc: "Il apparaît dans la forêt au crépuscule pour jouer des tours aux voyageurs égarés."
  },
  givrelin: {
    id: "givrelin", name: "Givrelin", types: ["Glace"],
    base: { hp: 50, atk: 55, def: 55, spd: 50 }, catch: .35, xp: 72,
    moves: [[1, "Charge"], [5, "Éclat Glace"], [12, "Vive-Attaque"], [20, "Laser Glace"]],
    draw: { shape: "biped", main: "#a8dcf0", belly: "#ffffff", accent: "#5b9ec4", feat: ["earsPointy", "crystals"] },
    desc: "Ce renardeau des cimes laisse des empreintes de givre partout où il passe."
  },
  vipoison: {
    id: "vipoison", name: "Vipoison", types: ["Poison"],
    base: { hp: 45, atk: 60, def: 42, spd: 58 }, catch: .4, xp: 68,
    moves: [[1, "Charge"], [4, "Dard-Venin"], [12, "Vive-Attaque"], [19, "Bombe Acide"]],
    draw: { shape: "serpent", main: "#7fb069", belly: "#e0f0c8", accent: "#5a3d8a", feat: ["stripes"] },
    desc: "Sa morsure engourdit. Il hypnotise ses proies en balançant doucement la tête."
  },
  lucioline: {
    id: "lucioline", name: "Lucioline", types: ["Fée", "Électrik"],
    base: { hp: 42, atk: 50, def: 40, spd: 65 }, catch: .4, xp: 66,
    moves: [[1, "Vent Féérique"], [6, "Éclair"], [14, "Étincelle"], [22, "Éclat Magique"]],
    draw: { shape: "blob", main: "#f7b2d9", belly: "#fff0fa", accent: "#c86ba8", feat: ["wingsFairy", "aura", "antennae"], small: .85 },
    desc: "Sa lumière rose guide les promeneurs la nuit. Elle se nourrit de pollen électrisé."
  },
  psylune: {
    id: "psylune", name: "Psylune", types: ["Psy"],
    base: { hp: 48, atk: 58, def: 45, spd: 55 }, catch: .35, xp: 74,
    moves: [[1, "Choc Mental"], [9, "Vive-Attaque"], [18, "Psyko"]],
    draw: { shape: "biped", main: "#c9a2e8", belly: "#f3e8ff", accent: "#7d55a8", feat: ["crescent", "aura"] },
    desc: "Il médite en lévitant les nuits de pleine lune. Son croissant frontal capte les pensées."
  },
  bulleau: {
    id: "bulleau", name: "Bulleau", types: ["Eau"],
    base: { hp: 42, atk: 46, def: 40, spd: 52 }, catch: .5, xp: 54,
    moves: [[1, "Pistolet à O"], [7, "Charge"], [14, "Bulles d'O"]],
    draw: { shape: "fish", main: "#5fc9d8", belly: "#e2fbff", accent: "#2c8a99", feat: ["tailFin", "spots"] },
    desc: "Ce poisson bondit hors de l'eau pour gober les bulles qu'il a lui-même soufflées."
  },
  dracelet: {
    id: "dracelet", name: "Dracelet", types: ["Dragon"],
    base: { hp: 48, atk: 60, def: 45, spd: 58 }, catch: .18, xp: 88,
    evolve: { to: "dracelior", level: 30 },
    moves: [[1, "Charge"], [5, "Draco-Souffle"], [15, "Vive-Attaque"], [25, "Colère Draco"]],
    draw: { shape: "serpent", main: "#6b8fd8", belly: "#dce8ff", accent: "#3a5aa0", feat: ["earsRound", "crescent"] },
    desc: "Un bébé dragon très rare qui vit près des lacs. Sa mue porte chance, dit-on."
  },
  dracelior: {
    id: "dracelior", name: "Dracelior", types: ["Dragon", "Vol"],
    base: { hp: 78, atk: 95, def: 70, spd: 90 }, catch: .08, xp: 190,
    moves: [[1, "Draco-Souffle"], [1, "Cru-Aile"], [30, "Colère Draco"], [36, "Aéro-Lame"]],
    draw: { shape: "serpent", main: "#4a6fc4", belly: "#cfe0ff", accent: "#243f80", feat: ["wings", "horns"], big: 1.35 },
    desc: "Le seigneur des tempêtes de Kaelis. Il danse dans les cyclones comme dans une brise."
  }
};

const DEX_ORDER = [
  "flamizar", "pyroclast", "aquano", "torrentide", "feuillune", "sylvoria",
  "rongelec", "pioupiou", "rafalaile", "mousserond", "rocmite", "spectrio",
  "givrelin", "vipoison", "lucioline", "psylune", "bulleau", "dracelet", "dracelior"
];

const STARTERS = ["flamizar", "aquano", "feuillune"];

// ---------- Objets ----------
const ITEMS = {
  ball:        { name: "Novaball",       desc: "Capture les Novamon sauvages.", mult: 1 },
  superball:   { name: "Super Novaball", desc: "Capture améliorée (×1.7).",     mult: 1.7 },
  potion:      { name: "Potion",         desc: "Restaure 25 PV.",               heal: 25 },
  superpotion: { name: "Super Potion",   desc: "Restaure 60 PV.",               heal: 60 }
};

// ---------- Carte ----------
// . herbe   , fleurs   ; hautes herbes (rencontres)   T arbre   w eau
// p chemin  s sable (rencontres lac)  r rocher  b ponton
// h maison  H centre de soins  L laboratoire
const MAP_ROWS = [
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
  "T...;;;;;....;;;;;;;;....T..rr..rrr.rr.T",
  "T...;;;;;...;;;;;;;;;;...T...r.;;;;.r..T",
  "T.T.;;;;;...;;;;;;;;;;...T....;;;;..r..T",
  "T.TT........;;;;;;;;.....T...r.;;;..r..T",
  "T..T....,,....;;;;.......T....rr...r...T",
  "T.......,,,..............T......r......T",
  "T..sss....,,......................T....T",
  "T.sswws.......ppppppppppppp....T.......T",
  "T.swwwws......p...........p..TTT..;;;..T",
  "Tswwwwwws.....p...........p...T..;;;;..T",
  "Tswwwwwwsb....p...........p..T...;;;;..T",
  "Tswwwwwws.....p...........p.TT....;;;..T",
  "T.swwwws..,,..p...........p..T.........T",
  "T.sswss..,,,..p...........p...TTT.T....T",
  "T..sss...,,...p...........p..T..T..T...T",
  "T...;;........p...........p............T",
  "T..;;;;.......p...........p...;;;..TT..T",
  "T..;;;;.......p...........p...;;;......T",
  "T...;;........p...........p..;;;;..T...T",
  "T.............ppppppppppppp............T",
  "T..T...T............p..............TT..T",
  "T.TT......h...h.....p.....h...h....T...T",
  "T.T.................p..................T",
  "T.....H.............p.........L....T...T",
  "T...................p..............TT..T",
  "T.......,,,.........p.......,,,........T",
  "T........,..........p........,.........T",
  "T......................................T",
  "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
];
const MAPW = 40, MAPH = 30;
// Normalisation : largeur fixe + bordure d'arbres garantie
const MAP = MAP_ROWS.map((row, y) => {
  const r = row.slice(0, MAPW).padEnd(MAPW, ".").split("");
  for (let x = 0; x < MAPW; x++) {
    if (x === 0 || x === MAPW - 1 || y === 0 || y === MAPH - 1) r[x] = "T";
  }
  return r;
});

const SOLID_TILES = new Set(["T", "w", "r", "h", "H", "L"]);
const ENCOUNTER_TILES = new Set([";", "s"]);

function tileAt(x, y) {
  if (x < 0 || y < 0 || x >= MAPW || y >= MAPH) return "T";
  return MAP[y][x];
}

// ---------- Zones de rencontre ----------
// Chaque table : [idEspèce, poids], niveaux min/max
const ZONES = {
  plaine: {
    label: "Plaine de Kaelis", lv: [2, 5],
    table: [["rongelec", 30], ["pioupiou", 30], ["mousserond", 25], ["lucioline", 15]]
  },
  rocher: {
    label: "Crêtes Rocheuses", lv: [4, 8],
    table: [["rocmite", 45], ["givrelin", 30], ["rongelec", 25]]
  },
  foret: {
    label: "Forêt Murmurante", lv: [5, 9],
    table: [["vipoison", 30], ["psylune", 25], ["pioupiou", 25], ["spectrio", 20]]
  },
  lac: {
    label: "Lac Azuré", lv: [4, 9],
    table: [["bulleau", 45], ["mousserond", 22], ["lucioline", 23], ["dracelet", 10]]
  }
};
function zoneAt(x, y) {
  if (y <= 7) return x >= 26 ? ZONES.rocher : ZONES.plaine;
  if (x <= 13) return ZONES.lac;
  if (x >= 27) return ZONES.foret;
  return ZONES.plaine;
}

// ---------- PNJ, panneaux et objets au sol ----------
const NPCS = [
  {
    x: 29, y: 25, kind: "prof", name: "Prof. Aralia",
    lines: ["Bienvenue à Kaelis ! Les hautes herbes regorgent de Novamon sauvages.",
      "Affaiblis-les au combat avant de lancer une Novaball : la capture sera plus facile !"]
  },
  {
    x: 11, y: 22, kind: "villager", name: "Habitante",
    lines: ["Le centre de soins à l'ouest du village remet ton équipe sur pied gratuitement.",
      "On dit qu'un dragon très rare vit près du Lac Azuré…"]
  },
  {
    x: 24, y: 21, kind: "villager", name: "Voyageur",
    lines: ["La Forêt Murmurante à l'est abrite des Spectrio farceurs.",
      "Les Rocmite des crêtes ont une défense de fer : vise leurs faiblesses !"]
  },
  {
    x: 16, y: 21, kind: "sign", name: "Panneau",
    lines: ["Village de Kaelis — Nord : Plaine • Ouest : Lac Azuré • Est : Forêt Murmurante"]
  },
  {
    x: 8, y: 24, kind: "sign", name: "Panneau",
    lines: ["Centre de soins — Placez-vous devant et appuyez sur E pour soigner votre équipe."]
  }
];

const PICKUPS = [
  { id: "p1", x: 4,  y: 17, item: "ball",        n: 3 },
  { id: "p2", x: 35, y: 2,  item: "potion",      n: 2 },
  { id: "p3", x: 34, y: 18, item: "ball",        n: 3 },
  { id: "p4", x: 2,  y: 27, item: "superball",   n: 2 },
  { id: "p5", x: 36, y: 10, item: "superpotion", n: 1 },
  { id: "p6", x: 3,  y: 7,  item: "potion",      n: 2 }
];
