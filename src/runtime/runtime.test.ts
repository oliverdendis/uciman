import { beforeEach, describe, expect, it } from 'vitest'
import { nastavenia, stavHry, ZAKLADNE_NASTAVENIA } from '../game/stav'
import { BUGOVE_SUBORY, SPRAVNE_SUBORY, akoSubory } from '../defaults/subory'
import type { ChybaKodu } from './chyby'
import { Runtime } from './runtime'
import { transpiluj } from './transpiluj'

function subory(nastaveniaTs = '', pravidlaTs = '', cheatyTs = '') {
  return [
    { nazov: 'settings.ts', kod: nastaveniaTs },
    { nazov: 'rules.ts', kod: pravidlaTs },
    { nazov: 'cheats.ts', kod: cheatyTs },
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
    expect(nastavenia.gravity).toBe(300)
    expect(rt.spusti(akoSubory(SPRAVNE_SUBORY)).ok).toBe(true)
    expect(nastavenia.gravity).toBe(1000)
  })
})

describe('syntaktické chyby', () => {
  it('nahlási súbor a riadok a ponechá starú verziu', () => {
    rt.spusti(subory('settings.jump = 500', 'onCoinCollect(() => { score += 1 })'))
    const r = rt.spusti(subory('settings.jump = 50', '\n\nonCoinCollect(() => {\n  score += 1\n'))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.chyba.druh).toBe('syntax')
      expect(r.chyba.subor).toBe('rules.ts')
      expect(r.chyba.sprava).toMatch(/zátvork|Kód náhle končí|Nečakaný/)
    }
    // stará verzia stále platí
    expect(nastavenia.jump).toBe(500)
    expect(rt.pocetHacikov).toBe(1)
  })

  it('nezatvorená zátvorka na konci súboru sa hlási v tom súbore, nie v ďalšom', () => {
    const r = rt.spusti(subory('settings.jump = 1\nsettings.size = (2\n', 'onCoinCollect(() => {})'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba).toMatchObject({ subor: 'settings.ts', riadok: 2 })
  })

  it('chýbajúca zátvorka na konkrétnom riadku', () => {
    const r = rt.spusti(subory('settings.jump = 1\nsettings.speed = (3 + 4\nsettings.size = 1'))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.chyba.subor).toBe('settings.ts')
      expect(r.chyba.riadok).toBe(3)
      expect(r.chyba.sprava).toContain('Chýba zátvorka „)“')
    }
  })
})

describe('háčiky', () => {
  it('nový beh odregistruje všetky háčiky z predošlého', () => {
    rt.spusti(subory('', 'onCoinCollect(() => {})\nonEnemyTouch(() => {})', 'cheat("aaa", () => {})\ncheat("bbb", () => {})'))
    expect(rt.pocetHacikov).toBe(4)
    rt.spusti(subory('', '', 'cheat("ccc", () => {})'))
    expect(rt.pocetHacikov).toBe(1)
    expect(napis(rt, 'aaa')).toEqual([])
    expect(napis(rt, 'ccc')).toEqual(['ccc'])
  })

  it('score sa dá meniť v háčiku aj na najvyššej úrovni', () => {
    rt.spusti(subory('score = 10', 'onCoinCollect(() => { score += 5 })'))
    expect(stavHry.skore).toBe(10)
    rt.zberMince()
    rt.zberMince()
    expect(stavHry.skore).toBe(20)
  })

  it('háčik vidí aktuálne skóre aj keď ho medzitým zmenila hra', () => {
    rt.spusti(subory('', 'onCoinCollect(() => { score = score * 2 })'))
    stavHry.skore = 7
    rt.zberMince()
    expect(stavHry.skore).toBe(14)
  })

  it('bugová verzia mincí uberá body', () => {
    rt.spusti(akoSubory(BUGOVE_SUBORY))
    rt.zberMince()
    expect(stavHry.skore).toBe(-1)
  })

  it('onEnemyTouch dostane smer a nepriateľa', () => {
    rt.spusti(subory('', 'onEnemyTouch((fromAbove, n) => { if (fromAbove) n.destroy() })'))
    let zniceny = 0
    rt.dotykNepriatela(false, { destroy: () => zniceny++ })
    rt.dotykNepriatela(true, { destroy: () => zniceny++ })
    expect(zniceny).toBe(1)
  })
})

