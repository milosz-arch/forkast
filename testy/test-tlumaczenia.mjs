/* =====================================================================
   NAPIS BEZ TŁUMACZENIA NIE MA PRAWA WYJŚĆ NA ŻYWO

   Przy trzystu z górą napisach przeoczenie jest pewne, nie prawdopodobne.
   A przeoczony napis nie psuje niczego, co widać u nas: apka działa, ekran
   się rysuje, testy są zielone — tyle że Anglik widzi w środku angielskiego
   ekranu „Dodaj do spiżarni”. To jest dokładnie ten rodzaj cichego psucia,
   który w tym projekcie łapiemy testem, a nie okiem (decyzja 120).

   Trzy rzeczy sprawdzane osobno:

   1. KAŻDE t("…") MA POZYCJĘ W SŁOWNIKU. To jest ta blokada wydania.
   2. W PRZEROBIONYCH EKRANACH NIE MA GOŁEGO TEKSTU. Lista przerobionych
      rośnie w miarę pracy — plik dopisany do niej przestaje przepuszczać
      cokolwiek nieowiniętego. Póki ekranu nie ma na liście, sprawdzenie 1
      i tak pilnuje tego, co już owinięto.
   3. SŁOWNIK NIE TRZYMA MARTWYCH POZYCJI — wpis, którego nikt nie woła,
      to ślad po zmienionym napisie. Cicho gnije i myli przy następnej zmianie.

   SABOTAŻ (wymóg projektu — test, który nigdy nie oblał, jest tylko cichy):
   sprawdzone przez usunięcie jednej pozycji ze słownika i przez zdjęcie t()
   z jednego napisu w ustawieniach. Oba przypadki oblały.
   ===================================================================== */

import { readFileSync, readdirSync } from "node:fs";
import { SLOWNIK } from "../tlumaczenia.js";

const KORZEN = new URL("../", import.meta.url);

/* Nazwy własne nie są napisami do przetłumaczenia (decyzja 118) — marka apki
   brzmi tak samo w obu językach. Stoi TU, na górze: `const` nie jest wynoszony
   (pułapka 6), a używa tego również pętla po tytułach kart poniżej. */
const NIE_TLUMACZYMY = new Set(["Forkast"]);

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(w, co) { if (!w) throw new Error(co); }

/* EKRANY PRZEROBIONE NA t(). Dopisanie pliku tutaj włącza dla niego
   sprawdzenie 2 — i od tej chwili każdy nowy goły napis w nim oblewa. */
const PRZEROBIONE = [
  "index.html",
  "talia.html",
  "jadlospis.html",
  "zakupy.html",
  "przepisy.html",
  "dodaj-z-ai.html",
  "formularz.html",
  "ustawienia.html",
  "pomoc.html",
];

const PLIKI = readdirSync(KORZEN).filter(p => p.endsWith(".html") || p.endsWith(".js"));
prawda(PLIKI.length > 20, `spodziewałem się kilkudziesięciu plików, jest ${PLIKI.length}`);

/* W HTML-u NIE wycinamy komentarzy kodu — `accept="image/*"` otwiera taki
   komentarz i zjada wszystko aż do następnej gwiazdki ze slashem gdzieś dalej
   w pliku. Kosztowało to fałszywe zgłoszenie w dodaj-z-ai.html. Komentarze
   kodu wycinamy wyłącznie w plikach .js. */
