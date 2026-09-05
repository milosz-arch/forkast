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
// Produkty grupujemy działami — model trafia wtedy celniej niż w płaskiej liście.
function listaProduktow(slownik) {
  const dzialy = {};
  for (const p of slownik) (dzialy[p.dzial] ||= []).push(p.n);
  return Object.entries(dzialy)
    .map(([d, ns]) => `${d}: ${ns.join(", ")}`)
    .join("\n");
}

function resztaPromptu(slownik, wykl, liczbaDomownikow) {
  const produkty = listaProduktow(slownik);

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

/* =====================================================================
   WERSJA RESTAURACYJNA (decyzje 101–109).

   To samo danie, te same gramatury fundamentu, ta sama liczba porcji; wolno dołożyć
   akcenty. Przepis ułożony od nowa według czasu. Cztery zasady zatwierdzone przez
   head chefa (108). Reguła kształtu z decyzji 109 — każda ilość w krokach spoza
   fundamentu ma pozycję w akcentach, sumy równe — jest tu zapisana słowami,
   a w parser.js sprawdzana liczbami. Prompt bez sprawdzenia to zaufanie; sprawdzenie
   bez promptu to loteria.

   Zmierzone 5 września: 7–8 s na telefonie, 2,4 tys. znaków odpowiedzi (107).
   ===================================================================== */

// danie: { nazwa, porcje, skladniki: [{produkt, gramy}], kroki: [] } — wersja podstawowa
export function zbudujPromptRestauracyjny(danie, slownik) {
  const skladniki = danie.skladniki.map(s => `${s.produkt} ${s.gramy} g`).join(", ");
  const kroki = danie.kroki.map((k, i) => `${i + 1}. ${k}`).join("\n");
  const ile = danie.skladniki.length;

  return `Jesteś szefem kuchni. Odpowiedz WYŁĄCZNIE obiektem JSON, bez żadnego tekstu przed ani po.

Dostajesz danie w wersji podstawowej — takiej, jaką ktoś gotuje w tygodniu na szybko. Napisz to samo danie w wersji restauracyjnej: tak, jak uczyłbyś kogoś, kto ma zrobić je naprawdę dobrze i ma na to czas.

DANIE W WERSJI PODSTAWOWEJ
${danie.nazwa}, na ${danie.porcje} ${danie.porcje === 1 ? "osobę" : "osoby"}.
Składniki: ${skladniki}.
Kroki:
${kroki}

CZEGO NIE WOLNO RUSZYĆ
To ma być to samo danie w tej samej ilości. ${ile} składników powyżej zostaje z DOKŁADNIE tymi gramaturami — nie zmieniasz ich, nie usuwasz, nie zastępujesz. Nie dokładasz drugiego węglowodanu ani drugiego białka. Nie zmieniasz liczby porcji.

CO WOLNO DOŁOŻYĆ
Akcenty: przyprawy, zioła, kwas, tłuszcz do smażenia, marynatę, dodatkowy krok w rodzaju moczenia cebuli w zimnej wodzie albo marynowania. Każdy dołożony składnik wypisz osobno w tablicy "akcenty" z gramaturą — użytkownik dokupi je ręcznie, więc musi wiedzieć co i ile. Bierz nazwy z listy produktów, przepisane DOKŁADNIE tak, jak tam stoją; czego na liście nie ma, dopisz do "noweProdukty" z wartościami odżywczymi na 100 g. Sól i pieprz też są akcentami — jeśli nie ma ich na liście, dopisujesz je do "noweProdukty" jak każdy inny produkt.

LICZBY MUSZĄ SIĘ ZGADZAĆ — to jest sprawdzane mechanicznie
Aplikacja przeczyta z kroków każdą ilość w gramach i mililitrach i porówna ją z tablicą "akcenty":
- Każda ilość w krokach, która nie jest jednym z ${ile} składników podstawowych, MUSI mieć pozycję w "akcenty". Woda nie jest produktem i nie liczy się.
- Suma ilości danego akcentu ze wszystkich kroków MUSI być równa jego gramaturze w "akcenty". Jeśli sól idzie w trzech miejscach po 2 g, 1 g i 1 g, w "akcenty" stoi Sól 4 g. Korekty z punktu kontrolnego smaku („za mało słone → 1 g soli”) też się liczą — kucharz musi mieć tę sól pod ręką.
- Ta sama liczba przy tym samym akcencie w dwóch krokach („posiekaj 5 g natki” → „posyp 5 g natki”) liczy się raz. Różne liczby się sumują (2 g soli do marynaty + 2 g do sosu + 1 g korekty = 5 g). Jeśli dodajesz coś dwa razy po tyle samo, napisz w akcentach podwojoną ilość albo rozbij ją w krokach na różne liczby.
- Akcent, który nie pojawia się z ilością w żadnym kroku, jest błędem.
Rozjazd w którymkolwiek punkcie oznacza, że odpowiedź wraca do poprawy.

NA CZYM POLEGA WERSJA RESTAURACYJNA
Nie na dopisaniu uwag do tych samych kroków. Ułóż przepis od nowa, według czasu:
- Zacznij od tego, co musi czekać (marynata, odpoczynek, moczenie) i wskaż, co robić w tym czasie — kroki, które biegną równolegle, zapisz jako równoległe: „masz 20 minut — w tym czasie…”.
- Przy każdym kroku z obróbką cieplną: moc palnika, czas, temperatura, i PO CZYM POZNAĆ, że gotowe — kolor, dźwięk, zapach, konsystencja. Przy mięsie temperatura w środku.
- Przy każdej decyzji, która nie jest oczywista, napisz DLACZEGO — co się stanie, jeśli zrobić inaczej.
- Kolejność wrzucania na patelnię i czas między składnikami są ważniejsze niż lista składników. Powiedz, kiedy patelnia ma być pusta, kiedy pełna, kiedy zdjęta z ognia.
- Kolejność jest zawsze: rozgrzana patelnia → tłuszcz → produkt. Do smażenia nazwij tłuszcz o wysokim punkcie dymienia (olej rzepakowy, masło klarowane); oliwa extra virgin idzie tylko na zimno albo do marynaty, bo na dużym ogniu się pali.
- Sól idzie w co najmniej dwóch momentach przepisu, nie raz na końcu — i przy każdym z nich napisz ile.
- Jeśli po smażeniu na patelni zostały przypieczone resztki, użyj ich: deglasuj podaną ilością płynu (woda, sok z cytryny, wino) i włącz to do sosu albo do warzyw. Ten krok wypisz z nazwy.
- W jednym miejscu przepisu każ spróbować i powiedz, CZEGO szukać i czym korygować, z liczbami: „za płasko → 2 g soku z cytryny; za mało słone → 1 g soli”. Liczby zostają, decyzja idzie do kucharza.
- Ostatni krok to składanie i podanie: temperatura, w jakiej to trafia na talerz.

WYMAGANIA, KTÓRYCH NIE WOLNO POMINĄĆ
- WSZYSTKIE ilości w gramach albo mililitrach, także w krokach. Zakazane: szklanka, łyżka, łyżeczka, garść, szczypta, odrobina, „do smaku”, „na oko”. Pisz „5 g soli”, nie „szczypta”; „30 g oliwy”, nie „dwie łyżki”.
- Każdy krok zaczyna się od czasownika i wymienia z nazwy każdy składnik, którego dotyczy.
- W krokach ODMIENIAJ nazwy jak w zwykłym zdaniu („10 g musztardy Dijon”, „150 g papryki”), nie „10 g Musztarda Dijon”. Nazwy dokładnie z listy obowiązują tylko w "akcenty" i "noweProdukty".
- Nie ma górnego limitu liczby kroków. Jest dolny: przepis krótszy niż wersja podstawowa nie jest wersją restauracyjną.

LISTA PRODUKTÓW
${listaProduktow(slownik)}

FORMAT ODPOWIEDZI
{
  "kroki": ["Pierwszy krok.", "Drugi krok."],
  "akcenty": [
    { "produkt": "Nazwa dokładnie z listy", "gramy": 10 }
  ],
  "noweProdukty": [
    { "nazwa": "...", "kcal": 0, "bialko": 0, "wegle": 0, "tluszcz": 0, "dzial": "..." }
  ],
  "uwaga": "jedno zdanie, jeśli coś w wersji podstawowej Twoim zdaniem jest błędem — albo puste"
}

Zwróć sam JSON. Bez wstępu, bez komentarza, bez podsumowania.`;
}

/* Pushback: model nie pamięta poprzedniego wywołania, więc drugie dostaje ten sam
   prompt, własną odpowiedź i listę rozjazdów w liczbach. Jedna runda — po drugiej
   nieudanej „nie udało się” i danie zostaje jak było (103). */
export function zbudujPoprawkeRestauracyjna(prompt, odpowiedz, bledy) {
  return `${prompt}

TWOJA POPRZEDNIA ODPOWIEDŹ
${odpowiedz}

CO SIĘ W NIEJ NIE ZGADZA — aplikacja sprawdziła liczby:
${bledy.map(b => `- ${b}`).join("\n")}

Popraw dokładnie te punkty. Reszty nie zmieniaj bez potrzeby. Zwróć cały poprawiony JSON, sam, bez komentarza.`;
}
