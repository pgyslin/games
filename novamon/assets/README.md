# Dossier `assets/` — sprites et espèces personnalisés

Ce dossier est **vide par défaut** : tous les sprites du jeu sont dessinés par code.
Il permet deux types de personnalisation, sans modifier le code du jeu.

## 1. Remplacer le sprite d'une espèce

Déposez une image PNG (fond transparent conseillé) nommée d'après l'identifiant de l'espèce :

```
assets/flamizar.png
assets/aquano.png
assets/dracelior.png
...
```

Identifiants disponibles : `flamizar, pyroclast, aquano, torrentide, feuillune, sylvoria,
rongelec, pioupiou, rafalaile, mousserond, rocmite, spectrio, givrelin, vipoison, lucioline,
psylune, bulleau, dracelet, dracelior` (+ ceux ajoutés via `extra-species.json`).

L'image est affichée ancrée au sol, hauteur normalisée — une image d'environ 256×256 px fonctionne bien.

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
