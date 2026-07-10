# language: it
Funzionalità: Registrazione della sessione di allenamento
  Per tenere traccia dei pesi che sollevo
  Come utente che si allena
  Voglio registrare serie, ripetizioni e peso degli esercizi svolti

  Scenario: Registrazione di un esercizio svolto
    Dato che sto registrando la sessione di oggi
    Quando aggiungo l'esercizio "Panca piana" con 3 serie da 8 ripetizioni a 60 kg
    Allora la sessione di oggi contiene "Panca piana" con 3 serie
    E tutte le serie di "Panca piana" hanno 60 kg e 8 ripetizioni

  Scenario: Serie con pesi diversi
    Dato che sto registrando la sessione di oggi
    Quando registro per l'esercizio "Stacco" le serie con pesi 60, 65 e 70 kg
    Allora le serie di "Stacco" nella sessione di oggi hanno i pesi 60, 65 e 70 kg

  Scenario: Rifiuto di una serie non valida
    Dato che sto registrando la sessione di oggi
    Quando provo a registrare per "Panca piana" una serie da 0 ripetizioni a 60 kg
    Allora la registrazione viene rifiutata

  Scenario: Persistenza fra ricarichi
    Dato che sto registrando la sessione di oggi
    E che ho aggiunto l'esercizio "Squat" con 1 serie da 5 ripetizioni a 80 kg
    Quando salvo e ricarico i dati dell'app
    Allora la sessione di oggi contiene "Squat" con 1 serie
