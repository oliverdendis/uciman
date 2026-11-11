import { PORADIE_SUBOROV, type NazovSuboru } from '../defaults/subory'
import type { ChybaKodu } from '../runtime/chyby'
import { naplanujSpustenie, spustiTeraz } from '../runtime/ovladac'
import { rozdiel } from './rozdiel'
import { pripravMonaco } from './monaco'
import { subory } from './stavSuborov'

const VLASTNIK_ZNACIEK = 'uciman'

export function vytvorMonacoPohlad(hostitel: HTMLElement, aktivny: () => NazovSuboru) {
  const monaco = pripravMonaco()

  const modely = new Map<NazovSuboru, ReturnType<typeof monaco.editor.createModel>>()
  for (const n of PORADIE_SUBOROV) {
    const uri = monaco.Uri.parse(`file:///${n}`)
    const model = monaco.editor.getModel(uri) ?? monaco.editor.createModel(subory.citaj(n), 'typescript', uri)
    modely.set(n, model)
  }
  const stavyPohladu = new Map<NazovSuboru, ReturnType<typeof editor.saveViewState>>()

  const editor = monaco.editor.create(hostitel, {
    model: modely.get(aktivny()),
    theme: 'uciman',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "ui-monospace, 'Cascadia Code', Consolas, 'DejaVu Sans Mono', monospace",
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    tabSize: 2,
    insertSpaces: true,
    fixedOverflowWidgets: true,
    lineNumbersMinChars: 3,
    padding: { top: 10, bottom: 10 },
    wordBasedSuggestions: 'off',
    renderLineHighlight: 'line',
    stickyScroll: { enabled: false },
    wordWrap: 'on', // dlhé komentáre sa zalomia namiesto vodorovného scrollovania
    'semanticHighlighting.enabled': false,
  })

  // --- zmena v editore → stav súborov → automatické spustenie ---
  let aplikujemZvonku = false
  for (const [n, model] of modely) {
    model.onDidChangeContent(() => {
      if (aplikujemZvonku) return
      subory.nastav(n, model.getValue())
      naplanujSpustenie()
    })
  }

  // --- zmena zvonku (slider, reset) → model, s minimálnou úpravou kvôli undo a kurzoru ---
  subory.naZmenu((n, zdroj) => {
    if (zdroj !== 'program') return
    const model = modely.get(n)
    const novy = subory.citaj(n)
    if (!model || model.getValue() === novy) return
    const r = rozdiel(model.getValue(), novy)
    const zaciatok = model.getPositionAt(r.od)
    const koniec = model.getPositionAt(r.doStareho)
    aplikujemZvonku = true
    try {
      model.pushEditOperations(
        [],
        [{ range: new monaco.Range(zaciatok.lineNumber, zaciatok.column, koniec.lineNumber, koniec.column), text: r.text }],
        () => null,
      )
    } finally {
      aplikujemZvonku = false
    }
  })

  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => spustiTeraz())

  // Popis (slovenský JSDoc) v ponuke návrhov rovno rozbalený – inak je skrytý za „>“.
  // Interné API Monaca, preto v try/catch: keby sa v novej verzii zmenilo, nič sa nepokazí.
  try {
    const ovladac = editor.getContribution('editor.contrib.suggestController') as unknown as {
      widget: { value: { _setDetailsVisible(v: boolean): void } }
    }
    ovladac.widget.value._setDetailsVisible(true)
  } catch (e) {
    console.warn('[editor] nepodarilo sa rozbaliť popis návrhov', e)
  }


  return {
    otvor(n: NazovSuboru) {
      const model = modely.get(n)
      const sucasny = editor.getModel()
      if (!model || model === sucasny) return
      const predosly = PORADIE_SUBOROV.find((x) => modely.get(x) === sucasny)
      if (predosly) stavyPohladu.set(predosly, editor.saveViewState())
      editor.setModel(model)
      const stav = stavyPohladu.get(n)
      if (stav) editor.restoreViewState(stav)
    },

    ukazChyby(chyby: ChybaKodu[]) {
      for (const [n, model] of modely) {
        const znacky = chyby
          .filter((c) => c.subor === n && c.riadok)
          .map((c) => {
            const riadok = Math.min(c.riadok!, model.getLineCount())
            return {
              severity: c.druh === 'hacik' ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
              message: c.sprava,
              startLineNumber: riadok,
              startColumn: model.getLineFirstNonWhitespaceColumn(riadok) || 1,
              endLineNumber: riadok,
              endColumn: model.getLineMaxColumn(riadok),
            }
          })
        monaco.editor.setModelMarkers(model, VLASTNIK_ZNACIEK, znacky)
      }
    },
  }
}
