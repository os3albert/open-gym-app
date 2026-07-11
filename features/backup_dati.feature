# language: it
Funzionalità: Backup dei dati in un file JSON
  I dati vivono solo sul dispositivo: l'utente scarica un backup completo
  e lo ripristina sostituendo tutto oppure unendolo ai dati presenti.

  Scenario: Il backup esportato contiene tutto, con versione dello schema e data
    Dato che ho l'esercizio "Trazioni" nei miei dati
    Quando esporto il backup in data 2026-07-11
    Allora il file di backup si chiama "open-gym-backup-2026-07-11.json"
    E il backup contiene l'esercizio "Trazioni", la versione dello schema e la data di export

  Scenario: Ripristino completo
    Dato un file di backup con l'esercizio "Trazioni"
    E che ho l'esercizio "Squat" nei miei dati
    Quando importo il backup scegliendo di sostituire tutto
    Allora i miei dati corrispondono esattamente al backup

  Scenario: Unione con i dati presenti senza duplicati
    Dato un file di backup con l'esercizio "Trazioni"
    E che ho l'esercizio "Trazioni" nei miei dati con lo stesso video
    E che ho l'esercizio "Squat" nei miei dati
    Quando importo il backup scegliendo di unire
    Allora ho un solo esercizio "Trazioni"
    E ho ancora l'esercizio "Squat"

  Scenario: Un file non valido non tocca i dati esistenti
    Dato che ho l'esercizio "Squat" nei miei dati
    E un file di backup corrotto
    Quando provo a importare il file di backup
    Allora l'importazione viene rifiutata
    E i miei dati restano invariati
