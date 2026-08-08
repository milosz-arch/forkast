/* =====================================================================
   Polski cudzysłów w kodzie.

   Znak otwierający „ (U+201E) jest zwykłym znakiem i nic nie robi.
   Znak zamykający musi być ” (U+201D), NIE prostym " (U+0022) — bo prosty
   kończy łańcuch JavaScriptu i reszta zdania staje się kodem.

   Objaw: SyntaxError w przeglądarce, moduł się nie wykonuje, Alpine nie startuje,
   BIAŁY EKRAN bez żadnej informacji. Kosztowało to trzy rundy zgadywania
   3 sierpnia, bo `node --check` tego nie łapie.
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

const pliki = readdirSync(KORZEN).filter(f => f.endsWith(".js") || f.endsWith(".html"));

console.log(`\n— cudzysłowy (${pliki.length} plików) —`);

test("nigdzie „ nie jest zamknięte prostym cudzysłowem", () => {
  const znalezione = [];
  for (const plik of pliki) {
    const linie = readFileSync(plik, "utf8").split("\n");
    linie.forEach((l, i) => {
      // „ ... " w tej samej linii, bez ” po drodze
      if (/„[^"”\n]*"/.test(l)) znalezione.push(`${plik}:${i + 1}`);
    });
  }
  rowne(znalezione, [], "prosty cudzysłów po „ kończy łańcuch i wywala moduł");
});

test("każdy „ znajduje swoje ” najdalej trzy linie dalej", () => {
  /* W komentarzach zdanie bywa łamane i cudzysłów zamyka się w następnej linii —
     to jest w porządku. Nie jest w porządku otwarcie, które nie zamyka się wcale:
     to zwykle literówka, a w łańcuchu JS bywa błędem składni. */
  const znalezione = [];
  for (const plik of pliki) {
    const linie = readFileSync(plik, "utf8").split("\n");
    linie.forEach((l, i) => {
      const brak = (l.match(/„/g) || []).length - (l.match(/”/g) || []).length;
      if (brak <= 0) return;
      const okno = linie.slice(i + 1, i + 4).join("\n");
      const domkniete = (okno.match(/”/g) || []).length;
      if (domkniete < brak) znalezione.push(`${plik}:${i + 1}`);
    });
  }
  rowne(znalezione, []);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
