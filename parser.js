// Czytanie tego, co użytkownik wkleił z powrotem ze swojego AI.
//
// Wychodzimy z założenia, że odpowiedź NIE będzie czystym JSON-em. Będzie
// w bloku kodu, z gadaniem przed i po, z przecinkiem na końcu tablicy,
// z gramaturą zapisaną jako "150 g" i z polem, którego model zapomniał.
//
// Zasada z decyzji 6: co da się naprawić — naprawiamy po cichu. Czego nie da
// się naprawić bezpiecznie — pokazujemy użytkownikowi, zamiast zgadywać.

import { TYPY_POSILKOW } from "./prompt.js";

const TYPY = new Set(TYPY_POSILKOW);

/* ---------- wyciąganie JSON-a z bałaganu ---------- */

// Znajduje wszystkie domknięte obiekty i tablice, pomijając nawiasy w stringach.
function kandydaci(tekst) {
  const out = [];
  const stos = [];
  let start = -1, wStringu = false, escape = false, cudzyslow = "";

  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (wStringu) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === cudzyslow) wStringu = false;
      continue;
    }
    if (c === '"' || c === "'") { wStringu = true; cudzyslow = c; continue; }
    if (c === "{" || c === "[") {
      if (!stos.length) start = i;
      stos.push(c);
      continue;
    }
    if (c === "}" || c === "]") {
      if (!stos.length) continue;
      stos.pop();
      if (!stos.length && start >= 0) { out.push(tekst.slice(start, i + 1)); start = -1; }
    }
  }
  return out.sort((a, b) => b.length - a.length);
}

function napraw(s) {
  return s
    .replace(/ /g, " ")                       // twarda spacja
    .replace(/\/\/[^\n]*/g, "")                    // komentarze //
    .replace(/\/\*[\s\S]*?\*\//g, "")              // komentarze /* */
    .replace(/,(\s*[}\]])/g, "$1")                 // przecinek przed zamknięciem
    .replace(/([{,]\s*)([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż_][\w]*)(\s*:)/g, '$1"$2"$3'); // klucze bez cudzysłowu
}

function naprostuj(s) {
  return s.replace(/[„“”‟]/g, '"').replace(/[‘’]/g, "'");
}

export function wyciagnijJSON(tekst) {
  if (typeof tekst !== "string" || !tekst.trim()) throw new Error("Pusta odpowiedź.");

  // Blok kodu ma pierwszeństwo — jeśli jest, to prawie zawsze on jest odpowiedzią.
  const fence = tekst.match(/```(?:json|javascript|js)?\s*([\s\S]*?)```/i);
  const zrodla = fence ? [fence[1], tekst] : [tekst];

  for (const zrodlo of zrodla) {
    for (const kand of [zrodlo, ...kandydaci(zrodlo)]) {
      for (const wariant of [kand, napraw(kand), napraw(naprostuj(kand))]) {
        try {
          const o = JSON.parse(wariant);
          if (o && typeof o === "object") return o;
        } catch { /* następna próba */ }
      }
    }
  }
  throw new Error("Nie znalazłem JSON-a w tym, co wkleiłeś.");
}

/* ---------- dopasowanie produktów do słownika ---------- */

