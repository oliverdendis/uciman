export interface VirtualnySubor {
  nazov: string
  kod: string
}

export interface Miesto {
  subor: string
  riadok: number
}

export interface SpojenyKod {
  kod: string
  /** globálny riadok (1-based) → súbor a riadok v ňom */
  najdi(riadok: number): Miesto | null
}

/** Spojí virtuálne súbory pod seba a pamätá si, kde ktorý začína. */
export function spojSubory(subory: readonly VirtualnySubor[]): SpojenyKod {
  const zaciatky: { nazov: string; od: number; pocet: number }[] = []
  let riadok = 1
  for (const s of subory) {
    const pocet = s.kod.split('\n').length
    zaciatky.push({ nazov: s.nazov, od: riadok, pocet })
    riadok += pocet
  }
  return {
    kod: subory.map((s) => s.kod).join('\n'),
    najdi(r) {
      for (const z of zaciatky) {
        if (r >= z.od && r < z.od + z.pocet) return { subor: z.nazov, riadok: r - z.od + 1 }
      }
      return null
    },
  }
}
