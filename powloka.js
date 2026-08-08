/* =====================================================================
   POWŁOKA — to, co każdy ekran ma tak samo.

   Powstała po migracji na Tailwind + Alpine, żeby nagłówek, pasek nawigacji,
   tryb ciemny i skala tekstu istniały w jednym miejscu, a nie ośmiu.
   Wcześniej każda zmiana w pasku wymagała ośmiu edycji i za każdym razem
   któraś się rozjeżdżała.

   Zwraca zwykły obiekt, który ekran rozsypuje w swoim stanie. Ekran importuje
   Alpine jako moduł i startuje go sam — dzięki temu rejestracja danych zawsze
   wyprzedza start, niezależnie od kolejności skryptów w dokumencie.
   ===================================================================== */

import { obslugiwane, czyWlaczone, przelacz, nasluchuj, wlaczBlokadeEkranu } from "./ekran.js";

/* Pasek na dole: pięć pozycji to maksimum, przy którym podpisy zostają czytelne
   i cele dotykowe nie schodzą poniżej progu. Ustawienia zeszły stąd do zębatki
   w nagłówku — wchodzi się tam raz na jakiś czas, a dodawanie dania jest jedną
   z najczęstszych rzeczy i zasługuje na stałe miejsce. */
/* Ile polubionych dań odblokowuje resztę apki.

   Powód: jadłospis i zakupy liczą się z polubionych dań, więc przy zerze
   pokazują puste ekrany — a pusty ekran przy pierwszym wejściu czyta się
   jako „nie działa”, nie jako „jeszcze nic nie wybrałeś”.

   Trzy, nie dziesięć: chodzi o to, żeby człowiek zobaczył mechanizm, a nie
   przebrnął przez talię. Nikt nie musi oglądać wszystkich 101 dań. */
export const PROG_ODBLOKOWANIA = 3;

export const ZAKLADKI = [
  { id: "talia",     nazwa: "Dania",     plik: "talia.html" },
  { id: "jadlospis", nazwa: "Jadłospis", plik: "jadlospis.html" },
  { id: "zakupy",    nazwa: "Zakupy",    plik: "zakupy.html" },
  { id: "przepisy",  nazwa: "Przepisy",  plik: "przepisy.html" },
  { id: "dodaj",     nazwa: "Dodaj",     plik: "dodaj-z-ai.html" },
];

export const SKALE = [
  { id: "normalny", etykieta: "Normalny",    wartosc: 1 },
  { id: "duzy",     etykieta: "Duży",        wartosc: 1.15 },
  { id: "bardzo",   etykieta: "Bardzo duży", wartosc: 1.32 },
];

/* Motyw i skala ustawiane PRZED pierwszym rysowaniem — inaczej ekran mignie
   na jasno, zanim Alpine zdąży wystartować. Dlatego to zwykła funkcja
   wywoływana od razu, a nie część stanu Alpine. */
export function zastosujUstawieniaWygladu() {
  const zapisany = localStorage.getItem("forkast-motyw");
  const ciemny = zapisany ? zapisany === "ciemny"
                          : matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.toggle("dark", ciemny);

  const skala = SKALE.find(s => s.id === localStorage.getItem("forkast-skala")) || SKALE[0];
  document.documentElement.style.setProperty("--skala", String(skala.wartosc));
  return { ciemny, skala: skala.id };
}

/**
 * Zwraca zwykły obiekt z tym, co wspólne. Ekran rozsypuje go w swoim stanie:
 *
 *   Alpine.data("ekranZakupy", () => ({ ...danePowloki({...}), ...własne }))
 *
 * Tak jest prościej niż zagnieżdżać dwa x-data — zagnieżdżenie wymagałoby
 * sięgania do rodzica przez $data przy każdym odwołaniu do motywu czy toastu.
 */
