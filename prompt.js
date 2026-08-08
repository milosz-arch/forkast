// Budowanie promptu, który użytkownik kopiuje do swojego AI.
//
// Założenie, na którym stoi cały ten plik: użytkownik NIE czyta promptu.
// Kopiuje go, wkleja i wraca. Więc prompt ma być odporny na model, który
// czyta go pobieżnie — stąd powtórzenia i przykład na końcu.

import { KUCHNIE } from "./kuchnie.js";

export const TYPY_POSILKOW = ["śniadanie", "lunch", "obiad", "przekąska", "kolacja"];

export const WYKLUCZENIA = [
  ["mieso",   "mięso"],
  ["ryby",    "ryby i owoce morza"],
  ["nabial",  "nabiał"],
  ["jajka",   "jajka"],
  ["gluten",  "gluten"],
  ["orzechy", "orzechy"],
];

// slownik: [{ n: "Łosoś wędzony na zimno", dzial: "Mięso i ryby" }, ...]
// dania:            ["Pierogi ruskie", "Schabowy"] — nazwy, o które prosi użytkownik
// wykl:             ["mieso", "gluten"]
// liczbaDomownikow: ile osób jest w tym konkretnym domu — jeśli apka to wie, podaje to
//                    jako realny fakt o tym użytkowniku, a nie jako domyślne założenie.
//                    Nieznana (null) → w prompcie nie ma żadnej sugerowanej liczby.
export function zbudujPrompt(dania, slownik, wykl = [], liczbaDomownikow = null, kuchnia = "") {
  const lista = dania.filter(Boolean).map(d => `- ${d.trim()}`).join("\n");
  return `Jesteś pomocnikiem aplikacji do planowania posiłków. Odpowiedz WYŁĄCZNIE obiektem JSON, bez żadnego tekstu przed ani po.

Opisz te dania:
${lista}
${resztaPromptu(slownik, wykl, liczbaDomownikow)}${kuchnia}`;
}

// url: link do przepisu, który użytkownik chce dodać. Prompt prosi model, żeby go
// otworzył — działa tylko z AI, które potrafi przeglądać internet (nie każde darmowe
// AI to potrafi; jeśli model odmówi, użytkownikowi zostaje droga przez nazwę dania).
export function zbudujPromptZLinku(url, slownik, wykl = [], liczbaDomownikow = null, kuchnia = "") {
  return `Jesteś pomocnikiem aplikacji do planowania posiłków. Odpowiedz WYŁĄCZNIE obiektem JSON, bez żadnego tekstu przed ani po.

Otwórz ten przepis i opisz danie, które tam jest — trzymaj się dokładnie tego, co napisano
w źródle (te same składniki, te same proporcje, te same kroki), nie wymyślaj wersji własnej:
${url}
${resztaPromptu(slownik, wykl, liczbaDomownikow)}${kuchnia}`;
}

// Bez URL i bez nazwy — ten wariant zakłada, że użytkownik ZARAZ PO SKOPIOWANIU
// tego tekstu sam dołączy do rozmowy z AI swoje zdjęcia (do 10), tak jak dołącza
// się zdjęcie w każdym czacie. Apka nigdy nie widzi i nie przechowuje tych zdjęć.
export function zbudujPromptZeZdjec(slownik, wykl = [], liczbaDomownikow = null, kuchnia = "") {
  return `Jesteś pomocnikiem aplikacji do planowania posiłków. Odpowiedz WYŁĄCZNIE obiektem JSON, bez żadnego tekstu przed ani po.

Zaraz dołączę zdjęcia. Mogą być dwojakie i najpierw rozpoznaj, z którym masz do czynienia.

PRZYPADEK A — zdjęcie PRZEPISU (strona z książki, kartka z zeszytu, zrzut ekranu).
Przeczytaj z niego danie i trzymaj się DOKŁADNIE tego, co tam napisano: te same
składniki, te same proporcje, te same kroki. Nie wymyślaj wersji własnej.
Jeśli fragment jest nieczytelny, zostaw to pole puste i napisz o tym w "uwaga"
zamiast zgadywać.

PRZYPADEK B — zdjęcie GOTOWEGO DANIA na talerzu.
Rozpoznaj, co to jest, i napisz przepis od zera. Tu wolno Ci uzupełniać: nie widzisz
gramatury ani kroków, więc podaj typowe proporcje dla tego dania. Ale w polu "uwaga"
napisz wprost, że przepis powstał z rozpoznania zdjęcia, nie z przepisu — żeby człowiek
wiedział, że to Twoja wersja, a nie odczyt. Jeśli nie masz pewności, co jest na talerzu,
powiedz to zamiast zgadywać nazwę.
${resztaPromptu(slownik, wykl, liczbaDomownikow)}${kuchnia}`;
}

