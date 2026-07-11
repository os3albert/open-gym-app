# Changelog

Tutte le modifiche rilevanti del progetto, per release.

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
