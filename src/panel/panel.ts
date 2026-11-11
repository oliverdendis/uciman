import { BUGOVE_SUBORY, SPRAVNE_SUBORY } from '../defaults/subory'
import { vytvorKodZalozku, type KodZalozka } from '../editor/kodZalozka'
import { subory } from '../editor/stavSuborov'
import { spustiTeraz } from '../runtime/ovladac'

export interface Panel {
  readonly kod: KodZalozka
}

export interface MoznostiPanela {
  /** `?ucitel=1` – tlačidlá „Všetko opraviť“ / „Všetko pokaziť“ */
  ucitel: boolean
  /** vráti level na začiatok (pozícia, skóre, životy) */
  resetujLevel(): void
}

const ZRUSENIE_POTVRDENIA_MS = 6000

/** Panel = kód hry. Žiadne misie ani odznaky: odmenou je opravená hra. */
export function vytvorPanel(koren: HTMLElement, moznosti: MoznostiPanela): Panel {
  koren.innerHTML = `
    <div class="panel-hlavicka">
      <h1>Hra je pokazená</h1>
      <p>Oprav ju v kóde – zmeny sa prejavia hneď, bez reštartu.</p>
    </div>
    <div class="panel-obsah panel-kod"></div>
    ${
      moznosti.ucitel
        ? `<div class="panel-ucitel">
            <span>Učiteľ:</span>
            <button class="tlacidlo tlacidlo-druhe" data-akcia="opravit">✔ Všetko opraviť</button>
            <button class="tlacidlo tlacidlo-druhe" data-akcia="pokazit">✘ Všetko pokaziť</button>
          </div>`
        : ''
    }
    <div class="panel-tlacidla">
      <button class="tlacidlo tlacidlo-hlavne" data-akcia="spustit" title="Ctrl+Enter">▶ Spustiť</button>
      <button class="tlacidlo tlacidlo-druhe" data-akcia="reset" title="Vráti kód aj hru na pôvodnú pokazenú verziu">↺ Reset</button>
      <span class="potvrdenie" hidden>
        Vrátiť kód aj hru na začiatok?
        <button class="tlacidlo tlacidlo-nebezpecne" data-akcia="reset-ano">Áno, resetovať</button>
        <button class="tlacidlo tlacidlo-druhe" data-akcia="reset-nie">Nie</button>
      </span>
    </div>`

  const kod = vytvorKodZalozku(koren.querySelector<HTMLElement>('.panel-kod')!)
  const tlacidlo = (akcia: string) => koren.querySelector<HTMLButtonElement>(`[data-akcia="${akcia}"]`)

  tlacidlo('spustit')!.addEventListener('click', () => spustiTeraz())

  // --- Reset s potvrdením priamo v paneli (žiadne blokujúce okno prehliadača) ---
  const resetBtn = tlacidlo('reset')!
  const potvrdenie = koren.querySelector<HTMLElement>('.potvrdenie')!
  let casovacPotvrdenia: ReturnType<typeof setTimeout> | undefined
  const ukazPotvrdenie = (ano: boolean) => {
    clearTimeout(casovacPotvrdenia)
    potvrdenie.hidden = !ano
    resetBtn.hidden = ano
    if (ano) {
      tlacidlo('reset-nie')!.focus()
      casovacPotvrdenia = setTimeout(() => ukazPotvrdenie(false), ZRUSENIE_POTVRDENIA_MS)
    }
  }
  resetBtn.addEventListener('click', () => ukazPotvrdenie(true))
  tlacidlo('reset-nie')!.addEventListener('click', () => ukazPotvrdenie(false))
  tlacidlo('reset-ano')!.addEventListener('click', () => {
    ukazPotvrdenie(false)
    subory.nastavVsetky(BUGOVE_SUBORY)
    spustiTeraz()
    moznosti.resetujLevel()
    kod.otvor('nastavenia.ts')
  })

  // --- učiteľský režim ---
  tlacidlo('opravit')?.addEventListener('click', () => {
    subory.nastavVsetky(SPRAVNE_SUBORY)
    spustiTeraz()
  })
  tlacidlo('pokazit')?.addEventListener('click', () => {
    subory.nastavVsetky(BUGOVE_SUBORY)
    spustiTeraz()
  })

  return { kod }
}
