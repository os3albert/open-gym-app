# language: it
Funzionalità: Voti della community
  Per far emergere gli esercizi più utili
  Come utente della piattaforma
  Voglio votare gli esercizi proposti, come su Reddit, con un solo voto per dispositivo

  Scenario: Upvote di un esercizio
    Dato che è stato proposto l'esercizio "Trazioni" con link "https://youtu.be/AAAAAAAAAAA"
    E che l'esercizio "Trazioni" ha già 5 voti
    Quando faccio upvote all'esercizio "Trazioni"
    Allora l'esercizio "Trazioni" ha 6 voti
    E il mio voto per "Trazioni" risulta attivo

  Scenario: Rimozione del voto
    Dato che è stato proposto l'esercizio "Trazioni" con link "https://youtu.be/AAAAAAAAAAA"
    E che l'esercizio "Trazioni" ha già 5 voti
    E che ho già votato l'esercizio "Trazioni"
    Quando faccio upvote all'esercizio "Trazioni"
    Allora l'esercizio "Trazioni" ha 5 voti
    E il mio voto per "Trazioni" non risulta attivo

  Scenario: Gli esercizi sono ordinati per voti decrescenti
    Dato che è stato proposto l'esercizio "Trazioni" con link "https://youtu.be/AAAAAAAAAAA"
    E che è stato proposto l'esercizio "Affondi" con link "https://youtu.be/BBBBBBBBBBB"
    Quando faccio upvote all'esercizio "Affondi"
    Allora il primo esercizio in classifica è "Affondi"
