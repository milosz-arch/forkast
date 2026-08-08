/* =====================================================================
   Użycie przed deklaracją (martwa strefa czasowa).

   `const` i `let` NIE są wynoszone na górę zakresu. Nazwa użyta przed swoją
   deklaracją rzuca „Cannot access X before initialization" — i to w czasie
   wykonania, nie przy sprawdzaniu składni.

   Trzy razy 3 sierpnia:
     1. `const SMACZNE` pod pierwszym wywołaniem funkcji, która jej używała
        → martwe przyciski na ekranie wejścia
     2. `wczytajSkale()` wstawione między importami
        → nieklikalne przyciski na wszystkich ekranach
     3. `slownik` użyty trzy linie nad swoją deklaracją
        → PUSTA LISTA ZAKUPÓW z komunikatem o braku internetu

   Za każdym razem objaw nie miał nic wspólnego z przyczyną, bo wyjątek
   lądował w najbliższym `catch` i zamieniał się w mylący komunikat.

   Test szuka wzorca w obrębie jednego bloku funkcji: nazwa zadeklarowana
   przez const/let, użyta w linii WYŻEJ niż jej deklaracja.
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

/* Tylko pliki, do których ekrany naprawdę sięgają. Katalog zawiera pozostałości
   po Dietce (rotacja.js, dane.js, licznik.html), które nie są częścią tej
   aplikacji — sprawdzanie ich dawałoby alarmy o kodzie, którego nikt nie uruchamia. */
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

function osiagalneModuly() {
  const doSprawdzenia = [];
  for (const e of ekrany) {
    const t = readFileSync(e, "utf8");
    for (const m of t.matchAll(/from "\.\/([\w-]+\.js)"/g)) doSprawdzenia.push(m[1]);
  }
  const znalezione = new Set();
  while (doSprawdzenia.length) {
    const plik = doSprawdzenia.pop();
    if (znalezione.has(plik) || plik.startsWith("lib/")) continue;
    let tresc;
    try { tresc = readFileSync(plik, "utf8"); } catch { continue; }
    znalezione.add(plik);
    for (const m of tresc.matchAll(/from "\.\/([\w-]+\.js)"/g)) doSprawdzenia.push(m[1]);
  }
  return [...znalezione];
}

const pliki = [...ekrany, ...osiagalneModuly()];

function kodZPliku(plik) {
  const tresc = readFileSync(plik, "utf8");
  const kod = plik.endsWith(".html")
    ? (tresc.match(/<script type="module">([\s\S]*?)<\/script>/) || [])[1] || ""
    : tresc;
  // bez komentarzy i bez łańcuchów — wzmianka w tekście to nie użycie
  /* Komentarze blokowe zastępujemy pustymi liniami, NIE usuwamy — inaczej
     numery linii się przesuwają i test wskazuje na zły wiersz, a wykrywanie
     zakresu po wcięciu przestaje działać. Złapane przy pierwszym użyciu:
     zgłosił błąd w linii 81, a chodziło o coś zupełnie innego. */
  return kod
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/.*$/gm, "")
    .replace(/`[^`]*`/g, "``")
    .replace(/"[^"\n]*"/g, '""')
    .replace(/'[^'\n]*'/g, "''");
}

console.log(`\n— użycie przed deklaracją (${pliki.length} plików) —`);

test("żadna nazwa nie jest używana powyżej swojej deklaracji", () => {
  const znalezione = [];

  for (const plik of pliki) {
    const linie = kodZPliku(plik).split("\n");

    linie.forEach((linia, nrDekl) => {
      const m = linia.match(/^(\s*)(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/);
      if (!m) return;
      const [, wciecie, nazwa] = m;

      /* Szukamy tylko w tym samym bloku: od ostatniej linii o MNIEJSZYM wcięciu
         (początek funkcji) do deklaracji. Wyżej to inny zakres i tam nazwa
         może legalnie oznaczać coś innego. */
      let odLinii = 0;
      for (let i = nrDekl - 1; i >= 0; i--) {
        const l = linie[i];
        if (!l.trim()) continue;
        const w = l.match(/^\s*/)[0].length;
        if (w < wciecie.length) { odLinii = i + 1; break; }
      }

      /* Nazwa NIE liczy się jako użycie, gdy stoi po kropce (właściwość obiektu)
         ani gdy tuż po niej jest dwukropek — bo `{ minuty: null }` to klucz
         w obiekcie, nie odwołanie do zmiennej o tej nazwie. Trzeci fałszywy
         alarm tego testu; każdy poprawiony po sprawdzeniu, co naprawdę zgłasza. */
      const wzorzec = new RegExp(`(^|[^.\\w$])${nazwa}\\b(?!\\s*:)`);
      for (let i = odLinii; i < nrDekl; i++) {
        if (wzorzec.test(linie[i])) {
          znalezione.push(`${plik}:${i + 1} używa "${nazwa}" zadeklarowanego w :${nrDekl + 1}`);
          break;
        }
      }
    });
  }

  rowne(znalezione, [], "const/let nie jest wynoszony — to rzuca wyjątek w przeglądarce");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
