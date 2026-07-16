# Privacy e statistiche d'uso

## Cosa resta sul tuo dispositivo

**Tutto ciò che ti riguarda.** Esercizi, schede, allenamenti, storico, statura, tema e voti
vivono in `localStorage`, sul tuo dispositivo. Non c'è registrazione, non c'è un account, non
c'è un server che conserva i tuoi dati. L'unico modo per portarli altrove è il backup JSON,
che scarichi tu.

Le uniche cose che escono dal dispositivo, e solo se le chiedi tu:

- un esercizio che **proponi alla community** (finisce nel catalogo pubblico del repository);
- un **voto** su un esercizio della community (nel repository finisce un hash anonimo del tuo
  dispositivo, mai un identificativo tuo: serve solo a evitare che una persona voti due volte);
- il **video YouTube** che apri (caricato solo quando premi play, dal dominio senza cookie
  `youtube-nocookie.com`);
- le **GIF degli esercizi del catalogo** (caricate da `raw.githubusercontent.com`, lo stesso
  dominio GitHub da cui arriva il catalogo della community: nessun cookie, nessun tracciamento).

## Statistiche d'uso (Umami)

Se l'istanza è configurata, l'app misura in forma anonima quali sezioni vengono usate, per
capire cosa migliorare. Usiamo **[Umami](https://umami.is)**, che è progettato per essere
conforme al GDPR:

- **nessun cookie** e nessuno spazio di archiviazione usato per tracciare;
- **nessun dato personale**: niente nome, email, account, contenuti;
- **nessun identificatore persistente**: non si costruisce un profilo e non si segue una
  persona tra siti o tra sessioni;
- **nessun indirizzo IP memorizzato** (usato solo, in transito, per derivare un dato aggregato
  e subito scartato);
- **nessun trasferimento fuori dall'UE** se l'istanza Umami è ospitata nell'UE.

Poiché non trattiamo dati personali né usiamo cookie non necessari, **non serve un banner di
consenso**. Manteniamo comunque il controllo dalla tua parte:

- lo script si carica **solo** se l'istanza ha configurato `VITE_UMAMI_SRC` e
  `VITE_UMAMI_WEBSITE_ID`: senza, l'app non contatta nessuno;
- se il tuo browser invia **Do Not Track**, le statistiche restano spente e non si possono
  accendere;
- puoi **disattivarle quando vuoi** dall'interruttore «Statistiche d'uso» in fondo all'app: la
  scelta resta salvata sul dispositivo e lo script viene rimosso dalla pagina.

L'unico evento inviato è il nome della sezione aperta (Esercizi, Schede, Allenamento, Storico).
Non inviamo mai i tuoi contenuti.

## Configurazione (per chi ospita l'app)

1. Crea un sito su Umami (cloud o self-hosted) e prendi lo **script URL** e il **website ID**.
2. In `Settings → Secrets and variables → Actions → Variables` del repository aggiungi:
   - `UMAMI_SRC` — l'URL dello script (es. `https://cloud.umami.is/script.js`)
   - `UMAMI_WEBSITE_ID` — l'id del sito
3. Il deploy su GitHub Pages li passa alla build come `VITE_UMAMI_SRC` e
   `VITE_UMAMI_WEBSITE_ID`. In locale, usa un file `.env.local` con le stesse variabili.

Senza queste variabili l'app non carica alcuno script e il pannello delle statistiche non
compare affatto.
