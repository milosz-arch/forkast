/* Testy twardych limitów (VAL-1). Wszystkie na ZŁYCH danych — to jest kategoria,
   której parser.js dotąd prawie nie miał: sprawdzał, czy dobre dane przechodzą,
   nie czy złe są zatrzymywane. Treść przychodzi tu z modelu, a w trybie "link"
   pośrednio z obcej strony, więc rozmiar i znaki mają znaczenie. */

import { parsujOdpowiedz } from "../parser.js";

let zdane = 0, oblane = 0;
function test(nazwa, fn) {
  try { fn(); zdane++; console.log(`  ok   ${nazwa}`); }
  catch (e) { oblane++; console.log(`  BLAD ${nazwa}\n       ${e.message}`); }
}
function prawda(w, co) { if (!w) throw new Error(co || "oczekiwano prawdy"); }
function rowne(a, b, co = "") {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x !== y) throw new Error(`${co} oczekiwano ${y}, jest ${x}`);
}

const SLOWNIK = [{ n: "Ryż basmati", dzial: "Spiżarnia" }, { n: "Jajka", dzial: "Nabiał" }];

const danie = (nadpisania = {}) => JSON.stringify({
  dania: [{
    nazwa: "Zwykłe danie", typy: ["obiad"], porcje: 2,
    skladniki: [{ produkt: "Ryż basmati", gramy: 100 }],
    kroki: ["Ugotuj ryż basmati."],
    ...nadpisania
  }]
});

console.log("\n— nazwa dania —");

test("nazwa dłuższa niż 120 znaków jest odrzucana", () => {
  const r = parsujOdpowiedz(danie({ nazwa: "a".repeat(121) }), SLOWNIK);
  rowne(r.dania.length, 0, "danie nie może przejść");
  prawda(r.bledy.some(b => /znaków/.test(b)), "komunikat mówi o długości");
});

test("nazwa dokładnie 120 znaków przechodzi (granica włącznie)", () => {
  const r = parsujOdpowiedz(danie({ nazwa: "a".repeat(120) }), SLOWNIK);
  rowne(r.dania.length, 1);
});

test("znaki nowej linii w nazwie są usuwane, nie przepuszczane", () => {
  const r = parsujOdpowiedz(danie({ nazwa: "Zupa\n\nfałszywa" }), SLOWNIK);
  rowne(r.dania.length, 1);
  prawda(!/\n/.test(r.dania[0].nazwa), "brak znaków nowej linii");
  rowne(r.dania[0].nazwa, "Zupa fałszywa");
});

test("znaki sterujące w nazwie są usuwane", () => {
  const r = parsujOdpowiedz(danie({ nazwa: "Zupa\u0000\u0007 dziwna" }), SLOWNIK);
  rowne(r.dania.length, 1);
  prawda(!/[\u0000-\u001F]/.test(r.dania[0].nazwa));
});

test("nawiasy kątowe są usuwane z nazwy — treść trafia potem na ekran", () => {
  const r = parsujOdpowiedz(danie({ nazwa: "Zupa <script>alert(1)</script>" }), SLOWNIK);
  rowne(r.dania.length, 1);
  prawda(!/[<>]/.test(r.dania[0].nazwa), `zostało: ${r.dania[0].nazwa}`);
});

test("realna nazwa przepisu ze zdjęcia przechodzi (regresja z 3 sierpnia)", () => {
  const prawdziwa = "Pierogi ruskie z palonym masłem i podsmażaną cebulką na ostro";
  const r = parsujOdpowiedz(danie({ nazwa: prawdziwa }), SLOWNIK);
  rowne(r.dania.length, 1, "opisowy tytuł to nie patologia");
  rowne(r.dania[0].nazwa, prawdziwa);
});

console.log("\n— składniki —");

test("nazwa składnika dłuższa niż 40 znaków jest odrzucana", () => {
  const r = parsujOdpowiedz(danie({
    skladniki: [{ produkt: "x".repeat(41), gramy: 100 }]
  }), SLOWNIK);
  rowne(r.dania.length, 0);
  prawda(r.bledy.some(b => /znaków/.test(b)));
});

test("więcej niż 30 składników jest odrzucane", () => {
  const duzo = Array.from({ length: 31 }, () => ({ produkt: "Ryż basmati", gramy: 10 }));
  const r = parsujOdpowiedz(danie({ skladniki: duzo }), SLOWNIK);
  rowne(r.dania.length, 0);
  prawda(r.bledy.some(b => /za dużo/.test(b)));
});

test("dokładnie 30 składników przechodzi (granica włącznie)", () => {
  const rowno = Array.from({ length: 30 }, () => ({ produkt: "Ryż basmati", gramy: 10 }));
  const r = parsujOdpowiedz(danie({ skladniki: rowno, kroki: [] }), SLOWNIK);
  rowne(r.dania.length, 1);
});

console.log("\n— nowe produkty —");

