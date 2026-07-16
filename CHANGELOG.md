# Changelog

Tutte le modifiche rilevanti del progetto, per release.

## 1.7.0 — 2026-07-16

Community, schede più veloci da comporre e una barra che ci sta (milestone M15).

### Community

- La sezione **Esercizi** si chiama **Community**: è la lista della community, e ora lo dice.
- Da ogni esercizio, **«Aggiungi alla scheda»**: scegli scheda (parte da quella attiva), giorno e
  serie×reps senza uscire dalla lista. Vale anche per gli esercizi della community: te ne resta
  una copia fra i tuoi, e se avevi già quel video **non viene duplicato**.

### Schede

- I **giorni** si scelgono da una **lista** (i sette della settimana e «Giorno A/B/C»), invece di
  scriverli: un «lunedi» senza accento diventava un giorno che l'allenamento del giorno non
  riconosceva. Un nome tuo («Petto e bicipiti») si scrive comunque, nel modale.
- Il pannello di importazione si chiama **«Importa una scheda»**: gli esercizi hanno la Community,
  le schede sono la cosa che ci si scambia per codice. Un codice di un singolo esercizio continua
  a funzionare.

### Rifiniture

- Sui telefoni stretti (320 px) la scritta della sezione scelta — **«Allenamento»**,
  «Impostazioni» — usciva dal suo tasto e finiva **sopra le icone vicine**. Ora la voce scelta si
  prende lo spazio che le altre non usano, e la scritta ci sta intera.

## 1.6.0 — 2026-07-15

