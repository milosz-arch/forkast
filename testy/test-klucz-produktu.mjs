/* =====================================================================
   Klucz produktu w bazie.

   Firebase nie przyjmuje w kluczach znaków . # $ [ ] / — a w słowniku mamy
   „Mleko 2%", „Śmietana 18%", „Musztarda Dijon". Zły klucz nie wywala zapisu
   z hukiem, tylko sprawia, że odhaczenie ląduje pod inną ścieżką i nie dociera
   do drugiej osoby. Dokładnie ten objaw zgłoszony 3 sierpnia.
   ===================================================================== */
import { PRODUKTY } from "../produkty.js";

const klucz = nazwa => nazwa.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function rowne(a, b, opis = "") {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${opis}\n       jest: ${JSON.stringify(a)}\n       spodziewam: ${JSON.stringify(b)}`);
}

console.log("\n— klucz produktu —");

test("żaden produkt ze słownika nie daje klucza zakazanego w Firebase", () => {
  const zle = PRODUKTY.map(p => p.n).filter(n => /[.#$\[\]\/]/.test(klucz(n)));
  rowne(zle, [], "te nazwy dałyby klucz, którego Firebase nie przyjmie");
});

test("żaden produkt nie daje pustego klucza", () => {
  rowne(PRODUKTY.map(p => p.n).filter(n => klucz(n).length === 0), []);
});

test("dwa różne produkty nie dają tego samego klucza", () => {
  /* Kolizja znaczy, że odhaczenie jednego produktu odhaczałoby też drugi. */
  const mapa = new Map();
  const kolizje = [];
  for (const p of PRODUKTY) {
    const k = klucz(p.n);
    if (mapa.has(k)) kolizje.push(`${mapa.get(k)} ↔ ${p.n}`);
    else mapa.set(k, p.n);
  }
  rowne(kolizje, []);
});

test("znaki problematyczne są obsłużone", () => {
  rowne(klucz("Mleko 2%"), "mleko-2");
  rowne(klucz("Śmietana 18%"), "smietana-18");
  rowne(klucz("Musztarda Dijon"), "musztarda-dijon");
  rowne(klucz("Jajka"), "jajka");
});

test("klucz jest stabilny — ta sama nazwa zawsze daje ten sam wynik", () => {
  /* Gdyby zależał od czegokolwiek poza nazwą, dwa telefony liczyłyby inaczej
     i odhaczenia by się nie spotykały. */
  rowne(klucz("Pierś z kurczaka"), klucz("Pierś z kurczaka"));
  rowne(klucz("PIERŚ Z KURCZAKA"), klucz("pierś z kurczaka"));
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
