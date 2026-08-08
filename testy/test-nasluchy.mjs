/* =====================================================================
   KAŻDY NASŁUCH BAZY MUSI MIEĆ OBSŁUGĘ BŁĘDU

   `onValue(ref, callback)` bez trzeciego argumentu milczy, gdy baza odmówi
   odczytu. Nie ma wyjątku, nie ma komunikatu — po prostu dane nie przychodzą.
   Spiżarnia bez prawa dostępu wygląda wtedy dokładnie tak samo jak spiżarnia,
   do której nikt nic nie wpisał.

   8 sierpnia kosztowało to wieczór zgadywania: wyglądało na „nie synchronizuje
   się", a baza po prostu mówiła nie (decyzja 76). Odmowa dostępu przy działającym
   internecie jest najgorszym rodzajem awarii — wygląda jak cisza.

   Test pilnuje, żeby każde wywołanie `onValue` miało trzeci argument.
   ===================================================================== */

import { readFileSync, readdirSync } from "node:fs";

const KORZEN = new URL("../", import.meta.url);

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(w, co) { if (!w) throw new Error(co); }

const EKRANY = readdirSync(KORZEN)
  .filter(p => p.endsWith(".html"))
  .filter(p => readFileSync(new URL(p, KORZEN), "utf8").includes("onValue("));

prawda(EKRANY.length >= 3, `spodziewałem się co najmniej trzech ekranów z nasłuchem, jest ${EKRANY.length}`);

console.log(`\n— nasłuchy bazy zgłaszają swoje awarie (${EKRANY.length} ekranów) —`);

/** Wycina argumenty wywołania od nawiasu otwierającego, licząc zagnieżdżenia. */
function argumenty(tekst, odNawiasu) {
  let głębokość = 0, w = "", cudzyslow = null;
  for (let i = odNawiasu; i < tekst.length; i++) {
    const z = tekst[i], poprzedni = tekst[i - 1];
    if (cudzyslow) { w += z; if (z === cudzyslow && poprzedni !== "\\") cudzyslow = null; continue; }
    if (z === '"' || z === "'" || z === "`") { cudzyslow = z; w += z; continue; }
    if (z === "(" || z === "{" || z === "[") głębokość++;
    if (z === ")" || z === "}" || z === "]") { głębokość--; if (!głębokość) return w.slice(1); }
    w += z;
  }
  throw new Error("nie znalazłem końca wywołania");
}

/** Ile argumentów na pierwszym poziomie — czyli ile przecinków poza zagnieżdżeniami. */
function ileArgumentow(tresc) {
  let głębokość = 0, ile = 1, cudzyslow = null;
  for (let i = 0; i < tresc.length; i++) {
    const z = tresc[i], poprzedni = tresc[i - 1];
    if (cudzyslow) { if (z === cudzyslow && poprzedni !== "\\") cudzyslow = null; continue; }
    if (z === '"' || z === "'" || z === "`") { cudzyslow = z; continue; }
    if ("({[".includes(z)) głębokość++;
    else if (")}]".includes(z)) głębokość--;
    else if (z === "," && głębokość === 0) ile++;
  }
  return tresc.trim() ? ile : 0;
}

for (const plik of EKRANY) {
  test(`${plik}: każdy onValue ma obsługę błędu`, () => {
    const s = readFileSync(new URL(plik, KORZEN), "utf8");
    const bez = [];
    let i = -1;
    while ((i = s.indexOf("onValue(", i + 1)) !== -1) {
      const tresc = argumenty(s, i + "onValue".length);
      if (ileArgumentow(tresc) < 3) {
        bez.push(`linia ${s.slice(0, i).split("\n").length}`);
      }
    }
    prawda(bez.length === 0,
           `nasłuch bez obsługi błędu: ${bez.join(", ")} — odmowa dostępu będzie wyglądać jak brak danych`);
  });
}

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
