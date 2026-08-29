/* =====================================================================
   RYTM — okres, kto je co, i siatka dnia. Zamiennik dla DNI_TYG, SLOTY,
   ILE_OSOB i kluczTygodnia z Dietki — te cztery rzeczy w prawdziwym kodzie
   Dietki (apka/dane.js) kodują na sztywno poniedziałek–piątek, kto je
   śniadanie a kto kolację, i dokładnie dwoje domowników.

   Domyślny rytm w tym pliku nie zakłada NIC o tym, kto je co: każdy typ
   posiłku domyślnie je cały dom. To jedyny wybór, który nie jest cudzym
   trybem życia przepisanym na regułę — użytkownik zawęża go sam
   w ustawieniach, jeśli jego rytm jest inny (decyzja 12).

   Porcje nie mają już osobnej tabeli jak ILE_OSOB — to po prostu długość
   listy `kto` przy danym posiłku. Jedno źródło prawdy zamiast dwóch,
   które w Dietce musiały być ręcznie trzymane w zgodzie.
   ===================================================================== */

import { TYPY_POSILKOW } from "./prompt.js";

/* ---------------------------------------------------------------------
   Okres — ile dni naraz, od kiedy. Domyślnie 7, ale to ustawienie,
   nie stała (decyzja 11). Klucz do bazy to data startu, nie „numer
   tygodnia” — okres może zacząć się dowolnego dnia, nie tylko w niedzielę.
   --------------------------------------------------------------------- */

