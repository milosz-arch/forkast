/* Kształt wersji restauracyjnej (decyzja 109): każda ilość w krokach spoza
   fundamentu ma pozycję w akcentach, a sumy się zgadzają. Przypadki wzięte
   z drugiego pomiaru 5 września — sól i cytryna — plus pułapki polskiej odmiany. */
import { sprawdzAkcenty, ilosciZKrokow } from "../parser.js";
import { zbudujPromptRestauracyjny, zbudujPoprawkeRestauracyjna } from "../prompt.js";

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

const FUNDAMENT = [
  { produkt: "Tortilla pszenna", gramy: 120 },
  { produkt: "Pierś z kurczaka", gramy: 250 },
  { produkt: "Papryka",          gramy: 150 },
  { produkt: "Cebula",           gramy: 60 },
  { produkt: "Jogurt grecki",    gramy: 80 },
];

const KROKI_OK = [
  "Pokrój 250 g piersi z kurczaka w paski, posyp 2 g soli i 1 g pieprzu czarnego, wlej 10 ml oleju rzepakowego i odstaw na 20 minut.",
  "Masz 20 minut — pokrój 150 g papryki i 60 g cebuli. Cebulę zalej 200 ml zimnej wody na 10 minut, żeby straciła ostrość.",
  "Rozgrzej patelnię na 8/9, wlej 15 ml oleju rzepakowego, smaż kurczaka 6 minut do 74°C w środku.",
  "Zdejmij kurczaka, wlej 30 ml wody i zeskrob fond drewnianą łopatką.",
  "Dodaj paprykę i cebulę, dosól 1 g soli, smaż 4 minuty.",
  "Spróbuj: za płasko → 2 g soku z cytryny; za mało słone → 1 g soli.",
  "Rozgrzej 120 g tortilli pszennej, nałóż nadzienie, polej 80 g jogurtu greckiego i zwiń.",
];
const AKCENTY_OK = [
  { produkt: "Sól",            gramy: 4 },
  { produkt: "Pieprz czarny",  gramy: 1 },
  { produkt: "Olej rzepakowy", gramy: 25 },
  { produkt: "Cytryny",        gramy: 2 },
];

console.log("\n— czytanie ilości z kroków —");

test("łapie „N g/ml + nazwa”, pomija minuty, stopnie i moc palnika", () => {
  const w = ilosciZKrokow(["Smaż 6 minut na 8/9 do 74°C, dodaj 5 g soli i 15 ml oleju."]);
  rowne(w.map(x => [x.ilosc, x.jednostka, x.slowa[0]]), [[5, "g", "soli"], [15, "ml", "oleju"]]);
});

test("przecinek dziesiętny: 1,5 g", () => {
  rowne(ilosciZKrokow(["Dodaj 1,5 g soli."])[0].ilosc, 1.5);
});

test("„g” w środku słowa nie jest jednostką (np. „gotuj”)", () => {
  rowne(ilosciZKrokow(["Odstaw na 20 gotowych minut."]).length, 0);
});

console.log("\n— sprawdzanie w obie strony —");

test("poprawna odpowiedź przechodzi bez uwag", () => {
  rowne(sprawdzAkcenty(KROKI_OK, FUNDAMENT, AKCENTY_OK), []);
});

test("SÓL Z POMIARU: 3 g soli w krokach, brak w akcentach → błąd z nazwą", () => {
  const b = sprawdzAkcenty(KROKI_OK, FUNDAMENT, AKCENTY_OK.filter(a => a.produkt !== "Sól"));
  prawda(b.length >= 1, "oczekiwano błędu");
  prawda(b.some(x => x.includes("soli") && x.includes("akcent")), b.join(" | "));
});

test("CYTRYNA Z POMIARU: 10 g na liście, 2 g w krokach → błąd z obiema liczbami", () => {
  const ak = AKCENTY_OK.map(a => a.produkt === "Cytryny" ? { ...a, gramy: 10 } : a);
  const b = sprawdzAkcenty(KROKI_OK, FUNDAMENT, ak);
  rowne(b.length, 1, "liczba błędów");
  prawda(b[0].includes("Cytryny") && b[0].includes("10") && b[0].includes("2"), b[0]);
});

test("akcent bez żadnego kroku → błąd", () => {
  const b = sprawdzAkcenty(KROKI_OK, FUNDAMENT, [...AKCENTY_OK, { produkt: "Czosnek", gramy: 5 }]);
  rowne(b.length, 1);
  prawda(b[0].includes("Czosnek") && b[0].includes("żadnym kroku"), b[0]);
});

test("ilość rozbita na kilka kroków sumuje się (sól 2+1+1 = 4)", () => {
  const ak = AKCENTY_OK.map(a => a.produkt === "Sól" ? { ...a, gramy: 3 } : a);
  const b = sprawdzAkcenty(KROKI_OK, FUNDAMENT, ak);
  rowne(b.length, 1);
  prawda(b[0].includes("Sól") && b[0].includes("3") && b[0].includes("4"), b[0]);
});

test("woda nie jest produktem — 200 ml i 30 ml wody nie robią błędu", () => {
  rowne(sprawdzAkcenty(["Zalej 200 ml wody. Wlej 30 ml zimnej wody."], FUNDAMENT, []), []);
});

