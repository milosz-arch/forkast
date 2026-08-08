/* =====================================================================
   EKRAN — trzyma telefon obudzony, dopóki apka jest na wierzchu.

   Po co: kto pcha wózek w sklepie albo ma ręce w cieście, nie odblokowuje
   telefonu co trzydzieści sekund. To jest ten rodzaj rzeczy, której nie widać
   w żadnych badaniach ani testach — widać ją dopiero przy wózku i przy garnku.

   Jak to działa: przeglądarka daje "wake lock", który znika sam, gdy apka
   schodzi w tło albo telefon jest zablokowany. Dlatego prosimy o niego
   ponownie za każdym powrotem — inaczej po pierwszym przełączeniu na WhatsAppa
   i z powrotem ekran znowu gaśnie i nikt nie wie dlaczego.

   Czego to NIE robi: nie trzyma ekranu, gdy apka jest w tle (przeglądarka na to
   nie pozwala i słusznie), i nie działa na starszych telefonach. Przełącznik
   sam się chowa tam, gdzie nie ma czego włączać — obietnica, której nie da się
   dotrzymać, jest gorsza od jej braku.
   ===================================================================== */

const KLUCZ = "forkast-ekran-swieci";

let blokada = null;
let wlaczone = localStorage.getItem(KLUCZ) !== "nie";   // domyślnie tak

/* Przełączników jest dwa — opisany w Ustawieniach i skrót w nagłówku — a stan
   jeden. Każdy z nich zgłasza się tutaj i dostaje powiadomienie o zmianie,
   więc nie da się doprowadzić do sytuacji, w której jeden mówi „świeci”,
   a drugi „gaśnie”. Tak właśnie wyglądało to przed poprawką. */
const obserwatorzy = new Set();
function powiadom() { for (const f of obserwatorzy) f(wlaczone); }

export function obslugiwane() {
  return "wakeLock" in navigator;
}

async function wez() {
  if (!obslugiwane() || !wlaczone || blokada) return;
  try {
    blokada = await navigator.wakeLock.request("screen");
    // Przeglądarka zwalnia blokadę sama przy zejściu w tło — zapamiętujemy to,
    // żeby przy powrocie wiedzieć, że trzeba poprosić od nowa.
    blokada.addEventListener("release", () => { blokada = null; });
  } catch {
    // Odmowa (bateria, ustawienia systemu) nie jest błędem, o którym trzeba krzyczeć.
    blokada = null;
  }
}

async function oddaj() {
  try { await blokada?.release(); } catch { /* i tak zwolniona */ }
  blokada = null;
}

export function czyWlaczone() { return wlaczone; }

/**
 * Przełącza ustawienie z zewnątrz (z ekranu Ustawień).
 * @returns {boolean} nowy stan
 */
export async function przelacz() {
  wlaczone = !wlaczone;
  localStorage.setItem(KLUCZ, wlaczone ? "tak" : "nie");
  if (wlaczone) await wez(); else await oddaj();
  powiadom();
  return wlaczone;
}

/** Zgłasza przełącznik do odświeżania. Zwraca funkcję wypisującą. */
export function nasluchuj(fn) {
  obserwatorzy.add(fn);
  fn(wlaczone);            // od razu ustaw właściwy stan, nie czekaj na pierwszą zmianę
  return () => obserwatorzy.delete(fn);
}

/**
 * Wpina skrót w nagłówek i uruchamia blokadę, jeśli włączona.
 * Wywoływane raz na każdym ekranie.
 *
 * Skrót pojawia się tylko tam, gdzie blokada naprawdę działa. Pełne, opisane
 * ustawienie stoi osobno w Ustawieniach i jest widoczne zawsze — także wtedy,
 * gdy przeglądarka tego nie potrafi, bo wtedy trzeba to powiedzieć wprost,
 * a nie zostawić człowieka z pustym miejscem i domysłami.
 */
export function wlaczBlokadeEkranu(opcje = {}) {
  if (!obslugiwane()) return;

  /* Po migracji na Alpine przycisk rysuje szablon, nie ten moduł — wtedy
     wystarczy sama blokada i nasłuch. Stary tryb (wstrzykiwanie przycisku
     do .hero) zostaje, żeby nie psuć ekranów jeszcze nieprzepisanych. */
  if (opcje.bezPrzycisku) {
    wez();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") wez();
    });
    return;
  }

  const hero = document.querySelector(".hero");
  if (!hero) return;

  const przycisk = document.createElement("button");
  przycisk.className = "swiec";
  przycisk.type = "button";
  odswiezWyglad(przycisk);

  przycisk.onclick = () => przelacz();
  nasluchuj(() => odswiezWyglad(przycisk));

  hero.appendChild(przycisk);

  wez();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") wez();
  });
}

function odswiezWyglad(przycisk) {
  przycisk.classList.toggle("on", wlaczone);
  // Słowo obok ikony, nie sama ikona: sam symbol nie mówi, co się stanie po
  // dotknięciu, a przy słabszym wzroku sam kolor też nie wystarcza.
  przycisk.innerHTML = wlaczone
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.4 5.4l1.9 1.9M16.7 16.7l1.9 1.9M18.6 5.4l-1.9 1.9M7.3 16.7l-1.9 1.9"/></svg><span>Ekran świeci</span>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.6 8.6 0 0 1 9.8 3.5a8.6 8.6 0 1 0 10.7 10.7z"/></svg><span>Ekran gaśnie</span>`;
  przycisk.setAttribute("aria-pressed", String(wlaczone));
  przycisk.title = wlaczone
    ? "Ekran nie gaśnie, dopóki tu jesteś. Dotknij, żeby wyłączyć."
    : "Ekran gaśnie normalnie. Dotknij, żeby świecił.";
}
