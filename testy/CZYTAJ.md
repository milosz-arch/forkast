# Testy Forkasta

Uruchomienie, z korzenia repozytorium:

    node testy/uruchom-testy.mjs

Zestawy leżą tutaj, a pliki aplikacji w korzeniu — ścieżki liczą się od położenia
pliku testu (`import.meta.url`), nie od katalogu, z którego uruchomiono node.

**Zasada tego folderu: test, który nigdy nie oblał, nie jest sprawdzony.**
Każdy nowy test sprawdzamy sabotażem — cofamy poprawkę i patrzymy, czy test
faktycznie się obala i czy komunikat mówi, co jest nie tak. Trzy razy w tym
projekcie zielony test nie sprawdzał niczego: `\b` nie działało na polskich
literach, lista skanowanych ekranów była pusta przez martwy przyrostek w nazwie,
a test kuchni pilnował błędu jako wymagania.

Testy, które chodzą po plikach, mają twardo żądać, żeby lista plików nie była
pusta. Pusty zbiór ma obalać test, nie zielenić go.
