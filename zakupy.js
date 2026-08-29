/* =====================================================================
   ZAKUPY — z ułożonego jadłospisu robi listę tego, co trzeba kupić.

   To jest ta połowa pierwszej pętli, która czyni apkę użyteczną: plan i zakupy
   są jedną rzeczą, nie dwiema (PODSTAWY.md, „czym to nie jest”).

   Najważniejsza rzecz dzieje się w przeliczaniu porcji. Każde danie ma pole
   `porcje` — na ile osób jest podana jego gramatura (decyzja 10). Ile porcji
   naprawdę potrzeba, wynika z tego, ilu domowników je ten posiłek tego dnia.
   Te dwie liczby prawie nigdy nie są równe, więc gramatura musi być skalowana:
   danie na 4 porcje jedzone przez 2 osoby to połowa składników.

   W Dietce tego problemu nie było, bo wszystkie przepisy pisano pod dwie znane
   osoby i gramatura zgadzała się z definicji. Tutaj zgadzać się nie może.
   ===================================================================== */

/**
 * @param siatka  z rytm.js — [{data, posilki:{typ:{kto,danie,bezSkladnikow}}}]
 * @param dania   wszystkie znane dania (talia + własne), każde z {id, porcje, skladniki}
 * @returns { pozycje, pominiete }
 *   pozycje   — [{ produkt, gramy, wDaniach:[nazwy] }] posortowane wg nazwy
 *   pominiete — opis miejsc, których nie dało się policzyć (brakujące danie, zły przepis)
 */
export function policzZakupy(siatka, dania) {
  const wgProduktu = new Map();
  const pominiete = [];

  for (const dzien of siatka) {
    for (const typ in dzien.posilki) {
      const wpis = dzien.posilki[typ];

      // Pozycje typu „na mieście” celowo nie generują składników (decyzja 12).
      if (wpis.bezSkladnikow) continue;
      if (!wpis.danie) continue;

      const danie = dania.find(d => d.id === wpis.danie);
      if (!danie) {
        pominiete.push(`${dzien.data}, ${typ}: danie zniknęło z bazy — nie wliczam go do zakupów.`);
        continue;
      }

      const potrzeba = wpis.kto?.length ?? 0;
      if (!potrzeba) {
        pominiete.push(`${dzien.data}, ${typ}: nikt tego nie je, więc nie kupujemy składników.`);
        continue;
      }

      const naIlu = Number(danie.porcje);
      if (!Number.isFinite(naIlu) || naIlu < 1) {
        pominiete.push(`„${danie.nazwa}”: nie wiadomo, na ile osób jest ta gramatura — pomijam.`);
        continue;
      }

      const mnoznik = potrzeba / naIlu;

      for (const sk of danie.skladniki || []) {
        const gramy = Number(sk.gramy) * mnoznik;
        if (!Number.isFinite(gramy) || gramy <= 0) continue;

        const dotychczas = wgProduktu.get(sk.produkt) || { produkt: sk.produkt, gramy: 0, wDaniach: new Set() };
        dotychczas.gramy += gramy;
        dotychczas.wDaniach.add(danie.nazwa);
        wgProduktu.set(sk.produkt, dotychczas);
      }
    }
  }

  const pozycje = [...wgProduktu.values()]
    .map(p => ({
      produkt: p.produkt,
      // Zaokrąglamy dopiero na końcu, po zsumowaniu wszystkiego — zaokrąglanie
      // każdego składnika osobno potrafi narobić kilkudziesięciu gramów różnicy.
      gramy: Math.round(p.gramy),
      wDaniach: [...p.wDaniach].sort((a, b) => a.localeCompare(b, "pl")),
    }))
    .filter(p => p.gramy > 0)
    .sort((a, b) => a.produkt.localeCompare(b.produkt, "pl"));

  return { pozycje, pominiete };
}

