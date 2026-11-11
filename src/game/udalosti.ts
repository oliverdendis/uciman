/** Typované udalosti, ktoré hra posiela von (HUD, efekty, testy). */
export interface MapaUdalosti {
  skore: number
  zivoty: number
  predmety: readonly string[]
  /** hráč dopadol na zem (gravitácia smerom dole) */
  pristal: { gravitacia: number }
  /** zber mince – skóre pred a po */
  minca: { pred: number; po: number }
  nepriatelZniceny: { zhora: boolean }
  /** hráč plachtí s dáždnikom */
  plachti: void
  ciel: void
  smrt: { dovod: 'nepriatel' | 'priepast' }
  /** bol aktivovaný cheat */
  cheat: { kod: string }
  /** študentský kód zavolal vypis() */
  vypis: string
}

type Posluchac<T> = (data: T) => void

class Udalosti {
  private posluchaci = new Map<keyof MapaUdalosti, Set<Posluchac<never>>>()

  on<K extends keyof MapaUdalosti>(nazov: K, fn: Posluchac<MapaUdalosti[K]>): () => void {
    let mnozina = this.posluchaci.get(nazov)
    if (!mnozina) {
      mnozina = new Set()
      this.posluchaci.set(nazov, mnozina)
    }
    mnozina.add(fn as Posluchac<never>)
    return () => mnozina.delete(fn as Posluchac<never>)
  }

  emit<K extends keyof MapaUdalosti>(nazov: K, ...data: MapaUdalosti[K] extends void ? [] : [MapaUdalosti[K]]): void {
    const mnozina = this.posluchaci.get(nazov)
    if (!mnozina) return
    for (const fn of mnozina) {
      try {
        ;(fn as Posluchac<unknown>)(data[0])
      } catch (e) {
        console.error(`[udalosti] chyba v posluchačovi „${nazov}"`, e)
      }
    }
  }
}

export const udalosti = new Udalosti()
