import Phaser from 'phaser'
import { HraScena, KLUC_SCENY } from './HraScena'

export const SIRKA_PLATNA = 960
export const VYSKA_PLATNA = 544

export function spustiHru(kontajner: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: kontajner,
    width: SIRKA_PLATNA,
    height: VYSKA_PLATNA,
    pixelArt: true,
    backgroundColor: '#8fd3ff',
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      // Klávesy počúvame IBA na kontajneri hry: keď má fokus editor,
      // šípky/medzerník nehýbu panáčikom a písanie nespustí cheat.
      keyboard: { target: kontajner },
      mouse: { preventDefaultDown: false },
    },
    disableContextMenu: true,
    banner: false,
    audio: { noAudio: true }, // zvuky pridáme v míľniku 6
    scene: [HraScena],
  })
}

/**
 * Výška hry je pevná (celý level na výšku), šírka sa prispôsobí pomeru strán
 * kontajnera. Minimum 800 px (25 dlaždíc), aby bol vidieť dostatočný kus levelu.
 */
export function prisposobVelkost(hra: Phaser.Game, kontajner: HTMLElement): void {
  const uprav = () => {
    const { width, height } = kontajner.getBoundingClientRect()
    if (width < 10 || height < 10) return
    const sirka = Math.round(Math.min(1500, Math.max(800, (VYSKA_PLATNA * width) / height)))
    if (sirka !== hra.scale.gameSize.width) hra.scale.setGameSize(sirka, VYSKA_PLATNA)
  }
  new ResizeObserver(uprav).observe(kontajner)
  uprav()
}

export function scenaHry(hra: Phaser.Game): HraScena | undefined {
  return hra.scene.getScene(KLUC_SCENY) as HraScena | undefined
}
