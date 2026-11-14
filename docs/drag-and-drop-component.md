# CloudSim Web frontend – tervezési és implementációs dokumentáció

## 1. A rendszer célja és hatóköre

A CloudSim Web frontend egy Angular-alapú kliensalkalmazás, amely grafikus
felületet biztosít felhőszimulációk összeállításához és kiértékeléséhez. A
frontend nem maga hajtja végre a CloudSim szimulációt: a konfiguráció
összeállítása, ellenőrzése és továbbítása a kliens feladata, a szimulációs
motor a backendben fut.

A jelenlegi megvalósítás fő céljai:

1. a fizikai infrastruktúra vizuális felépítése;
2. a virtuális erőforrások és feladatok paraméterezése;
3. a konfiguráció ismételt felhasználásának támogatása;
4. aszinkron szimulációindítás és állapotkövetés;
5. a szimuláció eredményének áttekinthető bemutatása.

Ez a leírás a repository aktuális állapotát dokumentálja. A megvalósított
funkciókat elválasztja a prototípusban megmaradt, jelenleg nem routolt
komponensektől és a későbbi fejlesztési lehetőségektől.

## 2. Funkcionális követelmények

### 2.1. Konfiguráció létrehozása

A felhasználó képes:

- új adatközpontot létrehozni;
- előre definiált host-sablont adatközpontba húzni;
- hostokat ugyanazon adatközponton belül átrendezni;
- virtuális gépet létrehozni;
- cloudletet létrehozni;
- az egyes elemek paramétereit modális ablakban módosítani;
- a konfigurációt név alapján elmenteni és később betölteni.

### 2.2. Szimuláció futtatása

A kliens a konfigurációt részletes kérésként szerializálja, majd a backend
`POST /api/simulation/start` végpontjára küldi. A válasz egy szöveges
azonosító, amely a szimulációs munkamenetet azonosítja.

### 2.3. Eredmények megjelenítése

A frontend a munkamenet azonosítójával rendszeresen lekérdezi a futási
állapotot. Befejezés után letölti az eredményobjektumot, és megjeleníti:

- a teljes végrehajtási időt;
- a teljes CPU-költséget;
- a sikeres cloudletek számát;
- cloudletenként a hozzárendelt VM-et, státuszt és időadatokat;
- az egyes cloudletek futási idejét oszlopdiagramon;
- a VM-ek közötti terheléseloszlást fánkdiagramon.

## 3. Rendszerarchitektúra

### 3.1. Rétegek

Az alkalmazás három, jól elkülöníthető felelősségi szintre bontható:

1. **Megjelenítési réteg:** Angular komponensek és HTML sablonok. Feladata a
   konfigurációs felület, a modális űrlapok és az eredményoldal kirajzolása.
2. **Alkalmazási réteg:** a komponensek állapota és eseménykezelő metódusai.
   Itt történik a drag-and-drop műveletek, a szerializálás, a mentés és a
   navigáció vezérlése.
3. **Kommunikációs és modellréteg:** a DTO interfészek és a
   `RequestService`. Ez a réteg definiálja a backenddel használt adatstruktúrát,
   validálja a részletes konfigurációt, valamint kezeli a HTTP-kéréseket és a
   pollingot.

### 3.2. Aktív útvonalak

| Útvonal | Komponens | Szerep |
| --- | --- | --- |
| `/` | `DragAndDrop` | A fő szimulációtervező |
| `/results/:jobId` | `Result` | Állapotkövetés és eredményjelentés |
| Ismeretlen útvonal | átirányítás `/` | Hibás URL kezelése |

Az útvonalakat a [src/app/app.routes.ts](../src/app/app.routes.ts) definiálja.
Az alkalmazás gyökérkomponense router outletet és globális téma-váltót
tartalmaz; a tényleges oldalak az útvonalakon keresztül jelennek meg.

### 3.3. Fontos forrásfájlok