function bezKomentarzy(tekst, html) {
  if (html) return tekst.replace(/<!--[\s\S]*?-->/g, " ");
  return tekst.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

/* Wywołania t("…") i tb("…"). Bierzemy tylko wywołania ze STAŁYM napisem —
   t(zmienna) jest legalne i nie da się go sprawdzić statycznie. */
/* Drugi argument to wstawki: `t("Przejrzano {ile} z {z} dań", {…})`. Bez `,` w tym
   wzorcu każde wywołanie ze wstawkami byłoby dla testu niewidzialne — napis bez
   tłumaczenia przechodziłby po cichu dokładnie tam, gdzie zdanie jest najdłuższe. */
const WOLANIA = /\b(?:t|tb|napis)\(\s*(?:'([^'\\\n]*)'|"([^"\\\n]*)")\s*[,)]/g;

const uzyte = new Map();   // napis → pliki, w których stoi
for (const p of PLIKI) {
  const tekst = bezKomentarzy(readFileSync(new URL(p, KORZEN), "utf8"), p.endsWith(".html"));
  for (const m of tekst.matchAll(WOLANIA)) {
    const napis = m[1] ?? m[2];
    if (!napis) continue;
    if (!uzyte.has(napis)) uzyte.set(napis, new Set());
    uzyte.get(napis).add(p);
  }
}

/* NAGŁÓWKI EKRANÓW nie przechodzą przez t() — ekran podaje je do danePowloki()
   albo do ustawNaglowek(). Ta dziura kosztowała wydanie: v83 wyszło z polskimi
   nagłówkami na wszystkich ośmiu ekranach i nikt tego nie sprawdzał. */
const NAGLOWKI = /(?:tytul|opis)\s*:\s*"([^"\\\n]+)"|ustawNaglowek\(\s*"([^"\\\n]*)"\s*,\s*"([^"\\\n]*)"/g;
/* Tylko ekrany: `tytul:` i `opis:` w modułach (pomoc.js, kuchnia.js) to ich
   własne pola danych, nie nagłówki — czekają w partii komunikatów. */
for (const p of PLIKI.filter(f => f.endsWith(".html"))) {
  const tekst = bezKomentarzy(readFileSync(new URL(p, KORZEN), "utf8"), true);
  for (const m of tekst.matchAll(NAGLOWKI)) {
    for (const napis of [m[1], m[2], m[3]]) {
      if (!napis || !napis.trim() || NIE_TLUMACZYMY.has(napis)) continue;
      if (!uzyte.has(napis)) uzyte.set(napis, new Set());
      uzyte.get(napis).add(p);
    }
  }
}

/* ETYKIETY ZAKŁADEK stoją w ZAKLADKI w powloka.js i idą na ekran przez
   t(z.nazwa) — czyli przez zmienną, której to sprawdzenie nie widzi. Bez tego
   „Zakupy” wyglądałoby na martwą pozycję słownika i kusiło do skasowania,
   a skasowanie zabrałoby tłumaczenie z paska nawigacji na ośmiu ekranach.
   Czego tu NIE ma: pilnowania, że etykiety w ogóle idą przez t() — to robi
   test-napisy-moduly.mjs, bo tam mieszka cała ta klasa napisów. */
{
  const powloka = readFileSync(new URL("powloka.js", KORZEN), "utf8");
  const blok = powloka.match(/ZAKLADKI\s*=\s*\[([\s\S]*?)\]/);
  prawda(blok, "nie znalazłem ZAKLADKI w powloka.js");
  const etykiety = [...blok[1].matchAll(/nazwa\s*:\s*"([^"\\\n]+)"/g)].map(m => m[1]);
  prawda(etykiety.length >= 5, `spodziewałem się pięciu zakładek, jest ${etykiety.length}`);
  for (const napis of etykiety) {
    if (!uzyte.has(napis)) uzyte.set(napis, new Set());
    uzyte.get(napis).add("powloka.js");
  }
}

/* NAPISY W GNIAZDACH EKRANOWYCH — `opisZdjec: "…"`, `reakcja: "…"`, `nazwa: "…"`.
   Idą na ekran przez zmienną (`t(opisZdjec)`, `this.t(p.reakcja)`), więc dosłownego
   `t("…")` tu nie ma i bez tej pętli wyglądałyby na martwe pozycje słownika.
   Wartość zostaje w danych po polsku CELOWO: obiekt komponentu powstaje raz, przy
   starcie, zanim stół poda język — przetłumaczona w tym miejscu zamarzłaby na zawsze
   (pułapka 34). Tłumaczy się ją dopiero przy wyświetleniu.
   Ten sam wzorzec pilnuje test-napisy-moduly.mjs od drugiej strony. */
{
  const GNIAZDA = /\bmrugnij\(\s*"([^"\\\n]*)"|\b(?:nazwa|etykieta|tytul|opis|reakcja|blad|bladOsoby|bladKodu|bladImienia|stanSieci|stanEksportu|podpowiedzCzekania|opisZdjec)\s*[:=]\s*"([^"\\\n]*)"|\bkomunikat\s*=\s*"([^"\\\n]*)"/g;
  for (const p of PLIKI) {
    let tekst = readFileSync(new URL(p, KORZEN), "utf8");
    if (p.endsWith(".html")) tekst = (tekst.match(/<script[^>]*>[\s\S]*?<\/script>/g) || []).join("\n");
    for (const m of bezKomentarzy(tekst, false).matchAll(GNIAZDA)) {
      const napis = m[1] ?? m[2] ?? m[3];
      if (!napis || !napis.trim() || NIE_TLUMACZYMY.has(napis)) continue;
      if (!(napis in SLOWNIK)) continue;   /* nieprzetłumaczone pilnuje tamten test */
      if (!uzyte.has(napis)) uzyte.set(napis, new Set());
      uzyte.get(napis).add(p);
    }
  }
}

