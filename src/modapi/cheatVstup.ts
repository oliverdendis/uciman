/**
 * Znaky pre cheaty berieme IBA z keydown na kontajneri hry. Keď študent píše
 * v editore, udalosť na kontajner vôbec nepríde, takže `asdf` nič nespustí.
 */
export function pripojCheatVstup(kontajner: HTMLElement, priZnaku: (znak: string) => void): () => void {
  const posluchac = (e: KeyboardEvent) => {
    if (e.target !== kontajner && !kontajner.contains(e.target as Node)) return
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
    if (e.key.length !== 1 || e.key === ' ') return
    priZnaku(e.key)
  }
  kontajner.addEventListener('keydown', posluchac)
  return () => kontajner.removeEventListener('keydown', posluchac)
}
