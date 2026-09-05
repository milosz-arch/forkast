/* =====================================================================
   WERSJA RESTAURACYJNA — wspólna logika dla ekranu Przepisów i arkusza
   przepisu w Jadłospisie (decyzje 101–109, 111).

   Jedna gałąź w bazie na stół: `domy/{kod}/restauracyjne/{id dania}` —
   działa tak samo dla dań startowych (plik statyczny) i własnych.
   Cykl: prompt z wersji podstawowej → sprawdzenie kształtu (109) → przy
   rozjeździe jedna runda poprawki → zapis albo „nie udało się”, a wtedy
   danie zostaje dokładnie takie, jakie było (103).

   Zwraca obiekt do rozłożenia w Alpine.data (jak danePowloki). Połączenie
   z bazą trzymamy w domknięciu, NIE na `this` — wywołanie Firebase przez
   warstwę reaktywną Alpine potrafi paść bez sensownego komunikatu (pułapka 25).
   ===================================================================== */

import { PRODUKTY } from "./produkty.js";
import { WYDANIE } from "./wersja.js";
import { zbudujPromptRestauracyjny, zbudujPoprawkeRestauracyjna } from "./prompt.js";
import { parsujWersjeRestauracyjna } from "./parser.js";

/* Ten sam klucz produktu co na ekranie dodawania — inaczej „Sól” z dwóch
   ekranów wylądowałaby w bazie dwa razy. */
export const slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* Jedno wywołanie funkcji brzegowej — tą samą drogą co dodawanie dania.
   Odpowiedź czytana najpierw jako tekst: przy przekroczeniu czasu Netlify odsyła HTML. */
export async function zapytajAI(prompt, kodDomu) {
  const odp = await fetch("/api/zapytaj-ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, kodDomu, obrazy: [] }),
  });
  const surowa = await odp.text();
  let json = null;
  try { json = JSON.parse(surowa); } catch { /* nie JSON */ }
  if (!json) throw new Error("AI nie zdążyło odpowiedzieć w wyznaczonym czasie.");
  if (!odp.ok) throw new Error(json.blad || "Coś poszło nie tak po stronie AI.");
  return json.tekst;
}

export function daneRestauracyjne() {
  let fb = null, kodDomu = null;

  return {
    restauracyjne: {},   // id → { kroki, akcenty, uwaga, kiedy }
    stanAI: {},          // id → "czekam" | "poprawka" | { blad }
    sekundy: {},         // id → licznik na ekranie
    widok: {},           // id → "podstawowa" | "restauracyjna"; niezapamiętywany (decyzja 111)
    slownik: [],

    /* Wołane z initEkranu PO polaczZBaza(). Czyta gałąź i słownik własnych produktów. */
    async wczytajRestauracyjne(polaczenie, kod) {
      fb = polaczenie; kodDomu = kod;
      const [snapRest, snapProd] = await Promise.all([
        fb.get(fb.ref(fb.db, `domy/${kodDomu}/restauracyjne`)),
        fb.get(fb.ref(fb.db, `domy/${kodDomu}/produktyWlasne`)),
      ]);
      this.restauracyjne = snapRest.val() || {};
      this.slownik = [...PRODUKTY, ...Object.values(snapProd.val() || {})];
    },

    maWersje(p) { return !!this.restauracyjne[p.id]; },

    krokiDoPokazania(p) {
      return this.widok[p.id] === "restauracyjna" && this.restauracyjne[p.id]
        ? this.restauracyjne[p.id].kroki : p.kroki;
    },

    /* Lista różnicy (decyzja 102) — z przelicznikiem porcji, bo arkusz w jadłospisie
       pokazuje gramaturę na tylu ludzi, ilu realnie je. Firebase kasuje puste tablice
       (pułapka 16), więc brak `akcenty` to „same techniki”, nie błąd. */
    roznicaZakupow(p, wsp = 1) {
      const a = this.restauracyjne[p.id]?.akcenty || [];
      return a.map(x => `${x.produkt} ${Math.round(x.gramy * wsp)} g`).join(", ") || "nic — same techniki";
    },

    ponow(p) { delete this.stanAI[p.id]; return this.ulepsz(p); },

    /* Każdy etap ma własną nazwę w komunikacie (pułapka 26); komunikat niesie wydanie. */
    async ulepsz(p) {
      if (!fb) { this.mrugnij?.("Brak internetu — AI nie odpowie."); return; }
      this.stanAI[p.id] = "czekam";
      this.sekundy[p.id] = 0;
      const tyk = setInterval(() => { this.sekundy[p.id] = (this.sekundy[p.id] || 0) + 1; }, 1000);
      const koniec = (blad) => {
        clearInterval(tyk);
        if (blad) this.stanAI[p.id] = { blad: `${blad} (${WYDANIE})` };
        else delete this.stanAI[p.id];
      };

      let etap = "pytanie AI";
      try {
        const prompt = zbudujPromptRestauracyjny(p, this.slownik);
        let tekst = await zapytajAI(prompt, kodDomu);
        etap = "czytanie odpowiedzi";
        let wynik = parsujWersjeRestauracyjna(tekst, p, this.slownik);

        if (!wynik.ok) {
          etap = "poprawka AI";
          this.stanAI[p.id] = "poprawka";
          tekst = await zapytajAI(zbudujPoprawkeRestauracyjna(prompt, tekst, wynik.bledy), kodDomu);
          etap = "czytanie poprawki";
          wynik = parsujWersjeRestauracyjna(tekst, p, this.slownik);
        }
        if (!wynik.ok) { koniec(`Nie udało się — AI dwa razy oddało przepis z rozjazdem: ${wynik.bledy[0]}`); return; }

        etap = "zapis nowych produktów";
        if (wynik.noweProdukty.length) {
          const zmiany = {};
          for (const np of wynik.noweProdukty) zmiany[slug(np.n)] = np;
          await fb.update(fb.ref(fb.db, `domy/${kodDomu}/produktyWlasne`), zmiany);
          this.slownik = [...this.slownik, ...wynik.noweProdukty];
        }

        etap = "zapis wersji";
        const wpis = { kroki: wynik.kroki, akcenty: wynik.akcenty, uwaga: wynik.uwaga || "", kiedy: Date.now() };
        await fb.set(fb.ref(fb.db, `domy/${kodDomu}/restauracyjne/${p.id}`), wpis);
        this.restauracyjne[p.id] = wpis;
        this.widok[p.id] = "restauracyjna";
        koniec(null);
        this.mrugnij?.("Wersja restauracyjna gotowa.");
      } catch (e) {
        koniec(`Nie udało się (${etap}): ${e.message}`);
      }
    },
  };
}
