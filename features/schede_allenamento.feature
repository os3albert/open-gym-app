# language: it
Funzionalità: Schede di allenamento organizzate per giorni
  Per non dover decidere ogni volta cosa allenare
  L'utente costruisce schede per giorni e ne tiene una attiva
  che propone l'allenamento del giorno.

  Scenario: Creazione di una scheda con un esercizio nel giorno
    Dato che ho creato la scheda "Full Body 3x"
    Quando aggiungo al giorno "Lunedì" della scheda "Full Body 3x" l'esercizio "Panca piana" con 3 serie da 8
    Allora la scheda "Full Body 3x" prevede "Panca piana" 3x8 sotto "Lunedì"

  Scenario: Più schede, quella attiva guida l'allenamento del giorno
    Dato che ho creato la scheda "Scheda A"
    E che ho creato la scheda "Scheda B"
    E che aggiungo al giorno "Lunedì" della scheda "Scheda B" l'esercizio "Squat" con 5 serie da 5
    Quando imposto "Scheda B" come scheda attiva
    Allora l'allenamento di lunedì 2026-07-06 propone l'esercizio "Squat"

  Scenario: Eliminazione di una scheda non attiva
    Dato che ho creato la scheda "Scheda A"
    E che ho creato la scheda "Da buttare"
    E che imposto "Scheda A" come scheda attiva
    Quando elimino la scheda "Da buttare"
    Allora le mie schede sono solo "Scheda A"
    E la scheda attiva è ancora "Scheda A"

  Scenario: Giorno di riposo con il prossimo allenamento previsto
    Dato che ho creato la scheda "Solo lunedì"
    E che aggiungo al giorno "Lunedì" della scheda "Solo lunedì" l'esercizio "Squat" con 3 serie da 8
    E che imposto "Solo lunedì" come scheda attiva
    Quando guardo l'allenamento di sabato 2026-07-11
    Allora è un giorno di riposo
    E il prossimo allenamento previsto è "Lunedì" in data 2026-07-13
