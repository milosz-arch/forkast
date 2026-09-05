/* =====================================================================
   ZAPYTAJ-AI NA BRZEGU SIECI — jedyne miejsce, gdzie GEMINI_API_KEY istnieje.

   DLACZEGO TA FUNKCJA W OGÓLE POWSTAŁA.
   Poprzednia wersja była funkcją synchroniczną i mieściła się w dziesięciu
   sekundach albo ginęła. 29 sierpnia zmierzyliśmy, na co ten czas idzie, i wyszło
   coś, czego nie dało się obejść optymalizacją: sprawdzenie stołu to 0,3 s,
   a całą resztę zjada samo PISANIE odpowiedzi przez model. Prompt żąda sześciu
   kroków z temperaturami, czasami i uzasadnieniami — model wypisuje to słowo
   po słowie i trwa to około ośmiu sekund. Nie było tu nic zepsutego do naprawienia.
   Sprawdzone i odrzucone: wyłączenie myślenia modelu (nic nie dało — czas ten sam),
   zrównoleglenie zapytań do bazy (dało 0,3 s z ośmiu), skrócenie promptu (trzy tryby
   różnią się o mniej niż 800 znaków, więc nie o to chodziło). Odrzucone świadomie:
   proszenie AI o krótszy przepis — to płacenie jakością dania za limit platformy.

   CO TU JEST INACZEJ NIŻ W FUNKCJI SYNCHRONICZNEJ.
   Funkcja na brzegu sieci ma limit 50 ms CZASU PROCESORA, ale czekanie na
   odpowiedź z sieci się do niego NIE liczy. Możemy więc czekać na Gemini tak długo,
   jak trzeba, o ile odeślemy odpowiedź w ciągu czterdziestu sekund. Cena: to jest
   Deno, nie Node — inny sposób sięgania po zmienne środowiskowe i zwykłe Request
   i Response zamiast obiektu zdarzenia z Lambdy.

   Z tego limitu procesora wynika jedna praktyczna zasada: NIE PRZETWARZAMY tu
   zdjęć. Przychodzą zakodowane tekstem i tak samo, bez tykania, jadą dalej.
   Każda pętla po bajtach obrazu byłaby liczona do tych pięćdziesięciu milisekund.
   ===================================================================== */

/* Modele próbujemy po kolei — nazwy modeli Gemini zmieniają się między wersjami API
   i ta sama nazwa potrafi działać pod jedną, a zwracać 404 pod inną.

   Pole `mysli` mówi, czy model przyjmuje ustawienie budżetu myślenia. Zostaje ono
   wyłączone mimo że pomiar nie wykazał zysku: myślenie i tak nie poprawia przepisu,
   a jest liczone jak tekst wyjściowy, więc pali darmowy limit bez powodu.
   Modelom starszym (2.0) tego pola wysłać NIE WOLNO — odpowiadają błędem 400. */
/* MODELE — LISTA PRZYPIĘTA, NIE RUCHOMA.

   29 sierpnia ta lista kosztowała nas pół dnia i warto wiedzieć dlaczego.
   Na pierwszym miejscu stał `gemini-flash-latest`. To alias, o którym Google
   pisze wprost, że jest podmieniany przy KAŻDYM nowym wydaniu i wskazuje na model
   eksperymentalny, nieprzeznaczony do produkcji. Napisany, gdy oznaczał coś szybkiego,
   dziś prowadzi do rodziny Gemini 3 — i odpowiedź przestała się mieścić najpierw
   w dziesięciu sekundach, potem w dwudziestu czterech.

   Stąd zasada: na pierwszym miejscu model NAZWANY Z NUMEREM. Alias zostaje na końcu,
   jako ostatnia deska ratunku, gdy nazwane wersje znikną.

   Pole `myslenie` mówi, KTÓRYM parametrem wyłącza się rozmyślanie przed odpowiedzią,
   bo rodziny modeli mają na to różne nazwy i wysłanie złej jest bezobjawowe:
     "budzet" — rodzina 2.5, parametr thinkingBudget
     "poziom" — rodzina 3.x, gdzie thinkingLevel ZASTĄPIŁ thinkingBudget
   Wysłanie „budżetu” modelowi z rodziny 3.x nie daje błędu. Daje model myślący
   na pełnych obrotach i człowieka patrzącego na kręcące się kółko.

   Gemini 2.0 Flash i Flash-Lite zostały wycofane 1 czerwca 2026 i dlatego ich tu nie ma. */
const MODELE_ZAPASOWE = [
  { wersja: "v1beta", nazwa: "gemini-2.5-flash",       myslenie: "budzet" },
  { wersja: "v1beta", nazwa: "gemini-2.5-flash-lite",  myslenie: "budzet" },
  { wersja: "v1beta", nazwa: "gemini-3.1-flash-lite",  myslenie: "poziom" },
  { wersja: "v1beta", nazwa: "gemini-flash-latest",    myslenie: "poziom" },
];

