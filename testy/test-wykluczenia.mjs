import { daniePasuje, filtrujTalie, TAGI_PRODUKTOW, WYKLUCZENIA } from "../wykluczenia.js";
import { TALIA_STARTOWA } from "../talia-startowa.js";

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

console.log("\n— pojedyncze danie —");

test("danie bez mięsa/ryb przechodzi filtr 'mieso'", () => {
  const danie = { skladniki: [{ produkt: "Quinoa", gramy: 100 }, { produkt: "Jogurt grecki", gramy: 50 }] };
  prawda(daniePasuje(danie, ["mieso"]));
});

test("danie z kurczakiem odpada przy wykluczeniu 'mieso'", () => {
  const danie = { skladniki: [{ produkt: "Pierś z kurczaka", gramy: 200 }] };
  prawda(!daniePasuje(danie, ["mieso"]));
});

test("danie z łososiem odpada przy 'ryby', ale nie przy 'mieso'", () => {
  const danie = { skladniki: [{ produkt: "Łosoś świeży — filet", gramy: 200 }] };
  prawda(!daniePasuje(danie, ["ryby"]));
  prawda(daniePasuje(danie, ["mieso"]));
});

test("brak wykluczeń przepuszcza wszystko", () => {
  const danie = { skladniki: [{ produkt: "Rostbef wołowy", gramy: 500 }] };
  prawda(daniePasuje(danie, []));
});

test("nieznany produkt (spoza słownika tagów) nie blokuje dania", () => {
  const danie = { skladniki: [{ produkt: "Coś nowego, czego AI jeszcze nie otagowało", gramy: 10 }] };
  prawda(daniePasuje(danie, ["gluten", "orzechy"]), "brak tagu = nie ma powodu odrzucać");
});

test("sezam i słonecznik NIE są tagowane jako orzechy (to nasiona)", () => {
  rowne(TAGI_PRODUKTOW["Sezam"], undefined);
  rowne(TAGI_PRODUKTOW["Słonecznik łuskany"], undefined);
});

test("kasza gryczana i ryż NIE mają glutenu mimo nazwy/skojarzenia", () => {
  rowne(TAGI_PRODUKTOW["Kasza gryczana"], undefined);
  rowne(TAGI_PRODUKTOW["Ryż basmati"], undefined);
});

console.log("\n— filtrujTalie na prawdziwej talii startowej (45 dań) —");

test("bez wykluczeń zwraca całą talię", () => {
  rowne(filtrujTalie(TALIA_STARTOWA, []).length, TALIA_STARTOWA.length);
});

test("wykluczenie mięsa i ryb zostawia wyłącznie dania bez tych tagów", () => {
  const wynik = filtrujTalie(TALIA_STARTOWA, ["mieso", "ryby"]);
  prawda(wynik.length > 0, "zostało cokolwiek");
  prawda(wynik.length < TALIA_STARTOWA.length, "coś faktycznie odpadło");
  for (const d of wynik) {
    for (const sk of d.skladniki) {
      const tagi = TAGI_PRODUKTOW[sk.produkt] || [];
      prawda(!tagi.includes("mieso") && !tagi.includes("ryby"),
        `"${d.nazwa}" przeszło mimo składnika "${sk.produkt}" (${tagi})`);
    }
  }
});

test("wykluczenie glutenu usuwa dania z chlebem/makaronem/tortillą", () => {
  const wynik = filtrujTalie(TALIA_STARTOWA, ["gluten"]);
  const nazwy = wynik.map(d => d.nazwa);
  prawda(!nazwy.includes("Krewetki w czosnku z makaronem"));
  prawda(!nazwy.includes("Tortilla z kurczakiem i warzywami"));
  prawda(nazwy.includes("Owsianka z owocami i orzechami"), "płatki owsiane nie mają glutenu");
});

test("wykluczenie orzechów zostawia dania z sezamem i słonecznikiem", () => {
  const wynik = filtrujTalie(TALIA_STARTOWA, ["orzechy"]);
  const nazwy = wynik.map(d => d.nazwa);
  prawda(nazwy.includes("Tuńczyk z ryżem i warzywami"), "sezam nie jest orzechem");
});

console.log("\n— cała talia kontra słowa-klucze (regresja z 3 sierpnia) —");

/* Ten test szuka mięsa po NAZWIE produktu, nie po tagu — czyli sprawdza dokładnie
   to, czego tagi mogą nie wiedzieć. Powód: przy rozszerzeniu talii o polską klasykę
   doszło 33 nowych produktów, a tagi zostały stare — i wegetarianin dostawał
   w talii schabowego, żurek i bigos. Ten test złapie to samo przy każdym
   kolejnym rozszerzeniu, bez potrzeby pamiętania o aktualizacji tagów. */

