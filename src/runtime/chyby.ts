/**
 * Preklad chybových hlášok JavaScriptu (Chrome/Edge/Firefox) a parsera
 * do ľudskej slovenčiny pre študentov.
 */

export interface ChybaKodu {
  druh: 'syntax' | 'beh' | 'hacik'
  sprava: string
  subor?: string
  riadok?: number
  stlpec?: number
  /** pri chybe v háčiku: ktorý háčik sa vypol */
  hacik?: string
}

type Pravidlo = [RegExp, (...m: string[]) => string]

const BEH: Pravidlo[] = [
  [/^(\S+) is not defined/, (m) => `Neznáme slovo „${m}“. Skontroluj preklep (napr. hrac, nastavenia, skore).`],
  [/^(\S+) is not a function/, (m) => `„${m}“ nie je funkcia, nedá sa zavolať so zátvorkami ().`],
  [/^(?:\S+ )?is not a function/, () => 'Toto nie je funkcia, nedá sa zavolať so zátvorkami ().'],
  [/Cannot read propert(?:y|ies) of (undefined|null) \(reading '(.+)'\)/, (_n, p) => `Nedá sa čítať „${p}“, pretože vec pred bodkou neexistuje.`],
  [/can't access property "(.+?)", .* is (?:undefined|null)/, (p) => `Nedá sa čítať „${p}“, pretože vec pred bodkou neexistuje.`],
  [/^(\S+) is (?:undefined|null)$/, (m) => `„${m}“ neexistuje.`],
  [/Cannot set property (\w+) of .* which has only a getter/,(p) => `„${p}“ sa dá iba čítať, nemôžeš ho meniť.`],
  [/setting getter-only property "(\w+)"/, (p) => `„${p}“ sa dá iba čítať, nemôžeš ho meniť.`],
  [/Cannot add property (\w+), object is not extensible/, (p) => `Vlastnosť „${p}“ neexistuje. Skontroluj preklep.`],
  [/can't define property "(\w+)": .*not extensible/, (p) => `Vlastnosť „${p}“ neexistuje. Skontroluj preklep.`],
  [/Assignment to constant variable|invalid assignment to const/, () => 'Do konštanty (const) sa nedá priradiť nová hodnota. Použi let.'],
  [/Identifier '(\w+)' has already been declared|redeclaration of (?:let|const|var) (\w+)/, (a, b) => `„${a || b}“ už existuje, nedeklaruj ho druhýkrát.`],
  [/Maximum call stack|too much recursion/, () => 'Funkcia volá sama seba donekonečna.'],
]

const SYNTAX: Pravidlo[] = [
  [/expected "\)"/, () => 'Chýba zátvorka „)“.'],
  [/expected "\]"/, () => 'Chýba zátvorka „]“.'],
  [/expected "\}"/, () => 'Chýba zátvorka „}“.'],
  // parser čaká čiarku v zozname argumentov – v praxi takmer vždy chýba „)“
  [/expected ","/, () => 'Chýba zátvorka „)“ alebo čiarka „,“.'],
  [/expected "(.+?)"/, (z) => `Chýba znak „${z}“.`],
  [/Unterminated string/i, () => 'Neukončený text – chýba úvodzovka.'],
  [/Unterminated template/i, () => 'Neukončený text – chýba spätná úvodzovka `.'],
  [/Unterminated comment/i, () => 'Neukončený komentár – chýba */.'],
  [/missing \) after|missing \)/i, () => 'Chýba zátvorka „)“.'],
  [/Unexpectedly reached the end of input/i, () => 'Kód nie je dopísaný – chýba niečo za bodkou alebo zátvorka.'],
  [/Unexpected end of input|end of script/i, () => 'Kód náhle končí – asi chýba zátvorka „}“ alebo „)“.'],
  [/Unexpected token|unexpected token/i, () => 'Nečakaný znak – skontroluj zátvorky, čiarky a úvodzovky.'],
  [/Invalid or unexpected token|illegal character/i, () => 'Neplatný znak v kóde.'],
  [/Identifier '(\w+)' has already been declared|redeclaration of (?:let|const|var) (\w+)/, (a, b) => `„${a || b}“ už existuje, nedeklaruj ho druhýkrát.`],
]

function pouzi(pravidla: Pravidlo[], sprava: string): string | null {
  for (const [vzor, preklad] of pravidla) {
    const m = sprava.match(vzor)
    if (m) return preklad(...m.slice(1).map((x) => x ?? ''))
  }
  return null
}

export function prelozSyntax(sprava: string): string {
  return pouzi(SYNTAX, sprava) ?? `Chyba v zápise kódu: ${sprava}`
}

export function prelozBeh(e: unknown): string {
  if (e instanceof Error && (e.name === 'ChybaApi' || e.name === 'ChybaCyklu')) return e.message
  const sprava = e instanceof Error ? e.message : String(e)
  if (e instanceof SyntaxError) return prelozSyntax(sprava)
  return pouzi(BEH, sprava) ?? `Chyba: ${sprava}`
}

export function popisChyby(ch: ChybaKodu): string {
  const kde = ch.subor ? `${ch.subor}${ch.riadok ? `, riadok ${ch.riadok}` : ''}` : ch.riadok ? `Riadok ${ch.riadok}` : ''
  const hacik = ch.hacik ? ` (háčik ${ch.hacik} je vypnutý do ďalšieho spustenia)` : ''
  return `${kde ? kde + ': ' : ''}${ch.sprava}${hacik}`
}