| Fájl | Felelősség |
| --- | --- |
| [src/components/drag-and-drop/drag-and-drop.ts](../src/components/drag-and-drop/drag-and-drop.ts) | Tervezőállapot, műveletek, űrlapok, mentés és indítás |
| [src/components/drag-and-drop/drag-and-drop.html](../src/components/drag-and-drop/drag-and-drop.html) | Tervező felhasználói felülete |
| [src/components/result/result.ts](../src/components/result/result.ts) | Polling, eredményfeldolgozás és diagramadatok |
| [src/components/result/result.html](../src/components/result/result.html) | Eredményjelentés |
| [src/services/request-service.ts](../src/services/request-service.ts) | Backend-kommunikáció és validáció |
| [src/Models/](../src/Models/) | Kliensoldali DTO interfészek |
| [src/app/app.config.ts](../src/app/app.config.ts) | Standalone Angular alkalmazás konfigurációja |

## 4. A szimulációs modell tervezése

A konfigurációt a `DetailedRequestDto` reprezentálja. Az infrastruktúra
hierarchikus, míg a VM- és cloudlet-gyűjtemény közvetlenül a részletes kérés
része:

```text
DetailedRequestDto
├── datacenters: DatacenterDTO[]
│   ├── name
│   ├── costPerSec
│   ├── costPerMem
│   ├── costPerStorage
│   ├── costPerBw
│   └── hosts: HostDTO[]
│       ├── pes, mips, ram
│       ├── storage, bw
│       ├── vmScheduler
│       └── customSchedulerClass?
├── vms: VmDTO[]
│   ├── id
│   ├── mips, pes, ram, bw, size
│   ├── cloudletScheduler?
│   └── customSchedulerClass?
└── cloudlets: CloudletDTO[]
    ├── id
    ├── length, pes
    └── fileSize, outputSize
```

Az adattípusokat a [src/Models/detailed-request-dto.ts](../src/Models/detailed-request-dto.ts),
[src/Models/datacenter-dto.ts](../src/Models/datacenter-dto.ts),
[src/Models/host-dto.ts](../src/Models/host-dto.ts),
[src/Models/vm-dto.ts](../src/Models/vm-dto.ts) és
[src/Models/cloudlet-dto.ts](../src/Models/cloudlet-dto.ts) tartalmazza.

A frontend jelenleg nem tartalmaz explicit VM–host vagy cloudlet–VM
hozzárendelési mezőt. Ezeket a backend szimulációs logikája és az ütemezési
stratégia kezeli.

## 5. A tervező felület implementációja

### 5.1. Központi állapot

A `DragAndDrop` komponens három, a kérésbe bekerülő gyűjteményt tart fenn:

```typescript
datacenters: DatacenterDTO[] = [];
vms: VmDTO[] = [];
cloudlets: CloudletDTO[] = [];
```

Ezek a tömbök a komponens aktuális állapotának forrásai. A hostpaletta
különálló, három sablonból álló gyűjtemény; a sablonok csak másolással kerülnek
be egy adatközpont hostlistájába.

### 5.2. Drag-and-drop működés

Az Angular CDK `cdkDropList` és `cdkDrag` direktívái kapcsolják össze a
palettát az adatközpontok dinamikusan létrehozott drop zónáival
(`dc-0`, `dc-1`, ...).

A `dropHost` két esetet kezel:

- azonos konténerben végzett mozgatáskor `moveItemInArray` rendezi át a
  hostokat;
- eltérő konténer esetén `copyArrayItem` másolja a sablont, majd a komponens
  új objektumreferenciát készít.

Az objektummásolás fontos, mert így egy már felhasznált host szerkesztése nem
módosítja a palettán lévő sablont.

### 5.3. Entitások létrehozása

- Az új adatközpont alapértelmezett költségértékekkel és üres hostlistával
  jön létre.
- Az új VM szekvenciális azonosítót és alapértelmezett erőforrásértékeket kap.
- Az új cloudlet szekvenciális azonosítót kap; a hossz, a fájlméretek és a
  PE-igény véletlenszerű kezdőértékkel jön létre.

Az azonosítók a komponens tömbhosszából származnak. Törlési funkció hiányában
ezek az azonosítók a jelenlegi implementációban nem kerülnek újraszámozásra.

