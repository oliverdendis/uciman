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
  'settings',
  'player',
  'score',
  'cheat',
  'onCoinCollect',
  'onEnemyTouch',
  'onJump',
  'onKeyPress',
  'whileKeyHeld',
  'print',
] as const

const PREDMETY: readonly Predmet[] = ['umbrella']

const POMENOVANE_KLAVESY = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'Enter'])

/** "ArrowLeft" → "ArrowLeft", "a" → "KeyA", "7" → "Digit7"; neznáma kláves → null */
export function kodKlavesy(nazov: unknown): string | null {
  if (typeof nazov !== 'string') return null
  if (POMENOVANE_KLAVESY.has(nazov)) return nazov
  if (/^[a-zA-Z]$/.test(nazov)) return `Key${nazov.toUpperCase()}`
  if (/^[0-9]$/.test(nazov)) return `Digit${nazov}`
  return null
}

function overKlavesu(funkcia: string, nazov: unknown): string {
  const kod = kodKlavesy(nazov)
  if (kod) return kod
  throw new ChybaApi(
    `Neznáma kláves „${String(nazov)}“. Skús napríklad ${funkcia}("ArrowLeft", …), "ArrowUp", "Space" alebo písmeno "a".`,
  )
}

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
    lives: {
      get: () => stavHry.zivoty,
      set: (v: unknown) => {
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          throw new ChybaApi('player.lives potrebuje číslo, napríklad: player.lives = 5')
        }
        nastavZivoty(Math.round(v)) // orežie na 0 – 5; pri 0 hra skončí (HraScena)
      },
      enumerable: true,
    },
    invincible: {
      get: () => stavHry.nesmrtelny,
      set: (v: unknown) => {
        stavHry.nesmrtelny = Boolean(v)
      },
      enumerable: true,
    },
    giveItem: {
      value: (nazov: unknown) => {
        if (!PREDMETY.includes(nazov as Predmet)) {
          throw new ChybaApi(`Neznámy predmet „${String(nazov)}“. Skús: player.giveItem("umbrella")`)
        }
        pridajPredmet(nazov as Predmet)
      },
    },
    jump: { value: () => hracVHre()?.jump() },
    walk: {
      value: (rychlost: unknown) => {
        if (typeof rychlost !== 'number' || !Number.isFinite(rychlost)) {
          throw new ChybaApi('player.walk potrebuje číslo, napríklad: player.walk(200)')
        }
        hracVHre()?.walk(rychlost)
      },
    },
    addLife: { value: () => nastavZivoty(stavHry.zivoty + 1) },
  })
  // seal: preklep typu `player.invincibel = true` vyhodí zrozumiteľnú chybu
  return Object.seal(hrac)
}

/** Hodnoty API pre jeden beh kódu; háčiky sa registrujú do `register`. */
export function vytvorApi(register: Register): Record<(typeof MENA_API)[number], unknown> {
  return {
    settings: nastavenia,
    player: vytvorHraca(),
    score: stavHry.skore,
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
    onCoinCollect: (akcia: unknown) => {
      overFunkciu('onCoinCollect', akcia)
      register.mince.push({ nazov: 'onCoinCollect', akcia: akcia as AkciaMince, vypnuty: false })
    },
    onEnemyTouch: (akcia: unknown) => {
      overFunkciu('onEnemyTouch', akcia)
      register.nepriatelia.push({ nazov: 'onEnemyTouch', akcia: akcia as AkciaNepriatela, vypnuty: false })
    },
    onJump: (akcia: unknown) => {
      overFunkciu('onJump', akcia)
      register.skoky.push({ nazov: 'onJump', akcia: akcia as () => void, vypnuty: false })
    },
    onKeyPress: (klavesa: unknown, akcia: unknown) => {
      const kod = overKlavesu('onKeyPress', klavesa)
      overFunkciu('onKeyPress', akcia)
      register.klavesy.push({ nazov: `onKeyPress("${String(klavesa)}")`, klavesa: kod, drzat: false, akcia: akcia as () => void, vypnuty: false })
    },
    whileKeyHeld: (klavesa: unknown, akcia: unknown) => {
      const kod = overKlavesu('whileKeyHeld', klavesa)
      overFunkciu('whileKeyHeld', akcia)
      register.klavesy.push({ nazov: `whileKeyHeld("${String(klavesa)}")`, klavesa: kod, drzat: true, akcia: akcia as () => void, vypnuty: false })
    },
    print: (text: unknown) => {
      udalosti.emit('vypis', String(text).slice(0, 140))
    },
  }
}
