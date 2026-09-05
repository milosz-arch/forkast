/* =====================================================================
   Rozmowa z Gemini — założenia, które psują się po cichu.

   Ten zestaw czyta pliki jako TEKST i wie o tym. Nie sprawdza, czy cokolwiek
   działa; sprawdza rzeczy, których złamanie nie daje ŻADNEGO objawu poza tym,
   że coś trwa dłużej albo przestaje działać u jednej osoby.

   DWA NAJDROŻSZE BŁĘDY 29 SIERPNIA, oba wyłapane dopiero przez człowieka
   z telefonem w ręku, i oba mają tu teraz swój test:

   1. Na pierwszym miejscu listy modeli stał ALIAS `gemini-flash-latest`. Google
      podmienia go przy każdym nowym wydaniu, więc model zmienił się nam pod ręką
      z szybkiego na eksperymentalny z rodziny 3.x. Nic tego nie zgłosiło.

   2. Rozmyślanie modelu wyłączaliśmy parametrem `thinkingBudget`, którego rodzina
      3.x nie zna — tam zastąpił go `thinkingLevel`. Zły parametr nie daje błędu.
      Daje model myślący na pełnych obrotach i kółko kręcące się 24 sekundy.
      To jest najgorsza klasa awarii w tym projekcie: wygląda jak wolna sieć.

   Najważniejszy jest tu jednak test adresu. Apka puka pod adres wpisany w HTML-u,
   a funkcja nasłuchuje pod adresem wpisanym w sobie. Gdy te dwa napisy się rozjadą,
   nie zapali się nic — przyjdzie 404, a człowiek zobaczy „sprawdź internet”
   przy działającym internecie.
   ===================================================================== */

import { readFileSync } from "fs";

const czytaj = (sciezka) => readFileSync(new URL(sciezka, import.meta.url), "utf8");

const funkcja = czytaj("../netlify/edge-functions/zapytaj-ai.js");
const ekran   = czytaj("../dodaj-z-ai.html");
const toml    = czytaj("../netlify.toml");

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(warunek, opis) {
  if (!warunek) throw new Error(opis);
}

/* Limity platformy, nie nasze parametry. Funkcja brzegowa musi zdążyć odesłać
   nagłówki w czterdziestu sekundach; funkcja synchroniczna ginęła po dziesięciu
   i dlatego jej tu już nie ma. */
const LIMIT_BRZEGOWEJ_MS = 40000;
const LIMIT_SYNCHRONICZNEJ_MS = 10000;

/* Kod BEZ komentarzy. Konieczne, bo komentarze w tym pliku i w samej funkcji
   wymieniają nazwy parametrów z nazwiska — a test szukający nazwy w całym pliku
   znalazłby ją w zdaniu opisującym, że jej tam nie ma. Ta sama pułapka wyłożyła
   pierwszą wersję testu klas: przechodził sabotaż, bo czytał własny komentarz. */
const bezKomentarzy = funkcja
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/(^|[^:])\/\/.*$/gm, "$1");
function wierszeModeli() {
  const tabela = funkcja.match(/const MODELE_ZAPASOWE\s*=\s*\[([\s\S]*?)\];/);
  prawda(tabela, "nie ma listy MODELE_ZAPASOWE");
  const wpisy = tabela[1].split("\n").filter(l => l.includes("nazwa:"));
  prawda(wpisy.length > 0, "lista modeli jest pusta");
  return wpisy;
}

/* ---------- adres: jedyna rzecz łącząca ekran z funkcją ---------- */

