export const MAX_DLZKA_CHEATU = 15

/**
 * Pamätá si posledných ~15 znakov napísaných do hry a po každom znaku
 * skontroluje, či buffer končí niektorým zaregistrovaným kódom.
 */
export class CheatBuffer {
  private obsah = ''

  constructor(private readonly maxDlzka = MAX_DLZKA_CHEATU) {}

  get text(): string {
    return this.obsah
  }

  /** Pridá znak a vráti kódy, ktoré práve sedia (buffer sa po zhode vyprázdni). */
  pridaj(znak: string, kody: Iterable<string>): string[] {
    if (znak.length !== 1) return []
    this.obsah = (this.obsah + znak.toLowerCase()).slice(-this.maxDlzka)
    const zhody: string[] = []
    for (const kod of kody) {
      if (kod.length > 0 && this.obsah.endsWith(kod.toLowerCase())) zhody.push(kod)
    }
    if (zhody.length > 0) this.vyprazdni()
    return zhody
  }

  vyprazdni(): void {
    this.obsah = ''
  }
}
