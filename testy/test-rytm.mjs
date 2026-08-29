import { sprawdzWersje, WERSJA_DANYCH } from "../wersja.js";
import { dataISO, nowyOkres, kluczOkresu, dniOkresu, okresPrzesuniety,
         domyslnyRytm, pustaSiatka, wylaczPosilek, wlaczPosilek, zmienKtoJe,
         oznaczBezSkladnikow, przypiszDanie, porcjePotrzebne, planKompletny } from "../rytm.js";

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

const D = [{ id: "d1", imie: "Ala" }, { id: "d2", imie: "Ola" }];

console.log("\n— okres —");

test("nowyOkres: domyślnie 7 dni", () => {
  rowne(nowyOkres("2026-08-03").dni, 7);
});

test("nowyOkres: długość jest ustawieniem, nie stałą", () => {
  rowne(nowyOkres("2026-08-03", 3).dni, 3);
  rowne(nowyOkres("2026-08-03", 14).dni, 14);
  rowne(nowyOkres("2026-08-03", 1).dni, 1);
});

test("nowyOkres: rzuca na złą długość", () => {
  try { nowyOkres("2026-08-03", 0); throw new Error("nie rzucił"); } catch (e) { prawda(/Długość/.test(e.message)); }
  try { nowyOkres("2026-08-03", -2); throw new Error("nie rzucił"); } catch (e) { prawda(/Długość/.test(e.message)); }
});

test("dniOkresu: zwraca właściwą liczbę kolejnych dat", () => {
  const dni = dniOkresu(nowyOkres("2026-08-03", 5));
  rowne(dni, ["2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07"]);
});

test("dniOkresu: poprawnie przechodzi przez koniec miesiąca", () => {
  const dni = dniOkresu(nowyOkres("2026-08-30", 3));
  rowne(dni, ["2026-08-30", "2026-08-31", "2026-09-01"]);
});

test("dniOkresu: okres jednodniowy", () => {
  rowne(dniOkresu(nowyOkres("2026-08-03", 1)), ["2026-08-03"]);
});

test("kluczOkresu: data startu", () => {
  rowne(kluczOkresu(nowyOkres("2026-08-03", 10)), "2026-08-03");
});

test("okresPrzesuniety: przesuwa o całe okresy, zachowuje długość", () => {
  const a = nowyOkres("2026-08-03", 5);
  const nastepny = okresPrzesuniety(a, 1);
  rowne(nastepny, { start: "2026-08-08", dni: 5 });
  const poprzedni = okresPrzesuniety(a, -1);
  rowne(poprzedni, { start: "2026-07-29", dni: 5 });
});

console.log("\n— rytm domyślny: żadnych założeń o tym, kto je co —");

test("domyslnyRytm: wszystkie typy włączone, je je cały dom", () => {
  const r = domyslnyRytm(D, ["sniadanie", "kolacja"]);
  rowne(r.sniadanie, { wlaczony: true, kto: ["d1", "d2"] });
  rowne(r.kolacja, { wlaczony: true, kto: ["d1", "d2"] });
});

test("domyslnyRytm: dom jednoosobowy, bez specjalnego przypadku", () => {
  const r = domyslnyRytm([{ id: "d1", imie: "Ala" }], ["lunch"]);
  rowne(r.lunch.kto, ["d1"]);
});

console.log("\n— siatka —");

test("pustaSiatka: tyle dni, ile okres, wszystkie typy z rytmu obecne", () => {
  const okres = nowyOkres("2026-08-03", 2);
  const rytm = domyslnyRytm(D, ["sniadanie", "kolacja"]);
  const s = pustaSiatka(okres, rytm);
  rowne(s.length, 2);
  rowne(Object.keys(s[0].posilki).sort(), ["kolacja", "sniadanie"]);
  rowne(s[0].posilki.sniadanie, { kto: ["d1", "d2"], danie: null, bezSkladnikow: null });
});

test("pustaSiatka: typ wyłączony w rytmie w ogóle nie trafia do siatki", () => {
  const rytm = domyslnyRytm(D, ["sniadanie"]);
  rytm.sniadanie.wlaczony = false;
  const s = pustaSiatka(nowyOkres("2026-08-03", 1), rytm);
  rowne(Object.keys(s[0].posilki), []);
});

test("wylaczPosilek: usuwa tylko wskazany posiłek w jednym dniu, nie mutuje", () => {
  const okres = nowyOkres("2026-08-03", 2);
  const rytm = domyslnyRytm(D, ["sniadanie", "kolacja"]);
  const oryginal = pustaSiatka(okres, rytm);
  const nowa = wylaczPosilek(oryginal, "2026-08-03", "sniadanie");
  rowne(Object.keys(nowa[0].posilki).sort(), ["kolacja"]);
  rowne(Object.keys(nowa[1].posilki).sort(), ["kolacja", "sniadanie"], "drugi dzień nietknięty");
  prawda("sniadanie" in oryginal[0].posilki, "oryginał nie zmieniony");
});

