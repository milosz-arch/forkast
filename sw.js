/* =====================================================================
   Warstwa offline.

   Strategia odziedziczona po Dietce: NAJPIERW SIEĆ, pamięć podręczna jako
   koło zapasowe. Odwrotnie byłoby szybciej, ale wtedy po wgraniu nowej wersji
   telefon pokazywałby starą aż do wyczyszczenia danych przeglądarki — a nie ma
   tu nikogo, kto by to rozpoznał i naprawił.

   Zapytania do Firebase, do Google i do własnej funkcji przechodzą nietknięte:
   dane na żywo nie mają czego szukać w pamięci podręcznej, a odpowiedź AI
   zapisana z poprzedniego razu byłaby wręcz szkodliwa.
   ===================================================================== */
const CACHE = "forkast-v45";
const SZKIELET = [
  "./index.html", "./talia.html", "./jadlospis.html", "./zakupy.html",
  "./przepisy.html", "./ustawienia.html", "./formularz.html", "./dodaj-z-ai.html",
  "./styl.css", "./manifest.json", "./ikona.svg", "./ikona-180.png", "./ikona-192.png", "./ikona-512.png",
  "./favicon-32.png", "./ikony.html",
  "./lib/tailwind.js", "./lib/alpine-esm.js", "./lib/alpine-collapse-esm.js",
  "./powloka.js", "./baza.js", "./instalacja.js", "./wersja.js", "./postep.js", "./spizarnia.js", "./czas.js", "./kuchnie.js", "./pomoc.js", "./pomoc.html", "./ekran.js", "./tekst.js", "./kuchnia.js",
  "./dom.js", "./rytm.js", "./automat.js", "./zakupy.js", "./wykluczenia.js",
  "./parser.js", "./prompt.js", "./formularz.js",
  "./produkty.js", "./talia-startowa.js"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(SZKIELET.map(p => c.add(p))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;              // Firebase, gstatic — przepuszczamy
  if (url.pathname.startsWith("/.netlify/")) return;       // funkcja AI — nigdy z pamięci
  e.respondWith(
    /* cache: "reload" pomija pamięć podręczną SAMEJ PRZEGLĄDARKI. Bez tego
       fetch() mógł zwrócić stary plik, nie pytając serwera — czyli strategia
       „najpierw sieć” tylko udawała, że pyta o sieć. */
    fetch(e.request, { cache: "reload" })
      .then(r => {
        const kopia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, kopia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || Promise.reject("offline")))
  );
});
