/* ========================================================
                  ================== START SIMULATION =====================
                  ======================================================== */
               
               function startSimulation() {
                   if (!simulationPoints.length) return;
               
                   simulationActive = true;
                   gpsActive = false;
                   compassActive = false;
               
                   simulationIndex = 0;
               
                   moveMarker(simulationPoints[0]);
               
                   map.easeTo({
                       center: [simulationPoints[0][1], simulationPoints[0][0]],
                       duration: 500
                   });
               
                   setTimeout(simulateNextStep, 1200);
               }
/* ========================================================
                  ======================= INIT MAP ========================
                  ======================================================== */
               
               async function initMap() {
                   
               
                  map = new maplibregl.Map({
    container: "map",
    style: "style.json?v=2",

    // Временный центр, чтобы не было карты мира
    center: [49.12169747999815, 55.7872919881855],
    zoom: 12,
    bearing: -141.20322070183164
});
               
                   const mapContainer = document.getElementById("map");
                   if (mapContainer && getComputedStyle(mapContainer).position === "static") {
                       mapContainer.style.position = "relative";
                   }
               
                   map.on("load", async () => {
                     globalAudio = document.getElementById("globalAudio");
                     globalAudio.muted = false;
globalAudio.autoplay = true;
                     globalAudio.load();
                      map.getCanvas().addEventListener("pointerdown", () => {
                   userTouching = true;
               });
               
               map.getCanvas().addEventListener("pointerup", () => {
                   userTouching = false;
               });
               
               map.getCanvas().addEventListener("pointercancel", () => {
                   userTouching = false;
               });
                      map.on("movestart", () => userInteracting = true);
               map.on("moveend", () => userInteracting = false);
               // FIX_REMOVE_HACK_LINE — полностью удалить старые слои маршрута
               ["route", "route-line", "route-hack-line"].forEach(id => {
                   if (map.getLayer(id)) {
                       map.removeLayer(id);
                   }
                   if (map.getSource(id)) {
                       map.removeSource(id);
                   }
               });
               
               // ВЫЗЫВАЕМ ПОСЛЕ удаления слоёв, но ДО загрузки данных
               updateProgress();
               
              /* ========================================================
   ======================= LOAD DATA =======================
   ======================================================== */

const points = await fetch("points.json").then(r => r.json());
const route = await fetch("route.json").then(r => r.json());

/* === 1) Собираем ВСЕ координаты из FeatureCollection === */
let allCoords = [];
route.features.forEach(f => {
    if (f.geometry && f.geometry.type === "LineString") {
        allCoords = allCoords.concat(f.geometry.coordinates);
    }
});

/* === 2) fullRoute для перекраски маршрута === */
fullRoute = allCoords.map(c => ({
    coord: [c[0], c[1]]
}));

/* === 3) Сегменты маршрута === */
routeSegments = [];
for (let i = 0; i < fullRoute.length - 1; i++) {
    routeSegments.push({
        start: fullRoute[i].coord,
        end: fullRoute[i + 1].coord,
        passed: false
    });
}

/* === 4) Симуляция — идём по всем точкам подряд === */
simulationPoints = allCoords.map(c => [c[1], c[0]]);
/* === 5) Показываем весь маршрут === */
const bounds = new maplibregl.LngLatBounds();
allCoords.forEach(c => bounds.extend([c[0], c[1]]));

map.fitBounds(bounds, {
    padding: 50,
    duration: 0
});

/* === 6) Через 4 секунды — плавный зум к нужной точке === */
setTimeout(() => {
    map.easeTo({
    center: [49.12169747999815, 55.7872919881855],
    zoom: 16.125383373632552,
    duration: 1500
});
}, 4000);
                     
/* ========================================================
   ===================== ROUTE SOURCES =====================
   ======================================================== */

/* === 5) Рисуем три отдельные линии, как в старом проекте === */
map.addSource("route-remaining", {
    type: "geojson",
    data: route   // ← отдаём весь FeatureCollection
});

map.addSource("route-passed", {
    type: "geojson",
    data: {
        type: "FeatureCollection",
        features: [] // сюда будем добавлять пройденные куски
    }
});

/* ========================================================
   ====================== ROUTE LAYERS =====================
   ======================================================== */

map.addLayer({
    id: "route-remaining-line",
    type: "line",
    source: "route-remaining",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-width": 4, "line-color": "#007aff" }
});

map.addLayer({
    id: "route-passed-line",
    type: "line",
    source: "route-passed",
    layout: { "line-join": "round", "line-cap": "round" },
    paint: { "line-width": 4, "line-color": "#333333" }
});
 /* ========================================================
   ====================== AUDIO ZONES ======================
   ======================================================== */

const circleFeatures = [];
const polygonFeatures = [];

/* === 1. СОБИРАЕМ ZONES И МАРКЕРЫ === */
points.forEach(p => {
    zones.push({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    radius: p.radius || 20,
    visited: false,
    entered: false,
    type: p.type,
    audio: p.audio || null,
    image: p.image || null,
    icon: p.icon || null,
    shape: p.shape || null,
    polygon: p.polygon || null,
    customColor: p.customColor || null
});
  
    if (p.type === "audio") totalAudioZones++;

   if (p.type === "audio") {

    // === ПОЛИГОНАЛЬНАЯ АУДИОЗОНА ===
    if (p.shape === "polygon" && Array.isArray(p.polygon)) {
        polygonFeatures.push({
            type: "Feature",
            properties: {
                id: p.id,
                visited: false,
                ...(p.customColor ? { customColor: p.customColor } : {})
            },
            geometry: {
                type: "Polygon",
                coordinates: [ p.polygon ]   // массив точек
            }
        });
        return; // не создаём круг
    }

    // === КРУГЛАЯ АУДИОЗОНА ===
    circleFeatures.push({
        type: "Feature",
        properties: {
            id: p.id,
            visited: false,
            ...(p.customColor ? { customColor: p.customColor } : {})
        },
        geometry: { type: "Point", coordinates: [p.lng, p.lat] }
    });
}


/* === MEDIA ZONES === */
if (p.type === "media") {
    const el = document.createElement("img");
    el.src = p.icon;
    el.style.width = "40px";
    el.style.height = "40px";
    el.style.cursor = "pointer";

    el.onclick = () => {
        if (p.photo) showFullscreenMedia(p.photo, "photo");
        if (p.video) showFullscreenMedia(p.video, "video");
    };

    new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
}

/* === UNIVERSAL MEDIA MENU ZONES === */
if (p.type === "mediaMenu") {
    const el = document.createElement("img");
    el.src = p.icon;
    el.style.width = "40px";
    el.style.height = "40px";
    el.style.cursor = "pointer";

    el.onclick = () => openMediaMenu(p);

    new maplibregl.Marker({ element: el })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
}
});

/* ========================================================
   ======================= PNG MARKERS =====================
   ======================================================== */

zones
  .filter(p => p.type === "square")
  .forEach(p => {
      const el = document.createElement("div");
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.transform = "translate(-50%, -50%)";
      el.style.pointerEvents = "none"; // чтобы не мешали кликам

      const img = document.createElement("img");
      img.src = p.icon;   // ← теперь НЕ undefined
      img.style.width = "32px";
      img.style.height = "32px";
      img.style.objectFit = "contain";

      img.onload = () => { iconsPngStatus = "ok"; };
      img.onerror = () => {
          iconsPngStatus = "error";
          debugUpdate("none", null, "PNG_LOAD_FAIL");
      };

      el.appendChild(img);

      new maplibregl.Marker({
          element: el,
          anchor: "center"
      })
      .setLngLat([p.lng, p.lat])
      .addTo(map);
  });


/* ========================================================
   ==================== AUDIO CIRCLES ======================
   ======================================================== */

map.addSource("audio-polygons", {
    type: "geojson",
    data: { type: "FeatureCollection", features: polygonFeatures }
});

map.addSource("audio-circles", {
    type: "geojson",
    data: { type: "FeatureCollection", features: circleFeatures }
});

map.addLayer({
    id: "audio-polygons-layer",
    type: "fill",
    source: "audio-polygons",
    paint: {
       "fill-color": [
    "case",

    // 1) visited → зелёный
    ["boolean", ["get", "visited"], false],
    "rgba(0,255,0,0.25)",

    // 2) customColor → жёлтый (только у id35)
    ["has", "customColor"],
    ["get", "customColor"],

    // 3) default → красный
    "rgba(255,0,0,0.15)"
],
        "fill-opacity": 1,
        "fill-outline-color": "rgba(0,0,0,0.3)"
    }
});

map.addLayer({
    id: "audio-circles-layer",
    type: "circle",
    source: "audio-circles",
    paint: {
        "circle-radius": 0,
        "circle-color": [
    "case",

    // 1) visited → зелёный
    ["boolean", ["get", "visited"], false],
    "rgba(0,255,0,0.25)",

    // 2) customColor → жёлтый (только у id35)
    ["has", "customColor"],
    ["get", "customColor"],

    // 3) default → красный
    "rgba(255,0,0,0.15)"
],
        "circle-stroke-color": [
    "case",

    // visited → зелёный
    ["boolean", ["get", "visited"], false],
    "rgba(0,255,0,0.6)",

    // customColor → жёлтый
    ["has", "customColor"],
    ["get", "customColor"],

    // default → красный
    "rgba(255,0,0,0.4)"
],
        "circle-stroke-width": 2
    }
});

/* === КЛИК ПО АУДИОЗОНЕ → СИМУЛЯЦИЯ === */
map.on("click", "audio-circles-layer", (e) => {
    const id = e.features[0].properties.id;
    simulateAudioZone(id);
});
map.on("click", "audio-polygons-layer", (e) => {
    const id = e.features[0].properties.id;
    simulateAudioZone(id);
});

/* === РАДИУС В ПИКСЕЛЯХ === */
function updateAudioCircleRadius() {
    const zoom = map.getZoom();
    const center = map.getCenter();
    const lat = center.lat;

    const metersPerPixel =
        156543.03392 * Math.cos(lat * Math.PI / 180) / Math.pow(2, zoom);

    zones.forEach(z => {
        if (z.type === "audio") {
            const radiusPixels = z.radius / metersPerPixel;
            map.setPaintProperty("audio-circles-layer", "circle-radius", radiusPixels);
        }
    });
}

map.on("zoom", updateAudioCircleRadius);
map.on("load", updateAudioCircleRadius);
                       /* ========================================================
                          ==================== PHOTO CIRCLES ======================
                          ======================================================== */
               
                       const photoCircleFeatures = zones
                           .filter(z => z.type === "square" && z.image)
                           .map(z => ({
                               type: "Feature",
                               properties: { id: z.id },
                               geometry: { type: "Point", coordinates: [z.lng, z.lat] }
                           }));
               
                       map.addSource("photo-circles", {
                           type: "geojson",
                           data: { type: "FeatureCollection", features: photoCircleFeatures }
                       });
               
                       map.addLayer({
                           id: "photo-circles-layer",
                           type: "circle",
                           source: "photo-circles",
                           paint: {
                               "circle-radius": 30,
                               "circle-color": "rgba(0,0,255,0.08)",
                               "circle-stroke-color": "rgba(0,0,255,0.3)",
                               "circle-stroke-width": 1
                           }
                       });
               
                       /* ========================================================
                          ===================== DOM USER ARROW ===================
                          ======================================================== */
               arrowEl = document.createElement("div");
               arrowEl.innerHTML = `
               <svg viewBox="0 0 100 100" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                 <polygon points="50,5 90,95 50,75 10,95" fill="currentColor"/>
               </svg>
               `;
               
               arrowEl.style.position = "absolute";
               arrowEl.style.left = "50%";
               arrowEl.style.top = "50%";
               arrowEl.style.transformOrigin = "center center";
               arrowEl.style.pointerEvents = "none";
               arrowEl.style.zIndex = "9999";
               arrowEl.style.color = "#00ff00"; // стартовый цвет
               
               applyArrowTransform();
               
               if (mapContainer) {
                   mapContainer.appendChild(arrowEl);
               } else {
                   document.body.appendChild(arrowEl);
               }
                       /* ========================================================
                          ====================== GPS TRACKING ====================
                          ======================================================== */
               
                       if (navigator.geolocation) {
                           navigator.geolocation.watchPosition(
                               pos => {
                                   if (!gpsActive) return;
                                   moveMarker([pos.coords.latitude, pos.coords.longitude]);
                               },
                               err => console.log("GPS error:", err),
                               { enableHighAccuracy: true }
                           );
                       }
               
                       /* ========================================================
                          ===================== MAP MOVE UPDATE ==================
                          ======================================================== */
               
                       map.on("move", handleMapMove);
               
                       console.log("Карта готова");
                   });
               
                  /* ========================================================
                  ========================= BUTTONS ======================
                  ======================================================== */


if (galleryOverlay) {
    galleryOverlay.onclick = (e) => {
        if (e.target === galleryOverlay) {
            galleryOverlay.classList.add("hidden");
        }
    };
}
/* ========================================================
   ========== UNIVERSAL MEDIA MENU (ALL ZONES) ============
   ======================================================== */

function openMediaMenu(p) {
    window.__mediaMenuMode = true;

    let overlay = document.getElementById("mediaMenuUniversal");
    if (!overlay) createMediaMenuUniversal();

    overlay = document.getElementById("mediaMenuUniversal");
    const sheet = document.getElementById("mediaMenuUniversalSheet");

    // === Заголовок с мини-иконкой ===
    const titleEl = document.getElementById("mmTitle");
    titleEl.innerHTML = `
        <div style="display:flex; align-items:center; gap:8px;">
            <img src="${p.icon}" style="width:22px; height:22px; object-fit:contain;">
            <span>${p.title || ""}</span>
        </div>
    `;
    titleEl.style.color = "#ffffff";
    titleEl.style.textShadow = "0 0 26px rgba(255,255,255,1), 0 0 14px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.8)";

    // === Описание ===
    const descEl = document.getElementById("mmDesc");
    descEl.textContent = p.description || "";
    descEl.style.color = "#ffffff";
    descEl.style.textShadow = "0 0 4px rgba(255,255,255,0.35)";

    const photoBtn = document.getElementById("mmPhotoBtn");
    const videoBtn = document.getElementById("mmVideoBtn");
    const preview = document.getElementById("mmPreview");

    // === Полная очистка превью при открытии новой зоны ===
    preview.innerHTML = "";
    preview.style.display = "none";

    // === Фото ===
    if (p.photos && p.photos.length > 0) {
        photoBtn.style.display = "block";

        photoBtn.onclick = () => {
            preview.innerHTML = "";
            preview.style.display = "flex";

            p.photos.forEach(src => {
                const box = document.createElement("div");
                box.style.width = "80px";
                box.style.height = "80px";
                box.style.borderRadius = "10px";
                box.style.overflow = "hidden";
                box.style.cursor = "pointer";
                box.style.background = "#000";
                box.style.border = "1px solid rgba(255,255,255,0.1)";
                box.style.transition = "transform 0.15s ease";

                box.onmouseover = () => box.style.transform = "scale(1.05)";
                box.onmouseout = () => box.style.transform = "scale(1)";

                const img = document.createElement("img");
                img.src = src;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "cover";

                box.appendChild(img);
                box.onclick = () => {
                    window.__fsGallery = p.photos.slice();
                    window.__fsIndex = p.photos.indexOf(src);
                    showFullscreenMedia(src, "photo");
                };

                preview.appendChild(box);
            });
        };
    } else {
        photoBtn.style.display = "none";
    }

    // === Видео ===
    if (p.video) {
        videoBtn.style.display = "block";
        videoBtn.onclick = () => showFullscreenMedia(p.video, "video");
    } else {
        videoBtn.style.display = "none";
    }

    overlay.style.display = "flex";
    requestAnimationFrame(() => {
        sheet.style.transform = "translateY(0)";
    });

    // === Анимация кнопок (desktop + mobile) ===
    function addButtonEffects(btn) {
        if (!btn) return;

        btn.style.transition = "transform 0.12s ease";

        const press = () => btn.style.transform = "scale(0.96)";
        const release = () => btn.style.transform = "scale(1)";

        // Desktop
        btn.onmousedown = press;
        btn.onmouseup = release;
        btn.onmouseleave = release;

        // Mobile
        btn.ontouchstart = press;
        btn.ontouchend = release;
        btn.ontouchcancel = release;
    }

    addButtonEffects(photoBtn);
    addButtonEffects(videoBtn);
}

function closeMediaMenuUniversal() {
    window.__mediaMenuMode = false;
    const overlay = document.getElementById("mediaMenuUniversal");
    const sheet = document.getElementById("mediaMenuUniversalSheet");

    sheet.style.transform = "translateY(100%)";
    setTimeout(() => overlay.style.display = "none", 250);
}

function createMediaMenuUniversal() {
    const overlay = document.createElement("div");
    overlay.id = "mediaMenuUniversal";
    overlay.style.position = "fixed";
    overlay.style.left = "0";
    overlay.style.top = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.4)";
    overlay.style.display = "none";
    overlay.style.zIndex = "200000";
    overlay.style.alignItems = "flex-end";
    overlay.style.justifyContent = "center";

    const sheet = document.createElement("div");
    sheet.id = "mediaMenuUniversalSheet";
    sheet.style.width = "100%";
    sheet.style.background = "#1c1c1e";
    sheet.style.boxShadow = "0 -4px 20px rgba(0,0,0,0.4)";
    sheet.style.borderTopLeftRadius = "16px";
    sheet.style.borderTopRightRadius = "16px";
    sheet.style.padding = "20px";
    sheet.style.boxSizing = "border-box";
    sheet.style.transform = "translateY(100%)";
    sheet.style.transition = "transform 0.25s ease-out";

    sheet.innerHTML = `
        <div id="mmTitle" style="font-size:18px; margin-bottom:8px;"></div>
        <div id="mmDesc" style="font-size:14px; margin-bottom:16px;"></div>

        <div style="height:1px; background:rgba(255,255,255,0.08); margin:12px 0;"></div>

        <button id="mmPhotoBtn"
            style="width:100%; padding:14px; font-size:16px; margin-bottom:10px;
                   border-radius:10px; border:none;
                   background:linear-gradient(180deg,#30d158 0%,#1fa347 100%);
                   color:#fff; font-weight:500;">
            Фото
        </button>

        <button id="mmVideoBtn"
            style="width:100%; padding:14px; font-size:16px; margin-bottom:10px;
                   border-radius:10px; border:none;
                   background:linear-gradient(180deg,#0a84ff 0%,#0066cc 100%);
                   color:#fff; font-weight:500;">
            Видео
        </button>

        <div id="mmPreview"
             style="display:none; margin-top:16px; gap:10px; justify-content:center;">
        </div>
    `;

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);

    overlay.onclick = e => {
        if (e.target === overlay) closeMediaMenuUniversal();
    };
}
               /* ========================================================
                  ===================== START TOUR BTN ====================
                  ======================================================== */
               
               /* START TOUR BTN */
               const startBtn = document.getElementById("startTourBtn");
               if (startBtn) {
                   startBtn.onclick = () => {
                       tourStarted = true;
                       gpsActive = true;
               
                       const intro = new Audio("audio/start.mp3");
                       intro.play().catch(() => console.log("Не удалось проиграть start.mp3"));
               
                       startBtn.style.display = "none";
                   };
               }
               const simBtn = document.getElementById("simulate");
               if (simBtn) simBtn.onclick = startSimulation;
               
          
               
               const compassBtn = document.getElementById("enableCompass");
               if (compassBtn) compassBtn.onclick = startCompass;
               

                   /* ========================================================
                      ===================== INIT DEBUG PANEL =================
                      ======================================================== */
               
                   ensureSuperDebug();
                   debugUpdate("init", 0, "INIT");
               }
               
               /* ========================================================
                  ====================== DOM EVENTS =======================
                  ======================================================== */


document.addEventListener("DOMContentLoaded", initMap);

/* ==================== END OF APP.JS ====================== */

