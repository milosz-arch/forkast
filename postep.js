/* =====================================================================
   PIERWSZE KROKI — kiedy reszta aplikacji ma się otworzyć.

   Problem, którego nie widać, dopóki nie da się apki komuś nowemu: człowiek
   wchodzi, widzi pięć zakładek, klika w Jadłospis i dostaje pustą siatkę.
   Klika w Zakupy — pusto. W Przepisy — pusto. Nie dowiaduje się z tego, że
   wszystko buduje się z dań, które najpierw trzeba polubić. Dowiaduje się, że
   apka nie działa.

   Dlatego pozostałe zakładki są zamknięte, dopóki nie ma z czego nic ułożyć.
   Nie jest to blokada dla blokady: przy zerze polubionych jadłospis fizycznie
   nie ma czego wstawić w dzień.

   DWA WYJŚCIA AWARYJNE, bez których to byłaby pułapka:

   1. Własne dania liczą się tak samo. Ktoś, kto woli wpisać pięć swoich
      przepisów niż przeglądać cudze, ma tę samą drogę.

   2. Po przejrzeniu 40 dań otwiera się i tak. Wegetarianin, któremu talia
      skurczyła się po wykluczeniach, albo ktoś, komu po prostu nic nie pasuje,
      nie może zostać zamknięty na zawsze przed resztą aplikacji.

   Liczba 10 nie jest z badań — jest z arytmetyki: przy pięciu posiłkach dziennie
   i tygodniowym okresie dziesięć dań pozwala ułożyć plan z powtórkami, ale bez
   jedzenia tego samego trzy razy pod rząd. Do zmiany, gdy pierwsze osoby powiedzą,
   czy to za dużo, czy za mało.
   ===================================================================== */

import { TALIA_STARTOWA } from "./talia-startowa.js";
import { filtrujTalie } from "./wykluczenia.js";
import { PO_POLSKU } from "./tlumaczenia.js";

export const POTRZEBA_DAN = 10;
export const OTWORZ_PO_PRZEJRZANYCH = 40;

/**
 * @param {object} preferencje – zawartość domy/<kod>/preferencje
 * @returns {{polubione:number, przejrzane:number, odblokowane:boolean, brakuje:number}}
 */
export function stanPoczatkowy(preferencje = {}, wykluczenia = null) {
  const wartosci = Object.values(preferencje || {});
  const polubione = wartosci.filter(v => v === "lubie").length;
  const przejrzane = wartosci.length;
  return {
    polubione,
    przejrzane,
    odblokowane: polubione >= POTRZEBA_DAN || przejrzane >= OTWORZ_PO_PRZEJRZANYCH,
    brakuje: Math.max(0, POTRZEBA_DAN - polubione),
    doOceny: daniaDoOceny(preferencje, wykluczenia),
  };
}

/* Ile dań startowych czeka na ocenę — liczone po wykluczeniach, tak samo jak talia
   na ekranie Dań: dom bez mięsa nigdy nie „przejrzy” schabowego, więc schabowy
   nie może trzymać karty Dań na pasku (decyzja 115). `wykluczenia` w kształcie
   z bazy ({ ustawione, lista }) albo goła lista; null = nie wiadomo → null,
   a pasek pokazuje wtedy kartę (bezpieczniej pokazać niż schować). */
export function daniaDoOceny(preferencje = {}, wykluczenia = null) {
  if (wykluczenia == null) return null;
  const lista = Array.isArray(wykluczenia) ? wykluczenia : (wykluczenia?.lista || []);
  return filtrujTalie(TALIA_STARTOWA, lista).filter(d => !(preferencje || {})[d.id]).length;
}

/** Tekst zachęty pod paskiem postępu. Ma mówić, PO CO to robimy.
    `t` podaje ekran (zna język stołu); bez niego wychodzi polski — tak wołają testy. */
export function zachetaPoczatkowa(stan, t = PO_POLSKU) {
  if (stan.odblokowane) return "";
  if (stan.polubione === 0)
    return t("Zaznacz {ile} dań, które lubicie jeść — z nich apka ułoży jadłospis i policzy zakupy. Nie musisz przeglądać wszystkich, wystarczy pierwsze, które pasują.", { ile: POTRZEBA_DAN });
  return stan.brakuje === 1
    ? t("Jeszcze jedno danie i otworzy się jadłospis.")
    : t("Jeszcze {ile} dania i otworzy się jadłospis.", { ile: stan.brakuje });
}

/** Wersja na jedną linię — do paska przyklejonego na górze, gdzie nie ma miejsca. */
export function zachetaKrotka(stan, t = PO_POLSKU) {
  if (stan.odblokowane) return "";
  if (stan.polubione === 0) return t("Zaznacz dania, które lubicie jeść");
  return stan.brakuje === 1
    ? t("Jeszcze jedno i otworzy się jadłospis")
    : t("Jeszcze {ile} do otwarcia jadłospisu", { ile: stan.brakuje });
}
