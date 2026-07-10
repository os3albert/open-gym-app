# Piano di progetto — Open Gym App

> Ultimo aggiornamento: 10/07/2026
> Repo: [os3albert/open-gym-app](https://github.com/os3albert/open-gym-app) · [Issue](https://github.com/os3albert/open-gym-app/issues) · [Milestone](https://github.com/os3albert/open-gym-app/milestones)

Piattaforma open source stile Reddit per esercizi da palestra: proposte di esercizi (solo link YouTube, volto offuscato con AI) tarate sulla statura con upvote del pubblico, tracking dei pesi con suggerimento del carico, schede di allenamento personali e condivisibili. Vincoli: web app **solo frontend**, dati in `localStorage`, nessuna registrazione, backup via export/import JSON.

**Stack**: React 19 + TypeScript + Vite · PWA (vite-plugin-pwa) · BDD Cucumber (Gherkin in italiano) · Jest + Chai + Testing Library · Cypress E2E · CI GitHub Actions · Docker multi-stage (nginx) su GHCR.

## Nota sulle stime

Il progetto è sviluppato con assistenza AI (Claude Code): le stime sono quindi **stime AI-assisted**, tipicamente 3–5 volte più basse di quelle tradizionali. Ogni issue riporta entrambe: la stima AI-assisted in ore e, tra parentesi, quella tradizionale per confronto. Le label di stima si riferiscono alle ore AI-assisted: `stima:S (≤2h)` · `stima:M (≤4h)` · `stima:L (≤8h)`.

## Panoramica delle milestone

| Milestone | Obiettivo | Scadenza indicativa | Issue | Stima AI | Stima tradizionale |
|---|---|---|---:|---:|---:|
| [M1 — Fondamenta](https://github.com/os3albert/open-gym-app/milestone/1) | Scaffold PWA, infrastruttura test (BDD/unit/E2E), CI, Docker — **in corso, in completamento oggi 10/07/2026** | 10/07/2026 | 6 | 16h | ~8 giorni |
| [M2 — Esercizi & Voti](https://github.com/os3albert/open-gym-app/milestone/2) | CRUD esercizi, validazione link YouTube, upvote, filtri per statura | 24/07/2026 | 7 | 26h | ~13 giorni |
| [M3 — Tracking Pesi](https://github.com/os3albert/open-gym-app/milestone/3) | Registrazione attività, storico, suggerimento del carico | 07/08/2026 | 4 | 15h | ~7,5 giorni |
| [M4 — Schede di Allenamento](https://github.com/os3albert/open-gym-app/milestone/4) | Scheda per giorni, allenamento del giorno, condivisione e import tra utenti | 21/08/2026 | 5 | 19h | ~9,5 giorni |
| [M5 — Backup & PWA](https://github.com/os3albert/open-gym-app/milestone/5) | Export/import JSON, offline, installabilità, rifinitura UX | 04/09/2026 | 4 | 13h | ~6,5 giorni |
| [M6 — Release 1.0](https://github.com/os3albert/open-gym-app/milestone/6) | GitHub Pages, hardening E2E, documentazione, release | 18/09/2026 | 4 | 11h | ~5,5 giorni |
| **Totale** | | | **30** | **100h** | **~50 giorni (~400h)** |

## Elenco delle issue

### M1 — Fondamenta

| # | Titolo | Priorità | Stima AI | Tradizionale |
|---:|---|:---:|---:|---:|
| [#1](https://github.com/os3albert/open-gym-app/issues/1) | Scaffold del progetto: React 19 + TypeScript + Vite | P0 | 2h | ~1 giorno |
| [#2](https://github.com/os3albert/open-gym-app/issues/2) | Configurazione PWA di base con vite-plugin-pwa | P0 | 2h | ~1 giorno |
| [#3](https://github.com/os3albert/open-gym-app/issues/3) | Infrastruttura di test: Cucumber (BDD in italiano) + Jest + Chai + Testing Library | P0 | 4h | ~2 giorni |
| [#4](https://github.com/os3albert/open-gym-app/issues/4) | Setup dei test E2E con Cypress | P0 | 2h | ~1 giorno |
| [#5](https://github.com/os3albert/open-gym-app/issues/5) | Pipeline CI con GitHub Actions: lint → test → build → Docker | P0 | 4h | ~2 giorni |
| [#6](https://github.com/os3albert/open-gym-app/issues/6) | Containerizzazione Docker multi-stage (nginx) e push su GHCR | P0 | 2h | ~1 giorno |
| | **Subtotale M1** | | **16h** | **~8 giorni** |

### M2 — Esercizi & Voti

| # | Titolo | Priorità | Stima AI | Tradizionale |
|---:|---|:---:|---:|---:|
| [#7](https://github.com/os3albert/open-gym-app/issues/7) | Modello dati e layer di persistenza su localStorage | P0 | 4h | ~2 giorni |
| [#8](https://github.com/os3albert/open-gym-app/issues/8) | CRUD delle proposte di esercizi | P0 | 8h | ~4 giorni |
| [#9](https://github.com/os3albert/open-gym-app/issues/9) | Validazione del link YouTube e player incorporato | P0 | 2h | ~1 giorno |
| [#10](https://github.com/os3albert/open-gym-app/issues/10) | Upvote stile Reddit sugli esercizi | P0 | 4h | ~2 giorni |
| [#11](https://github.com/os3albert/open-gym-app/issues/11) | Filtri per statura e ordinamento della lista esercizi | P1 | 3h | ~1,5 giorni |
| [#12](https://github.com/os3albert/open-gym-app/issues/12) | Linee guida e conferma: volto offuscato con l'AI nei video | P2 | 2h | ~1 giorno |
| [#13](https://github.com/os3albert/open-gym-app/issues/13) | E2E Cypress: flusso proposta, voto e filtri degli esercizi | P1 | 3h | ~1,5 giorni |
| | **Subtotale M2** | | **26h** | **~13 giorni** |

### M3 — Tracking Pesi

| # | Titolo | Priorità | Stima AI | Tradizionale |
|---:|---|:---:|---:|---:|
| [#14](https://github.com/os3albert/open-gym-app/issues/14) | Registrazione della sessione di allenamento (serie, ripetizioni, peso) | P0 | 6h | ~3 giorni |
| [#15](https://github.com/os3albert/open-gym-app/issues/15) | Storico allenamenti con andamento dei carichi | P1 | 4h | ~2 giorni |
| [#16](https://github.com/os3albert/open-gym-app/issues/16) | Suggerimento del carico basato sullo storico | P0 | 3h | ~1,5 giorni |
| [#17](https://github.com/os3albert/open-gym-app/issues/17) | E2E Cypress: flusso completo del tracking pesi | P1 | 2h | ~1 giorno |
| | **Subtotale M3** | | **15h** | **~7,5 giorni** |

### M4 — Schede di Allenamento

| # | Titolo | Priorità | Stima AI | Tradizionale |
|---:|---|:---:|---:|---:|
| [#18](https://github.com/os3albert/open-gym-app/issues/18) | Creazione e gestione della scheda di allenamento per giorni | P0 | 6h | ~3 giorni |
| [#19](https://github.com/os3albert/open-gym-app/issues/19) | Allenamento del giorno: esercizi proposti dalla scheda attiva | P0 | 4h | ~2 giorni |
| [#20](https://github.com/os3albert/open-gym-app/issues/20) | Condivisione di esercizi e schede con altri utenti | P1 | 4h | ~2 giorni |
| [#21](https://github.com/os3albert/open-gym-app/issues/21) | Importazione della scheda (o esercizio) di un altro utente | P1 | 3h | ~1,5 giorni |
| [#22](https://github.com/os3albert/open-gym-app/issues/22) | E2E Cypress: flusso schede (creazione, condivisione, importazione) | P1 | 2h | ~1 giorno |
| | **Subtotale M4** | | **19h** | **~9,5 giorni** |

### M5 — Backup & PWA

| # | Titolo | Priorità | Stima AI | Tradizionale |
|---:|---|:---:|---:|---:|
| [#23](https://github.com/os3albert/open-gym-app/issues/23) | Export completo dei dati in JSON | P0 | 2h | ~1 giorno |
| [#24](https://github.com/os3albert/open-gym-app/issues/24) | Import dei dati da JSON con validazione | P0 | 3h | ~1,5 giorni |
| [#25](https://github.com/os3albert/open-gym-app/issues/25) | PWA completa: funzionamento offline e installabilità | P1 | 4h | ~2 giorni |
| [#26](https://github.com/os3albert/open-gym-app/issues/26) | Rifinitura UX: responsive, tema scuro e accessibilità di base | P2 | 4h | ~2 giorni |
| | **Subtotale M5** | | **13h** | **~6,5 giorni** |

### M6 — Release 1.0

| # | Titolo | Priorità | Stima AI | Tradizionale |
|---:|---|:---:|---:|---:|
| [#27](https://github.com/os3albert/open-gym-app/issues/27) | Deploy su hosting statico (GitHub Pages) | P0 | 2h | ~1 giorno |
| [#28](https://github.com/os3albert/open-gym-app/issues/28) | Hardening E2E e audit qualità (Lighthouse) | P1 | 4h | ~2 giorni |
| [#29](https://github.com/os3albert/open-gym-app/issues/29) | Documentazione utente e per contributori | P1 | 3h | ~1,5 giorni |
| [#30](https://github.com/os3albert/open-gym-app/issues/30) | Release 1.0: versioning, changelog e immagine Docker taggata | P0 | 2h | ~1 giorno |
| | **Subtotale M6** | | **11h** | **~5,5 giorni** |

## Sistema di label

| Categoria | Label |
|---|---|
| Area | `area:esercizi`, `area:tracking-pesi`, `area:schede`, `area:community`, `area:pwa`, `area:testing`, `area:ci-cd`, `area:docs` |
| Tipo | `tipo:feature`, `tipo:infra`, `tipo:bug` |
| Priorità | `priorita:P0` (bloccante), `priorita:P1` (alta), `priorita:P2` (media/bassa) |
| Stima (AI-assisted) | `stima:S (≤2h)`, `stima:M (≤4h)`, `stima:L (≤8h)` |

## Attivare la board (GitHub Project v2)

Il token `gh` attuale ha solo lo scope `repo`: la creazione del Project v2 "Open Gym — Roadmap" richiede lo scope `project`. Per attivare la board:

```bash
# 1. Aggiungi gli scope necessari al token (apre il flusso di autorizzazione)
gh auth refresh -s project,read:project

# 2. Lancia lo script di setup (idempotente, rieseguibile senza problemi)
./scripts/setup-github-project.sh
```

Lo script `scripts/setup-github-project.sh`:

1. crea il project **"Open Gym — Roadmap"** per l'utente `os3albert` (se non esiste già);
2. crea i campi custom: **Stima (h)** (numerico) e **Priorità** (single-select P0/P1/P2) — il campo **Status** è creato di default da GitHub;
3. aggiunge al project **tutte le issue** del repository;
4. per ogni item imposta **Stima (h)** (letta dalla riga "⏱️ Stima (AI-assisted)" nel body dell'issue) e **Priorità** (letta dalla label `priorita:PX`).

A board creata, l'avanzamento del progetto si segue da tre viste complementari: la board del project (per stato), le [milestone](https://github.com/os3albert/open-gym-app/milestones) (per fase, con barra di completamento) e i filtri per label sulle [issue](https://github.com/os3albert/open-gym-app/issues).
