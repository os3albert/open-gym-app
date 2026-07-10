# language: it
Funzionalità: Suggerimento del peso
  Per non dover ricordare i carichi usati in passato
  Come utente che si allena
  Voglio che l'app mi suggerisca il peso in base al mio storico

  Scenario: Nessuno storico disponibile
    Dato che non ho attività registrate per l'esercizio "Panca piana"
    Quando chiedo il peso suggerito per l'esercizio "Panca piana"
    Allora non ricevo alcun suggerimento di peso

  Scenario: Progressione quando tutte le serie raggiungono le ripetizioni obiettivo
    Dato che ho registrato per l'esercizio "Panca piana" una sessione in data "2026-07-08" con le serie:
      | peso | ripetizioni |
      | 60   | 8           |
      | 60   | 8           |
      | 60   | 9           |
    Quando chiedo il peso suggerito per l'esercizio "Panca piana"
    Allora il peso suggerito è di 62.5 kg

  Scenario: Consolidamento quando una serie non raggiunge le ripetizioni obiettivo
    Dato che ho registrato per l'esercizio "Panca piana" una sessione in data "2026-07-08" con le serie:
      | peso | ripetizioni |
      | 60   | 8           |
      | 60   | 6           |
    Quando chiedo il peso suggerito per l'esercizio "Panca piana"
    Allora il peso suggerito è di 60 kg

  Scenario: Conta solo la sessione più recente
    Dato che ho registrato per l'esercizio "Stacco" una sessione in data "2026-07-01" con le serie:
      | peso | ripetizioni |
      | 100  | 8           |
    E che ho registrato per l'esercizio "Stacco" una sessione in data "2026-07-08" con le serie:
      | peso  | ripetizioni |
      | 102.5 | 5           |
    Quando chiedo il peso suggerito per l'esercizio "Stacco"
    Allora il peso suggerito è di 102.5 kg
