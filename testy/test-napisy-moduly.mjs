/* =====================================================================
   NAPISY, KTÓRE MIESZKAJĄ W MODUŁACH — ŚLEPA PLAMKA STRAŻNIKA TŁUMACZEŃ

   `test-tlumaczenia.mjs` czyta ekrany i zaczyna od wycięcia bloków
   <script>, a plików .js nie ogląda pod kątem widocznych napisów w ogóle.
   To jest szczelne dla tego, co owinięto w t() — i całkiem ślepe na tekst,
   który trafia na ekran inną drogą: komunikat z mrugnij(), etykieta pozycji
   w liście, nazwa zakładki.

   Kosztowało to już raz: pasek nawigacji pokazywał przy angielskim stole
   „Dania | Jadłospis | Zakupy | Przepisy | Dodaj | Settings" — pięć etykiet
   po polsku, szósta po angielsku, na wszystkich ośmiu ekranach. Wszystkie
   testy były zielone, bo etykiety leżą w ZAKLADKI w powloka.js jako zwykłe
   napisy i nie przechodzą przez t().

   Ten test nie żąda, żeby wszystko było przetłumaczone — sesja A wprost
   odłożyła komunikaty i teksty modułów na później. Żąda czegoś innego:
   ŻEBY TO BYŁO WYPISANE. Każdy napis w miejscu, które trafia na ekran,
   musi być albo w słowniku, albo na liście JESZCZE_PO_POLSKU niżej.
   Napis, który nie jest ani tu, ani tam, oblewa test — więc nowy polski
   komunikat nie wejdzie do kodu po cichu, a lista jest inwentarzem tego,
   co zostało do zrobienia, zamiast ciszy.

   Drugie sprawdzenie pilnuje listy od drugiej strony: pozycja, której już
   nie ma w kodzie, oblewa. Bez tego lista rosłaby w nieskończoność
   i po dwóch sesjach nikt by jej nie ufał.

   SABOTAŻ: dopisany nowy komunikat po polsku w module → oblewa sprawdzenie
   pierwsze. Skasowana pozycja z listy przy nietkniętym kodzie → oblewa
   pierwsze. Skasowany napis z modułu przy nietkniętej liście → oblewa drugie.
   ===================================================================== */

import { readdirSync, readFileSync } from "node:fs";
import { SLOWNIK } from "../tlumaczenia.js";

const KORZEN = new URL("../", import.meta.url);

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(w, co) { if (!w) throw new Error(co); }

/* Nazwy własne i nazwy języków (decyzja 118): marka brzmi tak samo w obu
   wersjach, a „Polski" i „English" mają z założenia stać w swoim własnym
   języku — po to, żeby dało się je rozpoznać, nie znając drugiego. */
const NIE_TLUMACZYMY = new Set(["Forkast", "Polski", "English"]);

/* PLIKI, KTÓRYCH NIE SKANUJEMY — każdy z nazwanego powodu. Dopisanie pliku tutaj
   jest decyzją, więc powód stoi obok, a nie w pamięci. */
const POMIJANE = new Map([
  ["talia-startowa.js", "dane: dania startowe — sesja B"],
  ["produkty.js", "dane: słownik produktów — sesja B"],
  ["tlumaczenia.js", "sam słownik"],
  ["sw.js", "lista plików offline, nie tekst"],
  ["prompt.js", "rozmowa z AI jest po polsku — sesja C"],
  ["parser.js", "uwagi o odpowiedzi AI wracają do AI jako poprawka — sesja C"],
  ["talia-en.js", "angielska warstwa dań — pilnuje test-talia-en.mjs"],
  ["produkty-en.js", "angielskie nazwy produktów — pilnuje test-talia-en.mjs"],
]);