export function dataISO(data) {
  const d = new Date(data);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nowyOkres(dataStartu, dlugoscDni = 7) {
  if (!Number.isInteger(dlugoscDni) || dlugoscDni < 1) {
    throw new Error("Długość okresu musi być liczbą całkowitą, co najmniej 1.");
  }
  return { start: dataISO(dataStartu), dni: dlugoscDni };
}

export function kluczOkresu(okres) {
  return okres.start;
}

export function dniOkresu(okres) {
  const [r, m, dz] = okres.start.split("-").map(Number);
  const bazowa = new Date(r, m - 1, dz, 12);
  const wynik = [];
  for (let i = 0; i < okres.dni; i++) {
    const d = new Date(bazowa);
    d.setDate(d.getDate() + i);
    wynik.push(dataISO(d));
  }
  return wynik;
}

export function okresPrzesuniety(okres, oIleOkresow) {
  const [r, m, dz] = okres.start.split("-").map(Number);
  const d = new Date(r, m - 1, dz, 12);
  d.setDate(d.getDate() + oIleOkresow * okres.dni);
  return nowyOkres(d, okres.dni);
}

/* ---------------------------------------------------------------------
   Rytm domyślny — dla każdego typu posiłku, czy występuje w okresie
   i kto go je. Punkt startowy do ustawień, nie do siatki bezpośrednio.
   --------------------------------------------------------------------- */

export function domyslnyRytm(domownicy, typy = TYPY_POSILKOW) {
  const wszyscy = domownicy.map(d => d.id);
  const rytm = {};
  for (const typ of typy) rytm[typ] = { wlaczony: true, kto: [...wszyscy] };
  return rytm;
}

/* ---------------------------------------------------------------------
   Siatka okresu — jeden wpis na dzień, zbudowany z rytmu domyślnego.
   Stąd zaczyna się edycja: wyłączenie posiłku w jednym dniu, zmiana kto
   go je, albo oznaczenie, że nie generuje składników (decyzja 12).
   Żadna funkcja tutaj nie mutuje — zawsze zwraca nową siatkę, tak samo
   jak dom.js zwraca nową listę domowników.
   --------------------------------------------------------------------- */

export function pustaSiatka(okres, rytm) {
  return dniOkresu(okres).map(data => {
    const posilki = {};
    for (const typ in rytm) {
      if (!rytm[typ].wlaczony) continue;
      posilki[typ] = { kto: [...rytm[typ].kto], danie: null, bezSkladnikow: null };
    }
    return { data, posilki };
  });
}

function znajdzDzien(siatka, data) {
  const dzien = siatka.find(d => d.data === data);
  if (!dzien) throw new Error(`Dzień „${data}” nie jest w tym okresie.`);
  return dzien;
}

export function wylaczPosilek(siatka, data, typ) {
  znajdzDzien(siatka, data);
  return siatka.map(d => {
    if (d.data !== data) return d;
    const { [typ]: pominiety, ...reszta } = d.posilki;
    return { ...d, posilki: reszta };
  });
}

export function wlaczPosilek(siatka, data, typ, kto) {
  znajdzDzien(siatka, data);
  if (!kto?.length) throw new Error("Posiłek musi mieć chociaż jedną osobę.");
  return siatka.map(d => d.data !== data ? d : {
    ...d, posilki: { ...d.posilki, [typ]: { kto: [...kto], danie: null, bezSkladnikow: null } }
  });
}

export function zmienKtoJe(siatka, data, typ, kto) {
  const dzien = znajdzDzien(siatka, data);
  if (!dzien.posilki[typ]) throw new Error(`„${typ}” jest wyłączony w dniu ${data} — najpierw włącz.`);
  if (!kto?.length) throw new Error("Posiłek musi mieć chociaż jedną osobę.");
  return siatka.map(d => d.data !== data ? d : {
    ...d, posilki: { ...d.posilki, [typ]: { ...d.posilki[typ], kto: [...kto] } }
  });
}

/** „na mieście”, „resztki”, „gotowiec” — posiłek jest, ale nie generuje
 *  składników do listy zakupów. */
export function oznaczBezSkladnikow(siatka, data, typ, etykieta) {
  const dzien = znajdzDzien(siatka, data);
  if (!dzien.posilki[typ]) throw new Error(`„${typ}” jest wyłączony w dniu ${data} — najpierw włącz.`);
  const czysta = String(etykieta ?? "").trim();
  if (!czysta) throw new Error("Etykieta nie może być pusta.");
  return siatka.map(d => d.data !== data ? d : {
    ...d, posilki: { ...d.posilki, [typ]: { ...d.posilki[typ], bezSkladnikow: czysta, danie: null } }
  });
}

export function przypiszDanie(siatka, data, typ, idDania) {
  const dzien = znajdzDzien(siatka, data);
  if (!dzien.posilki[typ]) throw new Error(`„${typ}” jest wyłączony w dniu ${data} — najpierw włącz.`);
  return siatka.map(d => d.data !== data ? d : {
    ...d, posilki: { ...d.posilki, [typ]: { ...d.posilki[typ], danie: idDania, bezSkladnikow: null } }
  });
}

/** Ile porcji danego dania potrzeba na ten posiłek — długość listy `kto`.
 *  Zastępuje ILE_OSOB z Dietki: tam było zaszyte { wspolne: 2 } na sztywno,
 *  tutaj to się po prostu liczy z tego, kogo tam wpisano. */
export function porcjePotrzebne(dzien, typ) {
  return dzien.posilki[typ]?.kto?.length ?? 0;
}

/* =====================================================================
   CZY PLAN Z BAZY JEST KOMPLETNY.

   Powstało po awarii z 29 sierpnia: wybór dania w pustym jadłospisie zapisywał
   do bazy JEDEN punkt — `siatka/0/posilki/obiad` — więc w bazie powstawał plan
   złożony z jednego dnia i bez okresu. Nasłuch na żywo odsyłał to z powrotem,
   a ekran przyjmował za dobrą monetę i zastępował tym cały tydzień. Plan nie
   został skasowany; został zastąpiony tym, co odesłała baza.

   Stąd reguła, ta sama co przy starej kopii listy zakupów (decyzja 75): dane
   z bazy sprawdzamy jak wejście z zewnątrz, także wtedy — a właściwie zwłaszcza
   wtedy — gdy sami je tam zapisaliśmy. Zapis może być niekompletny, przerwany
   w połowie albo pochodzić z wydania, którego już nie ma.

   Tu, zamiast w ekranie, bo w HTML-u nie da się tego przetestować.
   ===================================================================== */
export function planKompletny(zapisany) {
  const dni = zapisany?.okres?.dni;
  if (!Number.isInteger(dni) || dni < 1) return false;

  /* Firebase oddaje tablicę jako tablicę tylko wtedy, gdy indeksy są gęste
     od zera. Zapis pod sam indeks 3 wraca jako obiekt `{ "3": … }`, a zapis
     pod sam indeks 0 — jako jednoelementowa tablica, czyli coś, co wygląda
     na poprawny plan jednodniowy. Oba przypadki muszą tu odpaść. */
  if (!Array.isArray(zapisany.siatka)) return false;
  if (zapisany.siatka.length !== dni) return false;

  return zapisany.siatka.every(d => d && typeof d.data === "string");
}

/** Zdejmuje danie z posiłku, ZOSTAWIAJĄC sam posiłek w planie.
 *
 *  Powstało 29 sierpnia z odruchu Miłosza: krzyżyk przy posiłku czyta się jak
 *  „usuń to, co wpisane”, a wyłączał cały posiłek z dnia — i to nieodwracalnie,
 *  bo `wlaczPosilek()` istniał od zawsze i żaden ekran go nie wołał.
 *  Zmiana dania wymagała wejścia w wybór i podmiany, czyli drogi, której nikt
 *  nie szuka, mając krzyżyk pod palcem. */
export function wyczyscDanie(siatka, data, typ) {
  const dzien = znajdzDzien(siatka, data);
  if (!dzien.posilki[typ]) throw new Error(`„${typ}” jest wyłączony w dniu ${data} — nie ma czego czyścić.`);
  return siatka.map(d => d.data !== data ? d : {
    ...d, posilki: { ...d.posilki, [typ]: { ...d.posilki[typ], danie: null, bezSkladnikow: null } }
  });
}

/** Czy w tym posiłku cokolwiek stoi — danie albo etykieta „na mieście”. */
export function posilekPusty(dzien, typ) {
  const w = dzien?.posilki?.[typ];
  return !!w && !w.danie && !w.bezSkladnikow;
}
