# JobRoom Helper

Sprachen: Deutsch | [English](readme.en.md) | [Français](readme.fr.md) | [Italiano](readme.it.md)

JobRoom Helper ist eine Browser-Erweiterung fuer einen manuellen LinkedIn-zu-Job-Room-Workflow. Sie hilft dabei, Angaben aus einer LinkedIn-Stellenanzeige zu uebernehmen und anschliessend in die Job-Room-Maske fuer Arbeitsbemuehungen einzutragen.

Das Tool liest keine Bewerbungen automatisch aus, bewirbt sich nicht selbststaendig und sendet keine Formulare ab. Es speichert nur den zuletzt ausgelesenen Job lokal in der Browser-Erweiterung.

## Was das Tool macht

Der typische Ablauf ist:

1. Eine LinkedIn-Stellenanzeige im Browser oeffnen.
2. In der Erweiterung auf **READ LinkedIn job** klicken.
3. Die Arbeitsbemuehungs-Seite in Job-Room oeffnen.
4. In der Erweiterung auf **PASTE into Job-Room** klicken.
5. Die eingefuegten Angaben pruefen und das Formular manuell absenden.

Die Erweiterung versucht unter anderem folgende Angaben zu uebernehmen:

- Stellentitel
- Unternehmen
- Standort
- Job-URL
- Bewerbungsdatum

Zusätzlich setzt sie, soweit die Felder erkannt werden, sinnvolle Standardwerte wie:

- Bewerbung aufgrund einer RAV-Zuweisung: `Nein`
- Arbeitspensum: `Vollzeit`
- Ergebnis der Bewerbung: `Noch offen`
- Bewerbungsart: `Elektronisch`

## Primaere Installation in Chrome

Aktuell ist Chrome der empfohlene und einfachste Weg, JobRoom Helper zu verwenden.

1. Dieses Repository herunterladen oder klonen.
2. Chrome oeffnen.
3. `chrome://extensions` in die Adresszeile eingeben.
4. Oben rechts **Developer mode** / **Entwicklermodus** aktivieren.
5. Auf **Load unpacked** / **Entpackte Erweiterung laden** klicken.
6. Den Ordner `jobroom-helper` aus diesem Projekt auswaehlen.
7. Die Erweiterung in Chrome anpinnen, damit sie schnell erreichbar ist.

Chrome muss fuer lokale, nicht ueber den Chrome Web Store installierte Erweiterungen im Entwicklermodus laufen. Das ist normal fuer eine manuell geladene Extension.

## Nutzung

Nach der Installation:

1. LinkedIn-Jobseite oeffnen.
2. JobRoom Helper anklicken.
3. **READ LinkedIn job** ausfuehren.
4. Job-Room oeffnen und zur Erfassung der Arbeitsbemuehung wechseln.
5. JobRoom Helper erneut anklicken.
6. **PASTE into Job-Room** ausfuehren.
7. Eingaben kontrollieren und manuell speichern oder absenden.

## Datenschutz

JobRoom Helper arbeitet lokal im Browser. Die Erweiterung speichert nur den zuletzt gelesenen Job in `chrome.storage.local`. Sie uebermittelt keine Daten an einen eigenen Server und sendet keine Formulare automatisch ab.

Die Erweiterung benoetigt Zugriff auf LinkedIn- und Job-Room-Seiten, damit sie dort Inhalte lesen beziehungsweise Felder ausfuellen kann.

## Safari, macOS und iOS

Eine Safari-/macOS-Variante ist im Projekt bereits vorbereitet. Die iOS- und macOS-Versionen sollen bald ueber den App Store verfuegbar sein. Bis dahin ist Chrome mit der lokal geladenen Erweiterung der empfohlene Installationsweg.

## Projektstruktur

- `jobroom-helper/`: Chrome-Erweiterung
- `jobroom-helper-safari/`: Safari-WebExtension-Quelle
- `safari-build/`: generiertes Xcode-Projekt fuer Safari/macOS/iOS
- `deploy/`: Texte und Assets fuer Store-Veröffentlichungen
- `dist/`: gepackte Erweiterungen
