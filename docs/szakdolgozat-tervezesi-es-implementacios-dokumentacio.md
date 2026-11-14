# CloudSim Web alkalmazás
## Tervezési és implementációs dokumentáció

## 1. Bevezetés

Az alkalmazás célja, hogy a CloudSim Plus szimulációs keretrendszerhez
grafikus konfigurációs felületet és HTTP-alapú végrehajtási szolgáltatást
biztosítson. A felhasználó egy adatközpontokból, fizikai hostokból, virtuális
gépekből és cloudletekből álló infrastruktúrát állíthat össze, majd a
konfigurációt szimulációként elküldheti a backendnek.

Az alkalmazás két önállóan futtatható részből áll:

- **frontend:** Angular-alapú konfigurációs felület;
- **backend:** Spring Boot és CloudSim Plus alapú szimulációs szolgáltatás.

Ez a dokumentum a rendszer tervezési döntéseit, a ténylegesen megvalósított
komponenseket, az adatmodellt, a kommunikációt és a futási folyamatot írja le.
A frontend bemutatása szándékosan csak a
[`DragAndDrop`](../src/components/drag-and-drop/drag-and-drop.ts) komponensre
korlátozódik.

## 2. Követelmények és hatókör

### 2.1. Funkcionális követelmények

A rendszernek lehetővé kell tennie:

1. egy vagy több adatközpont létrehozását;
2. host-sablonok adatközpontokba helyezését drag-and-drop művelettel;
3. hostok sorrendjének módosítását;
4. VM-ek és cloudletek létrehozását;
5. az infrastruktúra és a workload paramétereinek szerkesztését;
6. a konfiguráció böngészőben történő mentését és betöltését;
7. a konfiguráció backendnek való elküldését;
8. a szimuláció állapotának és eredményének lekérdezését.

### 2.2. Nem funkcionális követelmények

- A frontend és a backend REST/JSON kommunikációt használ.
- A szimuláció végrehajtása nem blokkolhatja a HTTP-kérést.
- A konfiguráció adatszerkezete legyen egyértelműen leképezhető
  CloudSim Plus objektumokra.
- A felhasználó kapjon visszajelzést a validációs, hálózati és futási hibákról.
- A backend legyen képes több, azonos időszakban indított munkamenet
  azonosítására.

## 3. Rendszerarchitektúra

### 3.1. Architektúra áttekintése

```text
Felhasználó
    |
    v
Angular DragAndDrop komponens
    |
    v
RequestService -- HTTP/JSON --> SimulationController
                                      |
                                      v
                             SimulationFactoryService
                                      |
                                      v
                               CloudSimContext
                                      |
                                      v
                             SimulationRunnerService
                                      |
                                      v
                                 CacheService
```

A frontend a konfiguráció szerkesztéséért és elküldéséért felel. A backend
feladata a DTO-kból CloudSim Plus objektumok létrehozása, a szimuláció
elindítása, az eredmények összegyűjtése és a munkamenet állapotának tárolása.

### 3.2. Technológiai háttér

| Terület | Technológia |
|---|---|
| Frontend | Angular 21, TypeScript |
| Drag-and-drop | Angular CDK DragDrop |
| Űrlapkezelés | Angular Reactive Forms |
| UI | Tailwind CSS, DaisyUI |
| Backend | Spring Boot 4.1.1 |
| Backend nyelve | Java 26 |
| Szimuláció | CloudSim Plus 8.0.0 |
| Adatátvitel | REST, JSON |
| Backend build | Maven |

A frontend függőségeit a
[`package.json`](../package.json), a backend függőségeit a
[`pom.xml`](../../CloudsimGUI/backend/pom.xml) tartalmazza.

## 4. Tervezési modell és adatstruktúra

### 4.1. A részletes kérés modellje

A részletes konfiguráció gyökérobjektuma a `DetailedRequestDto`:

```text
DetailedRequestDto
├── datacenters: DatacenterDto[]
│   ├── name
│   ├── costPerSec
│   ├── costPerMem
│   ├── costPerStorage
│   ├── costPerBw
│   └── hosts: HostDto[]
├── vms: VmDto[]
└── cloudlets: CloudletDto[]
```

A frontend oldali interfészek a
[`Models`](../src/Models/) könyvtárban, a backend oldali DTO-k a
[`dto`](../../CloudsimGUI/backend/src/main/java/com/cloudsimgui/backend/dto/)
csomagban találhatók.

### 4.2. Erőforrások jelentése