/** Buduje ustawienie wyłączające rozmyślanie — albo nic, gdy model go nie zna. */
function bezMyslenia(model) {
  if (model.myslenie === "budzet") return { thinkingConfig: { thinkingBudget: 0 } };
  if (model.myslenie === "poziom") return { thinkingConfig: { thinkingLevel: "minimal" } };
  return null;
}

const srodowisko = (nazwa) => {
  /* Netlify.env to droga zalecana, Deno.env działa też lokalnie. Bierzemy pierwszą,
     która w ogóle istnieje, żeby brak jednej z nich nie wywalał całej funkcji. */
  try { if (typeof Netlify !== "undefined") return Netlify.env.get(nazwa); } catch { /* pusto */ }
  try { if (typeof Deno !== "undefined") return Deno.env.get(nazwa); } catch { /* pusto */ }
  return undefined;
};

function modeleDoProby() {
  /* Format: „wersja:nazwa” albo „wersja:nazwa:rodzaj-myślenia”, np.
     „v1beta:gemini-3.1-flash-lite:poziom”. Bez trzeciego członu zakładamy rodzinę 3.x,
     bo to ona jest dziś nowa — a błędne założenie kosztuje jedną wolną odpowiedź,
     nie awarię. */
  const zUstawien = (srodowisko("GEMINI_MODEL") || "").trim();
  if (!zUstawien) return MODELE_ZAPASOWE;
  const [wersja, nazwa, myslenie] = zUstawien.split(":");
  if (!wersja || !nazwa) return MODELE_ZAPASOWE;   // źle wpisana wartość nie może zabić apki
  return [{ wersja, nazwa, myslenie: myslenie === "budzet" ? "budzet" : "poziom" }, ...MODELE_ZAPASOWE];
}

const MAKS_ZDJEC = 4;
const LIMIT_NA_DOM_NA_DOBE = 30;
const BAZA = "https://forkast-37ffd-default-rtdb.europe-west1.firebasedatabase.app";

/* BUDŻET CZASU — już nie limit platformy, tylko cierpliwość człowieka.

   Sufit techniczny to czterdzieści sekund (tyle mamy na odesłanie nagłówków).
   Dwadzieścia pięć bierzemy dlatego, że po tym czasie i tak nikt nie patrzy
   już w telefon, a nieskończone kręcenie się jest gorsze niż uczciwe „nie wyszło”.
   Zmiana tej liczby to decyzja o czekaniu, nie o platformie. */
const BUDZET_MS = 25000;

/* Ile czasu dostaje JEDEN model, zanim przejdziemy do następnego. Bez tego pierwszy
   wolny model wyczerpuje cały budżet i nigdy się nie dowiemy, czy drugi byłby szybszy. */
const LIMIT_PROBY_MS = 11000;

/* POMIAR (decyzja 106): strona `pomiar.html` wysyła `pomiar: true`. Wtedy JEDEN model
   dostaje cały budżet zamiast 11 s — bo mierzymy, ile trwa wersja restauracyjna,
   a nie który model jest szybszy. Zwykłe dodawanie dania tej flagi nie wysyła
   i nic się dla niego nie zmienia. Do usunięcia razem ze stroną pomiaru. */
const limitProby = (pomiar) => pomiar === true ? BUDZET_MS - 1000 : LIMIT_PROBY_MS;

const adresModelu = (m) =>
  `https://generativelanguage.googleapis.com/${m.wersja}/models/${m.nazwa}:generateContent`;

const dzisiaj = () => new Date().toISOString().slice(0, 10);

/**
 * Sprawdza, czy dom istnieje i czy nie przekroczył dziennego limitu; podnosi licznik.
 *
 * Ograniczenie, świadome: funkcja nie ma uprawnień administratora do bazy (to wymagałoby
 * klucza serwisowego), więc licznik leży pod ścieżką domu i osoba znająca własny kod
 * może go teoretycznie wyzerować z konsoli przeglądarki. Przed kimś z zewnątrz chroni
 * w pełni — bo bez znajomości kodu nie przejdzie nawet pierwszego sprawdzenia.
 */
