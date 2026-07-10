# OPEN-GYM-APP

la struttura dell'app lato codice di sviluppo deve avere i seguenti aspetti:
BDD (Behavior Driven Development) con tutti questi casi studio, TDD (Test Driven Developement) Con tutti i Test Unitari delle varie unita, e di Integrazione ed infine i test E2E delle funzionalita' piu' importanti di utilizzo. inoltre si vuole costruire una pipeline CI che faccia la code analysis del codice affinche vada bene e che controlli che vadano bene tutti i test prima di effettuare la build con github action, inoltre si vuole containerizzare il tutto se uno vuole hostare il progetto su un cloud

l'idea e' quella di creare tipo una piattaforma open source dove ogni persona mette gli esercizi in base alla persona, cosi che la persona in base alla sua statura replica quei esercizi ed il pubblico fa upvote tipo reddit

come utente si vuole tenere traccia delle attivita' di pesi che si e' fatto in passato cosi da proporre il peso quando si fa a fare l'esercizio

come utente si vuole avere una scheda di allenamento cosi che l'utente non va a cercarsi gli esercizi da fare ma sceglie quelli proposti nella sua giornata

come utente posso proporre esercizi e schede di allenamento ad altri utenti cosi che ogni utente puo' inserirle nella propria scheda di allenamento o provare quella scheda di allenamento di quel utente

come utente che carico gli esercizi da proporre devo poter caricare un video modificato con l'AI per nascondere il volto
affinche le persone non valutino la persona ma l'utilita' dell'esercizio

l'app sara' una web app agli inizi si vuole fare in modo affinche funzioni salvando i dati in cache/localstorage

come utente non e' richiesta alcuna registrazione

l'app non ha uno stack architetturale scegli tu se usare solo vue.js o react dato che l'app si vuole farla funzionare solo lato front-end cosi da evitare l'utilizzo di un server backend

l'app deve permettere l'esportazione dei dati salvati lato json e l'importazione dei dati lato json cosi da fare copie di backup dei dati sul proprio dispositivo

l'utente che carica il video, deve caricare il link youtube del video - cosi da alleggerire l'app dal utilizzo di un hosting per salvare i video

---

## Sviluppo

Stack: **React 19 + TypeScript + Vite** (PWA via vite-plugin-pwa) · test **Jest + Chai**, **Cucumber** (BDD, Gherkin in italiano), **Cypress** (E2E) · CI con **GitHub Actions** · **Docker** per l'hosting.

```bash
npm install
npm run dev          # sviluppo su http://localhost:5173
npm test             # test unitari e di integrazione
npm run test:bdd     # scenari BDD (features/*.feature)
npm run test:e2e     # test end-to-end con Cypress
npm run test:all     # tutto, come in CI
docker compose up --build   # app di produzione su http://localhost:8080
```

La pipeline CI esegue analisi statica e tutti i test prima della build; da `main` l'immagine Docker viene pubblicata su GHCR. Il piano di lavoro (milestone, issue, stime) è in `docs/PROJECT_PLAN.md` e nelle issue GitHub.
