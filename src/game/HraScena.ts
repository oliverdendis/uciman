import Phaser from 'phaser'
import { Hrac, type Ovladanie } from './Hrac'
import { Nepriatel } from './Nepriatel'
import { level, SIRKA, T, VYSKA, ZEM_Y } from './level'
import { nastavSkore, nastavZivoty, resetujLevelovyStav, stavHry } from './stav'
import { vytvorTextury } from './textury'
import { napojHraca } from '../modapi/most'
import { runtime } from '../runtime/runtime'
import { udalosti } from './udalosti'

type Klavesy = Record<'vlavo' | 'vpravo' | 'hore' | 'a' | 'd' | 'w' | 'medzera', Phaser.Input.Keyboard.Key>

export const KLUC_SCENY = 'hra'
const KLAVESY_SKOKU = new Set(['ArrowUp', 'KeyW', 'Space'])
/** háčik priDotykuNepriatela sa pre jedného nepriateľa volá najviac raz za túto dobu */
const PAUZA_DOTYKU_MS = 400

export class HraScena extends Phaser.Scene {
  private hrac!: Hrac
  private nepriatelia: Nepriatel[] = []
  private klavesy!: Klavesy
  private kopceDaleko!: Phaser.GameObjects.TileSprite
  private kopceBlizko!: Phaser.GameObjects.TileSprite
  private respawnBod = { x: 0, y: 0 }
  private koniecHry = false
  private dosiahnutyCiel = false
  private cakajuciSkok = false
  private poslednyDotyk = new WeakMap<Nepriatel, number>()
  private bublina: Phaser.GameObjects.Text | null = null

  constructor() {
    super(KLUC_SCENY)
  }