test("gramatury fundamentu nie są sumowane (250 g piersi dwa razy — bez uwag)", () => {
  rowne(sprawdzAkcenty(["Pokrój 250 g piersi z kurczaka.", "Smaż 250 g piersi z kurczaka."], FUNDAMENT, []), []);
});

test("ilość bez nazwy składnika → błąd", () => {
  const b = sprawdzAkcenty(["Dosól 2 g."], FUNDAMENT, []);
  rowne(b.length, 1);
  prawda(b[0].includes("bez nazwy"), b[0]);
});

console.log("\n— polska odmiana i podobne nazwy —");

test("„1 g pieprzu” idzie do Pieprzu, nie do Piersi z kurczaka", () => {
  const b = sprawdzAkcenty(["Posyp 1 g pieprzu czarnego."], FUNDAMENT, [{ produkt: "Pieprz czarny", gramy: 1 }]);
  rowne(b, []);
});

test("„oleju rzepakowego” wybiera Olej rzepakowy, nie Olej sezamowy", () => {
  const ak = [{ produkt: "Olej sezamowy", gramy: 5 }, { produkt: "Olej rzepakowy", gramy: 15 }];
  const b = sprawdzAkcenty(["Wlej 15 ml oleju rzepakowego. Skrop 5 ml oleju sezamowego."], FUNDAMENT, ak);
  rowne(b, []);
});

test("„soku z cytryny” trafia w „Cytryny”", () => {
  rowne(sprawdzAkcenty(["Dodaj 2 g soku z cytryny."], FUNDAMENT, [{ produkt: "Cytryny", gramy: 2 }]), []);
});

test("„1 g pieprzu” BEZ pieprzu w akcentach → błąd, nie ciche przyklejenie do Piersi", () => {
  const b = sprawdzAkcenty(["Posyp 1 g pieprzu."], FUNDAMENT, []);
  rowne(b.length, 1);
  prawda(b[0].includes("pieprzu") && b[0].includes("Dopisz"), b[0]);
});

test("ruchome e w drugą stronę: „jajek”→Jajka, „octu”→Ocet, „marchewek”→Marchewka, „kopru”→Koper", () => {
  rowne(sprawdzAkcenty(["Wbij 100 g jajek, wlej 5 ml octu, dodaj 50 g marchewek i 3 g kopru."], FUNDAMENT,
    [{ produkt: "Jajka", gramy: 100 }, { produkt: "Ocet", gramy: 5 }, { produkt: "Marchewka", gramy: 50 }, { produkt: "Koper", gramy: 3 }]), []);
});

test("„czosnku” trafia w „Czosnek”, „cukru” w „Cukier” (ruchome e)", () => {
  rowne(sprawdzAkcenty(["Dodaj 5 g czosnku i 3 g cukru."], FUNDAMENT,
    [{ produkt: "Czosnek", gramy: 5 }, { produkt: "Cukier", gramy: 3 }]), []);
});

test("składnik nieznany nigdzie → błąd, który każe dopisać do akcentów", () => {
  const b = sprawdzAkcenty(["Dodaj 5 g kminu rzymskiego."], FUNDAMENT, AKCENTY_OK.slice(0, 1));
  prawda(b.some(x => x.includes("kminu") && x.includes("Dopisz")), b.join(" | "));
});

console.log("\n— prompt i pushback (108, 109) —");

const DANIE = { nazwa: "Tortilla z kurczakiem", porcje: 2, skladniki: FUNDAMENT, kroki: ["Pokrój kurczaka.", "Smaż."] };
const SLOWNIK = [{ n: "Cytryny", dzial: "Warzywa i owoce" }, { n: "Olej rzepakowy", dzial: "Szafka" }];

test("prompt niesie danie, gramatury fundamentu i regułę sum z 109", () => {
  const p = zbudujPromptRestauracyjny(DANIE, SLOWNIK);
  prawda(p.includes("Tortilla z kurczakiem") && p.includes("Pierś z kurczaka 250 g"), "brak dania albo gramatur");
  prawda(p.includes("1. Pokrój kurczaka."), "brak kroków wersji podstawowej");
  prawda(/MUSI być równa/.test(p) && /Woda nie jest produktem/.test(p), "brak reguły sum z decyzji 109");
  prawda(p.includes("Sól i pieprz też są akcentami"), "sól nie jest nazwana jako akcent — a właśnie ją model pominął w pomiarze");
  prawda(p.includes("Olej rzepakowy") && p.includes("Cytryny"), "brak listy produktów");
});

test("cztery zasady head chefa (108) są w prompcie", () => {
  const p = zbudujPromptRestauracyjny(DANIE, SLOWNIK);
  for (const z of ["rozgrzana patelnia → tłuszcz → produkt", "co najmniej dwóch momentach", "deglasuj", "każ spróbować"]) {
    prawda(p.includes(z), `brak zasady: ${z}`);
  }
});

test("pushback niesie poprzednią odpowiedź i każdy rozjazd", () => {
  const p = zbudujPoprawkeRestauracyjna("PROMPT", "{\"kroki\":[]}", ["Sól: brak", "Cytryny: 10 vs 2"]);
  prawda(p.startsWith("PROMPT"), "pushback nie zaczyna się od oryginalnego promptu");
  prawda(p.includes("{\"kroki\":[]}") && p.includes("- Sól: brak") && p.includes("- Cytryny: 10 vs 2"), p);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}`);
process.exit(oblane ? 1 : 0);
