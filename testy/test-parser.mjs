// Testy parsera na odpowiedziach takich, jakie modele naprawdę zwracają.
import { parsujOdpowiedz, wyciagnijJSON, normalizuj } from "../parser.js";

const SLOWNIK = [
  { n: "Łosoś wędzony na zimno", dzial: "Mięso i ryby" },
  { n: "Ryż basmati",            dzial: "Produkty suche" },
  { n: "Jogurt grecki",          dzial: "Nabiał" },
  { n: "Pomarańcza",             dzial: "Owoce" },
  { n: "Oliwa z oliwek",         dzial: "Tłuszcze" },
];

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

const POPRAWNE = {
  dania: [{
    nazwa: "Łosoś z ryżem",
    typy: ["lunch"],
    porcje: 2,
    skladniki: [
      { produkt: "Łosoś wędzony na zimno", gramy: 140 },
      { produkt: "Ryż basmati", gramy: 100 },
    ],
    kroki: ["Ugotuj ryż basmati przez 12 minut.", "Dodaj łososia wędzonego."],
  }],
};

console.log("\n— wyciąganie JSON-a z bałaganu —");

test("czysty JSON", () => {
  const o = wyciagnijJSON(JSON.stringify(POPRAWNE));
  rowne(o.dania.length, 1);
});

test("w bloku ```json z gadaniem przed i po", () => {
  const t = `Jasne! Oto przepisy, o które prosiłeś:\n\n\`\`\`json\n${JSON.stringify(POPRAWNE)}\n\`\`\`\n\nDaj znać, jeśli mam coś zmienić!`;
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("blok bez znacznika języka", () => {
  const t = "Proszę:\n```\n" + JSON.stringify(POPRAWNE) + "\n```";
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("bez bloku, samo gadanie dookoła", () => {
  const t = `Oto JSON: ${JSON.stringify(POPRAWNE)} Smacznego!`;
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("przecinek na końcu tablicy", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[{"produkt":"Ryż basmati","gramy":100},],"kroki":[],},]}`;
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("klucze bez cudzysłowów", () => {
  const t = `{dania:[{nazwa:"X",typy:["lunch"],porcje:2,skladniki:[{produkt:"Ryż basmati",gramy:100}]}]}`;
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("polskie cudzysłowy jako ograniczniki", () => {
  const t = `{„dania": [{„nazwa": „Ryż", „typy": [„lunch"], „porcje": 2, „skladniki": [{„produkt": „Ryż basmati", „gramy": 100}]}]}`;
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("komentarz w środku", () => {
  const t = `{\n  // dania uzytkownika\n  "dania": [{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[{"produkt":"Ryż basmati","gramy":100}]}]\n}`;
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("twarda spacja zamiast zwykłej", () => {
  const t = `{"dania": [{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[{"produkt":"Ryż basmati","gramy":100}]}]}`;
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("nawias klamrowy w tekście przed JSON-em nie myli", () => {
  const t = `Format {nazwa, porcje} jest jasny. Oto wynik:\n${JSON.stringify(POPRAWNE)}`;
  rowne(wyciagnijJSON(t).dania.length, 1);
});

test("pusta odpowiedź rzuca wyjątkiem", () => {
  try { wyciagnijJSON("   "); throw new Error("nie rzucił"); }
  catch (e) { prawda(/Pusta/.test(e.message), "zły komunikat: " + e.message); }
});

test("czysty tekst bez JSON-a rzuca wyjątkiem", () => {
  try { wyciagnijJSON("Przepraszam, nie mogę pomóc."); throw new Error("nie rzucił"); }
  catch (e) { prawda(/Nie znalazłem/.test(e.message), "zły komunikat: " + e.message); }
});

console.log("\n— kształty, które model lubi zmieniać —");

test("tablica na wierzchu zamiast {dania:[]}", () => {
  const r = parsujOdpowiedz(JSON.stringify(POPRAWNE.dania), SLOWNIK);
  rowne(r.dania.length, 1);
});

test("pojedyncze danie bez opakowania", () => {
  const r = parsujOdpowiedz(JSON.stringify(POPRAWNE.dania[0]), SLOWNIK);
  rowne(r.dania.length, 1);
});

test("składniki jako pary [nazwa, gramy]", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[["Ryż basmati",100]],"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.bledy, []);
  rowne(r.dania[0].skladniki[0].gramy, 100);
});

test("składniki jako obiekt {nazwa: gramy}", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":{"Ryż basmati":100},"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.bledy, []);
  rowne(r.dania[0].skladniki.length, 1);
});

test("gramatura jako tekst z jednostką", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":"2","skladniki":[{"produkt":"Ryż basmati","gramy":"100 g"}],"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.bledy, []);
  rowne(r.dania[0].skladniki[0].gramy, 100);
  rowne(r.dania[0].porcje, 2);
});

