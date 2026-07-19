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
  'errors.DUPLICATE_PLAN': 'Una scheda con questo nome è già nella community',
  'errors.UNKNOWN_PLAN': 'Scheda non presente nel catalogo della community',
  'errors.INVALID_PLAN': 'La scheda proposta non è valida',

  // Esiti delle operazioni sulla community
  'community.proposalSent': 'Proposta inviata alla community!',
  'community.localOnly': (p: { reason: string }) => `Salvato solo sul dispositivo: ${p.reason}`,

  // Sezioni della community (esercizi + schede proposte)
  'community.tabsLabel': 'Sezioni della community',
  'community.tabExercises': 'Esercizi',
  'community.tabPlans': 'Schede',
  'community.plansTitle': 'Schede della community',
  'community.plansEmpty': 'Nessuna scheda proposta finora: proponi la tua!',
  'community.planSummary': (p: { days: number; exercises: number }) =>
    `${p.days} giorni · ${p.exercises} esercizi`,
  'community.planProposalSent': 'Scheda inviata alla community!',
  // Non «Proponi una scheda»: sarebbe il nome accessibile del titolo del modale
  'community.proposePlan': 'Proponi scheda',
  'community.proposePlanTitle': 'Proponi una scheda alla community',
  'community.proposePlanHint':
    'La scheda scelta viene pubblicata nel catalogo della community con i suoi esercizi.',
  'community.noPlansToPropose': 'Non hai ancora schede da proporre: creane una nella vista Schede.',
  'community.planToPropose': 'Scheda da proporre',
  'community.sendProposal': 'Invia proposta',
  'community.planImported': 'Scheda aggiunta alle tue e attivata!',

  // Shell dell'app
  'hero.label': 'Presentazione',
  'hero.tagline': 'Open source · Nessuna registrazione',
  'hero.description':
    'Esercizi proposti dalla community, votati come su Reddit. Nessuna registrazione: i dati restano sul tuo dispositivo.',
  'hero.proposals': 'Proposte',
  'hero.votesCast': 'Voti dati',
  'hero.sessions': 'Sessioni',
  'app.corrupted':
    'I dati salvati su questo dispositivo non erano leggibili: si riparte da zero. Se hai un backup JSON puoi ripristinarlo dalla sezione «Backup dei dati».',
  'app.communityExercises': 'Esercizi della community',
  // «Nuova proposta» NON può chiamarsi «Proponi esercizio»: è il nome accessibile del submit
  // del form, e le query per ruolo dei test collidono.
  'app.newProposal': 'Nuova proposta',
  'app.closeForm': 'Chiudi il form',

  // Timer di allenamento (M14): il nome accessibile del FAB resta «Timer», qualunque
  // cosa mostri la scritta (fase e tempo cambiano ogni secondo).
  'timer.fab': 'Timer',
  'timer.exercise': 'Esercizio',
  'timer.rest': 'Pausa',
  'timer.stop': 'Ferma il timer',

  // Impostazioni
  'settings.theme': 'Tema',
  'settings.themeAuto': 'Auto',
  'settings.themeLight': 'Chiaro',
  'settings.themeDark': 'Scuro',
  'settings.language': 'Lingua',

  // Home (M16)
  'home.weeklyProgress': 'Progresso settimanale',
  'home.thisWeek': 'Questa settimana',
  'home.volumeAndIntensity': 'Volume e intensità, giorno per giorno',
  'home.weekChartLabel': (p: { days: number; volume: number }) =>
    `Progresso della settimana: ${p.days} ${p.days === 1 ? 'giorno' : 'giorni'} di allenamento, volume totale ${p.volume} kg×reps`,
  'home.emptyWeek': 'Questa settimana non hai ancora registrato allenamenti.',
  'home.yourDays': 'I giorni della tua scheda',
  'home.noPlan': 'Non hai ancora una scheda attiva: creane una e attivala.',
  'home.goToPlans': 'Vai alle schede',
  'home.planWithoutDays': (p: { name: string }) =>
    `La scheda «${p.name}» non ha ancora giorni: aggiungili da Schede → Modifica.`,
  'home.openDay': (p: { day: string }) => `Apri l'allenamento di ${p.day}`,
  'home.dayEmpty': 'Nessun esercizio in questo giorno',
  'home.exerciseCount': (p: { count: number }) =>
    p.count === 1 ? '1 esercizio' : `${p.count} esercizi`,

  // Navigazione
  'nav.label': "Sezioni dell'app",
  'nav.home': 'Home',
  'nav.community': 'Community',
  'nav.plans': 'Schede',
  'nav.workout': 'Allenamento',
  'nav.settings': 'Impostazioni',

  // Installazione e aggiornamento
  'install.button': "Installa l'app",
  'install.iosHintPrefix': 'Per installarla:',
  'install.iosShare': 'Condividi',
  'install.iosAddToHome': 'Aggiungi a schermata Home',
  'update.available': "È disponibile una nuova versione dell'app.",
  'update.now': 'Aggiorna ora',
  'update.later': 'Più tardi',

  // Statistiche anonime
  'privacy.title': "Statistiche d'uso",
  'privacy.explanation':
    "Contiamo in forma anonima quali sezioni dell'app vengono usate, per capire cosa migliorare. Nessun cookie, nessun profilo, nessun identificatore: non registriamo il tuo indirizzo IP e i tuoi esercizi, allenamenti e schede non lasciano mai il dispositivo.",
  'privacy.toggleOn': 'Statistiche anonime attive',
  'privacy.toggleOff': 'Statistiche anonime disattivate',
  'privacy.doNotTrack':
    'Il tuo browser chiede di non essere tracciato («Do Not Track»): rispettiamo la scelta e le statistiche restano spente.',

  // Form dell'esercizio. Attenzione: «Proponi esercizio» (submit) e «Nuova proposta» (bottone che
  // apre il form) DEVONO restare due frasi diverse, o le query per ruolo dei test collidono.
  'form.newTitle': 'Proponi un esercizio',
  'form.editTitle': 'Modifica esercizio',
  'form.intro':
    "Carica il link di un video YouTube con il volto offuscato dall'AI: si valuta l'esercizio, non la persona.",
  'form.name': 'Nome esercizio',
  'form.muscleGroup': 'Gruppo muscolare',
  'form.statureFrom': 'Statura consigliata da (cm)',
  'form.statureFromExample': 'es. 170',
  'form.statureTo': 'a (cm)',
  'form.statureToExample': 'es. 190',
  'form.statureHint': "Lascia vuota la fascia di statura se l'esercizio è adatto a tutti.",
  'form.youtube': 'Link YouTube (volto offuscato)',
  'form.videoPreviewAlt': 'Anteprima del video YouTube',
  'form.description': 'Descrizione',
  'form.guidelinesSummary': 'Linee guida video (volto offuscato)',
  'form.guidelineStudio':
    'Su YouTube Studio: Editor → Sfoca → «Sfocatura viso», rileva e segue i volti automaticamente (gratuito).',
  'form.guidelineApps':
    'In alternativa: app di editing con blur AI (es. CapCut) prima del caricamento.',
  'form.guidelineFullRep': "Il video deve mostrare l'esecuzione completa dell'esercizio.",
  'form.guidelineUnlisted': 'Carica come «Non in elenco» se non vuoi che appaia nel tuo canale.',
  'form.faceBlurNote':
    'Il volto non è importante: si guarda il movimento, non la persona. Se preferisci, offuscalo — non è obbligatorio.',
  'form.submitNew': 'Proponi esercizio',
  'form.submitEdit': 'Salva modifiche',
  'form.cancelEdit': 'Annulla modifica',

  // Lista degli esercizi
  'list.empty': 'Nessun esercizio proposto finora. Proponi tu il primo!',
  'list.noResults': 'Nessun esercizio corrisponde ai filtri scelti.',
  'list.vote': (p: { name: string }) => `Vota ${p.name}`,
  'list.removeVote': (p: { name: string }) => `Rimuovi il voto a ${p.name}`,
  'list.edit': 'Modifica',
  'list.share': 'Condividi',
  'list.addToPlan': 'Aggiungi alla scheda',
  'list.showMore': 'Mostra altri',
  'list.shownCount': (p: { shown: number; total: number }) => `${p.shown} di ${p.total} esercizi`,
  'list.delete': 'Elimina',
  'list.confirmDelete': 'Conferma eliminazione',
  'list.cancel': 'Annulla',

  // Campi numerici
  'number.confirm': 'Conferma',
  'number.chooseValue': (p: { label: string }) => `Scegli un valore per ${p.label}`,

  // Gruppi muscolari (codici nei dati, parole qui)
  'muscle.chest': 'Petto',
  'muscle.back': 'Schiena',
  'muscle.legs': 'Gambe',
  'muscle.shoulders': 'Spalle',
  'muscle.arms': 'Braccia',
  'muscle.core': 'Core',
  'muscle.glutes': 'Glutei',
  'muscle.calves': 'Polpacci',
  'muscle.fullBody': 'Full body',
  'muscle.other': 'Altro',
  'form.muscleGroupChoose': 'Scegli il gruppo muscolare',
  'errors.MISSING_MUSCLE_GROUP': 'Scegli il gruppo muscolare',

  // Difficoltà
  'difficulty.easy': 'Facile',
  'difficulty.medium': 'Media',
  'difficulty.hard': 'Difficile',
  'form.difficulty': 'Difficoltà',
  'form.difficultyChoose': 'Scegli…',
  'filters.difficulty': 'Filtra per difficoltà',
  'filters.allDifficulties': 'Tutte',
  'errors.MISSING_DIFFICULTY': 'Scegli il grado di difficoltà',

  // Filtri
  'filters.myStature': 'La mia statura (cm)',
  'filters.staturePlaceholder': 'es. 180',
  'filters.save': 'Salva',
  'filters.suitableForMe': 'Adatti a me',
  'filters.search': 'Cerca per nome',
  'filters.searchPlaceholder': 'es. panca, squat…',
  'filters.muscleGroup': 'Filtra per gruppo muscolare',
  'filters.all': 'Tutti',
  'filters.sortBy': 'Ordina per',
  'filters.mostVoted': 'Più votati',
  'filters.mostRecent': 'Più recenti',
  'filters.statureRequired': 'Per usare «Adatti a me» inserisci prima la tua statura qui sopra.',

  // Sessione di allenamento
  'session.title': 'Allenamento di oggi',
  'session.subtitle': (p: { date: string }) => `${p.date} — registra serie, ripetizioni e peso.`,
  'session.noExercises': "Non c'è ancora nessun esercizio: proponine uno nella scheda «Esercizi».",
  'session.exercise': 'Esercizio',
  'session.chooseExercise': 'Scegli un esercizio…',
  'session.weight': 'Peso (kg)',
  'session.weightMinus': 'Diminuisci il peso di 2,5 kg',
  'session.weightPlus': 'Aumenta il peso di 2,5 kg',
  'session.reps': 'Ripetizioni',
  'session.repsMinus': 'Diminuisci le ripetizioni',
  'session.repsPlus': 'Aumenta le ripetizioni',
  'session.addSet': 'Aggiungi serie',
  'session.todaySets': 'Serie registrate oggi',
  'session.removeSet': (p: { weight: number; reps: number; name: string }) =>
    `Rimuovi la serie ${p.weight} kg × ${p.reps} di ${p.name}`,

  // Allenamento del giorno (dalla scheda attiva)
  'today.yourPlan': (p: { name: string }) => `La tua scheda: ${p.name}`,
  'today.restDay': 'Oggi riposo 💤',
  'today.nextWorkout': 'Prossimo allenamento:',
  'today.chooseDayAnyway': 'Ti alleni lo stesso? Scegli il giorno',
  'today.whichDay': 'Che giorno della scheda fai oggi?',
  'today.choose': 'Scegli…',
  'today.backToToday': 'Giorno di oggi',
  'today.dayHint': (p: { name: string }) =>
    `${p.name} — spunta gli esercizi man mano che li completi.`,
  'today.dayEmpty': 'Questo giorno non ha esercizi: aggiungili dalla scheda.',
  'today.setLog': 'Log delle serie',
  'today.setNumber': 'Serie',
  'today.status': 'Stato',
  'today.addSet': '+ Aggiungi serie',
  'today.stats': 'Statistiche',
  // Il default dei grafici del carosello (M18): le due serie insieme
  'today.bothMetrics': 'Peso e ripetizioni',
  // Bozze e conferma nello storico (M17)
  'today.confirmHistory': (p: { count: number }) =>
    p.count === 1 ? 'Conferma 1 serie nello storico' : `Conferma ${p.count} serie nello storico`,
  'today.removeDraft': (p: { set: number; name: string }) =>
    `Togli dalla bozza la serie ${p.set} di ${p.name}`,
  'today.pendingBanner': (p: { count: number; date: string }) =>
    p.count === 1
      ? `Hai 1 serie del ${p.date} spuntata ma non salvata nello storico.`
      : `Hai ${p.count} serie del ${p.date} spuntate ma non salvate nello storico.`,
  'today.pendingSave': 'Salva nello storico',
  'today.pendingDiscard': 'Scarta',
  'today.position': (p: { position: number; total: number }) => `${p.position} di ${p.total}`,
  'today.prevExercise': 'Esercizio precedente',
  'today.nextExercise': 'Esercizio successivo',
  'today.recordSet': (p: { set: number; name: string }) =>
    `Registra la serie ${p.set} di ${p.name}`,
  'today.removeSet': (p: { set: number; name: string }) => `Annulla la serie ${p.set} di ${p.name}`,
  'today.done': '✓ Registrato oggi',
  'today.skipped': 'Saltato per oggi',
  'today.undoSkip': 'Annulla',
  'today.complete': 'Fatto ✓',
  'today.skip': 'Salta',

  // Storico
  // Metriche e periodi dei grafici: nati nello Storico, da M18 vivono sotto il carosello
  'history.metric': 'Metrica',
  'history.period': 'Periodo',
  'history.all': 'Tutto lo storico',
  'history.last30': 'Ultimi 30 giorni',
  'history.last90': 'Ultimi 90 giorni',
  'history.maxWeight': 'Peso massimo',
  'history.totalReps': 'Ripetizioni totali',
  'history.maxReps': 'Ripetizioni massime',
  'history.volume': 'Volume (kg × reps)',

  // Grafico: questi titoli finiscono nell'aria-label, che è contratto dei test.
  // In italiano NON vanno cambiati.
  'chart.maxWeight': 'Andamento del carico',
  'chart.totalReps': 'Andamento delle ripetizioni totali',
  'chart.maxReps': 'Andamento delle ripetizioni massime',
  'chart.volume': 'Andamento del volume',
  'chart.empty': 'Nessuna sessione registrata per questo esercizio.',
  // Contratto dei test come l'aria-label del carico: il prefisso non si cambia
  'chart.dualLabel': (p: {
    weightFrom: number
    weightTo: number
    repsFrom: number
    repsTo: number
    from: string
    to: string
  }) =>
    `Andamento di peso e ripetizioni: peso da ${p.weightFrom} a ${p.weightTo} kg, ` +
    `ripetizioni da ${p.repsFrom} a ${p.repsTo} (dal ${p.from} al ${p.to})`,

  // Video
  'video.play': (p: { title: string }) => `Riproduci il video di ${p.title}`,
  'video.thumbnailAlt': (p: { title: string }) => `Anteprima video di ${p.title}`,
  'video.offline': 'Video non disponibile senza connessione',
  'video.gifAlt': (p: { title: string }) => `Dimostrazione animata di ${p.title}`,

  // Backup
  'backup.title': 'Backup dei dati',
  'backup.explanation':
    'I dati vivono solo su questo dispositivo (localStorage): esporta un backup JSON per non perderli o importane uno esistente.',
  'backup.export': 'Esporta backup JSON',
  'backup.import': 'Importa backup JSON',
  'backup.exported': 'Backup esportato: controlla i download del dispositivo',
  'backup.replaced': 'Backup importato correttamente',
  'backup.merged': 'Backup unito ai dati presenti, senza duplicati',

  'backup.howToImport': 'Backup valido. Come lo importiamo?',
  'backup.replaceAll': 'Sostituisci tutto',
  'backup.mergeMine': 'Unisci ai miei dati',
  'backup.cancel': 'Annulla',

  // Schede
  'plans.title': 'Le mie schede',
  'plans.newPlan': 'Nuova scheda',
  'plans.newPlanExample': 'Es. Full Body 3x',
  'plans.create': 'Crea scheda',
  'plans.empty': 'Nessuna scheda: creane una o importane una condivisa.',
  'plans.activeBadge': '✓ attiva',
  'plans.activate': 'Attiva',
  'plans.noDays': 'Nessun giorno',

  // Editor della scheda
  'planEditor.title': 'Modifica scheda',
  'planEditor.planName': 'Nome della scheda',
  'planEditor.rename': 'Rinomina',
  'planEditor.newDay': 'Nuovo giorno',
  'planEditor.newDayExample': 'Lunedì, Giorno A…',
  'planEditor.chooseDay': 'Scegli il giorno',
  // I nomi dei giorni non si traducono (sono dati): si traduce l'invito a scriverne uno tuo
  'planEditor.customDay': 'Nome libero',
  'planEditor.addDay': 'Aggiungi giorno',
  'planEditor.close': 'Chiudi editor',
  'planEditor.noDays': 'Nessun giorno: aggiungi «Lunedì» o «Giorno A» per iniziare.',
  'planEditor.removeDay': 'Rimuovi giorno',
  'planEditor.removeDayLabel': (p: { day: string }) => `Rimuovi il giorno ${p.day}`,
  'planEditor.dayEmpty': 'Nessun esercizio in questo giorno.',
  'planEditor.moveUp': (p: { name: string; day: string }) => `Sposta su ${p.name} in ${p.day}`,
  'planEditor.moveDown': (p: { name: string; day: string }) => `Sposta giù ${p.name} in ${p.day}`,
  'planEditor.removeEntry': (p: { name: string; day: string }) => `Rimuovi ${p.name} da ${p.day}`,
  'planEditor.sets': 'Serie',
  'planEditor.add': 'Aggiungi',

  // Aggiungi alla scheda, dalla lista della Community (M15)
  'addToPlan.plan': 'Scheda',
  'addToPlan.day': 'Giorno',
  'addToPlan.add': 'Aggiungi',
  'addToPlan.noPlans': 'Non hai ancora una scheda: creane una dalla sezione Schede.',
  'addToPlan.noDays':
    'Questa scheda non ha ancora giorni: aggiungine uno da «Modifica», nella sezione Schede.',
  'addToPlan.done': (p: { name: string; plan: string; day: string }) =>
    `«${p.name}» è ora in ${p.plan} — ${p.day}.`,

  // Importazione di un codice condiviso. Il pannello vive nella sezione Schede e di schede
  // parla: gli esercizi hanno la Community, le schede no — sono la cosa che si scambia per
  // codice. Un codice di un singolo esercizio resta comunque accettato: chi ce l'ha in mano
  // non deve trovarsi la porta chiusa.
  'import.title': 'Importa una scheda',
  'import.explanation':
    "Incolla il codice che ti hanno mandato: vedrai un'anteprima prima di aggiungere. " +
    'Vale anche per il codice di un singolo esercizio.',
  'import.codeLabel': 'Codice ricevuto',
  'import.preview': 'Anteprima',
  'import.exerciseLabel': (p: { name: string }) => `Esercizio: ${p.name}`,
  'import.planLabel': (p: { name: string }) => `Scheda: ${p.name}`,
  'import.add': 'Aggiungi ai miei',
  'import.tryPlan': 'Prova questa scheda',
  'import.planAdded': 'Scheda aggiunta alle tue!',
  'import.exerciseAdded': 'Esercizio aggiunto ai tuoi (se non lo avevi già).',
  'import.activated': 'Fatta! Ora è la tua scheda attiva.',

  // Condivisione
  'share.codeLabel': 'Codice di condivisione',
  'share.copyCode': 'Copia codice',
  'share.copyLink': 'Copia link',
  'share.native': 'Condividi…',
  'share.codeCopied': 'Codice copiato negli appunti!',
  'share.linkCopied': 'Link copiato negli appunti!',
} as const
