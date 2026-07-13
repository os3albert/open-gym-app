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

Dalla **root** del progetto, sempre con gli script `worker:*` (mai `wrangler` a mano: vedi il
riquadro qui sotto):

```bash
npx wrangler login                             # apre il browser: autorizza Cloudflare
npm run worker:deploy                          # primo deploy: crea il worker e stampa l'URL
npm run worker:secret -- put GITHUB_TOKEN      # incolla il token del punto 1
openssl rand -hex 32 | npm run worker:secret -- put VOTE_SALT
npm run worker:secret -- list                  # controllo: deve elencare GITHUB_TOKEN e VOTE_SALT
```

### ⚠️ Perché non si lancia `wrangler` a mano

In questo repo ci sono **due** Worker: `open-gym-app` (l'app, `wrangler.jsonc` nella root) e
`open-gym-community` (questo, `worker/wrangler.toml`). Due insidie, entrambe già costate un
debug lungo:

1. **I nomi non devono coincidere.** Su Cloudflare il nome *è* l'identità del Worker: due deploy
   con lo stesso nome sono lo stesso Worker, e il secondo cancella il primo.
2. **`cd worker && npx wrangler deploy` NON deploya questo worker.** A ogni build,
   `@cloudflare/vite-plugin` scrive nella root `.wrangler/deploy/config.json`, un file di
   *redirect* verso `dist/wrangler.json` (l'app compilata). Wrangler lo trova risalendo le cartelle
   e lo preferisce al `wrangler.toml` che ha nella directory corrente: il comando finisce sul Worker
   dell'**app**. Vale per tutto, `secret put` compreso — i segreti finirebbero sul Worker sbagliato.

L'unico modo di aggirare il redirect è `--config` esplicito, che è esattamente ciò che fanno gli
script `worker:deploy`, `worker:secret` e `worker:tail` in `package.json`. Usa quelli.

`VOTE_SALT` serve a derivare l'identità del votante (hash di salt + IP): senza salt, l'hash
sarebbe ricostruibile a partire da un IP noto. **Non cambiarlo dopo il primo voto**, o i voti
già espressi non verranno più riconosciuti come dello stesso votante.

L'URL stampato (es. `https://open-gym-community.<tuo-account>.workers.dev`) serve al punto 4.

**Rate limiting (consigliato).** Per limitare le scritture a 20/ora per IP:

```bash
npx wrangler kv namespace create RATE_LIMIT
```

Copia l'id stampato in `worker/wrangler.toml`, togliendo il commento al blocco `kv_namespaces`,
e rifai il deploy. Senza questo passo il worker funziona ugualmente, ma non limita nulla.

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

La stessa variabile serve anche a `npm run deploy` (l'app servita da Cloudflare si builda in
locale): senza, quella copia esce con la community spenta.

## Sviluppo locale del worker

```bash
npx wrangler dev --config worker/wrangler.toml --port 8788   # :8787 è già della preview dell'app
```

Anche qui il `--config` non è decorativo: senza, wrangler avvia l'**app**, non il worker.

Le origini ammesse sono in `ALLOWED_ORIGINS` (`worker/wrangler.toml`): GitHub Pages, l'app su
Cloudflare e i server locali. Non è solo una questione di CORS — il worker **rifiuta con 403** le
richieste che arrivano da un'origine fuori da quella lista (il CORS è una difesa del browser: una
richiesta con `curl` lo ignorerebbe). Se pubblichi l'app da un altro dominio, aggiungilo qui.
