# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                # dev server Vite (http://localhost:5173)
npm run build              # typecheck (tsc, incl. cypress/tsconfig.json) + vite build
npm run lint               # ESLint (flat config)
npm run format:check       # Prettier check (format per scrivere)
npm run typecheck          # tsc su tsconfig.json + cypress/tsconfig.json

npm test                   # Vitest: unit + integration (jsdom)
npm run test:unit          # solo tests/unit
npm run test:integration   # solo tests/integration
npm test -- tests/unit/youtube.test.ts         # un singolo file
npm test -- -t "propone un esercizio"          # un singolo test per nome

npm run test:bdd           # Cucumber (features/*.feature, Gherkin in italiano)
npm run test:e2e           # builda, avvia vite preview :4173, esegue Cypress headless
npm run test:e2e:open      # Cypress interattivo contro il dev server :5173
npm run test:all           # lint + format + jest + bdd + e2e (stessi gate della CI)

docker compose up --build  # immagine di produzione su http://localhost:8080
```

## Stack (decisione registrata)

React 19 + TypeScript + Vite, PWA via `vite-plugin-pwa` (scelto rispetto a Vue per l'ecosistema di testing richiesto: Testing Library/Cypress/Cucumber di prima classe). Test: **Vitest** (runner Vite-nativo, config nel blocco `test` di `vite.config.ts`) con asserzioni sia stile Jest sia **Chai**; BDD con `@cucumber/cucumber`; E2E con Cypress. Nessun backend: tutto lo stato vive in localStorage.

## Architettura

Dipendenze a senso unico: `components/` → `hooks/` → `domain/` + `services/`. Dominio e servizi sono **funzioni pure senza React né browser API** (eccetto `storage.ts` che accetta uno `Storage` iniettabile): è ciò che permette agli step Cucumber di esercitarli direttamente in Node, senza browser.

- `src/domain/types.ts` — `AppData` (schema v3: esercizi, schede con `days[].entries` (esercizio+serie×reps) e `activePlanId`, attività, `profile.statureCm`, `votedExerciseIds`) è l'unità di persistenza E il formato di backup JSON: ogni campo nuovo va gestito anche nel validatore di `importExport.ts` e nel round-trip test. Se cambi lo schema, incrementa `CURRENT_SCHEMA_VERSION` e aggiungi la migrazione in `services/migrations.ts` (l'import migra sempre i backup vecchi: mai romperli).
- `src/domain/exercises.ts` — reducer puri (add/upvote/rank); la validazione lancia errori con messaggi in italiano che sono **contratto**: UI, test Jest, step BDD e spec Cypress asseriscono su quelle stringhe esatte (esportate come costanti, es. `INVALID_YOUTUBE_LINK_ERROR`).
- `src/services/importExport.ts` — export/import JSON con validazione strutturale; `storage.ts` vi delega (dati corrotti → stato vuoto, mai crash).
- `src/hooks/useAppData.ts` — unico punto di contatto stato↔localStorage: ogni modifica passa da `commit()` che salva subito e intercetta la quota piena. Niente salvataggio al mount: se i dati erano corrotti restano su disco finché l'utente non agisce. La validazione che può lanciare avviene PRIMA del commit, mai dentro un updater React.
- Il voto è un toggle per dispositivo (`toggleVote` + `votedExerciseIds`): mai incrementare i voti direttamente. I filtri (`domain/filters.ts`) e la vista corrente vivono nella query string (`hooks/useFilters.ts`, `hooks/useView.ts`): chi scrive parametri parte SEMPRE dai parametri correnti, mai da `new URLSearchParams()` vuoto, o cancella quelli altrui.
- Tracking pesi: `domain/activity.ts` (una sessione = record per esercizio+giorno, date locali `YYYY-MM-DD` da `utils/date.ts`); il suggerimento del carico precompila i campi in `WorkoutSession` via `services/weightSuggestion.ts`. Il grafico dello storico è SVG custom (`TrendChart`) senza librerie.
- Schede (`domain/plans.ts`): una sola attiva per dispositivo (`activePlanId`); l'allenamento del giorno (`TodayWorkout`) fa match dei nomi giorno sui giorni della settimana italiani (`utils/date.ts: weekdayNameIt`), i giorni generici («Giorno A») si scelgono a mano. `deleteExercise` ripulisce anche le `entries` delle schede: mai riferimenti pendenti.
- Condivisione senza backend (`services/share.ts`): payload JSON compresso con lz-string in codice URL-safe, apribile anche da link con fragment `#dati=…` (consumato in `App.tsx` al mount). La scheda condivisa INCORPORA gli esercizi; l'import deduplica sul **video id** YouTube (non sulla stringa del link). `INVALID_SHARE_CODE_ERROR` è contratto come gli altri messaggi.
- I componenti espongono attributi `data-cy` usati dalle spec Cypress: non rimuoverli.

## Piramide di test (mappa)

- `tests/unit/` — Vitest, logica pura (asserzioni Chai importate esplicitamente e stile Jest convivono).
- `tests/integration/` — Vitest + jsdom: App reale + dominio + localStorage senza mock; storage round-trip.
- `features/` — Gherkin **in italiano** (`# language: it`) + step in TS caricati via tsx (`NODE_OPTIONS="--import tsx"`); lo stato scenario vive in `features/support/world.ts`.
- `cypress/e2e/` — flussi utente completi contro la build di preview.

## Vincoli non ovvi

- ESLint vieta le asserzioni "a proprietà" di Chai (`.to.exist`, `.to.be.empty`): usare forme a chiamata (`.to.have.lengthOf(0)`, `.to.not.equal(undefined)`).
- Nelle spec Cypress il seed dei dati si fa SOLO con `cy.visitWithData(...)` (visita → semina → reload): un `setItem` in `onBeforeLoad` viene cancellato dalla test isolation nei test successivi al primo della spec.
- Le spec Cypress senza import/export sono script TS a scope globale: chiudile con `export {}` o le `const` di file diversi (es. `seed`) collidono al typecheck.
- Gli script `test*` impostano `NODE_OPTIONS="--no-experimental-webstorage"`: il global `localStorage` sperimentale di Node ≥22 maschera quello di jsdom (resta `undefined`) e senza flag i test di integrazione falliscono. Non toglierlo. Cypress ha la sua tsconfig per evitare conflitti di globals con Vitest.
- `createExercise` omette le chiavi `undefined` (niente `stature: undefined`): il round-trip JSON le perderebbe e i deep-equal fallirebbero.
- CI (`.github/workflows/ci.yml`): la build parte SOLO se analisi statica e tutti i test (unit/integration, BDD, E2E) sono verdi — requisito del README; l'immagine Docker è pubblicata su GHCR solo da main.
- I video sono SOLO link YouTube (validati in `services/youtube.ts`): mai aggiungere upload/hosting di file video.

## Visione prodotto (da README.md, in italiano)

Piattaforma open source stile Reddit per esercizi da palestra: esercizi tarati sulla statura con video YouTube (volto offuscato via AI), upvote della community, tracking dei pesi con suggerimento del carico (`services/weightSuggestion.ts`: tutte le serie ≥ 8 reps → +2,5 kg, altrimenti consolidamento), schede di allenamento condivisibili. Nessuna registrazione; export/import JSON per i backup. Il piano di lavoro con milestone e stime è su GitHub (issues + `docs/PROJECT_PLAN.md`).
