/**
 * Italiano: è la fonte di verità dei testi. Ogni altra lingua è tipizzata su questo file,
 * quindi una chiave che manca altrove non compila.
 *
 * Le chiavi `errors.*` corrispondono ai CODICI lanciati da dominio e worker (`EMPTY_NAME`,
 * `INVALID_SET`…): sono le frasi che l'utente legge, e in italiano restano identiche a quelle
 * di sempre — è ciò che tiene intatto il contratto di BDD e Cypress.
 */
export const it = {
  // Errori di dominio (i codici lanciati da src/domain e src/services, worker compreso)
  'errors.EMPTY_NAME': "Il nome dell'esercizio è obbligatorio",
  'errors.INVALID_YOUTUBE_LINK': 'Inserisci un link YouTube valido',
  'errors.FACE_BLUR_REQUIRED': 'Conferma che il volto nel video è offuscato',
  'errors.INVALID_STATURE_RANGE': 'La fascia di statura non è valida (100–250 cm)',
  'errors.INVALID_STATURE': 'Inserisci una statura tra 100 e 250 cm',
  'errors.INVALID_SET': 'Serie non valida: servono almeno 1 ripetizione e un peso ≥ 0',
  'errors.EXERCISE_NOT_FOUND': 'Esercizio non trovato',
  'errors.EMPTY_PLAN_NAME': 'Il nome della scheda è obbligatorio',
  'errors.PLAN_NOT_FOUND': 'Scheda non trovata',
  'errors.EMPTY_DAY_NAME': 'Il nome del giorno è obbligatorio',
  'errors.DUPLICATE_DAY_NAME': "Nella scheda c'è già un giorno con questo nome",
  'errors.DAY_NOT_FOUND': 'Giorno non trovato nella scheda',
  'errors.INVALID_TARGET': 'Il target non è valido: servono almeno 1 serie e 1 ripetizione',
  'errors.DUPLICATE_ENTRY': 'Questo esercizio è già previsto in questo giorno',
  'errors.INVALID_JSON': 'Il file non contiene JSON valido',
  'errors.INVALID_FORMAT': 'Formato di backup non riconosciuto',
  'errors.INVALID_SHARE_CODE': 'Codice di condivisione non valido',
  'errors.STORAGE_FULL':
    'Spazio esaurito sul dispositivo: esporta un backup e libera spazio, poi riprova',
  'errors.DUPLICATE_EXERCISE': 'Questo video è già nel catalogo della community',
  'errors.UNKNOWN_EXERCISE': 'Esercizio non presente nel catalogo della community',
  'errors.TOO_LONG': 'Il testo inserito è troppo lungo',
  'errors.COMMUNITY_UNREACHABLE': 'Community non raggiungibile: riprova più tardi',
  'errors.INVALID_DATA': 'Dati non validi',

  // Esiti delle operazioni sulla community
  'community.proposalSent': 'Proposta inviata alla community!',
  'community.localOnly': (p: { reason: string }) => `Salvato solo sul dispositivo: ${p.reason}`,
} as const
