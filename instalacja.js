/* =====================================================================
   DODANIE DO EKRANU GŁÓWNEGO

   Problem, którego nie widać, dopóki nie wyśle się linku komuś: Forkast jest
   PWA, więc MOŻE mieć własną ikonę i działać bez paska przeglądarki — ale
   nikt tego nie zrobi, jeśli mu się nie powie. Link przyjdzie WhatsAppem,
   otworzy się w przeglądarce i tam zostanie, razem z paskiem adresu
   zabierającym jedną piątą ekranu.

   Dwa systemy, dwie zupełnie różne drogi:

   Android/Chrome — przeglądarka sama zgłasza gotowość zdarzeniem
   `beforeinstallprompt`. Przechwytujemy je i pokazujemy własny przycisk,
   bo systemowy pasek bywa ignorowany jako reklama.

   iOS/Safari — nie ma żadnego API. Jedyna droga to Udostępnij → Dodaj do
   ekranu początkowego, więc trzeba to napisać słowami i pokazać, gdzie
   szukać. Dlatego tekst jest inny na obu systemach.

   Kiedy pokazujemy: nie przy pierwszym wejściu, bo wtedy człowiek jeszcze
   nie wie, czy chce tę apkę. Dopiero gdy zdążył coś w niej zrobić.
   ===================================================================== */

const KLUCZ_ODRZUCONO = "forkast-instalacja-odrzucona";
const KLUCZ_WEJSC = "forkast-wejsc";

function jestIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    // iPad od iPadOS 13 podaje się za Maca, ale ma dotyk — po tym go poznajemy
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function jestSafari() {
  return /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);
}

/** Apka uruchomiona z ekranu głównego — wtedy nie ma o czym mówić. */
export function juzZainstalowana() {
  return matchMedia("(display-mode: standalone)").matches
    || navigator.standalone === true;
}

/**
 * Zwraca opis tego, co pokazać, albo null gdy nie ma czego.
 * Sam nie rysuje niczego — o wygląd dba ekran.
 */
export function stanInstalacji() {
  if (juzZainstalowana()) return null;
  if (localStorage.getItem(KLUCZ_ODRZUCONO)) return null;

  // Trzecie wejście: człowiek zdążył zobaczyć, po co mu ta apka.
  const wejsc = Number(localStorage.getItem(KLUCZ_WEJSC) || 0) + 1;
  localStorage.setItem(KLUCZ_WEJSC, String(wejsc));
  if (wejsc < 3) return null;

  if (jestIOS()) {
    return jestSafari()
      ? {
          system: "ios",
          tytul: "Dodaj Forkast do ekranu",
          tresc: "Dotknij ikony udostępniania na dole, a potem „Dodaj do ekranu początkowego”. " +
                 "Forkast będzie wtedy wyglądał jak zwykła aplikacja — bez paska adresu.",
        }
      : {
          system: "ios-inna",
          tytul: "Otwórz w Safari",
          tresc: "Żeby dodać Forkast do ekranu, otwórz go w Safari — inne przeglądarki " +
                 "na iPhonie tego nie potrafią.",
        };
  }
  return { system: "android", tytul: "Dodaj Forkast do ekranu",
           tresc: "Będzie wyglądał jak zwykła aplikacja i otworzy się jednym dotknięciem." };
}

export function odrzuc() {
  localStorage.setItem(KLUCZ_ODRZUCONO, "1");
}

/* Android: przechwytujemy systemową propozycję i trzymamy ją, żeby pokazać
   we własnym momencie. Musi być zarejestrowane od razu — zdarzenie leci raz. */
let odlozonaPropozycja = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  odlozonaPropozycja = e;
});

/** Zwraca true, gdy człowiek zgodził się zainstalować. */
export async function zainstaluj() {
  if (!odlozonaPropozycja) return false;
  odlozonaPropozycja.prompt();
  const { outcome } = await odlozonaPropozycja.userChoice;
  odlozonaPropozycja = null;
  if (outcome === "accepted") localStorage.setItem(KLUCZ_ODRZUCONO, "1");
  return outcome === "accepted";
}

export function mamyPropozycje() { return odlozonaPropozycja !== null; }
