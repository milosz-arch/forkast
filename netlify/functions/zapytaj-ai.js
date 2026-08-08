/* =====================================================================
   ZAPYTAJ-AI — jedyne miejsce, gdzie GEMINI_API_KEY istnieje. Prompt
   powstaje po stronie klienta (prompt.js, bez zmian) — ta funkcja tylko
   przekazuje go do Gemini i zwraca surowy tekst odpowiedzi. Parsowanie
   (parser.js) też zostaje po stronie klienta, bez zmian.

   Rozszerzenie decyzji 6, zaproponowane przez Miłosza 3 sierpnia: apka
   sama rozmawia z jednym, konkretnym AI (Gemini), zamiast każdego
   dowolnego przez kopiuj-wklej. Powód: część osób (np. rodzina mniej
   biegła w telefonie) nie zrobi ręcznego kopiowania w ogóle — dla nich
   ta ścieżka była martwa, niezależnie od tego, jak dobry był parser.

   Koszt: zero, dopóki projekt Google Cloud, w którym żyje klucz, nie ma
   podanej karty płatniczej — wtedy przekroczenie darmowego limitu daje
   błąd 429, nie rachunek. To ustalone świadomie z Miłoszem, nie założenie.
   ===================================================================== */

/* Nazwy modeli Gemini zmieniają się między wersjami API i ta sama nazwa potrafi
   działać pod jedną wersją, a zwracać 404 pod inną. Zamiast wpisywać jedną nazwę
   na sztywno i modlić się, próbujemy po kolei — pierwsza, która odpowie, wygrywa.

   Pierwszeństwo ma zmienna środowiskowa GEMINI_MODEL (format: "wersja:nazwa",
   np. "v1beta:gemini-flash-latest"). Dzięki temu zmiana modelu po stronie Google
   to przestawienie jednej wartości w panelu Netlify, bez wdrażania paczki na nowo.
   Lista poniżej jest tylko zapasem, gdyby zmiennej nie było.

   Pro celowo nie ma na liście — na darmowym pułapie ma kilkadziesiąt zapytań dziennie
   zamiast kilkuset i wyczerpałby limit pierwszego wieczoru po wysłaniu linku. */
const MODELE_ZAPASOWE = [
  { wersja: "v1beta", nazwa: "gemini-flash-latest" },
  { wersja: "v1beta", nazwa: "gemini-2.5-flash" },
  { wersja: "v1",     nazwa: "gemini-2.5-flash" },
  { wersja: "v1beta", nazwa: "gemini-2.0-flash" },
  { wersja: "v1beta", nazwa: "gemini-2.5-flash-lite" },
];

function modeleDoProby() {
  const zUstawien = (process.env.GEMINI_MODEL || "").trim();
  if (!zUstawien) return MODELE_ZAPASOWE;
  const [wersja, nazwa] = zUstawien.split(":");
  if (!wersja || !nazwa) return MODELE_ZAPASOWE;   // źle wpisana wartość nie może zabić apki
  // Ustawiony model idzie pierwszy, reszta zostaje jako siatka bezpieczeństwa.
  return [{ wersja, nazwa }, ...MODELE_ZAPASOWE];
}

const MAKS_ZDJEC = 4;   // patrz komentarz w dodaj-z-ai.html: limit 10 s na odpowiedź

/* Ile zapytań do AI może zrobić jeden dom w ciągu doby. Trzydzieści to czterokrotność
   szacowanego użycia w pierwszym tygodniu (pięć domów × ~10 dań), a przy pięciu domach
   nadal mieści się w darmowym limicie Gemini z dużym zapasem. */
const LIMIT_NA_DOM_NA_DOBE = 30;

const BAZA = "https://forkast-37ffd-default-rtdb.europe-west1.firebasedatabase.app";

const adresModelu = (m) =>
  `https://generativelanguage.googleapis.com/${m.wersja}/models/${m.nazwa}:generateContent`;

/** Dzisiejsza data jako klucz — licznik sam się zeruje o północy, bez sprzątania. */
const dzisiaj = () => new Date().toISOString().slice(0, 10);

