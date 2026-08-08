/* =====================================================================
   SPIŻARNIA — co już macie w domu.

   Odziedziczona z Dietki, gdzie działała tak: stan zapasów odejmuje się od tego,
   co trzeba kupić. Produkt pokryty w całości dostaje znacznik „mamy” i nie liczy
   się do „do kupienia”. Po ugotowaniu okresu jeden przycisk odlicza zużycie.

   PO CO TO JEST: mąkę kupuje się w kilogramie, a na naleśniki idzie 250 g.
   Bez spiżarni lista każe kupować kilogram mąki co tydzień, człowiek to widzi,
   przestaje ufać liczbom i zaczyna kupować „na oko” — czyli traci dokładnie to,
   po co ta lista powstała.

   CZEGO TO NIE ROBI, ŚWIADOMIE:
   — nie zgaduje, co macie w domu. Dietka mogła zakładać zapasy dwóch osób;
     tutaj każda pozycja jest wpisana ręcznie przez człowieka
   — nie pilnuje dat ważności. To osobny produkt i osobny rodzaj zawracania głowy
   — nie odejmuje automatycznie po upływie okresu. Odliczenie jest świadomym
     kliknięciem, bo apka nie wie, czy naprawdę ugotowaliście to, co zaplanowane

   Jednostka: gramy, tak jak wszędzie indziej w tej aplikacji.
   ===================================================================== */

/** Ten sam klucz co przy odhaczeniach — Firebase nie przyjmuje . # $ [ ] / */
export const kluczProduktu = nazwa => nazwa.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * Nakłada stan spiżarni na pozycje listy zakupów.
 *
 * @param {Array} pozycje – [{ produkt, gramy, ... }]
 * @param {Object} stan – { klucz: gramy }
 * @returns {Array} te same pozycje z polami: masz, doKupienia, wDomu
 */
export function nalozSpizarnie(pozycje, stan = {}) {
  return pozycje.map(p => {
    const masz = Math.max(0, Math.round(stan[kluczProduktu(p.produkt)] || 0));
    const doKupienia = Math.max(0, p.gramy - masz);
    return {
      ...p,
      masz,
      doKupienia,
      /* „Mamy” znaczy: starczy na cały okres. Przy równej ilości też — bo jeśli
         przepis mówi 250 g i tyle jest w domu, to nie ma po co iść do sklepu. */
      wDomu: masz >= p.gramy && p.gramy > 0,
    };
  });
}

/**
 * Ile zostanie w spiżarni po ugotowaniu całego okresu.
 * Zwraca obiekt zmian gotowy do zapisu: liczba albo null (= usuń wpis).
 */
export function poZuzyciu(stan = {}, pozycje = []) {
  const zmiany = {};
  for (const p of pozycje) {
    const k = kluczProduktu(p.produkt);
    const bylo = Math.round(stan[k] || 0);
    if (!bylo) continue;                       // czego nie mieliśmy, tego nie odliczamy
    const zostaje = Math.max(0, bylo - p.gramy);
    zmiany[k] = zostaje > 0 ? zostaje : null;  // null kasuje wpis z bazy
  }
  return zmiany;
}

/**
 * Na ile okresów starczy danego produktu przy obecnym zużyciu.
 * Zwraca null, gdy produkt nie jest w tym okresie używany — wtedy nie ma
 * czym dzielić i każda liczba byłaby zmyślona.
 */
export function starczyNa(masz, zuzycieNaOkres) {
  if (!zuzycieNaOkres || zuzycieNaOkres <= 0) return null;
  return masz / zuzycieNaOkres;
}

/** Opis dla człowieka. „Starczy na 3 okresy” jest bezużyteczne bez zaokrąglenia. */
export function opisZapasu(masz, zuzycieNaOkres) {
  const ile = starczyNa(masz, zuzycieNaOkres);
  if (ile === null) return "nie ma tego w tym okresie";
  if (ile < 1) return "nie starczy na cały okres";
  if (ile < 2) return "starczy na ten okres";
  return `starczy na ${Math.floor(ile)} okresy`;
}
