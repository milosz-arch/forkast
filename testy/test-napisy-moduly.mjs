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

/* Nazwy własne i nazwy języków (decyzja 118): marka brzmi tak samo w obu
   wersjach, a „Polski" i „English" mają z założenia stać w swoim własnym
   języku — po to, żeby dało się je rozpoznać, nie znając drugiego. */
const NIE_TLUMACZYMY = new Set(["Forkast", "Polski", "English"]);

/* Pliki z danymi, nie z interfejsem: 113 dań, 147 produktów, sam słownik
   i lista offline. Skanowanie ich zalałoby wynik nazwami dań. */
const DANE = new Set(["talia-startowa.js", "produkty.js", "tlumaczenia.js", "sw.js"]);

/* Miejsca, przez które napis trafia na ekran nie przechodząc przez t():
   komunikat z mrugnij(), pole etykiety/nazwy/nagłówka w strukturze danych,
   przypisanie do `komunikat` (linia dla czytnika ekranu). */
/* Sinki dopisane po sesji komunikatów: ekran pokazuje napis nie tylko przez
   mrugnij(). `blad`, `bladOsoby`, `bladKodu`, `bladImienia` to czerwone linijki
   pod polami, `stanSieci` i `stanEksportu` to szare linijki stanu, `podpowiedzCzekania`
   i `opisZdjec` to teksty w trakcie czekania na AI, `reakcja` to odzew przy pozycji
   bez składników. Każdy z nich widzi człowiek — więc każdy tu należy.

   Czego tu NIE ma, świadomie: nazw produktów w `wykluczenia.js` (to KLUCZE do
   dopasowania, nie napisy), tekstu promptu w `prompt.js` (rozmawiamy z AI po polsku
   i to osobna decyzja), nazw dni i miesięcy w jadłospisie (formatowanie daty, punkt 6
   sesji A) oraz nazw etapów diagnostycznych. Sprawdzenie za surowe jest gorsze niż
   brak sprawdzenia (pułapka 33): lista, w której połowa pozycji nie ma prawa być
   przetłumaczona, przestaje być czytana. */
const MIEJSCA = /\bmrugnij\(\s*"([^"\\\n]*)"|\b(?:nazwa|etykieta|tytul|opis|reakcja|blad|bladOsoby|bladKodu|bladImienia|stanSieci|stanEksportu|podpowiedzCzekania|opisZdjec)\s*[:=]\s*"([^"\\\n]*)"|\bkomunikat\s*=\s*"([^"\\\n]*)"/g;

/* CO ZOSTAŁO PO POLSKU — świadomie, na sesję komunikatów i modułów.
   Ta lista ma maleć. Dopisanie tu czegoś jest decyzją, nie przypadkiem. */
const JESZCZE_PO_POLSKU = new Set([
  /* czas.js */
  "do 20 min",
  "do 45 min",
  "ponad 45 min",

  /* dodaj-z-ai.html */
  "Zdjęcia",


  /* instalacja.js */
  "Dodaj Forkast do ekranu",
  "Otwórz w Safari",

  /* jadlospis.html */
  "na mieście",
  "co się nawinie",
  "coś z paczki",

  /* kuchnia.js */
  "Indukcja",
  "moc w stopniach, szybko reaguje",
  "Gaz",
  "płomień, natychmiastowa zmiana",
  "Płyta elektryczna",
  "wolno się nagrzewa i stygnie",
  "Z termoobiegiem",
  "Góra-dół",
  "Nie mam piekarnika",
  "Patelnia",
  "Patelnia żeliwna",
  "Duży garnek",
  "Garnek żeliwny / brytfanna",
  "Wok",
  "Blender",
  "Mikser",

  /* kuchnie.js */
  "polska",
  "włoska",
  "japońska",
  "koreańska",
  "chińska",
  "tajska",
  "indyjska",
  "meksykańska",
  "hiszpańska",
  "grecka",
  "francuska",
  "gruzińska",
  "peruwiańska",
  "bliskowschodnia",
  "uniwersalna",

  /* pomoc.js */
  "Po co zaznaczać dania",
  "Jak działa jadłospis",
  "Skąd bierze się ta lista",
  "Trzy sposoby na własne dania",
  "Skąd tu się biorą przepisy",

  /* postep.js */
  "Dziesięć to minimum, nie cel",

  /* powloka.js */
  "Normalny",
  "Duży",
  "Bardzo duży",

  /* ustawienia.html */
  "bez limitu",
  "raz",
  "do 2×",
  "do 3×",

  /* wykluczenia.js */
  "Mięso",
  "Ryby i owoce morza",
  "Nabiał",
  "Jajka",
  "Gluten",
  "Orzechy",
]);

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(w, co) { if (!w) throw new Error(co); }

function bezKomentarzy(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const PLIKI = readdirSync(KORZEN)
  .filter(p => (p.endsWith(".js") && !DANE.has(p)) || p.endsWith(".html"))
  .sort();

/* Pusty albo zawężony zbiór to najczęstszy sposób, w jaki test w tym projekcie
   przestawał cokolwiek sprawdzać (decyzje 64, 72, 96). Twardy próg zamiast ciszy. */
prawda(PLIKI.length > 20, `spodziewałem się kilkudziesięciu plików, jest ${PLIKI.length}`);

const znalezione = new Map();   // napis → pliki
for (const p of PLIKI) {
  let tekst = readFileSync(new URL(p, KORZEN), "utf8");
  /* W ekranach interesują nas wyłącznie bloki <script> — resztę HTML-a
     pokrywa test-tlumaczenia.mjs i to on jest tam właściwym strażnikiem. */
  if (p.endsWith(".html")) tekst = (tekst.match(/<script[^>]*>[\s\S]*?<\/script>/g) || []).join("\n");
  for (const m of bezKomentarzy(tekst).matchAll(MIEJSCA)) {
    const napis = m[1] ?? m[2] ?? m[3];
    if (!napis || napis.trim().length < 2) continue;
    if (!znalezione.has(napis)) znalezione.set(napis, new Set());
    znalezione.get(napis).add(p);
  }
}

prawda(znalezione.size > 50, `spodziewałem się kilkudziesięciu napisów, jest ${znalezione.size}`);

test("każdy napis z modułu jest w słowniku albo na liście", () => {
  const nieznane = [...znalezione.keys()].filter(
    n => !(n in SLOWNIK) && !NIE_TLUMACZYMY.has(n) && !JESZCZE_PO_POLSKU.has(n));
  prawda(nieznane.length === 0,
    `${nieznane.length} napisów spoza słownika i spoza listy:\n       ` +
    nieznane.slice(0, 12).map(n => `„${n.slice(0, 60)}” (${[...znalezione.get(n)].join(", ")})`).join("\n       "));
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
