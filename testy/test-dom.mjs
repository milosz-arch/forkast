import { generujKodDomu, znormalizujKod, kodPoprawny,
         nowyDomownik, dodajDomownika, usunDomownika, zmienImie,
         ktoJestem, ustawKimJestem, ktoJestemWsrod } from "../dom.js";

let zdane = 0, oblane = 0;
function test(nazwa, fn) {
  try { fn(); zdane++; console.log(`  ok   ${nazwa}`); }
  catch (e) { oblane++; console.log(`  BLAD ${nazwa}\n       ${e.message}`); }
}
function rowne(a, b, co = "") {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x !== y) throw new Error(`${co} oczekiwano ${y}, jest ${x}`);
}
function prawda(w, co) { if (!w) throw new Error(co || "oczekiwano prawdy"); }

console.log("\n— kod domu —");

test("kod ma 6 znaków z alfabetu 0-9A-Z", () => {
  const kod = generujKodDomu();
  prawda(/^[0-9A-Z]{6}$/.test(kod), `zły kształt: ${kod}`);
});

test("wstrzyknięty losuj daje deterministyczny, powtarzalny wynik", () => {
  const seq = [0, 0.5, 0.99, 0.1, 0.4, 0.7];
  const gen = () => seq[gen.i++ % seq.length];
  gen.i = 0;
  const a = generujKodDomu(gen);
  gen.i = 0;
  const b = generujKodDomu(gen);
  rowne(a, b);
});

test("znormalizujKod: małe litery, spacje, null", () => {
  rowne(znormalizujKod("  ab12cd  "), "AB12CD");
  rowne(znormalizujKod(null), "");
  rowne(znormalizujKod(undefined), "");
});

test("kodPoprawny akceptuje poprawny kod w dowolnej wielkości liter", () => {
  prawda(kodPoprawny("AB12CD"));
  prawda(kodPoprawny("ab12cd"));
  prawda(kodPoprawny("  ab12cd  "));
});

test("kodPoprawny odrzuca zły kształt", () => {
  prawda(!kodPoprawny("AB12C"));      // za krótki
  prawda(!kodPoprawny("AB12CDE"));    // za długi
  prawda(!kodPoprawny("AB12C!"));     // zły znak
  prawda(!kodPoprawny(""));
  prawda(!kodPoprawny(null));
});

console.log("\n— domownik pojedynczy —");

test("nowyDomownik przypisuje id i przycina imię", () => {
  const d = nowyDomownik("  Ala  ", () => "id1");
  rowne(d, { id: "id1", imie: "Ala" });
});

test("nowyDomownik rzuca na puste imię", () => {
  try { nowyDomownik("   "); throw new Error("nie rzucił"); }
  catch (e) { prawda(/imię/i.test(e.message), "zły komunikat: " + e.message); }
});

console.log("\n— lista domownikow: bez zakładania, że jest ich dwoje —");

test("dom jednoosobowy to poprawny stan, nie przypadek specjalny", () => {
  const lista = dodajDomownika([], "Miłosz", () => "id1");
  rowne(lista, [{ id: "id1", imie: "Miłosz" }]);
});

test("można dodać więcej niż dwoje — bez górnego limitu", () => {
  let lista = [];
  let n = 0;
  const gen = () => "id" + (++n);
  for (const imie of ["A", "B", "C", "D", "E"]) lista = dodajDomownika(lista, imie, gen);
  rowne(lista.length, 5);
});

test("dodajDomownika nie mutuje oryginalnej tablicy", () => {
  const oryginal = [{ id: "id1", imie: "Ala" }];
  const nowa = dodajDomownika(oryginal, "Ola", () => "id2");
  rowne(oryginal.length, 1);
  rowne(nowa.length, 2);
});

test("usunDomownika usuwa właściwego i nie mutuje", () => {
  const oryginal = [{ id: "id1", imie: "Ala" }, { id: "id2", imie: "Ola" }];
  const nowa = usunDomownika(oryginal, "id1");
  rowne(nowa, [{ id: "id2", imie: "Ola" }]);
  rowne(oryginal.length, 2, "oryginał nietknięty");
});

test("zmienImie podmienia tylko właściwego, przycina spacje", () => {
  const oryginal = [{ id: "id1", imie: "Ala" }, { id: "id2", imie: "Ola" }];
  const nowa = zmienImie(oryginal, "id2", "  Olga  ");
  rowne(nowa, [{ id: "id1", imie: "Ala" }, { id: "id2", imie: "Olga" }]);
});

test("zmienImie rzuca na puste imię", () => {
  try { zmienImie([{ id: "id1", imie: "Ala" }], "id1", "  "); throw new Error("nie rzucił"); }
  catch (e) { prawda(/imię/i.test(e.message)); }
});

