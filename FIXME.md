# Čo treba fixnúť / rozhodnúť

Priebežný zoznam. Formát: `[ ]` otvorené, `[x]` vyriešené. Za pomlčkou je, kde sa to zistilo.

## Zmeny oproti pôvodnému zadaniu
- **Záložka Parametre (slidery) zrušená** (dohoda 2026-11-11): hodnoty sa menia len v kóde,
  aby sa študenti učili programovať. Náhrada: zmena iba čísla sa spustí po 250 ms (inak 800 ms),
  Playwright smoke test mení číslo priamo v editore. — M4
- **Len 4 bugy** (dohoda 2026-11-11, demo pre budúcich študentov, má motivovať): gravitácia,
  skok, mince, nepriatelia. Bug rýchlosti (`rychlost = 20`) zrušený → misia „Zrýchli panáčika“
  odpadá. — M5
- **Misie, toasty, konfety a zvuky zrušené – celý míľnik 6** (dohoda 2026-11-11): „takto
  programovanie nefunguje“; odmenou je, že sa hra opraví a dá sa dohrať. Panel = len kód
  s vetou „Hra je pokazená – oprav ju v kóde“. Cieľ = „CIEĽ! Skóre: N“ a nové kolo od začiatku.
  Učiteľský „Ukáž riešenie“ pri misiách tým tiež odpadá. — M6

- **Bugy prerobené** (dohoda 2026-11-18): gravitácia `-800` („padá hore“) bola príliš očividná
  a čudná → nahradená nenápadnou slabou gravitáciou `300` (panáčik pláva; po oprave skoku
  vyletí ku stropu a ~3 s padá). Nový bug: **ovládanie je v študentskom kóde**
  (`controls.ts`, `whileKeyHeld` / `onKeyPress` / `player.walk`) a šípka doľava chýba – študent ju
  doprogramuje podľa šípky doprava (`player.walk(-settings.speed)`). Spolu 5 bugov.
  `player.jump()` už neskáče vo vzduchu (iba zo zeme). A/D/W ovládanie zrušené – sú len klávesy
  v `controls.ts`. Kľúč úložiska → `uciman:kod:v2`.
- **Študentské API a súbory sú anglicky** (dohoda 2026-11-18, slovenské názvy pôsobili „cringe“):
  `settings.jump/gravity/speed/size`, `player.walk/jump/invincible/giveItem("umbrella")/addLife`,
  `score`, `onCoinCollect`, `onEnemyTouch((fromAbove, enemy) => enemy.destroy())`, `onKeyPress`,
  `whileKeyHeld`, `print`, `cheat`; súbory `settings.ts`, `controls.ts`, `rules.ts`, `cheats.ts`.
  Komentáre, nápovedy (JSDoc) a chybové hlášky ostávajú po slovensky. Vnútorný kód hry ostáva
  po slovensky (študent ho nevidí).

- **Skryté nastavenia** (dohoda 2026-11-19): `settings.coinColor`, `settings.playerColor`
  (tričko) a `settings.size` nie sú v predvolenom `settings.ts` – študent ich objaví cez
  napovedanie po napísaní `settings.`. Farba = CSS názov alebo #kód; neznáma farba je chyba
  s riadkom. Textúry sa prekresľujú v palete (`aktualizujFarby` v `textury.ts`).

- **Stručné komentáre a `score = score - 1`** (dohoda 2026-11-19): komentáre bez jednotiek a
  nápovedí („// výška skoku“, „// Nastavenia hry“); skóre zapisujeme celé, `+=` nemusia poznať.
  Skrytý listener `onJump` (nie je v súboroch, nájdu ho v napovedaní). Kľúč úložiska v4.
- **Logo UCM** v paneli a ako ikona karty (`public/logo-ucm.svg`). Je **prekreslené podľa
  obrázka** – [ ] nahradiť oficiálnym SVG z UCM, ak ho máme.

## Rozhodnutia
- [x] **Nepriatelia:** náraz z boku uberá život v jadre hry, háčik rieši „navyše“; ak háčik
      nepriateľa zničí, hráč nestratí život. Riešenie = `if (zhora) nepriatel.znic()`. Potvrdené. — M2/M5
- [x] **Zmazaný riadok v `settings.ts`** vráti *bugovú* hodnotu (`ZAKLADNE_NASTAVENIA`) –
      študent musí napísať správne číslo. Potvrdené. — M2/M5

## Obsah / assety
- [ ] **Kenney assety** – kenney.nl blokuje automatické sťahovanie (403). Grafika je zatiaľ
      vlastný pixel-art generovaný v kóde (`src/game/textury.ts`). Ak treba Kenney, stiahnuť
      ručne do `public/assets/` a napojiť pod rovnaké kľúče textúr. — M1
- [ ] Oblaky sú len v prvých ~60 % levelu (`vytvorPozadie`). — M1
- [x] ~~Zvuky prídu v M6~~ – zrušené spolu s M6. — M1/M6

## Herné správanie
- [x] ~~Pri zápornej gravitácii sa dá chodiť po strope a splniť misiu „polovica levelu“~~ –
      misia zrušená spolu s bugom rýchlosti. Chodenie po strope ostáva ako vtipný efekt bugu. — M1/M5
- [ ] Pri niektorých pomeroch strán ostanú nad/pod hrou tmavé pásy (min. šírka 800 px
      = 25 dlaždíc, aby bol vidieť dosť levelu). — M1
- [ ] E2E testy so `--repeat-each` pod veľkou záťažou občas zlyhajú na časovaní (klávesy
      počas štartu hry). Samostatne prechádzajú; test šípky už čaká na štart hry. — testy
- [ ] FPS v headless prehliadači ~55 – overiť 60 FPS na reálnom školskom PC. — M1
- [x] Rýchle ťuknutie na skok sa strácalo (Phaser JustDown) → skok sa chytá z keydown. — M1
- [x] Canvas vytláčal HUD a tlačidlá mimo obrazovky pri 1366×768. — M1

- [ ] Ak študent priradí písmeno vo `whileKeyHeld("a", …)`, písanie cheatov v hre (napr. „baguvix“)
      hýbe panáčikom. Asi v poriadku, len vedieť. — bugy v2
- [ ] Komentáre v študentskom kóde len popisujú, čo kód robí (po slovensky) – žiadne
      „// BUG:“ ani popisy chýb (dohoda 2026-11-19). Overiť na prvej skupine, či bugy nájdu
      len z hrania; ak nie, lektor ukáže slajd „Čo treba opraviť“. — bugy v2

## Runtime
- [ ] Syntaktická chyba, ktorú nájde až `new Function` (napr. dvakrát `let x` v rôznych
      súboroch), nemá číslo riadku. — M2
- [ ] Ochrana cyklov počíta per-cyklus za celé volanie: vnorený cyklus 100×200 (= 20 000
      prechodov vnútorným) vyhodí „nikdy neskončí", hoci skončí. Pre študentov zriedkavé. — M2
- [ ] `print()` bublina sleduje hráča; ak ich príde viac naraz, ukáže sa len posledná. — M2
- [x] Nezatvorená zátvorka na konci súboru sa hlásila v nasledujúcom súbore. — M2
- [x] Sucrase pri chýbajúcej „)" hlási „expected ,“ → preložené ako „Chýba zátvorka alebo čiarka". — M2

