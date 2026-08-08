/* =====================================================================
   CZAS PRZYGOTOWANIA

   Zastępuje kubełki („domowa klasyka”, „nowoczesne”, „szybkie”, „świat”).

   Dlaczego tamte nie działały — i nie chodziło o wygląd:

   Mieszały trzy różne osie. „Szybkie” mówiło o czasie, „świat” o pochodzeniu,
   „domowa klasyka” o tradycji, a „nowoczesne” nie mówiło nic konkretnego.
   Ramen siedział w „świat”, choć gotuje się godzinę; owsianka w „szybkie”,
   choć równie dobrze jest klasyką. Danie pasowało do kilku kategorii naraz,
   więc przypisanie MUSIAŁO być arbitralne — i człowiek to czuł jako
   „działają jak chcą”. Do tego 45 dań ze 101 nie miało żadnej kategorii.

   Czas jest inny: jest jednoznaczny, dotyczy każdego dania i odpowiada na
   pytanie, które człowiek naprawdę zadaje o wpół do siódmej — „zdążę to zrobić
   przed kolacją?”. Nie trzeba go wymyślać, bo 89 ze 101 dań ma minuty wpisane
   wprost w kroki.

   CZEGO TO NIE ROBI: nie udaje precyzji. „Około 30 minut” jest uczciwe,
   „31 minut” byłoby kłamstwem — nie wiemy, jak szybko ktoś kroi cebulę.
   ===================================================================== */

/* Progi dobrane pod realne decyzje, nie pod okrągłe liczby:
   do 20 min  – zdążysz po pracy, nic nie planując
   do 45 min  – zwykły obiad, trzeba się zabrać
   powyżej    – weekend albo wieczór, gdy masz czas */
export const PROGI = [
  { id: "szybko",  do: 20,       etykieta: "do 20 min",  barwa: "#0369A1", barwaCiemna: "#38BDF8" },
  { id: "srednio", do: 45,       etykieta: "do 45 min",  barwa: "#B45309", barwaCiemna: "#FBBF24" },
  { id: "dlugo",   do: Infinity, etykieta: "ponad 45 min", barwa: "#A21CAF", barwaCiemna: "#E879F9" },
];

/**
 * Wyciąga minuty z kroków przepisu.
 *
 * Sumujemy, a nie bierzemy największej — bo kroki idą po kolei i człowiek
 * czeka przy każdym. Ale czynności bez podanego czasu (krojenie, mieszanie,
 * podawanie) też coś kosztują, więc doliczamy im ryczałt.
 *
 * @param {object} danie
 * @returns {number|null} minuty albo null, gdy nie da się nic wyliczyć
 */
/* Kroki bierne: czekanie, które nie zajmuje człowieka. Wzorzec używany w dwóch
   miejscach — przy liczeniu czasu i przy oznaczaniu wyprzedzenia — więc jeden. */
const BIERNE = /przez noc|namocz|marynuj|odstaw (na |do )?(lodówk|co najmniej|minimum)|w lodówce (na|przez)|chłodź|studź (przez|co najmniej)/i;

export function minutyZKrokow(danie) {
  const kroki = danie?.kroki || [];
  if (!kroki.length) return null;

  let suma = 0, zCzasem = 0;
  for (const krok of kroki) {
    /* Krok, w którym coś się MOCZY, MARYNUJE albo STOI W LODÓWCE, nie liczy się
       do czasu w kuchni — człowiek wtedy śpi albo jest w pracy. Ramen wychodził
       przez to na 170 minut, z czego 120 to marynowanie jajek przez noc.
       Taki krok pomijamy w sumie, ale całe danie oznaczamy jako wymagające
       wyprzedzenia — bo o tym trzeba wiedzieć zawczasu. */
    if (BIERNE.test(krok)) continue;

    /* „20 minut”, „2 godziny”, „6,5 minuty” — wszystkie liczby z jednostką
       czasu w tym kroku, zsumowane. */
    const minuty = [...krok.matchAll(/(\d+(?:[.,]\d+)?)\s*(minut|godzin)/gi)]
      .map(m => Number(m[1].replace(",", ".")) * (m[2].toLowerCase().startsWith("godzin") ? 60 : 1));
    if (minuty.length) {
      suma += minuty.reduce((a, b) => a + b, 0);
      zCzasem++;
    }
  }

  const czynne = kroki.filter(k => !BIERNE.test(k)).length;

  /* Przepis bez ani jednej liczby to zwykle danie do złożenia, nie ugotowania:
     sałatka, kanapka, koktajl. Nie ma tam czego mierzyć, ale trwa to realnie
     kilka minut na krok. Zwracanie null zostawiłoby dziesięć dań bez oznaki. */
  if (!zCzasem) return czynne ? Math.max(5, czynne * 3) : null;

  /* Kroki bez podanego czasu: 2 minuty każdy. To nie pomiar, tylko uczciwe
     przyznanie, że krojenie i mieszanie kosztują — bez tego „ugotuj makaron
     8 minut” dawałoby danie ośmiominutowe. */
  suma += (czynne - zCzasem) * 2;

  return Math.round(suma);
}

