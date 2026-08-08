import { walidujDanie } from "../formularz.js";

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

const SLOWNIK = [{ n: "Jajka" }, { n: "Ryż basmati" }, { n: "Pierś z kurczaka" }];

console.log("\n— poprawne dane —");

test("kompletne, poprawne danie przechodzi", () => {
  const r = walidujDanie({
    nazwa: "  Kurczak z ryżem  ", typy: ["obiad"], porcje: 2,
    skladniki: [{ produkt: "Pierś z kurczaka", gramy: 300 }, { produkt: "Ryż basmati", gramy: 150 }]
  }, SLOWNIK);
  prawda(r.ok);
  rowne(r.danie.nazwa, "Kurczak z ryżem", "przycięte spacje");
  rowne(r.danie.kroki, [], "brak kroków to zamierzone, nie błąd");
});

test("kilka typów naraz jest dozwolone", () => {
  const r = walidujDanie({
    nazwa: "X", typy: ["śniadanie", "kolacja"], porcje: 1,
    skladniki: [{ produkt: "Jajka", gramy: 100 }]
  }, SLOWNIK);
  prawda(r.ok);
  rowne(r.danie.typy, ["śniadanie", "kolacja"]);
});

console.log("\n— braki —");

test("pusta nazwa to błąd", () => {
  const r = walidujDanie({ nazwa: "  ", typy: ["obiad"], porcje: 1,
    skladniki: [{ produkt: "Jajka", gramy: 100 }] }, SLOWNIK);
  prawda(!r.ok);
  prawda(r.bledy.some(b => /nazwę/.test(b)));
});

test("brak typu to błąd", () => {
  const r = walidujDanie({ nazwa: "X", typy: [], porcje: 1,
    skladniki: [{ produkt: "Jajka", gramy: 100 }] }, SLOWNIK);
  prawda(!r.ok);
  prawda(r.bledy.some(b => /typ posiłku/.test(b)));
});

test("wymyślony typ jest odfiltrowany, więc liczy się jak brak", () => {
  const r = walidujDanie({ nazwa: "X", typy: ["brunch"], porcje: 1,
    skladniki: [{ produkt: "Jajka", gramy: 100 }] }, SLOWNIK);
  prawda(!r.ok);
});

test("brak porcji, zero, ujemna i za duża liczba to błąd", () => {
  for (const porcje of [undefined, 0, -1, 13, "dużo"]) {
    const r = walidujDanie({ nazwa: "X", typy: ["obiad"], porcje,
      skladniki: [{ produkt: "Jajka", gramy: 100 }] }, SLOWNIK);
    prawda(!r.ok, `porcje=${porcje} powinno się nie udać`);
  }
});

test("brak składników to błąd", () => {
  const r = walidujDanie({ nazwa: "X", typy: ["obiad"], porcje: 1, skladniki: [] }, SLOWNIK);
  prawda(!r.ok);
  prawda(r.bledy.some(b => /składnik/.test(b)));
});

test("produkt spoza słownika to błąd, z nazwą w komunikacie", () => {
  const r = walidujDanie({ nazwa: "X", typy: ["obiad"], porcje: 1,
    skladniki: [{ produkt: "Coś nieznanego", gramy: 100 }] }, SLOWNIK);
  prawda(!r.ok);
  prawda(r.bledy.some(b => b.includes("Coś nieznanego")));
});

test("brak albo zła gramatura to błąd", () => {
  for (const gramy of [undefined, 0, -5, "dużo"]) {
    const r = walidujDanie({ nazwa: "X", typy: ["obiad"], porcje: 1,
      skladniki: [{ produkt: "Jajka", gramy }] }, SLOWNIK);
    prawda(!r.ok, `gramy=${gramy} powinno się nie udać`);
  }
});

test("jeden zły składnik nie ukrywa błędów w innych — zbiera wszystkie", () => {
  const r = walidujDanie({ nazwa: "X", typy: ["obiad"], porcje: 1,
    skladniki: [{ produkt: "Nieznany", gramy: 100 }, { produkt: "Jajka", gramy: 0 }] }, SLOWNIK);
  prawda(!r.ok);
  rowne(r.bledy.length, 2);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
