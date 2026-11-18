import type { VirtualnySubor } from '../runtime/subory'

export type NazovSuboru = 'settings.ts' | 'controls.ts' | 'rules.ts' | 'cheats.ts'
export const PORADIE_SUBOROV: readonly NazovSuboru[] = ['settings.ts', 'controls.ts', 'rules.ts', 'cheats.ts']

/** Ovládanie bez šípky doľava – tú si študent doprogramuje podľa šípky doprava. */
const OVLADANIE_BEZ_VLAVO = `// Čo sa stane, keď stlačíš klávesu.

whileKeyHeld("ArrowRight", () => {
  player.walk(settings.speed)
})

onKeyPress("ArrowUp", () => {
  player.jump()
})

onKeyPress("Space", () => {
  player.jump()
})
`

/**
 * Pôvodná pokazená verzia – s touto študenti začínajú.
 * Zámerne len 5 bugov (demo na 20–25 min): skok, slabá gravitácia, chýbajúca
 * šípka doľava, mince, nepriatelia. Názvy v kóde sú anglicky (ako v reálnom
 * programovaní), komentáre a chybové hlášky po slovensky.
 */
export const BUGOVE_SUBORY: Record<NazovSuboru, string> = {
  'settings.ts': `settings.jump = 120   // panáčik nevyskočí na prvú plošinu
settings.gravity = 300
settings.speed = 220
settings.size = 1
`,
  'controls.ts': OVLADANIE_BEZ_VLAVO,
  'rules.ts': `onCoinCollect(() => {
  score -= 1   // BUG: mince uberajú body
})

onEnemyTouch((fromAbove, enemy) => {
  if (fromAbove) {
    player.addLife()   // BUG: má zničiť nepriateľa
  } else {
    enemy.destroy()    // BUG: obrátene
  }
})
`,
  'cheats.ts': `// Skús napísať vlastný cheat! Príklad:
// cheat("baguvix", () => player.invincible = true)
`,
}

/** Opravená verzia (učiteľský režim „Všetko opraviť"). */
export const SPRAVNE_SUBORY: Record<NazovSuboru, string> = {
  'settings.ts': `settings.jump = 560
settings.gravity = 1000
settings.speed = 220
settings.size = 1
`,
  'controls.ts': OVLADANIE_BEZ_VLAVO.replace(
    'onKeyPress("ArrowUp"',
    `whileKeyHeld("ArrowLeft", () => {
  player.walk(-settings.speed)
})

onKeyPress("ArrowUp"`,
  ),
  'rules.ts': `onCoinCollect(() => {
  score += 1
})

onEnemyTouch((fromAbove, enemy) => {
  if (fromAbove) {
    enemy.destroy()
  }
})
`,
  'cheats.ts': `cheat("baguvix", () => player.invincible = true)
cheat("umbrella", () => player.giveItem("umbrella"))
`,
}

export function akoSubory(obsah: Record<NazovSuboru, string>): VirtualnySubor[] {
  return PORADIE_SUBOROV.map((nazov) => ({ nazov, kod: obsah[nazov] }))
}
