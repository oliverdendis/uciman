/** Najmenšia zmena medzi dvoma textami (aby slider neposúval kurzor a nerušil undo). */
export function rozdiel(stary: string, novy: string): { od: number; doStareho: number; text: string } {
  let od = 0
  while (od < stary.length && od < novy.length && stary[od] === novy[od]) od++
  let ks = stary.length
  let kn = novy.length
  while (ks > od && kn > od && stary[ks - 1] === novy[kn - 1]) {
    ks--
    kn--
  }
  return { od, doStareho: ks, text: novy.slice(od, kn) }
}
