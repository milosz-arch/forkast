/* =====================================================================
   ANGIELSKA WARSTWA TREŚCI — dania, kroki, produkty, działy (decyzja 130)

   Polska warstwa jest źródłem prawdy: z niej liczą się zakupy, czas
   i sprzęt. Angielska jest tylko do pokazania — i właśnie dlatego może
   się rozjechać po cichu. Człowiek przy angielskim stole gotuje z kroku
   „simmer for 6 minutes”, a lista zakupów i czas liczą się z polskiego
   „duś 60 minut”. Nikt tego nie zobaczy, dopóki danie nie wyjdzie złe.

   Sprawdzane:
   1. Każde danie talii ma warstwę angielską i nic ponad talię.
   2. Tyle samo kroków w obu językach.
   3. KAŻDA LICZBA z polskiego kroku stoi w angielskim i odwrotnie —
      gramy, minuty, stopnie, moc płyty, proporcje.
   4. Polska część nazwy własnej („Gołąbki — …”) jest początkiem polskiej
      nazwy tego samego dania — łapie zamianę dań między `id`.
   5. Żadnej polskiej litery w angielskim tekście poza słowami, które są
      polskie z założenia (nazwy własne dań i produktów).
   6. Każdy produkt i dział ma angielską nazwę; nazwy produktów są unikalne
      (dwa różne produkty pod jedną nazwą to jedna pozycja na liście w oczach
      człowieka i dwie w danych).
   7. Ekrany nie pokazują surowego `.nazwa` / `.produkt` z pominięciem
      nazwaWJezyku() / produktWJezyku().

   SABOTAŻ: zmieniona liczba w angielskim kroku, zgubiony krok, zamienione
   nazwy dwóch dań, polskie słowo w angielskim kroku, brakujący produkt,
   zdublowana nazwa produktu, surowe `s.produkt` na ekranie — każde oblewa.
   ===================================================================== */

import { readFileSync } from "node:fs";
import { TALIA_STARTOWA } from "../talia-startowa.js";
import { PRODUKTY } from "../produkty.js";
import { DANIA_EN } from "../talia-en.js";
import { PRODUKTY_EN, DZIALY_EN } from "../produkty-en.js";

const KORZEN = new URL("../", import.meta.url);
let zdane = 0, oblane = 0;
function test(n, fn) {
  try { fn(); console.log(`  ok   ${n}`); zdane++; }
  catch (e) { console.log(`  BLAD ${n}\n       ${e.message}`); oblane++; }
}
function prawda(w, co) { if (!w) throw new Error(co); }
const pokaz = (lista, ile = 8) => lista.slice(0, ile).join("\n       ");

prawda(TALIA_STARTOWA.length >= 100, `talia podejrzanie mała: ${TALIA_STARTOWA.length}`);
prawda(PRODUKTY.length >= 100, `słownik produktów podejrzanie mały: ${PRODUKTY.length}`);

test("każde danie talii ma warstwę angielską, i nic ponad talię", () => {
  const ids = new Set(TALIA_STARTOWA.map(d => d.id));
  const brak = [...ids].filter(id => !DANIA_EN[id]?.nazwa?.trim());
  const nadmiar = Object.keys(DANIA_EN).filter(id => !ids.has(id));
  prawda(!brak.length, `bez angielskiej nazwy: ${brak.join(", ")}`);
  prawda(!nadmiar.length, `angielskie dania spoza talii: ${nadmiar.join(", ")}`);
});

test("tyle samo kroków w obu językach, żaden pusty", () => {
  const zle = TALIA_STARTOWA
    .filter(d => DANIA_EN[d.id])
    .filter(d => (DANIA_EN[d.id].kroki || []).length !== (d.kroki || []).length
              || (DANIA_EN[d.id].kroki || []).some(k => !String(k).trim()))
    .map(d => `${d.id}: PL ${(d.kroki || []).length}, EN ${(DANIA_EN[d.id].kroki || []).length}`);
  prawda(!zle.length, pokaz(zle));
});

const liczby = s => (String(s).match(/\d+(?:[.,]\d+)?/g) || []).map(x => x.replace(",", ".")).sort().join(" ");

test("każda liczba z polskiego kroku stoi w angielskim (i odwrotnie)", () => {
  const zle = [];
  for (const d of TALIA_STARTOWA) {
    const en = DANIA_EN[d.id]?.kroki || [];
    (d.kroki || []).forEach((k, i) => {
      if (liczby(k) !== liczby(en[i] ?? "")) zle.push(`${d.id} krok ${i + 1}: PL [${liczby(k)}] EN [${liczby(en[i] ?? "")}]`);
    });
  }
  prawda(!zle.length, `${zle.length} kroków z innymi liczbami:\n       ${pokaz(zle)}`);
});

