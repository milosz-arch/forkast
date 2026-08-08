/* =====================================================================
   Uruchamia wszystkie zestawy testów i wypisuje sumę.

   Powstało, bo liczba testów była trzykrotnie przepisywana ręcznie do
   dokumentów i za każdym razem inaczej: nagłówek mówił 149, tabela sumowała
   się do 144, a jeden plik deklarował 15 przy 11 w tabeli. Liczba ma być
   liczona, nie pamiętana — to ta sama zasada, przez którą kroki przepisów
   podają gramy zamiast szklanek.

   Użycie:  node uruchom-testy.mjs
   ===================================================================== */

import { readdirSync } from "fs";
import { execFileSync } from "child_process";

/* Zestawy leżą obok tego pliku. Liczone od położenia TEGO pliku, nie od tego,
   skąd ktoś uruchomił node — inaczej wynik zależałby od katalogu w terminalu. */
const TUTAJ = new URL("./", import.meta.url);

const pliki = readdirSync(TUTAJ).filter(f => f.startsWith("test-") && f.endsWith(".mjs")).sort();

let sumaZdanych = 0, sumaOblanych = 0;
const wiersze = [];

for (const plik of pliki) {
  let wyjscie = "";
  try {
    wyjscie = execFileSync("node", [new URL(plik, TUTAJ).pathname], { encoding: "utf8" });
  } catch (e) {
    wyjscie = (e.stdout || "") + (e.stderr || "");
  }
  const m = wyjscie.match(/zdane:\s*(\d+),\s*oblane:\s*(\d+)/);
  const zdane = m ? Number(m[1]) : 0;
  const oblane = m ? Number(m[2]) : -1;   // -1 = zestaw w ogóle się nie wykonał
  sumaZdanych += Math.max(zdane, 0);
  sumaOblanych += Math.max(oblane, 0);
  wiersze.push({ plik, zdane, oblane });
}

for (const w of wiersze) {
  const stan = w.oblane < 0 ? "NIE URUCHOMIŁ SIĘ" : w.oblane > 0 ? `OBLANE: ${w.oblane}` : "ok";
  console.log(`  ${w.plik.padEnd(28)} ${String(w.zdane).padStart(3)}  ${stan}`);
}

/* Zestaw, który się wywalił przy starcie, nie ma ani jednego „oblane" do policzenia —
   a podsumowanie mówiące „0 oblanych" czyta się wtedy jak zieleń. Dopisujemy to
   do TEJ linii, bo to jedyna, którą człowiek naprawdę czyta. */
const martwe = wiersze.filter(w => w.oblane < 0);
const ogon = martwe.length ? `, ${martwe.length} NIE URUCHOMIŁO SIĘ` : "";
console.log(`\n  RAZEM: ${sumaZdanych} zdanych, ${sumaOblanych} oblanych, ${pliki.length} zestawów${ogon}\n`);
process.exit(sumaOblanych > 0 || martwe.length ? 1 : 0);