const SLOWA_MIESO = /schab|wieprz|kiełbas|boczek|kurczak|indyk|wołow|szynk|mielon/i;
const SLOWA_RYBY  = /łoso|krewet|tuńczyk|makrel|dorsz|śledz|ryba/i;

test("żadne danie z mięsem w nazwie składnika nie przechodzi filtru wege", () => {
  const wege = filtrujTalie(TALIA_STARTOWA, ["mieso", "ryby"]);
  const przecieki = [];
  for (const d of wege)
    for (const sk of d.skladniki)
      if (SLOWA_MIESO.test(sk.produkt) || SLOWA_RYBY.test(sk.produkt))
        przecieki.push(`${d.nazwa} → ${sk.produkt}`);
  rowne(przecieki, [], "wegetarianin nie może dostać tych dań");
});

test("filtry zostawiają sensowną liczbę dań, nie pustkę", () => {
  for (const [opis, w] of [["wege", ["mieso","ryby"]], ["bez glutenu", ["gluten"]],
                            ["bez nabiału", ["nabial"]], ["wege+bezglutenu", ["mieso","ryby","gluten"]]]) {
    const ile = filtrujTalie(TALIA_STARTOWA, w).length;
    prawda(ile >= 20, `${opis}: zostało tylko ${ile} dań — za mało, żeby ułożyć okres`);
  }
});

console.log("\n— miary w przepisach (zasada z 3 sierpnia) —");

/* Wszystkie ilości mają być w gramach albo mililitrach, także w krokach.
   Powód nie jest kosmetyczny: z tych liczb apka liczy listę zakupów i przelicza
   porcje na inną liczbę osób. Ze „szklanki" nie da się policzyć nic.

   Test szuka po słowach, nie po tagach — czyli złapie to również wtedy, gdy
   kolejna partia przyjdzie z AI, które zignoruje polecenie w prompcie. */
/* UWAGA NA \b W POLSKICH SŁOWACH. Poprzednia wersja tego wzorca używała `\b`,
   a `\b` w JavaScripcie jest liczone po ASCII — ł, ż, ć, ś nie są dla niego znakami
   słowa, więc granica przed nimi PO PROSTU NIE ISTNIEJE. Skutek: `\błyżk` nie łapało
   „łyżki" nigdy, a razem z nim martwe były `łyżeczk`, `garść`, `ćwierć` i `troch`.
   Test przechodził na zielono przez cały czas i przepuścił „dwie łyżki oliwy"
   w Tortilli española. Dlatego granice są tu na `\p{L}` z flagą `u`, nie na `\b`.

   `łyżk(?!ą)` celowo: narzędnikiem miesza się i rozgniata („rozcierając łyżką"),
   a mierzy się mianownikiem i biernikiem („dwie łyżki"). Bez tego wyjątku test
   dawałby cztery fałszywe alarmy na krokach, które są w porządku.

   `parę` wypadło z listy: jedyne wystąpienie w talii to „zatrzymuje parę" o parze
   wodnej w Ratatouille. Test, który świeci na czerwono na poprawnym przepisie,
   przestaje być czytany — a wagę tego terminu i tak niosą „trochę", „odrobinę"
   i „na oko". */
const MIARY_ZAKAZANE =
  /(?<!\p{L})(szklan\p{L}*|garść|garści\p{L}*|garstk\p{L}*|łyżk(?!ą)\p{L}*|łyżeczk(?!ą)\p{L}*|szczypt\p{L}*|odrobin\p{L}*|troch\p{L}+|nieco|do smaku|wedle uznania|na oko|pół litra|litr\p{L}*|ćwierć)(?!\p{L})/iu;

test("żaden krok w talii nie używa szklanek, łyżek ani szczypt", () => {
  const przecieki = [];
  for (const d of TALIA_STARTOWA)
    for (const k of (d.kroki || []))
      if (MIARY_ZAKAZANE.test(k)) przecieki.push(`${d.nazwa}: ${k.slice(0, 60)}…`);
  rowne(przecieki, [], "z takich miar nie da się policzyć listy zakupów");
});

console.log("\n— lista kategorii kontra tagi —");

test("każda kategoria pokazywana użytkownikowi coś realnie filtruje", () => {
  /* Kategoria bez ani jednego dania do odsiania znaczy, że albo tagi jej nie
     używają, albo nazwa się rozjechała — i użytkownik zaznacza checkbox,
     który nic nie robi. */
  const puste = [];
  for (const w of WYKLUCZENIA) {
    const zostaje = filtrujTalie(TALIA_STARTOWA, [w.id]).length;
    if (zostaje === TALIA_STARTOWA.length) puste.push(w.id);
  }
  rowne(puste, [], "te kategorie nie odsiewają niczego");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
