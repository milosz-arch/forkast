/* =====================================================================
   KUCHNIA — czym ktoś naprawdę gotuje.

   Po co: przepis mówiący „smaż na 6/9” jest instrukcją do płyty indukcyjnej
   z dziewięcioma stopniami. Na gazie nie znaczy nic. „Piecz z termoobiegiem”
   nie ma sensu w piekarniku bez termoobiegu, a „przełóż do żeliwnego garnka”
   jest bezużyteczne dla kogoś, kto ma jeden garnek emaliowany.

   To jest dokładnie ta klasa założeń, przed którą ostrzega metoda tego
   projektu: Dietka mogła zakładać sprzęt, bo znała kuchnię dwóch osób.
   Forkast nie zna żadnej — więc pyta.

   Czego to NIE robi: nie przepisuje 93 dań, które już są w talii. Wpływa na
   nowe dania generowane przez AI. Przepisanie istniejących wymagałoby
   wygenerowania wszystkiego od nowa i nie mieści się przed 16 sierpnia.
   ===================================================================== */

import { napis } from "./tlumaczenia.js";

export const PLYTY = [
  { id: "indukcja", etykieta: napis("Indukcja"),
    opis: napis("moc w stopniach, szybko reaguje") },
  { id: "gaz", etykieta: napis("Gaz"),
    opis: napis("płomień, natychmiastowa zmiana") },
  { id: "elektryczna", etykieta: napis("Płyta elektryczna"),
    opis: napis("wolno się nagrzewa i stygnie") },
];

export const PIEKARNIKI = [
  { id: "termoobieg", etykieta: napis("Z termoobiegiem") },
  { id: "gora-dol",   etykieta: napis("Góra-dół") },
  { id: "brak",       etykieta: napis("Nie mam piekarnika") },
];

export const NACZYNIA = [
  { id: "patelnia",        etykieta: napis("Patelnia") },
  { id: "patelnia-zeliwo", etykieta: napis("Patelnia żeliwna") },
  { id: "garnek-duzy",     etykieta: napis("Duży garnek") },
  { id: "garnek-zeliwo",   etykieta: napis("Garnek żeliwny / brytfanna") },
  { id: "wok",             etykieta: napis("Wok") },
  { id: "blender",         etykieta: napis("Blender") },
  { id: "mikser",          etykieta: napis("Mikser") },
];

export const DOMYSLNA = {
  plyta: "indukcja",
  piekarnik: "termoobieg",
  naczynia: ["patelnia", "garnek-duzy"],
};

/**
 * Zamienia ustawienia w akapit dla AI. Pusty tekst, gdy nic nie ustawiono —
 * lepiej nie mówić nic, niż zmyślić komuś kuchnię.
 */
export function opisKuchni(k) {
  if (!k) return "";
  const linie = [];

  const plyta = PLYTY.find(p => p.id === k.plyta);
  if (plyta) {
    linie.push(k.plyta === "gaz"
      ? 'Kuchnia gazowa: moc podawaj słowami (mały ogień, średni, mocny), ' +
        'nie w stopniach — na gazie nie ma skali.'
      : k.plyta === "elektryczna"
      ? "Płyta elektryczna: nagrzewa się i stygnie wolno, więc uprzedzaj, " +
        "kiedy zdjąć naczynie wcześniej, żeby nie przypalić."
      : "Płyta indukcyjna: moc możesz podawać w skali 1–9, reaguje natychmiast.");
  }

  if (k.piekarnik === "brak") {
    linie.push("Bez piekarnika: nie proponuj pieczenia. Wszystko na płycie albo na zimno.");
  } else if (k.piekarnik === "gora-dol") {
    linie.push("Piekarnik góra-dół, bez termoobiegu: podnieś temperaturę o około 20°C " +
               "względem przepisu z termoobiegiem i uprzedź o obracaniu blachy.");
  }

  const maja = (k.naczynia || []).map(id => NACZYNIA.find(n => n.id === id)?.etykieta).filter(Boolean);
  if (maja.length) {
    linie.push(`Sprzęt, który mają: ${maja.join(", ")}. Nie każ używać niczego spoza tej listy.`);
  }

  return linie.length ? "\nWARUNKI TEJ KUCHNI:\n- " + linie.join("\n- ") + "\n" : "";
}