- **Datacenter:** a szimuláció infrastruktúra-szintű egysége és
  költségmodelljének hordozója.
- **Host:** fizikai gép, amely processzor- (PE), memória-, tárhely- és
  sávszélesség-kapacitást biztosít.
- **VM:** a hostokon futó virtuális gép, saját CPU-, memória-, tárhely- és
  sávszélesség-igénnyel.
- **Cloudlet:** végrehajtandó feladat, amelynek hossza millió utasításban,
  processzorigénye és fájlméretei vannak megadva.

A konfigurációban a hostok adatközponton belül, a VM-ek és cloudletek pedig
globális listában szerepelnek. A konkrét VM–host és cloudlet–VM hozzárendelést
a CloudSim Plus broker- és erőforrás-allokációs mechanizmusa végzi.

## 5. Frontend: a DragAndDrop komponens

### 5.1. Felelősség

A [`DragAndDrop`](../src/components/drag-and-drop/drag-and-drop.ts)
komponens a konfigurációs felület állapotkezelő és eseményvezérlő egysége.
Feladatai:

- adatközpontok kezelése;
- host-paletta megjelenítése;
- hostok másolása adatközpontokba;
- hostok átrendezése;
- VM-ek és cloudletek létrehozása;
- modális szerkesztőűrlapok kezelése;
- konfiguráció mentése és betöltése;
- kliensoldali validáció indítása;
- szimulációs kérés elküldése.

A sablon és a megjelenítés a
[`drag-and-drop.html`](../src/components/drag-and-drop/drag-and-drop.html),
a komponenshez tartozó egyedi stílus pedig a
[`drag-and-drop.css`](../src/components/drag-and-drop/drag-and-drop.css)
fájlban található.

### 5.2. Állapotkezelés

A komponens három tömbben tárolja a felhasználó által összeállított
konfigurációt:

```typescript
datacenters: DatacenterDTO[] = [];
vms: VmDTO[] = [];
cloudlets: CloudletDTO[] = [];
```

Ezek a tömbök közvetlenül a beküldendő `DetailedRequestDto` mezőivé válnak.
A host-paletta külön állapot:

```typescript
hostPalette: HostDTO[] = [
  { pes: 4, mips: 1000, ram: 16384, bw: 10000,
    storage: 1000000, vmScheduler: 'TimeShared' },
  { pes: 8, mips: 1000, ram: 16384, bw: 10000,
    storage: 1000000, vmScheduler: 'TimeShared' },
  { pes: 16, mips: 1000, ram: 16384, bw: 10000,
    storage: 1000000, vmScheduler: 'TimeShared' }
];
```

A paletta nem a konfiguráció része, hanem új hostok forrása. Emiatt a
palettán lévő sablonok változatlanok maradnak akkor is, ha a felhasználó egy
belőlük létrehozott hostot módosít.

### 5.3. Drag-and-drop működése

Az Angular CDK két direktívája valósítja meg a funkciót:

- `cdkDrag` jelöli a mozgatható host-kártyát;
- `cdkDropList` jelöli a palettát és az adatközpontok ejtési zónáit.

Az adatközpontok dinamikusan létrejövő zónái `dc-0`, `dc-1` stb. azonosítót
kapnak. A
`datacenterDropZoneIds` getter ezeket az azonosítókat állítja elő, a paletta
pedig a `cdkDropListConnectedTo` segítségével kapcsolódik hozzájuk.

Az eseménykezelő a `CdkDragDrop<HostDTO[]>` eseményből állapítja meg, hogy
átrendezés vagy másolás történt:

```text
előző konténer = célkonténer
    -> moveItemInArray

különböző konténerek
    -> copyArrayItem
    -> új objektumreferencia létrehozása
```

Az azonos konténeren belüli mozgatás csak a tömb sorrendjét módosítja. A
palettáról adatközpontba történő húzáskor a `copyArrayItem` először bemásolja
az elemet, majd a komponens spread operátorral új objektumot készít:

```typescript
const copiedItem = { ...event.container.data[event.currentIndex] };
event.container.data[event.currentIndex] = copiedItem;
```

Ez a másolás megakadályozza, hogy egy példány szerkesztése a paletta
eredeti sablonját vagy egy másik hostot módosítson.

### 5.4. Entitások létrehozása

Az `addDatacenter`, `addVm` és `addCloudlet` metódusok alapértelmezett
értékekkel hoznak létre új elemeket.