  create(): void {
    vytvorTextury(this)
    this.koniecHry = false
    this.dosiahnutyCiel = false
    this.nepriatelia = []

    this.physics.world.setBounds(0, 0, SIRKA, VYSKA)
    // strop a boky sú pevné, spodok nie – inak by sa nedalo spadnúť do priepasti
    this.physics.world.setBoundsCollision(true, true, true, false)

    this.vytvorPozadie()
    const pevne = this.vytvorBloky()

    // --- hráč ---
    const [sc, sr] = level.start
    this.respawnBod = { x: sc * T + T / 2, y: sr * T }
    this.hrac = new Hrac(this, this.respawnBod.x, this.respawnBod.y)
    this.physics.add.collider(this.hrac, pevne)
    const hrac = this.hrac
    napojHraca({
      get x() {
        return hrac.x
      },
      get y() {
        return hrac.y
      },
      skoc: () => hrac.skoc(),
    })

    // --- nepriatelia ---
    for (const [c, r] of level.nepriatelia) {
      const n = new Nepriatel(this, c * T + T / 2, r * T + T / 2)
      this.nepriatelia.push(n)
    }
    this.physics.add.collider(this.nepriatelia, pevne)
    this.physics.add.overlap(this.hrac, this.nepriatelia, (_h, n) => this.dotykNepriatela(n as Nepriatel))

    this.vytvorMince()
    this.vytvorCheckpointy()
    this.vytvorCiel()

    // --- kamera ---
    const cam = this.cameras.main
    cam.setBounds(0, 0, SIRKA, VYSKA)
    cam.startFollow(this.hrac, true, 0.12, 0.12)
    cam.setDeadzone(120, 80)

    // --- klávesy (počúvajú len na elemente #hra, viď main.ts) ---
    const kb = this.input.keyboard
    if (!kb) throw new Error('Klávesnica nie je dostupná')
    this.klavesy = kb.addKeys({
      vlavo: 'LEFT',
      vpravo: 'RIGHT',
      hore: 'UP',
      a: 'A',
      d: 'D',
      w: 'W',
      medzera: 'SPACE',
    }) as Klavesy
    // Skok chytáme priamo z keydown: JustDown by stratil rýchle ťuknutie
    // (stlačenie aj pustenie v jednom frame – časté na pomalších PC).
    this.cakajuciSkok = false
    kb.on('keydown', (e: KeyboardEvent) => {
      if (!e.repeat && KLAVESY_SKOKU.has(e.code)) this.cakajuciSkok = true
    })

    nastavSkore(stavHry.skore)
    nastavZivoty(stavHry.zivoty)

    const odhlasenia = [
      udalosti.on('cheat', () => this.efektCheatu()),
      udalosti.on('vypis', (text) => this.ukazBublinu(text)),
    ]
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      odhlasenia.forEach((f) => f())
      napojHraca(null)
    })
  }

  /** Volá sa pri strate fokusu – inak by klávesy „zamrzli" stlačené. */
  uvolniKlavesy(): void {
    this.input.keyboard?.resetKeys()
  }

  update(cas: number, delta: number): void {
    if (this.koniecHry) return
    const k = this.klavesy
    const ovl: Ovladanie = {
      vlavo: k.vlavo.isDown || k.a.isDown,
      vpravo: k.vpravo.isDown || k.d.isDown,
      skokStlaceny: this.cakajuciSkok,
      skokDrzany: k.hore.isDown || k.w.isDown || k.medzera.isDown,
    }
    this.cakajuciSkok = false
    this.hrac.aktualizuj(ovl, cas)
    for (const n of this.nepriatelia) if (n.active) n.aktualizuj(delta)
    this.bublina?.setPosition(this.hrac.x, this.hrac.y - this.hrac.displayHeight / 2 - 14)

    this.kontrolujPoziciu()

    // parallax pozadia
    const sx = this.cameras.main.scrollX
    this.kopceDaleko.tilePositionX = sx * 0.2
    this.kopceBlizko.tilePositionX = sx * 0.45
  }

  // ------------------------------------------------------------------ level

  private vytvorPozadie(): void {
    this.cameras.main.setBackgroundColor('#8fd3ff')
    const { width, height } = this.scale
    for (let i = 0; i < 14; i++) {
      const x = (i * 337) % (SIRKA * 0.6) + 40
      const y = 40 + ((i * 89) % 150)
      this.add.image(x, y, 'oblak').setScrollFactor(0.4).setAlpha(0.9).setScale(0.7 + ((i * 7) % 5) / 10)
    }
    this.kopceDaleko = this.add.tileSprite(0, height - 220, width, 220, 'kopce-daleko').setOrigin(0).setScrollFactor(0)
    this.kopceBlizko = this.add.tileSprite(0, height - 200, width, 220, 'kopce-blizko').setOrigin(0).setScrollFactor(0)
    const priZmene = (velkost: Phaser.Structs.Size) => {
      this.kopceDaleko.width = velkost.width
      this.kopceBlizko.width = velkost.width
    }
    this.scale.on(Phaser.Scale.Events.RESIZE, priZmene)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off(Phaser.Scale.Events.RESIZE, priZmene))
  }

  private vytvorBloky(): Phaser.GameObjects.Zone[] {
    const zony: Phaser.GameObjects.Zone[] = []
    for (const b of level.bloky) {
      const x = b.c * T
      const y = b.r * T
      const w = b.w * T
      const h = b.h * T
      if (b.typ === 'zem') {
        this.add.tileSprite(x, y, w, T, 'dlazdica-trava').setOrigin(0)
        this.add.tileSprite(x, y + T, w, h - T, 'dlazdica-hlina').setOrigin(0)
      } else {
        this.add.tileSprite(x, y, w, h, 'dlazdica-tehla').setOrigin(0)
      }
      // jedno fyzikálne teleso na celý blok (žiadne zasekávanie na švoch dlaždíc)
      const zona = this.add.zone(x + w / 2, y + h / 2, w, h)
      this.physics.add.existing(zona, true)
      zony.push(zona)
    }
    return zony
  }

  private vytvorMince(): void {
    for (const [c, r] of level.mince) {
      const m = this.physics.add.staticImage(c * T + T / 2, r * T + T / 2, 'minca')
      this.tweens.add({ targets: m, scaleX: 0.25, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: c * 37 })
      this.physics.add.overlap(this.hrac, m, () => this.zberMince(m))
    }
  }

  private vytvorCheckpointy(): void {
    for (const [c, r] of level.checkpointy) {
      const x = c * T + T / 2
      const vlajka = this.add.image(x, (r + 1) * T, 'checkpoint').setOrigin(0.5, 1)
      const zona = this.add.zone(x, r * T, T, T * 2)
      this.physics.add.existing(zona, true)
      const prekryv = this.physics.add.overlap(this.hrac, zona, () => {
        this.respawnBod = { x, y: r * T }
        vlajka.setTexture('checkpoint-aktivny')
        this.hlaska('Checkpoint ✓', '#ffb347')
        this.physics.world.removeCollider(prekryv)
      })
    }
  }

  private vytvorCiel(): void {
    const [c] = level.ciel
    const x = c * T + T / 2
    this.add.image(x, ZEM_Y, 'ciel').setOrigin(0.15, 1)
    const zona = this.add.zone(x, ZEM_Y - 96, 24, 192)
    this.physics.add.existing(zona, true)
    this.physics.add.overlap(this.hrac, zona, () => {
      if (this.dosiahnutyCiel) return
      this.dosiahnutyCiel = true
      udalosti.emit('ciel')
      this.hlaska(`CIEĽ!  Skóre: ${stavHry.skore}`, '#4fd18b', 3000)
      // ďalšie kolo od začiatku – opravenú hru si môže zahrať znova
      this.time.delayedCall(3600, () => {
        resetujLevelovyStav()
        this.scene.restart()
      })
    })
  }

  // ------------------------------------------------------------------ pravidlá
  // Body a ničenie nepriateľov rieši študentský kód (háčiky). Jadro hry
  // rieši len fyziku: odraz pri skoku zhora a zranenie pri náraze z boku.

  private zberMince(m: Phaser.Physics.Arcade.Image): void {
    if (!m.active) return
    m.disableBody(true, false)
    this.tweens.add({ targets: m, y: m.y - 30, alpha: 0, duration: 250, onComplete: () => m.destroy() })
    const pred = stavHry.skore
    runtime.zberMince()
    udalosti.emit('minca', { pred, po: stavHry.skore })
  }

  private dotykNepriatela(n: Nepriatel): void {
    if (n.zniceny || this.koniecHry) return
    const hb = this.hrac.body
    const smerG = this.hrac.smerGravitacie
    const zhora =
      smerG > 0
        ? hb.velocity.y > 0 && hb.bottom <= n.body.top + 14
        : hb.velocity.y < 0 && hb.top >= n.body.bottom - 14

    const teraz = this.time.now
    if (teraz - (this.poslednyDotyk.get(n) ?? -Infinity) > PAUZA_DOTYKU_MS) {
      this.poslednyDotyk.set(n, teraz)
      runtime.dotykNepriatela(zhora, {
        znic: () => {
          if (n.zniceny) return
          n.znic()
          udalosti.emit('nepriatelZniceny', { zhora })
        },
      })
    }
    if (n.zniceny && !zhora) return

    if (zhora) {
      this.hrac.odrazOdNepriatela()
    } else if (this.hrac.jeZranitelny) {
      this.hrac.body.setVelocity(hb.center.x < n.body.center.x ? -250 : 250, -smerG * 300)
      this.hrac.docasneNesmrtelny(1500)
      this.stratZivot('nepriatel')
    }
  }

  private kontrolujPoziciu(): void {
    const hb = this.hrac.body
    // pád do priepasti
    if (hb.top > VYSKA + 60) {
      this.stratZivot('priepast')
      if (!this.koniecHry) this.hrac.respawn(this.respawnBod.x, this.respawnBod.y)
      return
    }
  }

  private stratZivot(dovod: 'nepriatel' | 'priepast'): void {
    udalosti.emit('smrt', { dovod })
    if (stavHry.nesmrtelny) return
    nastavZivoty(stavHry.zivoty - 1)
    this.cameras.main.shake(180, 0.006)
    if (stavHry.zivoty > 0) return

    this.koniecHry = true
    this.physics.pause()
    this.hlaska('KONIEC HRY – skúšame znova…', '#ff7a59', 1800)
    this.time.delayedCall(1900, () => {
      resetujLevelovyStav()
      this.scene.restart()
    })
  }

  // ------------------------------------------------------------------ efekty

  private efektCheatu(): void {
    this.cameras.main.flash(250, 255, 240, 120)
    this.hlaska('CHEAT AKTIVOVANÝ', '#ffe14d', 1200)
  }

  private ukazBublinu(text: string): void {
    this.bublina?.destroy()
    const b = this.add
      .text(this.hrac.x, this.hrac.y - 40, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#1d1b2e',
        backgroundColor: '#ffffff',
        padding: { x: 8, y: 5 },
        wordWrap: { width: 260 },
        align: 'center',
      })
      .setOrigin(0.5, 1)
      .setDepth(90)
    this.bublina = b
    this.time.delayedCall(2600, () => {
      if (this.bublina === b) this.bublina = null
      this.tweens.add({ targets: b, alpha: 0, duration: 250, onComplete: () => b.destroy() })
    })
  }

  hlaska(text: string, farba = '#ffffff', trvanie = 1400): void {
    const t = this.add
      .text(this.scale.width / 2, 70, text, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        color: farba,
        stroke: '#1d1b2e',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
    this.tweens.add({ targets: t, y: 55, alpha: 0, delay: trvanie, duration: 400, onComplete: () => t.destroy() })
  }
}
