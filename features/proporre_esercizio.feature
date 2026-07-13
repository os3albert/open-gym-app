# language: it
Funzionalità: Proporre un esercizio
  Per condividere esercizi utili con la community
  Come utente della piattaforma
  Voglio proporre un esercizio con un video YouTube

  Scenario: Proposta di un esercizio con link YouTube valido
    Dato che non ci sono esercizi salvati
    Quando propongo l'esercizio "Panca piana" con link "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    Allora l'esercizio "Panca piana" compare nell'elenco degli esercizi
    E l'esercizio "Panca piana" ha 0 voti

  Scenario: Rifiuto di un link che non è un video YouTube
    Dato che non ci sono esercizi salvati
    Quando provo a proporre l'esercizio "Squat" con link "https://vimeo.com/12345"
    Allora la proposta viene rifiutata con l'errore "Inserisci un link YouTube valido"
    E l'elenco degli esercizi è vuoto

  Scenario: Il volto offuscato è un consiglio, non un obbligo
    Dato che non ci sono esercizi salvati
    Quando propongo l'esercizio "Squat" senza confermare il volto offuscato
    Allora l'esercizio "Squat" compare nell'elenco degli esercizi

  Scenario: Proposta con fascia di statura consigliata
    Dato che non ci sono esercizi salvati
    Quando propongo l'esercizio "Stacco" con fascia di statura da 170 a 190 cm
    Allora l'esercizio "Stacco" ha la fascia di statura da 170 a 190 cm
