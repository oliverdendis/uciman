import { expect, test, type Page } from '@playwright/test'

const hodnota = (page: Page, kluc: string) =>
  page.evaluate((k) => (window as unknown as { uciman: { nastavenia: Record<string, number> } }).uciman.nastavenia[k], kluc)

test('zmena čísla v kóde sa hneď prejaví v hre a nič nejde mimo domény', async ({ page, baseURL }) => {
  const cudzie: string[] = []
  const chyby: string[] = []
  page.on('request', (r) => {
    const u = r.url()
    if (!u.startsWith(baseURL!) && !u.startsWith('data:') && !u.startsWith('blob:')) cudzie.push(u)
  })
  page.on('pageerror', (e) => chyby.push(e.message))

  await page.goto('/')
  const riadky = page.locator('.monaco-editor .view-lines')
  await expect(riadky).toContainText('settings.jump = 120')
  await expect.poll(() => hodnota(page, 'jump')).toBe(120)

  // študent prepíše 120 na 600
  await riadky.getByText('120', { exact: true }).dblclick()
  await page.keyboard.type('600')

  await expect(riadky).toContainText('settings.jump = 600')
  await expect.poll(() => hodnota(page, 'jump'), { timeout: 2000 }).toBe(600)
  await expect(page.locator('.stav-behu')).toContainText('Kód beží')

  expect(cudzie).toEqual([])
  expect(chyby).toEqual([])
})

test('písanie v editore nehýbe panáčikom', async ({ page }) => {
  await page.goto('/')
  await page.locator('.monaco-editor .view-lines').click()
  const x = () => page.evaluate(() => (window as any).uciman.hra.scene.getScene('hra').hrac.x as number)
  const pred = await x()
  await page.keyboard.down('ArrowRight')
  await page.waitForTimeout(400)
  await page.keyboard.up('ArrowRight')
  expect(await x()).toBe(pred)
})

test('Ctrl+Enter spustí kód aj s chybou hneď naplno (nevloží nový riadok)', async ({ page }) => {
  await page.goto('/?reset')
  const riadky = page.locator('.monaco-editor .view-lines')
  const pocetRiadkov = () =>
    page.evaluate(() => ((window as any).uciman.subory.citaj('settings.ts') as string).split('\n').length)
  const povodne = await pocetRiadkov()
  await riadky.getByText('120', { exact: true }).dblclick()
  await page.keyboard.type('12x')
  await page.keyboard.press('Control+Enter')
  await expect(page.locator('.stav-behu')).toContainText('Chyba')
  expect(await pocetRiadkov()).toBe(povodne) // Ctrl+Enter nepridal nový riadok
})

test('šípka doľava v pokazenej verzii nefunguje, po oprave áno; doprava ide vždy', async ({ page }) => {
  await page.goto('/?reset&ucitel=1')
  // hra musí bežať (nielen editor) – inak sa stlačenie pod záťažou stratí
  await page.waitForFunction(() => (window as any).uciman?.hra?.scene?.getScene('hra')?.hrac?.body?.blocked?.down)
  const x = () => page.evaluate(() => (window as any).uciman.hra.scene.getScene('hra').hrac.x as number)
  const drz = async (klaves: string) => {
    await page.locator('#hra').focus()
    await page.keyboard.down(klaves)
    await page.waitForTimeout(400)
    await page.keyboard.up(klaves)
    await page.waitForTimeout(100)
  }
  await expect(page.locator('.stav-behu')).toContainText('Kód beží')

  let pred = await x()
  await drz('ArrowRight')
  expect(await x()).toBeGreaterThan(pred + 30)

  pred = await x()
  await drz('ArrowLeft')
  expect(Math.abs((await x()) - pred)).toBeLessThan(2) // bug: doľava nejde

  await page.getByRole('button', { name: /Všetko opraviť/ }).click()
  pred = await x()
  await drz('ArrowLeft')
  expect(await x()).toBeLessThan(pred - 30)
})

test('skryté nastavenie farby prefarbí mince; neznáma farba je chyba', async ({ page }) => {
  await page.goto('/?reset')
  await expect(page.locator('.stav-behu')).toContainText('Kód beží')
  const pixelMince = () =>
    page.evaluate(() => {
      const tex = (window as any).uciman.hra.textures.get('minca')
      return Array.from(tex.getContext().getImageData(11, 13, 1, 1).data as Uint8ClampedArray).slice(0, 3)
    })
  const spusti = async (kod: string) => {
    await page.evaluate((k) => {
      const u = (window as any).uciman
      u.subory.nastav('settings.ts', u.subory.citaj('settings.ts') + k)
    }, kod)
    await page.getByRole('button', { name: /Spustiť/ }).click()
  }

  expect(await pixelMince()).toEqual([0xf7, 0xc9, 0x33]) // pôvodná zlatá
  await spusti('\nsettings.coinColor = "red"\n')
  await expect(page.locator('.stav-behu')).toContainText('Kód beží')
  await expect.poll(pixelMince).toEqual([255, 0, 0])

  await spusti('settings.coinColor = "cervena"\n')
  await expect(page.locator('.stav-behu')).toContainText('Neznáma farba „cervena“')
  expect(await pixelMince()).toEqual([255, 0, 0]) // ostala posledná platná
})

test('onJump sa zavolá pri skutočnom skoku v hre', async ({ page }) => {
  await page.goto('/?reset')
  await expect(page.locator('.stav-behu')).toContainText('Kód beží')
  await page.evaluate(() => {
    const u = (window as any).uciman
    u.subory.nastav('rules.ts', u.subory.citaj('rules.ts') + '\nonJump(() => { score = score + 100 })\n')
  })
  await page.getByRole('button', { name: /Spustiť/ }).click()
  await page.waitForTimeout(1500) // panáčik dopadne na zem
  await page.locator('#hra').focus()
  await page.keyboard.press('Space')
  await expect(page.locator('#hud-skore')).toHaveText('100')
})

test('player.lives = 0 ukončí hru a level začne odznova s 3 životmi', async ({ page }) => {
  await page.goto('/?reset')
  await expect(page.locator('.stav-behu')).toContainText('Kód beží')
  const zivoty = () => page.evaluate(() => (window as any).uciman.stavHry.zivoty as number)
  await page.evaluate(() => {
    const u = (window as any).uciman
    u.subory.nastav('cheats.ts', 'cheat("smrt", () => player.lives = 0)\n')
  })
  await page.getByRole('button', { name: /Spustiť/ }).click()
  await page.locator('#hra').focus()
  await page.keyboard.type('smrt')
  await expect.poll(zivoty).toBe(0)
  await expect.poll(zivoty, { timeout: 5000 }).toBe(3) // reštart levelu
})