export function normalizuj(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function liczba(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const m = v.replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/* ---------- twarde limity (VAL-1) ----------

   Parser sprawdzał format i gramaturę, ale nie sprawdzał rozmiarów. Trzystuznakowa
   nazwa dania przechodziła i rozjeżdżała ekran u obcej osoby. Przy treści, która
   przychodzi z modelu (a w trybie "link" pośrednio z obcej strony), rozmiar jest
   równie ważny jak format.

   Zasada: odrzucamy z komunikatem, nie przycinamy po cichu. Ciche przycięcie zmienia
   danie w coś, czego użytkownik nie zamawiał, i nikt się o tym nie dowiaduje. */

const LIMITY = {
  /* 120, nie 60. Pierwotne 60 było liczbą wziętą z sufitu i realne użycie ją obaliło:
     Gemini czytające zdjęcie przepisu zwróciło "Pierogi ruskie z palonym masłem..."
     — 74 znaki, całkowicie normalny tytuł dania, odrzucony bez powodu. Celem tego
     limitu jest zatrzymać nazwę trzystuznakową, która rozwala układ ekranu,
     nie karać za opisowy tytuł. Zmienione 3 sierpnia po pierwszym teście na zdjęciach. */
  nazwaDania:     { min: 1, max: 120 },
  nazwaSkladnika: { min: 1, max: 40 },
  liczbaSkladnikow: { min: 1, max: 30 },
  ladunekBajtow:  8 * 1024,
};

/** Usuwa znaki sterujące i nawiasy kątowe — treść z modelu trafia potem na ekran. */
function oczysc(s) {
  return String(s ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dlugoscOk(tekst, limit) {
  return tekst.length >= limit.min && tekst.length <= limit.max;
}

/* ---------- kształty, które trzeba wyprostować ---------- */

function doTablicy(v) {
  if (Array.isArray(v)) return v;
  if (v == null) return [];
  return [v];
}

function skladnikiNaListe(s) {
  if (Array.isArray(s)) {
    return s.map(x => {
      if (Array.isArray(x)) return { produkt: x[0], gramy: liczba(x[1]) };
      if (x && typeof x === "object") {
        const nazwa = x.produkt ?? x.nazwa ?? x.skladnik ?? x.name;
        const g = liczba(x.gramy ?? x.gram ?? x.ilosc ?? x.g ?? x.grams);
        return { produkt: nazwa, gramy: g };
      }
      return { produkt: x, gramy: null };
    });
  }
  if (s && typeof s === "object") {
    return Object.entries(s).map(([k, v]) => ({ produkt: k, gramy: liczba(v) }));
  }
  return [];
}

function typyNaListe(t) {
  return doTablicy(t)
    .map(x => normalizuj(x))
    .map(x => TYPY_POSILKOW.find(p => normalizuj(p) === x) || null)
    .filter(Boolean);
}

/* ---------- sprawdzanie ---------- */

// Lekcja z Dietki: składnik wymieniony wyłącznie w kroku zaczynającym się od
// „Zapakuj” nie liczy się jako użyty. 23 z 31 przepisów miały ten błąd.
const KROK_PAKOWANIE = /^\s*(pakow|zapakuj|przeloz do pojemnik|schowaj|odstaw do lodowk)/i;

function skladnikWKrokach(nazwa, kroki) {
  const tresc = kroki
    .filter(k => !KROK_PAKOWANIE.test(normalizuj(k)))
    .map(k => normalizuj(k)).join(" ");
  // Polska fleksja: porównujemy rdzenie, nie całe słowa.
  const slowa = normalizuj(nazwa).split(" ").filter(w => w.length >= 4);
  if (!slowa.length) return true;
  return slowa.some(w => tresc.includes(w.slice(0, Math.max(3, w.length - 2))));
}

/* Odwrotność powyższego, i groźniejsza: krok każe użyć czegoś, czego nie ma
   na liście składników. Wtedy lista zakupów tego nie kupi i danie jest
   niewykonalne. ChatGPT zrobił to przy pierwszym realnym teście: kazał
   przygotować ciasto z mąki, której nie wymienił wśród składników.

   Wykrywanie opiera się na tym, że model przepisuje nazwy produktów z listy
   dosłownie, razem z wielką literą — więc szukamy fraz pisanych wielką literą
   w środku zdania. Zmierzone na 31 przepisach Dietki: zero fałszywych alarmów. */

const CZASOWNIKI_I_SZUM = new Set(["nie","to","ten","ta","cala","cały","jesli","potem","teraz",
  "woda","wody","wodzie","wode","minut","minuty","stopni","celsjusza","patelnia","patelnie",
  "piekarnik","termoobieg","gril","sol","soli","pieprz","pieprzu",
  /* Nazwy własne krajów i kuchni. Przy przepisach ze świata krok często tłumaczy,
     skąd danie pochodzi („w Hiszpanii sucha tortilla uchodzi za zepsutą”) — a nazwa
     kraju idzie wielką literą w środku zdania, więc wykrywacz brał ją za składnik.
     Złapane 3 sierpnia przy tortilli española. */
  "hiszpanii","hiszpania","hiszpanie","polsce","polska","polsku","wloszech","wlochy","wloski",
  "japonii","japonia","korei","korea","tajlandii","tajlandia","grecji","grecja","francji",
  "francja","indiach","indie","meksyku","meksyk","chinach","chiny","turcji","turcja",
  "azji","europie","bliskim","wschodzie"]);
const OGONKI = new Set(["przez","oraz","i","z","ze","na","do","w","we","a","albo","lub","po","od","aż","az"]);

function frazyWielkaLitera(kroki) {
  const czysc = w => w.replace(/[^\wĄĆĘŁŃÓŚŹŻąćęłńóśźż%]/g, "");
  const out = new Set();
  for (const krok of kroki) {
    for (const zdanie of String(krok).split(/(?<=[.!?:])\s+/)) {
      const slowa = zdanie.trim().split(/\s+/);
      let i = 1;                                   // pierwsze słowo zdania zawsze jest wielką literą
      while (i < slowa.length) {
        const w = czysc(slowa[i]);
        if (/^[A-ZĄĆĘŁŃÓŚŹŻ]/.test(w) && !CZASOWNIKI_I_SZUM.has(normalizuj(w)) && !/^[A-ZĄĆĘŁŃÓŚŹŻ]+$/.test(w)) {
          const fraza = [w];
          let j = i + 1;
          while (j < slowa.length && fraza.length < 3) {
            const n = czysc(slowa[j]);
            if (!/^[a-ząćęłńóśźż]/.test(n) || n.length < 4 || OGONKI.has(normalizuj(n))) break;
            fraza.push(n); j++;
          }
          while (fraza.length > 1 && OGONKI.has(normalizuj(fraza[fraza.length - 1]))) fraza.pop();
          out.add(fraza.join(" "));
          i = Math.max(j, i + 1);
        } else i++;
      }
    }
  }
  return [...out];
}

/* Polska fleksja: „Masłem” i „Maśle” to wciąż „Masło”. Porównujemy rdzenie.

   Rdzeń liczy trzy znaki, nie cztery. Przy czterech krótkie słowa wypadały:
   „mąka” / „mąki” / „mąkę” różnią się dokładnie na czwartej literze, więc każda
   odmiana wyglądała jak inny produkt — i parser odrzucał poprawne danie, twierdząc,
   że krok każe użyć czegoś spoza listy składników. Złapane 3 sierpnia na prawdziwej
   odpowiedzi z Gemini o pierogach.

   Trzy znaki zwiększają ryzyko pomylenia dwóch różnych produktów o wspólnym początku
   („sos”/„sok”), ale skutek takiej pomyłki to najwyżej brak ostrzeżenia — a skutek
   poprzedniego ustawienia to odrzucone, poprawne danie. Lepiej przepuścić wątpliwe
   niż zatrzymać dobre. */
function rdzenSlowa(s) {
  const w = normalizuj(s).split(" ")[0] || "";
  return w.length >= 3 ? w.slice(0, 3) : w;
}

function krokiUzywajaNieznanego(kroki, skladniki) {
  /* Rdzenie WSZYSTKICH słów nazwy, nie tylko pierwszego. Przy nazwach
     dwuczłonowych to drugie słowo bywa tym pisanym wielką literą: w kroku
     „polej musztardą Dijon” wykrywacz widzi „Dijon”, a rdzeń pierwszego słowa
     to „mus” — więc poprawny składnik wyglądał na nieznany. Złapane
     3 sierpnia na sałatce jarzynowej. */
  const rdzenie = new Set();
  for (const sk of skladniki) {
    for (const slowo of String(sk.produkt).split(/\s+/)) {
      const r = rdzenSlowa(slowo);
      if (r.length >= 3) rdzenie.add(r);
    }
  }
  return frazyWielkaLitera(kroki).filter(f => !rdzenie.has(rdzenSlowa(f)));
}

/* Sprawdzenie, czy makroskładniki zgadzają się z podanymi kaloriami.

   Tolerancja jest ASYMETRYCZNA i to jest sedno tej funkcji.

   Wzór 4-4-9 liczy błonnik jako pełnowartościowy węglowodan (4 kcal/g), a naprawdę
   daje on około 2. Przy produktach z dużą ilością błonnika — suszone przyprawy, zioła,
   otręby — rachunek zawsze wychodzi WYŻSZY niż prawda. To nie jest błąd modelu, tylko
   ograniczenie wzoru: „paprika 282 kcal, ze składników 389” to podpis błonnika,
   nie zmyślona wartość.

   Do 3 sierpnia ostrzegaliśmy w obie strony i przy każdym daniu z przyprawami wyskakiwał
   ten sam fałszywy alarm. To gorsze niż brak ostrzeżenia: gdy ostrzeżenia sypią się przy
   każdym daniu, człowiek uczy się je przewijać — i przewinie też to jedno prawdziwe.

   Więc: nadwyżkę tolerujemy szeroko (do 60%), bo ma naturalne wytłumaczenie.
   Niedobór — czyli „deklarowane kalorie wyższe, niż wynika ze składników” — tolerujemy
   wąsko (15%), bo takiego wytłumaczenia nie ma i to jest sygnał, że model zmyślił. */
function makroSieZgadza(p) {
  const { kcal, bialko, wegle, tluszcz } = p;
  if ([kcal, bialko, wegle, tluszcz].some(v => typeof v !== "number")) return null;

  const zeSkladnikow = 4 * bialko + 4 * wegle + 9 * tluszcz;

  /* Sól, woda, ocet: zero kalorii i zero makro to nie jest podejrzana wartość,
     tylko prawda o produkcie. Wcześniejsza wersja odrzucała każde kcal <= 0, zanim
     cokolwiek porównała, więc przy soli wypisywała „podano 0, ze składników wychodzi 0
     — sprawdź”, czyli ostrzegała, że dwie równe liczby są różne. Złapane 3 sierpnia. */
  if (kcal === 0) return zeSkladnikow < 5;
  if (kcal < 0) return false;

  const roznica = (zeSkladnikow - kcal) / kcal;

  if (roznica > 0) return roznica <= 0.60;    // nadwyżka — prawdopodobnie błonnik
  return -roznica <= 0.15;                     // niedobór — brak wytłumaczenia
}

/**
 * @param {string} tekst   surowa odpowiedź wklejona przez użytkownika
 * @param {Array}  slownik [{ n, dzial, ... }] — produkty, które apka już zna
 * @returns {{dania, noweProdukty, bledy, ostrzezenia}}
 *   bledy      — danie NIE wchodzi do bazy, trzeba coś zrobić
 *   ostrzezenia— danie wchodzi, ale pokazujemy je do potwierdzenia
 */
export function parsujOdpowiedz(tekst, slownik = []) {
  const bledy = [], ostrzezenia = [];
  if (typeof tekst === "string" && tekst.length > LIMITY.ladunekBajtow * 4) {
    throw new Error("Odpowiedź jest podejrzanie długa — nie przetwarzam jej.");
  }
  const surowe = wyciagnijJSON(tekst);

  // Model bywa kreatywny co do opakowania: {dania:[…]} albo […] albo pojedyncze danie.
  let dania = surowe.dania ?? surowe.przepisy ?? surowe.posilki ?? surowe.meals;
  if (!dania && Array.isArray(surowe)) dania = surowe;
  if (!dania && surowe.nazwa) dania = [surowe];
  dania = doTablicy(dania);
  if (!dania.length) throw new Error("W odpowiedzi nie ma ani jednego dania.");

  const znane = new Map();
  for (const p of slownik) {
    znane.set(normalizuj(p.n), p);
    if (p.id) znane.set(normalizuj(p.id), p);
  }

  // Nowe produkty najpierw — dania mogą się do nich odwoływać.
  const noweProdukty = [];
  for (const raw of doTablicy(surowe.noweProdukty ?? surowe.nowe_produkty ?? surowe.produkty)) {
    const nazwa = oczysc(raw.nazwa ?? raw.n ?? raw.name);
    if (!nazwa) continue;
    if (!dlugoscOk(nazwa, LIMITY.nazwaSkladnika)) {
      bledy.push(`Nazwa nowego produktu ma ${nazwa.length} znaków, dozwolone do ${LIMITY.nazwaSkladnika.max}.`);
      continue;
    }
    if (znane.has(normalizuj(nazwa))) continue;      // model dopisał coś, co już mamy

    const p = {
      n: nazwa,
      kcal:    liczba(raw.kcal ?? raw.kalorie ?? raw.energia),
      bialko:  liczba(raw.bialko ?? raw.b ?? raw.protein),
      wegle:   liczba(raw.wegle ?? raw.weglowodany ?? raw.w ?? raw.carbs),
      tluszcz: liczba(raw.tluszcz ?? raw.t ?? raw.fat),
      dzial:   String(raw.dzial ?? raw.kategoria ?? "Inne").trim(),
    };
    const brak = ["kcal", "bialko", "wegle", "tluszcz"].filter(k => p[k] == null);
    if (brak.length) {
      bledy.push(`Nowy produkt „${nazwa}” nie ma wartości: ${brak.join(", ")}.`);
      continue;
    }
    const ok = makroSieZgadza(p);
    if (ok === false) {
      const z = Math.round(4 * p.bialko + 4 * p.wegle + 9 * p.tluszcz);
      ostrzezenia.push(
        `„${nazwa}”: makro nie zgadza się z kaloriami (podano ${p.kcal} kcal, ` +
        `ze składników wychodzi ${z}). Sprawdź, zanim zapiszesz.`
      );
    }
    noweProdukty.push(p);
    znane.set(normalizuj(nazwa), p);
  }

  const gotowe = [];
  for (const [i, raw] of dania.entries()) {
    const etykieta = oczysc(raw?.nazwa ?? raw?.name ?? `danie ${i + 1}`);
    const lokalne = [];

    if (!dlugoscOk(etykieta, LIMITY.nazwaDania)) {
      bledy.push(`Nazwa dania musi mieć od ${LIMITY.nazwaDania.min} do ${LIMITY.nazwaDania.max} znaków — ` +
                 `ta ma ${etykieta.length}.`);
      continue;
    }

    const typy = typyNaListe(raw?.typy ?? raw?.typ ?? raw?.posilki);
    if (!typy.length) {
      lokalne.push(`„${etykieta}”: brak typu posiłku. Dozwolone: ${[...TYPY].join(", ")}.`);
    }

    const porcje = liczba(raw?.porcje ?? raw?.porcji ?? raw?.servings);
    if (porcje == null) {
      lokalne.push(`„${etykieta}”: brak liczby porcji — bez tego nie policzymy zakupów.`);
    } else if (!Number.isInteger(porcje) || porcje < 1 || porcje > 12) {
      lokalne.push(`„${etykieta}”: liczba porcji „${porcje}” nie ma sensu.`);
    }

    const kroki = doTablicy(raw?.kroki ?? raw?.steps).map(k => oczysc(k)).filter(Boolean);

    const skladniki = [];
    for (const s of skladnikiNaListe(raw?.skladniki ?? raw?.sklad ?? raw?.ingredients)) {
      const nazwa = oczysc(s.produkt);
      if (!nazwa) continue;
      if (!dlugoscOk(nazwa, LIMITY.nazwaSkladnika)) {
        lokalne.push(`„${etykieta}”: nazwa składnika ma ${nazwa.length} znaków, dozwolone do ${LIMITY.nazwaSkladnika.max}.`);
        continue;
      }
      const p = znane.get(normalizuj(nazwa));
      if (!p) {
        lokalne.push(`„${etykieta}”: produkt „${nazwa}” nie jest w słowniku i nie został dopisany.`);
        continue;
      }
      if (s.gramy == null || s.gramy <= 0) {
        lokalne.push(`„${etykieta}”: brak gramatury przy „${nazwa}”.`);
        continue;
      }
      if (s.gramy > 2000) {
        ostrzezenia.push(`„${etykieta}”: ${s.gramy} g produktu „${nazwa}” wygląda na pomyłkę.`);
      }
      skladniki.push({ produkt: p.n, gramy: s.gramy });
      if (kroki.length && !skladnikWKrokach(p.n, kroki)) {
        ostrzezenia.push(`„${etykieta}”: „${p.n}” jest na liście składników, ale żaden krok go nie używa.`);
      }
    }
    if (!skladniki.length) lokalne.push(`„${etykieta}”: nie ma ani jednego czytelnego składnika.`);
    if (skladniki.length > LIMITY.liczbaSkladnikow.max) {
      lokalne.push(`„${etykieta}”: ${skladniki.length} składników to za dużo (limit ${LIMITY.liczbaSkladnikow.max}).`);
    }

    /* Krok wspominający coś spoza listy składników to ostrzeżenie, nie błąd.

       Wykrywanie jest słuszne — lista zakupów faktycznie tego nie kupi. Ale reakcja
       była nieproporcjonalna: całe, poprawne danie lądowało w koszu przez to, że
       w kroku padł olej do smażenia albo szczypta tymianku. Realny przypadek
       z 3 sierpnia: przepis na pierogi ze zdjęcia, odrzucony przez trzy takie
       wzmianki, mimo że reszta była bez zarzutu.

       Teraz danie przechodzi, a użytkownik widzi uwagę na ekranie potwierdzenia
       i sam decyduje — dokładnie po to ten ekran powstał. */
    for (const brak of krokiUzywajaNieznanego(kroki, skladniki)) {
      ostrzezenia.push(`„${etykieta}”: krok wspomina „${brak}”, ale tego nie ma na liście składników — ` +
                       `lista zakupów tego nie kupi, dokup osobno albo dopisz do dania.`);
    }

    if (lokalne.length) { bledy.push(...lokalne); continue; }
    gotowe.push({ nazwa: etykieta, typy, porcje, skladniki, kroki });
  }

  return { dania: gotowe, noweProdukty, bledy, ostrzezenia };
}

/* =====================================================================
   WERSJA RESTAURACYJNA — kształt odpowiedzi sprawdzany w obie strony
   (decyzja 109).

   Drugi pomiar 5 września pokazał dwie dziury, których prompt nie zakazywał:
   sól była w krokach (3 g), a na liście akcentów jej nie było; cytryna była
   na liście (10 g), a w krokach (2 g). Lista różnicy z decyzji 102 („wersja
   restauracyjna dokłada: …”) jest liczona z akcentów — jeśli akcenty kłamią,
   kłamie jedyna rzecz, dla której istnieją.

   Reguła: każda ilość w g/ml w krokach, która nie jest składnikiem fundamentu,
   ma pozycję w akcentach, a suma z kroków równa się ilości na liście. Woda
   nie jest produktem i nie liczy się.

   Czytanie polskiej odmiany („soku z cytryny” → „Cytryny”): porównujemy
   wspólny początek słów, nie całe słowa — jak w rdzenSlowa(), ale
   z rankingiem: „pieprzu” pasuje do „Pieprz” (6 wspólnych liter) mocniej niż
   do „Pierś” (3), więc wygrywa pieprz. Bez rankingu sam trzyliterowy rdzeń
   mylił te dwa.
   ===================================================================== */

const SLOWA_BEZ_ZNACZENIA = new Set(["i","oraz","z","ze","na","do","w","we","przez",
  "po","pod","nad","od","dla","lub","albo","az","a","o","u","przy"]);

/* Ruchome „e”: czosnek→czosnku, cukier→cukru, ocet→octu, jajka→jajek, koper→kopru.
   Dajemy każdemu słowu drugi wariant bez „e” przed ostatnią spółgłoską i porównujemy
   najlepszą parę. „olej”→„olj” jest wariantem bezużytecznym, ale nieszkodliwym —
   liczy się lepszy z dwóch. */
function bezRuchomegoE(w) {
  const n = w.length;
  if (n < 4 || /[aeiouy]/.test(w[n - 1])) return null;
  if (w.slice(n - 3, n - 1) === "ie") return w.slice(0, n - 3) + w[n - 1];   // cukier→cukr
  if (w[n - 2] === "e") return w.slice(0, n - 2) + w[n - 1];                 // czosnek→czosnk
  return null;
}

/* Wspólny początek dwóch znormalizowanych słów; 0, gdy nie jest to ta sama nazwa.

   Próg: cała krótsza forma bez jednej litery, nie mniej niż trzy. Luźniejszy próg
   (bez dwóch liter) przepuszczał „pieprzu” jako „Pierś” — i gdy pieprzu nie było
   w akcentach, przyklejał go do fundamentu bez słowa. Wyszło przy sabotażu testu. */
function wspolnyPoczatek(a, b) {
  let naj = 0;
  for (const x of [a, bezRuchomegoE(a)]) for (const y of [b, bezRuchomegoE(b)]) {
    if (!x || !y) continue;
    let n = 0;
    while (n < x.length && n < y.length && x[n] === y[n]) n++;
    const wymagane = Math.max(3, Math.min(x.length, y.length) - 1);
    if (n >= wymagane) naj = Math.max(naj, n);
  }
  return naj;
}

function slowaNazwy(s) {
  return normalizuj(s).split(" ").filter(w => w.length >= 3 && !SLOWA_BEZ_ZNACZENIA.has(w));
}

/* Ile fraza z kroku („oleju rzepakowego”) pasuje do nazwy produktu („Olej rzepakowy”).
   Suma wspólnych początków po słowach; 0 = nie pasuje. */
function dopasowanie(frazaSlowa, produktSlowa) {
  let suma = 0;
  for (const p of produktSlowa) {
    let naj = 0;
    for (const f of frazaSlowa) naj = Math.max(naj, wspolnyPoczatek(f, p));
    suma += naj;
  }
  return suma;
}

/* Wyciąga z kroków każde „N g/ml + nazwa”. Nazwa to do trzech słów po jednostce,
   ucięte na cyfrze albo znaku przestankowym. */
const ILOSC_W_KROKU = /(\d+(?:[.,]\d+)?)\s*(g|ml)(?!\p{L})\s*([^\d.,;:!?()„”"]*)/giu;

export function ilosciZKrokow(kroki) {
  const out = [];
  for (const [i, krok] of kroki.entries()) {
    for (const m of String(krok).matchAll(ILOSC_W_KROKU)) {
      const slowa = slowaNazwy(m[3]).slice(0, 3);
      out.push({ krok: i + 1, ilosc: parseFloat(m[1].replace(",", ".")), jednostka: m[2], slowa, tekst: m[0].trim() });
    }
  }
  return out;
}

/**
 * @param {string[]} kroki      kroki wersji restauracyjnej
 * @param {Array}    fundament  składniki wersji podstawowej [{produkt, gramy}] — nie sprawdzamy sum
 * @param {Array}    akcenty    [{produkt, gramy}] — sprawdzamy w obie strony
 * @returns {string[]} lista rozjazdów w liczbach, pusta = kształt się zgadza.
 *   Zdania są pisane tak, żeby dało się je odesłać modelowi jako „popraw to”.
 */
export function sprawdzAkcenty(kroki, fundament, akcenty) {
  const bledy = [];
  const kandydaci = [
    ...fundament.map(s => ({ nazwa: s.produkt, slowa: slowaNazwy(s.produkt), akcent: false })),
    ...akcenty.map(s => ({ nazwa: s.produkt, slowa: slowaNazwy(s.produkt), akcent: true })),
  ];
  /* Lista ilości per akcent, nie suma — bo ta sama liczba w dwóch krokach
     („posiekaj 5 g natki” → „posyp 5 g natki”) to przygotowanie i użycie jednej
     porcji, nie dwa dodania. Pomiar 3 (5 września) odrzucił poprawny przepis
     właśnie tak. Różne liczby się sumują (2 g do marynaty + 2 g do sosu + 1 g korekty). */
  const wKrokach = new Map(akcenty.map(a => [a.produkt, []]));

  for (const w of ilosciZKrokow(kroki)) {
    if (!w.slowa.length) {
      bledy.push(`Krok ${w.krok}: „${w.tekst}” — ilość bez nazwy składnika.`);
      continue;
    }
    if (w.slowa.some(s => wspolnyPoczatek(s, "woda") >= 3)) continue;   // woda nie jest produktem

    /* Ranking dwustopniowy: najpierw ile liter się zgadza, przy remisie — jaka część
       nazwy produktu jest pokryta. „150 g Papryka pokrojona” pasuje po równo (7 liter)
       do „Papryka” i „Papryka wędzona”; wygrywa „Papryka”, bo pokryta w całości.
       Bez tego wygrywał ten, kto stał pierwszy na liście. */
    let naj = null, najWynik = 0, najPokrycie = 0;
    for (const k of kandydaci) {
      const wynik = dopasowanie(w.slowa, k.slowa);
      if (!wynik) continue;
      const pokrycie = k.slowa.filter(p => w.slowa.some(f => wspolnyPoczatek(f, p))).length / k.slowa.length;
      if (wynik > najWynik || (wynik === najWynik && pokrycie > najPokrycie)) {
        naj = k; najWynik = wynik; najPokrycie = pokrycie;
      }
    }
    if (!naj) {
      bledy.push(`Krok ${w.krok}: „${w.tekst}” — tego składnika nie ma ani w wersji podstawowej, ani w akcentach. Dopisz go do akcentów z gramaturą.`);
      continue;
    }
    if (naj.akcent) wKrokach.get(naj.nazwa).push(w.ilosc);
  }

  for (const a of akcenty) {
    const ilosci = wKrokach.get(a.produkt);
    const suma = Math.round(ilosci.reduce((s, x) => s + x, 0) * 10) / 10;
    const jednaPorcja = ilosci.length > 1 && ilosci.every(x => x === ilosci[0]);
    if (!ilosci.length) {
      bledy.push(`Akcent „${a.produkt}” (${a.gramy} g) nie pojawia się z ilością w żadnym kroku. Usuń go z akcentów albo napisz w kroku, ile go użyć.`);
    } else if (Math.abs(suma - a.gramy) > 0.05 && !(jednaPorcja && Math.abs(ilosci[0] - a.gramy) <= 0.05)) {
      bledy.push(`Akcent „${a.produkt}”: na liście ${a.gramy} g, w krokach razem ${suma} g (${ilosci.join(" + ")}). Obie liczby mają być równe.`);
    }
  }
  return bledy;
}
