import Phaser from 'phaser'

/**
 * Pixel-art textúry generované v kóde (žiadne sťahovanie, žiadne CDN).
 * Kľúče textúr sú stabilné. Ak neskôr pridáme Kenney PNG do public/assets/,
 * stačí ich načítať v preload() pod rovnakými kľúčmi a tento generátor ich preskočí.
 */

const PALETA: Record<string, string> = {
  k: '#1d1b2e', // obrys
  s: '#f6c79a', // pokožka
  S: '#d9a273', // tieň pokožky
  b: '#2f6fde', // čiapka
  B: '#1c4aa6', // šilt
  h: '#5a3a22', // vlasy
  r: '#e2483d', // tričko
  R: '#b03028',
  j: '#34507e', // nohavice
  J: '#243a5e',
  n: '#6b4423', // topánky / rúčka
  w: '#ffffff',
  y: '#f7c933', // zlatá
  Y: '#d79a1c',
  g: '#5cc251', // chrobák
  G: '#2f8a3a',
  l: '#8be36b', // svetlá tráva
  t: '#4cb043', // tráva
  T: '#2f8a3a',
  d: '#b8743a', // hlina
  D: '#8e5426',
  p: '#d79a5a',
  q: '#c8553d', // tehla
  Q: '#9b3b2a',
  m: '#e8c39e', // malta
  o: '#ff9a3c', // oranžová
  e: '#9aa0b8', // sivá
}

function zPixelov(scene: Phaser.Scene, kluc: string, riadky: readonly string[], mierka: number): void {
  if (scene.textures.exists(kluc)) return
  const w = Math.max(...riadky.map((r) => r.length))
  const h = riadky.length
  const tex = scene.textures.createCanvas(kluc, w * mierka, h * mierka)
  if (!tex) return
  const ctx = tex.getContext()
  riadky.forEach((riadok, y) => {
    for (let x = 0; x < riadok.length; x++) {
      const farba = PALETA[riadok[x]]
      if (!farba) continue
      ctx.fillStyle = farba
      ctx.fillRect(x * mierka, y * mierka, mierka, mierka)
    }
  })
  tex.refresh()
}

function zFunkcie(scene: Phaser.Scene, kluc: string, w: number, h: number, mierka: number, fn: (x: number, y: number) => string): void {
  const riadky: string[] = []
  for (let y = 0; y < h; y++) {
    let r = ''
    for (let x = 0; x < w; x++) r += fn(x, y)
    riadky.push(r)
  }
  zPixelov(scene, kluc, riadky, mierka)
}

/** deterministický „šum" pre dlaždice */
function hash(x: number, y: number): number {
  let n = x * 374761393 + y * 668265263
  n = (n ^ (n >>> 13)) * 1274126177
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}

// ---------------------------------------------------------------- hráč
const HLAVA = [
  '......kkkkk.....',
  '.....kbbbbbk....',
  '....kbbwbbbbk...',
  '....kbbbbbbbk...',
  '...kBBBBBBBBBBk.',
  '....khhsssssk...',
  '....khskssksk...',
  '....kssssssSk...',
  '....kssskkssk...',
  '.....kSSSSSk....',
  '....krrrrrrk....',
  '...krrryrrrrk...',
  '..ksRrrrrrrRsk..',
  '..kskrrrrrrkSk..',
  '...kkjjjjjjkk...',
  '....kjjjjjjk....',
]
const NOHY_STOJ = ['....kjjJJjjk....', '....kjjkkjjk....', '...knnnk.knnnk..', '...kkkkk.kkkkk..']
const NOHY_KROK = ['...kjjJk.kjjk...', '..kjjk...kjjk...', '.knnnk....knnnk.', '.kkkk......kkkk.']

// ---------------------------------------------------------------- chrobák (nepriateľ = „bug")
const CHROBAK_TELO = [
  '..k..........k..',
  '...k........k...',
  '....kkkkkkkk....',
  '...kgggggggGk...',
  '..kgwwgggwwgGk..',
  '..kgwkgggwkgGk..',
  '.kggggggggggGGk.',
  '.kgggkkkkkgggGk.',
  '.kGgggggggggGGk.',
  '..kGGGGGGGGGGk..',
  '...kkkkkkkkkk...',
]
const CHROBAK_NOHY_1 = ['...k.k.kk.k.k...', '..k..k.k..k..k..']
const CHROBAK_NOHY_2 = ['...k.k.kk.k.k...', '....k.k..k.k....']

const MINCA = [
  '....kkkk....',
  '..kkyyyykk..',
  '.kyywwyyyYk.',
  '.kywyyyyyYk.',
  'kyywyyyyyyYk',
  'kywyyyyyyyYk',
  'kyyyyyyyyyYk',
  'kyyyyyyyyYYk',
  '.kyyyyyyYYk.',
  '.kyyyyyYYYk.',
  '..kkYYYYkk..',
  '....kkkk....',
]

