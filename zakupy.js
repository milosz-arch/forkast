/* =====================================================================
   ZAKUPY — z ułożonego jadłospisu robi listę tego, co trzeba kupić.

   To jest ta połowa pierwszej pętli, która czyni apkę użyteczną: plan i zakupy
   są jedną rzeczą, nie dwiema (PODSTAWY.md, „czym to nie jest”).

   Najważniejsza rzecz dzieje się w przeliczaniu porcji. Każde danie ma pole
   `porcje` — na ile osób jest podana jego gramatura (decyzja 10). Ile porcji
   naprawdę potrzeba, wynika z tego, ilu domowników je ten posiłek tego dnia.
   Te dwie liczby prawie nigdy nie są równe, więc gramatura musi być skalowana:
   danie na 4 porcje jedzone przez 2 osoby to połowa składników.

   W Dietce tego problemu nie było, bo wszystkie przepisy pisano pod dwie znane
   osoby i gramatura zgadzała się z definicji. Tutaj zgadzać się nie może.
   ===================================================================== */

/**
 * @param siatka  z rytm.js — [{data, posilki:{typ:{kto,danie,bezSkladnikow}}}]
 * @param dania   wszystkie znane dania (talia + własne), każde z {id, porcje, skladniki}
 * @returns { pozycje, pominiete }
 *   pozycje   — [{ produkt, gramy, wDaniach:[nazwy] }] posortowane wg nazwy
 *   pominiete — opis miejsc, których nie dało się policzyć (brakujące danie, zły przepis)
 */
export function policzZakupy(siatka, dania) {
  const wgProduktu = new Map();
  const pominiete = [];

  for (const dzien of siatka) {
    for (const typ in dzien.posilki) {
      const wpis = dzien.posilki[typ];

      // Pozycje typu „na mieście” celowo nie generują składników (decyzja 12).
      if (wpis.bezSkladnikow) continue;
      if (!wpis.danie) continue;

      const danie = dania.find(d => d.id === wpis.danie);
      if (!danie) {
        pominiete.push(`${dzien.data}, ${typ}: danie zniknęło z bazy — nie wliczam go do zakupów.`);
        continue;
      }

      const potrzeba = wpis.kto?.length ?? 0;
      if (!potrzeba) {
        pominiete.push(`${dzien.data}, ${typ}: nikt tego nie je, więc nie kupujemy składników.`);
        continue;
      }

      const naIlu = Number(danie.porcje);
      if (!Number.isFinite(naIlu) || naIlu < 1) {
        pominiete.push(`„${danie.nazwa}”: nie wiadomo, na ile osób jest ta gramatura — pomijam.`);
        continue;
      }

      const mnoznik = potrzeba / naIlu;

      for (const sk of danie.skladniki || []) {
        const gramy = Number(sk.gramy) * mnoznik;
        if (!Number.isFinite(gramy) || gramy <= 0) continue;

        const dotychczas = wgProduktu.get(sk.produkt) || { produkt: sk.produkt, gramy: 0, wDaniach: new Set() };
        dotychczas.gramy += gramy;
        dotychczas.wDaniach.add(danie.nazwa);
        wgProduktu.set(sk.produkt, dotychczas);
      }
    }
  }

  const pozycje = [...wgProduktu.values()]
    .map(p => ({
      produkt: p.produkt,
      // Zaokrąglamy dopiero na końcu, po zsumowaniu wszystkiego — zaokrąglanie
      // każdego składnika osobno potrafi narobić kilkudziesięciu gramów różnicy.
      gramy: Math.round(p.gramy),
      wDaniach: [...p.wDaniach].sort((a, b) => a.localeCompare(b, "pl")),
    }))
    .filter(p => p.gramy > 0)
    .sort((a, b) => a.produkt.localeCompare(b.produkt, "pl"));

  return { pozycje, pominiete };
}

/**
 * Grupuje pozycje działami sklepu, żeby nie biegać po sklepie tam i z powrotem.
 * @param slownik [{ n, dzial }]
 * @returns [{ dzial, pozycje }] — działy w kolejności pierwszego wystąpienia w słowniku
 */
export function pogrupujDzialami(pozycje, slownik) {
  const dzialProduktu = new Map(slownik.map(p => [p.n, p.dzial || "Inne"]));
  const kolejnosc = [];
  const grupy = new Map();

  for (const p of pozycje) {
    const dzial = dzialProduktu.get(p.produkt) || "Inne";
    if (!grupy.has(dzial)) { grupy.set(dzial, []); kolejnosc.push(dzial); }
    grupy.get(dzial).push(p);
  }

  return kolejnosc.map(dzial => ({ dzial, pozycje: grupy.get(dzial) }));
}

/** „1,2 kg” czyta się lepiej niż „1200 g”, ale przy 80 g kilogramy są bez sensu. */
export function opisIlosci(gramy) {
  if (gramy >= 1000) {
    const kg = gramy / 1000;
    return `${(Math.round(kg * 10) / 10).toString().replace(".", ",")} kg`;
  }
  return `${gramy} g`;
}

/**
 * Czy lista zapisana w telefonie nadaje się jeszcze do liczenia.
 *
 * DLACZEGO TO ISTNIEJE. Ekran Zakupów trzyma ostatnią listę w pamięci telefonu,
 * żeby działała w sklepie bez zasięgu. Ta kopia bywa STARSZA NIŻ KOD — leży tam
 * od wydania, którego już nie pamiętamy. Do 8 sierpnia pozycje zapisywały się
 * bez pola `gramy`; od v45 spiżarnia odejmuje właśnie od tego pola, a funkcja,
 * która to robi, celowo rzuca wyjątkiem, gdy liczby nie ma (decyzja 70).
 *
 * Skutek był taki, że stara kopia w telefonie wywracała cały ekran: człowiek
 * widział „Coś nie zadziałało. Spróbuj odświeżyć.”, odświeżenie nic nie dawało,
 * bo kopia zostawała, a ekran nie zdążył podpiąć się do bazy, żeby pobrać nową.
 * Telefon, który raz w to wpadł, nie wychodził z tego sam nigdy (decyzja 75).
 *
 * Dane z pamięci telefonu traktujemy jak dane z zewnątrz: sprawdzamy je,
 * zamiast zakładać, że mają kształt, który akurat dziś piszemy.
 */
export function kopiaNadajeSie(pozycje) {
  return Array.isArray(pozycje) && pozycje.length > 0
    && pozycje.every(p => p && typeof p.produkt === "string"
                            && typeof p.gramy === "number" && !Number.isNaN(p.gramy));
}
