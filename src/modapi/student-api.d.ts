/**
 * Nastavenia hry. Hra ich číta každý snímok (60× za sekundu),
 * takže zmena sa prejaví hneď.
 * @example nastavenia.skok = 560
 */
declare const nastavenia: {
  /** Sila skoku v pixeloch za sekundu. Čím viac, tým vyššie panáčik vyskočí. Rozumne 450 – 800. */
  skok: number
  /** Gravitácia v px/s². Kladná = padá dole, záporná = padá hore. Rozumne 600 – 1500. */
  gravitacia: number
  /** Rýchlosť chôdze v pixeloch za sekundu. Rozumne 150 – 400. */
  rychlost: number
  /** Veľkosť panáčika. 1 = normálna, 2 = dvakrát väčší, 0.5 = polovičný. */
  velkost: number
}

/** Panáčik, ktorého ovládaš. */
declare const hrac: {
  /** Vodorovná pozícia v pixeloch (dá sa iba čítať). */
  readonly x: number
  /** Zvislá pozícia v pixeloch, 0 = hore (dá sa iba čítať). */
  readonly y: number
  /**
   * Keď je `true`, nepriatelia ani pády neuberajú životy.
   * @example hrac.nesmrtelny = true
   */
  nesmrtelny: boolean
  /**
   * Dá panáčikovi predmet.
   * Dáždnik: drž skok vo vzduchu a padáš pomaly.
   * @param nazov názov predmetu
   * @example hrac.dajPredmet("dazdnik")
   */
  dajPredmet(nazov: 'dazdnik'): void
  /** Panáčik okamžite vyskočí – aj keď je vo vzduchu. */
  skoc(): void
  /** Pridá jeden život (najviac 5). */
  pridajZivot(): void
}

/**
 * Skóre hráča. Môžeš ho čítať aj meniť.
 * @example skore += 1
 */
declare let skore: number

/** Nepriateľ, ktorého sa panáčik dotkol. */
interface Nepriatel {
  /** Zničí nepriateľa. */
  znic(): void
}

/**
 * Vytvorí cheat: keď v hre napíšeš `kod`, spustí sa `akcia`.
 * @param kod text, ktorý napíšeš v hre (najviac 15 znakov, bez medzier)
 * @param akcia čo sa má stať
 * @example cheat("baguvix", () => hrac.nesmrtelny = true)
 */
declare function cheat(kod: string, akcia: () => void): void

/**
 * Spustí sa vždy, keď panáčik zoberie mincu.
 * @param akcia čo sa má stať
 * @example priZbereMince(() => { skore += 1 })
 */
declare function priZbereMince(akcia: () => void): void

/**
 * Spustí sa, keď sa panáčik dotkne nepriateľa.
 * @param akcia dostane `zhora` (true = panáčik naňho skočil zhora) a `nepriatel`
 * @example
 * priDotykuNepriatela((zhora, nepriatel) => {
 *   if (zhora) nepriatel.znic()
 * })
 */
declare function priDotykuNepriatela(akcia: (zhora: boolean, nepriatel: Nepriatel) => void): void

/**
 * Zobrazí bublinu s textom nad panáčikom.
 * @example vypis("Ahoj!")
 */
declare function vypis(text: string | number | boolean): void
