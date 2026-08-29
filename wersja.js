/* =====================================================================
   WERSJA KSZTAŁTU DANYCH — nie wersja aplikacji.

   Podnosimy ją tylko wtedy, gdy zmienia się STRUKTURA tego, co leży w bazie:
   gdy „siatka” przestanie być tablicą, gdy posiłek dostanie nowe wymagane pole,
   gdy okres zacznie być zapisywany inaczej. Zmiana wyglądu, tekstu czy nowe
   danie w talii nie mają z tym nic wspólnego.

   Po co to w ogóle jest: telefony aktualizują się w różnym tempie. Jeden ma
   świeży service worker, drugi trzyma stare pliki w pamięci, trzeci ma otwartą
   kartę od tygodnia. Bez tego pola nowsza wersja apki zapisze dane w nowym
   kształcie, starsza odczyta je po staremu i po cichu zepsuje komuś tydzień
   planowania. Z tym polem starsza wersja wie, że ma poprosić o odświeżenie.

   Dlaczego osobny plik, a nie powloka.js: powloka.js sięga do API przeglądarki
   (Wake Lock, localStorage), więc nie da się jej wczytać w teście uruchamianym
   w Node. Czysta logika musi mieszkać tam, gdzie da się ją sprawdzić.
   ===================================================================== */

export const WERSJA_DANYCH = 1;

/**
 * @param {object} zapisane – to, co przyszło z bazy
 * @returns {string|null} komunikat dla użytkownika albo null, gdy wszystko gra
 */
export function sprawdzWersje(zapisane) {
  /* Brak pola = wszystko, co zapisano przed jego wprowadzeniem. Musi dalej
     działać, inaczej wersjonowanie zepsułoby to, przed czym miało chronić. */
  const w = zapisane?.wersja ?? 1;
  return w > WERSJA_DANYCH
    ? "Ktoś przy stole ma nowszą wersję aplikacji. Odśwież stronę, żeby nie nadpisać jego zmian."
    : null;
}


/* Numer wydania — inny niż WERSJA_DANYCH. Ten zmienia się przy KAŻDYM wdrożeniu
   i służy do jednego: żeby dało się zapytać człowieka „co masz na dole Ustawień”
   i wiedzieć, czy patrzy na to samo co my.

   Bez tego diagnoza problemu „mam starą wersję” polega na zgadywaniu. Ma być zgodny
   z numerem CACHE w sw.js. */
export const WYDANIE = "v65";
