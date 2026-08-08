import { stanPoczatkowy, zachetaPoczatkowa, POTRZEBA_DAN, OTWORZ_PO_PRZEJRZANYCH } from "../postep.js";

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function rowne(a, b, opis = "") {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${opis}\n       jest: ${JSON.stringify(a)}\n       spodziewam: ${JSON.stringify(b)}`);
}
const lubie = n => Object.fromEntries(Array.from({length: n}, (_, i) => [`d${i}`, "lubie"]));
const nie = n => Object.fromEntries(Array.from({length: n}, (_, i) => [`n${i}`, "nielubie"]));

console.log("\n— pierwsze kroki —");

test("pusty stół jest zamknięty", () => {
  rowne(stanPoczatkowy({}).odblokowane, false);
});

test(`${POTRZEBA_DAN} polubionych otwiera`, () => {
  rowne(stanPoczatkowy(lubie(POTRZEBA_DAN)).odblokowane, true);
});

test(`${POTRZEBA_DAN - 1} polubionych jeszcze nie otwiera`, () => {
  const s = stanPoczatkowy(lubie(POTRZEBA_DAN - 1));
  rowne([s.odblokowane, s.brakuje], [false, 1]);
});

test("brak preferencji nie wywala się", () => {
  rowne(stanPoczatkowy().odblokowane, false);
  rowne(stanPoczatkowy(null).odblokowane, false);
});

test(`${OTWORZ_PO_PRZEJRZANYCH} odrzuceń też otwiera`, () => {
  /* Wyjście awaryjne: ktoś, komu nic nie pasuje, nie może zostać zamknięty
     przed resztą apki na zawsze. */
  rowne(stanPoczatkowy(nie(OTWORZ_PO_PRZEJRZANYCH)).odblokowane, true);
});

test("odrzucenia nie liczą się jako polubione", () => {
  rowne(stanPoczatkowy(nie(15)).polubione, 0);
});

test("zachęta znika po odblokowaniu", () => {
  rowne(zachetaPoczatkowa(stanPoczatkowy(lubie(POTRZEBA_DAN))), "");
});

test("zachęta na starcie mówi, po co to robimy", () => {
  const t = zachetaPoczatkowa(stanPoczatkowy({}));
  rowne(t.includes("jadłospis") && t.includes("zakupy"), true, "ma tłumaczyć cel, nie tylko liczyć");
});

test("liczebnik przy jednym brakującym daniu jest poprawny", () => {
  rowne(zachetaPoczatkowa(stanPoczatkowy(lubie(POTRZEBA_DAN - 1))).includes("Jeszcze jedno"), true);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
