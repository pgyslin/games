// ============================================================
//  NOVAMON — Données du jeu : types, attaques, espèces, monde
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
  },
  louveran: {
    id: "louveran", name: "Louveran", types: ["Normal"],
    base: { hp: 54, atk: 64, def: 48, spd: 66 }, catch: .3, xp: 82,
    moves: [[1, "Charge"], [5, "Vive-Attaque"], [13, "Plaquage"]],
    draw: { shape: "quad", main: "#9aa2b0", belly: "#e8ecf2", accent: "#4a5262", feat: ["earsPointy", "stripes"] },
    desc: "Ce loup gris chasse en silence dans la Forêt Sombre. Son hurlement annonce la tombée de la nuit."
  },
  scorpide: {
    id: "scorpide", name: "Scorpide", types: ["Poison", "Roche"],
    base: { hp: 48, atk: 66, def: 70, spd: 40 }, catch: .3, xp: 84,
    moves: [[1, "Dard-Venin"], [6, "Jet-Pierres"], [14, "Bombe Acide"], [22, "Éboulement"]],
    draw: { shape: "blob", main: "#b8a05a", belly: "#e8d9a8", accent: "#6e5a2a", feat: ["rocky", "antennae"] },
    desc: "Sa carapace est dure comme le granit des Crêtes. Son dard injecte un venin qui pétrifie."
  },
  meduline: {
    id: "meduline", name: "Méduline", types: ["Eau", "Poison"],
    base: { hp: 50, atk: 52, def: 55, spd: 48 }, catch: .35, xp: 78,
    moves: [[1, "Pistolet à O"], [7, "Dard-Venin"], [15, "Bulles d'O"], [23, "Bombe Acide"]],
    draw: { shape: "ghost", main: "#6fc9d8", belly: "#d8f6ff", accent: "#2c7a8a", feat: ["aura"] },
    desc: "Cette méduse translucide dérive le long de la côte d'Azur. Ses filaments engourdissent les imprudents."
  },
  anguivolt: {
    id: "anguivolt", name: "Anguivolt", types: ["Électrik", "Eau"],
    base: { hp: 46, atk: 60, def: 44, spd: 68 }, catch: .32, xp: 80,
    moves: [[1, "Éclair"], [8, "Pistolet à O"], [16, "Étincelle"], [26, "Tonnerre"]],
    draw: { shape: "serpent", main: "#4a4a52", belly: "#f2e28a", accent: "#f2c218", feat: ["stripes", "finHead"] },
    desc: "Une anguille du Lac Azuré qui accumule la foudre des orages. La toucher fait dresser les cheveux."
  },
  phantomite: {
    id: "phantomite", name: "Phantomite", types: ["Spectre", "Psy"],
    base: { hp: 44, atk: 62, def: 42, spd: 62 }, catch: .28, xp: 86,
    moves: [[1, "Ombre Portée"], [9, "Choc Mental"], [18, "Ball'Ombre"], [26, "Psyko"]],
    draw: { shape: "ghost", main: "#b0a8c9", belly: "#efeaff", accent: "#5f5480", feat: ["wingsFairy", "aura"] },
    desc: "Un papillon spectral né d'un rêve oublié. Sa poudre d'ailes fait voir des souvenirs enfouis."
  },
  glacidra: {
    id: "glacidra", name: "Glacidra", types: ["Glace", "Dragon"],
    base: { hp: 64, atk: 78, def: 62, spd: 70 }, catch: .12, xp: 150,
    moves: [[1, "Éclat Glace"], [10, "Draco-Souffle"], [20, "Laser Glace"], [30, "Colère Draco"]],
    draw: { shape: "serpent", main: "#9fd8f0", belly: "#ffffff", accent: "#4a8ab5", feat: ["wings", "crystals"], big: 1.25 },
    desc: "On dit qu'il dort au fond du lac depuis l'ère glaciaire. Son souffle fige jusqu'aux cascades."
  }
};

const DEX_ORDER = [
  "flamizar", "pyroclast", "aquano", "torrentide", "feuillune", "sylvoria",
  "rongelec", "pioupiou", "rafalaile", "mousserond", "rocmite", "spectrio",
  "givrelin", "vipoison", "lucioline", "psylune", "bulleau", "dracelet", "dracelior",
  "louveran", "scorpide", "meduline", "anguivolt", "phantomite", "glacidra"
];

