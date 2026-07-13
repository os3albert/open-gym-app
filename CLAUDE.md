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
npm run test:e2e           # builda, avvia wrangler dev :8787, esegue Cypress headless
npm run test:e2e:open      # Cypress interattivo contro il dev server :5173
npm run test:all           # lint + format + jest + bdd + e2e (stessi gate della CI)

docker compose up --build  # immagine di produzione su http://localhost:8080
```

## Stack (decisione registrata)

React 19 + TypeScript + Vite, PWA via `vite-plugin-pwa` (scelto rispetto a Vue per l'ecosistema di testing richiesto: Testing Library/Cypress/Cucumber di prima classe). Test: **Vitest** (runner Vite-nativo, config nel blocco `test` di `vite.config.ts`) con asserzioni sia stile Jest sia **Chai**; BDD con `@cucumber/cucumber`; E2E con Cypress. Nessun backend: tutto lo stato vive in localStorage. UI: **MUI v9** (`@mui/material` + `@mui/icons-material`, import SEMPRE per-componente/per-icona) con tema MD3 monocromo in `src/theme.ts` e font Inter self-hosted (`@fontsource-variable/inter/index.css`).

## Architettura

Dipendenze a senso unico: `components/` → `hooks/` → `domain/` + `services/`. Dominio e servizi sono **funzioni pure senza React né browser API** (eccetto `storage.ts` che accetta uno `Storage` iniettabile): è ciò che permette agli step Cucumber di esercitarli direttamente in Node, senza browser.

- `src/domain/types.ts` — `AppData` (schema v3: esercizi, schede con `days[].entries` (esercizio+serie×reps) e `activePlanId`, attività, `profile.statureCm`, `votedExerciseIds`) è l'unità di persistenza E il formato di backup JSON: ogni campo nuovo va gestito anche nel validatore di `importExport.ts` e nel round-trip test. Se cambi lo schema, incrementa `CURRENT_SCHEMA_VERSION` e aggiungi la migrazione in `services/migrations.ts` (l'import migra sempre i backup vecchi: mai romperli).
- `src/domain/exercises.ts` — reducer puri (add/upvote/rank); la validazione lancia errori con messaggi in italiano che sono **contratto**: UI, test Jest, step BDD e spec Cypress asseriscono su quelle stringhe esatte (esportate come costanti, es. `INVALID_YOUTUBE_LINK_ERROR`).
- `src/services/importExport.ts` — export/import JSON con validazione strutturale; `storage.ts` vi delega (dati corrotti → stato vuoto, mai crash).
- `src/hooks/useAppData.ts` — unico punto di contatto stato↔localStorage: ogni modifica passa da `commit()` che salva subito e intercetta la quota piena. Niente salvataggio al mount: se i dati erano corrotti restano su disco finché l'utente non agisce. La validazione che può lanciare avviene PRIMA del commit, mai dentro un updater React.
- Il voto è un toggle per dispositivo (`toggleVote` + `votedExerciseIds`): mai incrementare i voti direttamente. I filtri (`domain/filters.ts`) e la vista corrente vivono nella query string (`hooks/useFilters.ts`, `hooks/useView.ts`): chi scrive parametri parte SEMPRE dai parametri correnti, mai da `new URLSearchParams()` vuoto, o cancella quelli altrui.
- Tracking pesi: `domain/activity.ts` (una sessione = record per esercizio+giorno, date locali `YYYY-MM-DD` da `utils/date.ts`); il suggerimento del carico precompila i campi in `WorkoutSession` via `services/weightSuggestion.ts`. Il grafico dello storico è SVG custom (`TrendChart`) senza librerie: `exerciseHistory(activity, id, metric)` aggrega per giorno secondo la `TrendMetric` scelta (`maxWeight`, `totalReps`, `maxReps`, `volume`) e produce `TrendPoint { date, value }`; l'aria-label del grafico è **contratto dei test** (quella del peso non va cambiata).
- Community su GitHub (`services/communityData.ts` puro + `services/community.ts` + `hooks/useCommunity.ts` + `worker/`): il catalogo (`community/exercises.json`) e i voti (`community/votes.json`, hash SHA-256 del votante derivati **dal worker**) vivono nel repo. La **lettura** avviene da `raw.githubusercontent` (funziona anche col worker spento), la **scrittura** passa dal Cloudflare Worker che committa via Contents API con retry sullo SHA. Voti e catalogo stanno in file separati apposta: due scritture concorrenti non collidono. Senza `VITE_COMMUNITY_API_URL` la community è **spenta del tutto** (nessuna richiesta di rete: è ciò che tiene i test indipendenti da GitHub). Setup in `docs/COMMUNITY.md`. La cache del catalogo e l'elenco di ciò che ho votato stanno in chiavi localStorage separate: fuori da AppData, quindi fuori dal backup e senza bump di schema. Lato app si tengono solo i **conteggi** dei voti (`voteCounts`), mai gli hash dei votanti.
- Schede (`domain/plans.ts`): una sola attiva per dispositivo (`activePlanId`); l'allenamento del giorno (`TodayWorkout`) fa match dei nomi giorno sui giorni della settimana italiani (`utils/date.ts: weekdayNameIt`), i giorni generici («Giorno A») si scelgono a mano. `deleteExercise` ripulisce anche le `entries` delle schede: mai riferimenti pendenti.
- Condivisione senza backend (`services/share.ts`): payload JSON compresso con lz-string in codice URL-safe, apribile anche da link con fragment `#dati=…` (consumato in `App.tsx` al mount). La scheda condivisa INCORPORA gli esercizi; l'import deduplica sul **video id** YouTube (non sulla stringa del link). `INVALID_SHARE_CODE_ERROR` è contratto come gli altri messaggi.
- Backup: `exportBackupJson` aggiunge `exportedAt` (che l'import ignora: il round-trip resta identico) e il file è datato (`backupFileName`); `exportToJson` senza data resta per localStorage. `mergeData` («Unisci») riusa le regole di dedup della condivisione; nei conflitti vincono SEMPRE i dati locali e il flag di voto del backup vale solo per gli esercizi davvero aggiunti (coerenza contatore/flag).
- PWA: service worker in modalità **prompt** (`UpdateBanner` + `useRegisterSW`); il modulo virtuale `virtual:pwa-register/react` è stubbato sotto Vitest via `test.alias` (vedi `tests/stubs/pwa-register.ts`). I video YouTube richiedono rete: `YouTubePlayer` mostra un placeholder se la miniatura non si carica.
- Tema: preferenza `auto|chiaro|scuro` in `hooks/useTheme.ts` (fonte di verità, persistita in una chiave localStorage SEPARATA da AppData: niente nel backup, niente bump di schema), applicata come `data-theme` su `<html>`. Il tema MUI (`src/theme.ts`) usa `cssVariables: { colorSchemeSelector: 'data-theme' }` e `SyncMuiColorScheme` in `App.tsx` specchia il tema risolto nel color scheme MUI: senza quel ponte il provider sovrascrive `data-theme` al mount. Le var legacy (`--bg`, `--border`, `--accent`…) in `index.css` sono un ponte verso `var(--mui-palette-…)` per gli stili non-MUI (TrendChart, facade video): mai colori hardcoded nei componenti.
- Statistiche d'uso (`services/analytics.ts` + `hooks/useAnalytics.ts`): Umami **cookieless**, senza dati personali né identificatori → niente banner di consenso. Lo script si inietta SOLO se `VITE_UMAMI_SRC` e `VITE_UMAMI_WEBSITE_ID` sono configurate, mai con Do Not Track attivo, mai dopo l'opt-out (chiave localStorage separata, fuori da AppData); l'unico evento è il nome della vista, mai contenuti dell'utente. Se cambi qualcosa qui, aggiorna `docs/PRIVACY.md`: è la promessa fatta all'utente.
- Logo: `public/logo.svg` (= `favicon.svg`) e `src/components/Logo.tsx` sono **lo stesso disegno** in due copie (una statica, una React): vanno cambiati insieme. Le icone PWA si rigenerano dal vettoriale con `sharp` (la maskable contiene solo il glifo nella safe zone, senza il riquadro).
- I componenti espongono attributi `data-cy` usati dalle spec Cypress: non rimuoverli.

### Regole MUI (contratto dei test, imparate in M7)

- Select: SEMPRE il componente `components/SelectField.tsx` (unico select dell'app, M11), mai `TextField select` a mano. È un Select MUI **non nativo**: il menu lo disegna l'app, non il sistema operativo. Conseguenze da rispettare: `userEvent.selectOptions` e `cy.select()` NON funzionano più — si usano gli helper `scegliOpzione(user, label, opzione)` (`tests/integration/helpers.ts`) e `cy.scegliOpzione(dataCy, opzione)` (`cypress/support/e2e.ts`), che aprono il menu e cliccano la voce per etichetta. Il `data-cy` sta sul div che mostra il valore (via `SelectDisplayProps`), NON sul root del Select: il root ingloba la legenda della label e il suo testo sarebbe «AutoTema» invece di «Auto». La scelta corrente si asserisce sul **testo** mostrato (`toHaveTextContent` / `have.text`), mai su un `value`.
- Il `data-cy` degli input va sull'elemento vero via `slotProps.htmlInput` (input, textarea multiline, select nativi); sui Button va sul root. Lo slot `input` di Checkbox non tipizza i `data-*`: cast `as React.InputHTMLAttributes<HTMLInputElement>`.
- MAI `required` su TextField: l'asterisco entra nel nome accessibile e rompe `getByLabelText`.
- In MUI v9 `flexWrap`/`alignItems`/`justifyContent` NON sono prop dirette di Stack: vanno in `sx` (con `useFlexGap` quando serve il wrap).
- Gli Alert MUI portano `role="alert"`/`role="status"` espliciti e il testo invariato (i messaggi sono contratto); il bottone di voto conserva `aria-pressed` e le classi `vote-button`/`voted`.
- L'input file del backup è nascosto dentro un `Button component="label"`: nelle spec Cypress `selectFile(..., { force: true })`.

## Piramide di test (mappa)

- `tests/unit/` — Vitest, logica pura (asserzioni Chai importate esplicitamente e stile Jest convivono).
- `tests/integration/` — Vitest + jsdom: App reale + dominio + localStorage senza mock; storage round-trip.
- `features/` — Gherkin **in italiano** (`# language: it`) + step in TS caricati via tsx (`NODE_OPTIONS="--import tsx"`); lo stato scenario vive in `features/support/world.ts`.
- `cypress/e2e/` — flussi utente completi contro la build di preview.

## Vincoli non ovvi

- ESLint vieta le asserzioni "a proprietà" di Chai (`.to.exist`, `.to.be.empty`): usare forme a chiamata (`.to.have.lengthOf(0)`, `.to.not.equal(undefined)`).
- Nelle spec Cypress il seed dei dati si fa SOLO con `cy.visitWithData(...)` (visita → semina → reload): un `setItem` in `onBeforeLoad` viene cancellato dalla test isolation nei test successivi al primo della spec.
- Le spec Cypress senza import/export sono script TS a scope globale: chiudile con `export {}` o le `const` di file diversi (es. `seed`) collidono al typecheck.
- `cy.reload()` riapplica le opzioni della `cy.visit` originale (incluso `onBeforeLoad`): un clear lì dentro cancella anche ciò che il test ha scritto dopo. Per gli assert di overflow orizzontale confrontare `scrollWidth` con la larghezza del viewport, NON con `clientWidth` (la scrollbar verticale lo riduce sempre). In Electron headless `prefers-color-scheme` può essere `light`: mai assumere il tema di sistema nei test.
- I test NON devono dipendere dal `.env` di chi li lancia: Vitest carica i file `.env` come Vite, quindi un `.env` con le variabili di produzione accenderebbe community e statistiche dentro i test, facendo partire richieste di rete VERE (il catalogo reale finiva nelle liste e l'E2E contava 4 esercizi invece di 1). Perciò `test.env` in `vite.config.ts` azzera `VITE_COMMUNITY_API_URL`/`VITE_UMAMI_*`, e l'E2E gira su `preview:e2e`/`dev:e2e`, che fanno lo stesso per la build. Chi ha bisogno di una variabile se la mette con `vi.stubEnv`.
- Gli script `test*` impostano `NODE_OPTIONS="--no-experimental-webstorage"`: il global `localStorage` sperimentale di Node ≥22 maschera quello di jsdom (resta `undefined`) e senza flag i test di integrazione falliscono. Non toglierlo. Cypress ha la sua tsconfig per evitare conflitti di globals con Vitest.
- `createExercise` omette le chiavi `undefined` (niente `stature: undefined`): il round-trip JSON le perderebbe e i deep-equal fallirebbero.
- CI (`.github/workflows/ci.yml`): la build parte SOLO se analisi statica e tutti i test (unit/integration, BDD, E2E) sono verdi — requisito del README; da main partono anche il deploy su GitHub Pages e la pubblicazione dell'immagine su GHCR. Le release si tagliano con un tag `v*` (`release.yml`: release GitHub col changelog + immagine versionata); la versione in `package.json` va allineata al tag e il CHANGELOG deve avere la sezione `## <versione>` o la release fallisce.
- GitHub Pages serve l'app in un sottopercorso: la `base` di Vite arriva da `VITE_BASE` (solo nel job di deploy). Nel manifest PWA niente `start_url`/percorsi assoluti: il plugin li deriva dalla base. L'app usa solo query string e hash (mai rotte con path), quindi il fallback SPA su Pages è un semplice 404.html copiato.
- I video sono SOLO link YouTube (validati in `services/youtube.ts`): mai aggiungere upload/hosting di file video.
- Sicurezza (vedi `SECURITY.md`): il worker NON si fida del client — l'identità del votante è derivata lì (hash di `VOTE_SALT` + IP), il client dice solo _cosa_ vota e il conteggio autorevole torna nella risposta; l'origine è verificata server-side (il CORS non ferma `curl`); corpo ≤ 4 KB e campi con `FIELD_LIMITS`. Le variabili `VITE_*` finiscono nel bundle pubblico: possono contenere solo URL e id pubblici, mai segreti. La CSP è generata a build time in `vite.config.ts` (meta tag: Pages non manda header): se aggiungi un host esterno, va aggiunto lì o il browser lo blocca in produzione — e l'E2E gira sulla build, quindi lo vedi subito.
- Il form «Proponi un esercizio» è collassato all'atterraggio (si apre da «Nuova proposta»): i test che compilano il form lo aprono prima (`cy.apriFormProposta()` in Cypress, helper equivalente nei test di integrazione). Il bottone NON può chiamarsi «Proponi esercizio»: è il nome accessibile del submit e le query per ruolo collidono.
- Il worker (`worker/`) ha la sua tsconfig ed entra nello script `typecheck`; la logica che condivide con l'app sta in `src/services/communityData.ts` (pura, testata in Vitest). Il deploy (`worker.yml`) richiede i secret Cloudflare: finché non sono configurati il workflow fallisce ed è normale (la app resta comunque verde e la community spenta).
- Su Cloudflare vivono **due** Worker: `open-gym-app` (l'app, `wrangler.jsonc` nella root, soli asset statici) e `open-gym-community` (`worker/wrangler.toml`). Il nome È l'identità del Worker: **mai lo stesso nome**, o il secondo deploy sovrascrive il primo. E i comandi wrangler della community passano SEMPRE dagli script `npm run worker:deploy|worker:secret|worker:tail` (= `--config worker/wrangler.toml`): un `wrangler` nudo, anche lanciato da dentro `worker/`, viene dirottato sul Worker dell'app dal redirect `.wrangler/deploy/config.json` che `@cloudflare/vite-plugin` genera nella root a ogni build — segreti compresi.

## Visione prodotto (da README.md, in italiano)

Piattaforma open source stile Reddit per esercizi da palestra: esercizi tarati sulla statura con video YouTube (volto offuscato via AI), upvote della community, tracking dei pesi con suggerimento del carico (`services/weightSuggestion.ts`: tutte le serie ≥ 8 reps → +2,5 kg, altrimenti consolidamento), schede di allenamento condivisibili. Nessuna registrazione; export/import JSON per i backup. Il piano di lavoro con milestone e stime è su GitHub (issues + `docs/PROJECT_PLAN.md`).
