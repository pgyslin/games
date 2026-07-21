# 🐉 Novamon — RPG 2D-HD

Un RPG de capture de créatures dans le style des jeux de monstres classiques, avec un rendu
« HD-2D » inspiré d'Octopath Traveler : sprites pixel-art nets sur des décors adoucis,
profondeur de champ, lumière chaude et lucioles. Entièrement contenu dans des fichiers
HTML/JS — **aucune dépendance, aucun asset externe** : tous les sprites sont dessinés par code.

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

## 🗺️ La région de Kaelis

9 cartes connectées, chacune avec ses rencontres et son ambiance :

- **Bourg Kaelis** — le village de départ (labo de la Prof. Aralia, lac, plaine, forêt, crêtes) ;
- **Route 1** → **Verdicité**, la ville-jardin et son **arène Plante** (Cheffe Sylvia) ;
- **Route 2 — Forêt Sombre** → **Rocheville** et son **arène Roche** (Chef Magnus) ;
- **Route 3 — Prés du Lac** → **Cité Azur**, la cité côtière et son **arène Eau** (Cheffe Marina).

Sur les routes, des **dresseurs** vous défient (parlez-leur avec E) : combats en équipe,
récompenses, et **3 badges** à conquérir auprès des chefs d'arène.

## ✨ Contenu

- **19 fakemons originaux** répartis sur 13 types, avec table des types, STAB, stats,
  montée de niveau, apprentissage d'attaques et **évolutions**.
- **Combats au tour par tour** : sauvages et dresseurs (équipes multiples, fuite et capture
  interdites contre un dresseur), IA qui choisit ses attaques selon leur efficacité.
- **Capture** à la Novaball (taux selon PV restants et rareté), équipe de 6 + boîte.
- **Novadex**, centre de soins dans chaque ville (point de réapparition), objets à ramasser,
  starter à choisir, **sauvegarde automatique** (localStorage).

## 🎨 Rendu « HD-2D »

- Sprites **pixel-art** : personnages et créatures rendus en basse résolution puis ré-agrandis
  au plus proche voisin (pixels nets sur décors doux) ;
- **Profondeur de champ** tilt-shift (haut/bas de l'écran adoucis) ;
- **Étalonnage cinématique** (centre chaud, bords froids), vignettage, rayons de soleil ;
- **Lampadaires** avec halos, fenêtres éclairées la nuit, **lucioles**, fontaines animées ;
- Cycle **jour/nuit**, eau animée, hautes herbes qui ondulent, ombres portées des arbres ;
- Arrière-plans de combat adoucis (bokeh) avec sprites nets au premier plan ;
- Le tout désactivable dans le menu (⚙️ → « Effets HD ») pour les petites machines.

## 🎨 Ajouter ses propres sprites ou créatures

Voir [`assets/README.md`](assets/README.md) :

- déposer un fichier `assets/<id>.png` (ex. `assets/flamizar.png`) remplace le sprite dessiné
  par code pour cette espèce ;
- `assets/extra-species.json` permet d'ajouter de nouvelles espèces (stats, types, attaques,
  zone d'apparition) sans toucher au code.

⚠️ Le jeu est livré **sans aucun asset propriétaire** : n'y ajoutez que des images que vous avez
le droit d'utiliser (créations personnelles, assets sous licence libre type CC0 —
par ex. [OpenGameArt](https://opengameart.org) ou [Kenney](https://kenney.nl/assets)).
