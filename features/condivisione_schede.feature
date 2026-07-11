# language: it
Funzionalità: Condivisione di schede ed esercizi tra utenti
  Senza backend, la condivisione viaggia in un codice portabile:
  chi lo riceve importa la scheda completa, esercizi inclusi.

  Scenario: Dalla condivisione all'importazione su un altro dispositivo
    Dato che ho creato la scheda "Push Pull Legs"
    E che aggiungo al giorno "Lunedì" della scheda "Push Pull Legs" l'esercizio "Panca piana" con 3 serie da 8
    E che aggiungo al giorno "Giovedì" della scheda "Push Pull Legs" l'esercizio "Squat" con 5 serie da 5
    Quando genero il codice di condivisione della scheda "Push Pull Legs"
    E importo il codice su un dispositivo con dati vuoti
    Allora l'altro dispositivo ha la scheda "Push Pull Legs" con i giorni "Lunedì" e "Giovedì"
    E l'altro dispositivo prevede "Panca piana" 3x8 sotto "Lunedì"

  Scenario: Un codice corrotto viene rifiutato senza toccare i dati
    Quando provo a importare il codice "questo-non-e-un-codice"
    Allora l'importazione viene rifiutata
    E i dati dell'altro dispositivo restano vuoti

  Scenario: L'esercizio già presente non viene duplicato all'importazione
    Dato che ho creato la scheda "Push Pull Legs"
    E che aggiungo al giorno "Lunedì" della scheda "Push Pull Legs" l'esercizio "Panca piana" con 3 serie da 8
    E che l'altro dispositivo ha già l'esercizio "Panca piana" con lo stesso video
    Quando genero il codice di condivisione della scheda "Push Pull Legs"
    E importo il codice su quel dispositivo
    Allora l'altro dispositivo ha un solo esercizio "Panca piana"