test("nowy produkt z absurdalnie długą nazwą nie wchodzi do słownika", () => {
  const t = JSON.stringify({
    dania: [{ nazwa: "X", typy: ["obiad"], porcje: 2,
      skladniki: [{ produkt: "Ryż basmati", gramy: 100 }], kroki: ["Ugotuj ryż."] }],
    noweProdukty: [{ nazwa: "y".repeat(50), kcal: 100, bialko: 5, wegle: 10, tluszcz: 2 }]
  });
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.noweProdukty.length, 0, "produkt odrzucony");
  prawda(r.bledy.some(b => /znaków/.test(b)));
});

console.log("\n— cały ładunek —");

test("absurdalnie długa odpowiedź jest odrzucana bez parsowania", () => {
  const olbrzym = "x".repeat(40000);
  try {
    parsujOdpowiedz(olbrzym, SLOWNIK);
    throw new Error("nie rzucił wyjątku");
  } catch (e) {
    prawda(/podejrzanie długa/.test(e.message), "zły komunikat: " + e.message);
  }
});

console.log("\n— jedno złe danie nie psuje dobrego —");

test("danie ze złą nazwą odpada, poprawne obok przechodzi", () => {
  const t = JSON.stringify({ dania: [
    { nazwa: "b".repeat(121), typy: ["obiad"], porcje: 2,
      skladniki: [{ produkt: "Jajka", gramy: 100 }], kroki: ["Ugotuj jajka."] },
    { nazwa: "Dobre danie", typy: ["obiad"], porcje: 2,
      skladniki: [{ produkt: "Jajka", gramy: 100 }], kroki: ["Ugotuj jajka."] },
  ]});
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 1);
  rowne(r.dania[0].nazwa, "Dobre danie");
  prawda(r.bledy.length > 0);
});

console.log("\n— polska odmiana w krokach (regresja z 3 sierpnia) —");

/* Ta klasa błędu wystąpiła dwa razy: raz przy sprawdzaniu "czy składnik jest użyty
   w krokach", raz przy odwrotnym "czy krok używa czegoś spoza listy". Za każdym razem
   powodem było porównywanie za długiego rdzenia — polska odmiana zmienia końcówkę
   już przy czwartej literze. Test pilnuje obu kierunków naraz. */

test("składnik odmieniony w krokach nie jest brany za nieznany", () => {
  const slownik = [{ n: "Mąka pszenna", dzial: "Spiżarnia" }];
  const t = JSON.stringify({ dania: [{
    nazwa: "Pierogi", typy: ["obiad"], porcje: 4,
    skladniki: [{ produkt: "Mąka pszenna", gramy: 500 }],
    kroki: ["Wsyp Mąkę pszenną do miski.", "Zagnieć ciasto z Mąki pszennej."]
  }]});
  const r = parsujOdpowiedz(t, slownik);
  rowne(r.bledy, [], "żaden błąd — to ten sam składnik, tylko odmieniony");
  rowne(r.dania.length, 1);
});

test("krótkie nazwy też przechodzą przez odmianę", () => {
  const slownik = [{ n: "Sól", dzial: "Szafka" }, { n: "Ryż basmati", dzial: "Spiżarnia" }];
  const t = JSON.stringify({ dania: [{
    nazwa: "Ryż", typy: ["obiad"], porcje: 2,
    skladniki: [{ produkt: "Ryż basmati", gramy: 200 }, { produkt: "Sól", gramy: 5 }],
    kroki: ["Ugotuj Ryż basmati w wodzie z Solą."]
  }]});
  const r = parsujOdpowiedz(t, slownik);
  rowne(r.bledy, []);
});

console.log("\n— krok wspomina coś spoza listy składników (zmiana z 3 sierpnia) —");

test("danie przechodzi mimo wzmianki o produkcie spoza listy", () => {
  const slownik = [{ n: "Ziemniaki", dzial: "Warzywa i owoce" }];
  const t = JSON.stringify({ dania: [{
    nazwa: "Placki", typy: ["obiad"], porcje: 2,
    skladniki: [{ produkt: "Ziemniaki", gramy: 500 }],
    kroki: ["Zetrzyj Ziemniaki na tarce.", "Smaż placki na Oleju rzepakowym."]
  }]});
  const r = parsujOdpowiedz(t, slownik);
  rowne(r.dania.length, 1, "danie nie może być odrzucone przez wzmiankę o oleju");
  rowne(r.bledy, [], "to nie jest błąd");
  prawda(r.ostrzezenia.some(o => /Olej/i.test(o)), "ale użytkownik ma o tym wiedzieć");
});

