import type { VirtualnySubor } from '../runtime/subory'

export type NazovSuboru = 'settings.ts' | 'controls.ts' | 'rules.ts' | 'cheats.ts'
export const PORADIE_SUBOROV: readonly NazovSuboru[] = ['settings.ts', 'controls.ts', 'rules.ts', 'cheats.ts']

/** Ovládanie bez šípky doľava – tú si študent doprogramuje podľa šípky doprava. */
const OVLADANIE_BEZ_VLAVO = `// Ovládanie

// šípka doprava
whileKeyHeld("ArrowRight", () => {
  player.walk(settings.speed)
})

// šípka hore
onKeyPress("ArrowUp", () => {
  player.jump()
})

// medzerník
onKeyPress("Space", () => {
  player.jump()
})
`

/**
 * Pôvodná pokazená verzia – s touto študenti začínajú.
 * Zámerne len 5 bugov (demo na 20–25 min): skok, slabá gravitácia, chýbajúca
 * šípka doľava, mince, nepriatelia. Názvy v kóde sú anglicky, komentáre
 * stručne po slovensky a bez nápovedí k bugom.
 * Skryté (nie sú v súboroch, objavia sa v napovedaní): settings.size, player.lives,
 * settings.coinColor, settings.playerColor, onJump.
 */
export const BUGOVE_SUBORY: Record<NazovSuboru, string> = {
  'settings.ts': `// Nastavenia hry

// výška skoku
settings.jump = 120

// gravitácia
settings.gravity = 300

// rýchlosť chôdze
settings.speed = 220
`,
  'controls.ts': OVLADANIE_BEZ_VLAVO,
  'rules.ts': `// Pravidlá hry

// zber mince
onCoinCollect(() => {
  score = score - 1
})

// dotyk nepriateľa
onEnemyTouch((fromAbove, enemy) => {
  if (fromAbove) {
    player.addLife()
  } else {
    enemy.destroy()
  }
})
`,
  'cheats.ts': `// Cheaty, príklad:
// cheat("baguvix", () => player.invincible = true)
`,
}

/** Opravená verzia (učiteľský režim „Všetko opraviť"). */
export const SPRAVNE_SUBORY: Record<NazovSuboru, string> = {
  'settings.ts': `// Nastavenia hry

// výška skoku
settings.jump = 560

// gravitácia
settings.gravity = 1000

// rýchlosť chôdze
settings.speed = 220
`,
  'controls.ts': OVLADANIE_BEZ_VLAVO.replace(
    '// šípka hore',
    `// šípka doľava
whileKeyHeld("ArrowLeft", () => {
  player.walk(-settings.speed)
})

// šípka hore`,
  ),
  'rules.ts': `// Pravidlá hry

// zber mince
onCoinCollect(() => {
  score = score + 1
})

// dotyk nepriateľa
onEnemyTouch((fromAbove, enemy) => {
  if (fromAbove) {
    enemy.destroy()
  }
})
`,
  'cheats.ts': `// Cheaty
cheat("baguvix", () => player.invincible = true)
cheat("umbrella", () => player.giveItem("umbrella"))
`,
}

export function akoSubory(obsah: Record<NazovSuboru, string>): VirtualnySubor[] {
  return PORADIE_SUBOROV.map((nazov) => ({ nazov, kod: obsah[nazov] }))
}