export function danePowloki({ ekran, tytul, opis }) {
  const startowe = zastosujUstawieniaWygladu();
  return {
      /* Nagłówek i podtytuł każdego z ośmiu ekranów przechodzą przez bezSierot
         w jednym miejscu — dlatego nie ma tego w ośmiu plikach osobno. */
      ekran, tytul: bezSierot(tytul), opis: bezSierot(opis),
      bezSierot,
      zakladki: ZAKLADKI,
      ciemny: startowe.ciemny,
      skala: startowe.skala,
      skale: SKALE,

      /* Blokada wygaszania ekranu pojawia się tylko tam, gdzie przeglądarka
         ją obsługuje. W przeglądarce wbudowanej w WhatsAppa nie działa,
         a link pójdzie właśnie tym kanałem — dlatego zamiast pustego miejsca
         Ustawienia mówią o tym wprost. */
      /* Zakładki poza Daniami są zamknięte, dopóki nie ma z czego nic ułożyć.
         Ekran ustawia to przez ustawOdblokowanie() po odczycie preferencji. */
      odblokowane: true,
      brakujeDan: 0,

      ustawOdblokowanie(stan) {
        this.odblokowane = stan.odblokowane;
        this.brakujeDan = stan.brakuje;
      },

      zamknieta(id) {
        return !this.odblokowane && id !== "talia" && id !== "dodaj";
      },

      ekranObslugiwany: obslugiwane(),
      ekranSwieci: czyWlaczone(),
      toast: "",
      komunikat: "",

      initPowloka() {
        if (this.ekranObslugiwany) {
          wlaczBlokadeEkranu({ bezPrzycisku: true });
          nasluchuj(stan => { this.ekranSwieci = stan; });
        }
        this.$watch("ciemny", v => {
          document.documentElement.classList.toggle("dark", v);
          localStorage.setItem("forkast-motyw", v ? "ciemny" : "jasny");
        });
      },

      ustawSkale(id) {
        const s = SKALE.find(x => x.id === id) || SKALE[0];
        this.skala = s.id;
        document.documentElement.style.setProperty("--skala", String(s.wartosc));
        localStorage.setItem("forkast-skala", s.id);
      },

      async przelaczEkran() {
        await przelacz();
        this.mrugnij(this.ekranSwieci
          ? "Ekran nie zgaśnie, dopóki tu jesteś."
          : "Ekran gaśnie normalnie.");
      },

      /* Krótki komunikat na dole. Trafia też do aria-live, więc czytnik
         ekranu przeczyta go bez przejmowania fokusu. */
      mrugnij(tekst) {
        this.toast = tekst;
        this.komunikat = tekst;
        clearTimeout(this._t);
        this._t = setTimeout(() => { this.toast = ""; }, 2600);
      },
  };
}

/* =====================================================================
   ZAMYKANIE OKIENKA RUCHEM PALCA W DÓŁ

   Okienka wysuwane od dołu mają u góry poziomą kreskę — a ta kreska jest
   obietnicą, że da się je przeciągnąć. Bez obsługi gestu obietnica jest pusta,
   a przeciągnięcie w dół jest pierwszym odruchem każdego, kto używa telefonu.
   Zgłoszone 3 sierpnia po teście na iPhonie.

   Ciągniemy tylko wtedy, gdy zawartość jest przewinięta na sam początek —
   inaczej gest kolidowałby ze zwykłym przewijaniem długiego przepisu.

   Użycie w szablonie:
     x-data="przeciagany(() => arkusz = null)" x-bind="uchwyty"
   ===================================================================== */
export function zarejestrujPrzeciaganie(Alpine) {
  Alpine.data("przeciagany", (zamknij) => ({
    y: 0,
    start: null,
    ciagnie: false,

    get uchwyty() {
      return {
        [":style"]: () => this.y
          ? `transform:translateY(${this.y}px); transition:none`
          : "",

        ["@touchstart"]: (e) => {
          // tylko od samej góry zawartości
          this.ciagnie = this.$el.scrollTop <= 0;
          this.start = this.ciagnie ? e.touches[0].clientY : null;
          this.y = 0;
        },

        ["@touchmove"]: (e) => {
          if (!this.ciagnie || this.start === null) return;
          const d = e.touches[0].clientY - this.start;
          // tylko w dół; opór rośnie, żeby nie dało się wyciągnąć okienka w kosmos
          this.y = d > 0 ? d * 0.85 : 0;
        },

        ["@touchend"]: () => {
          /* 90 px to odległość, którą kciuk pokonuje świadomie. Poniżej okienko
             wraca na miejsce — przypadkowe drgnięcie nie zamyka. */
          if (this.y > 90) zamknij();
          this.y = 0;
          this.start = null;
          this.ciagnie = false;
        },
      };
    },
  }));
}