describe('chyby pri behu', () => {
  it('chyba na najvyššej úrovni: ľudská hláška, riadok a návrat k starej verzii', () => {
    rt.spusti(subory('settings.jump = 500'))
    const r = rt.spusti(subory('settings.jump = 999', '\nskocc()'))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.chyba).toMatchObject({ druh: 'beh', subor: 'rules.ts', riadok: 2 })
      expect(r.chyba.sprava).toContain('Neznáme slovo „skocc“')
    }
    expect(nastavenia.jump).toBe(500)
  })

  it('chyba v háčiku sa zachytí, nahlási a háčik sa vypne', () => {
    rt.spusti(subory('', 'onCoinCollect(() => {\n  player.lietaj()\n})'))
    expect(() => rt.zberMince()).not.toThrow()
    expect(chyby).toHaveLength(1)
    expect(chyby[0]).toMatchObject({ druh: 'hacik', hacik: 'onCoinCollect', subor: 'rules.ts', riadok: 2 })
    expect(chyby[0].sprava).toContain('nie je funkcia')
    rt.zberMince()
    expect(chyby).toHaveLength(1) // vypnutý háčik sa už nevolá
  })

  it('preklep vo vlastnosti nastavení je chyba (nie tiché ignorovanie)', () => {
    const r = rt.spusti(subory('settings.jumpp = 5'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba.sprava).toContain('Vlastnosť „jumpp“ neexistuje')
  })

  it('player.x sa dá iba čítať', () => {
    const r = rt.spusti(subory('player.x = 5'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba.sprava).toContain('„x“ sa dá iba čítať')
  })

  it('neznámy predmet', () => {
    const r = rt.spusti(subory('player.giveItem("raketa")'))
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
    rt.spusti(subory('settings.jump = 120'))
    expect(nastavenia.jump).toBe(120)
    rt.spusti(subory(''))
    expect(nastavenia.jump).toBe(ZAKLADNE_NASTAVENIA.jump)
  })

  it('zmazanie bugového riadku bug neopraví – treba napísať správne číslo', () => {
    rt.spusti(subory('settings.speed = 220'))
    expect(nastavenia.jump).toBe(120)
    expect(nastavenia.gravity).toBe(300)
    rt.spusti(subory('settings.jump = 560\nsettings.gravity = 1000'))
    expect(nastavenia).toMatchObject({ jump: 560, gravity: 1000 })
  })

  it('zmazaný cheat/predmet prestane platiť', () => {
    rt.spusti(subory('player.invincible = true\nplayer.giveItem("umbrella")'))
    expect(stavHry.nesmrtelny).toBe(true)
    expect(stavHry.predmety.has('umbrella')).toBe(true)
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
      expect(r.chyba).toMatchObject({ subor: 'cheats.ts', riadok: 2 })
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
      subory('', 'onCoinCollect(() => {\n  for (let i = 0; i < 9000; i++) { score += 0 }\n  score += 1\n})', 'let s = 0\nfor (const x of [1, 2, 3]) { for (let j = 0; j < 100; j++) s++ }\nscore = s'),
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
    rt.spusti(subory('', '', 'cheat("baguvix", () => player.invincible = true)'))
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

describe('ovládanie (onKeyPress / whileKeyHeld)', () => {
  it('whileKeyHeld sa volá iba pre držanú klávesu, onKeyPress pri stlačení', () => {
    const r = rt.spusti(
      subory('', 'whileKeyHeld("ArrowRight", () => { score += 1 })\nonKeyPress("a", () => { score += 10 })'),
    )
    expect(r.ok).toBe(true)
    rt.drzaneKlavesy(new Set(['ArrowLeft']))
    expect(stavHry.skore).toBe(0)
    rt.drzaneKlavesy(new Set(['ArrowRight']))
    rt.drzaneKlavesy(new Set(['ArrowRight']))
    expect(stavHry.skore).toBe(2)
    rt.stlacenaKlavesa('KeyA') // písmeno "a" = KeyboardEvent.code "KeyA"
    expect(stavHry.skore).toBe(12)
  })

  it('bugová verzia nemá šípku doľava, opravená áno', () => {
    expect(BUGOVE_SUBORY['controls.ts']).not.toContain('ArrowLeft')
    expect(SPRAVNE_SUBORY['controls.ts']).toContain('player.walk(-settings.speed)')
  })

  it('neznáma kláves vyhodí zrozumiteľnú chybu', () => {
    const r = rt.spusti(subory('', 'whileKeyHeld("SipkaVlavo", () => {})'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba.sprava).toContain('Neznáma kláves „SipkaVlavo“')
  })

  it('chyba v whileKeyHeld sa nahlási raz a háčik sa vypne', () => {
    rt.spusti(subory('', 'whileKeyHeld("ArrowLeft", () => { player.walk("vlavo") })'))
    rt.drzaneKlavesy(new Set(['ArrowLeft']))
    rt.drzaneKlavesy(new Set(['ArrowLeft']))
    expect(chyby).toHaveLength(1)
    expect(chyby[0]).toMatchObject({ druh: 'hacik', hacik: 'whileKeyHeld("ArrowLeft")' })
    expect(chyby[0].sprava).toContain('player.walk potrebuje číslo')
  })
})

describe('farby v nastaveniach', () => {
  it('farba nie je v súbore, ale dá sa nastaviť; zmazanie vráti pôvodnú', () => {
    expect(rt.spusti(subory('settings.coinColor = "red"')).ok).toBe(true)
    expect(nastavenia.coinColor).toBe('red')
    expect(rt.spusti(subory('')).ok).toBe(true)
    expect(nastavenia.coinColor).toBe(ZAKLADNE_NASTAVENIA.coinColor)
  })

  it('farba, ktorá nie je text, je chyba s riadkom a ostane stará verzia', () => {
    rt.spusti(subory('settings.playerColor = "blue"'))
    const r = rt.spusti(subory('settings.jump = 500\nsettings.playerColor = 5'))
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.chyba.sprava).toContain('Neznáma farba „5“')
      expect(r.chyba).toMatchObject({ subor: 'settings.ts', riadok: 2 })
    }
    expect(nastavenia.playerColor).toBe('blue')
    expect(nastavenia.jump).toBe(120)
  })
})

describe('onJump (skrytý listener)', () => {
  it('nie je v predvolených súboroch, ale funguje, keď ho študent napíše', () => {
    for (const kod of Object.values(BUGOVE_SUBORY)) expect(kod).not.toContain('onJump')
    expect(rt.spusti(subory('', 'onJump(() => { score = score + 1 })')).ok).toBe(true)
    rt.skokHraca()
    rt.skokHraca()
    expect(stavHry.skore).toBe(2)
  })
})

describe('player.lives (skryté)', () => {
  it('dá sa čítať aj meniť, orezáva sa na 0 – 5', () => {
    expect(rt.spusti(subory('', 'onCoinCollect(() => { score = player.lives; player.lives = player.lives - 1 })')).ok).toBe(true)
    rt.zberMince()
    expect(stavHry.skore).toBe(3)
    expect(stavHry.zivoty).toBe(2)
    rt.spusti(subory('player.lives = 99'))
    expect(stavHry.zivoty).toBe(5)
  })

  it('nečíslo je zrozumiteľná chyba a životy sa vrátia', () => {
    const r = rt.spusti(subory('player.lives = 1\nplayer.lives = "veľa"'))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.chyba.sprava).toContain('player.lives potrebuje číslo')
    expect(stavHry.zivoty).toBe(3)
  })
})