// Część wspólna wszystkich trzech wariantów — zasady składników, lista produktów,
// format odpowiedzi, wymagania. Jedno miejsce, więc zmiana reguł nie rozjeżdża się
// między wariantami.
function resztaPromptu(slownik, wykl, liczbaDomownikow) {
  // Produkty grupujemy działami — model trafia wtedy celniej niż w płaskiej liście.
  const dzialy = {};
  for (const p of slownik) (dzialy[p.dzial] ||= []).push(p.n);
  const produkty = Object.entries(dzialy)
    .map(([d, ns]) => `${d}: ${ns.join(", ")}`)
    .join("\n");

  const nazwyWykl = wykl
    .map(k => (WYKLUCZENIA.find(w => w[0] === k) || [])[1])
    .filter(Boolean);

  const blok = nazwyWykl.length
    ? `\nCZEGO NIE UŻYWAĆ: ${nazwyWykl.join(", ")}. Jeśli danie z listy bez tego nie istnieje, podaj wersję zastępczą i dopisz to w polu "uwaga".\n`
    : "";

  return `${blok}
ZASADY SKŁADNIKÓW
Używaj wyłącznie nazw produktów z listy poniżej, przepisanych DOKŁADNIE tak, jak tam stoją.
Jeśli danie wymaga produktu, którego na liście nie ma, dodaj go do tablicy "noweProdukty"
razem z wartościami odżywczymi na 100 g. Nie zgaduj wartości — jeśli ich nie znasz, nie
używaj tego produktu.

LISTA PRODUKTÓW
${produkty}

FORMAT ODPOWIEDZI
{
  "dania": [
    {
      "nazwa": "nazwa dania",
      "typy": ["lunch", "kolacja"],
      "porcje": 2,
      "kuchnia": "pl",
      "skladniki": [
        { "produkt": "Nazwa dokładnie z listy", "gramy": 150 }
      ],
      "kroki": ["Pierwszy krok.", "Drugi krok."]
    }
  ],
  "noweProdukty": [
    { "nazwa": "...", "kcal": 0, "bialko": 0, "wegle": 0, "tluszcz": 0, "dzial": "..." }
  ]
}

WYMAGANIA, KTÓRYCH NIE WOLNO POMINĄĆ
- "typy": tylko z tego zbioru: ${TYPY_POSILKOW.join(", ")}. Może być więcej niż jedno.
- "porcje": na ile osób jest podana gramatura. Liczba całkowita${liczbaDomownikow ? `, zwykle ${liczbaDomownikow} (tyle jest w tym domu), chyba że danie z natury wychodzi na inną liczbę` : ""}. To pole jest
  obowiązkowe — bez niego aplikacja nie policzy zakupów.
- "kuchnia": kod kuchni, z której danie POCHODZI. Dozwolone wyłącznie: ${Object.keys(KUCHNIE).join(", ")}.
  Jeśli danie nie należy do żadnej kuchni narodowej — owsianka, koktajl, kanapka,
  sałatka, batony owsiane — wpisz "uni" (uniwersalna). NIE ZGADUJ kraju po składnikach
  i nie wpisuj "pl" dlatego, że nie wiesz: owsianka z bananem nie jest daniem kuchni
  polskiej, a zgadnięty kraj trafia użytkownikowi na kartę jako fakt.
- "gramy": liczba w gramach, bez jednostki. Płyny licz jak gramy.
- "kroki": co najmniej SZEŚĆ kroków przy daniu gotowanym, cztery przy zimnym.
  Każdy zaczyna się od czasownika i wymienia z nazwy każdy składnik, którego dotyczy.
  Składnik, który pojawia się tylko w kroku „Zapakuj”, jest błędem — znaczy to,
  że nikt nie wie, kiedy go użyć.
- Przy obróbce cieplnej podaj temperaturę i czas, a przy mięsie temperaturę w środku.
  „Piecz do miękkości” jest bezużyteczne.
- WSZYSTKIE ilości w gramach albo mililitrach, także w krokach. Zakazane są:
  szklanka, łyżka, łyżeczka, garść, szczypta, odrobina, „do smaku”, „na oko”,
  „kilka”, „trochę”. Pisz „500 ml wody”, nie „pół litra”; „5 g soli”, nie „szczypta”;
  „30 g oliwy”, nie „dwie łyżki”.
  Powód nie jest kosmetyczny: z tych liczb apka liczy listę zakupów i przelicza
  porcje na inną liczbę osób. Ze „szklanki” nie da się policzyć nic.
- W co najmniej dwóch krokach napisz, PO CO się to robi albo PO CZYM poznać, że gotowe:
  „aż cebula zrobi się szklista, nie brązowa — brązowa zgorzknieje w sosie”,
  „odstaw ciasto na 15 minut, żeby mąka wchłonęła płyn, inaczej naleśniki będą się rwać”.
  To jest różnica między przepisem a instrukcją obsługi.
- Nie pomijaj czynności, które komuś gotującemu pierwszy raz nie są oczywiste:
  odciśnięcie wody, sparzenie, odstawienie, zdjęcie z ognia przed dodaniem nabiału,
  zachowanie wody z gotowania makaronu.
- Wartości odżywcze w "noweProdukty" na 100 g produktu surowego.

Zwróć sam JSON. Bez wstępu, bez komentarza, bez podsumowania.`;
}
