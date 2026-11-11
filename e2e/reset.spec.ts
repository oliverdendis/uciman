import { expect, test, type Page } from '@playwright/test'

const nastavenie = (page: Page, kluc: string) =>
  page.evaluate((k) => (window as any).uciman.nastavenia[k] as number, kluc)
const riadky = (page: Page) => page.locator('.monaco-editor .view-lines')

async function prepis120na600(page: Page) {
  await riadky(page).getByText('120', { exact: true }).dblclick()
  await page.keyboard.type('600')
  await expect.poll(() => nastavenie(page, 'skok')).toBe(600)
}

test('kód prežije obnovenie stránky, ?reset ho zmaže', async ({ page }) => {
  await page.goto('/')
  await prepis120na600(page)

  await page.reload()
  await expect(riadky(page)).toContainText('nastavenia.skok = 600')
  await expect.poll(() => nastavenie(page, 'skok')).toBe(600)

  await page.goto('/?reset')
  await expect(riadky(page)).toContainText('nastavenia.skok = 120')
  await expect.poll(() => nastavenie(page, 'skok')).toBe(120)
  expect(new URL(page.url()).search).toBe('') // ?reset sa z adresy odstráni
})

test('Reset s potvrdením vráti kód aj level', async ({ page }) => {
  await page.goto('/')
  await prepis120na600(page)
  await page.evaluate(() => ((window as any).uciman.stavHry.skore = 7))

  await page.getByRole('button', { name: '↺ Reset' }).click()
  await page.getByRole('button', { name: 'Nie' }).click()
  await expect(riadky(page)).toContainText('nastavenia.skok = 600') // nič sa nestalo

  await page.getByRole('button', { name: '↺ Reset' }).click()
  await page.getByRole('button', { name: 'Áno, resetovať' }).click()
  await expect(riadky(page)).toContainText('nastavenia.skok = 120')
  await expect.poll(() => nastavenie(page, 'skok')).toBe(120)
  await expect(page.locator('#hud-skore')).toHaveText('0')
})

test('učiteľský režim: všetko opraviť / pokaziť', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: /Všetko opraviť/ })).toHaveCount(0)

  await page.goto('/?ucitel=1')
  await page.getByRole('button', { name: /Všetko opraviť/ }).click()
  await expect.poll(() => nastavenie(page, 'gravitacia')).toBe(1000)
  await expect(riadky(page)).toContainText('nastavenia.gravitacia = 1000')

  await page.getByRole('button', { name: /Všetko pokaziť/ }).click()
  await expect.poll(() => nastavenie(page, 'gravitacia')).toBe(-800)
})
