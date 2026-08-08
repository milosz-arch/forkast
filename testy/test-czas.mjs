import { minutyZKrokow, prog, opisCzasu, wymagaWyprzedzenia, PROGI } from "../czas.js";
import { TALIA_STARTOWA } from "../talia-startowa.js";

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function rowne(a, b, opis = "") {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${opis}\n       jest: ${JSON.stringify(a)}\n       spodziewam: ${JSON.stringify(b)}`);
}

console.log("\n— czas przygotowania —");

test("sumuje minuty z kroków i dolicza krokom bez czasu", () => {
  /* 10 + 5 z czasem, plus jeden krok bez czasu × 2 min. */
  rowne(minutyZKrokow({ kroki: ["Gotuj 10 minut", "Pokrój cebulę", "Smaż 5 minut"] }), 17);
});

test("godziny przeliczane na minuty", () => {
  rowne(minutyZKrokow({ kroki: ["Piecz 2 godziny"] }), 120);
});

test("ułamek z przecinkiem działa", () => {
  rowne(minutyZKrokow({ kroki: ["Gotuj 6,5 minuty"] }), 7);
});

test("marynowanie przez noc NIE liczy się do czasu w kuchni", () => {
  /* Człowiek wtedy śpi. Ramen wychodził przez to na 170 minut, z czego 120
     to marynowanie jajek. */
  const d = { kroki: ["Zalej jajka i odstaw na minimum 2 godziny", "Gotuj wywar 20 minut"] };
  rowne(minutyZKrokow(d), 20);
  rowne(wymagaWyprzedzenia(d), true, "ale o tym trzeba wiedzieć zawczasu");
});

test("danie bez ani jednej liczby dostaje szacunek, nie null", () => {
  /* Sałatki i kanapki nie mają czasów w krokach, ale trwają realnie kilka minut.
     Null zostawiłby dziesięć dań bez oznaki. */
  const m = minutyZKrokow({ kroki: ["Pokrój pomidory", "Ułóż na talerzu", "Polej oliwą"] });
  rowne(m, 9);
});

test("przepis bez kroków nie da się oszacować", () => {
  rowne(minutyZKrokow({ kroki: [] }), null);
  rowne(minutyZKrokow({}), null);
});

test("progi przypisują się zgodnie z granicami", () => {
  rowne(prog({ kroki: ["Gotuj 18 minut"] }).id, "szybko");
  rowne(prog({ kroki: ["Gotuj 40 minut"] }).id, "srednio");
  rowne(prog({ kroki: ["Piecz 90 minut"] }).id, "dlugo");
});

test("opis zaokrągla, bo nie udajemy precyzji", () => {
  /* „31 minut" byłoby kłamstwem — nie wiemy, jak szybko ktoś kroi cebulę. */
  rowne(opisCzasu({ kroki: ["Gotuj 31 minut"] }), "30 min");
  rowne(opisCzasu({ kroki: ["Gotuj 7 minut"] }), "5 min");
});

test("KAŻDE danie w talii ma policzony czas", () => {
  /* To był główny zarzut do kubełków: 45 dań ze 101 nie miało żadnej kategorii,
     więc oznaczenia wyglądały na przypadkowe. */
  const bez = TALIA_STARTOWA.filter(d => minutyZKrokow(d) === null).map(d => d.nazwa);
  rowne(bez, []);
});

test("każde danie trafia do któregoś progu", () => {
  rowne(TALIA_STARTOWA.filter(d => !prog(d)).map(d => d.nazwa), []);
});

test("rozkład jest sensowny — żaden próg nie jest pusty ani nie zjada reszty", () => {
  for (const p of PROGI) {
    const n = TALIA_STARTOWA.filter(d => prog(d)?.id === p.id).length;
    if (n < 10) throw new Error(`próg "${p.etykieta}" ma tylko ${n} dań`);
    if (n > TALIA_STARTOWA.length * 0.6) throw new Error(`próg "${p.etykieta}" zjada ${n} z ${TALIA_STARTOWA.length}`);
  }
});

test("żadne danie nie wychodzi absurdalnie długie", () => {
  /* Powyżej trzech godzin czynnej pracy to znak, że coś biernego przeciekło
     do sumy — tak jak marynowanie w ramenie. */
  const absurdy = TALIA_STARTOWA
    .filter(d => minutyZKrokow(d) > 180)
    .map(d => `${d.nazwa} (${minutyZKrokow(d)} min)`);
  rowne(absurdy, []);
});



/* ===================== czas zależny od sprzętu ===================== */
const { czasDlaSprzetu, progDlaSprzetu, opisCzasuDlaSprzetu } = await import("../czas.js");

console.log("— czas zależny od sprzętu —");

const PIEKE = { kroki: ["Rozgrzej piekarnik do 200°C", "Piecz 30 minut"] };
const GOTUJ = { kroki: ["Gotuj 20 minut", "Zagotuj wodę 5 minut"] };
const BLEND = { kroki: ["Gotuj 15 minut", "Zblenduj na gładko"] };

test("brak piekarnika to NIEWYKONALNOŚĆ, nie dłuższy czas", () => {
  /* Pokazywanie tego jako „o 10 minut dłużej" byłoby kłamstwem — człowiek
     zaplanowałby danie, którego nie zrobi. */
  const w = czasDlaSprzetu(PIEKE, { piekarnik: "brak" });
  rowne(w.niewykonalne, true);
  rowne(w.powody, ["wymaga piekarnika"]);
});

test("brak piekarnika nie przeszkadza daniu, którego się nie piecze", () => {
  rowne(czasDlaSprzetu(GOTUJ, { piekarnik: "brak" }).niewykonalne, false);
});

test("płyta elektryczna wydłuża kroki z grzaniem", () => {
  const bazowy = czasDlaSprzetu(GOTUJ, { plyta: "gaz" }).minuty;
  const elektr = czasDlaSprzetu(GOTUJ, { plyta: "elektryczna" }).minuty;
  if (elektr <= bazowy) throw new Error(`elektryczna ${elektr} nie jest dłuższa od gazu ${bazowy}`);
});

test("płyta nie wpływa na danie bez grzania", () => {
  const salatka = { kroki: ["Pokrój pomidory", "Polej oliwą"] };
  rowne(czasDlaSprzetu(salatka, { plyta: "elektryczna" }).minuty,
        czasDlaSprzetu(salatka, { plyta: "gaz" }).minuty);
});

test("piekarnik bez termoobiegu dokłada czas i mówi dlaczego", () => {
  const w = czasDlaSprzetu(PIEKE, { piekarnik: "gora-dol" });
  const z = czasDlaSprzetu(PIEKE, { piekarnik: "termoobieg" });
  rowne(w.minuty, z.minuty + 10);
  rowne(w.powody.length > 0, true, "człowiek ma wiedzieć, skąd dodatkowy czas");
});

test("brak blendera dokłada czas tylko tam, gdzie się blenduje", () => {
  const bez = czasDlaSprzetu(BLEND, { naczynia: ["patelnia"] }).minuty;
  const z = czasDlaSprzetu(BLEND, { naczynia: ["patelnia", "blender"] }).minuty;
  if (bez <= z) throw new Error("brak blendera powinien wydłużyć");
  rowne(czasDlaSprzetu(GOTUJ, { naczynia: ["patelnia"] }).minuty,
        czasDlaSprzetu(GOTUJ, { naczynia: ["blender"] }).minuty, "nie blendujemy — bez różnicy");
});

test("brak ustawień = wartości domyślne, nie awaria", () => {
  /* Większość ludzi nigdy nie wejdzie w Ustawienia. Apka musi działać
     bez tej informacji. */
  for (const s of [undefined, null, {}, { plyta: "gaz" }])
    if (czasDlaSprzetu(GOTUJ, s).minuty === null) throw new Error(`padło na ${JSON.stringify(s)}`);
});

test("słabszy sprzęt nigdy nie skraca czasu", () => {
  const mocny = { plyta: "indukcja", piekarnik: "termoobieg", naczynia: ["patelnia","garnek-duzy","wok","blender"] };
  const slaby = { plyta: "elektryczna", piekarnik: "gora-dol", naczynia: ["patelnia"] };
  const gorsze = TALIA_STARTOWA.filter(d => {
    const a = czasDlaSprzetu(d, mocny), b = czasDlaSprzetu(d, slaby);
    return !b.niewykonalne && b.minuty < a.minuty;
  }).map(d => d.nazwa);
  rowne(gorsze, [], "gorszy sprzęt dający krótszy czas znaczy błąd w mnożnikach");
});

test("każde danie ma czas dla każdego zestawu sprzętu", () => {
  for (const s of [{ plyta:"gaz" }, { plyta:"elektryczna" }, { piekarnik:"brak" }, {}]) {
    const bez = TALIA_STARTOWA.filter(d => czasDlaSprzetu(d, s).minuty === null);
    rowne(bez.map(d => d.nazwa), [], `brak czasu przy ${JSON.stringify(s)}`);
  }
});

/* Dwa testy dopisane 8 sierpnia na klasy błędów, których nic nie łapało —
   oba znalezione dopiero przez uruchomienie kodu na całej talii, nie przez testy. */

test("pieczarki to nie piekarnik", () => {
  const bezPiekarnika = { plyta: "indukcja", piekarnik: "brak",
                          naczynia: ["patelnia", "garnek-duzy", "wok", "blender"] };
  /* Wzorzec „piecz” łapał „pieczarki” i robił z dania z patelni danie
     niewykonalne bez piekarnika. Tu na sztucznych daniach, żeby test nie
     przestał sprawdzać, gdy któreś prawdziwe danie zmieni nazwę. */
  const zPieczarkami = { kroki: ["Podsmaż pokrojone pieczarki 8 minut."] };
  const zPiekarnikiem = { kroki: ["Piecz w piekarniku 30 minut."] };
  rowne(czasDlaSprzetu(zPieczarkami, bezPiekarnika).niewykonalne, false, "pieczarki nie wymagają piekarnika");
  rowne(czasDlaSprzetu(zPiekarnikiem, bezPiekarnika).niewykonalne, true, "pieczenie nadal wymaga piekarnika");
  for (const forma of ["Upiecz 20 minut", "Opiecz 5 minut", "Dopiecz 10 minut", "Zapiekaj 15 minut"])
    rowne(czasDlaSprzetu({ kroki: [forma] }, bezPiekarnika).niewykonalne, true, `„${forma}” to piekarnik`);
  for (const forma of ["Dodaj pieczarki i smaż 5 minut", "Podaj z pieczywem"])
    rowne(czasDlaSprzetu({ kroki: [forma] }, bezPiekarnika).niewykonalne, false, `„${forma}” to nie piekarnik`);
});

test("podpis czasu i kolor progu zawsze mówią to samo", () => {
  /* Próg liczył się z surowych minut, a podpis z zaokrąglonych — danie na
     21 minut miało podpis „20 min” i kolor „do 45 min”. Sprawdzamy całą talię
     na kilku zestawach sprzętu, bo sprzęt zmienia minuty i może wepchnąć
     danie na drugą stronę progu. */
  const zestawy = [undefined,
                   { plyta: "elektryczna", piekarnik: "gora-dol", naczynia: ["patelnia"] },
                   { plyta: "gaz", naczynia: ["patelnia", "garnek-duzy", "wok", "blender"] }];
  const rozjazdy = [];
  for (const s of zestawy)
    for (const d of TALIA_STARTOWA) {
      const opis = s ? opisCzasuDlaSprzetu(d, s) : opisCzasu(d);
      if (!opis) continue;
      const zPodpisu = PROGI.find(p => Number(opis.replace(" min", "")) <= p.do);
      const zKoloru = s ? progDlaSprzetu(d, s) : prog(d);
      if (zPodpisu.id !== zKoloru.id) rozjazdy.push(`${d.nazwa}: podpis ${opis} (${zPodpisu.etykieta}) vs kolor ${zKoloru.etykieta}`);
    }
  rowne(rozjazdy, [], "odznaka nie może mówić co innego liczbą, a co innego kolorem");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
