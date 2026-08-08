/* =====================================================================
   POŁĄCZENIE Z BAZĄ

   Firebase ładowany DYNAMICZNIE, nie importem na górze modułu ekranu.

   Powód jest konkretny i kosztował biały ekran u realnego użytkownika:
   SDK leży na gstatic.com, a nasz service worker cache'uje wyłącznie własną
   domenę — więc offline (albo przy zerwanym pobraniu) tego pliku po prostu nie ma.
   Przy imporcie statycznym nieudane pobranie zabija CAŁY moduł ekranu: Alpine
   nigdy nie startuje, `x-cloak` nigdy nie schodzi, a człowiek dostaje białą
   stronę bez jednego przycisku.

   Przy imporcie dynamicznym najgorsze, co się dzieje, to `null` — ekran działa
   dalej, pokazuje to, co ma w pamięci telefonu, i mówi wprost, że nie ma sieci.

   Ta sama zasada dotyczy każdej zewnętrznej zależności: nic spoza naszej domeny
   nie ma prawa być warunkiem uruchomienia ekranu.
   ===================================================================== */

const USTAWIENIA = {
  databaseURL: "https://forkast-37ffd-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "forkast-37ffd",
};

const ZRODLO = "https://www.gstatic.com/firebasejs/10.12.2";

/* Jedno połączenie na kartę — kolejne wywołania dostają to samo.
   Bez tego każdy ekran inicjalizowałby aplikację Firebase od nowa. */
let obietnica = null;

/**
 * @returns {Promise<object|null>} zestaw funkcji bazy albo null, gdy się nie udało
 */
export function polaczZBaza() {
  if (obietnica) return obietnica;

  obietnica = (async () => {
    try {
      const [modApp, modDb] = await Promise.all([
        import(`${ZRODLO}/firebase-app.js`),
        import(`${ZRODLO}/firebase-database.js`),
      ]);
      const app = modApp.initializeApp(USTAWIENIA);
      return {
        db: modDb.getDatabase(app),
        ref: modDb.ref,
        get: modDb.get,
        set: modDb.set,
        remove: modDb.remove,
        push: modDb.push,
        update: modDb.update,
        onValue: modDb.onValue,
      };
    } catch (e) {
      console.warn("Nie udało się połączyć z bazą:", e);
      /* Zerujemy, żeby kolejne wejście spróbowało od nowa — sieć mogła wrócić. */
      obietnica = null;
      return null;
    }
  })();

  return obietnica;
}

/** Kod stołu z pamięci przeglądarki. Null, gdy ta przeglądarka go nie zna. */
export function kodStolu() {
  return localStorage.getItem("forkast-dom");
}

/* Ekran bez stołu nie ma czego pokazać, ale natychmiastowe przekierowanie daje
   brzydkie mignięcie i nie mówi, co się stało. Częsty przypadek: ktoś dostał link
   do konkretnego ekranu albo otworzył apkę w innej przeglądarce, gdzie pamięć
   jest osobna. */
export function pokazBrakStolu() {
  document.body.removeAttribute("x-cloak");
  document.body.innerHTML = `
    <div class="flex h-dvh flex-col items-center justify-center gap-5 px-8 text-center">
      <p class="text-[0.6rem] font-extrabold uppercase tracking-[0.24em] text-emerald-700
                dark:text-emerald-400">Forkast</p>
      <h1 class="text-2xl font-bold">Najpierw usiądź do stołu</h1>
      <p class="max-w-[34ch] text-stone-500 dark:text-stone-400">
        Ta przeglądarka nie wie jeszcze, do którego stołu należysz. Załóż nowy
        albo wpisz kod, który ktoś Ci wysłał.
      </p>
      <a href="index.html"
         class="flex min-h-[52px] w-full max-w-xs items-center justify-center rounded-xl
                bg-emerald-700 px-5 font-bold text-white no-underline dark:bg-emerald-600">
        Przejdź do stołu
      </a>
    </div>`;
}