/**
 * Sprawdza, czy dom istnieje i czy nie przekroczył dziennego limitu; podnosi licznik.
 *
 * Ograniczenie, świadome: funkcja nie ma uprawnień administratora do bazy (to wymagałoby
 * klucza serwisowego), więc licznik leży pod ścieżką domu i osoba znająca własny kod
 * może go teoretycznie wyzerować z konsoli przeglądarki. Przed kimś z zewnątrz chroni
 * w pełni — bo bez znajomości kodu nie przejdzie nawet pierwszego sprawdzenia.
 *
 * @returns {null} gdy wszystko w porządku, albo obiekt { status, blad } do zwrócenia
 */
async function sprawdzDom(kodDomu) {
  const kod = String(kodDomu ?? "").trim().toUpperCase();
  if (!/^[0-9A-Z]{6}$/.test(kod)) {
    return { status: 403, blad: "Brak poprawnego kodu stołu." };
  }

  const istnieje = await fetch(`${BAZA}/domy/${kod}/utworzono.json`);
  if (!istnieje.ok) return { status: 403, blad: "Nie mogę zweryfikować stołu." };
  if ((await istnieje.json()) == null) {
    return { status: 403, blad: "Nie ma takiego stołu." };
  }

  const sciezka = `${BAZA}/domy/${kod}/limity/${dzisiaj()}.json`;
  const licznikOdp = await fetch(sciezka);
  const uzyte = licznikOdp.ok ? ((await licznikOdp.json()) || 0) : 0;

  if (uzyte >= LIMIT_NA_DOM_NA_DOBE) {
    return { status: 429, blad:
      `Ten stół wykorzystał dziś ${LIMIT_NA_DOM_NA_DOBE} zapytań do AI. Licznik zeruje się o północy — ` +
      `do tego czasu możesz dodać danie ręcznie przez formularz.` };
  }

  // Podnosimy licznik PRZED wywołaniem AI: lepiej policzyć zapytanie, które padło,
  // niż nie policzyć takiego, które przeszło.
  await fetch(sciezka, { method: "PUT", body: JSON.stringify(uzyte + 1) });
  return null;
}

