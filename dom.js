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

/* =====================================================================
   KIM JESTEM PRZY TYM STOLE

   Apka od początku wie, KTO siada do stołu, i nigdy nie wiedziała, KTO trzyma
   ten telefon. Do niczego nie było to potrzebne: plan i lista są wspólne dla
   całego domu. Licznik to zmienia — „Twoje kalorie” nie mają się do czego
   odnieść, dopóki telefon nie wie, którym domownikiem jesteś (decyzja 78).

   Świadomie w pamięci telefonu, nie w bazie: to jest fakt o URZĄDZENIU, nie
   o stole. Dwie osoby przy jednym stole mają dwa telefony i każdy zna swojego
   właściciela. Telefon współdzielony przez dwoje ludzi ustawi się na jedną
   osobę i można to zmienić w Ustawieniach — nie udajemy, że rozwiązujemy
   przypadek, którego nie znamy.
   ===================================================================== */

const KLUCZ_JA = "forkast-ja";

/** Kim jestem — albo null, jeśli nikt jeszcze nie powiedział. */
export function ktoJestem(pamiec = globalThis.localStorage) {
  try { return pamiec?.getItem(KLUCZ_JA) || null; } catch { return null; }
}

/** Zapamiętuje wybór na tym telefonie. Zapis może się nie udać (Safari
    w trybie prywatnym) i to nie może wywalić ekranu — patrz pułapka 16. */
export function ustawKimJestem(id, pamiec = globalThis.localStorage) {
  try {
    if (id) pamiec?.setItem(KLUCZ_JA, id); else pamiec?.removeItem(KLUCZ_JA);
    return true;
  } catch { return false; }
}

/**
 * Czy zapamiętany wybór nadal ma sens.
 * Kogoś mogli usunąć ze stołu z drugiego telefonu — wtedy trzeba zapytać
 * jeszcze raz, zamiast liczyć kalorie osobie, której już nie ma.
 */
export function ktoJestemWsrod(domownicy = [], pamiec = globalThis.localStorage) {
  const id = ktoJestem(pamiec);
  return domownicy.some(d => d.id === id) ? id : null;
}
