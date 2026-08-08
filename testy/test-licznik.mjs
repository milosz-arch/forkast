/* =====================================================================
   LICZNIK — kalorie i makro z tego, co ktoś odhaczył jako zjedzone.

   Sedno tych testów: JEDNOSTKĄ JEST PORCJA JEDNEJ OSOBY i ma się zgadzać
   z tym, co wcześniej policzyła lista zakupów. Jeśli lista kupiła składniki
   na dwie osoby, a odhaczy jedna, ze spiżarni ma zejść połowa — nie całość
   i nie nic (decyzja 77).
   ===================================================================== */

import { porcjaDania, zuzycieJednejOsoby, kluczPosilku, dzienOsoby,
         czyZjadlem, ileOdhaczylo, opisDnia } from "../licznik.js";
import { poZuzyciu } from "../spizarnia.js";
import { policzZakupy } from "../zakupy.js";
import { nowyOkres, domyslnyRytm, pustaSiatka, przypiszDanie } from "../rytm.js";

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function rowne(a, b, opis = "") {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${opis}\n       jest: ${JSON.stringify(a)}\n       spodziewam: ${JSON.stringify(b)}`);
}
function prawda(w, co) { if (!w) throw new Error(co || "oczekiwano prawdy"); }

const SLOWNIK = [
  { n: "Ryż basmati", kcal: 350, bialko: 7,  wegle: 78, tluszcz: 1 },
  { n: "Jajka",       kcal: 140, bialko: 12, wegle: 1,  tluszcz: 10 },
  { n: "Oliwa",       kcal: 900, bialko: 0,  wegle: 0,  tluszcz: 100 },
];

const DANIE = {
  id: "a", nazwa: "Ryż z jajkiem", porcje: 2,
  skladniki: [{ produkt: "Ryż basmati", gramy: 200 }, { produkt: "Jajka", gramy: 100 }],
};

console.log("\n— porcja jednej osoby —");

test("kalorie i makro liczą się ze składników, na jedną porcję", () => {
  /* 200 g ryżu = 700 kcal, 100 g jajek = 140 kcal, razem 840 na dwie porcje. */
  const p = porcjaDania(DANIE, SLOWNIK);
  rowne(p.kcal, 420);
  rowne(p.bialko, 13);     // (7*2 + 12*1) / 2 = 13
  rowne(p.wegle, 79);      // (78*2 + 1*1) / 2 = 78.5 → 79
  rowne(p.tluszcz, 6);     // (1*2 + 10*1) / 2 = 6
});

test("danie na cztery porcje daje ćwiartkę, nie połowę", () => {
  const naCztery = { ...DANIE, porcje: 4 };
  rowne(porcjaDania(naCztery, SLOWNIK).kcal, 210);
});

test("produkt spoza słownika jest ZGŁASZANY, nie pomijany po cichu", () => {
  /* Zaniżona liczba bez ostrzeżenia jest gorsza niż brak liczby: człowiek
     zobaczy 300 kcal zamiast 700 i nie ma jak się dowiedzieć, że czegoś brakuje. */
  const zObcym = { ...DANIE, skladniki: [...DANIE.skladniki, { produkt: "Sos tajemniczy", gramy: 50 }] };
  const p = porcjaDania(zObcym, SLOWNIK);
  rowne(p.nieznane, ["Sos tajemniczy"]);
  rowne(p.kcal, 420, "znane składniki mają się policzyć mimo nieznanego");
});

test("danie bez wiarygodnej liczby porcji nie zmyśla liczb", () => {
  rowne(porcjaDania({ ...DANIE, porcje: 0 }, SLOWNIK).kcal, 0);
  rowne(porcjaDania({ ...DANIE, porcje: "dużo" }, SLOWNIK).kcal, 0);
  rowne(porcjaDania(null, SLOWNIK).kcal, 0);
});

console.log("\n— zużycie ze spiżarni: ptaszek jednej osoby —");

test("jedna osoba zdejmuje ze spiżarni dokładnie swoją porcję", () => {
  rowne(zuzycieJednejOsoby(DANIE), [
    { produkt: "Ryż basmati", gramy: 100 },
    { produkt: "Jajka", gramy: 50 },
  ]);
});

test("ZGODNOŚĆ Z LISTĄ ZAKUPÓW: co lista kupiła na jedną osobę, to ptaszek zdejmuje", () => {
  /* To jest test, dla którego ten plik powstał. Lista zakupów skaluje składniki
     przez `liczba jedzących / porcje`. Gdyby licznik liczył inaczej, spiżarnia
     rozjechałaby się z listą po pierwszym odhaczeniu — cicho i nieodwracalnie. */
  const JEDNO = [{ id: "d1", imie: "Ala" }];
  let s = pustaSiatka(nowyOkres("2026-08-10", 1), domyslnyRytm(JEDNO, ["obiad"]));
  s = przypiszDanie(s, "2026-08-10", "obiad", "a");
  const { pozycje } = policzZakupy(s, [DANIE]);

  const zLicznika = zuzycieJednejOsoby(DANIE);
  for (const p of pozycje) {
    const l = zLicznika.find(x => x.produkt === p.produkt);
    prawda(l, `licznik nie zna produktu ${p.produkt}`);
    rowne(l.gramy, p.gramy, `rozjazd na ${p.produkt}`);
  }
});

test("zużycie wchodzi do poZuzyciu i realnie zmniejsza zapas", () => {
  const zmiany = poZuzyciu({ "ryz-basmati": 500, jajka: 200 }, zuzycieJednejOsoby(DANIE));
  rowne(zmiany, { "ryz-basmati": 400, jajka: 150 });
});

test("czego nie ma w spiżarni, tego ptaszek nie odejmuje", () => {
  rowne(poZuzyciu({}, zuzycieJednejOsoby(DANIE)), {});
});

console.log("\n— dzień jednej osoby —");

const DZIEN = {
  data: "2026-08-10",
  posilki: {
    obiad:   { danie: "a", kto: ["d1", "d2"] },
    kolacja: { danie: "a", kto: ["d1"] },
    obiad2:  { danie: null, kto: ["d1"] },
  },
};

test("liczy się TYLKO to, co odhaczyła ta osoba", () => {
  const zjedzone = { [kluczPosilku("2026-08-10", "obiad")]: { d1: true, d2: true } };
  rowne(dzienOsoby(DZIEN, zjedzone, "d1", [DANIE], SLOWNIK).kcal, 420);
  rowne(dzienOsoby(DZIEN, zjedzone, "d2", [DANIE], SLOWNIK).kcal, 420);
});

test("cudzy ptaszek nie dolicza mi kalorii", () => {
  const zjedzone = { [kluczPosilku("2026-08-10", "obiad")]: { d2: true } };
  rowne(dzienOsoby(DZIEN, zjedzone, "d1", [DANIE], SLOWNIK).posilkow, 0);
});

test("dwa odhaczone posiłki sumują się", () => {
  const zjedzone = {
    [kluczPosilku("2026-08-10", "obiad")]: { d1: true },
    [kluczPosilku("2026-08-10", "kolacja")]: { d1: true },
  };
  const s = dzienOsoby(DZIEN, zjedzone, "d1", [DANIE], SLOWNIK);
  rowne([s.kcal, s.posilkow], [840, 2]);
});

test("nieodhaczone nie liczy się w ogóle — apka nie zgaduje za człowieka", () => {
  rowne(dzienOsoby(DZIEN, {}, "d1", [DANIE], SLOWNIK).posilkow, 0);
});

test("bez wiedzy, kim jestem, licznik nic nie pokazuje", () => {
  const zjedzone = { [kluczPosilku("2026-08-10", "obiad")]: { d1: true } };
  rowne(dzienOsoby(DZIEN, zjedzone, null, [DANIE], SLOWNIK).posilkow, 0);
});

test("posiłek bez składników („na mieście”) nie wchodzi do licznika", () => {
  const dzien = { data: "2026-08-10",
    posilki: { obiad: { danie: "a", kto: ["d1"], bezSkladnikow: "na mieście" } } };
  const zjedzone = { [kluczPosilku("2026-08-10", "obiad")]: { d1: true } };
  rowne(dzienOsoby(dzien, zjedzone, "d1", [DANIE], SLOWNIK).posilkow, 0);
});

test("danie skasowane z bazy nie wywala licznika", () => {
  const zjedzone = { [kluczPosilku("2026-08-10", "obiad")]: { d1: true } };
  rowne(dzienOsoby(DZIEN, zjedzone, "d1", [], SLOWNIK).kcal, 0);
});

console.log("\n— odczyt dla człowieka —");

test("klucz posiłku nie zawiera znaków zakazanych w Firebase", () => {
  const k = kluczPosilku("2026-08-10", "drugie śniadanie");
  prawda(!/[.#$[\]/]/.test(k), `zły klucz: ${k}`);
});

test("czyZjadlem i ileOdhaczylo mówią prawdę", () => {
  const zjedzone = { [kluczPosilku("2026-08-10", "obiad")]: { d1: true, d2: true } };
  prawda(czyZjadlem(zjedzone, "2026-08-10", "obiad", "d1"));
  prawda(!czyZjadlem(zjedzone, "2026-08-10", "kolacja", "d1"));
  rowne(ileOdhaczylo(zjedzone, "2026-08-10", "obiad"), 2);
  rowne(ileOdhaczylo(zjedzone, "2026-08-10", "kolacja"), 0);
});

test("pusty dzień mówi „nic jeszcze nie odhaczone”, nie „0 kcal”", () => {
  /* „0 kcal” przy dniu, w którym ktoś normalnie jadł, wygląda jak głodówka
     i jak zarzut. Brak danych to brak danych. */
  rowne(opisDnia({ posilkow: 0, kcal: 0 }), "nic jeszcze nie odhaczone");
  rowne(opisDnia({ posilkow: 1, kcal: 420, bialko: 13, wegle: 79, tluszcz: 6 }),
        "420 kcal · B 13 · W 79 · T 6");
});

console.log("\n— cała talia liczy się bez dziur —");

const { TALIA_STARTOWA } = await import("../talia-startowa.js");
const { PRODUKTY } = await import("../produkty.js");

test("KAŻDE danie w talii ma policzalne kalorie", () => {
  const bez = TALIA_STARTOWA.filter(d => porcjaDania(d, PRODUKTY).kcal <= 0);
  rowne(bez.map(d => d.nazwa), [], "danie bez kalorii pokaże człowiekowi zero i nic nie wyjaśni");
});

test("ŻADNE danie w talii nie ma składnika spoza słownika", () => {
  const zObcymi = TALIA_STARTOWA
    .map(d => ({ nazwa: d.nazwa, obce: porcjaDania(d, PRODUKTY).nieznane }))
    .filter(x => x.obce.length);
  rowne(zObcymi, [], "składnik spoza słownika zaniża kalorie tego dania");
});

test("kalorie porcji mieszczą się w rozsądnych granicach", () => {
  /* Nie ocena, tylko wykrywacz pomyłki o rząd wielkości: porcja pod 50 kcal
     albo powyżej 1800 kcal to prawie na pewno zła gramatura albo złe `porcje`. */
  const dziwne = TALIA_STARTOWA
    .map(d => ({ nazwa: d.nazwa, kcal: porcjaDania(d, PRODUKTY).kcal }))
    .filter(x => x.kcal < 50 || x.kcal > 1800);
  rowne(dziwne, []);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