- Az adatközpont neve a tömb aktuális hosszából képződik.
- A VM sorszámozott azonosítót és alapértelmezett erőforrásértékeket kap.
- A cloudlet azonosítója sorszámozott, a hossza, PE-igénye és fájlméretei
  véletlenszerű kezdőértéket kapnak.

Az azonosító-generálás jelenleg nem külön számlálót, hanem a tömb hosszát
használja. Ez egyszerű és megfelelő a jelenlegi, törlés nélküli felülethez,
de későbbi törlési funkció esetén stabilabb azonosítókezelés szükséges.

### 5.5. Szerkesztési űrlapok

A komponens négy Reactive Formot definiál:

| Űrlap | Szerkesztett adatok |
|---|---|
| `hostForm` | PE, MIPS, RAM, BW, tárhely, VM scheduler |
| `vmForm` | PE, MIPS, RAM, BW, méret, cloudlet scheduler |
| `cloudletForm` | hossz, PE, input- és outputméret |
| `datacenterForm` | név és költségparaméterek |

Az űrlapok működési folyamata:

1. a felhasználó megnyomja a beállítások gombot;
2. a komponens eltárolja a kiválasztott objektum referenciáját;
3. az objektum adatai bekerülnek az űrlapba `patchValue` segítségével;
4. megnyílik a natív `<dialog>` elem;
5. mentéskor az űrlap értékei `Object.assign` segítségével visszakerülnek
   az állapotobjektumba;
6. a dialog bezáródik és a kiválasztás törlődik.

Custom scheduler választásakor a felület bekéri az osztály teljes nevét. Ha a
felhasználó visszavált beépített schedulerre, a komponens törli a korábbi
`customSchedulerClass` értéket.

### 5.6. Validáció és kommunikáció

A komponens a [`RequestService`](../src/services/request-service.ts)
`CreateRequest` metódusán keresztül küldi el a konfigurációt. A szolgáltatás
először kliensoldali validációt futtat, majd a kérést a
`POST /api/simulation/start` végpontra továbbítja.

Az ellenőrzések többek között:

- legalább egy adatközpont, VM és cloudlet megléte;
- minden adatközpontban legalább egy host;
- pozitív VM-, cloudlet- és host-paraméterek;
- pozitív adatközponti másodpercenkénti költség.

Siker esetén a backend egy jobazonosítót ad vissza. Hiba esetén a komponens
hibaüzenetet jelenít meg a hiba dialogban. A töltési állapotot az Angular
signal-alapú `isLoading` változó kezeli.

### 5.7. Helyi mentés

A komponens a részletes DTO JSON-reprezentációját a böngésző
`localStorage`-jében tárolja. A kulcs formátuma:

```text
cloudsim:simulation:{név}
```

A mentett nevek a `savedSimulationKeys` signalban jelennek meg. A mentés
eszköz- és böngészőfüggő; nem jelent backend oldali perzisztenciát.

## 6. Backend implementáció

### 6.1. Belépési pont és konfiguráció

A backend belépési pontja a
[`BackendApplication`](../../CloudsimGUI/backend/src/main/java/com/cloudsimgui/backend/BackendApplication.java)
osztály. A `@SpringBootApplication` bekapcsolja a Spring Boot automatikus
konfigurációját, a `@EnableAsync` pedig lehetővé teszi a szimuláció háttérben
történő futtatását.

A backend REST végpontjait a
[`SimulationController`](../../CloudsimGUI/backend/src/main/java/com/cloudsimgui/backend/controllers/SimulationController.java)
osztály definiálja.

### 6.2. REST API

| Metódus | Végpont | Feladat | Válasz |
|---|---|---|---|
| `POST` | `/api/simulation/start` | új szimuláció indítása | jobazonosító szövegként |
| `GET` | `/api/simulation/status/{id}` | állapot lekérdezése | státusz szövegként |
| `GET` | `/api/simulation/result/{id}` | eredmény lekérdezése | `ResultDto` JSON |

A controller a `start` kéréshez UUID-t generál, `Pending` állapotot ment, majd
átadja a kérést a factory és runner szolgáltatásoknak. A HTTP-válasz már a
szimuláció befejezése előtt visszatérhet, így a kliensnek a jobazonosító
alapján kell lekérdeznie az állapotot.

### 6.3. DTO-átalakítás CloudSim Plus objektumokra

A
[`SimulationFactoryService`](../../CloudsimGUI/backend/src/main/java/com/cloudsimgui/backend/services/SimulationFactoryService.java)
két kérésmódot ismer:

1. egyszerű kérés (`SimpleRequestDTO`);
2. részletes kérés (`DetailedRequestDto`).

A jelenlegi DragAndDrop felület a részletes módot használja. Az átalakítás
lépései:

1. `CloudSimPlus` szimuláció és `DatacenterBrokerSimple` broker létrehozása;
2. minden adatközponthoz hostlista létrehozása;
3. minden hosthoz a PE-k és a VM scheduler beállítása;
4. adatközpont létrehozása és költségparamétereinek beállítása;
5. VM-ek létrehozása és cloudlet scheduler hozzárendelése;
6. cloudletek létrehozása `UtilizationModelFull` használatával;
7. VM- és cloudlet-listák brokerhez küldése;
8. `SimulationContext` visszaadása.

Az átalakítás központi absztrakciója a
[`SimulationContext`](../../CloudsimGUI/backend/src/main/java/com/cloudsimgui/backend/dto/SimulationContext.java),
amely a szimulációt, a brokert és a cloudletek darabszámát együtt továbbítja
a futtató szolgáltatásnak.

### 6.4. Ütemezési stratégiák

A factory a DTO-ban megadott scheduler-név alapján választ stratégiát:

- `TimeShared` esetén `VmSchedulerTimeShared` vagy
  `CloudletSchedulerTimeShared`;
- más beépített esetben space-shared scheduler;
- `Custom` esetén a megadott teljes Java osztálynév reflexióval töltődik be.

A custom megoldás lehetővé teszi a CloudSim Plus bővíthetőségét, mert a
felhasználó saját scheduler implementációt adhat meg. A megoldás ugyanakkor
megbízható, ellenőrzött bemeneti környezetet igényel, mivel a backend
osztályt tölt be és példányosít.

A repositoryban további scheduler-kísérletek is megtalálhatók a
[`schedulers`](../../CloudsimGUI/backend/src/main/java/com/cloudsimgui/backend/schedulers/)
csomagban. Ezek közül a `CapacityCappedVmScheduler` a host kapacitásának
80%-ában korlátozza az új VM-ekhez rendelhető MIPS-kapacitást.

### 6.5. Aszinkron végrehajtás

A
[`SimulationRunnerService`](../../CloudsimGUI/backend/src/main/java/com/cloudsimgui/backend/services/SimulationRunnerService.java)
`@Async` metódusa hajtja végre a szimulációt:

```text
Pending
  -> InProgress
  -> CloudSimPlus.start()
  -> cloudletek eredményeinek összegyűjtése
  -> ResultDto létrehozása
  -> Completed
```

Kivétel esetén a státusz `Failed` értékre vált. A runner a befejezett
cloudletekből azonosítót, státuszt, VM-azonosítót, kezdési időt, befejezési
időt és tényleges CPU-időt állít elő.

A teljes végrehajtási idő a CloudSim szimulációs órájának értéke. A CPU-költség
a cloudletek tényleges CPU-ideje és a cloudlet VM-jét tartalmazó adatközpont
`costPerSecond` értéke alapján számítódik:

```text
totalCpuCost =
    összeg(cloudlet.actualCpuTime * datacenter.costPerSecond)
```

### 6.6. Állapot- és eredménytárolás

A
[`CacheService`](../../CloudsimGUI/backend/src/main/java/com/cloudsimgui/backend/services/CacheService.java)
két `ConcurrentHashMap` struktúrát használ:

- jobazonosító -> `Statuses`;
- jobazonosító -> `ResultDto`.

Ez egyszerű, gyors és párhuzamos hozzáférésre alkalmas megoldás egy
demonstrációs vagy egy példányban futó alkalmazáshoz. A tárolás memóriában
történik, ezért újraindításkor minden állapot és eredmény elveszik, továbbá
vízszintes skálázás esetén központi tároló szükséges.

## 7. Végponttól végpontig tartó működés

```text
1. A felhasználó adatközpontot hoz létre.
2. Hostot húz a palettáról az adatközpont drop zónájába.
3. VM-eket és cloudleteket ad hozzá.
4. Az objektumokat modális űrlapokon konfigurálja.
5. A frontend validálja a DetailedRequestDto-t.
6. POST /api/simulation/start
7. A backend jobazonosítót generál és Pending állapotot tárol.
8. A factory CloudSim Plus objektumokat épít.
9. Az async runner InProgress állapotban elindítja a szimulációt.
10. A frontend két másodpercenként lekéri a státuszt.
11. Completed állapotnál a frontend lekéri a ResultDto-t.
```