/* Tytuły kart są wołane nie przez t(), tylko przez powłokę (document.title),
   więc dla sprawdzenia „martwych pozycji” liczą się jako używane. */
for (const p of PLIKI.filter(f => f.endsWith(".html"))) {
  const m = readFileSync(new URL(p, KORZEN), "utf8").match(/<title>([^<]+)<\/title>/);
  if (!m) continue;
  const tytul = m[1].trim();
  if (NIE_TLUMACZYMY.has(tytul)) continue;
  if (!uzyte.has(tytul)) uzyte.set(tytul, new Set());
  uzyte.get(tytul).add(p);
}

test("każde t(\"…\") ma pozycję w słowniku", () => {
  const brak = [...uzyte.keys()].filter(n => !(n in SLOWNIK));
  prawda(brak.length === 0,
    `${brak.length} napisów bez tłumaczenia:\n       ` +
    brak.slice(0, 12).map(n => `„${n}” (${[...uzyte.get(n)].join(", ")})`).join("\n       "));
});

test("żadne tłumaczenie nie jest puste", () => {
  const puste = Object.entries(SLOWNIK).filter(([, v]) => typeof v !== "string" || !v.trim());
  prawda(puste.length === 0, `puste tłumaczenia: ${puste.map(([k]) => k).join(", ")}`);
});

/* WSTAWKI. Tłumaczenie, które zgubi `{ile}`, pokaże zdanie bez liczby; tłumaczenie
   z literówką `{ilee}` pokaże goły nawias. Oba psują się tylko w jednym języku,
   więc Polak ich nie zobaczy nigdy. */
