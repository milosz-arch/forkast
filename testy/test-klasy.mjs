/* =====================================================================
   KLASY WŁASNE MUSZĄ MIEĆ CSS

   Trzy razy w tym projekcie to samo: klasa użyta w HTML-u, do której nikt
   nie napisał ani jednej reguły. `.stempel-kubelka` renderowała się jako goły
   tekst z kontrastem 1.53:1 (decyzja 63). `.pasek-kubelka` nie rysowała nic.
   `.liczba-glowna`, `.liczba-drobna`, `.naglowek-dzialu` i `.btn-glowny`
   sprawiały, że duży licznik w Zakupach był tego samego rozmiaru co reszta
   strony i stał krzywo — zgłoszone przez Miłosza z telefonu (decyzja 74).

   Przeglądarka nie zgłasza nieznanej klasy. Nie ma błędu, nie ma ostrzeżenia,
   nie ma pustego ekranu — jest element, który wygląda „jakoś”. Dlatego to musi
   pilnować test, a nie oko.

   ZAKRES: tylko klasy WŁASNE, czyli takie, których nie zna Tailwind. Rozpoznajemy
   je po tym, że nie mają przedrostka narzędzia ani wariantu (`dark:`, `md:`,
   nawias kwadratowy). Sprawdzamy wyłącznie statyczne `class="…"` — wyrażenia
   w `:class` to kod, nie lista klas.
   ===================================================================== */

import { readFileSync, readdirSync } from "node:fs";

const KORZEN = new URL("../", import.meta.url);

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(w, co) { if (!w) throw new Error(co); }

/* Komentarze wycinamy PRZED szukaniem selektorów. Bez tego wystarczy wymienić
   nazwę klasy w komentarzu — a właśnie to zrobiłem, opisując te pięć klas — żeby
   test uznał ją za zdefiniowaną. Pierwsza wersja tego pliku przechodziła sabotaż
   (usunięcie całej reguły `.liczba-glowna`) i nie pisnęła. */
const CSS = readFileSync(new URL("styl.css", KORZEN), "utf8").replace(/\/\*[\s\S]*?\*\//g, " ");
const ZDEFINIOWANE = new Set([...CSS.matchAll(/\.([a-ząćęłńóśźż][\w-]*)/g)].map(m => m[1]));

/* Narzędzia Tailwinda rozpoznajemy po przedrostku. Lista jest długa, ale za to
   jawna — wzorzec „wszystko z myślnikiem" wpuszczałby nasze własne klasy
   (`btn-glowny`, `pasek-kubelka`) i test przestałby cokolwiek pilnować. */
const PRZEDROSTKI = /^(?:m|p)[trblxy]?-|^(?:w|h|min|max|text|bg|border|rounded|shadow|gap|space|items|justify|font|leading|tracking|overflow|opacity|transition|size|top|right|bottom|left|z|grid|col|row|flex|order|self|place|divide|ring|outline|break|indent|align|resize|appearance|fill|stroke|origin|rotate|scale|translate|skew|duration|ease|delay|animate|blur|list|object|aspect|whitespace|accent|from|via|to|inset|cursor|select|scroll|pointer|backdrop|sr|line|no|normal|tabular|truncate|hidden|block|inline|underline)-/;
const POJEDYNCZE = new Set([
  "flex", "grid", "block", "inline", "hidden", "absolute", "relative", "fixed", "sticky",
  "truncate", "italic", "underline", "uppercase", "capitalize", "antialiased", "group",
  "border", "rounded", "shadow", "transition", "container", "isolate", "invisible", "shrink-0",
]);

const EKRANY = readdirSync(KORZEN).filter(p => p.endsWith(".html"));
prawda(EKRANY.length >= 10, `spodziewałem się dziesięciu plików HTML, jest ${EKRANY.length}`);

console.log(`\n— klasy własne mają CSS (${EKRANY.length} plików) —`);

for (const plik of EKRANY) {
  test(`${plik}: każda własna klasa ma regułę w styl.css`, () => {
    const s = readFileSync(new URL(plik, KORZEN), "utf8");
    const brak = new Set();
    for (const m of s.matchAll(/(?<![:\w-])class="([^"]*)"/g)) {
      for (const k of m[1].split(/\s+/)) {
        if (!/^[a-ząćęłńóśźż][a-ząćęłńóśźż0-9-]*$/.test(k)) continue;   // nie klasa, tylko kawałek wyrażenia
        if (PRZEDROSTKI.test(k) || POJEDYNCZE.has(k)) continue;          // narzędzie Tailwinda
        if (!ZDEFINIOWANE.has(k)) brak.add(k);
      }
    }
    prawda(brak.size === 0,
           `klasy bez ani jednej reguły CSS: ${[...brak].join(", ")} — przeglądarka to zignoruje bez słowa`);
  });
}

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
