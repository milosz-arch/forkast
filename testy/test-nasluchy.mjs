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
  .filter(p => p.endsWith(".html") || (p.endsWith(".js") && !p.startsWith("lib")))   /* od 114 nasłuchy żyją też w modułach */
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

/* =====================================================================
   KAŻDA UŻYTA FUNKCJA BAZY MUSI BYĆ WYPAKOWANA Z POŁĄCZENIA

   Zmieniając zapis spiżarni z `set` na `update` zostawiłem w rozpakowaniu
   `const { db, ref, set, remove } = this.fb` — czyli `update` nie istniało,
   a zapis kończył się komunikatem „update is not defined”. W Node ten kod się
   nie wykonuje, więc żaden zestaw tego nie widział; złapał to dopiero stend
   z podstawioną bazą (decyzja 76).

   Idziemy linia po linii: przy każdym wywołaniu funkcji bazy patrzymy wstecz
   na najbliższe rozpakowanie i sprawdzamy, czy ta nazwa w nim była.
   ===================================================================== */
console.log("\n— funkcje bazy są wypakowane przed użyciem —");

const FUNKCJE_BAZY = ["get", "set", "remove", "update", "push", "onValue"];

/* Wygasza komentarze, ZACHOWUJĄC podział na linie — numer w komunikacie musi
   dalej wskazywać prawdziwą linię pliku.

   Bez tego test czytał nazwy funkcji z opisów: komentarz tłumaczący, DLACZEGO
   nie wolno użyć `set(push(ref(…)))`, sam wyglądał jak użycie set i push.
   Test odrzucał wtedy poprawny kod z powodu zdania o tym kodzie — trzeci raz
   tego samego dnia, po teście klas z 8 sierpnia i teście parametru myślenia. */
const bezKomentarzy = (kod) => kod
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
  .replace(/(^|[^:])\/\/[^\n]*/g, (m, p1) => p1 + " ".repeat(m.length - p1.length));

for (const plik of EKRANY) {
  test(`${plik}: każda użyta funkcja bazy jest wypakowana z połączenia`, () => {
    const linie = bezKomentarzy(readFileSync(new URL(plik, KORZEN), "utf8")).split("\n");
    /* Dwa wzorce w tym projekcie: `const { … } = this.fb` wewnątrz metody
       (znika przy następnej metodzie) oraz `({ … } = fb)` na poziomie modułu,
       do zmiennych zadeklarowanych wyżej (zostaje do końca pliku). */
    let wMetodzie = new Set();
    const wModule = new Set();
    const braki = [];
    for (let i = 0; i < linie.length; i++) {
      const l = linie[i];
      const globalne = l.match(/\(\{([^}]*)\} = fb\)/);
      if (globalne) {
        for (const n of globalne[1].split(",")) wModule.add(n.trim());
        continue;
      }
      const lokalne = l.match(/const \{([^}]*)\} = (?:this\.)?fb;/);
      if (lokalne) {
        wMetodzie = new Set(lokalne[1].split(",").map(x => x.trim()));
        continue;
      }
      if (/^  [A-Za-z_$][\w$]*\(/.test(l) || /^  (?:async |get )/.test(l)) wMetodzie = new Set();
      for (const f of FUNKCJE_BAZY) {
        if (wMetodzie.has(f) || wModule.has(f)) continue;
        const uzyte = l.includes(f + "(") && !l.includes("." + f + "(")
                      && !l.trim().startsWith("*") && !l.trim().startsWith("//");
        if (uzyte) braki.push(`${f}() w linii ${i + 1} — bez wypakowania`);
      }
    }
    prawda(braki.length === 0, braki.join(", "));
  });
}

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
