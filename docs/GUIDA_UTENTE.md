# Guida utente — Open Gym

Open Gym è una piattaforma open source di esercizi da palestra: la community propone
esercizi (tarati anche sulla statura), tu li voti, registri i tuoi allenamenti e
costruisci schede condivisibili. **Nessuna registrazione**: tutti i dati vivono solo
sul tuo dispositivo.

App: **https://os3albert.github.io/open-gym-app/**

## Indice

- [Proporre un esercizio](#proporre-un-esercizio)
- [Votare e filtrare gli esercizi](#votare-e-filtrare-gli-esercizi)
- [Registrare gli allenamenti (tracking pesi)](#registrare-gli-allenamenti-tracking-pesi)
- [Schede di allenamento](#schede-di-allenamento)
- [Condividere esercizi e schede](#condividere-esercizi-e-schede)
- [Backup dei dati](#backup-dei-dati)
- [Tema e installazione come app](#tema-e-installazione-come-app)
- [Privacy e statistiche d'uso](#privacy-e-statistiche-duso)

## Proporre un esercizio

1. Apri la scheda **Esercizi**: atterri sulla lista della community. Premi il pulsante
   flottante **Nuova proposta**: il modulo si apre in una finestra. Compila nome, descrizione,
   gruppo muscolare.
2. Incolla il **link YouTube** del video (l'app non ospita video: solo link).
   Il volto **non è importante**: si guarda il movimento, non la persona. Se preferisci,
   offuscalo con l'AI — trovi le linee guida nel modulo — ma non è obbligatorio.
3. (Facoltativo) Indica la **fascia di statura** (es. 170–190 cm) per cui l'esercizio è tarato.

L'esercizio è subito tuo, sul dispositivo. Se l'istanza ha la community attiva, la proposta
viene inviata anche al catalogo condiviso: te lo conferma un messaggio. Se la community non
risponde, l'esercizio resta comunque salvato da te.

## Votare e filtrare gli esercizi

- La lista mostra i tuoi esercizi e quelli della community (badge **community**): questi
  ultimi si votano e si condividono, ma non si modificano né si eliminano.
- Vota con la freccia **▲** come su Reddit: un voto per dispositivo, ripremi per toglierlo.
  I voti degli esercizi della community sono condivisi con tutti.
- Imposta la tua **statura** nella barra dei filtri e attiva «Adatti a me» per vedere solo
  gli esercizi tarati su di te (quelli senza fascia valgono per tutti).
- Puoi filtrare per gruppo muscolare e ordinare per voti o per data.

## Registrare gli allenamenti (tracking pesi)

1. Apri **Allenamento** e scegli un esercizio.
2. Peso e ripetizioni arrivano **precompilati dal tuo storico**: se l'ultima volta hai chiuso
   tutte le serie ad almeno 8 ripetizioni l'app propone **+2,5 kg**, altrimenti ripropone
   lo stesso carico da consolidare.
3. Regola con i pulsanti rapidi (−/+2,5 kg, −/+1 rip) e premi **Aggiungi serie**.
   Le serie di oggi compaiono come etichette rimovibili.
4. In **Storico** trovi le sessioni per giorno e il **grafico dell'andamento** per esercizio,
   con filtro 30/90 giorni. Il menu **Metrica** decide cosa misura il grafico:
   - **Peso massimo** — il carico più alto del giorno;
   - **Ripetizioni totali** — quante ripetizioni hai fatto in tutto quel giorno;
   - **Ripetizioni massime** — la serie più lunga;
   - **Volume (kg × reps)** — il lavoro complessivo, carico e ripetizioni insieme.

## Schede di allenamento

1. In **Schede** crea una scheda (es. «Full Body 3x») e aprila con **Modifica**.
2. Aggiungi i giorni: usa i giorni della settimana («Lunedì») oppure nomi generici
   («Giorno A»). Per ogni giorno scegli gli esercizi con il target serie×ripetizioni (es. 3×8).
3. Premi **Attiva** sulla scheda che stai seguendo: è una sola alla volta.
4. Da quel momento la scheda **Allenamento** ti propone l'allenamento del giorno:
   - se il giorno di scheda ha il nome del giorno della settimana, l'app lo trova da sola;
   - con giorni generici scegli tu quale fare oggi;
   - nei giorni senza allenamento vedi il riposo e il prossimo allenamento previsto.
5. Per ogni esercizio il peso è precompilato dal suggerimento del carico: premi **Fatto ✓**
   e tutte le serie finiscono nello storico. Puoi saltare un esercizio o aggiungerne uno
   al volo con la sessione libera qui sotto.

## Condividere esercizi e schede

- Premi **Condividi** su un esercizio o su una scheda: ottieni un **codice** (e un link)
  da inviare su qualsiasi canale. La scheda condivisa contiene anche gli esercizi:
  chi la riceve ha tutto.
- Per importare: scheda **Schede → Importa da un altro utente**, incolla il codice e premi
  **Anteprima**. Vedi giorni ed esercizi prima di confermare con **Aggiungi ai miei**;
  con **Prova questa scheda** diventa subito la tua scheda attiva.
- Un esercizio che hai già (stesso video YouTube) **non viene duplicato**.
- Se ricevi un **link** (con `#dati=…`), aprendolo l'app mostra direttamente l'anteprima.

## Backup dei dati

I dati esistono **solo sul tuo dispositivo**: fai backup regolari.

**Esportare**

1. In fondo alla pagina, sezione **Backup dei dati**, premi **Esporta backup JSON**.
2. Scarichi `open-gym-backup-<data>.json` con tutto: esercizi, voti, sessioni, schede,
   profilo, versione dello schema e data di export.

**Importare**

1. Premi **Importa backup JSON** e scegli il file. L'app lo valida subito:
   un file non valido viene rifiutato **senza toccare i tuoi dati**.
2. Scegli come importare:
   - **Sostituisci tutto** — i dati dell'app diventano esattamente quelli del backup
     (i backup di versioni vecchie vengono migrati automaticamente);
   - **Unisci ai miei dati** — il backup si aggiunge senza creare duplicati
     (stesso video YouTube = stesso esercizio); in caso di conflitto vincono i dati già presenti.

## Tema e installazione come app

- **Tema**: dal selettore in alto scegli Auto (segue il sistema), Chiaro o Scuro.
- **Installazione**: da un browser compatibile usa «Installa app» (o «Aggiungi alla
  schermata Home»): Open Gym si avvia in finestra propria e **funziona offline** —
  solo i video YouTube richiedono la connessione.
- **Aggiornamenti**: quando esce una nuova versione compare un avviso; premi
  **Aggiorna ora** quando ti fa comodo.

## Privacy e statistiche d'uso

I tuoi dati (esercizi, schede, allenamenti, storico) restano **sul tuo dispositivo**: nessun
account, nessun server. Escono solo se sei tu a chiederlo: proponendo un esercizio alla
community, votandone uno (nel repository finisce solo un codice anonimo del dispositivo) o
aprendo un video YouTube.

Se l'istanza che stai usando le ha configurate, l'app misura in forma **anonima** quali sezioni
apri, per capire cosa migliorare: **niente cookie, niente profilo, niente indirizzo IP
conservato**. Le trovi in fondo alla pagina, sotto «Statistiche d'uso», e puoi **spegnerle
quando vuoi**: la scelta resta salvata sul dispositivo. Se il tuo browser invia «Do Not Track»,
restano spente da sole.

Dettagli completi: [docs/PRIVACY.md](PRIVACY.md).

## Impostazioni

L'ultima scheda in basso raccoglie le preferenze di **questo dispositivo**:

- **Lingua** — italiano o inglese. La scelta resta salvata: l'app non la indovina dal browser.
- **Tema** — automatico (segue il sistema), chiaro o scuro.
- **Backup dei dati** — esporta il JSON, importalo sostituendo tutto o **unendolo** ai dati
  presenti (senza duplicati).

Lingua e tema NON finiscono nel backup: sono preferenze del dispositivo, non dati tuoi.

## Nei campi numerici

Peso, ripetizioni e statura hanno una **rotella di valori** già pronti: si apre dal pulsante
del campo e si sceglie con un tocco. Accanto restano i pulsanti **+/−**, e il campo resta
scrivibile a mano per i valori fuori scala.
