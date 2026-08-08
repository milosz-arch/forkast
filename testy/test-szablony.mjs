/* =====================================================================
   SZABLONY — czy każda nazwa użyta w HTML-u istnieje w komponencie.

   PO CO TO JEST. Alpine nie krzyczy, gdy w x-text stoi nazwa, której nikt
   nie zdefiniował — po prostu nic nie pokazuje, a przy okazji wywala całe
   wyrażenie w tym miejscu. Do 8 sierpnia ekran Zakupów odwoływał się pięć
   razy do `doKupienia`, którego w komponencie nie było. Duży licznik na
   górze ekranu nie działał i nikt tego nie zauważył, bo błąd siedział
   w konsoli, a nie na ekranie (decyzja 70).

   JAK TO DZIAŁA. Dla każdego ekranu:
   1. wycinamy ciało komponentu z Alpine.data("nazwa", () => ({ ... }))
   2. zbieramy nazwy pól i metod z pierwszego poziomu tego obiektu
   3. dokładamy pola z ...danePowloki(...), czytane z powloka.js tak samo
   4. przechodzimy po atrybutach Alpine w HTML-u i wyciągamy z nich nazwy
   5. każda nazwa musi być albo w komponencie, albo lokalna z x-for,
      albo na liście rzeczy, które daje przeglądarka

   CZEGO TO NIE ROBI. Nie sprawdza literówek w polach zagnieżdżonych
   (`p.ileDoKupenia` przejdzie), bo do tego trzeba by wiedzieć, co siedzi
   w danych. Pilnuje pierwszego poziomu — czyli tego, co się realnie psuło.
   ===================================================================== */

import { readFileSync, readdirSync } from "node:fs";

/* Testy leżą w `testy/`, a pliki apki w korzeniu repozytorium — stąd ten skok
   o katalog wyżej. Liczony od położenia TEGO pliku, nie od tego, skąd ktoś
   uruchomił node, bo inaczej wynik zależałby od katalogu w terminalu. */
const KORZEN = new URL("../", import.meta.url);

let zdane = 0, oblane = 0;
function test(nazwa, fn) {
  try { fn(); zdane++; console.log(`  ok   ${nazwa}`); }
  catch (e) { oblane++; console.log(`  BLAD ${nazwa}\n       ${e.message}`); }
}
function prawda(w, co) { if (!w) throw new Error(co || "oczekiwano prawdy"); }

/* Nazwy, które daje przeglądarka albo sam Alpine. Nie ma ich w komponencie
   i nie powinno być — dlatego stoją tu wypisane, a nie zgadywane wzorcem. */
const OD_PRZEGLADARKI = new Set([
  "window", "document", "navigator", "location", "localStorage", "console",
  "Math", "JSON", "Object", "Array", "Number", "String", "Boolean", "Date",
  "Set", "Map", "Intl", "isNaN", "parseInt", "parseFloat", "encodeURIComponent",
  "setTimeout", "clearTimeout", "requestAnimationFrame", "alert", "confirm",
  "true", "false", "null", "undefined", "new", "typeof", "in", "of", "instanceof",
  "return", "if", "else", "await", "async", "let", "const", "var", "function",
  "delete", "void", "this", "Infinity", "NaN",
]);

/** Atrybuty, w których siedzi kod. */
const ATRYBUTY = /(?:^|\s)(?::[\w:.-]+|@[\w:.-]+|x-[\w:.-]+)\s*=\s*"([^"]*)"/g;

/** Wycina z tekstu blok zaczynający się na `otwiera`, licząc nawiasy klamrowe. */
function ciałoObiektu(tekst, od) {
  const start = tekst.indexOf("{", od);
  let głębokość = 0;
  for (let i = start; i < tekst.length; i++) {
    const z = tekst[i];
    if (z === "{") głębokość++;
    else if (z === "}") { głębokość--; if (!głębokość) return tekst.slice(start + 1, i); }
  }
  throw new Error("nie znalazłem końca obiektu");
}

/* Zamienia na spacje wszystko, co nie jest kodem: napisy, komentarze, wyrażenia
   regularne. Zostawia to, co siedzi w ${...} szablonu, bo tam są prawdziwe
   odwołania do danych. Długość tekstu się nie zmienia, więc numery znaków
   i liczenie nawiasów dalej się zgadzają.

   Musi to być przejście znak po znaku, a nie zestaw podmian wzorcem: szablon
   w szablonie (`a ${ `b ${c}` } d`) i apostrof w polskim komentarzu wywracały
   każdą wersję opartą na wyrażeniach regularnych, a wywracały ją po cichu —
   licznik nawiasów uciekał i test przestawał widzieć połowę komponentu. */
