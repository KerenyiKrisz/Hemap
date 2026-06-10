/* ============================================================
   HEMA edzéstérkép – logika
   ============================================================ */

const MAP_CENTER = [47.3, 18.6];   // Magyarország + Felvidék középre
const MAP_ZOOM = 7;

const map = L.map("map", {
  center: MAP_CENTER,
  zoom: MAP_ZOOM,
  scrollWheelZoom: true,
  zoomControl: true,
});

// Sötét, visszafogott csempék – illeszkedik a témához
L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap, © CARTO",
}).addTo(map);

// --- SVG ikonok az infoboxhoz ---
const ICONS = {
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10Z"/><circle cx="12" cy="11" r="2"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 9h16M8 3v4M16 3v4"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

let allMarkers = [];   // { marker, data, latlng }
let groups = [];

/* Egy infobox HTML felépítése egy helyszínhez */
function buildPopup(c) {
  const logo = c.logo
    ? `<img class="info-logo" src="${c.logo}" alt="" loading="lazy" onerror="this.style.display='none'">`
    : "";
  const venue = c.venue ? `<div class="info-venue">${c.venue}</div>` : "";

  return `
    <div class="info">
      <div class="info-top">
        ${logo}
        <div>
          <h3 class="info-title">${c.club}</h3>
          ${venue}
        </div>
      </div>
      <div class="info-rows">
        <div class="info-row">${ICONS.pin}<span>${c.address}</span></div>
        <div class="info-row">${ICONS.calendar}<span>${c.days || "—"}</span></div>
        <div class="info-row">${ICONS.clock}<span class="muted">${c.time || "—"}</span></div>
      </div>
      <a class="info-cta" href="${c.link}" target="_blank" rel="noopener">
        Tovább a klubhoz ${ICONS.arrow}
      </a>
    </div>`;
}

/* Hover tooltip rövid szövege */
function buildTip(items) {
  if (items.length === 1) {
    const c = items[0];
    return `<strong>${c.club}</strong><small>${c.city} · ${c.days}</small>`;
  }
  return `<strong>${items.length} helyszín itt</strong><small>${items[0].city} – kattints a részletekért</small>`;
}

/* Pötty ikon (egy vagy több helyszín) */
function makeIcon(count) {
  if (count > 1) {
    return L.divIcon({
      className: "",
      html: `<div class="cluster-pin">${count}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }
  return L.divIcon({
    className: "",
    html: '<div class="hema-pin"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/* Azonos koordinátán lévő helyszínek csoportosítása,
   hogy ne fedjék egymást (pl. ugyanaz a terem több naphoz). */
function groupByLocation(clubs) {
  const map = new Map();
  clubs.forEach((c) => {
    const key = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
    if (!map.has(key)) map.set(key, { latlng: [c.lat, c.lng], items: [] });
    map.get(key).items.push(c);
  });
  return [...map.values()];
}

/* Több helyszín egy ponton -> lapozható popup */
function buildMultiPopup(items) {
  if (items.length === 1) return buildPopup(items[0]);
  return items.map(buildPopup).join('<hr style="border:none;border-top:1px solid var(--steel-edge);margin:0">');
}

function render(clubs) {
  allMarkers.forEach((m) => map.removeLayer(m.marker));
  allMarkers = [];

  groups = groupByLocation(clubs);

  groups.forEach((g) => {
    const marker = L.marker(g.latlng, { icon: makeIcon(g.items.length) }).addTo(map);

    marker.bindTooltip(buildTip(g.items), {
      className: "hema-tip",
      direction: "top",
      offset: [0, -10],
      opacity: 1,
    });

    marker.bindPopup(buildMultiPopup(g.items), {
      maxWidth: 290,
      autoPanPadding: [40, 60],
    });

    marker.on("popupopen", () => {
      const el = marker.getElement()?.querySelector(".hema-pin, .cluster-pin");
      el?.classList.add("is-active");
    });
    marker.on("popupclose", () => {
      const el = marker.getElement()?.querySelector(".hema-pin, .cluster-pin");
      el?.classList.remove("is-active");
    });

    allMarkers.push({ marker, items: g.items, latlng: g.latlng });
  });
}

/* Keresés: város vagy klubnév szűrése */
function setupSearch(clubs) {
  const input = document.getElementById("search");
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    const filtered = q
      ? clubs.filter(
          (c) =>
            c.club.toLowerCase().includes(q) ||
            c.city.toLowerCase().includes(q) ||
            (c.venue || "").toLowerCase().includes(q)
        )
      : clubs;
    render(filtered);
    updateCount(filtered);
    if (q && filtered.length) {
      const grp = groupByLocation(filtered);
      const bounds = L.latLngBounds(grp.map((g) => g.latlng));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
    }
  });
}

function updateCount(clubs) {
  const clubNames = new Set(clubs.map((c) => c.club));
  document.getElementById("count").innerHTML =
    `<b>${clubNames.size}</b> klub · <b>${clubs.length}</b> helyszín`;
}

/* Betöltés */
fetch("data/clubs.json")
  .then((r) => {
    if (!r.ok) throw new Error("Nem sikerült betölteni az adatokat");
    return r.json();
  })
  .then((clubs) => {
    render(clubs);
    updateCount(clubs);
    setupSearch(clubs);

    const grp = groupByLocation(clubs);
    if (grp.length) {
      map.fitBounds(L.latLngBounds(grp.map((g) => g.latlng)), {
        padding: [60, 60],
        maxZoom: 9,
      });
    }
  })
  .catch((err) => {
    document.getElementById("map").innerHTML =
      `<div style="display:grid;place-items:center;height:100%;color:#b9ad95;font-family:Inter,sans-serif;text-align:center;padding:2rem">
         <div><strong style="color:#e0bd63">Az adatok nem töltődtek be.</strong><br>
         Indítsd helyi szerverről (lásd README), vagy ellenőrizd a data/clubs.json fájlt.</div>
       </div>`;
    console.error(err);
  });
