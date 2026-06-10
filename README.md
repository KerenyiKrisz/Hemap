# HEMA edzéstérkép

Interaktív térkép a magyarországi és felvidéki HEMA (történelmi európai
harcművészetek / hosszúkardvívás) edzéshelyszínekről.

- **Hover** a pöttyön → rövid infó (klub, város, nap)
- **Kattintás** a pöttyön → részletes infobox címmel, időponttal, és gombbal a klub oldalára
- **Keresés** városra vagy klubnévre a fejlécben

Technológia: [Leaflet.js](https://leafletjs.com/) + OpenStreetMap. Nincs szerver,
nincs adatbázis, nincs API-kulcs — tisztán statikus, bárhova beágyazható.

---

## 📁 Mit tartalmaz a repo

```
index.html        a térkép oldala
style.css         megjelenés
app.js            térkép logika
data/clubs.json   az adatok, AMIT A TÉRKÉP HASZNÁL (generált – ne kézzel szerkeszd)
MHS_klubok.xlsx   EZT SZERKESZTED TE – innen készül a clubs.json
scripts/build.py  Excel → clubs.json konvertáló + automatikus geokódolás
logos/            (opcionális) klublogók ide
```

---

## ➕ Hogyan adok hozzá új klubot?  (a lényeg)

1. **Nyisd meg a `MHS_klubok.xlsx` fájlt.**
2. **Írj egy új sort.** Egy sor = egy edzéshelyszín (egy pötty a térképen).
   Ha egy klubnak több terme/városa van, mindegyik külön sor.
   - **Klub** – a klub neve *(kötelező)*
   - **Helyszín neve** – pl. „Belvárosi terem” *(opcionális, több terem megkülönböztetéséhez)*
   - **Település** – város *(kötelező)*
   - **Cím** – pontos utca, házszám, irányítószám *(kötelező, ebből keresi meg a helyet)*
   - **Nap** – pl. „Kedd, Péntek” *(kötelező)*
   - **Időpont** – pl. „18:00–20:00” *(kötelező)*
   - **Link** – a klub honlapja/közösségi oldala, ide visz a kattintás *(kötelező)*
   - **Logó URL** – logó képének linkje *(opcionális)*
   - **Lat / Lng** – **HAGYD ÜRESEN!** A szkript automatikusan kitölti a címből.
     Csak akkor írj ide számot, ha a pötty nem jó helyre került, és pontosítani akarod.
3. **Mentsd el az Excelt.**
4. **Futtasd a build szkriptet** (lásd lent). Ez frissíti a `data/clubs.json`-t.
5. **Töltsd fel a változást GitHubra.** A térkép automatikusan az új adattal jelenik meg.

> A koordinátákat a szkript egyszer kéri le, utána egy gyorsítótárba menti
> (`scripts/geocache.json`), így legközelebb gyors lesz, és nem terheli feleslegesen
> az ingyenes geokódoló szolgáltatást.

---

## ⚙️ Build futtatása (a clubs.json frissítése)

Egyszeri előkészítés (elég egyszer telepíteni):
```bash
pip install -r requirements.txt
```

Minden Excel-módosítás után ezt futtasd a projekt mappájában:
```bash
python scripts/build.py
```

A szkript kiírja, hány helyszín készült el, mennyit geokódolt automatikusan,
és jelez, ha valamelyik címet nem találta meg (azt érdemes pontosítani az
Excelben, vagy kézzel beírni a Lat/Lng oszlopba).

---

## 🌐 Beágyazás a hosszukardvivas.hu oldalba

A `clubs.json` betöltése miatt a térképet **webszerverről** kell megnyitni
(nem dupla kattintással az `index.html`-en). Két út:

### 1. GitHub Pages (ajánlott, ingyenes)
1. A repo **Settings → Pages** menüjében válaszd a `main` branch / `root` mappát.
2. Pár perc múlva él a térkép itt: `https://<felhasználónév>.github.io/<repo-név>/`
3. A weboldalba (WordPress) így ágyazod be — illeszd be egy „Egyéni HTML” blokkba:
   ```html
   <iframe
     src="https://<felhasználónév>.github.io/<repo-név>/"
     style="width:100%;height:640px;border:0;border-radius:12px;overflow:hidden"
     loading="lazy"
     title="HEMA edzéstérkép">
   </iframe>
   ```
   (lásd `embed-example.html` a kész példáért)

### 2. Saját tárhelyre feltöltve
Másold a teljes mappát a webtárhelyre (pl. `hosszukardvivas.hu/terkep/`), és
ágyazd be ugyanígy `<iframe>`-mel a `terkep/` útvonalra mutatva.

---

## 🧪 Helyi tesztelés

```bash
python -m http.server 8000
```
Majd nyisd meg: `http://localhost:8000`

---

## Adatforrás

Az edzésadatok a Magyar Hosszúkardvívás közössége által gyűjtött információk.
Térképadatok © OpenStreetMap közreműködők.
