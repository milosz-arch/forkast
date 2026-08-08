import { policzZakupy, pogrupujDzialami, opisIlosci } from "../zakupy.js";
import { nowyOkres, domyslnyRytm, pustaSiatka, przypiszDanie, zmienKtoJe, oznaczBezSkladnikow } from "../rytm.js";

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

const DWOJE = [{ id: "d1", imie: "Ala" }, { id: "d2", imie: "Ola" }];
const JEDNO = [{ id: "d1", imie: "Ala" }];

const DANIA = [
  { id: "a", nazwa: "Ryż z jajkiem", porcje: 2,
    skladniki: [{ produkt: "Ryż basmati", gramy: 100 }, { produkt: "Jajka", gramy: 110 }] },
  { id: "b", nazwa: "Owsianka", porcje: 1,
    skladniki: [{ produkt: "Płatki owsiane", gramy: 50 }] },
  { id: "c", nazwa: "Zupa na czworo", porcje: 4,
    skladniki: [{ produkt: "Ziemniaki", gramy: 800 }] },
];

function siatkaZ(domownicy, typy = ["obiad"]) {
  return pustaSiatka(nowyOkres("2026-08-03", 1), domyslnyRytm(domownicy, typy));
}

console.log("\n— przeliczanie porcji: sedno całego pliku —");

test("danie na 2 porcje jedzone przez 2 osoby: gramatura bez zmian", () => {
  let s = siatkaZ(DWOJE);
  s = przypiszDanie(s, "2026-08-03", "obiad", "a");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje.find(p => p.produkt === "Ryż basmati").gramy, 100);
});

test("danie na 2 porcje jedzone przez 1 osobę: połowa składników", () => {
  let s = siatkaZ(JEDNO);
  s = przypiszDanie(s, "2026-08-03", "obiad", "a");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje.find(p => p.produkt === "Ryż basmati").gramy, 50);
});

test("danie na 1 porcję jedzone przez 2 osoby: podwójna gramatura", () => {
  let s = siatkaZ(DWOJE);
  s = przypiszDanie(s, "2026-08-03", "obiad", "b");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje.find(p => p.produkt === "Płatki owsiane").gramy, 100);
});

test("danie na 4 porcje jedzone przez 1 osobę: ćwiartka", () => {
  let s = siatkaZ(JEDNO);
  s = przypiszDanie(s, "2026-08-03", "obiad", "c");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje.find(p => p.produkt === "Ziemniaki").gramy, 200);
});

console.log("\n— sumowanie —");

test("to samo danie kilka razy w okresie sumuje się", () => {
  let s = pustaSiatka(nowyOkres("2026-08-03", 3), domyslnyRytm(DWOJE, ["obiad"]));
  for (const d of ["2026-08-03", "2026-08-04", "2026-08-05"])
    s = przypiszDanie(s, d, "obiad", "a");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje.find(p => p.produkt === "Ryż basmati").gramy, 300);
});

test("ten sam produkt z różnych dań trafia do jednej pozycji", () => {
  let s = pustaSiatka(nowyOkres("2026-08-03", 1), domyslnyRytm(DWOJE, ["obiad", "kolacja"]));
  s = przypiszDanie(s, "2026-08-03", "obiad", "a");
  s = przypiszDanie(s, "2026-08-03", "kolacja", "a");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje.filter(p => p.produkt === "Ryż basmati").length, 1, "jedna pozycja, nie dwie");
  rowne(pozycje.find(p => p.produkt === "Ryż basmati").gramy, 200);
});

test("pozycja pamięta, z których dań pochodzi", () => {
  let s = pustaSiatka(nowyOkres("2026-08-03", 1), domyslnyRytm(DWOJE, ["obiad", "kolacja"]));
  s = przypiszDanie(s, "2026-08-03", "obiad", "a");
  s = przypiszDanie(s, "2026-08-03", "kolacja", "b");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje.find(p => p.produkt === "Płatki owsiane").wDaniach, ["Owsianka"]);
});

