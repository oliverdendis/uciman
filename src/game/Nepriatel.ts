import Phaser from 'phaser'
import { jePevne } from './level'

const RYCHLOST = 60
const GRAVITACIA = 1000

/** Chrobák (doslova „bug"), chodí tam a späť a otočí sa pred stenou aj okrajom. */
export class Nepriatel extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  private smer: 1 | -1 = -1
  private cas = 0
  zniceny = false

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'chrobak-1')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setDepth(5)
    this.body.setSize(26, 22).setOffset(3, 4)
    this.body.setGravityY(GRAVITACIA)
    this.setCollideWorldBounds(true)
  }

  aktualizuj(delta: number): void {
    if (this.zniceny) return
    const b = this.body
    if (b.blocked.left) this.smer = 1
    else if (b.blocked.right) this.smer = -1
    else if (b.blocked.down) {
      // otoč sa pred okrajom priepasti
      const predo = this.smer > 0 ? b.right + 2 : b.left - 2
      if (!jePevne(predo, b.bottom + 4)) this.smer = this.smer > 0 ? -1 : 1
    }
    b.setVelocityX(this.smer * RYCHLOST)
    this.setFlipX(this.smer > 0)
    this.cas += delta
    this.setTexture(Math.floor(this.cas / 180) % 2 ? 'chrobak-2' : 'chrobak-1')
  }

  znic(): void {
    if (this.zniceny) return
    this.zniceny = true
    this.body.enable = false
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      y: this.y + 12,
      alpha: 0,
      duration: 350,
      onComplete: () => this.destroy(),
    })
  }
}
