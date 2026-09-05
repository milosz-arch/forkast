/* Kształt wersji restauracyjnej (decyzja 109): każda ilość w krokach spoza
   fundamentu ma pozycję w akcentach, a sumy się zgadzają. Przypadki wzięte
   z drugiego pomiaru 5 września — sól i cytryna — plus pułapki polskiej odmiany. */
import { sprawdzAkcenty, ilosciZKrokow, parsujWersjeRestauracyjna } from "../parser.js";
import { zbudujPromptRestauracyjny, zbudujPoprawkeRestauracyjna } from "../prompt.js";
import { readFileSync } from "fs";
const czytaj = (f) => readFileSync(new URL(f, import.meta.url), "utf8");

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

test("ilość rozbita na kilka kroków sumuje się (sól 2+1+1 = 4); lista 3 też przechodzi — to ZNANY KOSZT reguły z curry", () => {
  const przy = (g) => sprawdzAkcenty(KROKI_OK, FUNDAMENT, AKCENTY_OK.map(a => a.produkt === "Sól" ? { ...a, gramy: g } : a));
  rowne(przy(4), [], "suma wszystkich");
  rowne(przy(3), [], "suma różnych (2+1) — przepuszczamy, żeby nie odrzucać poprawnych przepisów");
  const b = przy(5);
  rowne(b.length, 1, "5 nie jest żadną z sum");
  prawda(b[0].includes("Sól") && b[0].includes("5") && b[0].includes("4"), b[0]);
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

test("NATKA Z POMIARU 3: „posiekaj 5 g” + „posyp 5 g” = jedna porcja 5 g, nie 10", () => {
  rowne(sprawdzAkcenty(["Posiekaj 5 g natki pietruszki.", "Posyp 5 g natki pietruszki."], FUNDAMENT,
    [{ produkt: "Natka pietruszki", gramy: 5 }]), []);
});

test("ale ta sama liczba dwa razy przy liście 10 też przechodzi (dwa dodania po 5)", () => {
  rowne(sprawdzAkcenty(["Dodaj 5 g cukru.", "Dodaj 5 g cukru."], FUNDAMENT, [{ produkt: "Cukier", gramy: 10 }]), []);
});

test("ta sama liczba dwa razy przy liście 7 → błąd z rozbiciem (5 + 5)", () => {
  const b = sprawdzAkcenty(["Dodaj 5 g cukru.", "Dodaj 5 g cukru."], FUNDAMENT, [{ produkt: "Cukier", gramy: 7 }]);
  rowne(b.length, 1);
  prawda(b[0].includes("5 + 5"), b[0]);
});

test("SÓL Z CURRY: 4 + 4 + 1 przy liście 5 przechodzi (4 to jedna porcja, 1 korekta)", () => {
  const kroki = ["Posól 4 g soli bakłażana.", "Wrzuć bakłażana z 4 g soli.", "Za mało słone → 1 g soli."];
  rowne(sprawdzAkcenty(kroki, FUNDAMENT, [{ produkt: "Sól", gramy: 5 }]), []);
  rowne(sprawdzAkcenty(kroki, FUNDAMENT, [{ produkt: "Sól", gramy: 9 }]), [], "suma wszystkich też przechodzi");
  rowne(sprawdzAkcenty(kroki, FUNDAMENT, [{ produkt: "Sól", gramy: 7 }]).length, 1, "7 nie jest ani sumą, ani sumą różnych");
});

test("„150 g Papryka pokrojona” idzie do fundamentu „Papryka”, nie do akcentu „Papryka wędzona” — niezależnie od kolejności", () => {
  const kroki = ["Wrzuć 150 g Papryka pokrojona w paski.", "Dodaj 5 g Papryka wędzona."];
  rowne(sprawdzAkcenty(kroki, FUNDAMENT, [{ produkt: "Papryka wędzona", gramy: 5 }]), []);
  const fundamentPoAkcencie = [{ produkt: "Papryka wędzona", gramy: 5 }];
  const b = sprawdzAkcenty(kroki, [], [...fundamentPoAkcencie, { produkt: "Papryka", gramy: 150 }]);
  rowne(b, [], "przy odwróconej kolejności");
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

console.log("\n— parsowanie całej odpowiedzi (prawdziwa odpowiedź Gemini, pomiar 3 z v75) —");

/* Skrócona do tego, co sprawdzanie czyta; liczby i nazwy dosłownie z odpowiedzi. */
const ODPOWIEDZ_V75 = {
  kroki: [
    "Pokrój 250 g piersi z kurczaka w równe paski, a 150 g papryki i 60 g cebuli w plastry o grubości 5 mm.",
    "Wymieszaj w misce 250 g piersi z kurczaka z 10 g oliwy extra virgin, 2 g kminu rzymskiego, 2 g papryki wędzonej, 2 g soli oraz 1 g pieprzu czarnego, po czym odstaw na 20 minut; w tym czasie pokrój 10 g natki pietruszki.",
    "Przygotuj dip, mieszając 80 g jogurtu greckiego z 5 g soku z cytryny i 1 g soli.",
    "Rozgrzej 15 g oleju rzepakowego na patelni na mocy 8/9, po czym ułóż 250 g piersi z kurczaka; smaż 4 minuty do 74°C wewnątrz.",
    "Zdejmij 250 g piersi z kurczaka na talerz, wrzuć 150 g papryki i 60 g cebuli, smaż 4 minuty na mocy 7/9.",
    "Deglasuj patelnię, dodając 10 g soku z cytryny, mieszając z warzywami przez 30 sekund.",
    "Spróbuj mieszanki: jeśli smak jest zbyt płaski, dodaj 1 g soli; jeśli brakuje głębi, dodaj 1 g soku z cytryny.",
    "Rozgrzej 120 g tortilli pszennej na suchej patelni na mocy 6/9 przez 20 sekund z każdej strony.",
    "Nałóż nadzienie na ciepłą tortillę, polej 86 g dipu jogurtowego, posyp 10 g natki pietruszki i zwiń, podając w temperaturze około 60°C.",
  ],
  akcenty: [
    { produkt: "Oliwa extra virgin", gramy: 10 }, { produkt: "Kmin rzymski", gramy: 2 },
    { produkt: "Papryka wędzona", gramy: 2 },    { produkt: "Sól", gramy: 4 },
    { produkt: "Pieprz czarny", gramy: 1 },      { produkt: "Cytryny", gramy: 16 },
    { produkt: "Olej rzepakowy", gramy: 15 },    { produkt: "Natka pietruszki", gramy: 10 },
  ],
  noweProdukty: [
    { nazwa: "Pieprz czarny", kcal: 251, bialko: 10, wegle: 64, tluszcz: 3, dzial: "Szafka" },
    { nazwa: "Sól", kcal: 0, bialko: 0, wegle: 0, tluszcz: 0, dzial: "Szafka" },
  ],
  uwaga: "Smażenie kurczaka razem z zimnymi warzywami powoduje gotowanie mięsa zamiast karmelizacji.",
};
const SLOWNIK_V75 = ["Tortilla pszenna","Pierś z kurczaka","Papryka","Cebula","Jogurt grecki",
  "Oliwa extra virgin","Kmin rzymski","Papryka wędzona","Cytryny","Olej rzepakowy","Natka pietruszki"]
  .map(n => ({ n, dzial: "x" }));
const TORTILLA = { nazwa: "Tortilla", porcje: 2, skladniki: FUNDAMENT, kroki: ["1","2","3","4","5"] };
const zTekstem = (o) => "```json\n" + JSON.stringify(o) + "\n```";

test("prawdziwa odpowiedź v75 przechodzi: 9 kroków, 8 akcentów, sól i pieprz jako nowe produkty", () => {
  const w = parsujWersjeRestauracyjna(zTekstem(ODPOWIEDZ_V75), TORTILLA, SLOWNIK_V75);
  rowne(w.bledy, [], "błędy");
  prawda(w.ok, "ok");
  rowne(w.kroki.length, 9); rowne(w.akcenty.length, 8);
  rowne(w.noweProdukty.map(p => p.n), ["Pieprz czarny", "Sól"]);
  prawda(w.uwaga.startsWith("Smażenie"), "uwaga");
});

test("akcent spoza słownika i bez wpisu w noweProdukty → nie ok", () => {
  const o = { ...ODPOWIEDZ_V75, noweProdukty: [ODPOWIEDZ_V75.noweProdukty[1]] };   // bez pieprzu
  const w = parsujWersjeRestauracyjna(zTekstem(o), TORTILLA, SLOWNIK_V75);
  prawda(!w.ok && w.bledy.some(b => b.includes("Pieprz czarny") && b.includes("noweProdukty")), w.bledy.join(" | "));
});

test("składnik fundamentu wpisany do akcentów → nie ok", () => {
  const o = { ...ODPOWIEDZ_V75, akcenty: [...ODPOWIEDZ_V75.akcenty, { produkt: "Cebula", gramy: 20 }] };
  const w = parsujWersjeRestauracyjna(zTekstem(o), TORTILLA, SLOWNIK_V75);
  prawda(!w.ok && w.bledy.some(b => b.includes("Cebula") && b.includes("podstawowym")), w.bledy.join(" | "));
});

test("mniej kroków niż wersja podstawowa → nie ok", () => {
  const o = { ...ODPOWIEDZ_V75, kroki: ODPOWIEDZ_V75.kroki.slice(0, 3) };
  const w = parsujWersjeRestauracyjna(zTekstem(o), TORTILLA, SLOWNIK_V75);
  prawda(!w.ok && w.bledy.some(b => b.includes("3 kroków")), w.bledy.join(" | "));
});

test("rozjazd sum z 109 przechodzi przez parser jako błąd, nie ostrzeżenie", () => {
  const o = { ...ODPOWIEDZ_V75, akcenty: ODPOWIEDZ_V75.akcenty.map(a => a.produkt === "Sól" ? { ...a, gramy: 9 } : a) };
  const w = parsujWersjeRestauracyjna(zTekstem(o), TORTILLA, SLOWNIK_V75);
  prawda(!w.ok && w.bledy.some(b => b.includes("Sól") && b.includes("9")), w.bledy.join(" | "));
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
  prawda(p.includes("liczy się raz") && p.includes("ODMIENIAJ"), "brak reguły „ta sama liczba raz” albo odmiany w krokach (pomiar 3)");
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

console.log("\n— moduł restauracyjna.js i drzwi na obu ekranach (pułapka 22, decyzja 111) —");

const modul = czytaj("../restauracyjna.js");
const ekrany = { przepisy: czytaj("../przepisy.html"), jadlospis: czytaj("../jadlospis.html") };

test("moduł czyta odpowiedź przez parsujWersjeRestauracyjna i robi dokładnie jedną rundę poprawki", () => {
  prawda(/import \{[^}]*parsujWersjeRestauracyjna[^}]*\} from "\.\/parser\.js"/.test(modul), "brak importu parsera");
  prawda((modul.match(/parsujWersjeRestauracyjna\(/g) || []).length === 2, "ma być dokładnie: próba + poprawka");
  prawda(/zbudujPoprawkeRestauracyjna\(prompt, tekst, wynik\.bledy\)/.test(modul), "pushback nie dostaje rozjazdów");
});

test("zapis pod restauracyjne/{id} jako obiekt (pułapka 2), nowe produkty pod produktyWlasne, przez lokalne fb (pułapka 25)", () => {
  prawda(/fb\.set\(fb\.ref\(fb\.db, `domy\/\$\{kodDomu\}\/restauracyjne\/\$\{p\.id\}`\), wpis\)/.test(modul), "zły kształt lub ścieżka zapisu");
  prawda(/const wpis = \{ kroki:/.test(modul), "wpis nie jest obiektem");
  prawda(/fb\.update\(fb\.ref\(fb\.db, `domy\/\$\{kodDomu\}\/produktyWlasne`\), zmiany\)/.test(modul), "nowe produkty nie trafiają do produktyWlasne");
  prawda(!/this\.fb\b/.test(modul), "połączenie z bazą leży na this — pułapka 25");
});

test("komunikat błędu niesie etap i numer wydania", () => {
  prawda(/Nie udało się \(\$\{etap\}\)/.test(modul) && /\$\{WYDANIE\}/.test(modul), "błąd bez etapu albo bez wydania");
});

for (const [nazwa, html] of Object.entries(ekrany)) {
  const szablon = html.slice(0, html.indexOf('<script type="module">'));
  const skrypt = html.slice(html.indexOf('<script type="module">'));
  test(`${nazwa}.html: przyciski ulepsz/ponow w szablonie, ...daneRestauracyjne() i wczytanie gałęzi przy starcie`, () => {
    prawda(/@click="ulepsz\((p|przepis\.danie)\)"/.test(szablon), "brak przycisku wołającego ulepsz()");
    prawda(/@click="ponow\((p|przepis\.danie)\)"/.test(szablon), "brak przycisku wołającego ponow()");
    prawda(/\.\.\.daneRestauracyjne\(\)/.test(skrypt), "komponent nie rozkłada daneRestauracyjne()");
    prawda(/this\.wczytajRestauracyjne\(fb, kodDomu\)/.test(skrypt), "gałąź restauracyjne nie jest czytana przy starcie — przełącznik zniknie po odświeżeniu");
    prawda(!/parsujWersjeRestauracyjna|zbudujPromptRestauracyjny/.test(skrypt), "ekran ma własną kopię logiki zamiast modułu");
  });
}

console.log(`\nzdane: ${zdane}, oblane: ${oblane}`);
process.exit(oblane ? 1 : 0);