test("zaokrąglanie następuje po zsumowaniu, nie przy każdym składniku", () => {
  // 3 osoby jedzące danie na 2 porcje: 100 * 1,5 = 150 dokładnie, ale gdyby
  // zaokrąglać cząstkowo przy trzech dniach, wyszłoby inaczej niż 450.
  const troje = [{ id: "a", imie: "A" }, { id: "b", imie: "B" }, { id: "c", imie: "C" }];
  let s = pustaSiatka(nowyOkres("2026-08-03", 3), domyslnyRytm(troje, ["obiad"]));
  for (const d of ["2026-08-03", "2026-08-04", "2026-08-05"])
    s = przypiszDanie(s, d, "obiad", "a");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje.find(p => p.produkt === "Ryż basmati").gramy, 450);
});

console.log("\n— czego NIE liczymy —");

test("pozycja na miescie nie generuje skladnikow", () => {
  let s = siatkaZ(DWOJE);
  s = oznaczBezSkladnikow(s, "2026-08-03", "obiad", "na mieście");
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje, []);
});

test("pusty posiłek nie generuje składników", () => {
  const s = siatkaZ(DWOJE);
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje, []);
});

test("wyłączony posiłek nie generuje składników", () => {
  let s = pustaSiatka(nowyOkres("2026-08-03", 1), domyslnyRytm(DWOJE, ["obiad"]));
  s = przypiszDanie(s, "2026-08-03", "obiad", "a");
  s[0].posilki = {};   // symulacja wyłączenia
  const { pozycje } = policzZakupy(s, DANIA);
  rowne(pozycje, []);
});

console.log("\n— sytuacje brzegowe —");

test("danie usunięte z bazy jest zgłoszone, nie przemilczane", () => {
  let s = siatkaZ(DWOJE);
  s = przypiszDanie(s, "2026-08-03", "obiad", "nie-istnieje");
  const { pozycje, pominiete } = policzZakupy(s, DANIA);
  rowne(pozycje, []);
  prawda(pominiete.some(p => /zniknęło/.test(p)));
});

test("danie bez sensownej liczby porcji jest zgłoszone", () => {
  const zle = [{ id: "x", nazwa: "Zepsute", porcje: 0, skladniki: [{ produkt: "Jajka", gramy: 100 }] }];
  let s = siatkaZ(DWOJE);
  s = przypiszDanie(s, "2026-08-03", "obiad", "x");
  const { pozycje, pominiete } = policzZakupy(s, zle);
  rowne(pozycje, []);
  prawda(pominiete.some(p => /na ile osób/.test(p)));
});

test("pusta siatka daje pustą listę, nie wyjątek", () => {
  const { pozycje, pominiete } = policzZakupy([], DANIA);
  rowne(pozycje, []);
  rowne(pominiete, []);
});

console.log("\n— grupowanie i opis —");

test("pogrupujDzialami układa według działów sklepu", () => {
  const slownik = [
    { n: "Ryż basmati", dzial: "Spiżarnia" },
    { n: "Jajka", dzial: "Nabiał" },
  ];
  const pozycje = [
    { produkt: "Jajka", gramy: 110, wDaniach: [] },
    { produkt: "Ryż basmati", gramy: 100, wDaniach: [] },
  ];
  const grupy = pogrupujDzialami(pozycje, slownik);
  rowne(grupy.map(g => g.dzial), ["Nabiał", "Spiżarnia"]);
});

test("produkt spoza słownika trafia do działu Inne, nie znika", () => {
  const grupy = pogrupujDzialami([{ produkt: "Coś nowego", gramy: 50, wDaniach: [] }], []);
  rowne(grupy.length, 1);
  rowne(grupy[0].dzial, "Inne");
});

test("opisIlosci przechodzi na kilogramy dopiero powyżej 1000 g", () => {
  rowne(opisIlosci(80), "80 g");
  rowne(opisIlosci(999), "999 g");
  rowne(opisIlosci(1000), "1 kg");
  rowne(opisIlosci(1250), "1,3 kg");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
