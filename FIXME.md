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

## Rozhodnutia
- [x] **Nepriatelia:** náraz z boku uberá život v jadre hry, háčik rieši „navyše“; ak háčik
      nepriateľa zničí, hráč nestratí život. Riešenie = `if (zhora) nepriatel.znic()`. Potvrdené. — M2/M5
- [x] **Zmazaný riadok v `nastavenia.ts`** vráti *bugovú* hodnotu (`ZAKLADNE_NASTAVENIA`) –
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
- [ ] FPS v headless prehliadači ~55 – overiť 60 FPS na reálnom školskom PC. — M1
- [x] Rýchle ťuknutie na skok sa strácalo (Phaser JustDown) → skok sa chytá z keydown. — M1
- [x] Canvas vytláčal HUD a tlačidlá mimo obrazovky pri 1366×768. — M1

## Runtime
- [ ] Syntaktická chyba, ktorú nájde až `new Function` (napr. dvakrát `let x` v rôznych
      súboroch), nemá číslo riadku. — M2
- [ ] Ochrana cyklov počíta per-cyklus za celé volanie: vnorený cyklus 100×200 (= 20 000
      prechodov vnútorným) vyhodí „nikdy neskončí", hoci skončí. Pre študentov zriedkavé. — M2
- [ ] `vypis()` bublina sleduje hráča; ak ich príde viac naraz, ukáže sa len posledná. — M2
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
