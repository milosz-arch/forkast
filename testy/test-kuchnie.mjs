import { kuchniaDania, rozkladKuchni, KUCHNIE } from "../kuchnie.js";
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

console.log("\n— kuchnie —");

test("rozpoznaje kuchnie po charakterystycznych nazwach", () => {
  const p = (n) => kuchniaDania({ nazwa: n }).kod;
  rowne(p("Ramen z kurczakiem"), "jp");
  rowne(p("Bibimbap z wołowiną"), "kr");
  rowne(p("Pad thai z krewetkami"), "th");
  rowne(p("Dal z soczewicy czerwonej"), "in");
  rowne(p("Tacos z fasolą"), "mx");
  rowne(p("Moussaka z bakłażanem"), "gr");
  rowne(p("Falafel z ciecierzycy"), "il");
  rowne(p("Ratatouille z piekarnika"), "fr");
  rowne(p("Ceviche z dorsza"), "pe");
});

test("kolejność reguł: katsu curry to Japonia, nie Indie", () => {
  /* Gdyby reguła „curry" stała wyżej, japońskie danie dostałoby flagę Indii —
     bo obie pasują. Kolejność jest tu decyzją, nie przypadkiem. */
  rowne(kuchniaDania({ nazwa: "Katsu curry z kurczakiem" }).kod, "jp");
  rowne(kuchniaDania({ nazwa: "Curry z ciecierzycą i szpinakiem" }).kod, "in");
});

test("polskie dania z talii mają wpisane pl, nie zgadnięte", () => {
  /* Od decyzji 68 kuchnia jest POLEM w daniu, nie wynikiem zgadywania po nazwie.
     Ten test sprawdza dane w talii, nie reguły — bo to dane są teraz źródłem prawdy. */
  const wTalii = (n) => TALIA_STARTOWA.find(d => d.nazwa === n);
  for (const n of ["Bigos", "Żurek z białą kiełbasą", "Pierogi z kapustą i grzybami",
                   "Rosół z makaronem", "Barszcz czerwony z uszkami", "Kopytka z masłem",
                   "Kotlet schabowy z ziemniakami i mizerią", "Placki ziemniaczane"]) {
    const d = wTalii(n);
    if (!d) throw new Error(`„${n}" zniknęło z talii`);
    rowne(d.kuchnia, "pl", `„${n}" powinno mieć wpisane pl`);
    rowne(kuchniaDania(d).kod, "pl", `„${n}" powinno czytać pl z pola`);
  }
});

test("pole ma pierwszeństwo nad regułami po nazwie", () => {
  /* Nazwa mówi „ramen" (reguła: Japonia), pole mówi „pl" — wygrywa pole.
     Bez tego reguły cicho nadpisywałyby to, co ktoś wpisał świadomie. */
  rowne(kuchniaDania({ nazwa: "Ramen z kurczakiem", kuchnia: "pl" }).kod, "pl");
  rowne(kuchniaDania({ nazwa: "Bigos", kuchnia: "jp" }).kod, "jp");
  /* Pole z nieistniejącym kodem jest ignorowane, nie wywala ekranu. */
  rowne(kuchniaDania({ nazwa: "Ramen z kurczakiem", kuchnia: "xx" }).kod, "jp");
});

test("sam makaron nie robi dania włoskim", () => {
  /* Reguła celuje w połączenie, nie w samo słowo. „Zapiekanka makaronowa"
     nie łapie się na żadną regułę — a od decyzji 68 znaczy to „uniwersalna",
     nie „polska”. Lepiej nie powiedzieć nic, niż zmyślić kraj. */
  rowne(kuchniaDania({ nazwa: "Zapiekanka makaronowa z serem" }).kod, "uni");
  rowne(kuchniaDania({ nazwa: "Makaron z pomidorami i bazylią" }).kod, "it");
});

test("gdy nic nie pasuje, wynikiem jest UNIWERSALNA, nigdy polska", () => {
  /* To jest test na konkretny błąd, nie na preferencję. Do 8 sierpnia wartością
     domyślną była „polska" — przez co 75 ze 113 dań uchodziło za polskie,
     w tym owsianka, koktajl owsiany i batony z daktylami. To nie była wartość
     domyślna, tylko zmyślona. */
  rowne(kuchniaDania({ nazwa: "Coś zupełnie nowego" }).kod, "uni");
  rowne(kuchniaDania({}).kod, "uni");
  rowne(kuchniaDania(null).kod, "uni");
  rowne(kuchniaDania({ nazwa: "Owsianka z bananem" }).kod, "uni");
});

test("każda kuchnia ma nazwę do wyświetlenia", () => {
  /* Flagi wypadły z interfejsu (decyzja 68) — nie renderują się na Windowsie
     i były czytane przez czytnik ekranu przed każdą nazwą. Nazwa jest teraz
     jedyną rzeczą, która trafia na ekran, więc to jej pilnujemy.
     „uniwersalna" celowo nie ma flagi — nie jest krajem. */
  const braki = Object.entries(KUCHNIE).filter(([, k]) => !k.nazwa).map(([kod]) => kod);
  rowne(braki, [], "kuchnia bez nazwy nie ma czego pokazać na karcie dania");
});

test("KAŻDE danie w talii ma kuchnię WPISANĄ w danych", () => {
  /* Nie „da się ją wyliczyć" — ma stać w pliku. To jest cała różnica
     wprowadzona decyzją 68 i jedyny test, który ją pilnuje. */
  const bezPola = TALIA_STARTOWA.filter(d => !d.kuchnia).map(d => d.nazwa);
  rowne(bezPola, [], "danie bez wpisanej kuchni wróciłoby do zgadywania");
  const zlyKod = TALIA_STARTOWA.filter(d => !KUCHNIE[d.kuchnia]).map(d => d.nazwa);
  rowne(zlyKod, [], "kod kuchni spoza słownika KUCHNIE");
});

test("polska nie zjada wszystkiego", () => {
  /* Gdyby reguły przestały łapać, wszystko spadłoby do domyślnej flagi i nikt
     by nie zauważył — bo brak flagi wygląda tak samo jak flaga polska. */
  const r = rozkladKuchni(TALIA_STARTOWA);
  const udzial = r.pl / TALIA_STARTOWA.length;
  if (udzial > 0.4) throw new Error(`polska to ${Math.round(udzial * 100)}% talii — ktoś znowu przypisał ją hurtem`);
});

test("w talii jest co najmniej osiem różnych kuchni", () => {
  const ile = Object.keys(rozkladKuchni(TALIA_STARTOWA)).length;
  if (ile < 8) throw new Error(`tylko ${ile} kuchni — talia zrobiła się jednostajna`);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
