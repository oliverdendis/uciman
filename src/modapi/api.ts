import { nastavenia, pridajPredmet, nastavZivoty, stavHry, type Predmet } from '../game/stav'
import { udalosti } from '../game/udalosti'
import { MAX_DLZKA_CHEATU } from './cheatBuffer'
import { hracVHre } from './most'
import type { AkciaCheatu, AkciaMince, AkciaNepriatela, Register } from './register'

/** Chyba s hláškou už v slovenčine, prekladač ju nechá tak, ako je. */
export class ChybaApi extends Error {
  constructor(sprava: string) {
    super(sprava)
    this.name = 'ChybaApi'
  }
}

/** Mená, ktoré študentský kód vidí. Poradie = poradie parametrov funkcie. */
export const MENA_API = [
  'nastavenia',
  'hrac',
  'skore',
  'cheat',
  'priZbereMince',
  'priDotykuNepriatela',
  'vypis',
] as const

const PREDMETY: readonly Predmet[] = ['dazdnik']

function overFunkciu(nazov: string, akcia: unknown): void {
  if (typeof akcia !== 'function') {
    throw new ChybaApi(`${nazov} potrebuje funkciu, napríklad: ${nazov}(() => { … })`)
  }
}

function vytvorHraca(): object {
  const hrac = {}
  Object.defineProperties(hrac, {
    x: { get: () => Math.round(hracVHre()?.x ?? 0), enumerable: true },
    y: { get: () => Math.round(hracVHre()?.y ?? 0), enumerable: true },
    nesmrtelny: {
      get: () => stavHry.nesmrtelny,
      set: (v: unknown) => {
        stavHry.nesmrtelny = Boolean(v)
      },
      enumerable: true,
    },
    dajPredmet: {
      value: (nazov: unknown) => {
        if (!PREDMETY.includes(nazov as Predmet)) {
          throw new ChybaApi(`Neznámy predmet „${String(nazov)}“. Skús: hrac.dajPredmet("dazdnik")`)
        }
        pridajPredmet(nazov as Predmet)
      },
    },
    skoc: { value: () => hracVHre()?.skoc() },
    pridajZivot: { value: () => nastavZivoty(stavHry.zivoty + 1) },
  })
  // seal: preklep typu `hrac.nesmrtelni = true` vyhodí zrozumiteľnú chybu
  return Object.seal(hrac)
}

/** Hodnoty API pre jeden beh kódu; háčiky sa registrujú do `register`. */
export function vytvorApi(register: Register): Record<(typeof MENA_API)[number], unknown> {
  return {
    nastavenia,
    hrac: vytvorHraca(),
    skore: stavHry.skore,
    cheat: (kod: unknown, akcia: unknown) => {
      if (typeof kod !== 'string' || kod.trim() === '') {
        throw new ChybaApi('cheat potrebuje text, napríklad: cheat("baguvix", () => { … })')
      }
      if (kod.length > MAX_DLZKA_CHEATU) {
        throw new ChybaApi(`Kód cheatu môže mať najviac ${MAX_DLZKA_CHEATU} znakov („${kod}“ má ${kod.length}).`)
      }
      if (/\s/.test(kod)) throw new ChybaApi('Kód cheatu nesmie obsahovať medzery.')
      overFunkciu('cheat', akcia)
      register.cheaty.push({ nazov: `cheat("${kod}")`, kod: kod.toLowerCase(), akcia: akcia as AkciaCheatu, vypnuty: false })
    },
    priZbereMince: (akcia: unknown) => {
      overFunkciu('priZbereMince', akcia)
      register.mince.push({ nazov: 'priZbereMince', akcia: akcia as AkciaMince, vypnuty: false })
    },
    priDotykuNepriatela: (akcia: unknown) => {
      overFunkciu('priDotykuNepriatela', akcia)
      register.nepriatelia.push({ nazov: 'priDotykuNepriatela', akcia: akcia as AkciaNepriatela, vypnuty: false })
    },
    vypis: (text: unknown) => {
      udalosti.emit('vypis', String(text).slice(0, 140))
    },
  }
}
