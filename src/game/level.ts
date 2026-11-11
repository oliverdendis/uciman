/**
 * Definícia levelu v dlaždiciach (1 dlaždica = 32 px).
 * Riadok 0 je hore, zem je v riadkoch 15–16. Šírka 120 dlaždíc ≈ 4 obrazovky.
 */
export const T = 32
export const STLPCE = 120
export const RIADKY = 17
export const SIRKA = STLPCE * T
export const VYSKA = RIADKY * T
/** horný okraj zeme (y v px) */
export const ZEM_Y = 15 * T

export interface Blok {
  c: number
  r: number
  w: number
  h: number
  typ: 'zem' | 'tehla'
}

type Bod = readonly [stlpec: number, riadok: number]

const zem = (c: number, w: number): Blok => ({ c, r: 15, w, h: 2, typ: 'zem' })
const tehla = (c: number, r: number, w: number, h = 1): Blok => ({ c, r, w, h, typ: 'tehla' })

export const level = {
  bloky: [
    // --- úsek A: štart ---
    zem(0, 33),
    // Prvá vyvýšená plošina (3 dlaždice = 96 px nad zemou).
    // S bugovým skokom 120 sa na ňu nedá vyskočiť, so správnym (~450+) áno.
    tehla(12, 12, 5, 3),
    tehla(22, 11, 4),
    // priepasť 33–36
    // --- úsek B ---
    zem(37, 23),
    tehla(46, 13, 2, 2),
    tehla(48, 11, 2, 4),
    // priepasť 60–67 s plávajúcou plošinou
    tehla(62, 12, 3),
    // --- úsek C ---
    zem(68, 23),
    tehla(74, 11, 3),
    tehla(79, 9, 3),
    // priepasť 91–93
    // --- úsek D: schody do cieľa ---
    zem(94, 26),
    tehla(100, 13, 2, 2),
    tehla(102, 11, 2, 4),
    tehla(104, 9, 2, 6),
  ] satisfies Blok[] as Blok[],

  start: [3, 13] as Bod,

  mince: [
    [7, 14], [9, 14],          // pri štarte, dosiahnuteľné aj bez skoku
    [14, 10],
    [23, 10], [24, 10],
    [35, 12],                  // nad priepasťou
    [47, 11], [49, 9],
    [63, 10],
    [75, 10], [80, 8],
    [92, 12],
    [103, 9], [105, 7],
  ] as Bod[],

  nepriatelia: [[27, 14], [53, 14], [85, 14]] as Bod[],

  checkpointy: [[39, 14], [70, 14]] as Bod[],

  ciel: [112, 14] as Bod,
}

/** Je bod (v px) vnútri nejakého pevného bloku? */
export function jePevne(x: number, y: number): boolean {
  for (const b of level.bloky) {
    if (x >= b.c * T && x < (b.c + b.w) * T && y >= b.r * T && y < (b.r + b.h) * T) return true
  }
  return false
}
