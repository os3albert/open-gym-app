# Community su GitHub: come funziona e come si configura

Gli esercizi proposti dagli utenti e i loro voti vivono **in questo repository**, in due file:

- `community/exercises.json` — il catalogo degli esercizi proposti;
- `community/votes.json` — per ogni esercizio, gli hash dei dispositivi che l'hanno votato
  (il conteggio dei voti è la lunghezza della lista: un voto per dispositivo, ritirabile).

## Il flusso

1. **Lettura** — l'app scarica i due file da `raw.githubusercontent.com` e mostra gli esercizi
   della community insieme a quelli locali. Non passa dal worker: se il worker è spento o non
   configurato, il catalogo resta comunque consultabile.
2. **Scrittura** — quando proponi un esercizio o lo voti, l'app chiama un piccolo
   **Cloudflare Worker** (cartella `worker/`), che valida la richiesta e **committa** il file
   aggiornato nel repo con un token GitHub. È l'unico backend del progetto: i tuoi dati personali
   (schede, allenamenti, storico) restano solo sul tuo dispositivo, in localStorage.

Le proposte concorrenti non si sovrascrivono: il worker rilegge lo SHA del file e ritenta il
commit se qualcuno ha scritto nel frattempo. Il dedup avviene sull'**id del video YouTube**, non
sulla stringa del link.

**Senza configurazione la community è disattivata** e l'app funziona esattamente come prima
(tutto locale). Le istruzioni qui sotto servono solo a chi ospita la propria istanza.

## Configurazione (una volta sola)

Serve un account Cloudflare (piano gratuito) e un token GitHub.

### 1. Token GitHub

Crea un **fine-grained personal access token** su
`Settings → Developer settings → Personal access tokens`:

- Repository access: **solo** `open-gym-app`
- Permessi: **Contents: Read and write** (nient'altro)

### 2. Secret del worker

Dalla cartella del progetto:

```bash
cd worker
npx wrangler login                 # apre il browser: autorizza Cloudflare
npx wrangler secret put GITHUB_TOKEN   # incolla il token del punto 1
npx wrangler deploy                # primo deploy: stampa l'URL del worker
```

L'URL stampato (es. `https://open-gym-community.<tuo-account>.workers.dev`) serve al punto 4.

### 3. Secret del repository (per il deploy automatico)

In `Settings → Secrets and variables → Actions → Secrets` aggiungi:

- `CLOUDFLARE_API_TOKEN` — un API token Cloudflare col permesso *Edit Cloudflare Workers*
- `CLOUDFLARE_ACCOUNT_ID` — l'id account, visibile nella dashboard Cloudflare

Da qui in poi il workflow `worker.yml` ridistribuisce il worker a ogni push che tocca `worker/`.

### 4. URL del worker nell'app

Sempre in `Settings → Secrets and variables → Actions`, scheda **Variables**, aggiungi:

- `COMMUNITY_API_URL` — l'URL del worker del punto 2

Il deploy su GitHub Pages lo passa alla build come `VITE_COMMUNITY_API_URL`. Per provare in
locale, crea un file `.env.local`:

```
VITE_COMMUNITY_API_URL=https://open-gym-community.<tuo-account>.workers.dev
```

## Sviluppo locale del worker

```bash
cd worker
npx wrangler dev        # worker su http://localhost:8787
```

Le origini ammesse (CORS) sono in `worker/wrangler.toml`: GitHub Pages e i due server locali.
