/* =====================================================================
   Użycie bez importu.

   Najgroźniejsza klasa błędu w tym projekcie, bo NIC jej nie łapie:
   `node --check` widzi poprawną składnię, testy modułów nie dotykają ekranów,
   a przeglądarka rzuca `ReferenceError` dopiero przy starcie Alpine — czyli
   ekran po prostu nie działa, bez śladu w kodzie.

   Zdarzyło się 3 sierpnia dwa razy: raz przy `czas.js`, raz przy `kuchnie.js`.
   Za każdym razem przyczyna była ta sama — podmiana celowała w napis importu,
   który w części plików wygląda inaczej, więc po cichu nie trafiła.

   Test sprawdza każdą nazwę eksportowaną przez nasze moduły: jeśli ekran jej
   używa, musi ją importować.
   ===================================================================== */

import { readdirSync, readFileSync } from "fs";

/* Testy leżą w `testy/`, a pliki apki w korzeniu repozytorium — stąd ten skok
   o katalog wyżej. Liczony od położenia TEGO pliku, nie od tego, skąd ktoś
   uruchomił node, bo inaczej wynik zależałby od katalogu w terminalu. */
const KORZEN = new URL("../", import.meta.url);

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function rowne(a, b, opis = "") {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${opis}\n       jest: ${JSON.stringify(a)}`);
}

/* Zbieramy, co eksportuje każdy nasz moduł. */
/* dane.js to pozostałość po Dietce, nie część tej aplikacji — jego eksporty
   kolidują z nazwami pól w ekranach i dawałyby fałszywe alarmy. */
const POMIN = new Set(["dane.js", "uruchom-testy.mjs"]);
const moduly = readdirSync(KORZEN)
  .filter(f => f.endsWith(".js") && !f.startsWith("test-") && !POMIN.has(f));
const eksporty = new Map();          // nazwa → plik
for (const plik of moduly) {
  const tresc = readFileSync(plik, "utf8");
  for (const m of tresc.matchAll(/^export (?:async )?function (\w+)/gm)) eksporty.set(m[1], plik);
  for (const m of tresc.matchAll(/^export const (\w+)/gm)) eksporty.set(m[1], plik);
}

/* EKRANY to pliki HTML, które naprawdę rejestrują komponent Alpine — a nie te,
   które kończą się jakimś przyrostkiem w nazwie. Do 8 sierpnia stało tu
   `endsWith("-tw.html")`, przyrostek z czasów, gdy źródła leżały obok paczki
   wdrożeniowej. Po przejściu na repozytorium żaden plik już się tak nie nazywa,
   więc ta lista była PUSTA, a testy chodzące po niej przechodziły, nie sprawdzając
   niczego. Dlatego niżej stoi twarde żądanie ośmiu ekranów: pusta lista ma
   obalać test, nie zielenić go. */
const ekrany = readdirSync(KORZEN)
  .filter(f => f.endsWith(".html"))
  .filter(f => readFileSync(new URL(f, KORZEN), "utf8").includes("Alpine.data("));

if (ekrany.length < 8) {
  console.log(`  BLAD  znalazłem ${ekrany.length} ekranów zamiast ośmiu — reszta tego zestawu byłaby fałszywie zielona`);
  process.exit(1);
}

console.log(`\n— importy (${eksporty.size} nazw, ${ekrany.length} ekranów) —`);

test("każda używana nazwa jest zaimportowana", () => {
  const braki = [];
  for (const ekran of ekrany) {
    const html = readFileSync(ekran, "utf8");
    const skrypt = (html.match(/<script type="module">([\s\S]*?)<\/script>/) || [])[1] || "";
    /* Bez komentarzy — nazwa wspomniana w wyjaśnieniu to nie użycie. */
    const kod = skrypt.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    /* Import rozbity na dwie linie — `import { a, b }\n  from "../x.js";` — jest
       poprawny i częsty, gdy lista nazw nie mieści się w wierszu. Sklejamy więc
       wszystko w jedną linię przed sprawdzaniem, inaczej test daje fałszywy alarm
       o braku importu, który tam jest. Złapane przy pierwszym użyciu. */
    const importy = (kod.match(/^import [\s\S]*?;$/gm)?.join("\n") || "")
      .replace(/\s+/g, " ");

    for (const [nazwa, plik] of eksporty) {
      const bezImportow = kod.replace(/^import [\s\S]*?;$/gm, "");

      /* Szukamy WOŁANIA GOŁEJ NAZWY: `nazwa(`, ale nie `.nazwa(` ani `this.nazwa(`.
         Bez tego test łapie metody ekranu, które przypadkiem nazywają się tak samo
         jak jakiś eksport — na przykład `odrzuc()` w ekranie AI kontra `odrzuc`
         z instalacja.js. To dwie różne rzeczy o tej samej nazwie. */
      const wolane = new RegExp(`(^|[^.\\w])${nazwa}\\s*\\(`, "m").test(bezImportow);
      /* Albo nazwa stała używana jako wartość: `NAZWA.` / `NAZWA[` / `= NAZWA` */
      const jakoWartosc = /^[A-Z_]+$/.test(nazwa)
        && new RegExp(`(^|[^.\\w])${nazwa}\\s*[.,\\[\\)]`, "m").test(bezImportow);
      /* Skrót właściwości w obiekcie Alpine: `kuchniaDania,` oznacza
         `kuchniaDania: kuchniaDania` — czyli użycie, choć nie wygląda jak
         wywołanie. Szablon woła to potem przez x-text, więc brak importu
         daje ReferenceError. Ten wzorzec przeoczyłem za pierwszym razem
         i test przepuścił prawdziwy błąd. */
      const skrot = kod.split("\n").some(l =>
        /^\s{2,}[A-Za-z_$][\w$]*(\s*,\s*[A-Za-z_$][\w$]*)*\s*,\s*$/.test(l)
        && l.split(",").map(x => x.trim()).includes(nazwa));

      if (!wolane && !jakoWartosc && !skrot) continue;

      /* Nazwa zdefiniowana w tym pliku jako metoda obiektu Alpine — wtedy nie
         potrzebuje importu, bo jest własna. */
      if (new RegExp(`^\\s{2,}(async )?${nazwa}\\s*\\(`, "m").test(kod)) continue;

      /* Nazwa zadeklarowana lokalnie: parametr funkcji, `const`, `let`.
         `new Promise((_, odrzuc) => ...)` to własna zmienna, nie eksport
         z instalacja.js, choć nazywa się tak samo. */
      const lokalna = new RegExp(
        `(const|let|var)\\s+${nazwa}\\b` +
        /* Parametr funkcji MUSI stać przy nawiasie — bez tego wzorzec łapał
           listę skrótów właściwości („a, b, c,") jako parametry i wyciszał
           prawdziwe braki importu. Złapane przy sprawdzaniu, czy test w ogóle
           działa: usunąłem import celowo i test go przepuścił. */
        `|\\(\\s*${nazwa}\\s*[,)]` +
        `|,\\s*${nazwa}\\s*\\)`, "m").test(kod);
      if (lokalna) continue;
      const ma = new RegExp(`import \\{[^}]*\\b${nazwa}\\b[^}]*\\} from "\\./${plik.replace(".", "\\.")}"`).test(importy)
              || new RegExp(`import ${nazwa} from`).test(importy);
      if (!ma) braki.push(`${ekran}: ${nazwa} (z ${plik})`);
    }
  }
  rowne(braki, [], "ReferenceError przy starcie Alpine — ekran nie zadziała");
});

test("numer wydania w wersja.js i w sw.js mówią to samo", () => {
  /* Decyzja 44 opiera diagnozę „mam starą wersję” na tym, że numer w Ustawieniach
     zgadza się z tym, co trzyma service worker. 8 sierpnia podbiłem sam `sw.js`
     i zostawiłem `wersja.js` z poprzednim numerem — Ustawienia pokazywałyby v44
     na kodzie v45, czyli dokładnie to kłamstwo, przed którym decyzja 44 chroni. */
  const wydanie = readFileSync(new URL("wersja.js", KORZEN), "utf8").match(/WYDANIE\s*=\s*"([^"]+)"/)?.[1];
  const cache = readFileSync(new URL("sw.js", KORZEN), "utf8").match(/CACHE\s*=\s*"forkast-([^"]+)"/)?.[1];
  if (!wydanie || !cache) throw new Error(`nie znalazłem numerów: ${wydanie} / ${cache}`);
  rowne(wydanie, cache, "numer wydania rozjechał się między wersja.js a sw.js");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