test("wlaczPosilek: przywraca posiłek z podaną listą jedzących", () => {
  const okres = nowyOkres("2026-08-03", 1);
  const rytm = domyslnyRytm(D, ["lunch"]);
  rytm.lunch.wlaczony = false;
  const s0 = pustaSiatka(okres, rytm);
  const s1 = wlaczPosilek(s0, "2026-08-03", "lunch", ["d1"]);
  rowne(s1[0].posilki.lunch, { kto: ["d1"], danie: null, bezSkladnikow: null });
});

test("zmienKtoJe: nadpisuje tylko wskazany dzień, reszta okresu zostaje domyślna", () => {
  const okres = nowyOkres("2026-08-03", 2);
  const rytm = domyslnyRytm(D, ["kolacja"]);
  const s0 = pustaSiatka(okres, rytm);
  const s1 = zmienKtoJe(s0, "2026-08-03", "kolacja", ["d1"]);
  rowne(s1[0].posilki.kolacja.kto, ["d1"]);
  rowne(s1[1].posilki.kolacja.kto, ["d1", "d2"], "drugi dzień nietknięty");
});

test("zmienKtoJe: rzuca, gdy lista pusta", () => {
  const s0 = pustaSiatka(nowyOkres("2026-08-03", 1), domyslnyRytm(D, ["lunch"]));
  try { zmienKtoJe(s0, "2026-08-03", "lunch", []); throw new Error("nie rzucił"); }
  catch (e) { prawda(/chociaż jedną/.test(e.message)); }
});

test("zmienKtoJe: rzuca, gdy posiłek jest wyłączony tego dnia", () => {
  const okres = nowyOkres("2026-08-03", 1);
  const s0 = pustaSiatka(okres, domyslnyRytm(D, ["lunch"]));
  const s1 = wylaczPosilek(s0, "2026-08-03", "lunch");
  try { zmienKtoJe(s1, "2026-08-03", "lunch", ["d1"]); throw new Error("nie rzucił"); }
  catch (e) { prawda(/wyłączony/.test(e.message)); }
});

test("oznaczBezSkladnikow: ustawia etykietę i czyści przypisane danie", () => {
  const okres = nowyOkres("2026-08-03", 1);
  let s = pustaSiatka(okres, domyslnyRytm(D, ["kolacja"]));
  s = przypiszDanie(s, "2026-08-03", "kolacja", "danie-1");
  s = oznaczBezSkladnikow(s, "2026-08-03", "kolacja", "na mieście");
  rowne(s[0].posilki.kolacja.bezSkladnikow, "na mieście");
  rowne(s[0].posilki.kolacja.danie, null, "przypisane danie skasowane");
});

test("oznaczBezSkladnikow: rzuca na pustą etykietę", () => {
  const s = pustaSiatka(nowyOkres("2026-08-03", 1), domyslnyRytm(D, ["lunch"]));
  try { oznaczBezSkladnikow(s, "2026-08-03", "lunch", "  "); throw new Error("nie rzucił"); }
  catch (e) { prawda(/Etykieta/.test(e.message)); }
});

test("przypiszDanie: ustawia danie i czyści bezSkladnikow", () => {
  const okres = nowyOkres("2026-08-03", 1);
  let s = pustaSiatka(okres, domyslnyRytm(D, ["lunch"]));
  s = oznaczBezSkladnikow(s, "2026-08-03", "lunch", "resztki");
  s = przypiszDanie(s, "2026-08-03", "lunch", "danie-9");
  rowne(s[0].posilki.lunch.danie, "danie-9");
  rowne(s[0].posilki.lunch.bezSkladnikow, null);
});

console.log("\n— porcje: bez tabeli ILE_OSOB, tylko liczba jedzących —");

test("porcjePotrzebne: liczy z listy kto, nie z osobnej tabeli", () => {
  const okres = nowyOkres("2026-08-03", 1);
  let s = pustaSiatka(okres, domyslnyRytm(D, ["kolacja"]));
  rowne(porcjePotrzebne(s[0], "kolacja"), 2);
  s = zmienKtoJe(s, "2026-08-03", "kolacja", ["d1"]);
  rowne(porcjePotrzebne(s[0], "kolacja"), 1, "po zmianie liczy się nowa lista");
});

test("porcjePotrzebne: 0, gdy posiłek nie istnieje tego dnia", () => {
  const s = pustaSiatka(nowyOkres("2026-08-03", 1), domyslnyRytm(D, ["lunch"]));
  rowne(porcjePotrzebne(s[0], "sniadanie"), 0);
});