console.log("\n— kim jestem przy tym stole —");

/* Podstawiona pamięć telefonu: te same trzy metody, których używa kod. */
function pamiecTestowa(startowa = {}) {
  const dane = { ...startowa };
  return {
    getItem: k => (k in dane ? dane[k] : null),
    setItem: (k, v) => { dane[k] = String(v); },
    removeItem: k => { delete dane[k]; },
  };
}

test("na czystym telefonie nie wiadomo, kim jestem", () => {
  rowne(ktoJestem(pamiecTestowa()), null);
});

test("wybór zostaje zapamiętany i odczytany", () => {
  const p = pamiecTestowa();
  ustawKimJestem("d1", p);
  rowne(ktoJestem(p), "d1");
});

test("wybór da się wyczyścić", () => {
  const p = pamiecTestowa({ "forkast-ja": "d1" });
  ustawKimJestem(null, p);
  rowne(ktoJestem(p), null);
});

test("pamięć, która rzuca przy zapisie, nie wywala apki", () => {
  /* Safari w trybie prywatnym: getItem działa, setItem rzuca. Pułapka 16. */
  const zepsuta = { getItem: () => null, setItem: () => { throw new Error("quota"); },
                    removeItem: () => {} };
  rowne(ustawKimJestem("d1", zepsuta), false, "ma zwrócić fałsz, nie rzucić");
});

test("gdy mnie usunięto ze stołu z drugiego telefonu, wybór przestaje obowiązywać", () => {
  /* Inaczej licznik doliczałby kalorie osobie, której już nie ma przy stole. */
  const p = pamiecTestowa({ "forkast-ja": "d9" });
  rowne(ktoJestemWsrod([{ id: "d1", imie: "Ala" }], p), null);
  rowne(ktoJestemWsrod([{ id: "d9", imie: "Ola" }], p), "d9");
});



console.log("\n— martwe funkcje: czy ekran w ogóle je woła —");

/* Trzy razy w tej apce ta sama historia: funkcja gotowa i przetestowana, a żaden
   ekran jej nie wołał. Arkusz spiżarni bez przycisku otwierającego (decyzja 73),
   wyłączony posiłek bez drogi powrotu (88) i `zmienImie()`, przez którą literówka
   w imieniu była nie do naprawienia inaczej niż usunięciem osoby.

   Testy jednostkowe tego nie łapią z definicji: sprawdzają, czy funkcja działa,
   a nie czy ktokolwiek jej używa. Ten test czyta ekrany jako tekst i pyta o to
   drugie — z konieczności grubo, ale grubo znaczy tu „w ogóle”. */
import { readdirSync as czytajKatalog, readFileSync as czytajPlik } from "fs";

const KORZEN_EKRANOW = new URL("../", import.meta.url);
const bezKomentarzyHTML = (kod) => kod
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/\/\*[\s\S]*?\*\//g, " ");

const ekranyHTML = czytajKatalog(KORZEN_EKRANOW)
  .filter(f => f.endsWith(".html"))
  .map(f => bezKomentarzyHTML(czytajPlik(new URL(f, KORZEN_EKRANOW), "utf8")))
  .join("\n");

/* `skreslDopisek` dopisane 30 sierpnia: napisałem ją 29 sierpnia razem z funkcją
   dopisywania i NIE PODPIĄŁEM do żadnego przycisku. Piąta taka rzecz w tej apce
   i pierwsza moja własna — objaw był taki, że odhaczenie dopisanej pozycji miało
   ją kasować i nie kasowało nigdy. */
/* Wycinamy DEFINICJE metod, zanim poszukamy wywołań.

   Pierwsza wersja tego testu szukała po prostu „nazwa(" w plikach HTML — i dla
   funkcji zdefiniowanych WEWNĄTRZ ekranu znajdowała ich własną definicję. Czyli
   test pilnujący martwych funkcji był sam martwy dokładnie tam, gdzie najbardziej
   był potrzebny. Wyszło przy sabotażu 30 sierpnia: odpięcie krzyżyka od
   `skreslDopisek()` niczego nie obaliło. */
const bezDefinicji = ekranyHTML.replace(/^\s*(async\s+)?[A-Za-z_$][\w$]*\s*\(/gm, " ");

for (const nazwa of ["zmienImie", "wlaczPosilek", "skreslDopisek", "odhaczDopisek"]) {
  test(`${nazwa}() jest wołana przez któryś ekran`, () => {
    rowne(new RegExp(`\\b${nazwa}\\s*\\(`).test(bezDefinicji), true,
      `${nazwa}() istnieje w kodzie i żaden ekran jej nie woła — gotowa funkcja bez drzwi`);
  });
}

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
