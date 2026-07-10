# language: it
Funzionalità: Voti della community
  Per far emergere gli esercizi più utili
  Come utente della piattaforma
  Voglio votare gli esercizi proposti, come su Reddit

  Scenario: Upvote di un esercizio
    Dato che è stato proposto l'esercizio "Trazioni" con link "https://youtu.be/AAAAAAAAAAA"
    Quando faccio upvote all'esercizio "Trazioni"
    Allora l'esercizio "Trazioni" ha 1 voto

  Scenario: Gli esercizi sono ordinati per voti decrescenti
    Dato che è stato proposto l'esercizio "Trazioni" con link "https://youtu.be/AAAAAAAAAAA"
    E che è stato proposto l'esercizio "Affondi" con link "https://youtu.be/BBBBBBBBBBB"
    Quando faccio upvote all'esercizio "Affondi"
    Allora il primo esercizio in classifica è "Affondi"
