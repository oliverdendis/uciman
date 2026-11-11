import { BUGOVE_SUBORY, PORADIE_SUBOROV, type NazovSuboru } from '../defaults/subory'
import type { VirtualnySubor } from '../runtime/subory'

type Zdroj = 'pouzivatel' | 'program'

/** Obsah troch virtuálnych súborov – jediný zdroj pravdy pre editor aj runtime. */
class StavSuborov {
  private obsah_: Record<NazovSuboru, string> = { ...BUGOVE_SUBORY }
  private posluchaci = new Set<(nazov: NazovSuboru, zdroj: Zdroj) => void>()

  citaj(nazov: NazovSuboru): string {
    return this.obsah_[nazov]
  }

  nastav(nazov: NazovSuboru, kod: string, zdroj: Zdroj = 'pouzivatel'): void {
    if (this.obsah_[nazov] === kod) return
    this.obsah_[nazov] = kod
    for (const fn of this.posluchaci) fn(nazov, zdroj)
  }

  nastavVsetky(obsah: Record<NazovSuboru, string>, zdroj: Zdroj = 'program'): void {
    for (const n of PORADIE_SUBOROV) this.nastav(n, obsah[n], zdroj)
  }

  obsah(): Record<NazovSuboru, string> {
    return { ...this.obsah_ }
  }

  vsetky(): VirtualnySubor[] {
    return PORADIE_SUBOROV.map((nazov) => ({ nazov, kod: this.obsah_[nazov] }))
  }

  naZmenu(fn: (nazov: NazovSuboru, zdroj: Zdroj) => void): () => void {
    this.posluchaci.add(fn)
    return () => this.posluchaci.delete(fn)
  }
}

export const subory = new StavSuborov()
