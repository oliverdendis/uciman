import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Ovladac = typeof import('./ovladac')
type Subory = typeof import('../editor/stavSuborov')
type Stav = typeof import('../game/stav')

let o: Ovladac
let subory: Subory['subory']
let nastavenia: Stav['nastavenia']
let posledny: import('./ovladac').StavBehu

beforeEach(async () => {
  vi.useFakeTimers()
  vi.resetModules() // čerstvý stav modulov (časovače, posledný kód) pre každý test
  o = await import('./ovladac')
  subory = (await import('../editor/stavSuborov')).subory
  nastavenia = (await import('../game/stav')).nastavenia
  o.naStavBehu((s) => (posledny = s))
  o.spustiTeraz() // predvolený bugový kód
})

afterEach(() => vi.useRealTimers())

describe('automatické spustenie', () => {
  it('zmena iba čísla sa spustí po ~250 ms', () => {
    subory.nastav('nastavenia.ts', subory.citaj('nastavenia.ts').replace('= 120', '= 600'))
    o.naplanujSpustenie()
    vi.advanceTimersByTime(o.RYCHLE_ONESKORENIE_MS - 1)
    expect(nastavenia.skok).toBe(120)
    vi.advanceTimersByTime(1)
    expect(nastavenia.skok).toBe(600)
  })

  it('iná zmena (nový riadok) čaká 800 ms', () => {
    subory.nastav('nastavenia.ts', subory.citaj('nastavenia.ts') + '\nnastavenia.skok = 700\n')
    o.naplanujSpustenie()
    vi.advanceTimersByTime(o.RYCHLE_ONESKORENIE_MS)
    expect(nastavenia.skok).toBe(120)
    vi.advanceTimersByTime(o.ONESKORENIE_MS)
    expect(nastavenia.skok).toBe(700)
  })

  it('tvar kódu ignoruje čísla, ale nie ostatné zmeny', () => {
    const a = [{ nazov: 'a', kod: 'x = 1.5\ny = 20' }]
    expect(o.tvarKodu(a)).toBe(o.tvarKodu([{ nazov: 'a', kod: 'x = 300\ny = 7' }]))
    expect(o.tvarKodu(a)).not.toBe(o.tvarKodu([{ nazov: 'a', kod: 'x = 1.5\nz = 20' }]))
  })
})

describe('chyby počas písania', () => {
  it('chyba z automatického spustenia je najprv jemná, potom červená', () => {
    subory.nastav('nastavenia.ts', subory.citaj('nastavenia.ts') + '\nhrac.')
    o.naplanujSpustenie()
    vi.advanceTimersByTime(o.ONESKORENIE_MS)
    expect(posledny).toMatchObject({ ok: false, jemne: true })
    vi.advanceTimersByTime(o.ESKALACIA_CHYBY_MS)
    expect(posledny).toMatchObject({ ok: false, jemne: false })
  })

  it('ďalšie písanie zruší zčervenanie', () => {
    subory.nastav('nastavenia.ts', subory.citaj('nastavenia.ts') + '\nhrac.')
    o.naplanujSpustenie()
    vi.advanceTimersByTime(o.ONESKORENIE_MS + o.ESKALACIA_CHYBY_MS - 100)
    subory.nastav('nastavenia.ts', subory.citaj('nastavenia.ts') + 'skoc')
    o.naplanujSpustenie()
    vi.advanceTimersByTime(200)
    expect(posledny.caka).toBe(true)
  })

  it('Ctrl+Enter / Spustiť ukáže chybu hneď naplno', () => {
    subory.nastav('nastavenia.ts', subory.citaj('nastavenia.ts') + '\nhrac.')
    expect(o.spustiTeraz()).toBe(false)
    expect(posledny).toMatchObject({ ok: false, jemne: false })
  })
})