Gruppi muscolari chiusi, spinner a modale, allenamento a carosello (milestone M14, issue #81–#85).

### Gruppi muscolari (M14)

- Il gruppo muscolare non è più testo libero: si sceglie da un **modale** con la lista dei gruppi,
  ed è **obbligatorio**. «Petto», «petto» e «PETTO» erano tre gruppi diversi nei filtri: ora sono
  lo stesso.
- Nei dati è un **codice** tradotto (come la difficoltà): in inglese l'app dice «Chest», non «Petto».
- Schema **v5**: i backup precedenti si importano come sempre — il testo esistente viene
  riconosciuto (sinonimi italiani e inglesi, senza badare a maiuscole e accenti) e ciò che non si
  riconosce finisce su «Altro».

### Numeri (M14)

- Via i pulsanti **+/−**: resta lo **spinner**, che si apre in un modale al centro dello schermo.
  Dentro c'è la rotella dei valori e un campo per scrivere, per i valori fuori scala.

### Allenamento (M14)

- La vista diventa un **carosello**: un esercizio per schermata, che scorre con lo **swipe**.
  Ogni card ha il **video** dell'esercizio e il **log delle serie**, riga per riga: una spunta
  registra la serie. Senza scheda attiva resta la registrazione libera.
- Il carosello ha anche le **frecce** indietro/avanti (con la rotella del mouse lo snap
  riagganciava sempre la card di partenza) e margini ai bordi: prima e ultima card si centrano,
  e un fling non salta gli esercizi.
- Un **timer di allenamento** dal pulsante flottante: un tocco avvia la sessione, registrare una
  serie fa partire **da sola la pausa**, un altro tocco la chiude (o ne apre una manuale), lo
  stop accanto ferma tutto. Solo in memoria: niente nel backup.
- Il pulsante «Nuova proposta» si **ritira con una transizione**, invece di saltare — e da
  ritirato mostra il «+» (la scritta, sfumando senza cedere larghezza, lo spingeva fuori:
  restava un cerchio vuoto).

## 1.5.0 — 2026-07-14

Difficoltà degli esercizi e rifiniture di interazione (milestone M13, issue #70–#73).

### Difficoltà (M13)

- Ogni esercizio ha un **grado di difficoltà** (facile / media / difficile): si sceglie alla
  proposta — **è obbligatorio** — compare come **badge** colorato sulla card e **filtra** la lista.
- Schema **v4**: i backup precedenti si importano come sempre, e i loro esercizi ricevono «media»
  (nessuno può indovinarla per loro).

### Interazione (M13)

- Via le **frecce native** dagli input numerici: restavano lì a fare il lavoro che già fanno la
  rotella e i pulsanti +/−.
- Il pulsante **«Nuova proposta»** arriva con la scritta e **si ritira a sola icona** appena si
  scorre: la lista si riprende lo spazio.
- Nella barra in basso, la sezione **selezionata si apre mostrando la sua etichetta**; le altre
  restano solo icona.

## 1.4.0 — 2026-07-14

Impostazioni, due lingue e input pensati per la palestra (milestone M12, issue #63–#68).

### Lingua (M12)

- **Italiano e inglese**, scelti da Impostazioni. Dizionari tipati l'uno sull'altro: una
  traduzione mancante **non compila**, non arriva in produzione.
- Il dominio (e il worker) lanciano **codici** d'errore, non frasi: `EMPTY_NAME`, non
  «Il nome dell'esercizio è obbligatorio». La frase la sceglie la lingua, al rendering.
- La lingua **non si deduce dal browser**: si sceglie, e resta. Nessuna sorpresa all'avvio.

### Impostazioni (M12)

- Nuova quinta sezione: **lingua**, **tema** (che lascia la barra in alto) e **backup**
  (che smette di comparire in fondo a ogni schermata).

### Proposta e input (M12)

- «Nuova proposta» diventa un **pulsante flottante** che apre il form in un **modale**;
  anche «Modifica» apre lo stesso modale, con i campi già compilati.
- Gli input numerici hanno una **rotella di valori** (carichi a passi di 2,5 kg, ripetizioni,
  stature) accanto ai pulsanti di incremento. Restano digitabili: i valori fuori scala si
  scrivono a mano.
- Il **volto offuscato non è più obbligatorio**: resta il consiglio (si guarda il movimento,
  non la persona), sparisce la spunta che bloccava la proposta.

## 1.3.0 — 2026-07-12

Identità visiva e statistiche d'uso rispettose della privacy (milestone M9, issue #43–#44).

### Logo (M9)

- Marchio vettoriale (manubrio inclinato nell'accento lime): barra dell'app, favicon,
  icone PWA 192/512 e **maskable** rigenerate dal vettoriale, `theme_color` allineato

### Statistiche d'uso conformi al GDPR (M9)

- Monitoraggio anonimo con **Umami**: nessun cookie, nessun dato personale, nessun
  identificatore persistente, nessun indirizzo IP conservato → **nessun banner di consenso**
- Lo script si carica **solo** se l'istanza è configurata (`VITE_UMAMI_SRC`,
  `VITE_UMAMI_WEBSITE_ID`): senza, l'app non contatta nessuno
- Il **Do Not Track** del browser è rispettato e l'utente può disattivare le statistiche
  dall'app in qualsiasi momento (lo script viene rimosso dalla pagina, la scelta resta salvata)
- L'unico evento inviato è il nome della sezione aperta: mai i contenuti dell'utente
- Nuova documentazione **[docs/PRIVACY.md](docs/PRIVACY.md)**

## 1.2.0 — 2026-07-12

Interfaccia più personale, statistiche sul lavoro svolto e community vera su GitHub
(milestone M8, issue #36–#41).

### Community condivisa su GitHub (M8)

- Gli esercizi proposti finiscono in `community/exercises.json` e i voti in
  `community/votes.json`, **nel repository**: un piccolo Cloudflare Worker (`worker/`)
  valida e committa; l'app legge i file direttamente da GitHub
- Gli esercizi della community compaiono in lista col badge «community»: si votano
  (un voto per dispositivo, hash anonimo) e si condividono, ma non si modificano
- La proposta non blocca nulla: l'esercizio è comunque salvato sul dispositivo, l'invio
  alla community è un extra che, se fallisce, lo dice e basta
- Senza configurazione la community è disattivata e l'app resta puramente locale
  (setup in `docs/COMMUNITY.md`)

### Statistiche (M8)

- Il grafico dello storico misura **quattro metriche**: peso massimo, ripetizioni totali,
  ripetizioni massime e volume (kg × ripetizioni)

### Interfaccia (M8)

- Nuovo tema con **accento lime** su superfici neutre calde, campi outlined arrotondati,
  card morbide e pill tonale nella navigazione: meno «Material di default»
- Si atterra sulla **lista della community**: il form di proposta è collassato dietro il
  bottone «Nuova proposta»
- Lighthouse sulla build di produzione: performance 96, accessibilità 100,
  best practices 100, SEO 100

## 1.1.0 — 2026-07-12

Redesign completo dell'interfaccia in **Material Design 3** con MUI (milestone M7, issue #31–#35).

### Interfaccia (M7)

- Tema MD3 **monocromo** chiaro/scuro (`src/theme.ts`) con palette ispirata ai mockup,
  font **Inter** self-hosted e componenti a pillola (bottoni, chip, navigazione)
- **BottomNavigation** MD3 fissa con le 4 viste (Esercizi, Schede, Allenamento, Storico)
  e AppBar sticky con selettore del tema
- Vista Esercizi: griglia di card (1–2 colonne) con miniatura video e overlay play,
  badge come Chip, form di proposta con campi Material
- Vista Schede: card per scheda con badge «✓ attiva», editor con riordino a IconButton,
  importazione con anteprima in riquadro
- Vista Allenamento: esercizi del giorno in riquadri con stato a Chip, stepper a pillola
  per peso/ripetizioni, serie registrate come chip rimovibili
- Vista Storico: card per andamento del carico e sessioni; grafico SVG invariato,
  ora colorato dalle variabili del tema MUI
- Backup come bottoni con icone; il tema auto/chiaro/scuro esistente ora guida anche
  il color scheme MUI (nessun cambio di persistenza o schema dati)
- Audit Lighthouse sulla build di produzione: performance 96, accessibilità 100,
  best practices 100, SEO 100; piramide di test invariata e verde (203 test)

## 1.0.0 — 2026-07-11

Prima release completa. Sviluppata per milestone (issue #1–#30 su GitHub).

### Esercizi e community (M2)

- Proposta di esercizi con video **solo YouTube** e conferma del volto offuscato con l'AI
- Fascia di statura consigliata per esercizio e filtro «Adatti a me» sulla statura del profilo
- Upvote stile Reddit: un voto per dispositivo, rimovibile; classifica per voti o per data
- Player YouTube «facade» rispettoso della privacy (nessuna connessione finché non premi play)

### Tracking dei pesi (M3)

- Registrazione delle sessioni (serie × ripetizioni × kg) con pulsanti rapidi da palestra
- **Suggerimento del carico**: tutte le serie ≥ 8 ripetizioni → +2,5 kg, altrimenti consolidamento
- Storico per giorno e grafico SVG dell'andamento del carico, con filtro 30/90 giorni

### Schede di allenamento e condivisione (M4)

- Schede organizzate per giorni (della settimana o generici) con target serie×ripetizioni
- Scheda attiva e **allenamento del giorno**: esercizi proposti con peso precompilato,
  «Fatto ✓» registra la sessione, giorni di riposo con il prossimo allenamento previsto
- **Condivisione senza server**: esercizi e schede complete in un codice compresso
  (lz-string) o link `#dati=…`, con anteprima e dedup sul video YouTube all'importazione

### Backup e PWA (M5)

- Export JSON datato (`open-gym-backup-<data>.json`) con versione dello schema e `exportedAt`
- Import con scelta **Sostituisci tutto / Unisci ai miei dati** (unione senza duplicati);
  file non validi rifiutati senza toccare i dati; migrazione automatica degli schemi vecchi
- PWA installabile e offline con aggiornamento **su richiesta** (banner «nuova versione»)
- Tema Auto/Chiaro/Scuro persistito, focus visibili, target touch ≥ 44 px, layout mobile 375 px

### Qualità e infrastruttura (M1, M6)

- Piramide di test completa: unit e integrazione (Vitest + Chai), BDD in italiano
  (Cucumber), E2E sulla build di produzione (Cypress) — CI GitHub Actions che blocca
  la build se un livello è rosso
- Audit Lighthouse sulla build di produzione: performance 99, accessibilità 100,
  best practices 100, SEO 100
- Deploy automatico su **GitHub Pages** da `main`; immagine **Docker** (nginx) su GHCR,
  taggata per versione a ogni release
- Documentazione: guida utente, guida per contributori, licenza MIT