async function sprawdzDom(kodDomu) {
  const kod = String(kodDomu ?? "").trim().toUpperCase();
  if (!/^[0-9A-Z]{6}$/.test(kod)) {
    return { status: 403, blad: "Brak poprawnego kodu stołu." };
  }

  const sciezka = `${BAZA}/domy/${kod}/limity/${dzisiaj()}.json`;

  /* Dwa odczyty naraz, nie po kolei — nic o sobie nie wiedzą, więc nie ma powodu,
     żeby na siebie czekały. Zmierzone: skróciło sprawdzenie stołu z 0,6 s do 0,3 s. */
  const [istnieje, licznikOdp] = await Promise.all([
    fetch(`${BAZA}/domy/${kod}/utworzono.json`),
    fetch(sciezka),
  ]);

  if (!istnieje.ok) return { status: 403, blad: "Nie mogę zweryfikować stołu." };
  if ((await istnieje.json()) == null) {
    return { status: 403, blad: "Nie ma takiego stołu." };
  }

  const uzyte = licznikOdp.ok ? ((await licznikOdp.json()) || 0) : 0;

  if (uzyte >= LIMIT_NA_DOM_NA_DOBE) {
    return { status: 429, blad:
      `Ten stół wykorzystał dziś ${LIMIT_NA_DOM_NA_DOBE} zapytań do AI. Licznik zeruje się o północy — ` +
      `do tego czasu możesz dodać danie ręcznie przez formularz.` };
  }

  /* Licznik podnosimy PRZED wywołaniem AI: lepiej policzyć zapytanie, które padło,
     niż nie policzyć takiego, które przeszło. Ale nie czekamy tu na potwierdzenie —
     zapis rusza teraz, a doczekamy go tuż przed zwróceniem odpowiedzi. */
  return { zapisLicznika: fetch(sciezka, { method: "PUT", body: JSON.stringify(uzyte + 1) }) };
}