/**
 * Grupuje pozycje działami sklepu, żeby nie biegać po sklepie tam i z powrotem.
 * @param slownik [{ n, dzial }]
 * @returns [{ dzial, pozycje }] — działy w kolejności pierwszego wystąpienia w słowniku
 */
export function pogrupujDzialami(pozycje, slownik) {
  const dzialProduktu = new Map(slownik.map(p => [p.n, p.dzial || "Inne"]));
  const kolejnosc = [];
  const grupy = new Map();

  for (const p of pozycje) {
    const dzial = dzialProduktu.get(p.produkt) || "Inne";
    if (!grupy.has(dzial)) { grupy.set(dzial, []); kolejnosc.push(dzial); }
    grupy.get(dzial).push(p);
  }

  return kolejnosc.map(dzial => ({ dzial, pozycje: grupy.get(dzial) }));
}

/** „1,2 kg” czyta się lepiej niż „1200 g”, ale przy 80 g kilogramy są bez sensu. */
export function opisIlosci(gramy) {
  if (gramy >= 1000) {
    const kg = gramy / 1000;
    return `${(Math.round(kg * 10) / 10).toString().replace(".", ",")} kg`;
  }
  return `${gramy} g`;
}

/**
 * Czy lista zapisana w telefonie nadaje się jeszcze do liczenia.
 *
 * DLACZEGO TO ISTNIEJE. Ekran Zakupów trzyma ostatnią listę w pamięci telefonu,
 * żeby działała w sklepie bez zasięgu. Ta kopia bywa STARSZA NIŻ KOD — leży tam
 * od wydania, którego już nie pamiętamy. Do 8 sierpnia pozycje zapisywały się
 * bez pola `gramy`; od v45 spiżarnia odejmuje właśnie od tego pola, a funkcja,
 * która to robi, celowo rzuca wyjątkiem, gdy liczby nie ma (decyzja 70).
 *
 * Skutek był taki, że stara kopia w telefonie wywracała cały ekran: człowiek
 * widział „Coś nie zadziałało. Spróbuj odświeżyć.”, odświeżenie nic nie dawało,
 * bo kopia zostawała, a ekran nie zdążył podpiąć się do bazy, żeby pobrać nową.
 * Telefon, który raz w to wpadł, nie wychodził z tego sam nigdy (decyzja 75).
 *
 * Dane z pamięci telefonu traktujemy jak dane z zewnątrz: sprawdzamy je,
 * zamiast zakładać, że mają kształt, który akurat dziś piszemy.
 */
export function kopiaNadajeSie(pozycje) {
  return Array.isArray(pozycje) && pozycje.length > 0
    && pozycje.every(p => p && typeof p.produkt === "string"
                            && typeof p.gramy === "number" && !Number.isNaN(p.gramy));
}

/* =====================================================================
   DOPISANE RĘCZNIE — rzeczy, które trzeba kupić, a nie są składnikiem.

   Pasta do zębów, worki na śmieci, karma dla kota. Do 29 sierpnia lista zakupów
   liczyła się WYŁĄCZNIE z jadłospisu, więc takich rzeczy nie dało się do niej
   dopisać w ogóle — a ktoś, kto idzie do sklepu z listą w telefonie, i tak ma
   przy sobie te pozycje, tylko w innej aplikacji albo w głowie.

   Osobno od reszty listy trzymamy je z jednego powodu: **nie mają gramatury**.
   Cała lista zakupów stoi na przeliczaniu gramów na porcje i odejmowaniu spiżarni,
   a „pasta do zębów” nie ma się do czego przeliczyć. Wciśnięcie jej w ten sam
   kształt danych oznaczałoby wpisanie tam liczby, która nic nie znaczy.
   ===================================================================== */