test("drugi człon nazwy pisany wielką literą nie jest brany za obcy produkt", () => {
  /* Regresja z 3 sierpnia: „musztarda Dijon" jest na liście składników, ale krok
     pisze „musztardą Dijon" — wykrywacz widział „Dijon", a rdzeń brany był tylko
     z pierwszego słowa („mus"), więc poprawny składnik wyglądał na nieznany. */
  const slownik = [{ n: "Musztarda Dijon", dzial: "Szafka" }, { n: "Jajka", dzial: "Nabiał" }];
  const t = JSON.stringify({ dania: [{
    nazwa: "Sałatka", typy: ["przekąska"], porcje: 4,
    skladniki: [{ produkt: "Musztarda Dijon", gramy: 20 }, { produkt: "Jajka", gramy: 110 }],
    kroki: ["Ugotuj Jajka na twardo.", "Wymieszaj z musztardą Dijon."]
  }]});
  const r = parsujOdpowiedz(t, slownik);
  rowne(r.ostrzezenia, [], "to ten sam składnik, tylko odmieniony");
  rowne(r.dania.length, 1);
});

test("ostrzeżenie mówi, co z tym zrobić", () => {
  const slownik = [{ n: "Ziemniaki", dzial: "Warzywa i owoce" }];
  const t = JSON.stringify({ dania: [{
    nazwa: "Placki", typy: ["obiad"], porcje: 2,
    skladniki: [{ produkt: "Ziemniaki", gramy: 500 }],
    kroki: ["Zetrzyj Ziemniaki.", "Polej Śmietaną."]
  }]});
  const r = parsujOdpowiedz(t, slownik);
  prawda(r.ostrzezenia.some(o => /dokup osobno|dopisz/.test(o)), "podpowiada wyjście");
});

console.log("\n— makro: tolerancja asymetryczna (zmiana z 3 sierpnia) —");

/* Wzór 4-4-9 przeszacowuje produkty bogate w błonnik, bo liczy go po 4 kcal/g
   zamiast ~2. Suszone przyprawy zawsze wychodzą "za wysoko" i przy każdym daniu
   z papryką czy tymiankiem wyskakiwał ten sam fałszywy alarm. */

const zNowymProduktem = (p) => JSON.stringify({
  dania: [{ nazwa: "Danie", typy: ["obiad"], porcje: 2,
    skladniki: [{ produkt: "Ryż basmati", gramy: 100 }], kroki: ["Ugotuj Ryż basmati."] }],
  noweProdukty: [p]
});

test("suszona przyprawa nie wywołuje ostrzeżenia (nadwyżka to podpis błonnika)", () => {
  const r = parsujOdpowiedz(zNowymProduktem(
    { nazwa: "Papryka słodka mielona", kcal: 282, bialko: 14, wegle: 54, tluszcz: 13 }), SLOWNIK);
  rowne(r.ostrzezenia, [], "38% nadwyżki ma naturalne wytłumaczenie");
  rowne(r.noweProdukty.length, 1);
});

test("deklarowane kalorie wyższe niż ze składników nadal ostrzegają", () => {
  const r = parsujOdpowiedz(zNowymProduktem(
    { nazwa: "Wymysł", kcal: 500, bialko: 5, wegle: 10, tluszcz: 2 }), SLOWNIK);
  prawda(r.ostrzezenia.some(o => /makro/.test(o)), "niedoboru nie da się wytłumaczyć błonnikiem");
});

test("absurdalna nadwyżka powyżej 60% nadal ostrzega", () => {
  const r = parsujOdpowiedz(zNowymProduktem(
    { nazwa: "Dziwo", kcal: 100, bialko: 30, wegle: 30, tluszcz: 10 }), SLOWNIK);
  prawda(r.ostrzezenia.some(o => /makro/.test(o)), "trzykrotność to już nie błonnik");
});

test("zgodny produkt nie wywołuje niczego", () => {
  const r = parsujOdpowiedz(zNowymProduktem(
    { nazwa: "Pierś z indyka", kcal: 104, bialko: 24, wegle: 0, tluszcz: 1 }), SLOWNIK);
  rowne(r.ostrzezenia, []);
});

test("sól i woda: zero kalorii i zero makro to spójny produkt, nie błąd", () => {
  for (const nazwa of ["Sól", "Woda", "Ocet jabłkowy"]) {
    const r = parsujOdpowiedz(zNowymProduktem(
      { nazwa, kcal: 0, bialko: 0, wegle: 0, tluszcz: 0 }), SLOWNIK);
    rowne(r.ostrzezenia, [], `${nazwa}: 0 = 0, nie ma o czym ostrzegać`);
    rowne(r.noweProdukty.length, 1, `${nazwa} wchodzi do słownika`);
  }
});

test("zero kalorii przy niezerowym makro nadal jest podejrzane", () => {
  const r = parsujOdpowiedz(zNowymProduktem(
    { nazwa: "Dziwo", kcal: 0, bialko: 10, wegle: 20, tluszcz: 5 }), SLOWNIK);
  prawda(r.ostrzezenia.some(o => /makro/.test(o)), "makro bez kalorii nie ma sensu");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
