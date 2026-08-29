/* =====================================================================
   ZAGNIEŻDŻENIE ZNACZNIKÓW W SZABLONACH.

   Powstało 29 sierpnia, przy wyprowadzaniu pola dopisywania poza blok listy
   zakupów. Przenoszenie kawałka szablonu o jeden poziom w górę to operacja,
   przy której najłatwiej zostawić o jedno `</div>` za dużo albo za mało —
   a skutek jest nieproporcjonalny do pomyłki: przeglądarka nie zgłasza nic,
   tylko po cichu domyka znaczniki po swojemu. Sekcja ląduje wtedy w środku
   innej, `x-show` zaczyna dotyczyć nie tego, co miał, i ekran wygląda na zepsuty
   bez ani jednego błędu w konsoli.

   Ograniczenie, o którym trzeba wiedzieć: to jest test CZYTAJĄCY KOD JAKO TEKST.
   Zobaczy niezamknięty znacznik, nie zobaczy nachodzących przycisków ani pola
   wystającego poza ekran. Tamto łapie wyłącznie człowiek z telefonem.
   ===================================================================== */

import { readdirSync, readFileSync } from "fs";

const KORZEN = new URL("../", import.meta.url);

/* Znaczniki, które MUSZĄ się domykać. Świadomie pomijamy te samozamykające
   i te, które w HTML-u wolno zostawić otwarte (`p`, `span` w praktyce też,
   ale tam pomyłka nie przesuwa całych sekcji). */
const PARZYSTE = ["div", "form", "section", "ul", "ol", "li", "template",
                  "article", "main", "header", "footer", "nav", "button", "label"];

let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}

/* Komentarze wycinamy: opisy w nich wymieniają znaczniki z nazwiska
   („ten blok ma x-show na <div>”) i policzone dawałyby fałszywy alarm.
   To ta sama pułapka, przez którą test klas przechodził sabotaż 8 sierpnia,
   czytając nazwy klas z własnego komentarza. */
const bezKomentarzy = (s) => s.replace(/<!--[\s\S]*?-->/g, "");

function sprawdz(html) {
  const stos = [];
  const wzor = new RegExp(`</?(${PARZYSTE.join("|")})\\b[^>]*?(/?)>`, "g");
  let m;
  while ((m = wzor.exec(html))) {
    const [caly, tag, samozamykajacy] = m;
    if (samozamykajacy) continue;
    if (caly.startsWith("</")) {
      if (!stos.length) return `nadmiarowe </${tag}>`;
      const otwarty = stos.pop();
      if (otwarty !== tag) return `</${tag}> zamyka <${otwarty}>`;
    } else {
      stos.push(tag);
    }
  }
  return stos.length ? `niezamknięte: <${stos.join(">, <")}>` : null;
}

const ekrany = readdirSync(KORZEN).filter(f => f.endsWith(".html")).sort();
if (!ekrany.length) throw new Error("Nie znalazłem ani jednego pliku HTML — test skanuje pustkę.");

for (const plik of ekrany) {
  test(`${plik}: znaczniki domykają się we właściwej kolejności`, () => {
    const blad = sprawdz(bezKomentarzy(readFileSync(new URL(plik, KORZEN), "utf8")));
    if (blad) throw new Error(blad);
  });
}

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