console.log("\n— wersja kształtu danych —");

test("dane z tej samej wersji przechodzą bez ostrzeżenia", () => {
  rowne(sprawdzWersje({ wersja: WERSJA_DANYCH, siatka: [] }), null);
});

test("dane bez pola wersji traktujemy jak wersję 1", () => {
  /* Wszystko, co zapisano przed wprowadzeniem tego pola. Musi dalej działać,
     inaczej wersjonowanie zepsułoby to, przed czym miało chronić. */
  rowne(sprawdzWersje({ siatka: [] }), null);
});

test("dane z nowszej wersji dają ostrzeżenie zamiast cichego nadpisania", () => {
  const w = sprawdzWersje({ wersja: WERSJA_DANYCH + 1, siatka: [] });
  rowne(typeof w === "string" && w.length > 0, true, "spodziewam się komunikatu");
});

console.log("\n— czy plan z bazy jest kompletny —");

/* Awaria z 29 sierpnia. Wybór dania w pustym jadłospisie zapisywał do bazy jeden
   punkt, `siatka/0/posilki/obiad`. Powstawał tam plan z jednego dnia i bez okresu,
   nasłuch odsyłał go z powrotem, a ekran zastępował nim cały tydzień. Najgorsze
   było to, jak niewinnie ten ładunek wygląda: jednoelementowa tablica to przecież
   poprawna tablica. */

const okresTygodnia = nowyOkres("2026-08-03", 7);
const rytmTestowy = domyslnyRytm(["a", "b"], ["obiad"]);
const planPelny = { okres: okresTygodnia, siatka: pustaSiatka(okresTygodnia, rytmTestowy) };

test("kompletny plan przechodzi", () => {
  rowne(planKompletny(planPelny), true);
});

test("jednodniowa siatka przy siedmiodniowym okresie odpada", () => {
  /* To jest DOKŁADNIE ten ładunek, który zjadł tydzień. */
  rowne(planKompletny({ okres: okresTygodnia, siatka: [planPelny.siatka[0]] }), false);
});

test("plan bez zapisanego okresu odpada", () => {
  rowne(planKompletny({ siatka: planPelny.siatka }), false);
});

test("siatka oddana przez Firebase jako obiekt odpada", () => {
  /* Zapis pod sam indeks 3 wraca nie jako tablica z dziurami, tylko jako
     obiekt { "3": … } — i bez tego sprawdzenia szedł dalej jak gdyby nigdy nic. */
  rowne(planKompletny({ okres: okresTygodnia, siatka: { 3: planPelny.siatka[3] } }), false);
});

test("dzień bez daty odpada", () => {
  const zepsuta = planPelny.siatka.map((d, i) => i === 2 ? { posilki: d.posilki } : d);
  rowne(planKompletny({ okres: okresTygodnia, siatka: zepsuta }), false);
});

test("dziura w siatce odpada", () => {
  /* Firebase zwraca null tam, gdzie w gęstej tablicy brakuje elementu. */
  const zDziura = planPelny.siatka.map((d, i) => i === 4 ? null : d);
  rowne(planKompletny({ okres: okresTygodnia, siatka: zDziura }), false);
});

test("siatka, która nie jest listą, odpada zamiast rzucić wyjątkiem", () => {
  /* Napis o długości siedmiu znaków ma `length` równe siedem i przechodzi
     sprawdzenie długości — a potem nie ma metody `every` i funkcja wybucha.
     Wyjątek tutaj byłby gorszy niż fałsz: leci z nasłuchu bazy, więc zabiłby
     cały ekran zamiast jednego niepoprawnego planu (decyzja 75). */
  rowne(planKompletny({ okres: okresTygodnia, siatka: "poniedz" }), false);
});

test("brak danych w ogóle odpada, bez wyjątku", () => {
  rowne(planKompletny(null), false);
  rowne(planKompletny(undefined), false);
  rowne(planKompletny({}), false);
});

test("okres z bzdurną liczbą dni odpada", () => {
  rowne(planKompletny({ okres: { start: "2026-08-03", dni: 0 }, siatka: [] }), false);
  rowne(planKompletny({ okres: { start: "2026-08-03", dni: "7" }, siatka: planPelny.siatka }), false);
});

test("plan jednodniowy jest poprawny, gdy okres NAPRAWDĘ ma jeden dzień", () => {
  /* Bo długość okresu to ustawienie, nie stała — ktoś może planować z dnia na dzień
     i jego plan nie może wyglądać jak awaria. */
  const jeden = nowyOkres("2026-08-03", 1);
  rowne(planKompletny({ okres: jeden, siatka: pustaSiatka(jeden, rytmTestowy) }), true);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
