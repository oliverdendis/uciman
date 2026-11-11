// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BUGOVE_SUBORY } from '../defaults/subory'
import { KLUC_ULOZISKA, nacitajKod, ulozKod, zmazKod } from './ulozisko'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('úložisko kódu', () => {
  it('uloží a načíta všetky tri súbory', () => {
    const obsah = { ...BUGOVE_SUBORY, 'cheaty.ts': 'cheat("abc", () => {})' }
    ulozKod(obsah)
    expect(nacitajKod()).toEqual(obsah)
    zmazKod()
    expect(nacitajKod()).toBeNull()
  })

  it('pokazené alebo neúplné dáta ignoruje', () => {
    localStorage.setItem(KLUC_ULOZISKA, '{nie je json')
    expect(nacitajKod()).toBeNull()
    localStorage.setItem(KLUC_ULOZISKA, JSON.stringify({ 'nastavenia.ts': 'x' }))
    expect(nacitajKod()).toBeNull()
  })

  it('keď localStorage hádže výnimky, nič nespadne', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })
    expect(() => ulozKod(BUGOVE_SUBORY)).not.toThrow()
    expect(nacitajKod()).toBeNull()
    expect(() => zmazKod()).not.toThrow()
  })
})