### 5.4. Modális űrlapok

A komponens négy Reactive Formot használ:

- `hostForm`: PE-szám, MIPS, RAM, sávszélesség, tárhely és VM-ütemező;
- `vmForm`: PE-szám, MIPS, RAM, sávszélesség, lemezkép-méret és
  cloudlet-ütemező;
- `cloudletForm`: feladathossz, PE-szám, bemeneti és kimeneti fájlméret;
- `datacenterForm`: név és költségparaméterek.

Az általános szerkesztési folyamat:

```text
beállítások gomb
  -> kiválasztott objektum eltárolása
  -> értékek betöltése az űrlapba
  -> <dialog> megnyitása
  -> felhasználói módosítás
  -> Object.assign az objektumra
  -> dialog bezárása és kiválasztás törlése
```

Ha a felhasználó a `Custom` ütemezőről beépített ütemezőre vált, a korábbi
egyéni osztálynév törlődik. A sablonban lévő kötelező mezők az űrlap
menthetőségét szabályozzák, a domain-szintű ellenőrzést pedig a szolgáltatás
végzi.

## 6. Validáció és hibakezelés

Az indítás előtt a [RequestService](../src/services/request-service.ts)
szinkron módon ellenőrzi a részletes kérést. Jelenlegi szabályok:

- legalább egy adatközpont, VM és cloudlet szükséges;
- minden adatközpontnak legalább egy hostot kell tartalmaznia;
- a VM PE-, MIPS- és RAM-értéke pozitív;
- a cloudlet PE- és hosszértéke pozitív;
- minden adatközpont másodpercenkénti költsége pozitív;
- a host PE-, MIPS-, RAM-, tárhely- és sávszélességértéke pozitív.

Hiba esetén a validáció `Error` kivételt dob, amelyet a tervező komponens
hibaablakban jelenít meg. A HTTP-hibákat az Observable `error` ága kezeli.
Az üzenet elsődlegesen a backend `error.message` mezőjéből, másodlagosan a
HTTP-kliens hibaüzenetéből származik.

A validáció jelenlegi korlátja, hogy az űrlapok nem minden numerikus mezőhöz
használnak explicit Angular validátort; a végső ellenőrzés a kérés elküldésekor
történik. Ez tudatosan dokumentálandó különbség a felületi és a domain-validáció
között.

## 7. Backend-kommunikáció és életciklus

### 7.1. Kérésindítás

A komponens a három állapotgyűjteményből állítja össze a részletes kérést:

```typescript
const payload: DetailedRequestDto = {
  datacenters: this.datacenters,
  vms: this.vms,
  cloudlets: this.cloudlets
};
```

A szolgáltatás ezt a backend által elvárt burkoló objektumba helyezi:

```json
{
  "simpleRequest": null,
  "detailedRequest": {
    "datacenters": [],
    "vms": [],
    "cloudlets": []
  }
}
```

A kérés válasza szöveges jobazonosító. Sikeres indítás után a frontend a
`/results/{jobId}` oldalra navigál.

### 7.2. Polling és eredményletöltés

A `pollRequest` RxJS `timer(0, 2000)` segítségével azonnal, majd két
másodpercenként lekéri a `/status/{jobId}` végpontot. A folyamat a
`COMPLETED` vagy `FAILED` állapotot tartalmazó válasznál áll le. Sikeres
befejezés után a `Result` komponens meghívja a
`/result/{jobId}` végpontot.

Az eredménymodell:

```text
ResultDto
├── jobId
├── totalExecutionTime
├── totalCpuCost
├── totalCloudlets
├── successfulCloudlets
└── cloudletResults: CloudletExecutionResultDto[]
    ├── cloudletId, status, vmId
    └── execTime, startTime, finishTime
```

### 7.3. Eredményfeldolgozás

A `Result` komponens a letöltött eredményből két diagram adatait számítja:

- az oszlopdiagram minden cloudlethez egy futási időt rendel;
- a fánkdiagram a cloudletek `execTime` értékeit VM-azonosító szerint
  összegzi.