test("typ jako pojedynczy napis, nie tablica", () => {
  const t = `{"dania":[{"nazwa":"X","typ":"Lunch","porcje":2,"skladniki":[["Ryż basmati",100]],"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania[0].typy, ["lunch"]);
});

test("nazwa produktu bez polskich znaków i innej wielkości liter", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[["losos wedzony na zimno",140]],"kroki":["Pokrój łososia."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.bledy, []);
  rowne(r.dania[0].skladniki[0].produkt, "Łosoś wędzony na zimno");
});

console.log("\n— czego nie wolno przepuścić —");

test("brak porcji to błąd blokujący", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"skladniki":[["Ryż basmati",100]],"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 0);
  prawda(r.bledy.some(b => /porcji/.test(b)), "brak komunikatu o porcjach");
});

test("brak typu posiłku to błąd blokujący", () => {
  const t = `{"dania":[{"nazwa":"X","porcje":2,"skladniki":[["Ryż basmati",100]],"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 0);
  prawda(r.bledy.some(b => /typu posiłku/.test(b)), "brak komunikatu o typie");
});

test("wymyślony typ posiłku nie przechodzi", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["brunch"],"porcje":2,"skladniki":[["Ryż basmati",100]],"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 0);
});

test("produkt spoza słownika bez dopisania to błąd", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[["Tofu wędzone",100]],"kroki":["Podsmaż tofu."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 0);
  prawda(r.bledy.some(b => /nie jest w słowniku/.test(b)));
});

test("produkt spoza słownika z poprawnym makro przechodzi", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[["Tofu wędzone",100]],"kroki":["Podsmaż tofu."]}],
    "noweProdukty":[{"nazwa":"Tofu wędzone","kcal":145,"bialko":15,"wegle":2,"tluszcz":8.5}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.bledy, []);
  rowne(r.dania.length, 1);
  rowne(r.noweProdukty.length, 1);
  rowne(r.noweProdukty[0].dzial, "Inne");
});

test("nowy produkt bez wartości odżywczych nie wchodzi", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[["Tofu",100]],"kroki":["Podsmaż tofu."]}],
    "noweProdukty":[{"nazwa":"Tofu","kcal":145}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.noweProdukty.length, 0);
  prawda(r.bledy.some(b => /nie ma wartości/.test(b)));
});

test("makro sprzeczne z kaloriami to ostrzeżenie, nie odrzucenie", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[["Tofu",100]],"kroki":["Podsmaż tofu."]}],
    "noweProdukty":[{"nazwa":"Tofu","kcal":500,"bialko":15,"wegle":2,"tluszcz":8.5}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 1, "danie ma przejść");
  prawda(r.ostrzezenia.some(o => /makro nie zgadza/.test(o)));
});

test("brak gramatury przy składniku to błąd", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[{"produkt":"Ryż basmati"}],"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 0);
  prawda(r.bledy.some(b => /brak gramatury/i.test(b)));
});

test("absurdalna gramatura przechodzi, ale z ostrzeżeniem", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[["Ryż basmati",5000]],"kroki":["Ugotuj ryż."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 1);
  prawda(r.ostrzezenia.some(o => /pomyłkę/.test(o)));
});

console.log("\n— lekcja z Dietki: znikający łosoś —");

test("składnik nieużyty w żadnym kroku daje ostrzeżenie", () => {
  const t = `{"dania":[{"nazwa":"Sałatka","typy":["lunch"],"porcje":2,
    "skladniki":[["Ryż basmati",100],["Łosoś wędzony na zimno",140]],
    "kroki":["Ugotuj ryż basmati przez 12 minut.","Wymieszaj i dopraw."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 1);
  prawda(r.ostrzezenia.some(o => /Łosoś/.test(o)), "łosoś miał zostać zgłoszony");
});

test("składnik użyty tylko w kroku Zapakuj nadal jest zgłaszany", () => {
  const t = `{"dania":[{"nazwa":"Sałatka","typy":["lunch"],"porcje":2,
    "skladniki":[["Ryż basmati",100],["Łosoś wędzony na zimno",140]],
    "kroki":["Ugotuj ryż basmati.","Zapakuj łososia do pojemnika."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  prawda(r.ostrzezenia.some(o => /Łosoś/.test(o)), "pakowanie nie liczy się jako użycie");
});

test("składnik odmieniony w kroku jest rozpoznany", () => {
  const t = `{"dania":[{"nazwa":"Sałatka","typy":["lunch"],"porcje":2,
    "skladniki":[["Pomarańcza",80]],
    "kroki":["Obierz pomarańczę i pokrój w cząstki."]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.ostrzezenia, []);
});

test("brak kroków nie generuje fałszywych ostrzeżeń", () => {
  const t = `{"dania":[{"nazwa":"X","typy":["lunch"],"porcje":2,"skladniki":[["Ryż basmati",100]]}]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 1);
  rowne(r.ostrzezenia, []);
});

console.log("\n— jedno złe danie nie psuje pozostałych —");

test("dobre dania przechodzą, złe trafiają do błędów", () => {
  const t = `{"dania":[
    {"nazwa":"Dobre","typy":["lunch"],"porcje":2,"skladniki":[["Ryż basmati",100]],"kroki":["Ugotuj ryż."]},
    {"nazwa":"Złe","typy":["lunch"],"skladniki":[["Ryż basmati",100]],"kroki":["Ugotuj ryż."]}
  ]}`;
  const r = parsujOdpowiedz(t, SLOWNIK);
  rowne(r.dania.length, 1);
  rowne(r.dania[0].nazwa, "Dobre");
  prawda(r.bledy.some(b => /Złe/.test(b)));
});

console.log("\n— normalizacja nazw —");

test("polskie znaki, wielkość liter i odstępy nie mają znaczenia", () => {
  rowne(normalizuj("Łosoś  WĘDZONY na zimno"), normalizuj("losos wedzony na zimno"));
  rowne(normalizuj("Ryż-basmati"), normalizuj("ryz basmati"));
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
