/* =====================================================================
   WYKLUCZENIA — filtrowanie talii przed pokazaniem jej użytkownikowi
   (decyzja 13). Kategorie takie same, jak w WYKLUCZENIA z prompt.js,
   żeby pytanie na wejściu i prompt dla AI mówiły jednym językiem.

   Tagi produktów to fakty o składzie (co zawiera gluten, co jest orzechem),
   nie żaden rytm ani preferencja — dlatego mogą tu stać na sztywno, w
   przeciwieństwie do SLOTY/DNI_TYG z Dietki. Kilka miejsc, gdzie fakt nie
   jest oczywisty, ma komentarz z uzasadnieniem, żeby nie trzeba było
   zgadywać, dlaczego akurat tak.
   ===================================================================== */

/* Lista kategorii pokazywana użytkownikowi. Do 3 sierpnia była wpisana wprost
   w HTML ekranu Dań — przy migracji trafiła tutaj, żeby nie istniała w dwóch
   kopiach, które można niezależnie zmienić.

   "soja" nie jest tu pokazywana świadomie: tagujemy nią produkty (tofu, miso,
   gochujang), ale wykluczenie soi jest na tyle rzadkie, że szósty checkbox
   kosztowałby więcej uwagi wszystkich, niż daje tej garstce. Do rozważenia,
   gdy ktoś o to poprosi. */
export const WYKLUCZENIA = [
  { id: "mieso",   etykieta: "Mięso" },
  { id: "ryby",    etykieta: "Ryby i owoce morza" },
  { id: "nabial",  etykieta: "Nabiał" },
  { id: "jajka",   etykieta: "Jajka" },
  { id: "gluten",  etykieta: "Gluten" },
  { id: "orzechy", etykieta: "Orzechy" },
];

export const TAGI_PRODUKTOW = {
  // Mięso i ryby
  "Łosoś wędzony na zimno": ["ryby"], "Łosoś świeży — filet": ["ryby"],
  "Makrela wędzona": ["ryby"], "Tuńczyk z puszki": ["ryby"], "Krewetki": ["ryby"],
  "Pierś z kurczaka": ["mieso"], "Pierś z indyka": ["mieso"],
  "Rostbef wołowy": ["mieso"], "Wołowina mielona 5%": ["mieso"],

  // Nabiał
  "Jajka": ["jajka"], "Białko jaja": ["jajka"],
  "Twaróg półtłusty": ["nabial"], "Skyr / jogurt białkowy": ["nabial"],
  "Jogurt grecki": ["nabial"], "Feta": ["nabial"], "Ser żółty": ["nabial"],
  "Mleko 2%": ["nabial"], "Masło": ["nabial"], "Parmezan": ["nabial"], "Mozzarella": ["nabial"],
  "Kawa z mlekiem": ["nabial"],

  // Gluten — pszenica i żyto mają gluten, kasza gryczana i ryż mimo nazwy nie mają
  "Chleb żytni razowy": ["gluten"], "Makaron": ["gluten"], "Mąka pszenna": ["gluten"],
  "Tortilla pszenna": ["gluten"],
  "Granola": ["gluten"],           // typowo zawiera płatki z dodatkiem pszenicy/słodu
  "Sos sojowy": ["gluten"],        // klasyczny sos sojowy jest warzony z pszenicą
  "Piwo": ["gluten"],              // warzone ze słodu jęczmiennego

  // Orzechy — sezam i słonecznik to nasiona, nie orzechy, więc zostają bez tagu
  "Orzechy włoskie": ["orzechy"], "Nerkowce": ["orzechy"], "Masło orzechowe 100%": ["orzechy"],

  // Pesto klasycznie zawiera parmezan
  "Pesto": ["nabial"],

  /* Dopisane 3 sierpnia razem z polską klasyką. Bez tego wegetarianin dostawał
     w talii schabowego, żurek i bigos — tagi były pisane pod stary słownik
     i nie urosły razem z nim. Regresję pilnuje test w test-wykluczenia.mjs,
     który sprawdza CAŁĄ talię, nie pojedyncze produkty. */
  "Schab wieprzowy": ["mieso"],
  "Wieprzowina mielona": ["mieso"],
  "Kurczak — porcja rosołowa": ["mieso"],
  "Kiełbasa wiejska": ["mieso"],
  "Biała kiełbasa": ["mieso"],
  "Boczek wędzony": ["mieso"],

  "Tofu naturalne": ["soja"],
  "Ricotta": ["nabial"],

  // Bułka tarta i tortilla — pszenica
  "Bułka tarta": ["gluten"],
  "Zakwas na żurek": ["gluten"],   // tradycyjnie z mąki żytniej

  "Śmietana 18%": ["nabial"],
  "Majonez": ["jajka"],

  /* Kuchnie świata, 3 sierpnia. Test regresji na całej talii wychwyciłby brak
     tych tagów natychmiast — po to powstał przy poprzednim rozszerzeniu. */
  "Jagnięcina": ["mieso"],
  "Dorsz — filet": ["ryby"],
  "Sos rybny": ["ryby"],
  "Wakame": [],                    // wodorost, nie ryba
  "Nori": [],
  "Miso jasne": ["soja"],
  "Gochujang": ["soja"],
  "Masło klarowane": ["nabial"],
  "Panko": ["gluten"],
  "Makaron ramen": ["gluten"],
  "Makaron ryżowy": [],            // z ryżu, bez glutenu
  "Orzeszki ziemne": ["orzechy"],  // formalnie strączek, ale alergicznie traktowany jak orzech
};

/**
 * @param danie      { skladniki: [{produkt, gramy}], ... }
 * @param wykluczone lista kategorii z WYKLUCZENIA w prompt.js, np. ["mieso","gluten"]
 * @returns true, jeśli danie NIE zawiera żadnego składnika z wykluczonych kategorii
 */
export function daniePasuje(danie, wykluczone = []) {
  if (!wykluczone.length) return true;
  return danie.skladniki.every(sk => {
    const tagi = TAGI_PRODUKTOW[sk.produkt] || [];
    return !tagi.some(t => wykluczone.includes(t));
  });
}

export function filtrujTalie(talia, wykluczone = []) {
  return talia.filter(d => daniePasuje(d, wykluczone));
}
