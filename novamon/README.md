# 🐉 Novamon — RPG 2D-HD

Un RPG de capture de créatures dans le style des jeux de monstres classiques, avec un rendu
« HD-2D » inspiré d'Octopath Traveler : sprites pixel-art nets sur des décors adoucis,
profondeur de champ, lumière chaude et lucioles. Entièrement contenu dans des fichiers
HTML/JS — **aucune dépendance, aucun serveur, aucun CDN**. Les graphismes, sons et musiques
proviennent de **packs sous licence libre CC0** (Kenney, Dungeon Crawl, Juhani Junkala — voir
[`assets/README.md`](assets/README.md)), avec un repli « dessiné par code » si un fichier manque.

## ▶️ Jouer

Ouvrir simplement `index.html` dans un navigateur. C'est tout — le jeu fonctionne
hors ligne, images et shaders compris (les images sont aussi embarquées en data-URI
dans `js/assets-data.js` pour contourner les restrictions `file://`).

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

- **25 fakemons originaux** répartis sur 13 types, avec table des types, STAB, stats,
  montée de niveau, apprentissage d'attaques et **évolutions** — dont 6 espèces récentes :
  Louveran, Scorpide, Méduline, Anguivolt, Phantomite et le rarissime Glacidra.
- **Combats au tour par tour** : sauvages et dresseurs (équipes multiples, fuite et capture
  interdites contre un dresseur), IA qui choisit ses attaques selon leur efficacité.
- **Capture** à la Novaball (taux selon PV restants et rareté), équipe de 6 + boîte.
- **Novadex**, centre de soins dans chaque ville (point de réapparition), objets à ramasser,
  starter à choisir, **sauvegarde automatique** (localStorage).

## 🔊 Sons et musiques

- **Effets sonores CC0** (packs Kenney) : menus, coups (normal / super efficace / peu efficace),
  K.O., lancer, secousses et capture de Novaball, soin, montée de niveau, badge, victoire,
  bruits de pas selon le sol (herbe, bois, sable), portes et transitions de carte,
  sons d'attaque par type (flammes, bulles, étincelles…).
- **Trois musiques d'ambiance en boucle** (Juhani Junkala, CC0) : écran titre, exploration
  et combat.
- Volumes **réglables séparément** (effets / musique) et sourdine dans le menu (⚙️).

## 💥 Effets visuels

- Combats : **traînées et impacts par type d'attaque** (flammes, éclairs, feuilles, bulles,
  éclats de glace, rochers, volutes spectrales, étoiles féériques…), **onde de choc** au K.O.,
  **pluie d'étoiles** à la capture, **aura lumineuse** à l'évolution, **flash directionnel**
  à l'entrée des Novamon.
- Monde : feuilles qui tombent en forêt, **poussière de pas** en courant, **éclaboussures**
  au bord de l'eau, **météo aléatoire** (halo doré de beau temps, pluie avec voile et brume).

## 📦 Vue « Paper 3D » (style Paper Mario)

Par défaut, le monde s'affiche comme un **diorama en papier** : le sol est projeté en
perspective 3D (il file vers l'horizon), tandis que les arbres, maisons, murs et personnages
sont des **sprites plats dressés** comme des découpes de carton, triés par profondeur.
Le héros **se retourne comme une feuille de papier** quand il change de direction, le ciel
affiche collines, nuages et soleil/lune selon l'heure, et les intérieurs d'arène deviennent
de vraies salles en volume. Basculez entre « Paper 3D » et « 2D classique » dans le
menu (⚙️ → « Vue »).

## 🎨 Rendu « HD-2D » et shaders

- Tuiles, décors, personnages et créatures issus de **tilesets CC0** (Tiny Town,
  Tiny Dungeon, Roguelike/RPG, Sokoban, Dungeon Crawl 32×32) — héros en 4 directions
  avec cycle de marche, chefs d'arène teintés à la couleur de leur robe ;
- **Post-traitement WebGL** (option « Effets HD ») : bloom, profondeur de champ tilt-shift,
  grain léger animé, courbe de couleurs (centre chaud, bords froids). Si WebGL est
  indisponible ou trop lent (rendu logiciel), le jeu **revient automatiquement** au
  pipeline canvas 2D d'origine ;
- **Lampadaires-torches** avec halos, fenêtres éclairées la nuit, **lucioles**, fontaines animées ;
- Cycle **jour/nuit**, eau animée, hautes herbes qui ondulent, ombres portées des arbres ;
- Arrière-plans de combat adoucis (bokeh) avec sprites nets au premier plan ;
- Le tout désactivable dans le menu (⚙️ → « Effets HD ») pour les petites machines.

## 🎨 Ajouter ses propres sprites ou créatures

Voir [`assets/README.md`](assets/README.md) :

- déposer un fichier `assets/<id>.png` (ex. `assets/flamizar.png`) remplace le sprite de
  cette espèce ;
- `assets/extra-species.json` permet d'ajouter de nouvelles espèces (stats, types, attaques,
  zone d'apparition) sans toucher au code.

⚠️ Le jeu n'embarque **aucun asset propriétaire** : uniquement des packs CC0 (sources et
licences détaillées dans [`assets/README.md`](assets/README.md)). N'y ajoutez que des images
que vous avez le droit d'utiliser (créations personnelles ou licences libres type CC0 —
par ex. [OpenGameArt](https://opengameart.org) ou [Kenney](https://kenney.nl/assets)).
