/**
 * Most medzi študentským API a Phaser scénou. Scéna sa sem zaregistruje
 * pri create(); API tak nemusí poznať Phaser.
 */
export interface MostHraca {
  readonly x: number
  readonly y: number
  skoc(): void
}

let aktualnyHrac: MostHraca | null = null

export function napojHraca(h: MostHraca | null): void {
  aktualnyHrac = h
}

export function hracVHre(): MostHraca | null {
  return aktualnyHrac
}
