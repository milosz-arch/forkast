import { generujKodDomu, znormalizujKod, kodPoprawny,
         nowyDomownik, dodajDomownika, usunDomownika, zmienImie } from "../dom.js";

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

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