export default async (request) => {
  const START = Date.now();
  const minelo = () => Date.now() - START;
  const zostalo = () => BUDZET_MS - minelo();
  const sek = (ms) => (ms / 1000).toFixed(1).replace(".", ",");

  const naglowki = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  const odpowiedz = (status, obiekt) =>
    new Response(JSON.stringify(obiekt), { status, headers: naglowki });

  if (request.method === "OPTIONS") return new Response("", { status: 204, headers: naglowki });
  if (request.method !== "POST") return odpowiedz(405, { blad: "Tylko POST." });

  const klucz = srodowisko("GEMINI_API_KEY");
  if (!klucz) return odpowiedz(500, { blad: "Serwer nie ma skonfigurowanego klucza API." });

  /* Adres tej funkcji jest publiczny, a za nią stoi klucz Miłosza — bez żadnej kontroli
     ktokolwiek, kto pozna adres (a link idzie WhatsAppem i może być przesłany dalej),
     mógłby jej używać jako darmowego dostępu do Gemini.

     Sprawdzamy więc, czy zapytanie przyszło z naszej własnej strony. To NIE jest mocne
     zabezpieczenie — nagłówek Origin da się podrobić narzędziem spoza przeglądarki —
     ale odcina przypadkowe i leniwe użycie, czyli realny scenariusz przy pięciu domach.

     Nie odrzucamy po samym braku Origin, bo wbudowana przeglądarka WhatsAppa nie jest
     zwykłą przeglądarką i nie ma pewności, co wysyła. Przepuszczamy też pasujący
     Referer — curl bez argumentów nie wysyła ŻADNEGO z tych dwóch, więc odpada,
     a prawdziwa przeglądarka wysyła przynajmniej jeden. */
  const host = new URL(request.url).host;
  const zrodlo = request.headers.get("origin") || "";
  const skad = request.headers.get("referer") || "";
  const zZewnatrz = (naglowek) => naglowek && !naglowek.includes(host);
  if (host && ((!zrodlo && !skad) || zZewnatrz(zrodlo) || (!zrodlo && zZewnatrz(skad)))) {
    return odpowiedz(403, { blad: "Zapytanie spoza aplikacji." });
  }

  let dane;
  try { dane = await request.json(); }
  catch { return odpowiedz(400, { blad: "Nieprawidłowe zapytanie." }); }

  const { prompt, obrazy, kodDomu, pomiar } = dane;
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return odpowiedz(400, { blad: "Brak treści promptu." });
  }
  if (obrazy != null && !Array.isArray(obrazy)) {
    return odpowiedz(400, { blad: "Zdjęcia muszą być listą." });
  }
  if (Array.isArray(obrazy) && obrazy.length > MAKS_ZDJEC) {
    return odpowiedz(400, { blad: `Najwyżej ${MAKS_ZDJEC} zdjęć naraz.` });
  }

  const wynikDomu = await sprawdzDom(kodDomu);
  const czasBazy = minelo();
  if (wynikDomu.blad) return odpowiedz(wynikDomu.status, { blad: wynikDomu.blad });

  /* Zapis licznika leci w tle od sprawdzDom. Doczekać go trzeba przed zwróceniem
     odpowiedzi, bo po jej zwróceniu funkcja może zostać uśpiona w połowie
     niedokończonego żądania. Wyjątek połykamy: nieudany licznik nie może zabrać
     człowiekowi dania. */
  const dopiscLicznik = async () => {
    try { await wynikDomu.zapisLicznika; } catch { /* licznik nie jest ważniejszy niż odpowiedź */ }
  };

  const parts = [];
  if (Array.isArray(obrazy)) {
    for (const o of obrazy) {
      if (!o?.data || !o?.mimeType) continue;
      if (!/^image\//.test(o.mimeType)) continue;   // tylko obrazy, nie cokolwiek pod tą nazwą
      parts.push({ inline_data: { mime_type: o.mimeType, data: o.data } });
    }
  }
  parts.push({ text: prompt });

  let ostatniStatus = null;
  let ostatniModel = null;
  /* Przebieg każdej próby z osobna. Do 29 sierpnia pierwszy model, który się zawiesił,
     kończył całą rundę i zabierał ze sobą informację o pozostałych — jedna nieudana
     próba wyglądała dokładnie tak samo jak cztery. Teraz każda ma własny limit i każda
     zostawia ślad, więc jedno podejście daje porównanie zamiast jednej liczby. */
  const proby = [];
  for (const model of modeleDoProby()) {
    if (zostalo() < 3000) break;

    const stopZegar = new AbortController();
    const naProbe = Math.min(limitProby(pomiar), zostalo() - 1000);
    const budzik = setTimeout(() => stopZegar.abort(), naProbe);

    const cialo = { contents: [{ parts }] };
    const ustawienia = bezMyslenia(model);
    if (ustawienia) cialo.generationConfig = ustawienia;

    const startModelu = Date.now();
    const zapisz = (jak) => proby.push({ model: model.nazwa, ms: Date.now() - startModelu, wynik: jak });

    let odp;
    try {
      odp = await fetch(adresModelu(model), {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": klucz },
        body: JSON.stringify(cialo),
        signal: stopZegar.signal,
      });
    } catch {
      clearTimeout(budzik);
      ostatniModel = model.nazwa;
      /* Przerwanie własnym zegarem wygląda w kodzie tak samo jak zerwana sieć,
         a to dwie różne wiadomości. Rozdzielamy — i idziemy do NASTĘPNEGO modelu
         zamiast kończyć rundę, bo wolny model to nie to samo co brak modeli. */
      if (stopZegar.signal.aborted) { zapisz("za wolno"); ostatniStatus = "za wolno"; continue; }
      zapisz("brak połączenia");
      ostatniStatus = "brak połączenia";
      continue;
    }
    clearTimeout(budzik);
    ostatniModel = model.nazwa;

    // 429 to limit, nie zła nazwa modelu — próbowanie kolejnych tylko pali pulę.
    if (odp.status === 429) {
      zapisz(429);
      await dopiscLicznik();
      return odpowiedz(502, {
        blad: "Gemini ma dziś za dużo zapytań od nas — spróbuj ponownie za chwilę, albo jutro." });
    }

    if (!odp.ok) { zapisz(odp.status); ostatniStatus = odp.status; continue; }

    const wynik = await odp.json();
    const czasGemini = Date.now() - startModelu;
    const tekst = (wynik?.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("");
    /* Powód zakończenia jedzie razem z tekstem: „MAX_TOKENS” znaczy, że odpowiedź
       jest UCIĘTA, a ucięty JSON wygląda jak zepsuty model, nie jak za krótki limit. */
    const koniec = wynik?.candidates?.[0]?.finishReason || null;
    if (!tekst.trim()) {
      zapisz("pusto");
      ostatniStatus = "pusta odpowiedź";
      continue;
    }

    zapisz("ok");
    await dopiscLicznik();
    /* `czasy` jedzie także przy powodzeniu, nie tylko w błędzie. Pomiar widoczny
       wyłącznie po awarii nigdy nie powie, ile zostało zapasu. */
    return odpowiedz(200, {
      tekst,
      model: model.nazwa,
      koniec,
      czasy: { baza: czasBazy, gemini: czasGemini, razem: minelo(), model: model.nazwa, proby },
    });
  }

  await dopiscLicznik();
  return odpowiedz(504, {
    blad: `Żaden model nie zdążył odpowiedzieć w ${sek(minelo())} s. ` +
          `Próby: ${proby.map(p => `${p.model} ${sek(p.ms)} s → ${p.wynik}`).join("; ") || "żadna nie ruszyła"}` +
          `${ostatniModel ? "." : ` (ostatni błąd: ${ostatniStatus}).`}`,
    czasy: { baza: czasBazy, razem: minelo(), proby },
  });
};

export const config = { path: "/api/zapytaj-ai" };