/* =====================================================================
   PASEK POSTĘPU I LICZNIK — komponenty Alpine

   Ekran podaje samą liczbę. Reszta — kiedy błysnąć przy przyroście, kiedy
   pokazać domknięcie, jak rozbić liczbę na przewijane cyfry — jest tutaj,
   żeby nie powtarzać tego na każdym ekranie.
   ===================================================================== */
export function zarejestrujPasek(Alpine) {

  Alpine.data("pasek", () => ({
    poprzednia: 0,
    przyrost: false,
    gotowe: false,
    _t1: null,
    _t2: null,

    /** Wywoływane przez ekran przy każdej zmianie wartości. */
    ustaw(nowa) {
      const wzrosla = nowa > this.poprzednia;
      const domknieta = nowa >= 100 && this.poprzednia < 100;
      this.poprzednia = nowa;

      /* Klasę trzeba zdjąć i nałożyć w następnej klatce, inaczej animacja
         nie odpali drugi raz — przeglądarka nie widzi zmiany. */
      if (wzrosla) {
        this.przyrost = false;
        requestAnimationFrame(() => { this.przyrost = true; });
        clearTimeout(this._t1);
        this._t1 = setTimeout(() => { this.przyrost = false; }, 300);
      }
      if (domknieta) {
        this.gotowe = false;
        requestAnimationFrame(() => { this.gotowe = true; });
        clearTimeout(this._t2);
        this._t2 = setTimeout(() => { this.gotowe = false; }, 520);
      }
    },
  }));

  /* Licznik: liczba rozbita na cyfry, każda w osobnym oknie z przewijaną
     kolumną 0–9. Przy zmianie z 9 na 10 dochodzi cyfra — wtedy kolumny
     przesuwają się, a nowa po prostu się pojawia. */
  Alpine.data("licznik", () => ({
    get cyfry() {
      return String(this.wartoscLicznika ?? 0).split("").map(Number);
    },
  }));
}

/* Dźwięk generowany w przeglądarce — nic nie waży i działa bez sieci. */
export function ding() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    const o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.frequency.setValueAtTime(880, c.currentTime);
    o.frequency.setValueAtTime(1320, c.currentTime + 0.09);
    g.gain.setValueAtTime(0.16, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.45);
    o.start(); o.stop(c.currentTime + 0.45);
  } catch { /* wyciszony telefon — nic się nie dzieje */ }
  navigator.vibrate?.([40, 60, 40]);
}

/* =====================================================================
   SIEROTY — twarda spacja po jednoliterowych wyrazach.

   W polskim składzie „a”, „i”, „o”, „u”, „w”, „z” nie zostają na końcu
   wiersza. Do 8 sierpnia w całym kodzie nie było ani jednej twardej spacji,
   a nazwy dań i teksty pomocy łamią się w wąskich kolumnach dziesiątki razy
   na ekran — to najbardziej widoczny sygnał, że coś nie było składane po polsku.

   Działa przy WYŚWIETLANIU, nie przy zapisie: dzięki temu obejmuje też dania
   dodane przez AI i wpisane ręcznie przez użytkownika, których nie widzieliśmy
   na oczy. Nic nie zapisujemy w tej postaci do bazy — twarda spacja żyje
   wyłącznie w tym, co widać na ekranie.

   Wzorzec celowo wymaga spacji ALBO początku tekstu przed literą, żeby nie
   złapać końcówki wyrazu: w „mąka i woda” łapie „i”, w „mąka” nie łapie „a”.
   ===================================================================== */
export function bezSierot(tekst) {
  if (typeof tekst !== "string") return tekst;
  return tekst.replace(/(^|\s)([aiouwzAIOUWZ])\s+/g, "$1$2 ");
}