const STARTERS = ["flamizar", "aquano", "feuillune"];

// ---------- Objets ----------
const ITEMS = {
  ball:        { name: "Novaball",       desc: "Capture les Novamon sauvages.", mult: 1 },
  superball:   { name: "Super Novaball", desc: "Capture améliorée (×1.7).",     mult: 1.7 },
  potion:      { name: "Potion",         desc: "Restaure 25 PV.",               heal: 25 },
  superpotion: { name: "Super Potion",   desc: "Restaure 60 PV.",               heal: 60 }
};

// ---------- Badges ----------
const BADGES = {
  feuille: { name: "Badge Feuille", icon: "🌿" },
  roc:     { name: "Badge Roc",     icon: "🪨" },
  vague:   { name: "Badge Vague",   icon: "🌊" }
};

// ============================================================
//  Monde : cartes, PNJ, dresseurs, arènes
// ============================================================
// Légende des tuiles :
// . herbe/sol   , fleurs   ; hautes herbes   T arbre   w eau   p chemin
// s sable   r rocher   b ponton   h maison   H centre de soins   L labo
// G mur d'arène   D porte d'arène   ! lampadaire   F fontaine
// # mur intérieur   c tapis d'arène   % pot de plante (décor intérieur)

const SOLID_TILES = new Set(["T", "w", "r", "h", "H", "L", "G", "!", "F", "#", "%"]);
const ENCOUNTER_TILES = new Set([";", "s"]);