test("adres w apce zgadza się z adresem, pod którym nasłuchuje funkcja", () => {
  const wKodzie = funkcja.match(/export const config\s*=\s*\{[^}]*path:\s*["']([^"']+)["']/);
  prawda(wKodzie, "funkcja nie deklaruje ścieżki w export const config");
  const wEkranie = ekran.match(/fetch\(\s*["'](\/[^"']*zapytaj-ai)["']/);
  prawda(wEkranie, "ekran dodawania nie woła żadnego adresu zapytaj-ai");
  prawda(wKodzie[1] === wEkranie[1],
    `apka puka pod ${wEkranie[1]}, a funkcja nasłuchuje pod ${wKodzie[1]} — to da 404, nie błąd`);
});

test("netlify.toml wskazuje katalog funkcji brzegowych", () => {
  prawda(/edge_functions\s*=/.test(toml),
    "bez wpisu edge_functions Netlify potraktuje ten katalog jak zwykły folder z plikami");
});

/* ---------- modele ---------- */

test("pierwszy model na liście jest nazwany z numerem, nie ruchomym aliasem", () => {
  const pierwszy = wierszeModeli()[0];
  prawda(!/latest/.test(pierwszy),
    `pierwszy model to alias: ${pierwszy.trim()} — Google podmienia go przy każdym wydaniu, ` +
    `więc apka zmieni zachowanie bez ani jednej zmiany w kodzie`);
});

test("każdy model deklaruje, którym parametrem wyłącza się jego myślenie", () => {
  const bezPola = wierszeModeli().filter(l => !/\bmyslenie:\s*"(budzet|poziom)"/.test(l));
  prawda(bezPola.length === 0,
    `modele bez pola myslenie: ${bezPola.map(l => l.trim()).join(" | ")}`);
});

test("rodzina modelu zgadza się z nazwą parametru myślenia", () => {
  /* To jest test tego jednego błędu, który kosztował dziś najwięcej: nazwa parametru
     musi pasować do generacji modelu, a niepasująca jest przyjmowana bez słowa skargi. */
  const zle = [];
  for (const w of wierszeModeli()) {
    const nazwa = w.match(/nazwa:\s*"([^"]+)"/)?.[1] || "";
    const rodzaj = w.match(/myslenie:\s*"([^"]+)"/)?.[1] || "";
    if (/gemini-2\.5/.test(nazwa) && rodzaj !== "budzet") zle.push(`${nazwa} → ${rodzaj}`);
    if (/gemini-3/.test(nazwa) && rodzaj !== "poziom") zle.push(`${nazwa} → ${rodzaj}`);
  }
  prawda(zle.length === 0,
    `zła nazwa parametru dla rodziny: ${zle.join("; ")} — rodzina 2.5 zna thinkingBudget, ` +
    `rodzina 3.x zna thinkingLevel i wysłanie złego nie daje błędu, tylko wolną odpowiedź`);
});

test("obie rodziny parametrów są obsłużone w kodzie", () => {
  prawda(/thinkingBudget/.test(bezKomentarzy), "kod nigdzie nie ustawia thinkingBudget (rodzina 2.5)");
  prawda(/thinkingLevel/.test(bezKomentarzy), "kod nigdzie nie ustawia thinkingLevel (rodzina 3.x)");
});

test("nie ma na liście modeli wycofanych", () => {
  /* Gemini 2.0 Flash i Flash-Lite zostały wycofane 1 czerwca 2026. Martwy wpis
     na liście zapasowej nie boli od razu — kosztuje jedną nieudaną próbę
     z budżetu, gdy jest najbardziej potrzebny. */
  const martwe = wierszeModeli().filter(l => /gemini-2\.0/.test(l));
  prawda(martwe.length === 0,
    `na liście są modele wycofane: ${martwe.map(l => l.trim()).join(" | ")}`);
});

/* ---------- czas ---------- */

test("funkcja ma budżet czasu", () => {
  prawda(/const BUDZET_MS\s*=\s*\d+/.test(funkcja), "brak stałej BUDZET_MS");
});

test("budżet mieści się w limicie na odesłanie nagłówków", () => {
  const budzet = Number(funkcja.match(/const BUDZET_MS\s*=\s*(\d+)/)[1]);
  prawda(budzet <= LIMIT_BRZEGOWEJ_MS - 5000,
    `BUDZET_MS = ${budzet}; przy limicie ${LIMIT_BRZEGOWEJ_MS} ms zapas jest za mały`);
});

test("budżet jest większy niż limit funkcji synchronicznej", () => {
  const budzet = Number(funkcja.match(/const BUDZET_MS\s*=\s*(\d+)/)[1]);
  prawda(budzet > LIMIT_SYNCHRONICZNEJ_MS,
    `BUDZET_MS = ${budzet} — przeniesienie na brzeg sieci nie dało nic, ` +
    `bo budżet nadal mieści się w starym suficie`);
});

test("jedna próba nie może zjeść całego budżetu", () => {
  const proba = funkcja.match(/const LIMIT_PROBY_MS\s*=\s*(\d+)/);
  prawda(proba, "brak stałej LIMIT_PROBY_MS — pierwszy wolny model zabierze czas wszystkim");
  const budzet = Number(funkcja.match(/const BUDZET_MS\s*=\s*(\d+)/)[1]);
  prawda(Number(proba[1]) * 2 <= budzet,
    `LIMIT_PROBY_MS = ${proba[1]} przy budżecie ${budzet} — nie starczy nawet na dwie próby`);
});

/* ---------- co widać po awarii ---------- */

