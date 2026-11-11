import type { VirtualnySubor } from '../runtime/subory'

export type NazovSuboru = 'nastavenia.ts' | 'pravidla.ts' | 'cheaty.ts'
export const PORADIE_SUBOROV: readonly NazovSuboru[] = ['nastavenia.ts', 'pravidla.ts', 'cheaty.ts']

/**
 * Pôvodná pokazená verzia – s touto študenti začínajú.
 * Zámerne len 4 bugy (demo na 20–25 min): gravitácia, skok, mince, nepriatelia.
 */
export const BUGOVE_SUBORY: Record<NazovSuboru, string> = {
  'nastavenia.ts': `nastavenia.skok = 120        // panáčik nevyskočí na prvú plošinu
nastavenia.gravitacia = -800 // padá hore
nastavenia.rychlost = 220
nastavenia.velkost = 1
`,
  'pravidla.ts': `priZbereMince(() => {
  skore -= 1   // BUG: mince uberajú body
})

priDotykuNepriatela((zhora, nepriatel) => {
  if (zhora) {
    hrac.pridajZivot()   // BUG: má zničiť nepriateľa
  } else {
    nepriatel.znic()     // BUG: obrátene
  }
})
`,
  'cheaty.ts': `// Skús napísať vlastný cheat! Príklad:
// cheat("baguvix", () => hrac.nesmrtelny = true)
`,
}

/** Opravená verzia (učiteľský režim „Všetko opraviť"). */
export const SPRAVNE_SUBORY: Record<NazovSuboru, string> = {
  'nastavenia.ts': `nastavenia.skok = 560
nastavenia.gravitacia = 1000
nastavenia.rychlost = 220
nastavenia.velkost = 1
`,
  'pravidla.ts': `priZbereMince(() => {
  skore += 1
})

priDotykuNepriatela((zhora, nepriatel) => {
  if (zhora) {
    nepriatel.znic()
  }
})
`,
  'cheaty.ts': `cheat("baguvix", () => hrac.nesmrtelny = true)
cheat("dazdnik", () => hrac.dajPredmet("dazdnik"))
`,
}

export function akoSubory(obsah: Record<NazovSuboru, string>): VirtualnySubor[] {
  return PORADIE_SUBOROV.map((nazov) => ({ nazov, kod: obsah[nazov] }))
}