/**
 * Marynowanie przez noc i chłodzenie nie są czasem, który człowiek spędza
 * w kuchni. Wykrywamy je i odejmujemy, ale zaznaczamy osobno — bo trzeba
 * o nich wiedzieć zawczasu.
 */
export function wymagaWyprzedzenia(danie) {
  return (danie?.kroki || []).some(k => BIERNE.test(k));
}

/**
 * Zaokrąglenie do piątek i dziesiątek, bo minuta dokładności byłaby udawaniem
 * wiedzy, której nie mamy.
 *
 * Stoi osobno, bo liczba na odznace i KOLOR odznaki muszą wychodzić z tej samej
 * wartości. Dopóki próg liczył się z surowych minut, a podpis z zaokrąglonych,
 * danie na 21 minut dostawało podpis „20 min” i jednocześnie kolor progu
 * „do 45 min” — odznaka mówiła „szybko”, a świeciła na wolno. Dotyczyło to
 * 8 dań ze 113, m.in. ramenu i katsu curry.
 */
export function zaokraglMinuty(minuty) {
  return minuty < 15 ? Math.round(minuty / 5) * 5 : Math.round(minuty / 10) * 10;
}

/** Do którego progu należy danie. Null, gdy nie da się policzyć czasu. */
export function prog(danie) {
  const m = minutyZKrokow(danie);
  if (m === null) return null;
  const zaokr = zaokraglMinuty(m);
  return PROGI.find(p => zaokr <= p.do);
}

/**
 * Opis dla człowieka. Ta sama zaokrąglona wartość, z której liczy się próg.
 */
export function opisCzasu(danie) {
  const m = minutyZKrokow(danie);
  if (m === null) return null;
  return `${zaokraglMinuty(m)} min`;
}


/* =====================================================================
   CZAS ZALEŻNY OD SPRZĘTU

   Ten sam przepis zajmuje różny czas w różnych kuchniach. Płyta elektryczna
   nagrzewa się i stygnie wolno. Piekarnik bez termoobiegu potrzebuje dłuższego
   nagrzewania i obracania blachy. Bez blendera zupę krem robi się przez sitko.
   Bez woka smaży się partiami, bo w patelni wszystko puszcza wodę.

   MNOŻNIKI SĄ SZACUNKIEM, NIE POMIAREM — i tak są napisane w komentarzach.
   Piętnaście procent na płycie elektrycznej nie wzięło się z badania, tylko
   z tego, że różnica jest realna i lepiej ją przyznać niż udawać, że nie istnieje.
   Nie udajemy precyzji, której nie mamy: wynik i tak zaokrąglamy do dziesiątek.

   NAJWAŻNIEJSZE JEST JEDNO: brak piekarnika nie wydłuża dania, tylko sprawia,
   że NIE DA SIĘ go zrobić. To nie jest kwestia czasu i nie wolno tego pokazywać
   jako „o dziesięć minut dłużej”.
   ===================================================================== */

/* Kroki wymagające konkretnego sprzętu — rozpoznawane po czasowniku, bo tego
   nikt nie wpisuje daniom ręcznie.

   PIECZARKI NIE SĄ PIEKARNIKIEM. Wzorzec „piecz” łapał je jako pieczenie, więc
   trzy dania robione wyłącznie na patelni (kasza gryczana z pieczarkami,
   kurczak w sosie śmietanowym, bibimbap) wychodziły jako NIEWYKONALNE u kogoś
   bez piekarnika. Stąd `piecz(?!ar|yw)` — odcina „pieczarki”, „pieczarek”
   oraz „pieczywo” we wszystkich przypadkach („pieczywem”, „pieczywa”),
   a przepuszcza prawdziwe formy występujące w talii: piecz, upiecz, opiecz,
   dopiecz, podpiecz, pieczenia. Lookahead łapie rdzeń, nie jedną formę —
   pierwsza wersja blokowała samo „pieczywo” i „pieczywem” przeszło. */
