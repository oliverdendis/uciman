import { parse, type Node } from 'acorn'

export const LIMIT_CYKLU = 10_000
export const MENO_STRAZE = '__straz'

export class ChybaCyklu extends Error {
  constructor() {
    super('Tvoj cyklus nikdy neskončí (viac ako 10 000 opakovaní).')
    this.name = 'ChybaCyklu'
  }
}

export type VysledokStraze =
  | { ok: true; js: string; pocetCyklov: number }
  | { ok: false; riadok?: number; stlpec?: number; sprava: string }

type Cyklus = Node & { body: Node }
const TYPY_CYKLOV = new Set(['WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForInStatement', 'ForOfStatement'])

function najdiCykly(uzol: unknown, vysledok: Cyklus[]): void {
  if (!uzol || typeof uzol !== 'object') return
  if (Array.isArray(uzol)) {
    for (const u of uzol) najdiCykly(u, vysledok)
    return
  }
  const n = uzol as Record<string, unknown>
  if (typeof n.type === 'string' && TYPY_CYKLOV.has(n.type)) vysledok.push(n as unknown as Cyklus)
  for (const kluc in n) {
    if (kluc !== 'loc') najdiCykly(n[kluc], vysledok)
  }
}

/**
 * Do tela každého cyklu vloží `{__straz(id); … }`. Vkladá sa len na ten istý
 * riadok (žiadne nové riadky), takže čísla riadkov v chybách ostanú správne.
 */
export function vlozStrazCyklov(js: string, prveId = 0): VysledokStraze {
  let ast: Node
  try {
    ast = parse(js, { ecmaVersion: 'latest', sourceType: 'script', locations: true })
  } catch (e) {
    const chyba = e as { message?: string; loc?: { line: number; column: number } }
    const sprava = String(chyba.message ?? e).replace(/\s*\(\d+:\d+\)\s*$/, '')
    return { ok: false, riadok: chyba.loc?.line, stlpec: chyba.loc ? chyba.loc.column + 1 : undefined, sprava }
  }
  const cykly: Cyklus[] = []
  najdiCykly(ast, cykly)

  const vlozenia: { pozicia: number; text: string }[] = []
  cykly.forEach((c, id) => {
    vlozenia.push({ pozicia: c.body.start, text: `{${MENO_STRAZE}(${prveId + id});` })
    vlozenia.push({ pozicia: c.body.end, text: '}' })
  })
  // odzadu, aby sa pozície neposúvali; pri rovnakej pozícii najprv '}' (vnútorný cyklus končí skôr)
  vlozenia.sort((a, b) => b.pozicia - a.pozicia || (a.text === '}' ? 1 : -1))
  let vysledok = js
  for (const v of vlozenia) vysledok = vysledok.slice(0, v.pozicia) + v.text + vysledok.slice(v.pozicia)
  return { ok: true, js: vysledok, pocetCyklov: cykly.length }
}

/** Počítadlá pre jedno volanie (beh kódu alebo jeden háčik). */
export function vytvorStraz(limit = LIMIT_CYKLU) {
  const pocty = new Map<number, number>()
  return {
    straz(id: number): void {
      const n = (pocty.get(id) ?? 0) + 1
      if (n > limit) throw new ChybaCyklu()
      pocty.set(id, n)
    },
    vynuluj(): void {
      pocty.clear()
    },
  }
}
