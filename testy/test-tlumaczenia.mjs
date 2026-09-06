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
const WOLANIA = /\b(?:t|tb)\(\s*(?:'([^'\\\n]*)'|"([^"\\\n]*)")\s*\)/g;

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
