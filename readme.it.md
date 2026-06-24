# JobRoom Helper

[Deutsch](README.md) | [English](readme.en.md) | [Français](readme.fr.md) | Italiano

JobRoom Helper e un'estensione del browser per un flusso di lavoro manuale da LinkedIn a Job-Room. Aiuta a copiare i dettagli di un'offerta di lavoro LinkedIn e a inserirli nel modulo Job-Room per gli sforzi di ricerca lavoro.

Lo strumento non si candida automaticamente, non invia moduli e non trasmette i tuoi dati a un backend separato. Memorizza solo l'ultimo annuncio letto localmente nell'estensione del browser.

## Cosa fa

Il flusso tipico e:

1. Aprire un'offerta di lavoro LinkedIn nel browser.
2. Fare clic su **READ LinkedIn job** nell'estensione.
3. Aprire la pagina Job-Room per l'inserimento degli sforzi di ricerca lavoro.
4. Fare clic su **PASTE into Job-Room** nell'estensione.
5. Controllare i dati inseriti e inviare il modulo manualmente.

L'estensione prova a rilevare:

- titolo della posizione
- azienda
- localita
- URL dell'offerta
- data della candidatura

Quando i campi vengono riconosciuti, prova anche a impostare valori predefiniti utili:

- candidatura basata su un'assegnazione RAV/URC: `No`
- grado di occupazione: `Tempo pieno`
- risultato della candidatura: `Ancora aperto`
- metodo di candidatura: `Elettronico`

## Installazione principale in Chrome

Chrome e attualmente il modo consigliato e piu semplice per usare JobRoom Helper.

1. Scaricare o clonare questo repository.
2. Aprire Chrome.
3. Inserire `chrome://extensions` nella barra degli indirizzi.
4. Attivare **Developer mode** / **Modalita sviluppatore** in alto a destra.
5. Fare clic su **Load unpacked** / **Carica estensione non pacchettizzata**.
6. Selezionare la cartella `jobroom-helper` di questo progetto.
7. Fissare l'estensione in Chrome per averla sempre a portata di mano.

Chrome deve essere in modalita sviluppatore per le estensioni locali non installate tramite il Chrome Web Store. Questo e normale per un'estensione caricata manualmente.

## Utilizzo

Dopo l'installazione:

1. Aprire una pagina di lavoro LinkedIn.
2. Aprire JobRoom Helper.
3. Fare clic su **READ LinkedIn job**.
4. Aprire Job-Room e andare al modulo per l'inserimento degli sforzi di ricerca lavoro.
5. Aprire di nuovo JobRoom Helper.
6. Fare clic su **PASTE into Job-Room**.
7. Controllare i campi, poi salvare o inviare manualmente.

## Privacy

JobRoom Helper funziona localmente nel browser. L'estensione memorizza solo l'ultimo annuncio letto in `chrome.storage.local`. Non invia dati a un server proprio e non invia moduli automaticamente.

L'estensione ha bisogno dell'accesso alle pagine LinkedIn e Job-Room per leggere i dettagli dell'offerta e compilare i campi su quelle pagine.

## Safari, macOS e iOS

Una variante Safari/macOS e gia preparata in questo progetto. Le versioni iOS e macOS dovrebbero essere presto disponibili nell'App Store. Fino ad allora, Chrome con l'estensione caricata localmente resta il percorso di installazione consigliato.

## Struttura del progetto

- `jobroom-helper/`: estensione Chrome
- `jobroom-helper-safari/`: sorgente Safari WebExtension
- `safari-build/`: progetto Xcode generato per Safari/macOS/iOS
- `deploy/`: testi e asset per la pubblicazione negli store
- `dist/`: build pacchettizzate dell'estensione
