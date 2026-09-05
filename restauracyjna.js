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

/* 1 g płatków chili na ⅓ osoby to 0,3 g, nie „0 g” (zrzut Miłosza, 5 września).
   Poniżej 10 g jedno miejsce po przecinku, wyżej pełne gramy. */
export function gramyPoPrzeliczeniu(g) {
  return g < 10 ? Math.round(g * 10) / 10 : Math.round(g);
}

export function daneRestauracyjne() {
  let fb = null, kodDomu = null;

  return {
    restauracyjne: {},   // id → { skladniki, kroki, uwaga, kiedy } — pełny skład (112)
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

    /* Wpisy sprzed decyzji 112 (z `akcenty` zamiast `skladniki`) nie liczą się —
       przycisk wraca i nadpisuje je pełnym składem. Dwa takie leżą w bazie Miłosza. */
    maWersje(p) { return Array.isArray(this.restauracyjne[p.id]?.skladniki); },

    krokiDoPokazania(p) {
      return this.widok[p.id] === "restauracyjna" && this.maWersje(p)
        ? this.restauracyjne[p.id].kroki : p.kroki;
    },

    /* Skład do pokazania: restauracyjny, gdy taki widok; podstawowy inaczej.
       Mnożnik porcji, bo arkusz w jadłospisie pokazuje gramaturę na tylu ludzi,
       ilu realnie je. */
    skladDoPokazania(p, wsp = 1) {
      const zrodlo = this.widok[p.id] === "restauracyjna" && this.restauracyjne[p.id]?.skladniki
        ? this.restauracyjne[p.id].skladniki : p.skladniki;
      return wsp === 1 ? zrodlo : zrodlo.map(s => ({ ...s, gramy: gramyPoPrzeliczeniu(s.gramy * wsp) }));
    },

    /* Różnica względem podstawy (decyzja 102 po 112): „+ Kozi ser 60 g, Ziemniaki 350 → 250 g,
       − Śmietana”. Liczona, nie zapisana — obie listy i tak leżą w bazie. */
    roznicaSkladu(p, wsp = 1) {
      const r = this.restauracyjne[p.id]?.skladniki || [];
      const g = (x) => gramyPoPrzeliczeniu(x * wsp);
      const baza = new Map(p.skladniki.map(s => [s.produkt, s.gramy]));
      const rest = new Map(r.map(s => [s.produkt, s.gramy]));
      const out = [];
      for (const [n, ile] of rest) {
        if (!baza.has(n)) out.push(`+ ${n} ${g(ile)} g`);
        else if (baza.get(n) !== ile) out.push(`${n} ${g(baza.get(n))} → ${g(ile)} g`);
      }
      for (const [n] of baza) if (!rest.has(n)) out.push(`− ${n}`);
      return out.join(", ") || "ten sam skład — różnica jest w technice";
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
        const wpis = { skladniki: wynik.skladniki, kroki: wynik.kroki, uwaga: wynik.uwaga || "", kiedy: Date.now() };
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
