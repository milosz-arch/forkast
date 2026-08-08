/* =====================================================================
   LICZNIK — ile poszło na Ciebie z tego, co ugotowaliście.

   NIE JEST OSOBNYM EKRANEM. Pomysł Miłosza (decyzja 77): odhaczasz ptaszkiem
   posiłek w jadłospisie, a jednym gestem aktualizuje się liczba kalorii, makro
   i spiżarnia — a przez spiżarnię lista zakupów. Jadłospis już wie, co i kiedy
   było zaplanowane, a przy gotowaniu ilość jest znana co do grama; przy kupowaniu
   nie jest, bo bierze się kilogram mąki na przepis wymagający 250 g.

   PORCJA JEDNEJ OSOBY to jedyna jednostka, jaką ten moduł liczy — i to nie jest
   wybór estetyczny, tylko zgodność z resztą apki. `policzZakupy` skaluje składniki
   przez `liczba jedzących / porcje w przepisie`; tutaj ten sam ułamek liczymy dla
   jednej osoby: `1 / porcje`. Dzięki temu ptaszek jednej osoby przy posiłku dla
   dwojga zdejmuje ze spiżarni dokładnie połowę — czyli tyle, ile ta lista wcześniej
   dla niej kupiła.

   CZEGO TU NIE MA, ŚWIADOMIE:
   — celu kalorycznego, sylwetkowego i jakiejkolwiek oceny („dużo”, „za mało”).
     Instrukcje tego projektu zabraniają zakładać, że ktoś liczy kalorie w celu
     innym niż ciekawość. Liczba jest liczbą, nie oceną
   — doliczania czegokolwiek za człowieka. Posiłek nieodhaczony nie liczy się
     w ogóle: ani do kalorii, ani do spiżarni (decyzja 77)
   — pamięci o tym, co zjedliście poza planem. To osobna funkcja i osobna rozmowa

   Jednostki: kalorie w kcal, makro w gramach — tak, jak leżą w słowniku produktów.
   ===================================================================== */

/**
 * Ile jedna porcja dania waży w kaloriach i makro.
 *
 * @param {object} danie – z `skladniki: [{produkt, gramy}]` i `porcje`
 * @param {Array} slownik – PRODUKTY, każdy z `n`, `kcal`, `bialko`, `wegle`, `tluszcz`
 * @returns {{kcal:number, bialko:number, wegle:number, tluszcz:number, nieznane:string[]}}
 *          `nieznane` to produkty spoza słownika — liczby ich NIE obejmują i trzeba
 *          to powiedzieć człowiekowi, zamiast zaniżać wynik po cichu.
 */
export function porcjaDania(danie, slownik = []) {
  const pusto = { kcal: 0, bialko: 0, wegle: 0, tluszcz: 0, nieznane: [] };
  if (!danie) return pusto;

  const naIlu = Number(danie.porcje);
  if (!Number.isFinite(naIlu) || naIlu < 1) return pusto;

  const wgNazwy = new Map(slownik.map(p => [p.n, p]));
  const suma = { kcal: 0, bialko: 0, wegle: 0, tluszcz: 0 };
  const nieznane = [];

  for (const sk of danie.skladniki || []) {
    const gramy = Number(sk.gramy);
    if (!Number.isFinite(gramy) || gramy <= 0) continue;

    const p = wgNazwy.get(sk.produkt);
    if (!p) { nieznane.push(sk.produkt); continue; }

    /* Makro w słowniku jest na 100 g — stąd dzielenie przez sto. */
    const ile = gramy / 100;
    suma.kcal    += (Number(p.kcal)    || 0) * ile;
    suma.bialko  += (Number(p.bialko)  || 0) * ile;
    suma.wegle   += (Number(p.wegle)   || 0) * ile;
    suma.tluszcz += (Number(p.tluszcz) || 0) * ile;
  }

  return {
    kcal:    Math.round(suma.kcal / naIlu),
    bialko:  Math.round(suma.bialko / naIlu),
    wegle:   Math.round(suma.wegle / naIlu),
    tluszcz: Math.round(suma.tluszcz / naIlu),
    nieznane: [...new Set(nieznane)],
  };
}

/**
 * Ile składników schodzi ze spiżarni, gdy JEDNA osoba odhaczy ten posiłek.
 *
 * Ten sam ułamek co w `porcjaDania`: jedna porcja z przepisu na `porcje` osób.
 * Zwraca listę w kształcie, który rozumie `poZuzyciu` ze `spizarnia.js`.
 */
export function zuzycieJednejOsoby(danie) {
  const naIlu = Number(danie?.porcje);
  if (!Number.isFinite(naIlu) || naIlu < 1) return [];

  return (danie.skladniki || [])
    .map(sk => ({ produkt: sk.produkt, gramy: Number(sk.gramy) / naIlu }))
    .filter(p => Number.isFinite(p.gramy) && p.gramy > 0);
}

/** Klucz odhaczenia posiłku: data + typ posiłku. Firebase nie przyjmuje kropek. */
export function kluczPosilku(data, typ) {
  return `${data}__${typ}`.replace(/[.#$[\]/]/g, "-");
}

/**
 * Podsumowanie dnia dla JEDNEJ osoby.
 *
 * @param {object} dzien – wpis z siatki: { data, posilki: { typ: {danie, kto, bezSkladnikow} } }
 * @param {object} zjedzone – { "data__typ": { idOsoby: true } }
 * @param {string} jaId – identyfikator domownika trzymającego ten telefon
 * @param {Array} dania – wszystkie dania (startowe + własne)
 * @param {Array} slownik – PRODUKTY
 */
export function dzienOsoby(dzien, zjedzone = {}, jaId = null, dania = [], slownik = []) {
  const suma = { kcal: 0, bialko: 0, wegle: 0, tluszcz: 0, posilkow: 0, nieznane: [] };
  if (!dzien || !jaId) return suma;

  for (const typ in dzien.posilki || {}) {
    const wpis = dzien.posilki[typ];
    if (!wpis?.danie || wpis.bezSkladnikow) continue;
    if (!zjedzone[kluczPosilku(dzien.data, typ)]?.[jaId]) continue;

    const danie = dania.find(d => d.id === wpis.danie);
    if (!danie) continue;

    const p = porcjaDania(danie, slownik);
    suma.kcal += p.kcal;
    suma.bialko += p.bialko;
    suma.wegle += p.wegle;
    suma.tluszcz += p.tluszcz;
    suma.posilkow++;
    suma.nieznane.push(...p.nieznane);
  }
  suma.nieznane = [...new Set(suma.nieznane)];
  return suma;
}

/** Czy JA odhaczyłem ten posiłek. */
export function czyZjadlem(zjedzone = {}, data, typ, jaId) {
  return Boolean(jaId && zjedzone[kluczPosilku(data, typ)]?.[jaId]);
}

/** Ilu domowników odhaczyło ten posiłek — do podpisu „2 z 2”. */
export function ileOdhaczylo(zjedzone = {}, data, typ) {
  return Object.keys(zjedzone[kluczPosilku(data, typ)] || {}).length;
}

/**
 * Opis dnia dla człowieka. Bez ocen — sama treść.
 * Zero odhaczonych posiłków to nie „0 kcal”, tylko „nic jeszcze nie odhaczone”:
 * pierwsza forma wygląda jak głodówka, druga mówi prawdę.
 */
export function opisDnia(suma) {
  if (!suma || !suma.posilkow) return "nic jeszcze nie odhaczone";
  return `${suma.kcal} kcal · B ${suma.bialko} · W ${suma.wegle} · T ${suma.tluszcz}`;
}
