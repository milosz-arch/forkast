/* =====================================================================
   DOM — kod zamiast konta, i domownicy.

   Wzorem dane.js z Dietki: tu żyją tylko czyste funkcje. Zapis do Firebase
   (jaki dokładnie węzeł, kiedy tworzyć nowy dom, kiedy dołączać do
   istniejącego) dzieje się w ekranie wejścia, nie tutaj — dopóki nie ma
   projektu Firebase dla Posiłkosa, nie ma się gdzie podłączyć (decyzja 16).

   Jeden adres dla wszystkich, kod domu wskazuje gałąź w bazie, zero
   logowania (decyzja 3). Dom może mieć jedną osobę albo więcej — dom
   jednoosobowy to szczególny przypadek, nie osobny tryb, i nie ma górnego
   limitu (decyzja 7).
   ===================================================================== */

// 36 znaków (0-9, A-Z) → 36^6 = ok. 2,18 mld kombinacji. To dokładnie ta
// liczba, którą decyzja 3 pokazała jako akceptowalne ryzyko — jeśli kiedyś
// zmienimy alfabet (np. wyrzucimy mylące 0/O, 1/I), trzeba przeliczyć od nowa
// i zaktualizować DECYZJE.md, bo tam stoi konkretna liczba, nie "dużo".
const ALFABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Nowy kod domu. `losuj` jest wstrzykiwalny, żeby dało się przetestować
 * deterministycznie — domyślnie Math.random.
 */
export function generujKodDomu(losuj = Math.random) {
  let kod = "";
  for (let i = 0; i < 6; i++) kod += ALFABET[Math.floor(losuj() * ALFABET.length)];
  return kod;
}

/** Ktoś wpisze kod małymi literami albo ze spacją na końcu — to naprawiamy tu,
 *  w jednym miejscu, zamiast w każdym ekranie osobno. */
export function znormalizujKod(kod) {
  return String(kod ?? "").trim().toUpperCase();
}

export function kodPoprawny(kod) {
  return /^[0-9A-Z]{6}$/.test(znormalizujKod(kod));
}

/* ---------------------------------------------------------------------
   Domownicy — imiona, bez górnego limitu (STAN.md, zakres pierwszej
   wersji). Żadnego zakładania, że jest ich dokładnie dwoje, że jedno
   nazywa się tak a drugie tak, że ktoś je śniadania sam.
   --------------------------------------------------------------------- */

function domyslneId() {
  return "d" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36);
}

/** @throws jeśli imię jest puste — to jedyny warunek, więcej nie zakładamy */
export function nowyDomownik(imie, generujId = domyslneId) {
  const czyste = String(imie ?? "").trim();
  if (!czyste) throw new Error("Domownik musi mieć imię.");
  return { id: generujId(), imie: czyste };
}

/** Zwraca NOWĄ tablicę — domownicy w bazie to stan, który ekran potem
 *  całościowo zapisuje przez set(), więc funkcje tutaj nie mutują niczego. */
export function dodajDomownika(domownicy, imie, generujId = domyslneId) {
  return [...domownicy, nowyDomownik(imie, generujId)];
}

export function usunDomownika(domownicy, id) {
  return domownicy.filter(d => d.id !== id);
}

export function zmienImie(domownicy, id, imie) {
  const czyste = String(imie ?? "").trim();
  if (!czyste) throw new Error("Imię nie może być puste.");
  return domownicy.map(d => (d.id === id ? { ...d, imie: czyste } : d));
}