const MAPS = {

  // ---------- Bourg Kaelis (départ) ----------
  kaelis: {
    label: "Bourg Kaelis", theme: "outdoor",
    rows: [
      "TTTTTTTTTTTTTTTTTTppppTTTTTTTTTTTTTTTTTT",
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
      "T...;;........p...........p............p",
      "T..;;;;.......p...........p...;;;......p",
      "T..;;;;.......p...........p...;;;......T",
      "T...;;........p...........p..;;;;..T...T",
      "T.............ppppppppppppp............T",
      "T..T...T............p..............TT..T",
      "T.TT......h...h.....p.....h...h....T...T",
      "T.T..............!..p..!...............T",
      "T.....H.............p.........L....T...T",
      "T...................p..............TT..T",
      "T.......,,,.........p.......,,,........T",
      "T........,..........p........,.........T",
      "T......................................T",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ],
    useZones: true,
    exits: [
      { x: 18, y: 0, to: "route1", tx: 12, ty: 28, dir: "up" },
      { x: 19, y: 0, to: "route1", tx: 13, ty: 28, dir: "up" },
      { x: 20, y: 0, to: "route1", tx: 14, ty: 28, dir: "up" },
      { x: 21, y: 0, to: "route1", tx: 15, ty: 28, dir: "up" },
      { x: 39, y: 16, to: "route2", tx: 1, ty: 9, dir: "right" },
      { x: 39, y: 17, to: "route2", tx: 1, ty: 10, dir: "right" }
    ],
    npcs: [
      {
        x: 29, y: 25, kind: "prof", name: "Prof. Aralia",
        lines: ["Les hautes herbes regorgent de Novamon sauvages : affaiblis-les avant de lancer une Novaball !",
          "La sortie nord mène à la Route 1 et à Verdicité. Sa cheffe d'arène, Sylvia, attend les jeunes dresseurs !"]
      },
      {
        x: 11, y: 22, kind: "villager", name: "Habitante",
        lines: ["Le centre de soins à l'ouest du village remet ton équipe sur pied gratuitement.",
          "On dit qu'un dragon très rare vit près du Lac Azuré…"]
      },
      {
        x: 24, y: 21, kind: "villager", name: "Voyageur",
        lines: ["Trois arènes t'attendent : Verdicité au nord, Rocheville à l'est, et Cité Azur sur la côte.",
          "Les chefs d'arène remettent un badge aux dresseurs qui les battent !"]
      },
      {
        x: 16, y: 21, kind: "sign", name: "Panneau",
        lines: ["Bourg Kaelis — Nord : Route 1 (Verdicité) • Est : Route 2 (Rocheville) • Ouest : Lac Azuré"]
      },
      {
        x: 8, y: 24, kind: "sign", name: "Panneau",
        lines: ["Centre de soins — Placez-vous devant et appuyez sur E pour soigner votre équipe."]
      }
    ],
    pickups: [
      { id: "k1", x: 4,  y: 17, item: "ball",        n: 3 },
      { id: "k2", x: 35, y: 2,  item: "potion",      n: 2 },
      { id: "k3", x: 34, y: 18, item: "ball",        n: 3 },
      { id: "k4", x: 2,  y: 27, item: "superball",   n: 2 },
      { id: "k5", x: 36, y: 10, item: "superpotion", n: 1 },
      { id: "k6", x: 3,  y: 7,  item: "potion",      n: 2 }
    ]
  },

  // ---------- Route 1 (vers Verdicité) ----------
  route1: {
    label: "Route 1", theme: "outdoor",
    rows: [
      "TTTTTTTTTTTTppppTTTTTTTTTT",
      "T....;;;;...p..p......;;.T",
      "T.;;.;;;;...p..p.;;;..;;.T",
      "T.;;........p..p.;;;.....T",
      "T.;;...T....pppp.........T",
      "T......T......p....T.T...T",
      "T..,,..TT.....p....T.....T",
      "T..,,......;;;p;;;.......T",
      "T.....;;;..;;;p;;;...;;..T",
      "T.;;..;;;.....p......;;..T",
      "T.;;..........p..........T",
      "T....T...ppppppppp..T....T",
      "T...TT...p.......p.TT....T",
      "T........p.......p.......T",
      "T..;;;...p.......p...;;;.T",
      "T..;;;...p.......p...;;;.T",
      "T........p.......p.......T",
      "T....;;..p.......p..;;...T",
      "T........ppppppppp.......T",
      "T............p...........T",
      "T...,,,......p......,,...T",
      "T..;;;;......p......;;;..T",
      "T..;;;;......p......;;;..T",
      "T............p...........T",
      "T....T.......p.....T.T...T",
      "T...TT.......p......TT...T",
      "T............p...........T",
      "T....;;;;....p...;;;;....T",
      "T....;;;;....p...;;;;....T",
      "TTTTTTTTTTTTppppTTTTTTTTTT"
    ],
    enc: { label: "Route 1", lv: [4, 7], table: [["rongelec", 25], ["pioupiou", 25], ["mousserond", 20], ["lucioline", 15], ["feuillune", 15]] },
    exits: [
      { x: 12, y: 29, to: "kaelis", tx: 18, ty: 1, dir: "down" },
      { x: 13, y: 29, to: "kaelis", tx: 19, ty: 1, dir: "down" },
      { x: 14, y: 29, to: "kaelis", tx: 20, ty: 1, dir: "down" },
      { x: 15, y: 29, to: "kaelis", tx: 21, ty: 1, dir: "down" },
      { x: 12, y: 0, to: "verdicite", tx: 13, ty: 22, dir: "up" },
      { x: 13, y: 0, to: "verdicite", tx: 14, ty: 22, dir: "up" },
      { x: 14, y: 0, to: "verdicite", tx: 14, ty: 22, dir: "up" },
      { x: 15, y: 0, to: "verdicite", tx: 15, ty: 22, dir: "up" }
    ],
    npcs: [
      {
        x: 8, y: 13, kind: "trainer", id: "r1t1", name: "Gamin Théo",
        pre: ["Hé ! Mes Novamon sont les plus rapides de la route !"],
        team: [["pioupiou", 5], ["rongelec", 6]],
        win: ["Waouh, t'es trop fort !"],
        post: ["Un jour je battrai la cheffe Sylvia… quand j'aurai fini mes devoirs."],
        reward: { item: "potion", n: 1 }
      },
      {
        x: 18, y: 16, kind: "trainer", id: "r1t2", name: "Fleuriste Lina",
        pre: ["Mes petits chéris adorent le soleil… et les combats !"],
        team: [["mousserond", 6], ["feuillune", 6]],
        win: ["Oh ! Mes chéris ont perdu…"],
        post: ["La cheffe Sylvia n'utilise que des Novamon Plante. Le Feu et le Vol l'embêtent bien !"],
        reward: { item: "ball", n: 2 }
      },
      { x: 16, y: 4, kind: "sign", name: "Panneau", lines: ["Route 1 — Nord : Verdicité et son arène Plante. Sud : Bourg Kaelis."] }
    ],
    pickups: [
      { id: "r1p1", x: 4, y: 20, item: "potion", n: 2 },
      { id: "r1p2", x: 22, y: 27, item: "superball", n: 1 }
    ]
  },

  // ---------- Verdicité (arène Plante) ----------
  verdicite: {
    label: "Verdicité", theme: "city",
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T..............................T",
      "T...h...h.....GDG......h...h...T",
      "T..............................T",
      "T....!....ppppppppp....!.......T",
      "T.........p.......p............T",
      "T..h......p.......p.......h....T",
      "T.........p...F...p............T",
      "T..,,.....p.......p.....,,,....T",
      "T..,,.....ppppppppp.....,,,....T",
      "T.............p...............pp",
      "T.............p...............pp",
      "T..h..........p.........h......T",
      "T....!........p...........!....T",
      "T...H.........p................T",
      "T.............p......,,,.......T",
      "T..,,,........p......,,,.......T",
      "T.............p................T",
      "T....!........p...........!....T",
      "T.............p................T",
      "T....,,.......p.......,,.......T",
      "T.............p................T",
      "T.............p................T",
      "TTTTTTTTTTTTTpppTTTTTTTTTTTTTTTT"
    ],
    exits: [
      { x: 13, y: 22, to: "route1", tx: 12, ty: 1, dir: "down" },
      { x: 14, y: 22, to: "route1", tx: 14, ty: 1, dir: "down" },
      { x: 15, y: 22, to: "route1", tx: 15, ty: 1, dir: "down" },
      { x: 15, y: 2, to: "gym1", tx: 7, ty: 11, dir: "up" },
      { x: 31, y: 10, to: "route3", tx: 1, ty: 10, dir: "right" },
      { x: 31, y: 11, to: "route3", tx: 1, ty: 11, dir: "right" }
    ],
    npcs: [
      {
        x: 22, y: 12, kind: "villager", name: "Jardinier",
        lines: ["Bienvenue à Verdicité ! L'arène est au nord de la place, porte centrale.",
          "La cheffe Sylvia est redoutable… ses Novamon Plante craignent le Feu, le Vol et la Glace."]
      },
      {
        x: 17, y: 15, kind: "villager", name: "Promeneuse",
        lines: ["La sortie est mène à la Route 3 et à la Cité Azur, au bord de la mer.",
          "La nuit, les lampadaires attirent des Lucioline. C'est magnifique !"]
      },
      { x: 17, y: 12, kind: "sign", name: "Panneau", lines: ["Verdicité — « La ville-jardin ». Arène : Sylvia, experte Plante. Est : Route 3."] }
    ],
    pickups: [
      { id: "v1", x: 28, y: 20, item: "superpotion", n: 1 },
      { id: "v2", x: 3, y: 20, item: "ball", n: 3 }
    ]
  },

  // ---------- Arène 1 : Sylvia (Plante) ----------
  gym1: {
    label: "Arène de Verdicité", theme: "interior", gymType: "Plante",
    rows: [
      "################",
      "#......cc......#",
      "#..%...cc...%..#",
      "#......cc......#",
      "#......cc......#",
      "#..%...cc...%..#",
      "#......cc......#",
      "#......cc......#",
      "#..%...cc...%..#",
      "#......cc......#",
      "#......cc......#",
      "#......cc......#",
      "#......DD......#",
      "################"
    ],
    exits: [
      { x: 7, y: 12, to: "verdicite", tx: 15, ty: 3, dir: "down" },
      { x: 8, y: 12, to: "verdicite", tx: 15, ty: 3, dir: "down" }
    ],
    npcs: [
      {
        x: 7, y: 1, kind: "leader", id: "gym1", name: "Cheffe Sylvia", robe: "#4e9e44", badge: "feuille",
        pre: ["Bienvenue dans mon jardin de combat.", "Montre-moi si ta détermination est aussi vivace que mes plantes !"],
        team: [["feuillune", 10], ["sylvoria", 12]],
        win: ["Magnifique… Tu as fleuri sous la pression !", "Reçois le Badge Feuille, tu l'as mérité."],
        post: ["Le chef Magnus de Rocheville t'attend à l'est. Ses Novamon Roche sont coriaces !"],
        reward: { item: "superball", n: 3 }
      },
      {
        x: 5, y: 6, kind: "trainer", id: "g1t1", name: "Botaniste Ivo",
        pre: ["Personne ne voit la cheffe sans m'arroser d'abord !"],
        team: [["feuillune", 8], ["vipoison", 8]],
        win: ["Mes racines ont cédé !"],
        post: ["La cheffe Sylvia garde toujours son Sylvoria pour la fin."],
        reward: { item: "potion", n: 1 }
      }
    ],
    pickups: []
  },

  // ---------- Route 2 (forêt, vers Rocheville) ----------
  route2: {
    label: "Route 2 — Forêt Sombre", theme: "outdoor",
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T..T.T..;;;;..T.T..T..;;;..T.T...T",
      "T.T..;;;;;;..T..;;;;..;;;;....T..T",
      "T..T.;;;;..T...;;;;;;...;;..T....T",
      "T.T.....T...T...;;;;..T....T..T..T",
      "T..T..T...T................T.....T",
      "T.T.....;;;...T...;;;;..T.....T..T",
      "T..T....;;;.......;;;;.......T...T",
      "T.T..T.....T..T........T..T......T",
      "pppppppppppppppppppppppppppppppppp",
      "pppppppppppppppppppppppppppppppppp",
      "T.T...T....T...T.....T...T....T..T",
      "T...;;;..T....;;;;....T..;;;..T..T",
      "T.T.;;;....T..;;;;..T....;;;.....T",
      "T..T....T........T....T.....T.T..T",
      "T.T..;;;;..T..;;;;;..T..;;;;..T..T",
      "T..T.;;;;....T;;;;;.....;;;;.T...T",
      "T.T.......T.......T...T........T.T",
      "T..T..T......T.........T..T..T...T",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ],
    enc: { label: "Route 2 — Forêt Sombre", lv: [7, 10], table: [["vipoison", 20], ["psylune", 16], ["spectrio", 16], ["mousserond", 16], ["pioupiou", 12], ["louveran", 12], ["phantomite", 8]] },
    exits: [
      { x: 0, y: 9, to: "kaelis", tx: 38, ty: 16, dir: "left" },
      { x: 0, y: 10, to: "kaelis", tx: 38, ty: 17, dir: "left" },
      { x: 33, y: 9, to: "rocheville", tx: 1, ty: 10, dir: "right" },
      { x: 33, y: 10, to: "rocheville", tx: 1, ty: 11, dir: "right" }
    ],
    npcs: [
      {
        x: 12, y: 8, kind: "trainer", id: "r2t1", name: "Scout Marco",
        pre: ["Cette forêt est pleine de dangers. Prouve que tu peux les affronter !"],
        team: [["vipoison", 8], ["mousserond", 8]],
        win: ["Tu es prêt pour la suite du chemin."],
        post: ["Les Spectrio n'attaquent que les dresseurs distraits. Reste sur tes gardes."],
        reward: { item: "ball", n: 2 }
      },
      {
        x: 24, y: 11, kind: "trainer", id: "r2t2", name: "Mystique Véra",
        pre: ["Les esprits de la forêt m'ont annoncé ta venue…"],
        team: [["psylune", 9], ["spectrio", 9]],
        win: ["Les esprits… se sont trompés ?!"],
        post: ["Le chef Magnus craint l'Eau et la Plante. Les esprits te le confirment."],
        reward: { item: "superpotion", n: 1 }
      },
      { x: 4, y: 11, kind: "sign", name: "Panneau", lines: ["Route 2 — Forêt Sombre. Est : Rocheville. Ouest : Bourg Kaelis."] }
    ],
    pickups: [
      { id: "r2p1", x: 5, y: 12, item: "ball", n: 3 },
      { id: "r2p2", x: 29, y: 16, item: "superpotion", n: 1 }
    ]
  },

  // ---------- Rocheville (arène Roche) ----------
  rocheville: {
    label: "Rocheville", theme: "city",
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T.r..r.......................T",
      "T....r.....GDG.....r..r......T",
      "T............................T",
      "T....!...ppppppp...!....r....T",
      "T........p.....p.............T",
      "T..h.....p.....p......h......T",
      "T........p.....p.............T",
      "T.r......ppppppp........r....T",
      "T.............p..............T",
      "pp............p.........r....T",
      "pp............p..............T",
      "T..h..........p.......h......T",
      "T....!........p..........!...T",
      "T...H.........p..............T",
      "T.............p....r.........T",
      "T..r..........p..............T",
      "T.............p..............T",
      "T.....r.......p.........r....T",
      "T.............p..............T",
      "T...........................rT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ],
    exits: [
      { x: 0, y: 10, to: "route2", tx: 32, ty: 9, dir: "left" },
      { x: 0, y: 11, to: "route2", tx: 32, ty: 10, dir: "left" },
      { x: 12, y: 2, to: "gym2", tx: 7, ty: 11, dir: "up" }
    ],
    npcs: [
      {
        x: 20, y: 12, kind: "villager", name: "Mineur",
        lines: ["Rocheville est bâtie sur le granit. Solide, comme les Novamon du chef Magnus !",
          "Un conseil : l'Eau et la Plante font des merveilles contre la Roche."]
      },
      { x: 17, y: 9, kind: "sign", name: "Panneau", lines: ["Rocheville — « La ville de pierre ». Arène : Magnus, expert Roche."] }
    ],
    pickups: [
      { id: "rv1", x: 26, y: 17, item: "superball", n: 2 },
      { id: "rv2", x: 3, y: 18, item: "potion", n: 2 }
    ]
  },

  // ---------- Arène 2 : Magnus (Roche) ----------
  gym2: {
    label: "Arène de Rocheville", theme: "interior", gymType: "Roche",
    rows: [
      "################",
      "#......cc......#",
      "#..r...cc...r..#",
      "#......cc......#",
      "#......cc......#",
      "#..r...cc...r..#",
      "#......cc......#",
      "#......cc......#",
      "#..r...cc...r..#",
      "#......cc......#",
      "#......cc......#",
      "#......cc......#",
      "#......DD......#",
      "################"
    ],
    exits: [
      { x: 7, y: 12, to: "rocheville", tx: 12, ty: 3, dir: "down" },
      { x: 8, y: 12, to: "rocheville", tx: 12, ty: 3, dir: "down" }
    ],
    npcs: [
      {
        x: 7, y: 1, kind: "leader", id: "gym2", name: "Chef Magnus", robe: "#8a7458", badge: "roc",
        pre: ["Ma défense est un rempart de granit.", "Voyons si tu peux l'ébrécher !"],
        team: [["rocmite", 13], ["givrelin", 14], ["rocmite", 16]],
        win: ["Par tous les éboulis… ma muraille est tombée !", "Le Badge Roc est à toi."],
        post: ["La cheffe Marina de la Cité Azur est la plus forte de nous trois. Passe par la Route 3, à l'est de Verdicité."],
        reward: { item: "superpotion", n: 2 }
      },
      {
        x: 10, y: 6, kind: "trainer", id: "g2t1", name: "Montagnard Bruno",
        pre: ["Cette arène, je la garde comme un roc !"],
        team: [["rocmite", 11]],
        win: ["Fissuré…"],
        post: ["Le chef Magnus cache un Givrelin dans son équipe. Méfie-toi de la Glace !"],
        reward: { item: "potion", n: 1 }
      }
    ],
    pickups: []
  },

  // ---------- Route 3 (prés du lac, vers Cité Azur) ----------
  route3: {
    label: "Route 3 — Prés du Lac", theme: "outdoor",
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T...,,,....;;;....,,....;;;;....T..T",
      "T..,,,,...;;;;...,,,...;;;;.......TT",
      "T...........;;.........;;......s..T",
      "T..T....,,......;;;........ss.sss.T",
      "T.......,,,....;;;;....s.ssswwws..T",
      "T..;;;.........;;;;....sswwwwwws..T",
      "T..;;;;...T............swwwwwwws..T",
      "T...;;.................swwwwwss...T",
      "T.............................s...T",
      "pppppppppppppppppppppppppppppppppppp",
      "pppppppppppppppppppppppppppppppppppp",
      "T....,,....;;;....,,,....;;;....s.T",
      "T...,,,,..;;;;...,,,,...;;;;......T",
      "T....,,...;;;;....,,....;;;;..T...T",
      "T..T...........T..............T...T",
      "T.....,,,....;;;.....,,,..........T",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ],
    enc: { label: "Route 3 — Prés du Lac", lv: [10, 14], table: [["lucioline", 22], ["bulleau", 22], ["psylune", 13], ["givrelin", 13], ["dracelet", 16], ["anguivolt", 9], ["glacidra", 5]] },
    exits: [
      { x: 0, y: 10, to: "verdicite", tx: 30, ty: 10, dir: "left" },
      { x: 0, y: 11, to: "verdicite", tx: 30, ty: 11, dir: "left" },
      { x: 35, y: 10, to: "citeazur", tx: 1, ty: 10, dir: "right" },
      { x: 35, y: 11, to: "citeazur", tx: 1, ty: 11, dir: "right" }
    ],
    npcs: [
      {
        x: 24, y: 9, kind: "trainer", id: "r3t1", name: "Pêcheur Gil",
        pre: ["Ça mord bien aujourd'hui… et mes Novamon aussi !"],
        team: [["bulleau", 11], ["bulleau", 12]],
        win: ["Ils m'ont filé entre les doigts !"],
        post: ["Les Dracelet remontent parfois du lac. J'en ai vu un une fois. Une seule."],
        reward: { item: "superball", n: 1 }
      },
      {
        x: 9, y: 12, kind: "trainer", id: "r3t2", name: "Danseuse Mila",
        pre: ["Danse avec mes étoiles !"],
        team: [["lucioline", 12], ["psylune", 12]],
        win: ["Quelle chorégraphie éblouissante !"],
        post: ["La cheffe Marina est imprévisible. Prends de l'avance avec un Novamon Plante ou Électrik."],
        reward: { item: "superpotion", n: 1 }
      },
      { x: 4, y: 9, kind: "sign", name: "Panneau", lines: ["Route 3 — Prés du Lac. Est : Cité Azur. Ouest : Verdicité."] }
    ],
    pickups: [
      { id: "r3p1", x: 33, y: 3, item: "superball", n: 2 },
      { id: "r3p2", x: 3, y: 16, item: "superpotion", n: 1 }
    ]
  },

  // ---------- Cité Azur (arène Eau) ----------
  citeazur: {
    label: "Cité Azur", theme: "city",
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T............................T",
      "T...h...h.....GDG.....h......T",
      "T............................T",
      "T...!....ppppppppp....!......T",
      "T........p.......p...........T",
      "T..h.....p.......p.....h.....T",
      "T........p...F...p...........T",
      "T........ppppppppp...........T",
      "T.............p..............T",
      "pp............p..............T",
      "pp............p......H.......T",
      "T.............p..............T",
      "T....,,.......p.........,,...T",
      "T.............p..............T",
      "T....!........p..........!...T",
      "T..sssssssssssssssssssssss...T",
      "T.ssssssssssssssssssssssssss.T",
      "T.sssbbsssssssssssbbsssssss..T",
      "Tswwwbbwwwwwwwwwwwbbwwwwwwws.T",
      "TwwwwbbwwwwwwwwwwwbbwwwwwwwwT",
      "TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT"
    ],
    enc: { label: "Cité Azur — Plage", lv: [12, 16], table: [["bulleau", 30], ["meduline", 25], ["lucioline", 15], ["givrelin", 15], ["dracelet", 15]] },
    exits: [
      { x: 0, y: 10, to: "route3", tx: 34, ty: 10, dir: "left" },
      { x: 0, y: 11, to: "route3", tx: 34, ty: 11, dir: "left" },
      { x: 15, y: 2, to: "gym3", tx: 7, ty: 11, dir: "up" }
    ],
    npcs: [
      {
        x: 21, y: 13, kind: "villager", name: "Marin",
        lines: ["La Cité Azur vit au rythme des marées. La plage regorge de Novamon Eau !",
          "La cheffe Marina n'a jamais perdu à domicile. La Plante et l'Électrik sont tes meilleurs alliés."]
      },
      { x: 17, y: 9, kind: "sign", name: "Panneau", lines: ["Cité Azur — « La perle de la côte ». Arène : Marina, experte Eau."] }
    ],
    pickups: [
      { id: "c1", x: 26, y: 13, item: "superball", n: 2 },
      { id: "c2", x: 4, y: 17, item: "superpotion", n: 1 }
    ]
  },

  // ---------- Arène 3 : Marina (Eau) ----------
  gym3: {
    label: "Arène de la Cité Azur", theme: "interior", gymType: "Eau",
    rows: [
      "################",
      "#......cc......#",
      "#.ww...cc...ww.#",
      "#.ww...cc...ww.#",
      "#......cc......#",
      "#......cc......#",
      "#.ww...cc...ww.#",
      "#.ww...cc...ww.#",
      "#......cc......#",
      "#......cc......#",
      "#......cc......#",
      "#......cc......#",
      "#......DD......#",
      "################"
    ],
    exits: [
      { x: 7, y: 12, to: "citeazur", tx: 15, ty: 3, dir: "down" },
      { x: 8, y: 12, to: "citeazur", tx: 15, ty: 3, dir: "down" }
    ],
    npcs: [
      {
        x: 7, y: 1, kind: "leader", id: "gym3", name: "Cheffe Marina", robe: "#3a7fc4", badge: "vague",
        pre: ["Les vagues façonnent la pierre, et moi je façonne les champions.", "Que la marée décide !"],
        team: [["bulleau", 16], ["torrentide", 18]],
        win: ["La marée s'est retirée devant toi…", "Le Badge Vague t'appartient. Tu es un vrai dresseur, maintenant."],
        post: ["Avec trois badges, la Ligue de Kaelis t'ouvrira bientôt ses portes… Entraîne-toi, champion."],
        reward: { item: "superball", n: 3 }
      },
      {
        x: 5, y: 6, kind: "trainer", id: "g3t1", name: "Nageur Lino",
        pre: ["Un plongeon avant de voir la cheffe ?"],
        team: [["aquano", 14]],
        win: ["Glou glou…"],
        post: ["Le Torrentide de la cheffe encaisse tout. Vise fort et juste."],
        reward: { item: "potion", n: 1 }
      }
    ],
    pickups: []
  }
};