exports.handler = async (event) => {
  const naglowki = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: naglowki, body: "" };
  }

  const klucz = process.env.GEMINI_API_KEY;
  if (!klucz) {
    return { statusCode: 500, headers: naglowki, body: JSON.stringify({ blad: "Serwer nie ma skonfigurowanego klucza API." }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: naglowki, body: JSON.stringify({ blad: "Tylko POST." }) };
  }

  /* Adres tej funkcji jest publiczny, a za nią stoi klucz Miłosza — bez żadnej kontroli
     ktokolwiek, kto pozna adres (a link pójdzie WhatsAppem i może być przesłany dalej),
     mógłby jej używać jako darmowego dostępu do Gemini i wyczerpać dzienny limit,
     zanim zrobią to znajomi.

     Sprawdzamy więc, czy zapytanie przyszło z naszej własnej strony. To NIE jest mocne
     zabezpieczenie — nagłówek Origin da się podrobić narzędziem spoza przeglądarki —
     ale odcina przypadkowe i leniwe użycie, czyli realny scenariusz przy pięciu domach.
     Mocniejsza wersja (limit na kod domu) wymaga sięgnięcia z funkcji do Firebase
     i jest osobnym zadaniem. */
  const zrodlo = event.headers?.origin || event.headers?.Origin || "";
  const skad = event.headers?.referer || event.headers?.Referer || "";
  const host = event.headers?.host || event.headers?.Host || "";

  /* Poprzednia wersja miała lukę: warunek brzmiał `host && zrodlo && !pasuje`,
     więc gdy Origin w ogóle nie przyszedł — a curl domyślnie go nie wysyła —
     całe sprawdzenie było pomijane. Warstwa opisana jako „do podrobienia" była
     w praktyce do OMINIĘCIA, co jest znacznie łatwiejsze.

     Nie odrzucamy jednak po samym braku Origin, bo link pójdzie WhatsAppem,
     a jego wbudowana przeglądarka nie jest zwykłą przeglądarką i nie ma pewności,
     co wysyła. Przepuszczamy więc też zapytania z pasującym Referer — curl bez
     argumentów nie wysyła ŻADNEGO z tych dwóch nagłówków, więc odpada,
     a prawdziwa przeglądarka wysyła przynajmniej jeden. */
  const zZewnatrz = (naglowek) => naglowek && !naglowek.includes(host);
  const brakObu = !zrodlo && !skad;
  if (host && (brakObu || zZewnatrz(zrodlo) || (!zrodlo && zZewnatrz(skad)))) {
    return { statusCode: 403, headers: naglowki, body: JSON.stringify({ blad: "Zapytanie spoza aplikacji." }) };
  }

  let dane;
  try {
    dane = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers: naglowki, body: JSON.stringify({ blad: "Nieprawidłowe zapytanie." }) };
  }

  const { prompt, obrazy, kodDomu } = dane;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return { statusCode: 400, headers: naglowki, body: JSON.stringify({ blad: "Brak treści promptu." }) };
  }

  // FN-1: dom musi istnieć i mieścić się w dziennym limicie. Sprawdzane po stronie
  // serwera, bo klientowi nie można wierzyć — to on jest tym, kogo ograniczamy.
  const problem = await sprawdzDom(kodDomu);
  if (problem) {
    return { statusCode: problem.status, headers: naglowki, body: JSON.stringify({ blad: problem.blad }) };
  }
  if (obrazy != null && !Array.isArray(obrazy)) {
    return { statusCode: 400, headers: naglowki, body: JSON.stringify({ blad: "Zdjęcia muszą być listą." }) };
  }
  if (Array.isArray(obrazy) && obrazy.length > MAKS_ZDJEC) {
    return { statusCode: 400, headers: naglowki, body: JSON.stringify({ blad: `Najwyżej ${MAKS_ZDJEC} zdjęć naraz.` }) };
  }

  const parts = [];
  if (Array.isArray(obrazy)) {
    for (const o of obrazy) {
      if (!o?.data || !o?.mimeType) continue;
      if (!/^image\//.test(o.mimeType)) continue; // tylko obrazy, nie cokolwiek innego wysłane pod tą nazwą
      parts.push({ inline_data: { mime_type: o.mimeType, data: o.data } });
    }
  }
  parts.push({ text: prompt });

  let ostatniStatus = null;
  for (const model of modeleDoProby()) {
    let odpowiedz;
    try {
      odpowiedz = await fetch(adresModelu(model), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": klucz },
        body: JSON.stringify({ contents: [{ parts }] }),
      });
    } catch (e) {
      ostatniStatus = "brak połączenia";
      continue;
    }

    // 429 to limit, nie zła nazwa modelu — próbowanie kolejnych nic nie da i tylko
    // pali kolejne zapytania z tej samej puli. Kończymy od razu.
    if (odpowiedz.status === 429) {
      return { statusCode: 502, headers: naglowki, body: JSON.stringify({
        blad: "Gemini ma dziś za dużo zapytań od nas — spróbuj ponownie za chwilę, albo jutro." }) };
    }

    if (!odpowiedz.ok) { ostatniStatus = odpowiedz.status; continue; }

    const wynik = await odpowiedz.json();
    const tekst = (wynik?.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    if (!tekst.trim()) {
      return { statusCode: 502, headers: naglowki, body: JSON.stringify({
        blad: "Gemini nie zwróciło żadnego tekstu — spróbuj jeszcze raz." }) };
    }
    return { statusCode: 200, headers: naglowki, body: JSON.stringify({ tekst, model: model.nazwa }) };
  }

  return { statusCode: 502, headers: naglowki, body: JSON.stringify({
    blad: `Żaden z modeli nie odpowiedział (ostatni błąd: ${ostatniStatus}).` }) };
};
