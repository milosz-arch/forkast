/* =====================================================================
   FORMULARZ — ręczne dodanie dania, bez AI (decyzja 15).

   Ten sam kontrakt danych co droga przez AI (decyzja 10): nazwa, typy,
   porcje, składniki wyłącznie ze słownika. Różnica: bez kroków — tu nikt
   nic nie generuje, więc nie ma czego wymuszać, a krok "wymyśl przepis"
   to inny produkt niż "zapisz, co i tak gotujesz".
   ===================================================================== */

import { KUCHNIE } from "./kuchnie.js";
import { TYPY_POSILKOW } from "./prompt.js";

/**
 * @param dane           { nazwa, typy:[...], porcje, skladniki:[{produkt,gramy}] }
 * @param znaneProdukty  słownik — [{ n: "Nazwa", ... }]
 * @returns { ok:true, danie } albo { ok:false, bledy:string[] }
 */
export function walidujDanie(dane, znaneProdukty) {
  const bledy = [];

  const nazwa = String(dane?.nazwa ?? "").trim();
  if (!nazwa) bledy.push("Podaj nazwę dania.");

  const typy = Array.isArray(dane?.typy) ? dane.typy.filter(t => TYPY_POSILKOW.includes(t)) : [];
  if (!typy.length) bledy.push(`Wybierz przynajmniej jeden typ posiłku spośród: ${TYPY_POSILKOW.join(", ")}.`);

  const porcje = Number(dane?.porcje);
  if (!Number.isInteger(porcje) || porcje < 1 || porcje > 12) {
    bledy.push("Porcje muszą być liczbą całkowitą od 1 do 12.");
  }

  const znane = new Set(znaneProdukty.map(p => p.n));
  const wejscioweSkladniki = Array.isArray(dane?.skladniki) ? dane.skladniki : [];
  if (!wejscioweSkladniki.length) bledy.push("Dodaj przynajmniej jeden składnik.");

  const skladniki = [];
  for (const s of wejscioweSkladniki) {
    const nazwaProduktu = String(s?.produkt ?? "").trim();
    if (!nazwaProduktu) { bledy.push("Jeden ze składników nie ma wybranego produktu."); continue; }
    if (!znane.has(nazwaProduktu)) {
      bledy.push(`„${nazwaProduktu}” nie jest w słowniku produktów — wybierz z podpowiedzi.`);
      continue;
    }
    const gramy = Number(s?.gramy);
    if (!Number.isFinite(gramy) || gramy <= 0) {
      bledy.push(`Podaj poprawną gramaturę dla „${nazwaProduktu}”.`);
      continue;
    }
    skladniki.push({ produkt: nazwaProduktu, gramy });
  }

  if (bledy.length) return { ok: false, bledy };
  /* Kuchnia: nieznana albo spoza słownika → "uni". Nigdy "pl" — brak decyzji
     nie może zamieniać się w twierdzenie o pochodzeniu dania (decyzja 68). */
  const kuchnia = KUCHNIE[dane?.kuchnia] ? dane.kuchnia : "uni";

  return { ok: true, danie: { nazwa, typy, porcje, kuchnia, skladniki, kroki: [] } };
}
