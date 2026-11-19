import type { VirtualnySubor } from '../runtime/subory'

export type NazovSuboru = 'settings.ts' | 'controls.ts' | 'rules.ts' | 'cheats.ts'
export const PORADIE_SUBOROV: readonly NazovSuboru[] = ['settings.ts', 'controls.ts', 'rules.ts', 'cheats.ts']

const HLAVICKA_NASTAVENI = `// Nastavenia hry – dôležité čísla na jednom mieste.
// Hra ich číta 60× za sekundu, takže zmena sa prejaví hneď.
`

/** Ovládanie bez šípky doľava – tú si študent doprogramuje podľa šípky doprava. */
const OVLADANIE_BEZ_VLAVO = `// Ovládanie: čo sa stane, keď stlačíš klávesu.
//   whileKeyHeld – spúšťa sa stále dokola, kým klávesu držíš
//   onKeyPress   – spustí sa raz, keď klávesu stlačíš

// šípka doprava: panáčik ide doprava
whileKeyHeld("ArrowRight", () => {
  player.walk(settings.speed)
})

// šípka hore: skok
onKeyPress("ArrowUp", () => {
  player.jump()
})

// medzerník: tiež skok
onKeyPress("Space", () => {
  player.jump()
})
`

const HLAVICKA_PRAVIDIEL = `// Pravidlá hry: čo sa stane, keď sa v hre niečo udeje.
`

const KOMENTAR_NEPRIATELA = `// panáčik sa dotkol nepriateľa
// fromAbove = true, keď naňho skočil zhora
// (náraz z boku uberie život – o to sa stará hra sama)`

const HLAVICKA_CHEATOV = `// Cheaty: keď v hre napíšeš kód, spustí sa akcia.
`

/**
 * Pôvodná pokazená verzia – s touto študenti začínajú.
 * Zámerne len 5 bugov (demo na 20–25 min): skok, slabá gravitácia, chýbajúca
 * šípka doľava, mince, nepriatelia. Názvy v kóde sú anglicky (ako v reálnom
 * programovaní), komentáre a chybové hlášky po slovensky.
 */
export const BUGOVE_SUBORY: Record<NazovSuboru, string> = {
  'settings.ts': `${HLAVICKA_NASTAVENI}
// výška skoku: čím väčšie číslo, tým vyššie panáčik vyskočí
settings.jump = 120

// gravitácia: ako silno ťahá panáčika dole (px/s²)
settings.gravity = 300

// rýchlosť chôdze (px/s)
settings.speed = 220

// veľkosť panáčika: 1 = normálny, 2 = dvakrát väčší
settings.size = 1
`,
  'controls.ts': OVLADANIE_BEZ_VLAVO,
  'rules.ts': `${HLAVICKA_PRAVIDIEL}
// panáčik zobral mincu
onCoinCollect(() => {
  score -= 1
})

${KOMENTAR_NEPRIATELA}
onEnemyTouch((fromAbove, enemy) => {
  if (fromAbove) {
    player.addLife()
  } else {
    enemy.destroy()
  }
})
`,
  'cheats.ts': `${HLAVICKA_CHEATOV}// Skús napísať vlastný! Príklad:
// cheat("baguvix", () => player.invincible = true)
`,
}

/** Opravená verzia (učiteľský režim „Všetko opraviť"). */
export const SPRAVNE_SUBORY: Record<NazovSuboru, string> = {
  'settings.ts': `${HLAVICKA_NASTAVENI}
// výška skoku: čím väčšie číslo, tým vyššie panáčik vyskočí
settings.jump = 560

// gravitácia: ako silno ťahá panáčika dole (px/s²)
settings.gravity = 1000

// rýchlosť chôdze (px/s)
settings.speed = 220

// veľkosť panáčika: 1 = normálny, 2 = dvakrát väčší
settings.size = 1
`,
  'controls.ts': OVLADANIE_BEZ_VLAVO.replace(
    '// šípka hore: skok',
    `// šípka doľava: panáčik ide doľava
whileKeyHeld("ArrowLeft", () => {
  player.walk(-settings.speed)
})

// šípka hore: skok`,
  ),
  'rules.ts': `${HLAVICKA_PRAVIDIEL}
// panáčik zobral mincu
onCoinCollect(() => {
  score += 1
})

${KOMENTAR_NEPRIATELA}
onEnemyTouch((fromAbove, enemy) => {
  if (fromAbove) {
    enemy.destroy()
  }
})
`,
  'cheats.ts': `${HLAVICKA_CHEATOV}
cheat("baguvix", () => player.invincible = true)
cheat("umbrella", () => player.giveItem("umbrella"))
`,
}

export function akoSubory(obsah: Record<NazovSuboru, string>): VirtualnySubor[] {
  return PORADIE_SUBOROV.map((nazov) => ({ nazov, kod: obsah[nazov] }))
}
