import {
  nastavenia,
  nastavPredmety,
  nastavSkore,
  stavHry,
  ZAKLADNE_NASTAVENIA,
  type Nastavenia,
  type Predmet,
} from '../game/stav'
import { udalosti } from '../game/udalosti'
import { MENA_API, vytvorApi } from '../modapi/api'
import { CheatBuffer } from '../modapi/cheatBuffer'
import { Register, type Hacik, type NepriatelApi } from '../modapi/register'
import { prelozBeh, prelozSyntax, type ChybaKodu } from './chyby'
import { MENO_STRAZE, vlozStrazCyklov, vytvorStraz } from './straz'
import { spojSubory, type SpojenyKod, type VirtualnySubor } from './subory'
import { transpiluj } from './transpiluj'

const ZDROJ = 'uciman-kod.js'
/** Chrome/Edge: „(uciman-kod.js:5:3)“, Firefox: „@uciman-kod.js:5:3“ alebo „> Function:5:3“ */
const VZOR_RIADKU = /(?:uciman-kod\.js|> Function|<anonymous>):(\d+):(\d+)/
const MENO_SKORE_MOSTA = '__napojSkore'
/**
 * Prvý riadok tela funkcie. `skore` je parameter funkcie (študent doň môže
 * priraďovať), a cez tieto dve funkcie ho synchronizujeme so stavom hry.
 */
const UVOD = `"use strict"; ${MENO_SKORE_MOSTA}(() => skore, (v) => { skore = v });`
const PARAMETRE = [...MENA_API, MENO_STRAZE, MENO_SKORE_MOSTA]

let posunRiadkov: number | null = null
/** Koľko riadkov pridá prehliadač pred telo `new Function` (Chrome 2, iné sa líšia). */
function posun(): number {
  if (posunRiadkov !== null) return posunRiadkov
  posunRiadkov = 2
  try {
    new Function(`"use strict";\nthrow new Error("kalibracia")\n//# sourceURL=${ZDROJ}`)()
  } catch (e) {
    const m = String((e as Error).stack ?? '').match(VZOR_RIADKU)
    if (m) posunRiadkov = Number(m[1]) - 2
  }
  return posunRiadkov
}

export type VysledokBehu = { ok: true; pocetHacikov: number } | { ok: false; chyba: ChybaKodu }

interface Zaloha {
  nastavenia: Nastavenia
  nesmrtelny: boolean
  predmety: Set<Predmet>
  skore: number
}

export class Runtime {
  private register = new Register()
  private mapa: SpojenyKod | null = null
  private citajSkore: (() => unknown) | null = null
  private zapisSkore: ((v: number) => void) | null = null
  private readonly straz = vytvorStraz()
  private readonly buffer = new CheatBuffer()
  private readonly posluchaci = new Set<(ch: ChybaKodu) => void>()

  /** Odber chýb (syntax, beh aj chyby v háčikoch). */
  naChybu(fn: (ch: ChybaKodu) => void): () => void {
    this.posluchaci.add(fn)
    return () => this.posluchaci.delete(fn)
  }

  get pocetHacikov(): number {
    return this.register.pocet
  }

  get bufferCheatov(): string {
    return this.buffer.text
  }

  /**
   * Spustí študentský kód. Pri akejkoľvek chybe ostáva v platnosti
   * posledná funkčná verzia (háčiky aj nastavenia).
   */
  spusti(subory: readonly VirtualnySubor[]): VysledokBehu {
    const spojeny = spojSubory(subory)

    // Každý súbor zvlášť: syntaktická chyba (napr. nezatvorená zátvorka na konci
    // nastavenia.ts) sa tak nahlási v správnom súbore, nie na začiatku ďalšieho.
    // Sucrase ani stráž nepridávajú riadky, takže spojený JS sedí s `spojeny`.
    const casti: string[] = []
    let pocetCyklov = 0
    for (const sub of subory) {
      const t = transpiluj(sub.kod)
      if (!t.ok) return this.zlyhanie(this.syntaxChyba(sub, t.sprava, t.riadok, t.stlpec))
      const s = vlozStrazCyklov(t.js, pocetCyklov)
      if (!s.ok) return this.zlyhanie(this.syntaxChyba(sub, s.sprava, s.riadok, s.stlpec))
      pocetCyklov += s.pocetCyklov
      casti.push(s.js)
    }
    const js = casti.join('\n')

    let fn: (...args: unknown[]) => void
    try {
      fn = new Function(...PARAMETRE, `${UVOD}\n${js}\n//# sourceURL=${ZDROJ}`) as typeof fn
    } catch (e) {
      return this.zlyhanie({ druh: 'syntax', sprava: prelozBeh(e) })
    }

    const zaloha = this.zalohuj()
    // kód je zdroj pravdy: pred behom vrátime všetko na začiatok
    Object.assign(nastavenia, ZAKLADNE_NASTAVENIA)
    stavHry.nesmrtelny = false
    stavHry.predmety = new Set()

    const novyRegister = new Register()
    const api = vytvorApi(novyRegister)
    let citaj: (() => unknown) | null = null
    let zapis: ((v: number) => void) | null = null
    const napojSkore = (c: () => unknown, z: (v: number) => void) => {
      citaj = c
      zapis = z
    }

    this.straz.vynuluj()
    try {
      fn(...MENA_API.map((m) => api[m]), (id: number) => this.straz.straz(id), napojSkore)
    } catch (e) {
      this.obnov(zaloha)
      return this.zlyhanie({ druh: 'beh', sprava: prelozBeh(e), ...this.miesto(e, spojeny) })
    }

    // úspech: staré háčiky zahodíme naraz (odregistrovanie)
    this.register = novyRegister
    this.mapa = spojeny
    this.citajSkore = citaj
    this.zapisSkore = zapis
    this.prevezmiSkore()
    nastavPredmety(stavHry.predmety)
    this.buffer.vyprazdni()
    return { ok: true, pocetHacikov: novyRegister.pocet }
  }

