/**
 * Prevod farby od študenta ("red", "#f0f", "rgb(0, 128, 255)") na "#rrggbb"
 * cez canvas – prehliadač pozná všetky CSS názvy farieb.
 */
let kontext: CanvasRenderingContext2D | null | undefined

function ctx(): CanvasRenderingContext2D | null {
  if (kontext === undefined) {
    kontext = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null
  }
  return kontext
}

/** Platná CSS farba → "#rrggbb", inak null. Bez prehliadača (unit testy) vždy null. */
export function naHex(v: unknown): string | null {
  if (typeof v !== 'string' || v.trim() === '') return null
  const c = ctx()
  if (!c) return null
  if (typeof CSS !== 'undefined' && !CSS.supports('color', v)) return null
  c.fillStyle = '#000000'
  c.fillStyle = v
  const f = String(c.fillStyle)
  if (f.startsWith('#')) return f.toLowerCase()
  const m = f.match(/\d+(?:\.\d+)?/g)
  if (!m || m.length < 3) return null
  return '#' + m.slice(0, 3).map((n) => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')
}

/** Na overenie v runtime: bez prehliadača stačí, že je to text. */
export function jePlatnaFarba(v: unknown): boolean {
  if (typeof v !== 'string') return false
  return ctx() ? naHex(v) !== null : v.trim() !== ''
}

/** Tmavší odtieň na tieň pixel-artu. */
export function stmav(hex: string, k = 0.72): string {
  const n = parseInt(hex.slice(1), 16)
  const kanal = (posun: number) => Math.round(((n >> posun) & 255) * k).toString(16).padStart(2, '0')
  return `#${kanal(16)}${kanal(8)}${kanal(0)}`
}
