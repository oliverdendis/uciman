import { beforeEach, describe, expect, it } from 'vitest'
import { nastavenia, stavHry, ZAKLADNE_NASTAVENIA } from '../game/stav'
import { BUGOVE_SUBORY, SPRAVNE_SUBORY, akoSubory } from '../defaults/subory'
import type { ChybaKodu } from './chyby'
import { Runtime } from './runtime'
import { transpiluj } from './transpiluj'

function subory(nastaveniaTs = '', pravidlaTs = '', cheatyTs = '') {
  return [
    { nazov: 'nastavenia.ts', kod: nastaveniaTs },
    { nazov: 'pravidla.ts', kod: pravidlaTs },
    { nazov: 'cheaty.ts', kod: cheatyTs },
  ]
}

function napis(rt: Runtime, text: string): string[] {
  return [...text].flatMap((z) => rt.zadajZnak(z))
}

let rt: Runtime
let chyby: ChybaKodu[]

beforeEach(() => {
  rt = new Runtime()
  chyby = []
  rt.naChybu((c) => chyby.push(c))
  Object.assign(nastavenia, ZAKLADNE_NASTAVENIA)
  stavHry.skore = 0
  stavHry.zivoty = 3
  stavHry.nesmrtelny = false
  stavHry.predmety = new Set()
})

describe('transpilácia', () => {
  it('odstráni TypeScript typy a zachová riadky', () => {
    const r = transpiluj('const a: number = 1\ninterface X { y: string }\nlet b = a as any')
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.js).not.toContain(': number')
      expect(r.js.split('\n')).toHaveLength(3)
    }
  })

  it('predvolené bugové aj správne súbory sa dajú spustiť', () => {
    expect(rt.spusti(akoSubory(BUGOVE_SUBORY)).ok).toBe(true)
    expect(nastavenia.gravitacia).toBe(-800)
    expect(rt.spusti(akoSubory(SPRAVNE_SUBORY)).ok).toBe(true)
    expect(nastavenia.gravitacia).toBe(1000)
  })
})

describe('syntaktické chyby', () => {
  it('nahlási súbor a riadok a ponechá starú verziu', () => {
    rt.spusti(subory('nastavenia.skok = 500', 'priZbereMince(() => { skore += 1 })'))
    const r = rt.spusti(subory('nastavenia.skok = 50', '\n\npriZbereMince(() => {\n  skore += 1\n'))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.chyba.druh).toBe('syntax')
      expect(r.chyba.subor).toBe('pravidla.ts')
      expect(r.chyba.sprava).toMatch(/zátvork|Kód náhle končí|Nečakaný/)
    }
    // stará verzia stále platí
    expect(nastavenia.skok).toBe(500)
    expect(rt.pocetHacikov).toBe(1)
  })

  it('nezatvorená zátvorka na konci súboru sa hlási v tom súbore, nie v ďalšom', () => {
    const r = rt.spusti(subory('nastavenia.skok = 1\nnastavenia.velkost = (2\n', 'priZbereMince(() => {})'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba).toMatchObject({ subor: 'nastavenia.ts', riadok: 2 })
  })

  it('chýbajúca zátvorka na konkrétnom riadku', () => {
    const r = rt.spusti(subory('nastavenia.skok = 1\nnastavenia.rychlost = (3 + 4\nnastavenia.velkost = 1'))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.chyba.subor).toBe('nastavenia.ts')
      expect(r.chyba.riadok).toBe(3)
      expect(r.chyba.sprava).toContain('Chýba zátvorka „)“')
    }
  })
})

describe('háčiky', () => {
  it('nový beh odregistruje všetky háčiky z predošlého', () => {
    rt.spusti(subory('', 'priZbereMince(() => {})\npriDotykuNepriatela(() => {})', 'cheat("aaa", () => {})\ncheat("bbb", () => {})'))
    expect(rt.pocetHacikov).toBe(4)
    rt.spusti(subory('', '', 'cheat("ccc", () => {})'))
    expect(rt.pocetHacikov).toBe(1)
    expect(napis(rt, 'aaa')).toEqual([])
    expect(napis(rt, 'ccc')).toEqual(['ccc'])
  })

  it('skore sa dá meniť v háčiku aj na najvyššej úrovni', () => {
    rt.spusti(subory('skore = 10', 'priZbereMince(() => { skore += 5 })'))
    expect(stavHry.skore).toBe(10)
    rt.zberMince()
    rt.zberMince()
    expect(stavHry.skore).toBe(20)
  })

  it('háčik vidí aktuálne skóre aj keď ho medzitým zmenila hra', () => {
    rt.spusti(subory('', 'priZbereMince(() => { skore = skore * 2 })'))
    stavHry.skore = 7
    rt.zberMince()
    expect(stavHry.skore).toBe(14)
  })

  it('bugová verzia mincí uberá body', () => {
    rt.spusti(akoSubory(BUGOVE_SUBORY))
    rt.zberMince()
    expect(stavHry.skore).toBe(-1)
  })

  it('priDotykuNepriatela dostane smer a nepriateľa', () => {
    rt.spusti(subory('', 'priDotykuNepriatela((zhora, n) => { if (zhora) n.znic() })'))
    let zniceny = 0
    rt.dotykNepriatela(false, { znic: () => zniceny++ })
    rt.dotykNepriatela(true, { znic: () => zniceny++ })
    expect(zniceny).toBe(1)
  })
})

