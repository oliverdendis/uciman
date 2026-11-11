import './style.css'
import { prisposobVelkost, scenaHry, spustiHru } from './game'
import { nastavenia, pridajPredmet, resetujLevelovyStav, stavHry } from './game/stav'
import { udalosti } from './game/udalosti'
import { pripojCheatVstup } from './modapi/cheatVstup'
import { vytvorPanel } from './panel/panel'
import { spustiTeraz } from './runtime/ovladac'
import { runtime } from './runtime/runtime'
import { subory } from './editor/stavSuborov'
import { nacitajKod, zmazKod } from './editor/ulozisko'
import { chceReset, jeUcitel, odstranResetZAdresy } from './ui/parametreUrl'
import { napojFokus } from './ui/fokus'
import { napojHud } from './ui/hud'

const kontajner = document.getElementById('hra')!
const panel = document.getElementById('panel')!

// `?reset` = poistka (napr. kód so zaseknutým prehliadačom): zmaž uložený kód
if (chceReset()) {
  zmazKod()
  odstranResetZAdresy()
} else {
  const ulozeny = nacitajKod()
  if (ulozeny) subory.nastavVsetky(ulozeny)
}

napojHud()
const hra = spustiHru(kontajner)
vytvorPanel(panel, {
  ucitel: jeUcitel(),
  resetujLevel: () => {
    resetujLevelovyStav()
    scenaHry(hra)?.scene.restart()
  },
})
prisposobVelkost(hra, kontajner)
napojFokus(kontajner, () => scenaHry(hra)?.uvolniKlavesy())
pripojCheatVstup(kontajner, (znak) => runtime.zadajZnak(znak))

// študentský kód (uložený alebo pôvodný pokazený) beží hneď od štartu
spustiTeraz()

// Pomôcka pre vývoj, Playwright testy a zvedavcov v konzole: `uciman.nastavenia.skok = 600`
Object.assign(window, {
  uciman: { hra, nastavenia, stavHry, udalosti, runtime, subory, dajDazdnik: () => pridajPredmet('dazdnik') },
})