const DAZDNIK = [
  '......kkkk......',
  '....kkrrwwkk....',
  '...krrrwwwrrk...',
  '..krrrrwwwrrrk..',
  '.krrrrrwwwrrrrk.',
  'kkkkkkkkkkkkkkkk',
  '.......kn.......',
  '.......kn.......',
  '.......kn.......',
  '.......kn..k....',
  '........knk.....',
]

export function vytvorTextury(scene: Phaser.Scene): void {
  zPixelov(scene, 'hrac-stoj', [...HLAVA, ...NOHY_STOJ], 2)
  zPixelov(scene, 'hrac-krok', [...HLAVA, ...NOHY_KROK], 2)
  zPixelov(scene, 'chrobak-1', [...CHROBAK_TELO, ...CHROBAK_NOHY_1], 2)
  zPixelov(scene, 'chrobak-2', [...CHROBAK_TELO, ...CHROBAK_NOHY_2], 2)
  zPixelov(scene, 'minca', MINCA, 2)
  zPixelov(scene, 'dazdnik', DAZDNIK, 3)

  // tráva (horná dlaždica zeme)
  zFunkcie(scene, 'dlazdica-trava', 16, 16, 2, (x, y) => {
    if (y === 0) return hash(x, 1) > 0.75 ? 't' : 'l'
    if (y < 3) return hash(x, y) > 0.8 ? 'T' : 't'
    if (y === 3) return hash(x, 7) > 0.5 ? 'T' : 'd'
    if (y === 4 && hash(x, 9) > 0.7) return 'T'
    const r = hash(x, y)
    return r > 0.92 ? 'p' : r > 0.8 ? 'D' : 'd'
  })
  zFunkcie(scene, 'dlazdica-hlina', 16, 16, 2, (x, y) => {
    const r = hash(x + 31, y + 17)
    return r > 0.93 ? 'p' : r > 0.8 ? 'D' : 'd'
  })
  zFunkcie(scene, 'dlazdica-tehla', 16, 16, 2, (x, y) => {
    if (y === 0 || y === 8) return 'm'
    const spara = y < 8 ? 0 : 8
    if (x === spara) return 'm'
    if (y === 1 || y === 9) return 'o'
    if (y === 7 || y === 15) return 'Q'
    return hash(x, y) > 0.9 ? 'Q' : 'q'
  })

  // cieľová vlajka: žrď + zástava
  zFunkcie(scene, 'ciel', 24, 96, 2, (x, y) => {
    if (y < 4 && x >= 1 && x <= 5) return (x - 3) ** 2 + (y - 2) ** 2 <= 4 ? 'y' : '.'
    if (x >= 2 && x <= 4 && y >= 4) return x === 2 ? 'w' : 'e'
    if (y >= 6 && y < 22 && x > 4 && x - 5 <= (y < 14 ? y - 6 : 22 - y) * 2) return 'g'
    return '.'
  })
  // checkpoint (sivý = neaktívny, oranžový = aktívny)
  for (const [kluc, farba] of [['checkpoint', 'e'], ['checkpoint-aktivny', 'o']] as const) {
    zFunkcie(scene, kluc, 12, 32, 2, (x, y) => {
      if (x === 1 || x === 2) return y > 0 ? 'k' : '.'
      if (y >= 1 && y < 9 && x > 2 && x - 3 <= (y < 5 ? y - 1 : 9 - y) * 2) return farba
      return '.'
    })
  }

  vytvorPozadie(scene)
}

function vytvorPozadie(scene: Phaser.Scene): void {
  // oblak
  if (!scene.textures.exists('oblak')) {
    const g = scene.make.graphics({}, false)
    g.fillStyle(0xffffff, 1)
    g.fillEllipse(30, 34, 50, 26)
    g.fillEllipse(56, 24, 50, 40)
    g.fillEllipse(80, 34, 40, 24)
    g.fillRect(14, 34, 84, 12)
    g.generateTexture('oblak', 110, 50)
    g.destroy()
  }
  // dve vrstvy kopcov, opakovateľné do strán (periódy delia 512)
  const vrstvy: [string, string, number, number][] = [
    ['kopce-daleko', '#9ad6c4', 150, 50],
    ['kopce-blizko', '#6cbf8a', 100, 36],
  ]
  for (const [kluc, farba, zaklad, amp] of vrstvy) {
    if (scene.textures.exists(kluc)) continue
    const W = 512
    const H = 220
    const tex = scene.textures.createCanvas(kluc, W, H)
    if (!tex) continue
    const ctx = tex.getContext()
    ctx.fillStyle = farba
    for (let x = 0; x < W; x += 2) {
      const v = zaklad + amp * Math.sin((2 * Math.PI * x) / W) + (amp / 2) * Math.sin((4 * Math.PI * x) / W + 1)
      ctx.fillRect(x, H - v, 2, v)
    }
    tex.refresh()
  }
}
