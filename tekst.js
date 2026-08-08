/* =====================================================================
   TEKST — rozmiar liter do wyboru.

   Zamiast zgadywać jeden właściwy rozmiar dla kogoś między trzydziestką
   a sześćdziesiątką, niech wybierze. To zalecenie powtarza się we wszystkich
   materiałach o dostępności, jakie przeczytałem przy projektowaniu tego
   wyglądu, i jest tańsze niż jakikolwiek kompromis w drugą stronę.

   Wybór trzyma się lokalnie, nie w bazie: to ustawienie tego telefonu i tych
   oczu, nie całego domu. Dwie osoby dzielące jeden dom mogą chcieć różnych.
   ===================================================================== */

const KLUCZ = "forkast-skala";

export const SKALE = [
  { id: "normalny", etykieta: "Normalny", wartosc: 1 },
  { id: "duzy",     etykieta: "Duży",     wartosc: 1.15 },
  { id: "bardzo",   etykieta: "Bardzo duży", wartosc: 1.32 },
];

export function biezaca() {
  return localStorage.getItem(KLUCZ) || "normalny";
}

function zastosuj(id) {
  const s = SKALE.find(x => x.id === id) || SKALE[0];
  document.documentElement.style.setProperty("--skala", String(s.wartosc));
}

export function ustaw(id) {
  localStorage.setItem(KLUCZ, id);
  zastosuj(id);
}

/** Wywoływane na starcie każdego ekranu, przed pierwszym rysowaniem. */
export function wczytajSkale() {
  zastosuj(biezaca());
}
