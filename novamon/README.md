# 🐉 Novamon — RPG 2D-HD

Un RPG de capture de créatures dans le style des jeux de monstres classiques, entièrement contenu
dans des fichiers HTML/JS — **aucune dépendance, aucun asset externe** : tous les sprites sont
dessinés par code (rendu vectoriel « 2D-HD » : dégradés, lumières, ombres, animations).

## ▶️ Jouer

Ouvrir simplement `index.html` dans un navigateur. C'est tout.

> Pour utiliser le fichier optionnel `assets/extra-species.json`, il faut servir le dossier via un
> petit serveur local (`python3 -m http.server` dans ce dossier, puis http://localhost:8000).

## 🎮 Contrôles

| Action | Touche |
|---|---|
| Se déplacer | ZQSD / WASD / flèches |
| Courir | Maj (maintenu) |
| Interagir / passer les dialogues | E ou Entrée |
| Menu | Échap |
| Mobile | Croix directionnelle + bouton E à l'écran |

## ✨ Contenu

- **Région de Kaelis** : village, plaine, lac, forêt, crêtes rocheuses — chaque zone a sa propre
  table de rencontres et son niveau de difficulté.
- **19 fakemons originaux** répartis sur 13 types (Feu, Eau, Plante, Électrik, Spectre, Dragon…),
  avec table des types, STAB, stats, montée de niveau, apprentissage d'attaques et **évolutions**.
- **Combats au tour par tour** : attaques, sac, changement de Novamon, fuite, IA ennemie qui
  choisit ses attaques selon leur efficacité.
- **Capture** à la Novaball (le taux dépend des PV restants et de la rareté de l'espèce),
  équipe de 6 + boîte de stockage.
- **Novadex** : encyclopédie des espèces vues et capturées, avec descriptions.
- **Centre de soins**, objets à ramasser sur la carte, starter à choisir chez la Prof. Aralia.
- **Sauvegarde automatique** (localStorage) : bouton « Continuer » sur l'écran titre.
- Effets « 2D-HD » : cycle jour/nuit, eau animée, hautes herbes qui ondulent, particules,
  tremblement d'écran, vignettage, éclairage doux.

## 🎨 Ajouter ses propres sprites ou créatures

Voir [`assets/README.md`](assets/README.md) :

- déposer un fichier `assets/<id>.png` (ex. `assets/flamizar.png`) remplace le sprite dessiné
  par code pour cette espèce ;
- `assets/extra-species.json` permet d'ajouter de nouvelles espèces (stats, types, attaques,
  zone d'apparition) sans toucher au code.

⚠️ Le jeu est livré **sans aucun asset propriétaire** : n'y ajoutez que des images que vous avez
le droit d'utiliser (créations personnelles, assets sous licence libre type CC0 —
par ex. [OpenGameArt](https://opengameart.org) ou [Kenney](https://kenney.nl/assets)).
