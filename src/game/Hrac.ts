import Phaser from 'phaser'
import { citaj, stavHry } from './stav'
import { udalosti } from './udalosti'

export interface Ovladanie {
  vlavo: boolean
  vpravo: boolean
  /** skok práve stlačený v tomto frame */
  skokStlaceny: boolean
  /** skok držaný */
  skokDrzany: boolean
}

const COYOTE_MS = 90
const SKOK_BUFFER_MS = 120
const MAX_RYCHLOST_PADU = 1400
const DAZDNIK_GRAVITACIA = 0.15
const DAZDNIK_MAX_PAD = 90

export class Hrac extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body

  private poslednaZem = -Infinity
  private poslednyPokusOSkok = -Infinity
  private bolNaZemi = false
  private nesmrtelnyDo = 0
  private plachtil = false
  private animKrok = 0
  readonly dazdnik: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hrac-stoj')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(10)
    this.body.setSize(20, 36).setOffset(6, 4)
    this.body.setMaxVelocity(2000, MAX_RYCHLOST_PADU)
    this.setCollideWorldBounds(true)
    this.dazdnik = scene.add.image(x, y, 'dazdnik').setDepth(11).setVisible(false)
  }

  /** smer gravitácie: 1 = dole, -1 = hore */
  get smerGravitacie(): 1 | -1 {
    return citaj('gravitacia') >= 0 ? 1 : -1
  }

  get naZemi(): boolean {
    return this.smerGravitacie > 0 ? this.body.blocked.down : this.body.blocked.up
  }

  get jeZranitelny(): boolean {
    return !stavHry.nesmrtelny && this.scene.time.now >= this.nesmrtelnyDo
  }

  /** krátka nesmrteľnosť po zásahu (blikanie) */
  docasneNesmrtelny(ms: number): void {
    this.nesmrtelnyDo = this.scene.time.now + ms
  }

  skoc(): void {
    const sila = citaj('skok')
    this.body.setVelocityY(-this.smerGravitacie * sila)
    this.poslednaZem = -Infinity
    this.poslednyPokusOSkok = -Infinity
  }

  odrazOdNepriatela(): void {
    this.body.setVelocityY(-this.smerGravitacie * Math.max(350, citaj('skok') * 0.6))
  }

  respawn(x: number, y: number): void {
    this.body.reset(x, y)
    this.body.setVelocity(0, 0)
    this.docasneNesmrtelny(1200)
  }

  aktualizuj(ovl: Ovladanie, cas: number): void {
    const g = citaj('gravitacia')
    const smerG = this.smerGravitacie
    const rychlost = citaj('rychlost')
    const velkost = citaj('velkost')

    // --- veľkosť (Arcade body sa škáluje automaticky) ---
    if (this.scaleX !== velkost) this.setScale(velkost)

    // --- horizontálny pohyb ---
    const smer = (ovl.vpravo ? 1 : 0) - (ovl.vlavo ? 1 : 0)
    this.body.setVelocityX(smer * rychlost)
    if (smer !== 0) this.setFlipX(smer < 0)

    // --- zem, coyote time a buffer skoku ---
    const naZemi = this.naZemi
    if (naZemi) this.poslednaZem = cas
    if (naZemi && !this.bolNaZemi && smerG > 0) udalosti.emit('pristal', { gravitacia: g })
    this.bolNaZemi = naZemi

    if (ovl.skokStlaceny) this.poslednyPokusOSkok = cas
    if (cas - this.poslednyPokusOSkok < SKOK_BUFFER_MS && cas - this.poslednaZem < COYOTE_MS) this.skoc()

    // --- gravitácia + dáždnik ---
    const padame = this.body.velocity.y * smerG > 0
    const plachti = stavHry.predmety.has('dazdnik') && !naZemi && ovl.skokDrzany && padame
    if (plachti) {
      this.body.setGravityY(g * DAZDNIK_GRAVITACIA)
      if (Math.abs(this.body.velocity.y) > DAZDNIK_MAX_PAD) this.body.setVelocityY(smerG * DAZDNIK_MAX_PAD)
      if (!this.plachtil) udalosti.emit('plachti')
    } else {
      this.body.setGravityY(g)
    }
    this.plachtil = plachti

    // --- vzhľad ---
    this.setFlipY(smerG < 0) // pri zápornej gravitácii „stojí" hlavou dole
    if (!naZemi) {
      this.setTexture('hrac-krok')
    } else if (smer !== 0 && rychlost > 0) {
      this.animKrok += this.scene.game.loop.delta * Math.min(3, 0.4 + rychlost / 200)
      this.setTexture(Math.floor(this.animKrok / 120) % 2 ? 'hrac-krok' : 'hrac-stoj')
    } else {
      this.setTexture('hrac-stoj')
    }
    const blika = cas < this.nesmrtelnyDo
    this.setAlpha(blika ? (Math.floor(cas / 80) % 2 ? 0.35 : 1) : stavHry.nesmrtelny ? 0.85 : 1)
    if (stavHry.nesmrtelny) this.setTint(0xfff27a)
    else this.clearTint()

    this.dazdnik
      .setVisible(plachti)
      .setScale(velkost)
      .setFlipY(smerG < 0)
      .setPosition(this.x, this.y - smerG * this.displayHeight * 0.75)
  }
}
