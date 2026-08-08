import { readFileSync } from "node:fs";
import { nalozSpizarnie, poZuzyciu, starczyNa, opisZapasu, kluczProduktu } from "../spizarnia.js";

/* Testy leżą w `testy/`, a pliki apki w korzeniu repozytorium — stąd ten skok
   o katalog wyżej. Liczony od położenia TEGO pliku, nie od tego, skąd ktoś
   uruchomił node, bo inaczej wynik zależałby od katalogu w terminalu. */
const KORZEN = new URL("../", import.meta.url);

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function rowne(a, b, opis = "") {
  if (JSON.stringify(a) !== JSON.stringify(b))
    throw new Error(`${opis}\n       jest: ${JSON.stringify(a)}\n       spodziewam: ${JSON.stringify(b)}`);
}

console.log("\n— spiżarnia —");

const lista = [
  { produkt: "Mąka pszenna", gramy: 250 },
  { produkt: "Jajka", gramy: 300 },
  { produkt: "Mleko 2%", gramy: 500 },
];

test("pusta spiżarnia nie zmienia listy", () => {
  const w = nalozSpizarnie(lista, {});
  rowne(w.map(p => p.doKupienia), [250, 300, 500]);
  rowne(w.map(p => p.wDomu), [false, false, false]);
});

test("zapas częściowy zmniejsza to, co trzeba kupić", () => {
  const w = nalozSpizarnie(lista, { "maka-pszenna": 100 });
  rowne(w[0].doKupienia, 150);
  rowne(w[0].masz, 100);
  rowne(w[0].wDomu, false);
});

test("zapas pokrywający całość oznacza „mamy”", () => {
  const w = nalozSpizarnie(lista, { "maka-pszenna": 900 });
  rowne([w[0].doKupienia, w[0].wDomu], [0, true]);
});

test("zapas równy potrzebie też oznacza „mamy”", () => {
  /* 250 g w domu przy przepisie na 250 g — nie ma po co iść do sklepu. */
  rowne(nalozSpizarnie(lista, { "maka-pszenna": 250 })[0].wDomu, true);
});

test("nadmiar nie robi ujemnych zakupów", () => {
  rowne(nalozSpizarnie(lista, { "maka-pszenna": 5000 })[0].doKupienia, 0);
});

test("produkt spoza listy nie psuje niczego", () => {
  const w = nalozSpizarnie(lista, { "cos-czego-nie-ma": 400 });
  rowne(w.map(p => p.doKupienia), [250, 300, 500]);
});

test("odliczenie zużycia zmniejsza zapas", () => {
  rowne(poZuzyciu({ "maka-pszenna": 1000 }, lista), { "maka-pszenna": 750 });
});

test("odliczenie do zera kasuje wpis", () => {
  /* null, nie 0 — zero w bazie zostawia śmieć, który potem trzeba filtrować. */
  rowne(poZuzyciu({ "maka-pszenna": 250 }, lista), { "maka-pszenna": null });
});

test("odliczenie nie schodzi poniżej zera", () => {
  rowne(poZuzyciu({ "maka-pszenna": 100 }, lista), { "maka-pszenna": null });
});

test("czego nie było w spiżarni, tego nie odliczamy", () => {
  rowne(poZuzyciu({}, lista), {});
});

test("na ile starczy — liczone, nie zgadywane", () => {
  rowne(starczyNa(1000, 250), 4);
  rowne(starczyNa(100, 250), 0.4);
});

test("produkt nieużywany w okresie nie dostaje zmyślonej liczby", () => {
  rowne(starczyNa(1000, 0), null);
  rowne(opisZapasu(1000, 0), "nie ma tego w tym okresie");
});

test("opisy zapasu są zrozumiałe", () => {
  rowne(opisZapasu(100, 250), "nie starczy na cały okres");
  rowne(opisZapasu(300, 250), "starczy na ten okres");
  rowne(opisZapasu(1000, 250), "starczy na 4 okresy");
});

test("klucz produktu radzi sobie ze znakami zakazanymi w Firebase", () => {
  rowne(kluczProduktu("Mleko 2%"), "mleko-2");
  rowne(kluczProduktu("Śmietana 18%"), "smietana-18");
});

test("pozycja bez gramów nie przechodzi po cichu", () => {
  /* Do 8 sierpnia ekran Zakupów gubił `gramy` przy spłaszczaniu listy, więc
     tutaj wchodziło `masz - undefined` = NaN. Spiżarnia nie odejmowała nic
     i nikt się o tym nie dowiedział, bo NaN nie jest błędem — jest liczbą.
     Od teraz to wybucha na miejscu, a nie sześć ekranów dalej (decyzja 70). */
  let wybuchlo = false;
  try { nalozSpizarnie([{ produkt: "Ryż basmati" }], {}); }
  catch { wybuchlo = true; }
  if (!wybuchlo) throw new Error("przeszło bez gramów — spiżarnia znowu liczyłaby NaN");
});

test("ekran Zakupów przekazuje spiżarni wszystko, czego ona potrzebuje", () => {
  /* Test czyta HTML, bo pułapka nie siedziała w module, tylko w tym jednym
     miejscu, gdzie ekran przepisuje pozycje na własny kształt. */
  const html = readFileSync(new URL("zakupy.html", KORZEN), "utf8");
  const i = html.indexOf("grupy.flatMap");
  if (i === -1) throw new Error("nie znalazłem spłaszczania listy w zakupy.html");
  const kawalek = html.slice(i, html.indexOf("})));", i));
  for (const pole of ["produkt", "gramy"]) {
    if (!new RegExp(`(^|[\\s{,])${pole}\\s*[,:]`, "m").test(kawalek))
      throw new Error(`spłaszczona pozycja gubi pole "${pole}" — nalozSpizarnie policzy NaN`);
  }
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