// Normalisation : lignes de largeur fixe, grille de caractères
for (const id of Object.keys(MAPS)) {
  const m = MAPS[id];
  m.id = id;
  m.w = m.rows[0].length;
  m.h = m.rows.length;
  m.grid = m.rows.map(r => r.slice(0, m.w).padEnd(m.w, ".").split(""));
}

function tileOf(map, x, y) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return "T";
  return map.grid[y][x];
}

// ---------- Zones de rencontre du Bourg Kaelis ----------
const ZONES = {
  plaine: {
    label: "Plaine de Kaelis", lv: [2, 5],
    table: [["rongelec", 30], ["pioupiou", 30], ["mousserond", 25], ["lucioline", 15]]
  },
  rocher: {
    label: "Crêtes Rocheuses", lv: [4, 8],
    table: [["rocmite", 38], ["givrelin", 25], ["rongelec", 20], ["scorpide", 17]]
  },
  foret: {
    label: "Forêt Murmurante", lv: [5, 9],
    table: [["vipoison", 26], ["psylune", 21], ["pioupiou", 21], ["spectrio", 17], ["louveran", 15]]
  },
  lac: {
    label: "Lac Azuré", lv: [4, 9],
    table: [["bulleau", 38], ["mousserond", 20], ["lucioline", 19], ["anguivolt", 15], ["dracelet", 8]]
  }
};
function zoneAtKaelis(x, y) {
  if (y <= 7) return x >= 26 ? ZONES.rocher : ZONES.plaine;
  if (x <= 13) return ZONES.lac;
  if (x >= 27) return ZONES.foret;
  return ZONES.plaine;
}
function encounterFor(map, x, y) {
  if (map.useZones) return zoneAtKaelis(x, y);
  return map.enc || ZONES.plaine;
}