const WZORCE = {
  grzanie:  /gotuj|zagotuj|smaż|duś|podsmaż|praż|podgrzej|gotowa[nć]|zredukuj/i,
  piekarnik:/piekarnik|zapiek|piecz(?!ar|yw)/i,
  blender:  /zblenduj|zmiksuj|blender|na gładk/i,
  wok:      /\bwok\b|na mocnym ogniu.*mieszaj|stir/i,
};

const DOMYSLNY_SPRZET = { plyta: "indukcja", piekarnik: "termoobieg", naczynia: ["patelnia", "garnek-duzy"] };

/**
 * Czas przygotowania z uwzględnieniem sprzętu użytkownika.
 *
 * @param {object} danie
 * @param {object} [sprzet] – z ustawień; brak = wartości domyślne
 * @returns {{minuty:number|null, niewykonalne:boolean, powody:string[]}}
 */
export function czasDlaSprzetu(danie, sprzet) {
  const s = { ...DOMYSLNY_SPRZET, ...(sprzet || {}) };
  const naczynia = s.naczynia || DOMYSLNY_SPRZET.naczynia;
  const bazowy = minutyZKrokow(danie);
  if (bazowy === null) return { minuty: null, niewykonalne: false, powody: [] };

  const kroki = danie?.kroki || [];
  const ma = (rodzaj) => kroki.some(k => WZORCE[rodzaj].test(k));
  const powody = [];
  let minuty = bazowy;

  /* Brak piekarnika przy daniu, które trzeba upiec, to nie opóźnienie —
     to niewykonalność. Pokazywanie tego jako dłuższego czasu byłoby kłamstwem
     i człowiek zaplanowałby danie, którego nie zrobi. */
  if (s.piekarnik === "brak" && ma("piekarnik")) {
    return { minuty: bazowy, niewykonalne: true, powody: ["wymaga piekarnika"] };
  }

  /* Płyta elektryczna: wolno się nagrzewa i wolno stygnie, więc każdy krok
     z podgrzewaniem trwa dłużej. Gaz reaguje natychmiast — to punkt odniesienia.
     Indukcja jest szybsza od gazu przy zagotowywaniu, ale różnica jest mała. */
  if (ma("grzanie")) {
    if (s.plyta === "elektryczna") { minuty *= 1.15; powody.push("płyta elektryczna nagrzewa się wolniej"); }
    else if (s.plyta === "indukcja") { minuty *= 0.95; }
  }

  /* Piekarnik bez termoobiegu: dłuższe nagrzewanie i trzeba obrócić blachę
     w połowie, bo grzeje nierówno. */
  if (s.piekarnik === "gora-dol" && ma("piekarnik")) {
    minuty += 10;
    powody.push("piekarnik bez termoobiegu grzeje dłużej");
  }

  /* Bez blendera zupę krem przeciera się przez sitko — to realnie kilka minut
     dłużej i sporo więcej wysiłku. */
  if (ma("blender") && !naczynia.includes("blender")) {
    minuty += 6;
    powody.push("bez blendera trzeba przetrzeć przez sitko");
  }

  /* Bez woka smaży się partiami, bo w patelni składniki puszczają wodę
     zamiast się smażyć. */
  if (ma("wok") && !naczynia.includes("wok")) {
    minuty += 5;
    powody.push("bez woka trzeba smażyć partiami");
  }

  return { minuty: Math.round(minuty), niewykonalne: false, powody };
}

/** Próg czasowy z uwzględnieniem sprzętu — z tej samej zaokrąglonej liczby, co podpis. */
export function progDlaSprzetu(danie, sprzet) {
  const { minuty } = czasDlaSprzetu(danie, sprzet);
  if (minuty === null) return null;
  const zaokr = zaokraglMinuty(minuty);
  return PROGI.find(p => zaokr <= p.do);
}

/** Opis czasu z uwzględnieniem sprzętu, zaokrąglony tak samo jak bazowy. */
export function opisCzasuDlaSprzetu(danie, sprzet) {
  const { minuty } = czasDlaSprzetu(danie, sprzet);
  if (minuty === null) return null;
  return `${zaokraglMinuty(minuty)} min`;
}