/** Przycina i sprawdza wpisany tekst. Zwraca null, gdy nie ma czego dopisywać. */
export function normalizujDopisek(tekst) {
  const czysty = String(tekst ?? "").replace(/\s+/g, " ").trim();
  if (!czysty) return null;
  /* Sto znaków to dużo więcej niż „2 pasty do zębów”, a chroni listę przed
     wklejonym przypadkiem akapitem. */
  return czysty.slice(0, 100);
}

/* Ilość z przodu wpisu — „2 pasty”, „3x worki”, „500 g kawy”. Odcinamy ją tylko
   na potrzeby ROZPOZNANIA produktu; w treści pozycji zostaje, bo to informacja
   dla człowieka w sklepie. */
const BEZ_ILOSCI = /^\s*\d+\s*(x|szt\.?|sztuki?|g|kg|ml|l|dag)?\s*/i;

/**
 * Zgaduje dział dla dopisanej ręcznie pozycji, na podstawie słownika produktów.
 *
 * Powód, dla którego to w ogóle istnieje (zgłoszenie Miłosza z 29 sierpnia):
 * chleb dopisany ręcznie lądował w sekcji „Dopisane”, choć apka doskonale wie,
 * że chleb to pieczywo — a w sklepie chodzi się działami, nie źródłami danych.
 *
 * Reguła jest celowo ostrożna: dopasowujemy po początku nazwy, a gdy trafień jest
 * wiele, przypisujemy dział TYLKO gdy wszystkie trafienia się co do niego zgadzają.
 * „Chleb” pasuje do kilku chlebów i wszystkie są w tym samym dziale, więc dostaje
 * ten dział. Coś, co pasuje do dwóch różnych działów, zostaje w „Dopisanych” —
 * bo zły dział jest gorszy niż brak działu: wysyła człowieka w złą alejkę.
 *
 * @returns {string|null} nazwa działu albo null, gdy nie rozpoznano
 */
export function dzialDopisku(tekst, slownik = []) {
  const czysty = normalizujDopisek(tekst);
  if (!czysty) return null;

  const szukane = czysty.toLowerCase()
    .replace(BEZ_ILOSCI, "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (szukane.length < 3) return null;   // „ser” tak, „ry” nie — dwie litery pasują do wszystkiego

  const uprosc = (s) => s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  /* Krok pierwszy: trafienie dokładne wygrywa ze wszystkim. Bez tego „masło”
     przegrywało samo ze sobą — pasowało i do „Masło” (Nabiał), i do „Masło
     orzechowe” (Spiżarnia), działy się nie zgadzały i wpis lądował w Dopisanych,
     choć w słowniku stoi produkt o dokładnie tej nazwie. */
  const dokladne = slownik.find(p => uprosc(p.n || "") === szukane);
  if (dokladne?.dzial) return dokladne.dzial;

  /* Krok drugi: początek nazwy — w obie strony, plus wspólny początek co najmniej
     pięciu liter. To ostatnie jest po polską odmianę: „chleby” nie zaczyna się od
     „chleb żytni razowy” ani odwrotnie, ale wspólne „chleb” wystarczy, żeby wiedzieć,
     o co chodzi. Pięć, nie trzy — przy trzech „mak” trafiałby w „makaron”. */
  const wspolnyPoczatek = (a, b) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
  };

  const trafienia = slownik.filter(p => {
    const nazwa = uprosc(p.n || "");
    if (!nazwa) return false;
    return nazwa.startsWith(szukane) || szukane.startsWith(nazwa)
           || wspolnyPoczatek(nazwa, szukane) >= 5;
  });
  if (!trafienia.length) return null;

  /* Z trafień zostawiamy te NAJBLIŻSZE — o najdłuższym wspólnym początku.
     Bez tego „masło orzechowe” przegrywało z samym „masłem”: pasowało do obu,
     działy się nie zgadzały i wpis lądował w Dopisanych, choć dokładniejsze
     z dwóch trafień było jednoznaczne. */
  const najlepszy = Math.max(...trafienia.map(p => wspolnyPoczatek(uprosc(p.n), szukane)));
  const najblizsze = trafienia.filter(p => wspolnyPoczatek(uprosc(p.n), szukane) === najlepszy);

  /* Gdy i tak zostaje wiele, dział przypisujemy TYLKO gdy wszystkie się zgadzają.
     Zły dział jest gorszy niż brak działu: wysyła człowieka w złą alejkę. */
  const dzialy = [...new Set(najblizsze.map(p => p.dzial).filter(Boolean))];
  return dzialy.length === 1 ? dzialy[0] : null;
}

