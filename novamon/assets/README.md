# Dossier `assets/` — sprites, sons et musiques

Ce dossier contient les assets du jeu (tous sous licence **CC0 / domaine public**),
ainsi que les points d'extension pour vos propres sprites.

## Sources et licences des packs utilisés

Tous les fichiers de ce dossier proviennent des packs suivants, tous publiés en
**CC0 1.0 (domaine public)** — utilisation libre, y compris commerciale, sans attribution
obligatoire (mentionnée ici par courtoisie) :

| Pack | Auteur | Licence | Utilisé pour |
|---|---|---|---|
| [Tiny Town](https://kenney.nl/assets/tiny-town) | Kenney | CC0 | tuiles d'herbe/fleurs/chemin, arbres, maisons, toits, panneau (`tiles/`, `obj/`) |
| [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) | Kenney | CC0 | murs intérieurs, rochers, PNJ (villageois, professeure, dresseurs, chevalier) (`chars/npc_*`) |
| [Roguelike/RPG pack](https://kenney.nl/assets/roguelike-rpg-pack) | Kenney | CC0 | eau, sable, parquet/ponton, tapis d'arène, buissons de hautes herbes, torche-lampadaire, fleurs |
| [Sokoban](https://kenney.nl/assets/sokoban) | Kenney | CC0 | héros 4 directions × 3 étapes de marche (`chars/hero_*`, casquette recolorée en bleu) |
| [Interface Sounds](https://kenney.nl/assets/interface-sounds) | Kenney | CC0 | sons de menus (`audio/select`, `confirm`, `back`, `error`) |
| [Impact Sounds](https://kenney.nl/assets/impact-sounds) | Kenney | CC0 | coups, pas (herbe/bois/sable) (`audio/hit`, `superhit`, `step*`…) |
| [Digital Audio](https://kenney.nl/assets/digital-audio) | Kenney | CC0 | sons rétro : capture, soin, K.O., fuite, rencontre, attaques (`audio/…`) |
| [RPG Audio](https://kenney.nl/assets/rpg-audio) | Kenney | CC0 | porte (transition de carte), secousse de Novaball, objets (`audio/door`, `shake`, `item`) |
| [Music Jingles](https://kenney.nl/assets/music-jingles) | Kenney | CC0 | jingles de niveau, badge et victoire (`audio/levelup`, `badge`, `victory`) |
| [Dungeon Crawl 32×32 tiles](https://opengameart.org/content/dungeon-crawl-32x32-tiles) | équipe DCSS (via OpenGameArt) | CC0 | sprites des créatures (`<id>.png`), plante en pot d'arène |
| [Chiptune Adventures](https://opengameart.org/content/4-chiptunes-adventure) | Juhani Junkala (OpenGameArt) | CC0 | musiques : titre, exploration/routes, forêt, combat (`audio/music_title`, `music_explore`, `music_forest`, `music_battle`) |
| [Town Theme (RPG)](https://opengameart.org/content/town-theme-rpg) | Bonsaiheldin (OpenGameArt) | CC0 | musique des villes (`audio/music_town.mp3`) |
| [Cave Theme](https://opengameart.org/content/cave-theme) | Clint Bellanger (OpenGameArt) | CC0 | musique des arènes / intérieurs (`audio/music_gym`) |

> ⚠️ Aucun sprite officiel Pokémon/Nintendo n'est utilisé : les créatures sont des
> **fakemons** originaux dont l'apparence provient du tileset CC0 de Dungeon Crawl.

## Organisation

```
assets/
├── <id>.png            sprite d'une espèce (ex. flamizar.png) — chargé en priorité
├── tiles/              tuiles de sol (herbe, chemin, sable, eau, tapis…)
├── obj/                décors « billboard » (arbres, maisons, rochers, lampadaires…)
├── chars/              héros (4 directions × 3 frames) et PNJ
└── audio/              effets sonores + musiques (Ogg Vorbis)
```

Si un fichier manque, le jeu retombe automatiquement sur son **rendu par code**
(anciennes formes vectorielles) : rien ne casse.

## 1. Remplacer le sprite d'une espèce

Déposez une image PNG (fond transparent conseillé) nommée d'après l'identifiant de l'espèce :

```
assets/flamizar.png
assets/aquano.png
...
```

Identifiants disponibles : `flamizar, pyroclast, aquano, torrentide, feuillune, sylvoria,
rongelec, pioupiou, rafalaile, mousserond, rocmite, spectrio, givrelin, vipoison, lucioline,
psylune, bulleau, dracelet, dracelior, louveran, scorpide, meduline, anguivolt, phantomite,
glacidra` (+ ceux ajoutés via `extra-species.json`).

L'image est affichée ancrée au sol, hauteur normalisée — 64 à 256 px de haut fonctionnent bien.

## 2. Ajouter de nouvelles espèces

Créez un fichier `assets/extra-species.json` (nécessite de servir le jeu via un serveur HTTP
local : `python3 -m http.server` puis http://localhost:8000). Exemple :

```json
[
  {
    "id": "brasiflor",
    "name": "Brasiflor",
    "types": ["Feu", "Plante"],
    "base": { "hp": 55, "atk": 62, "def": 50, "spd": 48 },
    "catch": 0.35,
    "xp": 80,
    "moves": [[1, "Charge"], [1, "Flammèche"], [10, "Fouet Lianes"], [18, "Lance-Flammes"]],
    "draw": { "shape": "quad", "main": "#d86a3c", "belly": "#ffe0b0", "accent": "#8a3218", "feat": ["leaf", "tailFlame"] },
    "desc": "Une fleur de braise qui éclot dans les cendres.",
    "zone": "foret",
    "weight": 20
  }
]
```

- `zone` (facultatif) : `plaine`, `foret`, `lac` ou `rocher` — ajoute l'espèce aux rencontres
  sauvages de cette zone, avec le poids `weight`.
- `draw.shape` : `blob`, `biped`, `quad`, `bird`, `serpent`, `fish` ou `ghost`.
- `draw.feat` : `earsPointy, earsRound, horns, tailFlame, tailBolt, leaf, petals, finHead,
  crest, wings, wingsFairy, aura, crystals, cheeks, spots, stripes, antennae, crescent, rocky, tailFin`.
- Ajoutez `assets/brasiflor.png` pour lui donner un sprite image au lieu du rendu par code.

## ⚠️ Droits d'auteur

N'ajoutez ici que des images que vous avez le droit d'utiliser : vos propres créations ou des
assets sous licence libre (CC0/CC-BY), par exemple [OpenGameArt](https://opengameart.org) ou
[Kenney](https://kenney.nl/assets). Les sprites officiels de jeux commerciaux (Pokémon, etc.)
sont protégés par le droit d'auteur et ne doivent pas être redistribués dans ce dépôt.
