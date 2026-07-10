# language: it
Funzionalità: Filtri per statura e ordinamento
  Per trovare esercizi replicabili con il mio corpo
  Come utente con una certa statura
  Voglio filtrare gli esercizi adatti a me e ordinarli

  Scenario: Filtro automatico per la mia statura
    Dato che è stato proposto l'esercizio "Panca stretta" con fascia di statura da 170 a 190 cm
    E che è stato proposto l'esercizio "Squat olimpico" con fascia di statura da 150 a 165 cm
    E che la mia statura è di 185 cm
    Quando attivo il filtro "Adatti a me"
    Allora l'unico esercizio visibile è "Panca stretta"

  Scenario: Un esercizio senza fascia di statura è adatto a tutti
    Dato che è stato proposto l'esercizio "Plank" senza fascia di statura
    E che è stato proposto l'esercizio "Squat olimpico" con fascia di statura da 150 a 165 cm
    E che la mia statura è di 185 cm
    Quando attivo il filtro "Adatti a me"
    Allora l'unico esercizio visibile è "Plank"

  Scenario: Ordinamento per voti
    Dato che è stato proposto l'esercizio "Trazioni" senza fascia di statura
    E che è stato proposto l'esercizio "Affondi" senza fascia di statura
    E che l'esercizio "Affondi" ha già 3 voti
    Quando ordino gli esercizi per più votati
    Allora vedo gli esercizi nell'ordine "Affondi", "Trazioni"

  Scenario: Primo utilizzo senza statura impostata
    Dato che è stato proposto l'esercizio "Plank" senza fascia di statura
    E che non ho impostato la mia statura
    Quando attivo il filtro "Adatti a me"
    Allora mi viene chiesto di inserire la mia statura