test("przekroczenie budżetu zwraca 504 z liczbą sekund", () => {
  const blok = funkcja.match(/odpowiedz\(504[\s\S]{0,400}/);
  prawda(blok, "nie ma odpowiedzi 504 — apka nie dowie się, że to był czas");
  prawda(/sek\(/.test(blok[0]),
    "komunikat 504 bez zmierzonego czasu — powód bez liczby jest wart tyle co brak powodu");
});

test("komunikat po awarii wymienia każdą próbę z osobna", () => {
  const blok = funkcja.match(/odpowiedz\(504[\s\S]{0,400}/);
  prawda(/proby\.map/.test(blok[0]),
    "komunikat nie pokazuje przebiegu prób — jedna nieudana wygląda tak samo jak cztery");
});

test("zmierzone czasy wracają przy udanej odpowiedzi", () => {
  const sukces = funkcja.match(/odpowiedz\(200[\s\S]{0,400}/);
  prawda(sukces, "nie ma odpowiedzi ze statusem 200");
  prawda(/czasy:/.test(sukces[0]),
    "udana odpowiedź nie niesie pola czasy — pomiaru nie widać, gdy wszystko działa");
});

/* ---------- limit czasu procesora na brzegu ---------- */

test("funkcja nie przetwarza bajtów zdjęć", () => {
  /* Pięćdziesiąt milisekund CZASU PROCESORA to jedyny twardy limit na brzegu.
     Czekanie na sieć się nie liczy, ale pętla po bajtach obrazu owszem — i wywali
     funkcję przy większym zdjęciu, bez związku z jakością połączenia. */
  prawda(!/atob\(|btoa\(|Uint8Array|fromCharCode/.test(funkcja),
    "funkcja dotyka bajtów obrazu — to jedzie na limit 50 ms czasu procesora");
});

test("tryb „Link” nie wraca bez narzędzia do czytania stron", () => {
  /* 29 sierpnia ten tryb produkował przepis wyglądający na odczytany ze strony,
     a zmyślony — model nie dostaje narzędzia do jej otwarcia, więc zgaduje danie
     po adresie. Miłosz sprawdził na prawdziwym linku: wrócił zupełnie inny przepis.

     Sam tryb jest odstawiony, ale wrócić może łatwo, bo to jedna linijka w TRYBY.
     Ten test pilnuje, żeby wrócił razem z dwiema rzeczami, nie samotnie:
     narzędziem do czytania stron ORAZ sprawdzeniem, czy strona naprawdę została
     pobrana. Bez tego drugiego część stron blokujących roboty odeśle nas dokładnie
     tam, skąd wyszliśmy — do zgadywania wyglądającego na sukces. */
  const tryby = ekran.match(/TRYBY:\s*\[([\s\S]*?)\]/);
  prawda(tryby, "ekran dodawania nie deklaruje listy TRYBY");
  if (!/id:\s*["']link["']/.test(tryby[1])) return;   // odstawiony — nie ma czego pilnować

  prawda(/url_context|urlContext/.test(bezKomentarzy),
    "tryb Link jest włączony, a zapytanie do Gemini nie niesie narzędzia do czytania stron — " +
    "model będzie zgadywał przepis z adresu");
  prawda(/urlRetrievalStatus|url_retrieval_status|urlMetadata|url_metadata/.test(bezKomentarzy),
    "tryb Link jest włączony, a odpowiedź nie jest sprawdzana pod kątem tego, czy strona " +
    "faktycznie została pobrana — przy zablokowanej stronie wróci zmyślony przepis");
});

/* ---------- pomiar wersji restauracyjnej (decyzja 106), TYMCZASOWE ---------- */

let pomiar = "";
try { pomiar = czytaj("../pomiar.html"); } catch { /* strona skasowana — testy niżej same się wyłączą */ }

test("strona pomiaru woła ten sam adres co ekran dodawania i wysyła flagę pomiar", () => {
  if (!pomiar) return;
  const wKodzie = funkcja.match(/export const config\s*=\s*\{[^}]*path:\s*["']([^"']+)["']/)[1];
  const wStronie = pomiar.match(/fetch\(\s*["'](\/[^"']*zapytaj-ai)["']/);
  prawda(wStronie && wStronie[1] === wKodzie,
    `pomiar.html woła ${wStronie?.[1] || "nic"}, a funkcja nasłuchuje pod ${wKodzie}`);
  prawda(/pomiar:\s*true/.test(pomiar),
    "pomiar.html nie wysyła `pomiar: true` — model dostanie 11 s i pomiar zmierzy limit, nie danie");
});

test("flaga pomiar naprawdę zmienia limit jednej próby", () => {
  if (!pomiar) return;
  prawda(/\bpomiar\b/.test(bezKomentarzy.match(/const \{[^}]*\} = dane;/)?.[0] || ""),
    "funkcja nie czyta `pomiar` z treści zapytania — flaga ze strony pomiaru leci w próżnię");
  const naProbe = bezKomentarzy.match(/const naProbe\s*=\s*([^;]+);/);
  prawda(naProbe && /pomiar/.test(naProbe[1]),
    "limit jednej próby nie zależy od flagi pomiar — wersja restauracyjna zostanie ucięta po 11 s");
});

test("powód zakończenia odpowiedzi Gemini jedzie do apki", () => {
  prawda(/finishReason/.test(bezKomentarzy),
    "funkcja nie czyta finishReason — ucięty JSON będzie wyglądał jak zepsuty model");
  prawda(/koniec,/.test(bezKomentarzy.match(/odpowiedz\(200,\s*\{[\s\S]*?\}\)/)?.[0] || ""),
    "finishReason odczytany, ale nie odesłany w odpowiedzi 200");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
