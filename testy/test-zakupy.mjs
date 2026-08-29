import { policzZakupy, pogrupujDzialami, opisIlosci, kopiaNadajeSie,
         normalizujDopisek, dzialDopisku, normalizujIlosc } from "../zakupy.js";
import { PRODUKTY } from "../produkty.js";
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

console.log("\n— kopia listy zapisana w telefonie —");

test("kopia bez pola gramy jest odrzucana, a nie liczona", () => {
  /* Tak wyglądała lista zapisywana przed v45. Spiżarnia odejmuje od `gramy`
     i celowo rzuca wyjątkiem, gdy liczby nie ma — więc taka kopia wywracała
     CAŁY ekran Zakupów i nie dało się z tego wyjść odświeżeniem, bo kopia
     zostawała w telefonie (decyzja 75). */
  const stara = [{ produkt: "Ryż basmati", ile: "400 g", zDan: "Kurczak" }];
  prawda(!kopiaNadajeSie(stara), "stary format przeszedł jako dobry");
});

test("kopia z kompletem pól przechodzi", () => {
  prawda(kopiaNadajeSie([{ produkt: "Ryż basmati", gramy: 400 }]));
});

test("pusta, brakująca i uszkodzona kopia nie udaje dobrej", () => {
  prawda(!kopiaNadajeSie([]), "pusta lista nie ma czego pokazać");
  prawda(!kopiaNadajeSie(null));
  prawda(!kopiaNadajeSie(undefined));
  prawda(!kopiaNadajeSie("[]"));
  prawda(!kopiaNadajeSie([{ produkt: "Mąka", gramy: NaN }]), "NaN to nie liczba do liczenia");
  prawda(!kopiaNadajeSie([{ produkt: "Mąka", gramy: "250" }]), "napis to nie liczba");
});

test("wystarczy JEDNA pozycja bez gramów, żeby odrzucić całą kopię", () => {
  /* Bo lista liczy się w całości: jedna pozycja bez liczby wywala spiżarnię
     dla wszystkich pozostałych. */
  prawda(!kopiaNadajeSie([{ produkt: "Ryż", gramy: 400 }, { produkt: "Mąka" }]));
});

console.log("\n— dopisane ręcznie pozycje —");

test("normalizujDopisek przycina i skleja odstępy", () => {
  rowne(normalizujDopisek("  pasta   do  zębów \n"), "pasta do zębów");
});

test("normalizujDopisek odrzuca pusty wpis zamiast dodawać pustą linijkę", () => {
  rowne(normalizujDopisek("   "), null);
  rowne(normalizujDopisek(""), null);
  rowne(normalizujDopisek(null), null);
  rowne(normalizujDopisek(undefined), null);
});

test("normalizujDopisek ucina wklejony przypadkiem akapit", () => {
  rowne(normalizujDopisek("a".repeat(400)).length, 100);
});

console.log("\n— dopisane: w który dział trafiają —");

/* Zgłoszenie Miłosza z 29 sierpnia: chleb dopisany ręcznie lądował w sekcji
   „Dopisane”, choć apka wie, że chleb to jedzenie. W sklepie chodzi się działami,
   nie źródłami danych. Testy chodzą po PRAWDZIWYM słowniku, nie po atrapie —
   bo cała trudność siedzi w tym, że w słowniku są i „Masło”, i „Masło orzechowe”. */

test("rzecz spoza spożywczych nie dostaje działu", () => {
  rowne(dzialDopisku("pasta do zębów", PRODUKTY), null);
  rowne(dzialDopisku("worki na śmieci", PRODUKTY), null);
  rowne(dzialDopisku("karma dla kota", PRODUKTY), null);
});

test("jedzenie trafia do działu ze słownika", () => {
  rowne(dzialDopisku("ser", PRODUKTY), "Nabiał");
  rowne(dzialDopisku("jajka", PRODUKTY), "Nabiał");
});

test("dokładne trafienie wygrywa z dłuższymi nazwami z innego działu", () => {
  /* „Masło” to Nabiał, ale „Masło orzechowe 100%” to Spiżarnia. Bez pierwszeństwa
     dla trafienia dokładnego wpis przegrywał sam ze sobą i szedł do Dopisanych. */
  rowne(dzialDopisku("Masło", PRODUKTY), "Nabiał");
});

