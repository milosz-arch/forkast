/* =====================================================================
   AUTOMAT — wypełnia puste miejsca w siatce okresu losowo wybranymi
   daniami spośród polubionych (decyzja 8: zimny start bez AI).

   Limit powtórzeń jest ustawieniem, nie sztywną regułą (decyzja 11) —
   Dietka sama łamała "nie powtarza się w okresie" przy lunchach z niedzieli,
   więc tutaj to jest parametr, domyślnie brak limitu. Miejsca już
   przypisane ręcznie (danie wybrane przez użytkownika, albo oznaczone
   "na mieście/resztki") automat omija — nie nadpisuje cudzych decyzji.
   ===================================================================== */

import { przypiszDanie } from "./rytm.js";

/**
 * @param siatka          z rytm.js — [{data, posilki:{typ:{kto,danie,bezSkladnikow}}}]
 * @param daniaDostepne   dania do wyboru — w praktyce tylko polubione z talii
 *                        (i własne dodane), każde z {id, typy:[...]}
 * @param limitPowtorzen  liczba całkowita = ile razy dane danie może wejść
 *                        do okresu, albo null = bez limitu
 * @param losuj           wstrzykiwalny RNG (domyślnie Math.random) — testowalność
 * @returns { siatka: nowaSiatka, bledy: string[] }
 *          bledy — miejsca, których nie dało się wypełnić (za mało dań danego typu)
 */
export function ulozPlan(siatka, daniaDostepne, limitPowtorzen = null, losuj = Math.random) {
  if (limitPowtorzen != null && (!Number.isInteger(limitPowtorzen) || limitPowtorzen < 1)) {
    throw new Error("Limit powtórzeń musi być liczbą całkowitą co najmniej 1, albo null.");
  }

  const uzycia = new Map();
  const bledy = [];
  let nowaSiatka = siatka;

  for (const dzien of siatka) {
    for (const typ in dzien.posilki) {
      const wpis = dzien.posilki[typ];
      if (wpis.danie || wpis.bezSkladnikow) continue; // ktoś to już ustalił — nie ruszamy

      const kandydaci = daniaDostepne.filter(d =>
        d.typy.includes(typ) && (limitPowtorzen == null || (uzycia.get(d.id) || 0) < limitPowtorzen)
      );

      if (!kandydaci.length) {
        bledy.push(`Brak dania na "${typ}" w dniu ${dzien.data} — ` +
          (daniaDostepne.some(d => d.typy.includes(typ))
            ? "wszystkie pasujące dania wyczerpały limit powtórzeń."
            : "nic polubionego nie pasuje do tego typu posiłku."));
        continue;
      }

      const wybrane = kandydaci[Math.floor(losuj() * kandydaci.length)];
      nowaSiatka = przypiszDanie(nowaSiatka, dzien.data, typ, wybrane.id);
      uzycia.set(wybrane.id, (uzycia.get(wybrane.id) || 0) + 1);
    }
  }

  return { siatka: nowaSiatka, bledy };
}
