# 🏋️ Open Gym

[![CI](https://github.com/os3albert/open-gym-app/actions/workflows/ci.yml/badge.svg)](https://github.com/os3albert/open-gym-app/actions/workflows/ci.yml)
[![Licenza MIT](https://img.shields.io/badge/licenza-MIT-blue.svg)](LICENSE)

Piattaforma open source di esercizi da palestra, stile Reddit: la community propone
esercizi tarati sulla statura, tu li voti, registri i pesi e costruisci schede di
allenamento condivisibili. **Solo frontend, nessuna registrazione**: i dati vivono
sul tuo dispositivo.

**▶ Prova l'app: https://os3albert.github.io/open-gym-app/**

## Funzionalità

- **Esercizi della community** — proposte con video **YouTube** (volto offuscato con
  l'AI: si valuta l'esercizio, non la persona), fascia di statura consigliata,
  upvote per dispositivo, filtri per statura e gruppo muscolare.
- **Tracking dei pesi** — serie, ripetizioni e carico con suggerimento automatico
  (tutte le serie ≥ 8 ripetizioni → +2,5 kg, altrimenti consolidamento) e grafico
  dell'andamento per esercizio.
- **Schede di allenamento** — organizzate per giorni (della settimana o generici),
  una attiva che propone l'**allenamento del giorno** con i pesi precompilati.
- **Condivisione senza server** — esercizi e schede complete viaggiano in un codice
  compresso o in un link, con anteprima e dedup all'importazione.
- **Backup JSON** — export datato di tutti i dati e import con scelta
  «Sostituisci tutto» o «Unisci», con migrazione automatica degli schemi vecchi.
- **PWA** — installabile, funziona offline (i video richiedono rete), aggiornamenti
  su richiesta, tema chiaro/scuro.

## Documentazione

- **[Guida utente](docs/GUIDA_UTENTE.md)** — come usare l'app, backup compreso.
- **[Guida per contributori](CONTRIBUTING.md)** — setup, piramide di test, convenzioni.
- **[Piano di progetto](docs/PROJECT_PLAN.md)** — milestone, issue e stime.

## Sviluppo

Stack: **React 19 + TypeScript + Vite** (PWA via vite-plugin-pwa) · test **Vitest + Chai**,
**Cucumber** (BDD, Gherkin in italiano), **Cypress** (E2E) · CI con **GitHub Actions** ·
**Docker** per l'hosting.

```bash
npm ci
npm run dev          # sviluppo su http://localhost:5173
npm test             # test unitari e di integrazione
npm run test:bdd     # scenari BDD (features/*.feature)
npm run test:e2e     # test end-to-end con Cypress (build di produzione)
npm run test:all     # tutto, come in CI
docker compose up --build   # app di produzione su http://localhost:8080
```

La pipeline CI esegue analisi statica e **tutti** i test prima della build; da `main`
partono il deploy su GitHub Pages e la pubblicazione dell'immagine Docker su GHCR
(`ghcr.io/os3albert/open-gym-app`). I tag `v*` creano la release GitHub con l'immagine
versionata.

## Principi di prodotto

Nati con il progetto e tuttora vincolanti:

- niente backend e niente registrazione: l'app funziona interamente lato client,
  con i dati in localStorage e backup JSON manuali;
- i video degli esercizi sono **solo link YouTube** (nessun hosting di file) e il volto
  deve essere offuscato con l'AI;
- gli esercizi si propongono in base alla statura, il pubblico li vota come su Reddit;
- lo storico dei pesi serve a proporre il carico giusto quando rifai un esercizio;
- la scheda di allenamento propone gli esercizi della giornata senza doverli cercare,
  e schede ed esercizi si possono proporre ad altri utenti.

## Licenza

[MIT](LICENSE)