/** Ilość sztuk przy dopisanej pozycji. Zwraca liczbę całkowitą ≥ 1 albo null.
 *
 *  `null`, a nie `1`, gdy nic nie podano — bo „1” na ekranie to szum. Sztuka
 *  chleba i tak jest jedna, a „×1” przy każdej pozycji zabiera uwagę tym,
 *  które naprawdę mają liczbę.
 *
 *  To NIE jest gramatura. Dopisane pozycje nie wchodzą do przeliczania porcji
 *  ani do odejmowania spiżarni — „3” przy paście do zębów znaczy trzy sztuki
 *  do wzięcia z półki, nic więcej. */
export function normalizujIlosc(wartosc) {
  if (wartosc === "" || wartosc == null) return null;
  const n = Number(wartosc);
  if (!Number.isFinite(n)) return null;
  const calkowita = Math.floor(n);
  if (calkowita < 1) return null;
  /* Dziewięćset dziewięćdziesiąt dziewięć to o dwa rzędy więcej, niż ktokolwiek
     kupi jednej rzeczy — a chroni listę przed palcem, który zsunął się z klawiatury. */
  return Math.min(calkowita, 999);
}

/* =====================================================================
   ILE CZEGO — przy pozycji dopisanej ręcznie.

   Pierwsza wersja miała pole „szt.” i przyjmowała wyłącznie liczbę całkowitą.
   Miłosz: „a jeśli dodawany ręcznie produkt ma gramaturę, a nie ilość?”.
   Ma rację: pasta do zębów liczy się na sztuki, kawa i karma dla kota na wagę,
   a mleko na litry. Pole na samą liczbę wymuszało wpisywanie jednostki w nazwę
   albo pomijanie jej w ogóle.

   Dlatego to jest TEKST, nie liczba, i nie próbujemy go rozumieć. Ta wartość
   nie wchodzi do przeliczania porcji ani do odejmowania spiżarni — jedynym jej
   odbiorcą jest człowiek stojący przed półką. Parsowanie „500 g” na liczbę
   i jednostkę dałoby nam dane, których nikt nie używa, i pytanie, co zrobić
   z „dwie duże albo trzy małe”.
   ===================================================================== */

/** Przycina wpisaną miarę. Zwraca napis albo null, gdy nic nie wpisano. */
export function normalizujMiare(wartosc) {
  const czysty = String(wartosc ?? "").replace(/\s+/g, " ").trim();
  if (!czysty) return null;
  /* Dwadzieścia znaków mieści „500 g”, „2 opakowania” i „1,5 l”, a nie mieści
     drugiej nazwy produktu wpisanej w złe pole. */
  return czysty.slice(0, 20);
}

/** Co pokazać w prawej kolumnie listy. Pusty napis znaczy „nie pokazuj nic”. */
export function opisMiary(wartosc) {
  const miara = normalizujMiare(wartosc);
  if (!miara) return "";

  /* Sama liczba dostaje „×”, bo bez tego „3” przy paście do zębów czyta się
     jak gramatura, czyli jak reszta listy. Z jednostką zostawiamy dokładnie to,
     co człowiek wpisał — „500 g” ma wyglądać jak „500 g”. */
  if (/^\d+$/.test(miara)) {
    const n = normalizujIlosc(miara);
    return n && n > 1 ? `×${n}` : "";
  }
  return miara;
}
