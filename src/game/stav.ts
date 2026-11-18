import { udalosti } from './udalosti'

export type Predmet = 'umbrella'

/** Hodnoty, ktoré hra číta KAŽDÝ frame. Študentský kód ich prepisuje. */
/** Kľúče sú anglicky – študent ich píše v kóde ako `settings.jump` atď. */
export interface Nastavenia {
  jump: number
  gravity: number
  speed: number
  size: number
}

/** Správne (funkčné) hodnoty – riešenie pre učiteľa. */
export const SPRAVNE_NASTAVENIA: Readonly<Nastavenia> = {
  jump: 560,
  gravity: 1000,
  speed: 220,
  size: 1,
}

/**
 * Hodnoty pred spustením študentského kódu. Kód je zdroj pravdy: pred každým
 * behom sa nastavenia vrátia sem a kód ich znovu nastaví. Pri bugových
 * hodnotách sú tu bugy – zmazanie riadku teda bug neopraví, treba napísať
 * správne číslo.
 */
export const ZAKLADNE_NASTAVENIA: Readonly<Nastavenia> = {
  jump: 120,
  gravity: 300, // „mesačná“ – panáčik pláva, po oprave skoku narazí do stropu
  speed: SPRAVNE_NASTAVENIA.speed,
  size: SPRAVNE_NASTAVENIA.size,
}

/** seal: preklep `settings.jumpp = 5` vyhodí chybu namiesto tichého ignorovania */
export const nastavenia: Nastavenia = Object.seal({ ...ZAKLADNE_NASTAVENIA })

/** Bezpečné limity – nech študent zadá čokoľvek, fyzika sa nerozbije. */
const LIMITY: Record<keyof Nastavenia, [number, number]> = {
  jump: [0, 3000],
  gravity: [-5000, 5000],
  speed: [0, 2000],
  size: [0.2, 4],
}

const poslednePlatne: Nastavenia = { ...SPRAVNE_NASTAVENIA }

/**
 * Prečíta nastavenie bezpečne: ak študent priradí text, NaN alebo Infinity,
 * použije sa posledná platná hodnota; čísla mimo rozsah sa orežú.
 */
export function citaj(kluc: keyof Nastavenia): number {
  const v = nastavenia[kluc] as unknown
  if (typeof v === 'number' && Number.isFinite(v)) {
    const [min, max] = LIMITY[kluc]
    const orezane = Math.min(max, Math.max(min, v))
    poslednePlatne[kluc] = orezane
    return orezane
  }
  return poslednePlatne[kluc]
}

export const MAX_ZIVOTOV = 5
export const ZACIATOCNE_ZIVOTY = 3

/** Stav hry, ktorý prežije reštart levelu (okrem skóre a životov). */
export const stavHry = {
  skore: 0,
  zivoty: ZACIATOCNE_ZIVOTY,
  predmety: new Set<Predmet>(),
  nesmrtelny: false,
}

export function nastavSkore(hodnota: number): void {
  stavHry.skore = Number.isFinite(hodnota) ? hodnota : stavHry.skore
  udalosti.emit('skore', stavHry.skore)
}

export function nastavZivoty(hodnota: number): void {
  stavHry.zivoty = Math.max(0, Math.min(MAX_ZIVOTOV, hodnota))
  udalosti.emit('zivoty', stavHry.zivoty)
}

export function pridajPredmet(p: Predmet): void {
  stavHry.predmety.add(p)
  udalosti.emit('predmety', [...stavHry.predmety])
}

export function nastavPredmety(predmety: Iterable<Predmet>): void {
  stavHry.predmety = new Set(predmety)
  udalosti.emit('predmety', [...stavHry.predmety])
}

export function resetujLevelovyStav(): void {
  nastavSkore(0)
  nastavZivoty(ZACIATOCNE_ZIVOTY)
}
