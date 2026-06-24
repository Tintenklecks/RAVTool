# JobRoom Helper

[Deutsch](README.md) | [English](readme.en.md) | Français | [Italiano](readme.it.md)

JobRoom Helper est une extension de navigateur pour un flux de travail manuel de LinkedIn vers Job-Room. Elle aide a reprendre les informations d'une offre d'emploi LinkedIn et a les inserer ensuite dans le formulaire Job-Room des recherches d'emploi.

L'outil ne postule pas automatiquement, ne soumet pas de formulaires et n'envoie pas vos donnees a un serveur separe. Il enregistre uniquement la derniere offre lue localement dans l'extension du navigateur.

## Fonctionnalites

Le flux de travail habituel est le suivant :

1. Ouvrir une offre d'emploi LinkedIn dans le navigateur.
2. Cliquer sur **READ LinkedIn job** dans l'extension.
3. Ouvrir la page Job-Room pour saisir une recherche d'emploi.
4. Cliquer sur **PASTE into Job-Room** dans l'extension.
5. Verifier les donnees inserees et envoyer le formulaire manuellement.

L'extension essaie de reprendre les informations suivantes :

- titre du poste
- entreprise
- lieu
- URL de l'offre
- date de candidature

Lorsque les champs sont reconnus, elle essaie egalement de definir des valeurs par defaut utiles :

- candidature suite a une assignation ORP/RAV : `Non`
- taux d'activite : `Temps plein`
- resultat de la candidature : `Encore ouvert`
- type de candidature : `Electronique`

## Installation principale dans Chrome

Chrome est actuellement le moyen recommande et le plus simple d'utiliser JobRoom Helper.

1. Telecharger ou cloner ce depot.
2. Ouvrir Chrome.
3. Saisir `chrome://extensions` dans la barre d'adresse.
4. Activer **Developer mode** / **Mode developpeur** en haut a droite.
5. Cliquer sur **Load unpacked** / **Charger l'extension non empaquetee**.
6. Selectionner le dossier `jobroom-helper` de ce projet.
7. Epingler l'extension dans Chrome pour y acceder rapidement.

Chrome doit etre en mode developpeur pour les extensions locales qui ne sont pas installees via le Chrome Web Store. C'est normal pour une extension chargee manuellement.

## Utilisation

Apres l'installation :

1. Ouvrir une page d'offre LinkedIn.
2. Ouvrir JobRoom Helper.
3. Cliquer sur **READ LinkedIn job**.
4. Ouvrir Job-Room et aller au formulaire de saisie des recherches d'emploi.
5. Ouvrir a nouveau JobRoom Helper.
6. Cliquer sur **PASTE into Job-Room**.
7. Controler les champs, puis enregistrer ou envoyer manuellement.

## Confidentialite

JobRoom Helper fonctionne localement dans le navigateur. L'extension n'enregistre que la derniere offre lue dans `chrome.storage.local`. Elle n'envoie aucune donnee a un serveur propre et ne soumet pas les formulaires automatiquement.

L'extension a besoin d'un acces aux pages LinkedIn et Job-Room afin de lire les informations de l'offre et de remplir les champs sur ces pages.

## Safari, macOS et iOS

Une variante Safari/macOS est deja preparee dans ce projet. Les versions iOS et macOS devraient bientot etre disponibles dans l'App Store. Jusque-la, Chrome avec l'extension chargee localement reste la voie d'installation recommandee.

## Structure du projet

- `jobroom-helper/` : extension Chrome
- `jobroom-helper-safari/` : source Safari WebExtension
- `safari-build/` : projet Xcode genere pour Safari/macOS/iOS
- `deploy/` : textes et assets pour les publications dans les stores
- `dist/` : builds empaquetes de l'extension
