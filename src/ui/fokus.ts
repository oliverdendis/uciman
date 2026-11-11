/**
 * Fokus hry: klávesy idú do hry len keď má fokus #hra.
 * Indikátor nad hrou ukazuje, či študent práve ovláda panáčika.
 */
export function napojFokus(kontajner: HTMLElement, priStrateFokusu: () => void): void {
  const pruh = document.getElementById('fokus-pruh')
  const text = document.getElementById('fokus-text')

  const zobraz = (maFokus: boolean) => {
    pruh?.classList.toggle('s-fokusom', maFokus)
    pruh?.classList.toggle('bez-fokusu', !maFokus)
    if (text) text.textContent = maFokus ? 'Hráš! Klávesy idú do hry (Esc = späť)' : 'Klikni do hry, aby si mohol hrať'
    const ikona = pruh?.querySelector('.fokus-ikona')
    if (ikona) ikona.textContent = maFokus ? '🎮' : '🖱️'
  }

  // Phaser by mohol klik „zjesť", preto fokus nastavíme sami.
  kontajner.addEventListener('pointerdown', () => kontajner.focus({ preventScroll: true }), { capture: true })
  kontajner.addEventListener('focus', () => zobraz(true))
  kontajner.addEventListener('blur', () => {
    zobraz(false)
    priStrateFokusu()
  })
  kontajner.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') kontajner.blur()
  })

  zobraz(document.activeElement === kontajner)
}
