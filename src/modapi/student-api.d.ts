/**
 * Nastavenia hry. Hra ich číta každý snímok (60× za sekundu),
 * takže zmena sa prejaví hneď.
 * @example settings.jump = 560
 */
declare const settings: {
  /** Sila skoku v pixeloch za sekundu. Čím viac, tým vyššie panáčik vyskočí. Rozumne 450 – 800. */
  jump: number
  /** Gravitácia v px/s². Čím viac, tým rýchlejšie panáčik padá. Záporná = padá hore. Rozumne 800 – 1500. */
  gravity: number
  /** Rýchlosť chôdze v pixeloch za sekundu. Rozumne 150 – 400. */
  speed: number
  /** Veľkosť panáčika. 1 = normálna, 2 = dvakrát väčší, 0.5 = polovičný. */
  size: number
  /**
   * Farba mincí – anglický názov farby alebo #kód.
   * @example settings.coinColor = "red"
   */
  coinColor: Farba
  /**
   * Farba trička panáčika – anglický názov farby alebo #kód.
   * @example settings.playerColor = "#00cc66"
   */
  playerColor: Farba
}

/** Farba: anglický názov ako "red", "blue", "hotpink" alebo #kód ako "#ff00ff". */
type Farba =
  | 'red' | 'orange' | 'yellow' | 'gold' | 'green' | 'lime' | 'cyan' | 'blue'
  | 'purple' | 'magenta' | 'hotpink' | 'white' | 'black' | 'gray' | 'brown'
  | (string & {})

/** Panáčik, ktorého ovládaš. */
declare const player: {
  /** Vodorovná pozícia v pixeloch (dá sa iba čítať). */
  readonly x: number
  /** Zvislá pozícia v pixeloch, 0 = hore (dá sa iba čítať). */
  readonly y: number
  /**
   * Počet životov (0 – 5). Môžeš ho čítať aj meniť. Keď klesne na 0, hra skončí.
   * @example if (player.lives === 1) print("Pozor!")
   */
  lives: number
  /**
   * Nesmrteľnosť: keď je `true`, nepriatelia ani pády neuberajú životy.
   * @example player.invincible = true
   */
  invincible: boolean
  /**
   * Dá panáčikovi predmet.
   * Dáždnik (`"umbrella"`): drž skok vo vzduchu a padáš pomaly.
   * @param name názov predmetu
   * @example player.giveItem("umbrella")
   */
  giveItem(name: 'umbrella'): void
  /** Panáčik vyskočí (iba keď stojí na zemi). Výšku určuje `settings.jump`. */
  jump(): void
  /**
   * Panáčik ide danou rýchlosťou – platí, kým to voláš (napr. vo `whileKeyHeld`).
   * Kladné číslo = doprava, záporné = doľava.
   * @example player.walk(settings.speed)
   */
  walk(speed: number): void
  /** Pridá jeden život (najviac 5). */
  addLife(): void
}

/**
 * Skóre hráča. Môžeš ho čítať aj meniť.
 * @example score = score + 10
 */
declare let score: number

/** Nepriateľ, ktorého sa panáčik dotkol. */
interface Enemy {
  /** Zničí nepriateľa. */
  destroy(): void
}

/**
 * Vytvorí cheat: keď v hre napíšeš `code`, spustí sa `action`.
 * @param code text, ktorý napíšeš v hre (najviac 15 znakov, bez medzier)
 * @param action čo sa má stať
 * @example cheat("baguvix", () => player.invincible = true)
 */
declare function cheat(code: string, action: () => void): void

/**
 * Spustí sa vždy, keď panáčik zoberie mincu.
 * @param action čo sa má stať
 * @example onCoinCollect(() => { print("Mám mincu!") })
 */
declare function onCoinCollect(action: () => void): void

/**
 * Spustí sa, keď sa panáčik dotkne nepriateľa.
 * @param action dostane `fromAbove` (true = panáčik naňho skočil zhora) a `enemy`
 * @example
 * onEnemyTouch((fromAbove, enemy) => {
 *   if (fromAbove) enemy.destroy()
 * })
 */
declare function onEnemyTouch(action: (fromAbove: boolean, enemy: Enemy) => void): void

/**
 * Spustí sa vždy, keď panáčik vyskočí.
 * @param action čo sa má stať
 * @example onJump(() => { print("Hop!") })
 */
declare function onJump(action: () => void): void

/**
 * Zobrazí bublinu s textom nad panáčikom.
 * @example print("Ahoj!")
 */
declare function print(text: string | number | boolean): void

/** Názov klávesy: šípky, "Space" (medzerník), "Enter" alebo písmeno či číslica, napr. "a". */
type Key =
  | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown' | 'Space' | 'Enter'
  | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm'
  | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

/**
 * Spustí sa raz, keď stlačíš klávesu.
 * @param key napr. "ArrowUp" (šípka hore) alebo "Space" (medzerník)
 * @example onKeyPress("ArrowUp", () => { player.jump() })
 */
declare function onKeyPress(key: Key, action: () => void): void

/**
 * Spúšťa sa stále dokola (60× za sekundu), kým držíš klávesu.
 * @param key napr. "ArrowRight" (šípka doprava), "ArrowLeft" (šípka doľava)
 * @example whileKeyHeld("ArrowRight", () => { player.walk(settings.speed) })
 */
declare function whileKeyHeld(key: Key, action: () => void): void
