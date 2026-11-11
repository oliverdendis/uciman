import { subory } from '../editor/stavSuborov'
import { ulozKod } from '../editor/ulozisko'
import type { VirtualnySubor } from './subory'
import type { ChybaKodu } from './chyby'
import { runtime } from './runtime'

/** Automatické spustenie po poslednej zmene. */
export const ONESKORENIE_MS = 800
/** Keď sa zmenilo iba číslo (napr. 120 → 600), spustíme takmer hneď. */
export const RYCHLE_ONESKORENIE_MS = 250
/** Chyba z automatického spustenia je najprv „jemná“ (študent ešte píše); po tejto pauze červená. */
export const ESKALACIA_CHYBY_MS = 2500

export interface StavBehu {
  /** posledný pokus o spustenie prešiel */
  ok: boolean
  /** chyby z posledného spustenia + chyby z háčikov odvtedy */
  chyby: ChybaKodu[]
  /** čaká sa na automatické spustenie (študent píše) */
  caka: boolean
  /** chyba vznikla pri automatickom spustení a študent asi ešte píše – zobraziť nenápadne */
  jemne: boolean
}

let stav: StavBehu = { ok: true, chyby: [], caka: false, jemne: false }
let casovac: ReturnType<typeof setTimeout> | undefined
let casovacEskalacie: ReturnType<typeof setTimeout> | undefined
/** „tvar“ posledného úspešne spusteného kódu (čísla nahradené nulou) */
let poslednyTvar: string | null = null
const posluchaci = new Set<(s: StavBehu) => void>()

function zmen(novy: Partial<StavBehu>): void {
  stav = { ...stav, ...novy }
  for (const fn of posluchaci) fn(stav)
}

/** Kód bez konkrétnych čísel – ak sa zhoduje, zmenili sa iba čísla. */
export function tvarKodu(s: readonly VirtualnySubor[]): string {
  return s
    .map((x) => x.kod)
    .join('\n\u0000\n')
    .replace(/\d+(?:\.\d+)?/g, '0')
}

export function naStavBehu(fn: (s: StavBehu) => void): () => void {
  posluchaci.add(fn)
  fn(stav)
  return () => posluchaci.delete(fn)
}

function spusti(sposob: 'rucne' | 'auto'): boolean {
  clearTimeout(casovac)
  clearTimeout(casovacEskalacie)
  const aktualne = subory.vsetky()
  ulozKod(subory.obsah())
  const chyby: ChybaKodu[] = []
  const odhlas = runtime.naChybu((ch) => chyby.push(ch))
  const vysledok = runtime.spusti(aktualne)
  odhlas()
  if (vysledok.ok) poslednyTvar = tvarKodu(aktualne)
  const jemne = !vysledok.ok && sposob === 'auto'
  zmen({ ok: vysledok.ok, chyby, caka: false, jemne })
  if (jemne) casovacEskalacie = setTimeout(() => zmen({ jemne: false }), ESKALACIA_CHYBY_MS)
  return vysledok.ok
}

/** Spustí kód hneď (tlačidlo ▶ Spustiť, Ctrl+Enter). Chyby sú hneď červené. */
export function spustiTeraz(): boolean {
  return spusti('rucne')
}

/** Automatické spustenie po zmene – rýchlejšie, ak sa zmenilo iba číslo. */
export function naplanujSpustenie(): void {
  clearTimeout(casovac)
  clearTimeout(casovacEskalacie)
  const lenCisla = poslednyTvar !== null && tvarKodu(subory.vsetky()) === poslednyTvar
  zmen({ caka: true })
  casovac = setTimeout(() => spusti('auto'), lenCisla ? RYCHLE_ONESKORENIE_MS : ONESKORENIE_MS)
}

/** Chyby z háčikov počas hry (napr. pri zbere mince) pridáme do zoznamu – vždy viditeľne. */
runtime.naChybu((ch) => {
  if (ch.druh === 'hacik') zmen({ chyby: [...stav.chyby.filter((c) => c.hacik !== ch.hacik), ch], jemne: false })
})