## 8. Hibakezelés

### 8.1. Frontend

- üres vagy hiányos konfiguráció esetén a `RequestService` szinkron kivételt
  dob;
- HTTP-hiba esetén az Observable `error` ága fut le;
- a komponens a backend hibaüzenetét, ennek hiányában a kliens hibaüzenetét
  jeleníti meg;
- mentési és betöltési hiba esetén a felhasználó dialog vagy böngészői
  figyelmeztetés formájában kap visszajelzést.

### 8.2. Backend

- érvénytelen kérésmód esetén a factory kivételt dob;
- custom scheduler betöltési hibája futási hibát eredményez;
- a runner általános kivétel esetén `Failed` állapotot ír a cache-be;
- nem ismert jobazonosítóhoz a cache `Not_Found` státuszt ad.

A későbbi stabilizálás részeként célszerű egységes kivételkezelőt,
strukturált hibaválaszokat, DTO-szintű Bean Validation annotációkat és
ismeretlen eredmény esetén megfelelő HTTP státuszkódokat bevezetni.

## 9. Tesztelési stratégia

A backend jelenlegi tesztje a Spring alkalmazáskörnyezet betöltődését
ellenőrzi a
[`BackendApplicationTests`](../../CloudsimGUI/backend/src/test/java/com/cloudsimgui/backend/BackendApplicationTests.java)
osztályban. A frontend oldalon a szolgáltatás tesztfájlja található meg.

A teljes funkcionalitás ellenőrzéséhez az alábbi célzott tesztek javasoltak:

1. host palettáról történő másolás és referenciafüggetlenség;
2. hostok sorrendjének módosítása ugyanazon drop zónán belül;
3. kliensoldali validáció minden hibatípusára;
4. konfiguráció mentése, betöltése és hibás JSON kezelése;
5. részletes DTO factory átalakítása;
6. scheduler-feloldás beépített és custom értékekre;
7. státuszátmenetek `Pending`–`InProgress`–`Completed` és `Failed`;
8. CPU-költség és cloudlet-eredmények számítása;
9. REST controller végpontjai MockMvc segítségével.

## 10. Futtatás és telepítés

### 10.1. Frontend

```powershell
cd C:\Beni\CloudSimWebApp\CloudSimGUIFrontend
npm install
npm start
```

Az Angular fejlesztői szerver alapértelmezés szerint a
`http://localhost:4200` címen érhető el.

### 10.2. Backend

```powershell
cd C:\Beni\CloudSimWebApp\CloudsimGUI\backend
.\mvnw.cmd spring-boot:run
```

A frontend jelenleg a `http://localhost:8080/api/simulation` címet használja.
A CORS-beállítás a `SimulationController` szerint a `localhost:4200`
originről engedélyezi a kéréseket.

## 11. Korlátok és továbbfejlesztési lehetőségek

- A konfiguráció és a futási eredmények memóriában tárolódnak.
- Nincs adatbázis-alapú vagy felhasználóhoz kötött perzisztencia.
- A frontend `localStorage` mentései nem érhetők el másik gépről.
- A frontend és backend validációja nem teljesen ugyanabban a rétegben
  történik.
- A konfigurációban nincs explicit VM–host vagy cloudlet–VM kapcsolat.
- Nincs törlési művelet minden entitástípushoz.
- A tömbhosszra épülő azonosító-generálás törlés után ütközhet.
- A backend általános hibákhoz nem ad egységes JSON hibasémát.
- A custom scheduler reflexiós betöltése csak megbízható bemenet mellett
  alkalmazható.
- Több backend példány használatához megosztott cache és háttérfeladat-kezelő
  szükséges.
- A backend URL-je jelenleg a frontend szolgáltatásában rögzített érték,
  ezért környezeti konfiguráció bevezetése indokolt.

## 12. Összegzés

Az alkalmazás rétegzett felépítése elválasztja a szimuláció konfigurálását,
a HTTP-kommunikációt és a CloudSim Plus futtatását. A frontend
DragAndDrop komponense közvetlen, vizuális módon teszi lehetővé az
infrastruktúra felépítését, miközben a backend DTO-alapú factory segítségével
egységes CloudSim Plus modellt készít. Az aszinkron végrehajtás és a
jobazonosító-alapú állapotkövetés lehetővé teszi, hogy a hosszabb szimulációk
ne blokkolják a kliens és a szerver közötti indítási kérést.