test("wstawki w tłumaczeniu są dokładnie te same co w kluczu", () => {
  const wstawkiZ = n => [...n.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(",");
  const zle = Object.entries(SLOWNIK).filter(([k, v]) => wstawkiZ(k) !== wstawkiZ(v));
  prawda(zle.length === 0,
    `${zle.length} tłumaczeń z innymi wstawkami niż klucz: ` +
    zle.slice(0, 6).map(([k, v]) => `„${k}” → „${v}”`).join(", "));
});

test("napis ze wstawką zawsze dostaje wartości", () => {
  const bez = [];
  for (const p of PLIKI) {
    const tekst = bezKomentarzy(readFileSync(new URL(p, KORZEN), "utf8"), p.endsWith(".html"));
    /* `napis("…{x}…")` jest tu wyjątkiem z definicji: wartości dostaje później, przy t(). */
    for (const m of tekst.matchAll(/\b(?:t|tb)\(\s*(?:'([^'\\\n]*)'|"([^"\\\n]*)")\s*\)/g)) {
      const napis = m[1] ?? m[2];
      if (/\{\w+\}/.test(napis)) bez.push(`„${napis}” (${p})`);
    }
  }
  prawda(bez.length === 0, `wstawka bez wartości — na ekranie zostanie goły nawias: ${bez.join(", ")}`);
});

test("słownik nie trzyma martwych pozycji", () => {
  const martwe = Object.keys(SLOWNIK).filter(k => !uzyte.has(k));
  prawda(martwe.length === 0,
    `${martwe.length} pozycji, których nikt nie woła: ${martwe.slice(0, 10).map(k => `„${k}”`).join(", ")}`);
});

/* --------------------------------------------------------------------
   GOŁY TEKST W PRZEROBIONYM EKRANIE

   Tekst między znacznikami i statyczne aria-label / placeholder / title.
   Jednoznakowe napisy pomijamy — „i” na przycisku pomocy jest ikoną
   zrobioną z litery, nie zdaniem do przetłumaczenia.
   -------------------------------------------------------------------- */
const LITERA = /[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/;

function goleNapisy(zrodlo) {
  let t = bezKomentarzy(zrodlo, true)
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    /* Napis zapasowy w <span x-text … data-zapas>. Stoi tam CELOWO po polsku:
       x-text nadpisuje go, gdy działa, a gdy wyrażenie się wywali, człowiek widzi
       napis zamiast pustego prostokąta (v87). Tłumaczenie i tak jest wymuszone —
       to samo t() siedzi w atrybucie i przechodzi przez sprawdzenie pierwsze. */
    .replace(/<span[^>]*\bdata-zapas\b[^>]*>[\s\S]*?<\/span>/g, " ")
    /* <title> sprawdzamy osobno niżej — leży w <head>, poza zasięgiem Alpine,
       więc nie ma jak go owinąć w t() i nie ma sensu tu o to pytać. */
    .replace(/<title>[\s\S]*?<\/title>/g, " ");
  const znalezione = [];
  /* Tekst poza znacznikami. Dzielimy na znacznikach, więc atrybuty
     (i wyrażenia Alpine w nich) nie trafiają tu w ogóle. */
  /* Znacznik kończy się na `>`, ale nie na takim w cudzysłowie. Bez tego
     `:class="a > b ? …"` rozcina wyrażenie i jego druga połowa wygląda
     jak tekst na stronie. Ten sam błąd zrobiłem najpierw w narzędziu do
     owijania — dlatego stoi tu opisany, a nie tylko poprawiony. */
  for (const kawalek of t.split(/<[^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/)) {
    const czysty = kawalek.replace(/&[a-z]+;/g, " ").trim();
    if (czysty.length > 1 && LITERA.test(czysty) && !NIE_TLUMACZYMY.has(czysty))
      znalezione.push(czysty);
  }
  /* Statyczne atrybuty tekstowe — te też widzi człowiek (i czytnik ekranu). */
  for (const m of t.matchAll(/\s(?:aria-label|placeholder|title|alt)="([^"]+)"/g)) {
    if (m[1].trim().length > 1 && LITERA.test(m[1])) znalezione.push(m[1].trim());
  }
  return znalezione;
}

test("tytuł karty każdego ekranu ma tłumaczenie", () => {
  const brak = [];
  for (const p of PLIKI.filter(f => f.endsWith(".html"))) {
    const m = readFileSync(new URL(p, KORZEN), "utf8").match(/<title>([^<]+)<\/title>/);
    if (!m) continue;
    const tytul = m[1].trim();
    if (NIE_TLUMACZYMY.has(tytul)) continue;
    if (!(tytul in SLOWNIK)) brak.push(`„${tytul}” (${p})`);
  }
  prawda(brak.length === 0, `tytuły kart bez tłumaczenia: ${brak.join(", ")}`);
});

/* --------------------------------------------------------------------
   NAPIS SCHOWANY W WYRAŻENIU

   `x-text="`na ${danie.porcje} os.`"`, `:aria-label="`Usuń ${d.imie} ze stołu`"`.
   Dla sprawdzenia gołego tekstu to atrybut, więc pomija go w całości, a dla
   sprawdzenia t("…") to w ogóle nie jest wywołanie. 11 września było takich
   miejsc ponad czterdzieści, na ośmiu ekranach — każde po polsku na angielskim
   ekranie i żadne niewidoczne dla testów (pułapka 37 w szerszej postaci).

   Liczy się każdy napis w cudzysłowie albo w backtickach, który ma w sobie
   słowo i nie jest pierwszym argumentem t(). Wyjątki są wąskie i nazwane:
   porównania (`=== 'poprawka'` to wartość z bazy, nie tekst na ekranie)
   i jednostki, które brzmią tak samo w obu językach.
   -------------------------------------------------------------------- */
const TAKIE_SAME = new Set(["kcal", "min"]);

function napisyWWyrazeniach(zrodlo) {
  const bez = zrodlo.replace(/<script[\s\S]*?<\/script>/g, m => m.replace(/[^\n]/g, " "));
  const wynik = [];
  for (const m of bez.matchAll(/\s(?:x-text|x-html|:aria-label|:title|:placeholder|:alt|x-bind:aria-label|x-bind:title)\s*=\s*"([^"]*)"/g)) {
    const linia = bez.slice(0, m.index).split("\n").length;
    const wyr = m[1]
      .replace(/\bt\(\s*'(?:[^'\\]|\\.)*'/g, "t(")
      .replace(/(?:===|!==|==|!=)\s*'[^']*'/g, " ")
      .replace(/'[^']*'\s*(?:===|!==|==|!=)/g, " ");
    for (const s of wyr.matchAll(/'([^']*)'|`([^`]*)`/g)) {
      const napis = (s[1] ?? s[2]).replace(/\$\{[^}]*\}/g, " ").trim();
      if (!/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{2}/.test(napis) || TAKIE_SAME.has(napis)) continue;
      wynik.push(`${linia}: „${napis.slice(0, 60)}”`);
    }
  }
  return wynik;
}

