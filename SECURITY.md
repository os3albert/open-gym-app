# Sicurezza

## Segnalare una vulnerabilità

Non aprire una issue pubblica. Usa **[Security → Report a vulnerability](https://github.com/os3albert/open-gym-app/security/advisories/new)**
(GitHub Private Vulnerability Reporting). Rispondiamo appena possibile; se la segnalazione è
valida, la correzione viene pubblicata in una release e ti citiamo nel CHANGELOG, se lo desideri.

## Superficie di attacco

Open Gym è un'app statica: **non ha un backend che conserva dati degli utenti**. Tutto ciò che ti
riguarda vive in `localStorage` sul tuo dispositivo (vedi [docs/PRIVACY.md](docs/PRIVACY.md)).
Le uniche superfici esposte sono:

| Superficie                              | Cosa accetta                     | Difese                                                                                                                                                                           |
| --------------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker della community (`worker/`)      | proposte e voti                  | origine verificata server-side, limiti su corpo e campi, identità del votante derivata dal worker, rate limiting per IP (KV), token GitHub con permesso _Contents_ sul solo repo |
| Catalogo community (`community/*.json`) | dati pubblici scritti dal worker | validati prima del commit; l'app li rivalida in lettura                                                                                                                          |
| Codici di condivisione (`#dati=…`)      | dati arbitrari da terzi          | decodifica e **validazione strutturale** prima di toccare i dati locali                                                                                                          |
| Backup JSON                             | file scelto dall'utente          | validato e migrato; un file non valido non modifica nulla                                                                                                                        |
| Video                                   | **solo** link YouTube            | whitelist con estrazione dell'id video; iframe caricato solo al click, su `youtube-nocookie.com`                                                                                 |

## Scelte di sicurezza (e loro limiti)

- **I voti non si autocertificano.** Il client dice _cosa_ vota, non _chi_ vota: l'identità del
  votante la deriva il worker dall'IP con un salt segreto (hash non reversibile, nessun dato
  personale nel repo). _Limite noto:_ chi condivide lo stesso IP (NAT) condivide il voto, e un
  attaccante con molti IP può comunque gonfiare i conteggi. Senza account non esiste una difesa
  perfetta: l'obiettivo è alzare il costo dell'abuso, non renderlo impossibile.
- **Il CORS non è una difesa.** Vale nei browser, non per `curl`: il worker verifica l'origine
  server-side e risponde 403 se non è ammessa.
- **Limiti espliciti.** Corpo della richiesta ≤ 4 KB, campi con lunghezze massime: il catalogo è
  un file del repository e non deve poter diventare una discarica.
- **Rate limiting** per IP (20 scritture/ora) se il binding KV è configurato; è opzionale perché
  il worker deve poter girare anche senza.
- **CSP** restrittiva (generata a build time, come `<meta>` perché GitHub Pages non permette
  header custom): niente script inline, `object-src 'none'`, `frame-ancestors 'none'`, e solo
  gli host realmente usati (YouTube senza cookie, miniature, catalogo, worker e Umami se
  configurati). Nell'immagine Docker gli header di sicurezza sono mandati per davvero da nginx.
- **Nessun segreto nel bundle.** Le variabili `VITE_*` finiscono nel JavaScript pubblico: per
  questo contengono solo URL e identificativi pubblici. I veri segreti (token GitHub, salt dei
  voti, token Cloudflare e Sonar) stanno nei secret del worker e del repository, mai nel codice.

## Controlli continui

- **CI**: lint, formattazione, type-check, `npm audit --audit-level=high`, test unitari e di
  integrazione, BDD e E2E; la build parte solo se tutto è verde.
- **SonarCloud** (`.github/workflows/sonar.yml`): analisi statica di bug, code smell e security
  hotspot su app e worker, con la copertura dei test importata.
- **Dependabot**: aggiornamenti settimanali di dipendenze npm, GitHub Actions e immagini Docker.