## Editor (Monaco)
- [x] **Hláška počas písania:** chyba z automatického spustenia je najprv sivá („✎ Dopisuješ?“),
      bez podčiarknutia; červená až po 2,5 s nečinnosti alebo hneď pri Ctrl+Enter / ▶ Spustiť. — M3→M4
- [ ] Vlastná diagnostika TypeScriptu v Monacu (červená vlnovka) sa ukazuje aj počas písania,
      tú jemný režim neskrýva. Zatiaľ OK – je nenápadná. — M4
- [ ] Texty samotného Monaca (kontextové menu, „No suggestions“) sú po anglicky. — M3
- [ ] Pri sémantickej chybe sa môže ukázať značka od TypeScriptu aj od našej chyby
      (dve podčiarknutia na tom istom riadku). — M3
- [ ] Rozbalený popis v návrhoch používa interné API Monaca (`_setDetailsVisible`) –
      pri update Monaca overiť (je v try/catch, nič nespadne). — M3
- [ ] Emoji v pruhu fokusu (🖱️/🎮) závisia od emoji fontu systému (na niektorých Linuxoch chýba). — M3
- [x] Editor sa po načítaní hneď zmazal (kontajner sa čistil až po vytvorení). — M3
- [x] Nepreložená hláška „Unexpectedly reached the end of input“. — M3

## Reset / úložisko / učiteľ
- [ ] Nadpis „Hra je pokazená“ ostáva aj keď je všetko opravené (napr. po „Všetko opraviť“).
      Zatiaľ OK, je to výzva, nie stav. — M7
- [ ] Potvrdenie resetu sa pri 1366 px zalomí na druhý riadok pod ▶ Spustiť (funguje, len
      posunie layout). — M7
- [ ] Uložený kód má verziu v kľúči (`uciman:kod:v1`): keď sa zmenia bugové súbory, treba
      zvýšiť na v2, inak študenti po aktualizácii uvidia starý uložený kód. — M7
- [ ] Na zdieľanom PC zostane kód predošlej skupiny, kým niekto nestlačí ↺ Reset
      (alebo neotvorí `?reset`). Pre učiteľa: medzi skupinami stlačiť Reset. — M7

## Infra
- [x] Git: `main` na github.com/oliverdendis/uciman (verejný repozitár). — M1/M8
- [ ] Napojiť Vercel na repozitár a po nasadení overiť: načítanie, Monaco, žiadne cudzie requesty. — M8
- [x] Offline záloha: `npm run build` → `npx serve dist` overené v Chrome aj Firefoxe. — M8
- [x] Na Macu `Ctrl+Enter` v Monacu vkladal nový riadok (Monaco mapuje Ctrl na Cmd) → pridaná aj skratka WinCtrl. — M8
- [ ] **Veľkosť buildu:** Phaser 1,5 MB, Monaco 2,7 MB, TypeScript worker 6,9 MB (spolu ~12 MB,
      gzip ~3 MB). Hra sa spustí hneď, Monaco sa dočíta lenivo (~0,5 s lokálne). Overiť prvé
      načítanie na školskej sieti; pri 15 PC naraz zvážiť predhriatie (otvoriť stránku vopred). — M3
- [ ] Objekt `window.uciman` (ladenie, testy) je dostupný aj v produkcii – študenti ním
      môžu „cheatovať“ cez konzolu. Pre deň otvorených dverí asi OK. — M3
