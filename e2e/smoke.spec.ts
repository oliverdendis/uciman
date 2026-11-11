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
  await expect(riadky).toContainText('nastavenia.skok = 120')
  await expect.poll(() => hodnota(page, 'skok')).toBe(120)

  // študent prepíše 120 na 600
  await riadky.getByText('120', { exact: true }).dblclick()
  await page.keyboard.type('600')

  await expect(riadky).toContainText('nastavenia.skok = 600')
  await expect.poll(() => hodnota(page, 'skok'), { timeout: 2000 }).toBe(600)
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
  await riadky.getByText('120', { exact: true }).dblclick()
  await page.keyboard.type('12x')
  await page.keyboard.press('Control+Enter')
  await expect(page.locator('.stav-behu')).toContainText('Chyba')
  const kod = await page.evaluate(() => (window as any).uciman.subory.citaj('nastavenia.ts') as string)
  expect(kod.split('\n')).toHaveLength(5) // 4 riadky + koncový – Ctrl+Enter nepridal nový riadok
})
