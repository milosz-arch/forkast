/* =====================================================================
   Rozmowa z Gemini — założenia, które psują się po cichu.

   Są tu DWIE funkcje robiące to samo, i to jest stan przejściowy, nie projekt:
   brzegowa (`netlify/edge-functions/`) jest tą żywą, synchroniczna
   (`netlify/functions/`) została jeszcze na jedno wdrożenie, żeby telefon
   z niezaktualizowaną kopią plików nie został z niczym. Do skasowania,
   gdy brzegowa się potwierdzi.

   Ten zestaw czyta pliki jako TEKST i wie o tym. Nie sprawdza, czy cokolwiek
   działa; sprawdza rzeczy, których złamanie nie daje ŻADNEGO objawu poza tym,
   że coś trwa dłużej albo przestaje działać u jednej osoby. To jest cały powód,
   dla którego on istnieje: awaria po stronie czasu nie rzuca wyjątkiem.

   Najważniejszy jest tu test adresu. Apka puka pod adres wpisany w HTML-u,
   a funkcja brzegowa nasłuchuje pod adresem wpisanym w sobie. Gdy te dwa
   napisy się rozjadą, nie zapali się nic — przyjdzie 404, a człowiek zobaczy
   „nie udało się połączyć, sprawdź internet” przy działającym internecie.
   ===================================================================== */

import { readFileSync } from "fs";

const czytaj = (sciezka) => readFileSync(new URL(sciezka, import.meta.url), "utf8");

const brzeg  = czytaj("../netlify/edge-functions/zapytaj-ai.js");
const synchr = czytaj("../netlify/functions/zapytaj-ai.js");
const ekran  = czytaj("../dodaj-z-ai.html");
const toml   = czytaj("../netlify.toml");

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(warunek, opis) {
  if (!warunek) throw new Error(opis);
}

/* Limity platformy, nie nasze parametry. Funkcja synchroniczna ginie po dziesięciu
   sekundach; brzegowa musi zdążyć odesłać nagłówki w czterdziestu. */
const LIMIT_SYNCHRONICZNEJ_MS = 10000;
const LIMIT_BRZEGOWEJ_MS = 40000;

/* ---------- adres: jedyna rzecz łącząca ekran z funkcją ---------- */

test("adres w apce zgadza się z adresem, pod którym nasłuchuje funkcja brzegowa", () => {
  const wKodzie = brzeg.match(/export const config\s*=\s*\{[^}]*path:\s*["']([^"']+)["']/);
  prawda(wKodzie, "funkcja brzegowa nie deklaruje ścieżki w export const config");
  const wEkranie = ekran.match(/fetch\(\s*["'](\/[^"']*zapytaj-ai)["']/);
  prawda(wEkranie, "ekran dodawania nie woła żadnego adresu zapytaj-ai");
  prawda(wKodzie[1] === wEkranie[1],
    `apka puka pod ${wEkranie[1]}, a funkcja nasłuchuje pod ${wKodzie[1]} — to da 404, nie błąd`);
});

test("netlify.toml wskazuje katalog funkcji brzegowych", () => {
  prawda(/edge_functions\s*=/.test(toml),
    "bez wpisu edge_functions Netlify potraktuje ten katalog jak zwykły folder z plikami");
});

/* ---------- czas ---------- */

test("funkcja brzegowa ma budżet czasu", () => {
  prawda(/const BUDZET_MS\s*=\s*\d+/.test(brzeg), "brak stałej BUDZET_MS w funkcji brzegowej");
});

test("budżet brzegowej mieści się w limicie na odesłanie nagłówków", () => {
  const budzet = Number(brzeg.match(/const BUDZET_MS\s*=\s*(\d+)/)[1]);
  prawda(budzet <= LIMIT_BRZEGOWEJ_MS - 5000,
    `BUDZET_MS = ${budzet}; przy limicie ${LIMIT_BRZEGOWEJ_MS} ms zapas jest za mały`);
});

test("budżet brzegowej jest większy niż limit funkcji synchronicznej", () => {
  const budzet = Number(brzeg.match(/const BUDZET_MS\s*=\s*(\d+)/)[1]);
  prawda(budzet > LIMIT_SYNCHRONICZNEJ_MS,
    `BUDZET_MS = ${budzet} — przeniesienie na brzeg sieci nie dało nic, ` +
    `bo budżet nadal mieści się w starym suficie`);
});

test("budżet synchronicznej ma sekundę zapasu do limitu Netlify", () => {
  const budzet = Number(synchr.match(/const BUDZET_MS\s*=\s*(\d+)/)[1]);
  prawda(budzet <= LIMIT_SYNCHRONICZNEJ_MS - 1000,
    `BUDZET_MS = ${budzet}; zapas za mały, żeby zdążyć zwrócić odpowiedź`);
});

/* ---------- myślenie modelu ---------- */

for (const [nazwa, kod] of [["brzegowa", brzeg], ["synchroniczna", synchr]]) {
  test(`${nazwa}: każdy model deklaruje, czy przyjmuje budżet myślenia`, () => {
    const tabela = kod.match(/const MODELE_ZAPASOWE\s*=\s*\[([\s\S]*?)\];/);
    prawda(tabela, "nie ma listy MODELE_ZAPASOWE");
    const wpisy = tabela[1].split("\n").filter(l => l.includes("nazwa:"));
    prawda(wpisy.length > 0, "lista modeli jest pusta");
    const bezFlagi = wpisy.filter(l => !/\bmysli:\s*(true|false)\b/.test(l));
    prawda(bezFlagi.length === 0,
      `modele bez pola mysli: ${bezFlagi.map(l => l.trim()).join(" | ")}`);
  });

  test(`${nazwa}: budżet myślenia wysyłany warunkowo, nie wszystkim`, () => {
    prawda(/if\s*\(\s*model\.mysli\s*\)/.test(kod),
      "thinkingConfig bez warunku model.mysli — starsze modele odpowiedzą błędem 400");
  });

  test(`${nazwa}: zmierzone czasy wracają przy udanej odpowiedzi`, () => {
    const sukces = kod.match(/(statusCode:\s*200|odpowiedz\(200)[\s\S]{0,400}/);
    prawda(sukces, "nie ma odpowiedzi ze statusem 200");
    prawda(/czasy:/.test(sukces[0]),
      "udana odpowiedź nie niesie pola czasy — pomiaru nie widać, gdy wszystko działa");
  });

  test(`${nazwa}: przekroczenie budżetu zwraca 504 z liczbą sekund`, () => {
    const blok = kod.match(/(statusCode:\s*504|odpowiedz\(504)[\s\S]{0,300}/);
    prawda(blok, "nie ma odpowiedzi 504 — apka nie dowie się, że to był czas");
    prawda(/sek\(/.test(blok[0]),
      "komunikat 504 nie zawiera zmierzonego czasu — powód bez liczby jest wart tyle co brak powodu");
  });
}

/* ---------- limit czasu procesora na brzegu ---------- */

test("funkcja brzegowa nie przetwarza bajtów zdjęć", () => {
  /* Pięćdziesiąt milisekund CZASU PROCESORA to jedyny twardy limit na brzegu.
     Czekanie na sieć się nie liczy, ale pętla po bajtach obrazu owszem —
     i wywali funkcję przy większym zdjęciu, bez związku z jakością połączenia. */
  prawda(!/atob\(|btoa\(|Uint8Array|fromCharCode/.test(brzeg),
    "funkcja brzegowa dotyka bajtów obrazu — to jedzie na limit 50 ms czasu procesora");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
