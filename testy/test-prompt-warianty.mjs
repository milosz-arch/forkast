import { zbudujPrompt, zbudujPromptZLinku, zbudujPromptZeZdjec } from "../prompt.js";

let zdane = 0, oblane = 0;
function test(nazwa, fn) {
  try { fn(); zdane++; console.log(`  ok   ${nazwa}`); }
  catch (e) { oblane++; console.log(`  BLAD ${nazwa}\n       ${e.message}`); }
}
function prawda(w, co) { if (!w) throw new Error(co || "oczekiwano prawdy"); }

const SLOWNIK = [{ n: "Ryż basmati", dzial: "Spiżarnia" }];

console.log("\n— zbudujPromptZLinku —");

test("zawiera podany URL", () => {
  const p = zbudujPromptZLinku("https://przyklad.pl/przepis/pierogi", SLOWNIK);
  prawda(p.includes("https://przyklad.pl/przepis/pierogi"));
});

test("prosi o trzymanie się źródła, nie wymyślanie", () => {
  const p = zbudujPromptZLinku("https://x.pl", SLOWNIK);
  prawda(/nie wymyślaj/.test(p));
});

test("ma ten sam format odpowiedzi co wariant z nazwami", () => {
  const a = zbudujPrompt(["X"], SLOWNIK);
  const b = zbudujPromptZLinku("https://x.pl", SLOWNIK);
  const wspolny = a.split("FORMAT ODPOWIEDZI")[1];
  prawda(b.includes(wspolny.split("WYMAGANIA")[0].trim().slice(0, 50)), "ten sam blok formatu");
});

console.log("\n— zbudujPromptZeZdjec —");

test("nie ma URL ani nazwy dania, bo dane są w zdjęciach", () => {
  const p = zbudujPromptZeZdjec(SLOWNIK);
  prawda(/zdjęcia/.test(p));
  prawda(!/http/.test(p), "żadnego linku w tym wariancie");
});

test("mówi, co zrobić z nieczytelnym fragmentem", () => {
  const p = zbudujPromptZeZdjec(SLOWNIK);
  prawda(/nieczytelne|uwaga/i.test(p));
});

test("wykluczenia i liczba domowników działają tak samo jak w oryginale", () => {
  const p = zbudujPromptZeZdjec(SLOWNIK, ["gluten"], 3);
  prawda(p.includes("CZEGO NIE UŻYWAĆ"));
  prawda(p.includes("zwykle 3"));
});

console.log("\n— zdjęcia: przepis kontra talerz —");

test("prompt ze zdjęć rozróżnia zdjęcie przepisu od zdjęcia gotowego dania", () => {
  /* To dwa różne zadania. Przy przepisie model ma odczytywać i nie wymyślać;
     przy talerzu musi uzupełnić gramaturę i kroki, bo ich nie widać. Bez tego
     rozróżnienia zdjęcie talerza dawało odpowiedź „nieczytelne”. */
  const p = zbudujPromptZeZdjec([{ n: "Jajka", dzial: "Nabiał" }]);
  prawda(p.includes("PRZYPADEK A"), "brak instrukcji dla zdjęcia przepisu");
  prawda(p.includes("PRZYPADEK B"), "brak instrukcji dla zdjęcia talerza");
});

test("przy zdjęciu talerza model ma powiedzieć, że to jego wersja", () => {
  /* Przepis zmyślony z wyglądu i przepis odczytany z książki to nie to samo,
     a człowiek musi wiedzieć który dostał. */
  const p = zbudujPromptZeZdjec([{ n: "Jajka", dzial: "Nabiał" }]);
  prawda(p.includes("powstał z rozpoznania zdjęcia"), "model ma oznaczyć, że przepis jest jego wersją");
});

console.log(`\nzdane: ${zdane}, oblane: ${oblane}\n`);
process.exit(oblane ? 1 : 0);
