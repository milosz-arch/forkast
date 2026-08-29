/* =====================================================================
   Funkcja rozmawiająca z Gemini — założenia, które psują się po cichu.

   Ten zestaw czyta plik jako TEKST i wie o tym. Nie sprawdza, czy funkcja
   działa; sprawdza cztery rzeczy, których złamanie nie daje żadnego objawu
   poza tym, że coś trwa dłużej albo przestaje działać u jednej osoby.
   To jest cały powód, dla którego on istnieje: awaria po stronie czasu
   nie rzuca wyjątkiem i nie zapala się na czerwono.

   1. Własny budżet czasu musi być KRÓTSZY niż limit Netlify (10 s). Gdy jest
      dłuższy albo znika, funkcję ubija Netlify i odsyła stronę błędu w HTML-u —
      przeglądarka dostaje coś, co nie jest JSON-em, i człowiek widzi komunikat
      o internecie przy działającym internecie.

   2. Każdy model na liście musi deklarować, czy przyjmuje ustawienie budżetu
      myślenia. Dopisanie modelu bez tego pola daje `undefined`, czyli fałsz,
      czyli myślenie zostaje WŁĄCZONE — i jedyny objaw to sekundy.

   3. Ustawienie budżetu myślenia musi być wysyłane warunkowo. Wysłane wszystkim
      wywala modele starsze błędem 400, a one są tu jako siatka bezpieczeństwa.

   4. Zmierzone czasy muszą wracać także przy UDANEJ odpowiedzi. Pomiar widoczny
      wyłącznie po awarii nigdy nie powie, ile zostało zapasu do limitu.
   ===================================================================== */

import { readFileSync } from "fs";

const PLIK = new URL("../netlify/functions/zapytaj-ai.js", import.meta.url);
const kod = readFileSync(PLIK, "utf8");

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(warunek, opis) {
  if (!warunek) throw new Error(opis);
}

/* Limit Netlify dla funkcji synchronicznej. Nie parametr — fakt o platformie. */
const LIMIT_NETLIFY_MS = 10000;

test("budżet czasu jest zadeklarowany", () => {
  prawda(/const BUDZET_MS\s*=\s*\d+/.test(kod),
    "nie ma stałej BUDZET_MS — funkcja nie pilnuje własnego czasu");
});

test("budżet czasu ma co najmniej sekundę zapasu do limitu Netlify", () => {
  const m = kod.match(/const BUDZET_MS\s*=\s*(\d+)/);
  prawda(m, "nie ma stałej BUDZET_MS");
  const budzet = Number(m[1]);
  prawda(budzet <= LIMIT_NETLIFY_MS - 1000,
    `BUDZET_MS = ${budzet}; przy limicie ${LIMIT_NETLIFY_MS} ms zapas jest za mały, ` +
    `żeby zdążyć zwrócić odpowiedź`);
});

test("każdy model zapasowy deklaruje, czy przyjmuje budżet myślenia", () => {
  const tabela = kod.match(/const MODELE_ZAPASOWE\s*=\s*\[([\s\S]*?)\];/);
  prawda(tabela, "nie ma listy MODELE_ZAPASOWE");
  const wpisy = tabela[1].split("\n").filter(l => l.includes("nazwa:"));
  prawda(wpisy.length > 0, "lista modeli jest pusta");
  const bezFlagi = wpisy.filter(l => !/\bmysli:\s*(true|false)\b/.test(l));
  prawda(bezFlagi.length === 0,
    `modele bez pola mysli: ${bezFlagi.map(l => l.trim()).join(" | ")}`);
});

test("budżet myślenia wysyłany jest warunkowo, nie wszystkim", () => {
  prawda(/if\s*\(\s*model\.mysli\s*\)/.test(kod),
    "thinkingConfig nie jest obwarowany warunkiem model.mysli — starsze modele odpowiedzą błędem 400");
});

test("zmierzone czasy wracają przy udanej odpowiedzi", () => {
  /* Blok sukcesu poznajemy po tym, że niesie `tekst` — bo tylko udana odpowiedź go ma. */
  const sukces = kod.match(/statusCode:\s*200[\s\S]{0,400}/);
  prawda(sukces, "nie ma odpowiedzi ze statusem 200");
  prawda(/czasy:/.test(sukces[0]),
    "udana odpowiedź nie niesie pola czasy — pomiaru nie da się zobaczyć, gdy wszystko działa");
});

test("przekroczenie własnego budżetu zwraca JSON, nie milczenie", () => {
  prawda(/statusCode:\s*504/.test(kod),
    "nie ma odpowiedzi 504 — po przekroczeniu budżetu apka nie dowie się, że to był czas");
});

test("komunikat o przekroczeniu czasu podaje, ile to trwało", () => {
  const blok = kod.match(/statusCode:\s*504[\s\S]{0,300}/);
  prawda(blok && /sek\(/.test(blok[0]),
    "komunikat 504 nie zawiera zmierzonego czasu — powód bez liczby jest wart tyle co brak powodu");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
