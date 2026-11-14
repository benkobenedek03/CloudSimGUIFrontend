# CloudSim Web – frontend

Ez a repository a CloudSim-alapú szimulációs rendszer Angular frontendje. Az
alkalmazás célja, hogy a felhasználó böngészőből összeállíthassa a
szimulációhoz szükséges fizikai infrastruktúrát és logikai terhelést, a
konfigurációt a backendnek elküldhesse, majd a futás eredményét grafikus és
táblázatos formában megtekinthesse.

## Aktuális funkcionalitás

- vizuális, drag-and-drop alapú szimulációtervező;
- adatközpontok és fizikai hostok felvétele;
- virtuális gépek és cloudletek létrehozása és paraméterezése;
- CloudSim ütemezők kiválasztása, illetve egyéni ütemezőosztály megadása;
- kliensoldali konfiguráció-ellenőrzés;
- konfiguráció mentése és betöltése böngészőből (`localStorage`);
- szimuláció indítása HTTP API-n keresztül;
- futási állapot lekérdezése és eredmény-megjelenítés;
- KPI-k, cloudletenkénti futási adatok, oszlopdiagram és fánkdiagram;
- világos és sötét megjelenítési téma.

A részletes tervezési és implementációs leírás a
[docs/drag-and-drop-component.md](docs/drag-and-drop-component.md) fájlban
található. A dokumentum szakdolgozati fejezetek alapjaként is használható.

## Technológiai háttér

- Angular 21 és standalone komponensek;
- TypeScript;
- Angular Router és Angular Dependency Injection;
- Angular CDK Drag and Drop;
- Angular Forms és Reactive Forms;
- RxJS;
- Chart.js és `ng2-charts`;
- Tailwind CSS és DaisyUI;
- Vitest az Angular unit teszteléséhez.

## Futtatás

```bash
npm install
npm start
```

Az alkalmazás alapértelmezés szerint a `http://localhost:4200/` címen érhető
el. A backendnek a `http://localhost:8080` címen kell futnia, és biztosítania
kell az alábbi végpontokat:

```text
POST /api/simulation/start
GET  /api/simulation/status/{jobId}
GET  /api/simulation/result/{jobId}
```

## Build és teszt

```bash
npm run build
npm test
```

Az `npm run build` production buildet készít a `dist/` könyvtárban. Az
`npm test` a projektben definiált unit teszteket futtatja.

## Aktív útvonalak

| Útvonal | Komponens | Funkció |
| --- | --- | --- |
| `/` | `DragAndDrop` | Szimuláció összeállítása és indítása |
| `/results/:jobId` | `Result` | Futási állapot és eredmény megjelenítése |

Az egyszerű konfigurációs és a szöveges részletes konfigurációs komponens
forráskódja jelen van, de a jelenlegi route-konfiguráció nem rendeli ezeket
aktív útvonalhoz.
