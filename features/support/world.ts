import { setWorldConstructor, World, type IWorldOptions } from '@cucumber/cucumber'
import type { AppData } from '../../src/domain/types'
import { emptyData } from '../../src/services/storage'

/** Stato condiviso tra gli step di uno scenario: i dati dell'app e l'esito dell'ultima azione. */
export class GymWorld extends World {
  data: AppData = emptyData()
  error: string | null = null
  suggestion: number | null = null

  constructor(options: IWorldOptions) {
    super(options)
  }
}

setWorldConstructor(GymWorld)
