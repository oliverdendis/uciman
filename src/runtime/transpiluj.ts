import { transform } from 'sucrase'

export type VysledokTranspilacie =
  | { ok: true; js: string }
  | { ok: false; riadok?: number; stlpec?: number; sprava: string }

/**
 * TS → JS cez sucrase. Sucrase zachováva čísla riadkov, takže chyby
 * z behu sa dajú mapovať späť na riadok, ktorý študent vidí.
 */
export function transpiluj(ts: string): VysledokTranspilacie {
  try {
    const { code } = transform(ts, { transforms: ['typescript'], disableESTransforms: true })
    return { ok: true, js: code }
  } catch (e) {
    const chyba = e as { message?: string; loc?: { line: number; column: number } }
    const sprava = String(chyba.message ?? e).replace(/\s*\(\d+:\d+\)\s*$/, '')
    return { ok: false, riadok: chyba.loc?.line, stlpec: chyba.loc ? chyba.loc.column + 1 : undefined, sprava }
  }
}