Az eredményoldal külön kezeli a betöltési, hibás és sikeres állapotot. A
Chart.js kompatibilitása érdekében új adatobjektumok jönnek létre, majd a
diagramok frissítése explicit módon megtörténik.

## 8. Helyi perzisztencia és téma

A mentés kizárólag a böngésző `localStorage`-jében történik. A kulcs formátuma:

```text
cloudsim:simulation:{simulationName}
```

A mentett adat a beküldött `DetailedRequestDto` JSON-reprezentációja. A név
alapján történő mentés meglévő név esetén felülírja az értéket. Betöltéskor a
JSON feldolgozása után a három állapotgyűjtemény lecserélődik.

Ez a megoldás nem szerveroldali perzisztencia: a mentések nem érhetők el másik
böngészőből, eszközről vagy felhasználótól. A mentési séma jelenleg nincs
verziózva, ezért egy későbbi, inkompatibilis DTO-módosítás migrációt tehet
szükségessé.

Az `App` komponens a `data-theme` attribútumon keresztül váltja a DaisyUI
világos és sötét témáját, a választást pedig a `theme` localStorage-kulcsban
tárolja. Kezdeti értékként a korábbi választás, ennek hiányában a rendszer
preferált színsémája használatos.

## 9. Nem aktív prototípus-elemek

A repositoryban megtalálható a `SimpleRequest` és a `DetailedRequest`
komponens, valamint a `Nav` komponens is. Ezek korábbi vagy alternatív
felhasználói folyamatokat reprezentálnak:

- a `SimpleRequest` paraméterezett, egyszerű kérésmodellt készít;
- a `DetailedRequest` JSON-szöveges szerkesztőt és egy előre definiált
  konfigurációt tartalmaz;
- a `Nav` egyszerű navigációs gombokat tartalmaz.

A jelenlegi route-konfiguráció azonban csak a drag-and-drop tervezőt és az
eredményoldalt aktiválja. A nem routolt komponenseket ezért nem szabad a
jelenlegi működő felület részeként bemutatni; szakdolgozatban opcionális,
korábbi prototípusként vagy későbbi bővítési alapként érdemes hivatkozni rájuk.

## 10. Tesztelési és üzemeltetési szempontok

Az Angular CLI által biztosított parancsok:

```bash
npm install
npm start
npm run build
npm test
```

A jelenlegi unit tesztkészlet alapvetően a szolgáltatás példányosíthatóságát
ellenőrzi. A teljes funkcionalitás megbízhatóbb ellenőrzéséhez indokolt
célzott tesztekkel lefedni a validációs szabályokat, a polling
állapotátmeneteit, a konfiguráció mentését/betöltését és az eredményből
számított diagramadatokat.

Üzemeltetéskor a backend URL-je jelenleg a szolgáltatásban rögzített
`http://localhost:8080/api/simulation` értékből származik. Éles vagy több
környezetet használó telepítéshez ezt környezeti konfigurációval célszerű
kiváltani.

## 11. Jelenlegi korlátok és továbbfejlesztési lehetőségek

- nincs törlési művelet adatközpontra, hostra, VM-re vagy cloudletre;
- a hostoknak nincs saját azonosítójuk, a tömbbeli pozíciójuk azonosítja őket;
- a konfiguráció mentése nem tartalmaz sémaverziót;
- a validáció végső része csak szimulációindításkor fut le;
- a felület nyelvhasználata vegyesen magyar és angol;
- a backend URL-je nincs környezeti konfigurációba szervezve;
- az explicit VM–host és cloudlet–VM kapcsolatok nem jelennek meg a DTO-ban;
- a HTTP-szolgáltató regisztrációját az `app.config.ts` importálja, de a
  `providers` tömb jelenlegi állapotában nem hívja meg a
  `provideHttpClient()` függvényt; a működő backend-kommunikációhoz ezt
  ellenőrizni és szükség esetén javítani kell.

Ezek a pontok nem a jelenlegi működés részei, hanem a rendszer további
stabilizálásának és bővítésének konkrét irányai.