test("bliższe trafienie wygrywa z ogólniejszym", () => {
  rowne(dzialDopisku("masło orzechowe", PRODUKTY), "Spiżarnia");
});

test("liczba z przodu nie psuje rozpoznania", () => {
  rowne(dzialDopisku("2 chleby", PRODUKTY), dzialDopisku("chleb", PRODUKTY));
  rowne(dzialDopisku("3x ryż", PRODUKTY), dzialDopisku("ryż", PRODUKTY));
});

test("polska końcówka nie psuje rozpoznania", () => {
  /* „chleby” nie zaczyna się od „chleb żytni razowy” ani odwrotnie —
     ratuje to dopiero wspólny początek. */
  rowne(dzialDopisku("chleby", PRODUKTY), dzialDopisku("chleb", PRODUKTY));
});

test("krótki wpis nie łapie przypadkowego produktu", () => {
  /* Dwie litery pasują do zbyt wielu rzeczy, a zły dział wysyła człowieka
     w złą alejkę — gorzej niż brak działu. */
  rowne(dzialDopisku("ry", PRODUKTY), null);
  rowne(dzialDopisku("ma", PRODUKTY), null);
});

test("wpis pasujący do dwóch różnych działów zostaje bez działu", () => {
  const atrapa = [{ n: "Kawa mielona", dzial: "Spiżarnia" },
                  { n: "Kawa rozpuszczalna", dzial: "Szafka" }];
  rowne(dzialDopisku("kawa", atrapa), null);
});

test("wpis pasujący do dwóch produktów z TEGO SAMEGO działu dostaje ten dział", () => {
  const atrapa = [{ n: "Kawa mielona", dzial: "Spiżarnia" },
                  { n: "Kawa ziarnista", dzial: "Spiżarnia" }];
  rowne(dzialDopisku("kawa", atrapa), "Spiżarnia");
});

test("pusty słownik nie wywala funkcji", () => {
  rowne(dzialDopisku("chleb", []), null);
  rowne(dzialDopisku("chleb"), null);
});

console.log("\n— ilość sztuk przy dopisanej pozycji —");

test("brak ilości daje null, nie jedynkę", () => {
  /* `null`, nie `1`, bo „×1” przy każdej pozycji jest szumem i zabiera uwagę tym,
     które naprawdę mają liczbę. */
  rowne(normalizujIlosc(""), null);
  rowne(normalizujIlosc(null), null);
  rowne(normalizujIlosc(undefined), null);
});

test("liczba przechodzi, tekstem czy liczbą", () => {
  rowne(normalizujIlosc("3"), 3);
  rowne(normalizujIlosc(3), 3);
});

test("ułamek jest ucinany, nie zaokrąglany w górę", () => {
  /* Dwie i siedem dziesiątych pasty do zębów nie istnieje; dwie owszem. */
  rowne(normalizujIlosc("2.7"), 2);
});

test("zero i liczby ujemne odpadają", () => {
  rowne(normalizujIlosc(0), null);
  rowne(normalizujIlosc(-5), null);
});

test("bzdura odpada zamiast dać NaN", () => {
  /* NaN nie jest błędem — jest liczbą, i przeszedłby przez cały ekran (decyzja 70).

     Sprawdzamy go OSOBNO, nie przez `rowne`: ta porównuje przez JSON.stringify,
     a ta zamienia NaN na „null”. Test napisany przez `rowne(…, null)` przechodził
     więc także wtedy, gdy funkcja zwracała NaN — czyli pilnował dokładnie tego
     jednego przypadku, którego miał pilnować, i akurat jego nie widział.
     Wyszło to przy sabotażu 29 sierpnia. */
  for (const bzdura of ["abc", {}, [], "3 sztuki"]) {
    const wynik = normalizujIlosc(bzdura);
    if (typeof wynik === "number" && Number.isNaN(wynik))
      throw new Error(`normalizujIlosc(${JSON.stringify(bzdura)}) zwróciło NaN`);
    rowne(wynik, null, `dla ${JSON.stringify(bzdura)}`);
  }
});

test("liczba absurdalnie duża jest przycinana", () => {
  rowne(normalizujIlosc("10000"), 999);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