  // ------------------------------------------------------------- volania z hry

  zberMince(): void {
    for (const h of this.register.mince) this.volajHacik(h, [])
  }

  dotykNepriatela(zhora: boolean, nepriatel: NepriatelApi): void {
    for (const h of this.register.nepriatelia) this.volajHacik(h, [zhora, nepriatel])
  }

  get maHacikNepriatela(): boolean {
    return this.register.nepriatelia.some((h) => !h.vypnuty)
  }

  /** Znak napísaný v hre. Vráti kódy cheatov, ktoré sa aktivovali. */
  zadajZnak(znak: string): string[] {
    const aktivne = this.register.cheaty.filter((c) => !c.vypnuty)
    const zhody = this.buffer.pridaj(
      znak,
      aktivne.map((c) => c.kod),
    )
    const spustene: string[] = []
    for (const kod of zhody) {
      let ok = false
      for (const c of aktivne) if (c.kod === kod) ok = this.volajHacik(c, []) || ok
      if (ok) {
        spustene.push(kod)
        udalosti.emit('cheat', { kod })
      }
    }
    return spustene
  }

  // ------------------------------------------------------------- vnútro

  private volajHacik<A extends unknown[]>(h: Hacik<(...a: A) => void>, args: A): boolean {
    if (h.vypnuty) return false
    this.straz.vynuluj()
    this.zapisSkore?.(stavHry.skore)
    try {
      h.akcia(...args)
      return true
    } catch (e) {
      h.vypnuty = true
      this.ohlas({ druh: 'hacik', hacik: h.nazov, sprava: prelozBeh(e), ...this.miesto(e, this.mapa) })
      return false
    } finally {
      this.prevezmiSkore()
    }
  }

  private prevezmiSkore(): void {
    const v = this.citajSkore?.()
    if (typeof v === 'number' && Number.isFinite(v) && v !== stavHry.skore) nastavSkore(v)
  }

  private zalohuj(): Zaloha {
    return {
      nastavenia: { ...nastavenia },
      nesmrtelny: stavHry.nesmrtelny,
      predmety: new Set(stavHry.predmety),
      skore: stavHry.skore,
    }
  }

  private obnov(z: Zaloha): void {
    Object.assign(nastavenia, z.nastavenia)
    stavHry.nesmrtelny = z.nesmrtelny
    nastavPredmety(z.predmety)
    if (stavHry.skore !== z.skore) nastavSkore(z.skore)
  }

  private miesto(e: unknown, mapa: SpojenyKod | null): Partial<ChybaKodu> {
    const m = String((e as Error)?.stack ?? '').match(VZOR_RIADKU)
    if (!m || !mapa) return {}
    const globalny = Number(m[1]) - posun() - 1
    const kde = mapa.najdi(globalny)
    return kde ? { subor: kde.subor, riadok: kde.riadok, stlpec: Number(m[2]) } : {}
  }

  private syntaxChyba(subor: VirtualnySubor, sprava: string, riadok?: number, stlpec?: number): ChybaKodu {
    // Parser si chýbajúcu zátvorku všimne až na prázdnom konci súboru –
    // ukážeme radšej posledný riadok, kde je naozaj kód.
    const riadky = subor.kod.split('\n')
    let posledny = riadky.length
    while (posledny > 1 && riadky[posledny - 1].trim() === '') posledny--
    if (riadok && riadok > posledny) {
      riadok = posledny
      stlpec = undefined
    }
    return { druh: 'syntax', sprava: prelozSyntax(sprava), subor: subor.nazov, riadok, stlpec }
  }

  private zlyhanie(chyba: ChybaKodu): VysledokBehu {
    this.ohlas(chyba)
    return { ok: false, chyba }
  }

  private ohlas(chyba: ChybaKodu): void {
    for (const fn of this.posluchaci) {
      try {
        fn(chyba)
      } catch (e) {
        console.error('[runtime] chyba v posluchačovi chýb', e)
      }
    }
  }
}

export const runtime = new Runtime()
