import { PORADIE_SUBOROV, type NazovSuboru } from '../defaults/subory'

/** Verzia v kľúči: keď zmeníme bugové súbory, staré uložené kódy sa ignorujú. */
export const KLUC_ULOZISKA = 'uciman:kod:v1'

type Obsah = Record<NazovSuboru, string>

/**
 * localStorage môže chýbať alebo hádzať výnimky (súkromné okno, zakázané
 * cookies, plné úložisko) – hra musí fungovať aj bez neho.
 */
function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function nacitajKod(): Obsah | null {
  try {
    const text = storage()?.getItem(KLUC_ULOZISKA)
    if (!text) return null
    const data = JSON.parse(text) as unknown
    if (!data || typeof data !== 'object') return null
    const obsah = data as Record<string, unknown>
    if (!PORADIE_SUBOROV.every((n) => typeof obsah[n] === 'string')) return null
    return Object.fromEntries(PORADIE_SUBOROV.map((n) => [n, obsah[n]])) as Obsah
  } catch {
    return null
  }
}

export function ulozKod(obsah: Obsah): void {
  try {
    storage()?.setItem(KLUC_ULOZISKA, JSON.stringify(obsah))
  } catch {
    // bez úložiska jednoducho neukladáme
  }
}

export function zmazKod(): void {
  try {
    storage()?.removeItem(KLUC_ULOZISKA)
  } catch {
    // nič
  }
}
