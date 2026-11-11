/**
 * Monaco – zabalené v builde (žiadne CDN). Načítavame len jadro, TypeScript
 * a funkcie, ktoré študenti potrebujú, nie všetkých ~80 jazykov.
 */
import * as monaco from 'monaco-editor/editor/editor.api'
import '@monaco-esm/base/browser/ui/codicons/codicon/codicon.css'
import '@monaco-esm/base/browser/ui/codicons/codicon/codicon-modifiers.css'
import 'monaco-editor/editor/browser/coreCommands'
import 'monaco-editor/editor/browser/widget/codeEditor/codeEditorWidget'
import 'monaco-editor/editor/common/standaloneStrings'
import 'monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching'
import 'monaco-editor/editor/contrib/clipboard/browser/clipboard'
import 'monaco-editor/editor/contrib/comment/browser/comment'
import 'monaco-editor/editor/contrib/contextmenu/browser/contextmenu'
import 'monaco-editor/editor/contrib/cursorUndo/browser/cursorUndo'
import 'monaco-editor/editor/contrib/find/browser/findController'
import 'monaco-editor/editor/contrib/folding/browser/folding'
import 'monaco-editor/editor/contrib/gotoError/browser/gotoError'
import 'monaco-editor/editor/contrib/hover/browser/hoverContribution'
import 'monaco-editor/editor/contrib/linesOperations/browser/linesOperations'
import 'monaco-editor/editor/contrib/parameterHints/browser/parameterHints'
import 'monaco-editor/editor/contrib/snippet/browser/snippetController2'
import 'monaco-editor/editor/contrib/suggest/browser/suggestController'
import 'monaco-editor/editor/contrib/wordHighlighter/browser/wordHighlighter'
import 'monaco-editor/editor/contrib/wordOperations/browser/wordOperations'
import 'monaco-editor/languages/definitions/typescript/register'
import { typescriptDefaults, ScriptTarget } from 'monaco-editor/languages/features/typescript/register'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker'
import studentApi from '../modapi/student-api.d.ts?raw'

declare global {
  interface Window {
    MonacoEnvironment?: { getWorker(id: string, label: string): Worker }
  }
}

let nastavene = false

export function pripravMonaco(): typeof monaco {
  if (nastavene) return monaco
  nastavene = true

  // workery sú lokálne súbory z buildu (Vite ?worker), nie z CDN
  window.MonacoEnvironment = {
    getWorker: (_id, label) => (label === 'typescript' || label === 'javascript' ? new TsWorker() : new EditorWorker()),
  }

  typescriptDefaults.setCompilerOptions({
    target: ScriptTarget.ES2020,
    lib: ['es2020'], // bez DOM: autocomplete ponúka len naše API, nie window/document
    allowNonTsExtensions: true,
    noEmit: true,
    strict: false,
    noImplicitAny: false,
  })
  typescriptDefaults.setDiagnosticsOptions({ noSemanticValidation: false, noSyntaxValidation: false })
  typescriptDefaults.setEagerModelSync(true) // tri súbory zdieľajú globálny scope ako pri behu
  typescriptDefaults.addExtraLib(studentApi, 'file:///uciman-api.d.ts')

  monaco.editor.defineTheme('uciman', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: { 'editor.background': '#1b1d36', 'editorLineNumber.foreground': '#5b6196' },
  })
  return monaco
}

export { monaco }