/* SKAN OD 11 WRZEŚNIA: KAŻDY NAPIS, NIE TYLKO TEN W ZNANYM GNIEŹDZIE.

   Do v88 ten test szukał napisów w kilku znanych miejscach (`mrugnij("…")`,
   `etykieta: "…"`, `komunikat = "…"`). Przepuszczał wszystko, co szło na ekran
   inną drogą: szablony z liczbą (`Pobrano ${n} dań.`), trójargumentowe
   przypisania (`stanSieci = x ? "…" : "…"`), teksty sklejane z kilku linijek
   (okienka pomocy), zwracane z funkcji (zachęta pod paskiem, stany spiżarni).
   11 września takich napisów było ponad trzysta, a lista „jeszcze po polsku”
   pokazywała 88 — czyli trzy razy mniej niż prawda.

   Teraz liczy się każdy napis w kodzie, który ma w sobie słowo. Z góry i z nazwy
   wypadają tylko: komentarze, `console.*`, treść `new Error(…)` (to diagnostyka
   dla dewelopera — na ekran trafia co najwyżej jako {powod}), pierwszy argument
   t()/tb()/napis() (ten pilnuje test-tlumaczenia), porównania (`=== "poprawka"`
   to wartość, nie tekst), klucze obiektów, klasy CSS i bloki opisane niżej.
   Klasyczne <script> na ekranach też wypadają: to bezpiecznik białego ekranu,
   który działa właśnie wtedy, gdy moduły nie wstały, i ma własną parę PL/EN. */
