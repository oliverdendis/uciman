/**
 * Most medzi študentským API a Phaser scénou. Scéna sa sem zaregistruje
 * pri create(); API tak nemusí poznať Phaser.
 */
export interface MostHraca {
  readonly x: number
  readonly y: number
  /** skok zo zeme (s malou toleranciou, viď Hrac) */
  jump(): void
  /** vodorovná rýchlosť na tento snímok; kladná = doprava */
  walk(rychlost: number): void
}

let aktualnyHrac: MostHraca | null = null

export function napojHraca(h: MostHraca | null): void {
  aktualnyHrac = h
}

export function hracVHre(): MostHraca | null {
  return aktualnyHrac
}