/* --------------------------------------------------------------------
   POLE Z DANYCH MODUŁU NA EKRANIE BEZ t()

   `x-text="w.etykieta"` — napis leży w module po polsku (tak ma być: pułapka 34),
   słownik go zna, test na martwe pozycje go widzi przez napis(), a ekran i tak
   pokazuje polski, bo nikt nie zawołał t(). Tak wyglądały wykluczenia na
   angielskim stole do 11 września (zrzut Miłosza) — każdy strażnik zielony.

   Nazwy dań i produktów (`.nazwa`, `.produkt`) nie są tu sprawdzane: to treść,
   nie interfejs — sesja B.
   -------------------------------------------------------------------- */
const POLA_TEKSTOWE = /(?<![\w.])((?:[\w$]+(?:\?\.|\.))+(?:etykieta|opis|tytul|tresc|tekst|bezSkladnikow|reakcja))\b/g;
/* Wyjątki z nazwy: pole już przetłumaczone w chwili liczenia. */
const POLE_JUZ_PRZETLUMACZONE = new Set([
  "zakupy.html|w.opis",   // opisZapasu(…, t) w getterze zawartoscSpizarni — getter liczy się przy każdym rysowaniu
]);

function golePola(zrodlo, plik) {
  const bez = zrodlo.replace(/<script[\s\S]*?<\/script>/g, m => m.replace(/[^\n]/g, " "));
  const wynik = [];
  for (const m of bez.matchAll(/\s(?:x-text|x-html|:aria-label|:title|:placeholder|:alt)\s*=\s*"([^"]*)"/g)) {
    const linia = bez.slice(0, m.index).split("\n").length;
    for (const p of m[1].matchAll(POLA_TEKSTOWE)) {
      const przed = m[1].slice(0, p.index);
      if (/\bt\(\s*$/.test(przed) || /\bbezSierot\(\s*t\(\s*$/.test(przed)) continue;
      if (POLE_JUZ_PRZETLUMACZONE.has(`${plik}|${p[1]}`)) continue;
      wynik.push(`${linia}: ${p[1]}`);
    }
  }
  return wynik;
}

for (const plik of PRZEROBIONE) {
  test(`${plik}: pola tekstowe z danych idą przez t()`, () => {
    const gole = golePola(readFileSync(new URL(plik, KORZEN), "utf8"), plik);
    prawda(gole.length === 0, `${gole.length} pól pokazanych bez t(): ${gole.join(", ")}`);
  });
}

for (const plik of PRZEROBIONE) {
  test(`${plik}: żadnego napisu schowanego w wyrażeniu poza t()`, () => {
    const schowane = napisyWWyrazeniach(readFileSync(new URL(plik, KORZEN), "utf8"));
    prawda(schowane.length === 0,
      `${schowane.length} napisów w wyrażeniach:\n       ` + schowane.slice(0, 15).join("\n       "));
  });
}

for (const plik of PRZEROBIONE) {
  test(`${plik}: żadnego gołego napisu poza t()`, () => {
    const gole = goleNapisy(readFileSync(new URL(plik, KORZEN), "utf8"));
    prawda(gole.length === 0,
      `${gole.length} napisów poza t():\n       ` +
      gole.slice(0, 12).map(n => `„${n.slice(0, 70)}”`).join("\n       "));
  });
}

console.log(`\n  zdane: ${zdane}, oblane: ${oblane}`);
process.exit(oblane ? 1 : 0);
