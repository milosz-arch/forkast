import { ulozPlan } from "../automat.js";
import { nowyOkres, domyslnyRytm, pustaSiatka, przypiszDanie, oznaczBezSkladnikow } from "../rytm.js";

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

const D = [{ id: "d1", imie: "Ala" }];

const DANIA = [
  { id: "s1", typy: ["sniadanie"] },
  { id: "s2", typy: ["sniadanie"] },
  { id: "l1", typy: ["lunch"] },
  { id: "wsz", typy: ["sniadanie", "lunch", "kolacja"] },
];

console.log("\n— wypełnianie —");

test("wypełnia wszystkie puste miejsca, gdy jest z czego wybierać", () => {
  const okres = nowyOkres("2026-08-03", 2);
  const rytm = domyslnyRytm(D, ["sniadanie", "lunch"]);
  const siatka = pustaSiatka(okres, rytm);
  const { siatka: wynik, bledy } = ulozPlan(siatka, DANIA);
  rowne(bledy, []);
  for (const dzien of wynik) {
    prawda(dzien.posilki.sniadanie.danie, "śniadanie wypełnione");
    prawda(dzien.posilki.lunch.danie, "lunch wypełniony");
  }
});

test("nie mutuje oryginalnej siatki", () => {
  const okres = nowyOkres("2026-08-03", 1);
  const siatka = pustaSiatka(okres, domyslnyRytm(D, ["sniadanie"]));
  ulozPlan(siatka, DANIA);
  rowne(siatka[0].posilki.sniadanie.danie, null, "oryginał nietknięty");
});

test("omija miejsca już przypisane ręcznie", () => {
  const okres = nowyOkres("2026-08-03", 1);
  let siatka = pustaSiatka(okres, domyslnyRytm(D, ["sniadanie", "lunch"]));
  siatka = przypiszDanie(siatka, "2026-08-03", "sniadanie", "recznie-wybrane");
  const { siatka: wynik } = ulozPlan(siatka, DANIA);
  rowne(wynik[0].posilki.sniadanie.danie, "recznie-wybrane", "automat nie nadpisał");
  prawda(wynik[0].posilki.lunch.danie, "lunch mimo to wypełniony");
});

test("omija miejsca oznaczone jako bez składników", () => {
  const okres = nowyOkres("2026-08-03", 1);
  let siatka = pustaSiatka(okres, domyslnyRytm(D, ["kolacja"]));
  siatka = oznaczBezSkladnikow(siatka, "2026-08-03", "kolacja", "na mieście");
  const { siatka: wynik } = ulozPlan(siatka, DANIA);
  rowne(wynik[0].posilki.kolacja.danie, null);
  rowne(wynik[0].posilki.kolacja.bezSkladnikow, "na mieście", "oznaczenie zostaje");
});

console.log("\n— za mało dań —");

test("brak pasującego typu daje błąd, nie wyjątek", () => {
  const okres = nowyOkres("2026-08-03", 1);
  const siatka = pustaSiatka(okres, domyslnyRytm(D, ["przekaska"]));
  const { siatka: wynik, bledy } = ulozPlan(siatka, DANIA); // DANIA nie ma nic typu "przekaska"
  rowne(wynik[0].posilki.przekaska.danie, null);
  prawda(bledy.length === 1);
  prawda(/przekaska/.test(bledy[0]));
});

console.log("\n— limit powtórzeń (decyzja 11: ustawienie, nie sztywna reguła) —");

test("bez limitu to samo danie może wejść wielokrotnie", () => {
  const okres = nowyOkres("2026-08-03", 5);
  const siatka = pustaSiatka(okres, domyslnyRytm(D, ["przekaska"]));
  const JEDNO = [{ id: "x1", typy: ["przekaska"] }];
  const { siatka: wynik, bledy } = ulozPlan(siatka, JEDNO, null);
  rowne(bledy, []);
  prawda(wynik.every(d => d.posilki.przekaska.danie === "x1"));
});

test("z limitem 2 to samo danie wchodzi najwyżej dwa razy, reszta to błąd", () => {
  const okres = nowyOkres("2026-08-03", 5);
  const siatka = pustaSiatka(okres, domyslnyRytm(D, ["przekaska"]));
  const JEDNO = [{ id: "x1", typy: ["przekaska"] }];
  const { siatka: wynik, bledy } = ulozPlan(siatka, JEDNO, 2);
  const wypelnione = wynik.filter(d => d.posilki.przekaska.danie === "x1").length;
  rowne(wypelnione, 2);
  rowne(bledy.length, 3, "trzy dni zostają bez propozycji");
  prawda(bledy.every(b => /limit powtórzeń/.test(b)));
});

test("rzuca na zły limit", () => {
  const okres = nowyOkres("2026-08-03", 1);
  const siatka = pustaSiatka(okres, domyslnyRytm(D, ["lunch"]));
  try { ulozPlan(siatka, DANIA, 0); throw new Error("nie rzucił"); }
  catch (e) { prawda(/Limit/.test(e.message)); }
});

console.log("\n— determinizm —");

test("z tym samym losuj daje ten sam wynik", () => {
  const okres = nowyOkres("2026-08-03", 3);
  const siatka = pustaSiatka(okres, domyslnyRytm(D, ["sniadanie"]));
  const seq = [0.1, 0.9, 0.4];
  const gen = () => seq[gen.i++ % seq.length];
  gen.i = 0;
  const a = ulozPlan(siatka, [DANIA[0], DANIA[1]], null, gen).siatka;
  gen.i = 0;
  const b = ulozPlan(siatka, [DANIA[0], DANIA[1]], null, gen).siatka;
  rowne(a, b);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
