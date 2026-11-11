import { MAX_ZIVOTOV, stavHry } from '../game/stav'
import { udalosti } from '../game/udalosti'

const NAZVY_PREDMETOV: Record<string, string> = { dazdnik: '☂️ dáždnik' }

function el(id: string): HTMLElement {
  const e = document.getElementById(id)
  if (!e) throw new Error(`Chýba element #${id}`)
  return e
}

export function napojHud(): void {
  const skore = el('hud-skore')
  const zivoty = el('hud-zivoty')
  const predmety = el('hud-predmety')

  const vykresliZivoty = (n: number) => {
    zivoty.textContent = '❤'.repeat(n) + '♡'.repeat(Math.max(0, Math.min(MAX_ZIVOTOV, 3) - n)) || '—'
  }
  udalosti.on('skore', (s) => (skore.textContent = String(s)))
  udalosti.on('zivoty', vykresliZivoty)
  udalosti.on('predmety', (p) => (predmety.textContent = p.map((x) => NAZVY_PREDMETOV[x] ?? x).join(', ') || '—'))

  skore.textContent = String(stavHry.skore)
  vykresliZivoty(stavHry.zivoty)
}
