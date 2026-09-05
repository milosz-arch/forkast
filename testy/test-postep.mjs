import { stanPoczatkowy, zachetaPoczatkowa, daniaDoOceny, POTRZEBA_DAN, OTWORZ_PO_PRZEJRZANYCH } from "../postep.js";
import { TALIA_STARTOWA } from "../talia-startowa.js";
import { filtrujTalie } from "../wykluczenia.js";
import { readFileSync } from "fs";

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


console.log("\n— karta Dań znika, gdy nie ma czego oceniać (decyzja 115) —");

test("bez informacji o wykluczeniach doOceny jest null — pasek pokazuje kartę", () => {
  rowne(stanPoczatkowy({}).doOceny, null);
  rowne(daniaDoOceny({}, null), null);
});

test("pusty stół: do oceny tyle, ile dań startowych; ocenione odejmują", () => {
  rowne(daniaDoOceny({}, []), TALIA_STARTOWA.length);
  const pref = { [TALIA_STARTOWA[0].id]: "lubie", [TALIA_STARTOWA[1].id]: "nielubie" };
  rowne(daniaDoOceny(pref, []), TALIA_STARTOWA.length - 2);
});

test("wszystko ocenione → 0; danie własne (id spoza talii) nie budzi karty", () => {
  const pref = Object.fromEntries(TALIA_STARTOWA.map(d => [d.id, "nielubie"]));
  rowne(daniaDoOceny(pref, []), 0);
  rowne(daniaDoOceny({ ...pref, "-Nwlasne": "lubie" }, []), 0);
});

test("liczone PO wykluczeniach: dom bez mięsa nie musi oceniać schabowego", () => {
  const bezMiesa = filtrujTalie(TALIA_STARTOWA, ["mieso"]);
  rowne(bezMiesa.length < TALIA_STARTOWA.length, true, "wykluczenie mięsa nic nie odfiltrowało — test nic nie sprawdza");
  const pref = Object.fromEntries(bezMiesa.map(d => [d.id, "lubie"]));
  rowne(daniaDoOceny(pref, ["mieso"]), 0, "goła lista");
  rowne(daniaDoOceny(pref, { ustawione: true, lista: ["mieso"] }), 0, "kształt z bazy");
  rowne(daniaDoOceny(pref, []) > 0, true, "bez wykluczeń te same oceny nie wystarczą");
});

test("każdy ekran przekazuje wykluczenia do stanPoczatkowy — inaczej karta nigdy nie zniknie", () => {
  const ekrany = ["dodaj-z-ai","formularz","jadlospis","przepisy","ustawienia","zakupy","talia"];
  for (const e of ekrany) {
    const html = readFileSync(new URL(`../${e}.html`, import.meta.url), "utf8");
    const wywolania = [...html.matchAll(/stanPoczatkowy\(((?:[^()]|\([^()]*\))*)\)/g)].map(m => m[1]);
    rowne(wywolania.length > 0, true, `${e}: brak stanPoczatkowy`);
    for (const w of wywolania) rowne(w.includes(","), true, `${e}: stanPoczatkowy(${w}) bez wykluczeń`);
  }
  const powloka = readFileSync(new URL("../powloka.js", import.meta.url), "utf8");
  rowne(/get zakladki\(\)[\s\S]*?this\.daniaDoOceny !== 0/.test(powloka), true, "powloka nie chowa karty Dań");
  const ust = readFileSync(new URL("../ustawienia.html", import.meta.url), "utf8");
  rowne(/daniaDoOceny === 0[\s\S]*?href="talia\.html"/.test(ust), true, "Ustawienia nie mają drogi powrotu do Dań");
  const talia = readFileSync(new URL("../talia.html", import.meta.url), "utf8");
  rowne(/@click="przejrzyjOdNowa\(\)"/.test(talia) && /przejrzyjOdNowa\(\) \{/.test(talia), true, "talia bez „Przejrzyj jeszcze raz”");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
