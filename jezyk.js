/* =====================================================================
   JĘZYK — polski albo angielski, własność STOŁU.

   Dwie osoby przy jednym stole widzą to samo, bo plan i lista są wspólne —
   gdyby język siedział w telefonie, jedna osoba pisałaby do listy zakupów
   „Chleb”, druga widziałaby „Bread” i żadna nie wiedziałaby, czemu druga
   nie widzi tego, co ona. Dlatego język leży w gałęzi `ustawienia` stołu
   i leci na wszystkie telefony przy nim (decyzja 119).

   Pamięć telefonu trzyma KOPIĘ ostatnio znanego języka. Nie jest prawdą,
   tylko odpowiedzią na pytanie „co narysować w pierwszej klatce, zanim
   baza odpowie” — i jedyną odpowiedzią, jaką mamy bez zasięgu, bo bez
   internetu nie ma Firebase w ogóle (pułapka 23).

   Czego tu NIE ma i celowo nie będzie: zgadywania języka z ustawień
   telefonu. Miłosz wybrał pytanie wprost przy pierwszym wejściu — zgadywanie
   znaczyłoby, że Polak z angielskim systemem dostaje angielski stół i nie
   wie, czemu.
   ===================================================================== */

export const JEZYKI = [
  { id: "pl", etykieta: "Polski",  wlasna: "Polski" },
  { id: "en", etykieta: "English", wlasna: "English" },
];

/* Polski jest domyślny, bo apka jest napisana po polsku: brak tłumaczenia
   oznacza polski napis, a nie pustkę. To ta sama zasada co w tlumaczenia.js. */
export const DOMYSLNY = "pl";

const KLUCZ = "forkast-jezyk";

export function czyZnany(id) {
  return JEZYKI.some(j => j.id === id);
}

/** Ostatnio znany język tego stołu, zapamiętany na tym telefonie. */
export function zapamietany(pamiec = globalThis.localStorage) {
  try {
    const j = pamiec?.getItem(KLUCZ);
    return czyZnany(j) ? j : null;
  } catch { return null; }
}

/** Zapis może się nie udać (Safari prywatne) i to nie ma prawa wywalić
    ekranu — pułapka 17. */
export function zapamietaj(id, pamiec = globalThis.localStorage) {
  try {
    if (czyZnany(id)) pamiec?.setItem(KLUCZ, id);
    return true;
  } catch { return false; }
}

/** Czym rysować pierwszą klatkę, zanim odezwie się baza. */
export function naStart(pamiec = globalThis.localStorage) {
  return zapamietany(pamiec) || DOMYSLNY;
}

/** To, co przyszło z bazy, jest wejściem z zewnątrz — pułapka 10. */
export function zBazy(ustawienia) {
  const j = ustawienia?.jezyk;
  return czyZnany(j) ? j : DOMYSLNY;
}