function bezNapisow(kod) {
  /* split(""), nie Array.from(): emotka „🎵" to dwie jednostki w indeksie
     tekstu i jeden element w Array.from — po tej różnicy cały licznik znaków
     przesuwał się o jeden i test gubił połowę komponentu, nie mówiąc nic. */
  const wynik = kod.split("");
  const pusto = i => { if (kod[i] !== "\n") wynik[i] = " "; };
  /* stos: "kod" | "'" | '"' | "`" — wejście w ${...} kładzie na stos "kod" */
  const stos = ["kod"];
  const klamry = [];
  let i = 0;
  while (i < kod.length) {
    const stan = stos[stos.length - 1];
    const z = kod[i], nast = kod[i + 1];

    if (stan === "kod") {
      if (z === "/" && nast === "*") {
        const koniec = kod.indexOf("*/", i + 2);
        const do_ = koniec === -1 ? kod.length : koniec + 2;
        for (let j = i; j < do_; j++) pusto(j);
        i = do_; continue;
      }
      if (z === "/" && nast === "/") {
        while (i < kod.length && kod[i] !== "\n") pusto(i++);
        continue;
      }
      if (z === "/") {
        /* Ukośnik jest wyrażeniem regularnym tylko tam, gdzie nie może być
           dzieleniem — czyli po operatorze albo po nawiasie otwierającym. */
        const przed = kod.slice(0, i).replace(/\s+$/, "").slice(-1);
        if (przed === "" || "(,=:[!&|?{};+-*%<>~^".includes(przed)) {
          pusto(i++);
          while (i < kod.length && kod[i] !== "\n") {
            if (kod[i] === "\\") { pusto(i); pusto(i + 1); i += 2; continue; }
            if (kod[i] === "/") { pusto(i++); break; }
            pusto(i++);
          }
          continue;
        }
      }
      if (z === "'" || z === '"' || z === "`") { pusto(i++); stos.push(z); continue; }
      if (z === "{") klamry.push(stos.length);
      if (z === "}") {
        if (klamry.length && klamry[klamry.length - 1] === stos.length) klamry.pop();
        else if (stos.length > 1) { pusto(i++); stos.pop(); continue; }   // koniec ${...}
      }
      i++; continue;
    }

    /* wnętrze napisu */
    if (z === "\\") { pusto(i); pusto(i + 1); i += 2; continue; }
    if (z === stan) { pusto(i++); stos.pop(); continue; }
    if (stan === "`" && z === "$" && nast === "{") {
      pusto(i); pusto(i + 1); i += 2; stos.push("kod"); continue;
    }
    pusto(i++);
  }
  return wynik.join("");
}

/* Nazwy z pierwszego poziomu obiektu: pola, gettery, metody.
   Dostaje tekst JUŻ przepuszczony przez bezNapisow.
   Idziemy znak po znaku, bo na jednej linii potrafi stać kilka pól
   (`ekran, tytul: bezSierot(tytul), opis: ...`), a to, co w nawiasach,
   jest już poziom niżej i do komponentu nie należy. */