describe('chyby pri behu', () => {
  it('chyba na najvyššej úrovni: ľudská hláška, riadok a návrat k starej verzii', () => {
    rt.spusti(subory('nastavenia.skok = 500'))
    const r = rt.spusti(subory('nastavenia.skok = 999', '\nskocc()'))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.chyba).toMatchObject({ druh: 'beh', subor: 'pravidla.ts', riadok: 2 })
      expect(r.chyba.sprava).toContain('Neznáme slovo „skocc“')
    }
    expect(nastavenia.skok).toBe(500)
  })

  it('chyba v háčiku sa zachytí, nahlási a háčik sa vypne', () => {
    rt.spusti(subory('', 'priZbereMince(() => {\n  hrac.lietaj()\n})'))
    expect(() => rt.zberMince()).not.toThrow()
    expect(chyby).toHaveLength(1)
    expect(chyby[0]).toMatchObject({ druh: 'hacik', hacik: 'priZbereMince', subor: 'pravidla.ts', riadok: 2 })
    expect(chyby[0].sprava).toContain('nie je funkcia')
    rt.zberMince()
    expect(chyby).toHaveLength(1) // vypnutý háčik sa už nevolá
  })

  it('preklep vo vlastnosti nastavení je chyba (nie tiché ignorovanie)', () => {
    const r = rt.spusti(subory('nastavenia.skook = 5'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba.sprava).toContain('Vlastnosť „skook“ neexistuje')
  })

  it('hrac.x sa dá iba čítať', () => {
    const r = rt.spusti(subory('hrac.x = 5'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba.sprava).toContain('„x“ sa dá iba čítať')
  })

  it('neznámy predmet', () => {
    const r = rt.spusti(subory('hrac.dajPredmet("raketa")'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba.sprava).toContain('Neznámy predmet „raketa“')
  })

  it('cheat bez funkcie', () => {
    const r = rt.spusti(subory('', '', 'cheat("abc")'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba.sprava).toContain('cheat potrebuje funkciu')
  })
})

describe('kód je zdroj pravdy', () => {
  it('zmazaný riadok vráti hodnotu na základnú', () => {
    rt.spusti(subory('nastavenia.skok = 120'))
    expect(nastavenia.skok).toBe(120)
    rt.spusti(subory(''))
    expect(nastavenia.skok).toBe(ZAKLADNE_NASTAVENIA.skok)
  })

  it('zmazanie bugového riadku bug neopraví – treba napísať správne číslo', () => {
    rt.spusti(subory('nastavenia.rychlost = 220'))
    expect(nastavenia.skok).toBe(120)
    expect(nastavenia.gravitacia).toBe(-800)
    rt.spusti(subory('nastavenia.skok = 560\nnastavenia.gravitacia = 1000'))
    expect(nastavenia).toMatchObject({ skok: 560, gravitacia: 1000 })
  })

  it('zmazaný cheat/predmet prestane platiť', () => {
    rt.spusti(subory('hrac.nesmrtelny = true\nhrac.dajPredmet("dazdnik")'))
    expect(stavHry.nesmrtelny).toBe(true)
    expect(stavHry.predmety.has('dazdnik')).toBe(true)
    rt.spusti(subory(''))
    expect(stavHry.nesmrtelny).toBe(false)
    expect(stavHry.predmety.size).toBe(0)
  })
})

describe('ochrana pred nekonečným cyklom', () => {
  it('while(true) na najvyššej úrovni', () => {
    const r = rt.spusti(subory('', '', 'let i = 0\nwhile (true) { i++ }'))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.chyba.sprava).toBe('Tvoj cyklus nikdy neskončí (viac ako 10 000 opakovaní).')
      expect(r.chyba).toMatchObject({ subor: 'cheaty.ts', riadok: 2 })
    }
  })

  it('for(;;) v cheate nezhodí hru', () => {
    rt.spusti(subory('', '', 'cheat("xx", () => {\n  for (;;) {}\n})'))
    expect(() => napis(rt, 'xx')).not.toThrow()
    expect(chyby[0]).toMatchObject({ druh: 'hacik', riadok: 2 })
  })

  it('do-while a cyklus bez zátvoriek', () => {
    expect(rt.spusti(subory('do {} while (true)')).ok).toBe(false)
    expect(rt.spusti(subory('let a = 0\nwhile (true) a++')).ok).toBe(false)
  })

  it('konečné cykly fungujú, aj vnorené a opakované v háčiku', () => {
    const r = rt.spusti(
      subory('', 'priZbereMince(() => {\n  for (let i = 0; i < 9000; i++) { skore += 0 }\n  skore += 1\n})', 'let s = 0\nfor (const x of [1, 2, 3]) { for (let j = 0; j < 100; j++) s++ }\nskore = s'),
    )
    expect(r.ok).toBe(true)
    expect(stavHry.skore).toBe(300)
    rt.zberMince()
    rt.zberMince() // počítadlo sa nuluje pre každé volanie háčika
    expect(stavHry.skore).toBe(302)
    expect(chyby).toHaveLength(0)
  })
})

describe('cheaty', () => {
  it('baguvix zapne nesmrteľnosť', () => {
    rt.spusti(subory('', '', 'cheat("baguvix", () => hrac.nesmrtelny = true)'))
    expect(napis(rt, 'xxbaguvi')).toEqual([])
    expect(stavHry.nesmrtelny).toBe(false)
    expect(napis(rt, 'x')).toEqual(['baguvix'])
    expect(stavHry.nesmrtelny).toBe(true)
  })

  it('nepovolí príliš dlhý kód', () => {
    const r = rt.spusti(subory('', '', 'cheat("abcdefghijklmnopq", () => {})'))
    expect(r.ok).toBe(false)
  })
})
