# Contribuire a Open Gym

Grazie dell'interesse! Questa guida ti porta da zero a sviluppo, test e build funzionanti.

## Setup

Prerequisiti: **Node.js ≥ 22** (in CI si usa Node 26) e npm.

```bash
git clone https://github.com/os3albert/open-gym-app.git
cd open-gym-app
npm ci
npm run dev          # http://localhost:5173
```

Build e anteprima di produzione:

```bash
npm run build        # typecheck + vite build (PWA inclusa)
npm run preview      # serve dist/ su http://localhost:4173
docker compose up --build   # immagine di produzione su http://localhost:8080
```

## Vincoli architetturali (non negoziabili)

- **Solo frontend**: nessun backend, nessuna registrazione. Tutto lo stato vive in
  `localStorage` (schema versionato con migrazioni: mai rompere i backup vecchi).
- **Video solo come link YouTube** (validati in `services/youtube.ts`): niente upload/hosting.
- Dipendenze a senso unico: `components/` → `hooks/` → `domain/` + `services/`.
  Dominio e servizi sono **funzioni pure senza React né browser API**: è ciò che permette
  agli step Cucumber di esercitarli direttamente in Node.
- I messaggi di errore in italiano sono **contratto**: esportati come costanti e asseriti
  da UI, test, step BDD e spec Cypress. Non riformularli senza aggiornare tutto.
- I componenti espongono attributi `data-cy` usati dalle spec Cypress: non rimuoverli.

Altri dettagli operativi (trappole comprese) sono in [CLAUDE.md](CLAUDE.md).

## Piramide di test

La CI esegue **tutto** prima della build: un livello rosso blocca la pipeline.

| Livello         | Dove                                                            | Comando                                                       |
| --------------- | --------------------------------------------------------------- | ------------------------------------------------------------- |
| Analisi statica | ESLint, Prettier, tsc                                           | `npm run lint` · `npm run format:check` · `npm run typecheck` |
| Unit            | `tests/unit/` (Vitest, logica pura)                             | `npm run test:unit`                                           |
| Integrazione    | `tests/integration/` (Vitest + jsdom, App reale + localStorage) | `npm run test:integration`                                    |
| BDD             | `features/` (Cucumber, **Gherkin in italiano**)                 | `npm run test:bdd`                                            |
| E2E             | `cypress/e2e/` (build di produzione via `vite preview`)         | `npm run test:e2e`                                            |

Tutto insieme, come in CI: `npm run test:all`.

### Scrivere scenari BDD

- I file `.feature` iniziano con `# language: it` e usano le parole chiave italiane
  (`Funzionalità`, `Scenario`, `Dato/Quando/Allora`).
- Gli step (in `features/steps/*.ts`) esercitano **direttamente il dominio puro** in Node,
  senza browser; lo stato dello scenario vive in `features/support/world.ts`.
- Ogni funzionalità utente nuova dovrebbe arrivare con: scenari BDD sui criteri di
  accettazione, unit test del dominio, un test di integrazione del flusso UI e,
  se è un percorso critico, una spec Cypress.

## Convenzioni

- Codice e identificatori in **inglese**; testi UI, messaggi di errore, commenti,
  scenari BDD e documentazione in **italiano**.
- Prettier e ESLint sono la fonte di verità dello stile (`npm run format`, `npm run lint`).
- Commit: un cambiamento logico per commit, messaggio in italiano al presente
  (vedi `git log` per lo stile). Le PR partono da `main` e devono avere la CI verde.

## Rilasci

Il deploy su GitHub Pages parte automaticamente da `main` a CI verde. Le release
si tagliano con un tag `v*` (es. `v1.0.0`): il workflow di release crea la release
GitHub e pubblica l'immagine Docker versionata su GHCR. La versione in `package.json`
va allineata al tag.
