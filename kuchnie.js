/* =====================================================================
   KUCHNIA DANIA — druga oś obok czasu.

   Czas mówi „zdążę?”. Kuchnia mówi „na co mam ochotę?”. To dwa różne pytania
   i dlatego mogą stać obok siebie — w przeciwieństwie do starych kubełków,
   które próbowały odpowiadać na oba naraz jedną etykietą i przez to nie
   odpowiadały na żadne.

   FLAGA, NIE SŁOWO: zajmuje jeden znak zamiast dziesięciu, nie konkuruje
   z odznaką czasu i rozpoznaje się ją bez czytania. Ale flaga sama w sobie
   jest nieczytelna dla czytnika ekranu i dla kogoś, kto jej nie zna — dlatego
   każda ma podpis w `aria-label` i w `title`.

   ROZPOZNAWANIE PO NAZWIE, nie ręczne przypisanie do stu jeden dań: nowe dania
   od AI i te dodane przez użytkownika też mają dostać flagę, a nikt nie będzie
   im jej wpisywał. Reguła musi działać na czymś, co danie już ma.

   DOMYŚLNIE POLSKA — i to jest decyzja, nie lenistwo. Aplikacja powstaje dla
   polskich domów, więc „zupa pomidorowa” bez żadnego znaku szczególnego jest
   polska. Fałszywe przypisanie do obcej kuchni jest gorsze niż jego brak.
   ===================================================================== */

export const KUCHNIE = {
  pl: { flaga: "🇵🇱", nazwa: "polska" },
  it: { flaga: "🇮🇹", nazwa: "włoska" },
  jp: { flaga: "🇯🇵", nazwa: "japońska" },
  kr: { flaga: "🇰🇷", nazwa: "koreańska" },
  cn: { flaga: "🇨🇳", nazwa: "chińska" },
  th: { flaga: "🇹🇭", nazwa: "tajska" },
  in: { flaga: "🇮🇳", nazwa: "indyjska" },
  mx: { flaga: "🇲🇽", nazwa: "meksykańska" },
  es: { flaga: "🇪🇸", nazwa: "hiszpańska" },
  gr: { flaga: "🇬🇷", nazwa: "grecka" },
  fr: { flaga: "🇫🇷", nazwa: "francuska" },
  ge: { flaga: "🇬🇪", nazwa: "gruzińska" },
  pe: { flaga: "🇵🇪", nazwa: "peruwiańska" },
  il: { flaga: "🇮🇱", nazwa: "bliskowschodnia" },
};

/* Kolejność ma znaczenie: pierwsza pasująca reguła wygrywa. Bardziej
   szczegółowe idą wyżej, żeby „katsu curry” trafiło do Japonii, a nie do Indii
   przez samo słowo „curry”. */
const REGULY = [
  // --- Azja Wschodnia ---
  [/\bramen\b|\bmiso\b|\bkatsu\b|\bsushi\b|wodorost/i, "jp"],
  [/bibimbap|\bkimchi\b|gochujang/i, "kr"],
  [/pad thai|\btom yum\b/i, "th"],
  [/stir[- ]?fry|sos(ie)? sojow|słodko-kwaśn|ryż smażony/i, "cn"],
  [/\bdal\b|\btikka\b|masala|\bcurry\b|garam/i, "in"],

  // --- Ameryki ---
  [/tacos?|burrito|quesadilla|chili con carne|guacamole|nachos/i, "mx"],
  [/ceviche/i, "pe"],

  // --- Europa Południowa i Bliski Wschód ---
  [/tortilla española|paella|gazpacho/i, "es"],
  [/moussaka|tzatziki|gyros|\bfeta\b|sałatka grecka/i, "gr"],
  [/hummus|falafel|tahini|szakszuka|shakshuka|baba ganoush/i, "il"],
  [/ratatouille|\bquiche\b|croissant|tost francuski/i, "fr"],
  [/chakapuli|chaczapuri|gruzińsk/i, "ge"],
  [/\bpasta\b|\bpesto\b|caprese|risotto|lasagne|carbonara|ricott[aą]|\bbruschett/i, "it"],

  /* Makaron sam w sobie nie jest włoski — makaron z pomidorami i bazylią już tak.
     Reguła celuje w połączenie, nie w słowo, żeby „zapiekanka makaronowa z serem”
     została polska. */
  [/makaron z (pomidor|cukini|krewetk)|krewetki .* makaron/i, "it"],
];

/**
 * @param {object} danie – potrzebuje tylko `nazwa`
 * @returns {{kod: string, flaga: string, nazwa: string}}
 */
export function kuchniaDania(danie) {
  const nazwa = danie?.nazwa || "";
  for (const [wzorzec, kod] of REGULY) {
    if (wzorzec.test(nazwa)) return { kod, ...KUCHNIE[kod] };
  }
  return { kod: "pl", ...KUCHNIE.pl };
}

/** Ile dań z każdej kuchni — do sprawdzenia, czy reguły nie przesadzają. */
export function rozkladKuchni(talia) {
  const licznik = {};
  for (const d of talia) {
    const k = kuchniaDania(d).kod;
    licznik[k] = (licznik[k] || 0) + 1;
  }
  return licznik;
}
