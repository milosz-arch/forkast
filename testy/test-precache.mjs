/* =====================================================================
   KAŻDY MODUŁ, KTÓREGO POTRZEBUJE EKRAN, MUSI BYĆ NA LIŚCIE OFFLINE

   Import statyczny, którego nie ma skąd wczytać, nie psuje jednej funkcji —
   zabija CAŁY moduł ekranu. Alpine nigdy nie startuje, `x-cloak` nigdy nie
   schodzi, człowiek dostaje biały ekran. Dokładnie to samo, przed czym
   ostrzega baza.js przy dynamicznym imporcie Firebase, tyle że tu warunkiem
   staje się plik z WŁASNEJ domeny, którego nie ma w pamięci podręcznej.

   Zdarzyło się dwa razy. `restauracyjna.js` wypadł z listy przy v81 i wywalał
   Jadłospis oraz Przepisy bez zasięgu. `jezyk.js` i `tlumaczenia.js` wypadły
   przy v83 — a że importuje je powłoka, czyli każdy ekran, bez zasięgu padłaby
   CAŁA apka. Za pierwszym razem złapała to walidacja, za drugim ten test
   jeszcze nie istniał.

   Dlaczego nie wystarczy „pamiętać o dopisaniu": lista jest w sw.js, a import
   pisze się w ekranie albo w module, który ekran importuje. Te dwa miejsca
   nigdy nie są otwarte naraz.

   ZAKRES: przechodzimy graf importów TRANZYTYWNIE (ekran → moduł → moduł),
   bo powłoka importuje rzeczy, których żaden ekran nie wymienia z nazwy.
   Sprawdzamy też ikony z manifestu — brak ikony nie wywala ekranu, ale
   pusty kwadrat na ekranie głównym telefonu to ta sama rodzina przeoczeń.

   SABOTAŻ: sprawdzone przez usunięcie "./zakupy.js" i "./tlumaczenia.js"
   z SZKIELETU — oba obalają test, każdy z nazwą pliku i ekranu.
   ===================================================================== */

import { readFileSync, readdirSync, existsSync } from "node:fs";

const KORZEN = new URL("../", import.meta.url);

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(w, co) { if (!w) throw new Error(co); }

const czytaj = (p) => readFileSync(new URL(p, KORZEN), "utf8");

/* Lista offline. Wyciągana z kodu, nie przepisywana — to ta sama zasada,
   przez którą liczba testów jest liczona, a nie pamiętana (decyzja 30). */
const sw = czytaj("sw.js");
const blok = sw.match(/SZKIELET\s*=\s*\[([\s\S]*?)\]/);
prawda(blok, "nie znalazłem tablicy SZKIELET w sw.js");
const SZKIELET = new Set([...blok[1].matchAll(/"\.\/([^"]+)"/g)].map(m => m[1]));

test("SZKIELET nie jest pusty", () => {
  prawda(SZKIELET.size > 30, `spodziewałem się kilkudziesięciu wpisów, jest ${SZKIELET.size}`);
});

const EKRANY = readdirSync(KORZEN).filter(p => p.endsWith(".html"));
test("znaleziono ekrany do sprawdzenia", () => {
  prawda(EKRANY.length >= 10, `spodziewałem się dziesięciu ekranów, jest ${EKRANY.length}`);
});

/* Import ze ŚCIEŻKI WŁASNEJ. `import Alpine from "./lib/alpine-esm.js"` liczy się,
   `import(...gstatic.com...)` nie — tamto jest świadomie spoza domeny (baza.js). */
const IMPORT = /from\s+"\.\/([^"]+)"/g;
function importy(tresc) {
  return new Set([...tresc.matchAll(IMPORT)].map(m => m[1]));
}

test("każdy moduł importowany przez ekran jest na liście offline", () => {
  const brak = new Map();
  for (const ekran of EKRANY) {
    const kolejka = [...importy(czytaj(ekran))];
    const odwiedzone = new Set();
    while (kolejka.length) {
      const plik = kolejka.pop();
      if (odwiedzone.has(plik)) continue;
      odwiedzone.add(plik);
      if (!SZKIELET.has(plik)) {
        if (!brak.has(plik)) brak.set(plik, new Set());
        brak.get(plik).add(ekran);
      }
      /* Wchodzimy głębiej tylko w moduły, które naprawdę leżą w repo —
         inaczej literówka w imporcie zamieniłaby ten test w czytanie plików,
         których nie ma. */
      if (existsSync(new URL(plik, KORZEN))) {
        for (const dalej of importy(czytaj(plik))) {
          if (!odwiedzone.has(dalej)) kolejka.push(dalej);
        }
      }
    }
  }
  prawda(brak.size === 0,
    `${brak.size} modułów poza SZKIELETEM — bez zasięgu te ekrany nie wystartują:\n       ` +
    [...brak].map(([p, e]) => `${p} ← ${[...e].join(", ")}`).join("\n       "));
});

test("ikony z manifestu są na liście offline", () => {
  const manifest = JSON.parse(czytaj("manifest.json"));
  const brak = (manifest.icons || [])
    .map(i => String(i.src).replace(/^\.?\//, ""))
    .filter(src => !SZKIELET.has(src));
  prawda(brak.length === 0, `ikony poza SZKIELETEM: ${brak.join(", ")}`);
});

test("każdy wpis SZKIELETU wskazuje istniejący plik", () => {
  const widma = [...SZKIELET].filter(p => !existsSync(new URL(p, KORZEN)));
  prawda(widma.length === 0, `wpisy bez pliku: ${widma.join(", ")}`);
});

console.log(`\n  zdane: ${zdane}, oblane: ${oblane}`);
process.exit(oblane ? 1 : 0);