test("polska część nazwy własnej należy do tego samego dania", () => {
  const zle = TALIA_STARTOWA
    .filter(d => DANIA_EN[d.id]?.nazwa?.includes(" — "))
    .filter(d => !d.nazwa.toLowerCase().startsWith(DANIA_EN[d.id].nazwa.split(" — ")[0].toLowerCase()))
    .map(d => `${d.id}: „${DANIA_EN[d.id].nazwa}” przy „${d.nazwa}”`);
  prawda(!zle.length, pokaz(zle));
});

test("angielskie nazwy dań są unikalne", () => {
  const nazwy = Object.values(DANIA_EN).map(d => d.nazwa);
  const dup = nazwy.filter((n, i) => nazwy.indexOf(n) !== i);
  prawda(!dup.length, `powtórzone: ${[...new Set(dup)].join(", ")}`);
});

/* Słowa polskie z założenia: polskie części nazw własnych dań i produktów. */
const POLSKA_LITERA = /[\p{L}]*[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ][\p{L}]*/gu;
const dozwolone = new Set([
  ...Object.values(DANIA_EN).flatMap(d => d.nazwa.includes(" — ") ? d.nazwa.split(" — ")[0].match(POLSKA_LITERA) || [] : []),
  ...Object.values(PRODUKTY_EN).flatMap(n => n.match(POLSKA_LITERA) || []),
].map(s => s.toLowerCase()));

test("w angielskim tekście nie ma polskich słów poza nazwami własnymi", () => {
  const zle = [];
  for (const [id, d] of Object.entries(DANIA_EN)) {
    for (const s of [d.nazwa.split(" — ").slice(1).join(" — "), ...(d.kroki || [])]) {
      for (const w of String(s).match(POLSKA_LITERA) || [])
        if (!dozwolone.has(w.toLowerCase())) zle.push(`${id}: „${w}”`);
    }
  }
  prawda(dozwolone.size >= 3, `lista słów dozwolonych podejrzanie krótka: ${dozwolone.size}`);
  prawda(!zle.length, pokaz(zle));
});

test("każdy produkt ma angielską nazwę, nic ponad słownik, nazwy unikalne", () => {
  const nazwy = new Set(PRODUKTY.map(p => p.n));
  const brak = [...nazwy].filter(n => !PRODUKTY_EN[n]?.trim());
  const nadmiar = Object.keys(PRODUKTY_EN).filter(n => !nazwy.has(n));
  const wart = Object.values(PRODUKTY_EN).map(v => v.toLowerCase());
  const dup = wart.filter((v, i) => wart.indexOf(v) !== i);
  prawda(!brak.length, `bez angielskiej nazwy: ${brak.join(", ")}`);
  prawda(!nadmiar.length, `spoza słownika: ${nadmiar.join(", ")}`);
  prawda(!dup.length, `ta sama angielska nazwa dla dwóch produktów: ${[...new Set(dup)].join(", ")}`);
});

test("każdy dział sklepu ma angielską nazwę", () => {
  const brak = [...new Set(PRODUKTY.map(p => p.dzial))].filter(d => !DZIALY_EN[d]);
  prawda(!brak.length, `bez angielskiej nazwy: ${brak.join(", ")}`);
});

/* Ekrany. Wyjątki z nazwy: podgląd odpowiedzi AI pokazuje danie, którego jeszcze
   nie ma w talii — jego nazwa przychodzi od modelu (sesja C). */
const EKRANY = ["talia.html", "jadlospis.html", "zakupy.html", "przepisy.html", "dodaj-z-ai.html", "formularz.html", "ustawienia.html", "index.html"];
const WYJATKI = new Set(["dodaj-z-ai.html|d.nazwa"]);

test("ekrany pokazują nazwy dań i produktów przez warstwę językową", () => {
  const zle = [];
  for (const plik of EKRANY) {
    const src = readFileSync(new URL(plik, KORZEN), "utf8").replace(/<script[\s\S]*?<\/script>/g, m => m.replace(/[^\n]/g, " "));
    for (const m of src.matchAll(/\s(?:x-text|:aria-label|:title)\s*=\s*"([^"]*)"/g)) {
      const linia = src.slice(0, m.index).split("\n").length;
      for (const p of m[1].matchAll(/((?:[\w$]+(?:\?\.|\.))+(?:nazwa|produkt))\b/g)) {
        const przed = m[1].slice(0, p.index);
        if (/\b(?:nazwaWJezyku|produktWJezyku|t)\(\s*$/.test(przed)) continue;
        if (/\bkuchniaDania\([^)]*\)\.nazwa$/.test(p[1]) || /kuchniaDania\([^)]*\)$/.test(przed)) continue;
        if (WYJATKI.has(`${plik}|${p[1]}`)) continue;
        zle.push(`${plik}:${linia}: ${p[1]}`);
      }
    }
  }
  prawda(!zle.length, pokaz(zle, 15));
});

console.log(`\n  zdane: ${zdane}, oblane: ${oblane}`);
process.exit(oblane ? 1 : 0);
