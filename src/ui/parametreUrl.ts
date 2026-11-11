/** Parametre v adrese: `?ucitel=1` (učiteľský režim), `?reset` (zmaže uložený kód). */
function parametre(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

export function jeUcitel(): boolean {
  const v = parametre().get('ucitel')
  return v !== null && v !== '0' && v !== 'false'
}

export function chceReset(): boolean {
  return parametre().has('reset')
}

/** Odstráni `?reset` z adresy, aby ďalšie obnovenie stránky kód znovu nezmazalo. */
export function odstranResetZAdresy(): void {
  const url = new URL(window.location.href)
  url.searchParams.delete('reset')
  window.history.replaceState(null, '', url)
}