const LITERA_PL = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const DWA_SLOWA = /[A-Za-z]{2,}\s+[A-Za-z]{2,}/;
const TOKEN_KODU = /^[a-z0-9\-:\/\[\]\.%#()_=,>*!@'"&;+?]+$/;

function wymaz(t) { return t.replace(/[^\n]/g, " "); }

/* Bloki, które są tekstem, ale nie dla człowieka przy tej apce. */
const BLOKI = [
  ["kuchnia.js", /export function opisKuchni[\s\S]*$/, "opis kuchni idzie do promptu AI — sesja C"],
  ["wykluczenia.js", /export const TAGI_PRODUKTOW\s*=\s*\{[\s\S]*?\n\};/, "nazwy produktów to klucze dopasowania, nie napisy"],
  ["jadlospis.html", /const DNI_PL = \[[\s\S]*?\];\s*const MIES_PL = \[[\s\S]*?\];/, "polska ścieżka daty; angielską składa przeglądarka (Intl)"],
];

function oczysc(tekst, plik) {
  let t = tekst
    .replace(/\/\*[\s\S]*?\*\//g, wymaz)
    .replace(/(^|[\s;{}(,])\/\/[^\n]*/gm, (m, p) => p + wymaz(m.slice(p.length)));
  for (const [p, wzor] of BLOKI) if (p === plik) t = t.replace(wzor, wymaz);
  return t
    .replace(/console\.\w+\([\s\S]*?\);/g, wymaz)
    .replace(/new \w*Error\(\s*(?:`[^`]*`|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g, wymaz)
    .replace(/\b(?:t|tb|napis)\(\s*(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/g, wymaz)
    .replace(/(?:===|!==|==|!=)\s*(?:"[^"\n]*"|'[^'\n]*')/g, wymaz)
    .replace(/(?:"[^"\n]*"|'[^'\n]*')\s*(?:===|!==)/g, wymaz)
    .replace(/([{,]\s*)("[^"\n]*"|'[^'\n]*')(\s*:)/g, (m, a, b, c) => a + wymaz(b) + c);
}

function napisyWKodzie(tekst, plik) {
  const czysty = oczysc(tekst, plik);
  const wynik = [];
  for (const m of czysty.matchAll(/"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`([^`]*)`/g)) {
    const surowy = m[1] ?? m[2] ?? m[3];
    const tresc = surowy.replace(/\$\{[^}]*\}/g, " ").replace(/<[^>]*>/g, " ");
    if (!LITERA_PL.test(tresc) && !DWA_SLOWA.test(tresc)) continue;
    /* Klasy CSS i selektory: same małe litery, cyfry i znaki kodu, a wśród nich
       choć jeden myślnik, dwukropek albo nawias. „czytanie odpowiedzi” też jest
       z samych małych liter — ale bez znaku kodu, więc to tekst. */
    if (!LITERA_PL.test(tresc) && /[-:\[\]=\/]/.test(tresc) &&
        tresc.trim().split(/\s+/).every(s => TOKEN_KODU.test(s))) continue;
    const napis = surowy.replace(/\$\{[^}]*\}/g, "{…}").trim();
    if (napis in SLOWNIK || NIE_TLUMACZYMY.has(napis)) continue;
    wynik.push({ napis, linia: czysty.slice(0, m.index).split("\n").length });
  }
  return wynik;
}

const PLIKI = readdirSync(KORZEN)
  .filter(p => (p.endsWith(".js") && !POMIJANE.has(p)) || p.endsWith(".html"))
  .sort();

/* Pusty albo zawężony zbiór to najczęstszy sposób, w jaki test w tym projekcie
   przestawał cokolwiek sprawdzać (decyzje 64, 72, 96). Twardy próg zamiast ciszy. */
prawda(PLIKI.length > 20, `spodziewałem się kilkudziesięciu plików, jest ${PLIKI.length}`);

const znalezione = new Map();   // napis → pliki z liniami
let wszystkichNapisow = 0;
for (const p of PLIKI) {
  let tekst = readFileSync(new URL(p, KORZEN), "utf8");
  if (p.endsWith(".html"))
    tekst = tekst.replace(/<script type="module">([\s\S]*?)<\/script>|[^\n]/g, (m, kod) => kod !== undefined ? `                        ${kod}         ` : " ");
  for (const m of tekst.matchAll(/"(?:[^"\\\n]|\\.)*"|`[^`]*`/g)) if (LITERA_PL.test(m[0])) wszystkichNapisow++;
  for (const { napis, linia } of napisyWKodzie(tekst, p)) {
    if (!znalezione.has(napis)) znalezione.set(napis, []);
    znalezione.get(napis).push(`${p}:${linia}`);
  }
}

/* Sam skaner też musi coś widzieć — inaczej zero znalezisk znaczyłoby tylko,
   że wzorzec przestał pasować do czegokolwiek. */
prawda(wszystkichNapisow > 300, `skaner widzi podejrzanie mało napisów z polskimi literami: ${wszystkichNapisow}`);

/* CO ZOSTAŁO PO POLSKU — świadomie, każda grupa z powodem.
   Ta lista ma maleć. Dopisanie tu czegoś jest decyzją, nie przypadkiem. */
const JESZCZE_PO_POLSKU = new Set([
  /* automat.js — wewnętrzny opis braku dania. Ekran jadłospisu wyciąga z niego
     typ posiłku i składa własny, przetłumaczony komunikat; tego tekstu nikt nie czyta. */
  "Brak dania na \"{…}\" w dniu {…} —",
  "wszystkie pasujące dania wyczerpały limit powtórzeń.",
  "nic polubionego nie pasuje do tego typu posiłku.",

  /* Nazwy etapów diagnostycznych (pułapka 26). Na ekran trafiają tylko w nawiasie
     przy błędzie — po to, żeby zrzut ekranu wysłany Miłoszowi mówił, gdzie padło.
     Czytelnikiem jest ten, kto naprawia, nie ten, kto gotuje. */
  "pytanie AI",
  "czytanie odpowiedzi",
  "poprawka AI",
  "czytanie poprawki",
  "zapis nowych produktów",
  "zapis wersji",
  "wypakowanie funkcji bazy",
  "budowanie ścieżki",
  "zakładanie nasłuchu",
]);

test("każdy napis w kodzie jest w słowniku albo na liście", () => {
  const nieznane = [...znalezione.keys()].filter(n => !JESZCZE_PO_POLSKU.has(n));
  prawda(nieznane.length === 0,
    `${nieznane.length} napisów spoza słownika i spoza listy:\n       ` +
    nieznane.slice(0, 15).map(n => `„${n.slice(0, 70)}” (${znalezione.get(n).slice(0, 3).join(", ")})`).join("\n       "));
});

test("lista „jeszcze po polsku” nie trzyma pozycji, których nie ma w kodzie", () => {
  const martwe = [...JESZCZE_PO_POLSKU].filter(n => !znalezione.has(n));
  prawda(martwe.length === 0,
    `${martwe.length} pozycji bez odpowiednika w kodzie: ` +
    martwe.slice(0, 10).map(n => `„${n.slice(0, 60)}”`).join(", "));
});

test("pasek nawigacji idzie przez t() na każdym ekranie", () => {
  const bez = [];
  for (const p of PLIKI.filter(f => f.endsWith(".html"))) {
    const tekst = readFileSync(new URL(p, KORZEN), "utf8");
    if (!tekst.includes("z in zakladki")) continue;
    if (tekst.includes('x-text="z.nazwa"')) bez.push(p);
  }
  prawda(bez.length === 0, `etykiety zakładek poza t(): ${bez.join(", ")}`);
});

/* --------------------------------------------------------------------
   PUSTY PRZYCISK

   14 września na iPhonie trzy przyciski renderowały się jako gołe kolorowe
   prostokąty: „Przejdź do aplikacji" na wejściu, „Ułóż jadłospis" na Daniach
   i „Przejrzyj dania jeszcze raz" w Ustawieniach. Wszystkie trzy to odnośniki
   z `x-text` powieszonym WPROST na <a>. Wszystko obok — te same napisy w <button>
   i w <span> wewnątrz <a> — rysowało się normalnie, na tym samym ekranie,
   w tym samym wydaniu. W Chromium na komputerze wszystkie trzy działały.

   Mechanizmu po stronie Safari nie znam i tego nie udaję. Znam wzorzec: trzy
   trafienia, zero wyjątków, i drugi wzorzec, który u tego samego człowieka
   działa. Więc napis wchodzi do <span> w środku odnośnika, dokładnie tak jak
   w pasku nawigacji — a w środku tego <span> stoi polski tekst jako zapas.
   x-text nadpisuje go, kiedy działa; kiedy się wywali, człowiek czyta napis
   zamiast patrzeć na pusty prostokąt.

   Pusty przycisk na PIERWSZYM ekranie to jedyna usterka, po której ktoś
   zamyka apkę i nie wraca. Dlatego to jest test, nie notatka.
   -------------------------------------------------------------------- */
const EKRANY = PLIKI.filter(f => f.endsWith(".html"));

test("żaden <a> nie nosi x-text bezpośrednio", () => {
  const winne = [];
  for (const p of EKRANY) {
    const tekst = readFileSync(new URL(p, KORZEN), "utf8");
    for (const m of tekst.matchAll(/<a\b[^>]*?\sx-text\s*=[^>]*>/gs))
      winne.push(`${p}:${tekst.slice(0, m.index).split("\n").length}`);
  }
  prawda(winne.length === 0,
    `x-text wprost na <a> (na iOS renderuje się pusto — daj <span x-text> w środku): ${winne.join(", ")}`);
});

test("każdy napis zapasowy faktycznie coś mówi", () => {
  let ile = 0;
  const puste = [];
  for (const p of EKRANY) {
    const tekst = readFileSync(new URL(p, KORZEN), "utf8");
    for (const m of tekst.matchAll(/<span[^>]*\bdata-zapas\b[^>]*>([\s\S]*?)<\/span>/g)) {
      ile++;
      if (!m[1].trim()) puste.push(`${p}:${tekst.slice(0, m.index).split("\n").length}`);
    }
  }
  prawda(ile >= 8, `spodziewałem się kilkunastu napisów zapasowych, jest ${ile}`);
  prawda(puste.length === 0, `pusty napis zapasowy — siatka bez siatki: ${puste.join(", ")}`);
});

console.log(`\n  zdane: ${zdane}, oblane: ${oblane}`);
process.exit(oblane ? 1 : 0);
