import { describe, expect, it } from 'vitest'
import { ChybaCyklu, vlozStrazCyklov, vytvorStraz } from './straz'

describe('vlozStrazCyklov', () => {
  it('vloží stráž do všetkých typov cyklov a nezmení počet riadkov', () => {
    const js = 'while (a) { x() }\nfor (;;) y()\ndo z(); while (b)\nfor (const k in o) {}\nfor (const v of p) w()'
    const r = vlozStrazCyklov(js)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.pocetCyklov).toBe(5)
    expect(r.js.split('\n')).toHaveLength(5)
    expect(r.js.match(/__straz\(/g)).toHaveLength(5)
  })

  it('reťazce s „while“ nechá tak', () => {
    const r = vlozStrazCyklov('const s = "while (true) {}"')
    expect(r.ok && r.pocetCyklov).toBe(0)
  })

  it('vnorené cykly ostanú platný JS', () => {
    const r = vlozStrazCyklov('for (let i=0;i<2;i++) for (let j=0;j<2;j++) while(false);')
    expect(r.ok).toBe(true)
    if (r.ok) expect(() => new Function('__straz', r.js)(() => {})).not.toThrow()
  })

  it('stráž vyhodí chybu po limite', () => {
    const s = vytvorStraz(3)
    s.straz(0)
    s.straz(0)
    s.straz(0)
    expect(() => s.straz(0)).toThrow(ChybaCyklu)
    s.vynuluj()
    expect(() => s.straz(0)).not.toThrow()
  })
})
