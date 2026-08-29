/* =====================================================================
   POMOC — krótkie wyjaśnienia pod ikoną „i”.

   Po co osobny plik: te same rzeczy trzeba tłumaczyć na kilku ekranach, a tekst
   rozsypany po ośmiu plikach rozjeżdża się przy pierwszej poprawce. Tu jest jeden
   egzemplarz każdego wyjaśnienia.

   Zasada pisania: mówimy PO CO, nie CO. „Lista zakupów sumuje składniki” jest
   opisem tego, co widać. „Nie musisz nic przepisywać, bo liczby biorą się
   z przepisów” mówi, co z tego ma człowiek.

   Zasada długości: trzy akapity maksimum. Kto potrzebuje więcej, potrzebuje
   rozmowy, nie okienka.
   ===================================================================== */

import { bezSierot } from "./powloka.js";

export const POMOC = {

  dania: {
    tytul: "Po co zaznaczać dania",
    akapity: [
      "Wszystko w tej aplikacji buduje się z dań, które tu polubicie. Jadłospis losuje " +
      "tylko z nich, lista zakupów liczy tylko z nich. Nic nie pojawi się samo.",

      "Im więcej polubicie, tym mniej musicie potem robić. Przy dziesięciu daniach " +
      "tygodniowy plan wraca do tych samych potraw co drugi dzień i trzeba go poprawiać " +
      "ręcznie. Przy dwudziestu pięciu „Ułóż automatycznie” wystarcza — klikacie raz " +
      "i macie miesiąc bez powtórki.",

      "Nie pasuje Wam nic z tej listy? To też jest w porządku. Możecie zbudować własną " +
      "od zera — zakładka Dodaj przyjmuje zdjęcie przepisu z książki albo samą nazwę " +
      "dania. Aplikacja będzie wtedy losować wyłącznie z Waszych.",
    ],
  },

  jadlospis: {
    tytul: "Jak działa jadłospis",
    akapity: [
      "„Ułóż automatycznie” wypełnia cały okres daniami, które polubiliście, pilnując " +
      "przy tym, żeby to samo nie wracało zbyt często. Każdy posiłek możecie potem " +
      "podmienić ręcznie.",

      "Dotknięcie dania pokazuje przepis z gramaturą przeliczoną na tylu ludzi, ilu " +
      "realnie je ten posiłek — nie na liczbę z książki kucharskiej.",

      "Są też trzy pozycje, których nie ma w żadnym przepisie, a są w życiu: " +
      "„na mieście”, „co się nawinie” i „coś z paczki”. Żadna nie wchodzi do listy zakupów.",
    ],
  },

  zakupy: {
    tytul: "Skąd bierze się ta lista",
    akapity: [
      "Lista liczy się sama z jadłospisu: sumuje składniki wszystkich dań w okresie, " +
      "przelicza je na tylu ludzi, ilu siada do stołu, i grupuje po działach sklepu.",

      "Działa bez internetu. Możecie odhaczać w markecie, gdzie nie ma zasięgu — " +
      "a to, co odhaczycie, zobaczy druga osoba przy tym samym stole.",

      "Spiżarnia odejmuje od listy to, co już macie w domu. Mąkę kupuje się w kilogramie, " +
      "a na naleśniki idzie 250 g — bez spiżarni lista kazałaby kupować kilogram co tydzień.",
    ],
  },

  dodawanie: {
    tytul: "Trzy sposoby na własne dania",
    akapity: [
      "Zdjęcie: strona z książki kucharskiej, kartka z zeszytu babci, zrzut ekranu " +
      "z Instagrama. Możecie też sfotografować sam talerz z jedzeniem — AI rozpozna, " +
      "co na nim jest, i napisze przepis od zera.",

      "Przepis z internetu: otwórzcie stronę w przeglądarce i zróbcie zrzut ekranu — " +
      "wtedy AI czyta to, co naprawdę tam napisano, zamiast zgadywać z adresu.",

      "Nazwa: wpisujecie „gołąbki” i tyle. Przepis powstaje z niczego. " +
      "Zanim cokolwiek się zapisze, zobaczycie, co wyszło, i decydujecie sami.",
    ],
  },

  przepisy: {
    tytul: "Skąd tu się biorą przepisy",
    akapity: [
      "To wszystko, co polubiliście w zakładce Dania — z krokami i gramaturą.",

      "Dania dodane ręcznie mogą nie mieć kroków, bo nikt ich nie wpisał. " +
      "Można je uzupełnić przez AI w dowolnym momencie.",
    ],
  },

  spizarnia: {
    tytul: "Po co spiżarnia",
    akapity: [
      "Wpisujecie, ile czego macie w domu. Lista zakupów odejmuje to od potrzeb, " +
      "a produkty, których macie dość, dostają znaczek „mamy” i nie liczą się " +
      "do tego, co trzeba kupić.",

      "Wpiszcie tylko to, czego macie więcej niż na jeden raz — mąkę, ryż, olej, " +
      "makaron. Nie ma sensu prowadzić tu spisu wszystkiego.",

      "Po ugotowaniu okresu jeden przycisk odlicza zużycie. Nie robimy tego " +
      "automatycznie, bo aplikacja nie wie, czy naprawdę ugotowaliście to, co zaplanowane.",
    ],
  },
};

/* Teksty pomocy przepuszczone przez bezSierot raz, przy wczytaniu modułu —
   zamiast owijać każde `x-text` w pomoc.html. Okienko pomocy jest
   wstrzykiwane do pięciu ekranów, więc jedno miejsce obsługuje wszystkie. */
for (const wpis of Object.values(POMOC)) {
  wpis.tytul = bezSierot(wpis.tytul);
  wpis.akapity = wpis.akapity.map(bezSierot);
}