function nazwyPierwszegoPoziomu(czysty) {
  const nazwy = new Set();
  let głębokość = 0;
  const wzór = /[A-Za-z_$][\w$]*/g;
  let i = 0, m;
  while ((m = wzór.exec(czysty))) {
    for (; i < m.index; i++) {
      const z = czysty[i];
      if (z === "{" || z === "(" || z === "[") głębokość++;
      else if (z === "}" || z === ")" || z === "]") głębokość--;
    }
    if (głębokość === 0 && !["get", "set", "async"].includes(m[0])) {
      const po = czysty.slice(m.index + m[0].length).replace(/^[^\S\n]+/, "");
      if (/^[:,(\n]/.test(po) || po === "") nazwy.add(m[0]);
    }
  }
  return nazwy;
}

/* Nazwy, które wnosi ...danePowloki(...) — czytane z powloka.js, żeby test
   nie miał własnej, rozjeżdżającej się kopii tej listy. */
const POWLOKA_CZYSTA = bezNapisow(readFileSync(new URL("powloka.js", KORZEN), "utf8"));
const POWLOKA = nazwyPierwszegoPoziomu(
  ciałoObiektu(POWLOKA_CZYSTA,
               POWLOKA_CZYSTA.indexOf("return {",
                 POWLOKA_CZYSTA.indexOf("export function danePowloki"))),
);

/* Powłoka rejestruje też własne, małe komponenty — `pasek`, `przeciagany`,
   `licznik`. W HTML-u siedzą jako x-data="pasek", więc ich pola są w szablonie
   równie prawdziwe jak pola ekranu. Bierzemy je hurtem, bez pilnowania,
   który element jest w którym zasięgu: tu chodzi o nazwy, których NIE MA
   nigdzie, a nie o to, czy ktoś sięgnął po pole z sąsiedniego pudełka. */
const MALE_KOMPONENTY = new Set();
for (const m of POWLOKA_CZYSTA.matchAll(/Alpine\.data\([\s\S]{0,60}?=>\s*\(\{/g)) {
  for (const n of nazwyPierwszegoPoziomu(ciałoObiektu(POWLOKA_CZYSTA, m.index + m[0].length - 1))) {
    MALE_KOMPONENTY.add(n);
  }
}
/* Nazwy samych komponentów bierzemy z tekstu surowego — w oczyszczonym
   napisy są już wykropkowane. */
for (const m of readFileSync(new URL("powloka.js", KORZEN), "utf8").matchAll(/Alpine\.(?:data|bind)\(\s*"(\w+)"/g)) {
  MALE_KOMPONENTY.add(m[1]);
}

/** Wszystkie nazwy odczytywane z zakresu w danym wyrażeniu. */
function nazwyZWyrazenia(wyr) {
  const kod = bezNapisow(wyr);
  const nazwy = new Set();
  const wzór = /[A-Za-z_$À-ɏ][\w$À-ɏ]*/g;
  let m;
  while ((m = wzór.exec(kod))) {
    const przed = kod.slice(0, m.index).replace(/\s+$/, "");
    if (przed.endsWith(".") || przed.endsWith("?.")) continue;   // to pole, nie nazwa
    const po = kod.slice(m.index + m[0].length).replace(/^\s+/, "");
    /* klucz w obiekcie: `{ nazwa: ... }` albo `, nazwa: ...` — nie odczyt zakresu.
       Gałąź trójki (`x ? a : b`) tu nie wpada, bo przed `a` stoi znak zapytania. */
    if (po.startsWith(":") && !po.startsWith("::") && /[{,]$/.test(przed)) continue;
    nazwy.add(m[0]);
  }
  return nazwy;
}

const EKRANY = readdirSync(KORZEN).filter(p => p.endsWith(".html"))
  .filter(p => readFileSync(p, "utf8").includes("Alpine.data("));

console.log(`\n— nazwy w szablonach (${EKRANY.length} ekranów) —`);

prawda(EKRANY.length >= 8, `spodziewałem się ośmiu ekranów, jest ${EKRANY.length}`);
prawda(POWLOKA.has("tytul") && POWLOKA.has("zakladki"),
       "nie wyciągnąłem pól z danePowloki — reszta testu byłaby fałszywie zielona");

/* Atrybuty, w których NIE ma kodu: x-transition trzyma klasy CSS, x-data
   nazwę komponentu, a x-cloak i x-ref nic, co dałoby się odczytać. */
const BEZ_KODU = /^(?::?x-transition|x-cloak|x-ref|x-id|x-teleport|x-data)/;

for (const plik of EKRANY) {
  test(`${plik}: każda nazwa z szablonu istnieje w komponencie`, () => {
    const surowy = readFileSync(plik, "utf8");
    const iSkrypt = surowy.indexOf("<script type=\"module\">");

    /* Czyścimy TYLKO skrypt, nie cały plik. HTML nie jest JavaScriptem:
       zwykły apostrof w polskim zdaniu („co Wam się nie je") otwierał
       w oczyszczaniu napis, który nigdy się nie zamykał — i od tego miejsca
       cały plik szedł do kosza, a test przechodził na pustym zbiorze. */
    const skrypt = bezNapisow(surowy.slice(iSkrypt));
    const iData = skrypt.indexOf("Alpine.data(");
    const ciało = ciałoObiektu(skrypt, skrypt.indexOf("({", iData) + 1);

    const znane = new Set([...nazwyPierwszegoPoziomu(ciało), ...OD_PRZEGLADARKI, ...MALE_KOMPONENTY]);
    if (ciało.includes("...danePowloki(")) for (const n of POWLOKA) znane.add(n);

    const szablon = surowy.slice(0, surowy.indexOf("<script type=\"module\">"));

    /* Zmienne z x-for i z parametrów funkcji strzałkowych żyją tylko w środku,
       ale nam wystarczy, że nazwa gdziekolwiek w pliku jest wprowadzona —
       szukamy nazw, których NIE MA nigdzie. Tak samo małe x-data w miejscu
       (`x-data="{ otwarty: false }"`). */
    for (const m of szablon.matchAll(/x-for\s*=\s*"([^"]*)"/g)) {
      const lewa = m[1].split(/\s+(?:in|of)\s+/)[0];
      for (const n of lewa.matchAll(/[A-Za-z_$][\w$]*/g)) znane.add(n[0]);
    }
    for (const m of szablon.matchAll(/x-data\s*=\s*"\s*\{([^"]*)\}\s*"/g)) {
      for (const n of m[1].matchAll(/([A-Za-z_$][\w$]*)\s*:/g)) znane.add(n[1]);
    }
    for (const m of szablon.matchAll(/(?:\(([^)]*)\)|([A-Za-z_$][\w$]*))\s*=>/g)) {
      for (const n of (m[1] || m[2] || "").matchAll(/[A-Za-z_$][\w$]*/g)) znane.add(n[0]);
    }

    const braki = new Map();
    for (const m of szablon.matchAll(ATRYBUTY)) {
      if (BEZ_KODU.test(m[0].trim())) continue;
      for (const n of nazwyZWyrazenia(m[1])) {
        if (n.startsWith("$")) continue;                 // magia Alpine
        if (!znane.has(n)) braki.set(n, m[1].replace(/\s+/g, " ").slice(0, 60));
      }
    }
    prawda(braki.size === 0,
           `nazwy bez definicji: ${[...braki].map(([n, w]) => `${n}  (w: ${w})`).join(" | ")}`);
  });
}

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
