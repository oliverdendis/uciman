// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { CheatBuffer } from './cheatBuffer'
import { pripojCheatVstup } from './cheatVstup'

describe('CheatBuffer', () => {
  it('rozpozná kód cez endsWith a potom sa vyprázdni', () => {
    const b = new CheatBuffer()
    const kody = ['baguvix']
    let zhody: string[] = []
    for (const z of 'hello baguvix') zhody = b.pridaj(z, kody)
    expect(zhody).toEqual(['baguvix'])
    expect(b.text).toBe('')
  })

  it('je bez ohľadu na veľké písmená', () => {
    const b = new CheatBuffer()
    let zhody: string[] = []
    for (const z of 'ABC') zhody = b.pridaj(z, ['abc'])
    expect(zhody).toEqual(['abc'])
  })

  it('pamätá si najviac 15 znakov', () => {
    const b = new CheatBuffer()
    for (const z of 'abcdefghijklmnopqrstuvwxyz') b.pridaj(z, [])
    expect(b.text).toBe('lmnopqrstuvwxyz')
  })

  it('ignoruje viacznakové klávesy (Shift, ArrowLeft…)', () => {
    const b = new CheatBuffer()
    expect(b.pridaj('Shift', ['shift'])).toEqual([])
    expect(b.text).toBe('')
  })
})

describe('pripojCheatVstup', () => {
  function priprav() {
    document.body.innerHTML = '<div id="hra" tabindex="0"></div><textarea id="editor"></textarea>'
    const hra = document.getElementById('hra')!
    const editor = document.getElementById('editor')!
    const priZnaku = vi.fn()
    pripojCheatVstup(hra, priZnaku)
    return { hra, editor, priZnaku }
  }
  const stlac = (el: HTMLElement, key: string, extra: KeyboardEventInit = {}) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }))

  it('písanie v editore (mimo hry) sa do cheatov nedostane', () => {
    const { editor, priZnaku } = priprav()
    for (const z of 'asdf') stlac(editor, z)
    expect(priZnaku).not.toHaveBeenCalled()
  })

  it('písanie v hre áno', () => {
    const { hra, priZnaku } = priprav()
    for (const z of 'ab') stlac(hra, z)
    expect(priZnaku.mock.calls).toEqual([['a'], ['b']])
  })

  it('skratky s Ctrl a šípky ignoruje', () => {
    const { hra, priZnaku } = priprav()
    stlac(hra, 'c', { ctrlKey: true })
    stlac(hra, 'ArrowLeft')
    stlac(hra, ' ')
    expect(priZnaku).not.toHaveBeenCalled()
  })
})
