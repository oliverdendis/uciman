import { PORADIE_SUBOROV, type NazovSuboru } from '../defaults/subory'
import { popisChyby, type ChybaKodu } from '../runtime/chyby'
import { naplanujSpustenie, naStavBehu, spustiTeraz } from '../runtime/ovladac'
import { subory } from './stavSuborov'

/** Čo záložka Kód ponúka zvyšku aplikácie. */
export interface KodZalozka {
  readonly aktivny: NazovSuboru
  otvor(nazov: NazovSuboru): void
}

interface Pohlad {
  otvor(nazov: NazovSuboru): void
  ukazChyby(chyby: ChybaKodu[]): void
}

function esc(t: string): string {
  return t.replace(/[&<>"]/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[z]!)
}

export function vytvorKodZalozku(koren: HTMLElement): KodZalozka {
  koren.innerHTML = `
    <div class="subory" role="tablist">
      ${PORADIE_SUBOROV.map((n) => `<button class="subor" role="tab" data-subor="${n}">${n}</button>`).join('')}
      <span class="subory-napoveda">Ctrl+Enter = spustiť</span>
    </div>
    <div class="editor-hostitel"><div class="editor-nacitava">Načítavam editor…</div></div>
    <div class="stav-behu" aria-live="polite"></div>`

  const hostitel = koren.querySelector<HTMLElement>('.editor-hostitel')!
  const suborTlacidla = [...koren.querySelectorAll<HTMLButtonElement>('.subor')]
  let aktivny: NazovSuboru = 'nastavenia.ts'
  let pohlad: Pohlad | null = null
  let posledneChyby: ChybaKodu[] = []

  const otvor = (n: NazovSuboru) => {
    aktivny = n
    suborTlacidla.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.subor === n)))
    pohlad?.otvor(n)
  }
  suborTlacidla.forEach((t) => t.addEventListener('click', () => otvor(t.dataset.subor as NazovSuboru)))
  otvor(aktivny)

  // --- stav behu + čísla chýb pri súboroch ---
  const stavEl = koren.querySelector<HTMLElement>('.stav-behu')!
  naStavBehu((s) => {
    // jemná chyba (študent asi ešte píše): bez podčiarknutia a červenej bodky
    const viditelne = s.jemne ? [] : s.chyby
    posledneChyby = viditelne
    pohlad?.ukazChyby(viditelne)
    suborTlacidla.forEach((t) => t.classList.toggle('ma-chybu', viditelne.some((c) => c.subor === t.dataset.subor)))
    if (s.caka) {
      stavEl.className = 'stav-behu caka'
      stavEl.textContent = '… píšeš – spustím o chvíľu'
    } else if (s.jemne && s.chyby[0]) {
      stavEl.className = 'stav-behu jemne'
      stavEl.textContent = `✎ Dopisuješ? Hra zatiaľ beží so staršou verziou. (${popisChyby(s.chyby[0])})`
    } else if (s.chyby.length === 0) {
      stavEl.className = 'stav-behu ok'
      stavEl.textContent = '✓ Kód beží'
    } else {
      stavEl.className = 'stav-behu chyba'
      const hlavicka = s.ok ? '⚠ Kód beží, ale niečo zlyhalo:' : '✗ Chyba – hra beží so staršou verziou kódu:'
      stavEl.innerHTML = `<b>${hlavicka}</b><ul>${s.chyby
        .map((c) => `<li${c.subor ? ` data-skoc="${c.subor}"` : ''}>${esc(popisChyby(c))}</li>`)
        .join('')}</ul>`
    }
  })
  // klik na chybu otvorí súbor
  stavEl.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>('[data-skoc]')
    if (li) otvor(li.dataset.skoc as NazovSuboru)
  })

  const nastavPohlad = (vytvor: () => Pohlad) => {
    hostitel.innerHTML = '' // najprv odstrániť „Načítavam…“, až potom vytvoriť editor
    const p = vytvor()
    pohlad = p
    p.otvor(aktivny)
    p.ukazChyby(posledneChyby)
  }

  import('./monacoPohlad')
    .then(({ vytvorMonacoPohlad }) => nastavPohlad(() => vytvorMonacoPohlad(hostitel, () => aktivny)))
    .catch((e) => {
      console.error('[editor] Monaco sa nenačítalo, používam jednoduchý editor', e)
      nastavPohlad(() => vytvorTextovyPohlad(hostitel, () => aktivny))
    })

  return {
    get aktivny() {
      return aktivny
    },
    otvor,
  }
}

/** Záloha, keby sa Monaco nenačítalo (napr. pokazený build na USB). */
function vytvorTextovyPohlad(hostitel: HTMLElement, aktivny: () => NazovSuboru): Pohlad {
  const editor = document.createElement('textarea')
  editor.className = 'docasny-editor'
  editor.spellcheck = false
  editor.setAttribute('aria-label', 'Kód')
  hostitel.append(editor)

  editor.addEventListener('input', () => {
    subory.nastav(aktivny(), editor.value)
    naplanujSpustenie()
  })
  editor.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      spustiTeraz()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end')
      editor.dispatchEvent(new Event('input'))
    }
  })
  subory.naZmenu((n, zdroj) => {
    if (n === aktivny() && zdroj === 'program') editor.value = subory.citaj(n)
  })
  return {
    otvor: (n) => (editor.value = subory.citaj(n)),
    ukazChyby: () => {},
  }
}
