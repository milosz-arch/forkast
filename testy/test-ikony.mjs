/* =====================================================================
   Ikony: czy każda używana istnieje w sprite.

   Powstało po tym, jak ikona zakładki „Dodaj" zniknęła — nie przez usunięcie,
   tylko dlatego, że późniejsza podmiana innego fragmentu sprite'a objęła zakresem
   także ją. Brakująca ikona nie wywołuje żadnego błędu: SVG po prostu nic nie
   rysuje, a w interfejsie zostaje pusta dziura obok podpisu.

   To ta sama klasa problemu, co reguła CSS łapiąca za szeroko i stała
   zadeklarowana pod wywołaniem: nic się nie psuje głośno, więc trzeba sprawdzać.
   ===================================================================== */

import { readFileSync, readdirSync } from "fs";

/* Testy leżą w `testy/`, a pliki apki w korzeniu repozytorium — stąd ten skok
   o katalog wyżej. Liczony od położenia TEGO pliku, nie od tego, skąd ktoś
   uruchomił node, bo inaczej wynik zależałby od katalogu w terminalu. */
const KORZEN = new URL("../", import.meta.url);

let zdane = 0, oblane = 0;
function test(nazwa, fn) {
  try { fn(); console.log(`  ok   ${nazwa}`); zdane++; }
  catch (e) { console.log(`  BLAD ${nazwa}\n       ${e.message}`); oblane++; }
}
function rowne(a, b, opis = "") {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x !== y) throw new Error(`${opis}\n       jest:      ${x}\n       spodziewam: ${y}`);
}

const sprite = readFileSync(new URL("ikony.html", KORZEN), "utf8");
const dostepne = new Set([...sprite.matchAll(/id="(i-[\w-]+)"/g)].map(m => m[1]));

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

console.log(`\n— ikony (${dostepne.size} w sprite, ${ekrany.length} ekranów) —`);

test("każda ikona wskazywana wprost w ekranach istnieje w sprite", () => {
  const brakujace = new Set();
  for (const plik of ekrany) {
    const tresc = readFileSync(plik, "utf8");
    for (const m of tresc.matchAll(/href="(i?-?#?)?#(i-[\w-]+)"/g))
      if (!dostepne.has(m[2])) brakujace.add(`${plik}: ${m[2]}`);
  }
  rowne([...brakujace], [], "SVG z brakującym symbolem nic nie rysuje i nie zgłasza błędu");
});

test("każda zakładka paska nawigacji ma swoją ikonę", () => {
  /* Zakładki budują nazwę ikony dynamicznie ('#i-' + z.id), więc powyższy test
     ich nie widzi — trzeba wziąć identyfikatory wprost z listy zakładek. */
  const powloka = readFileSync(new URL("powloka.js", KORZEN), "utf8");
  const blok = powloka.match(/export const ZAKLADKI = \[([\s\S]*?)\];/);
  if (!blok) throw new Error("nie znalazłem listy zakładek w powloka.js");
  const idy = [...blok[1].matchAll(/id:\s*"(\w+)"/g)].map(m => m[1]);
  rowne(idy.filter(id => !dostepne.has("i-" + id)), [],
        "zakładka bez ikony zostawia pustą dziurę obok podpisu");
});

test("pasek nawigacji ma dokładnie pięć pozycji", () => {
  /* Sześć pozycji spycha podpisy poniżej czytelności i zwęża cele dotykowe
     poniżej progu — a to uderza dokładnie w najstarszych użytkowników. */
  const powloka = readFileSync(new URL("powloka.js", KORZEN), "utf8");
  const blok = powloka.match(/export const ZAKLADKI = \[([\s\S]*?)\];/);
  rowne([...blok[1].matchAll(/id:\s*"/g)].length, 5);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
