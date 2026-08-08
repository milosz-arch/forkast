/* =====================================================================
   Zapis wykluczeń — pusta tablica kontra znacznik.

   Firebase nie zapisuje pustych tablic ani pustych obiektów: `set(ref, [])`
   kasuje węzeł. Skutek w produkcie: kto nic nie wykluczył, dostawał pytanie
   „czego nie jecie?" przy KAŻDYM wejściu na ekran Dań, bo `exists()` zwracało
   fałsz i apka uznawała, że nigdy nie odpowiedział.

   To ta sama klasa problemu co inne dzisiejsze: nie błąd logiki, tylko
   sprzeczność między tym, co zapisaliśmy, a tym, co baza przechowuje.
   ===================================================================== */

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function rowne(a, b, opis = "") {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${opis}\n       jest: ${JSON.stringify(a)}\n       spodziewam: ${JSON.stringify(b)}`);
}

/* Odwzorowanie tego, co robi ekran: co zapisujemy i jak to odczytujemy. */
const doZapisu = (lista) => ({ ustawione: true, lista });

/** Symuluje Firebase: puste tablice i obiekty znikają. */
const przezBaze = (wartosc) => {
  if (Array.isArray(wartosc) && wartosc.length === 0) return null;
  if (wartosc && typeof wartosc === "object" && !Array.isArray(wartosc)) {
    const bezPustych = Object.fromEntries(
      Object.entries(wartosc).filter(([, v]) => !(Array.isArray(v) && v.length === 0)));
    return Object.keys(bezPustych).length ? bezPustych : null;
  }
  return wartosc;
};

const odczytaj = (wykl) => ({
  lista: Array.isArray(wykl) ? wykl : (wykl?.lista || []),
  juzUstawione: Array.isArray(wykl) || wykl?.ustawione === true,
});

console.log("\n— zapis wykluczeń —");

test("pusty wybór przeżywa zapis do bazy", () => {
  /* To jest sedno błędu: człowiek nic nie zaznaczył, ale ODPOWIEDZIAŁ. */
  const w = odczytaj(przezBaze(doZapisu([])));
  rowne(w.juzUstawione, true, "pusty wybór musi zostać zapamiętany jako odpowiedź");
  rowne(w.lista, []);
});

test("goła pusta tablica NIE przeżywa — dlatego jej nie używamy", () => {
  rowne(przezBaze([]), null);
  rowne(odczytaj(przezBaze([])).juzUstawione, false);
});

test("wybór z zaznaczeniami działa", () => {
  const w = odczytaj(przezBaze(doZapisu(["mieso", "gluten"])));
  rowne([w.juzUstawione, w.lista], [true, ["mieso", "gluten"]]);
});

test("stary format (goła tablica) czytamy dalej", () => {
  /* Kto przeszedł ten krok przed poprawką, ma w bazie tablicę. Nie wolno mu
     zresetować pytania tylko dlatego, że zmieniliśmy kształt zapisu. */
  const w = odczytaj(["mieso"]);
  rowne([w.juzUstawione, w.lista], [true, ["mieso"]]);
});

test("brak wpisu = pytanie zadajemy", () => {
  const w = odczytaj(null);
  rowne([w.juzUstawione, w.lista], [false, []]);
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
