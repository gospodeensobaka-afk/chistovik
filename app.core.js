               /* ========================================================
                  =============== GLOBAL VARIABLES & STATE ===============
                  ======================================================== */
            /* === SMART PRELOAD QUEUE (AUDIO + PHOTO/VIDEO TIMINGS) === */
/* === DEBUG: список предзагруженных зон (только будущие) === */
let preloadDebugList = [];

function updateDebugStatus() {
    const el = document.getElementById("miniPreloadStatus");
    if (!el) return;

    if (preloadDebugList.length === 0) {
        el.innerHTML = "Загрузка…";
        return;
    }

    let html = "Загрузка…<br>Предзагружено наперёд:<br>";
    preloadDebugList.forEach(item => {
        html += `→ зона ${item.zoneId} (${item.file})<br>`;
    });

    el.innerHTML = html;
}
let preloadQueue = [];
let preloadInProgress = false;

function queuePreload(files, zoneId = null) {

    // DEBUG: фиксируем, что именно подгружается
    if (zoneId !== null) {
        files.forEach(f => {
            preloadDebugList.push({
                zoneId: zoneId,
                file: f
            });
        });
        updateDebugStatus();
    }

    preloadQueue.push(...files);
    runPreloadQueue();
}

async function runPreloadQueue() {
    if (preloadInProgress) return;
    preloadInProgress = true;

    // показываем мини‑плашку
    showMiniStatus("Загрузка…");

    while (preloadQueue.length > 0) {
        const src = preloadQueue.shift();
        await preloadSingle(src);
    }

    // скрываем мини‑плашку
    hideMiniStatus();

    preloadInProgress = false;
}

function preloadSingle(src) {
    return new Promise(resolve => {
        if (!src) return resolve();

        // AUDIO
        if (src.endsWith(".mp3") || src.endsWith(".m4a")) {
            const a = new Audio();
            a.src = src;
            a.preload = "auto";
            a.oncanplaythrough = resolve;
            a.onerror = resolve;
            return;
        }

        // IMAGES
        if (src.match(/\.(jpg|jpeg|png)$/i)) {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve;
            return;
        }

        // VIDEO — НЕ грузим заранее
        resolve();
    });
}

/* === MINI STATUS BAR (можно скрыть позже) === */
function showMiniStatus(text) {
    const el = document.getElementById("miniPreloadStatus");
    if (!el) return;
    el.textContent = text;
    el.style.display = "block";
}

function hideMiniStatus() {
    const el = document.getElementById("miniPreloadStatus");
    if (!el) return;
    el.style.display = "none";
}
               // TOUR START FLAG
               let tourStarted = false;
               let map;
               let currentPointImage = null;
               
               
               const photoOverlay = document.getElementById("photoOverlay");
               const photoImage = document.getElementById("photoImage");
               const closePhotoBtn = document.getElementById("closePhotoBtn");
               
               let arrowEl = null;
               let lastCoords = null;
               let zones = [];
               
               let simulationActive = false;
               let simulationPoints = [];
               
               let simulationIndex = 0;
               let globalAudio = null;
               let gpsActive = false; // включится после старта
               let audioEnabled = false;
               let audioPlaying = false;
               let totalAudioZones = 0;
               let visitedAudioZones = 0;
               let fullRoute = [];
               let routeSegments = []; // массив слоёв маршрута
               let activeSegmentIndex = null; // какой слой сейчас активен
               let passedRoute = [];
               let maxPassedIndex = 0;
               let compassActive = false;
               let userTouching = false;
               let userInteracting = false;
               let smoothAngle = 0;
               let compassUpdates = 0;
               
               let gpsAngleLast = null;
               let gpsUpdates = 0;
               
               let arrowPngStatus = "init";
               let iconsPngStatus = "init";
               
               let lastMapBearing = 0;
               let lastCorrectedAngle = 0;
               let lastRouteDist = null;
               let lastRouteSegmentIndex = null;
               let lastZoneDebug = "";
               
               const ROUTE_HITBOX_METERS = 6;
               
               /* ========================================================
                  ===================== UTILITIES ========================
                  ======================================================== */
               
               function distance(a, b) {
                   const R = 6371000;
                   const dLat = (b[0] - a[0]) * Math.PI / 180;
                   const dLon = (b[1] - a[1]) * Math.PI / 180;
                   const lat1 = a[0] * Math.PI / 180;
                   const lat2 = b[0] * Math.PI / 180;
                   const x = dLon * Math.cos((lat1 + lat2) / 2);
                   const y = dLat;
                   return Math.sqrt(x * x + y * y) * R;
               }
               
               function calculateAngle(prev, curr) {
                   const dx = curr[1] - prev[1];
                   const dy = curr[0] - prev[0];
                   return Math.atan2(dx, dy) * (180 / Math.PI);
               }
               
               function normalizeAngle(a) {
                   return (a + 360) % 360;
               }
               
               function latLngToXY(lat, lng) {
                   const R = 6371000;
                   const rad = Math.PI / 180;
                   const x = R * lng * rad * Math.cos(lat * rad);
                   const y = R * lat * rad;
                   return { x, y };
               }
               
               function pointToSegmentInfo(pointLatLng, aLngLat, bLngLat) {
                   const p = latLngToXY(pointLatLng[0], pointLatLng[1]);
                   const a = latLngToXY(aLngLat[1], aLngLat[0]);
                   const b = latLngToXY(bLngLat[1], bLngLat[0]);
               
                   const vx = b.x - a.x;
                   const vy = b.y - a.y;
                   const wx = p.x - a.x;
                   const wy = p.y - a.y;
               
                   const len2 = vx * vx + vy * vy;
                   if (len2 === 0) {
                       const dist = Math.sqrt(wx * wx + wy * wy);
                       return { dist, t: 0, projLngLat: [aLngLat[0], aLngLat[1]] };
                   }
               
                   let t = (wx * vx + wy * vy) / len2;
                   t = Math.max(0, Math.min(1, t));
               
                   const projX = a.x + t * vx;
                   const projY = a.y + t * vy;
               
                   const dx = p.x - projX;
                   const dy = p.y - projY;
                   const dist = Math.sqrt(dx * dx + dy * dy);
               
                   const invRad = 180 / (Math.PI * 6371000);
                   const projLat = projY * invRad;
                   const projLng = projX * invRad / Math.cos(projLat * Math.PI / 180);
               
                   return { dist, t, projLngLat: [projLng, projLat] };
               }
               function updateProgress() {
                   const el = document.getElementById("tourProgress");
                   if (!el) return;
                   el.textContent = `Пройдено: ${visitedAudioZones} из ${totalAudioZones}`;
               }
               /* ========================================================
                  ===================== AUDIO ZONES =======================
                  ======================================================== */
               
            function playZoneAudio(src, id) {
              window.__currentZoneId = id;
    if (!audioEnabled) audioEnabled = true;

    globalAudio.src = src;
    globalAudio.currentTime = 0;

    // Привязываем тайминги ВСЕГДА
    setupPhotoTimingsForAudio(globalAudio, id);

    globalAudio.play().catch(() => {});

    audioPlaying = true;
    globalAudio.onended = () => audioPlaying = false;
}
             
               function updateCircleColors() {
                   const source = map.getSource("audio-circles");
                   if (!source) return;
                   source.setData({
                       type: "FeatureCollection",
                       features: zones
                           .filter(z => z.type === "audio")
                           .map(z => ({
                               type: "Feature",
                               properties: { id: z.id, visited: z.visited },
                               geometry: { type: "Point", coordinates: [z.lng, z.lat] }
                           }))
                   });
               }
               
               function checkZones(coords) {
                   zones.forEach(z => {
                       if (z.type !== "audio") return;
               
                       const dist = distance(coords, [z.lat, z.lng]);
               
                       // СТАРАЯ НАДЁЖНАЯ ЛОГИКА: один раз при входе
                       if (!z.visited && dist <= z.radius) {
                   z.visited = true;
               /* === SMART PRELOAD NEXT ZONE === */
const audioZonesList = zones.filter(a => a.type === "audio");
const idx = audioZonesList.findIndex(a => a.id === z.id);
const next = audioZonesList[idx + 1];

if (next && !next.preloadTriggered) {
    next.preloadTriggered = true;

    let files = [];
    if (next.audio) files.push(next.audio);

    const key = next.audio;
    

   queuePreload(files, next.id);
}
                   if (z.type === "audio") {
                       visitedAudioZones++;
                       updateProgress();
                   }
               
                   updateCircleColors();
                   if (z.audio) playZoneAudio(z.audio, z.id);
               }
                   });
               }
               
               /* ========================================================
                  ===================== SUPER DEBUG =======================
                  ======================================================== */
               
               function ensureSuperDebug() {
                   let dbg = document.getElementById("superDebug");
                   if (!dbg) {
                       dbg = document.createElement("div");
                       dbg.id = "superDebug";
                       dbg.style.position = "fixed";
                       dbg.style.bottom = "0";
                       dbg.style.left = "0";
                       dbg.style.width = "100%";
                       dbg.style.padding = "8px 10px";
                       dbg.style.background = "rgba(0,0,0,0.75)";
                       dbg.style.color = "white";
                       dbg.style.fontSize = "12px";
                       dbg.style.fontFamily = "monospace";
                       dbg.style.zIndex = "99999";
                       dbg.style.whiteSpace = "pre-line";
                       dbg.style.display = "block";
                       document.body.appendChild(dbg);
                   }
                   return dbg;
               }
               
               function debugUpdate(source, angle, error = "none") {
                   const dbg = ensureSuperDebug();
               
                   if (!arrowEl) {
                       dbg.textContent = "NO ARROW ELEMENT";
                       return;
                   }
               
                   const tr = arrowEl.style.transform || "none";
                   let computed = "none";
                   try { computed = window.getComputedStyle(arrowEl).transform; }
                   catch (e) { computed = "error"; }
               
                   const ow = arrowEl.offsetWidth;
                   const oh = arrowEl.offsetHeight;
               
                   const rect = arrowEl.getBoundingClientRect();
                   const boxRaw =
                       `x:${rect.x.toFixed(1)}, y:${rect.y.toFixed(1)}, ` +
                       `w:${rect.width.toFixed(1)}, h:${rect.height.toFixed(1)}`;
               
                   const routeDistStr =
                       (lastRouteDist == null) ? "n/a" : `${lastRouteDist.toFixed(1)}m`;
                   const routeSegStr =
                       (lastRouteSegmentIndex == null) ? "n/a" : `${lastRouteSegmentIndex}`;
               
                   const zoneInfo = lastZoneDebug || "none";
               
                   dbg.textContent =
               `SRC: ${source} | ANG: ${isNaN(angle) ? "NaN" : Math.round(angle)}° | ERR: ${error}
               
               --- TRANSFORM ---
               SET:   ${tr}
               COMP:  ${computed}
               
               --- LAYOUT ---
               offset: ${ow}x${oh}
               BOX:    ${boxRaw}
               
               --- STATE ---
               CMP: ${compassActive ? "active" : "inactive"} | H: ${Math.round(smoothAngle)}° | UPD: ${compassUpdates}
               GPS: ${gpsActive ? "on" : "off"} | GPS_ANG: ${gpsAngleLast} | GPS_UPD: ${gpsUpdates}
               
               --- MAP / ROUTE ---
               routeDist: ${routeDistStr} | seg: ${routeSegStr}
               
               --- ZONE ---
               ${zoneInfo}
               
               --- PNG ---
               arrow=${arrowPngStatus}, icons=${iconsPngStatus}
               `;
               }/* ========================================================
                  ===================== COMPASS LOGIC =====================
                  ======================================================== */
               
               function handleIOSCompass(e) {
                   if (!compassActive) return;
                   if (!map || !arrowEl) {
                       debugUpdate("compass", NaN, "NO_MAP_OR_ARROW");
                       return;
                   }
                   if (e.webkitCompassHeading == null) {
                       debugUpdate("compass", NaN, "NO_HEADING");
                       return;
                   }
               
                   const raw = normalizeAngle(e.webkitCompassHeading);
               
                   smoothAngle = normalizeAngle(0.8 * smoothAngle + 0.2 * raw);
                   compassUpdates++;
               
                   lastMapBearing =
                       (typeof map.getBearing === "function") ? map.getBearing() : 0;
               
                   lastCorrectedAngle = normalizeAngle(smoothAngle - lastMapBearing);
               
                   applyArrowTransform(lastCorrectedAngle);
               if (!userTouching) {
                   map.easeTo({
                       bearing: smoothAngle,
                       duration: 300
                   });
               }
                   debugUpdate("compass", lastCorrectedAngle);
               }
               
               function startCompass() {
                   compassActive = true;
               
                   if (typeof DeviceOrientationEvent !== "undefined" &&
                       typeof DeviceOrientationEvent.requestPermission === "function") {
               
                       DeviceOrientationEvent.requestPermission()
                           .then(state => {
                               if (state === "granted") {
                                   window.addEventListener("deviceorientation", handleIOSCompass);
                               } else {
                                   debugUpdate("compass", NaN, "PERMISSION_DENIED");
                               }
                           })
                           .catch(() => {
                               debugUpdate("compass", NaN, "PERMISSION_ERROR");
                           });
               
                       return;
                   }
               
                   debugUpdate("compass", NaN, "IOS_ONLY");
               }
               
               /* ========================================================
                  ============= DOM-СТРЕЛКА: ПОЗИЦИЯ И ПОВОРОТ ============
                  ======================================================== */
               
               function updateArrowPositionFromCoords(coords) {
                   if (!map || !arrowEl || !coords) return;
               
                   const lngLat = [coords[1], coords[0]];
                   const p = map.project(lngLat);
               
                   arrowEl.style.left = `${p.x}px`;
                   arrowEl.style.top = `${p.y}px`;
               }
               
               function applyArrowTransform(angle) {
                   if (!arrowEl) return;
                   const a = isNaN(angle) ? 0 : angle;
                   arrowEl.style.transform = `translate(-50%, -50%) rotate(${a}deg)`;
                   arrowEl.style.visibility = "visible";
                   arrowEl.style.willChange = "transform";
               }
               
               function handleMapMove() {
                   if (!lastCoords) return;
                   updateArrowPositionFromCoords(lastCoords);
               
                   const src = compassActive ? "compass" : "gps";
                   const ang = compassActive ? lastCorrectedAngle : gpsAngleLast;
                   debugUpdate(src, ang);
               }
               /* ========================================================
                  ========== SIMULATE AUDIO ZONE (MANUAL TRIGGER) =========
                  ======================================================== */
               function simulateAudioZone(id) {
    const z = zones.find(z => z.id === id && z.type === "audio");
    if (!z) return;
    // === ГЛОБАЛЬНЫЙ РАЗРЕШИТЕЛЬ АУДИО ДЛЯ СИМУЛЯЦИИ ===
    if (!window.__simUserGestureBound) {
        window.__simUserGestureBound = true;

        document.body.addEventListener("click", () => {
            // После первого клика браузер разрешит любые play()
            globalAudio.play().catch(() => {});
        }, { once: true });
    }
    // Разрешаем повторный запуск в симуляции
    z.visited = false;

    z.visited = true;
    visitedAudioZones++;
    updateProgress();
    updateCircleColors();

    if (z.audio) {
      window.__currentZoneId = id;
        if (!audioEnabled) audioEnabled = true;

        // Полный сброс аудио, чтобы браузер считал это новым запуском
        globalAudio.pause();
        globalAudio.removeAttribute("src");
        globalAudio.load();
        globalAudio.src = z.audio;
        globalAudio.currentTime = 0;

        // Сбрасываем старый таймер
        globalAudio.ontimeupdate = null;

        // ВАЖНО: тайминги ДО play()
        setupPhotoTimingsForAudio(globalAudio, id);

        // Запуск аудио
        globalAudio.play().catch(() => {});

        audioPlaying = true;
        globalAudio.onended = () => audioPlaying = false;
    }

    console.log("Simulated audio zone:", id);
}
             

               /* ========================================================
                  ===================== MOVE MARKER =======================
                  ======================================================== */
               
               function moveMarker(coords) {
                   // TOUR NOT STARTED → IGNORE ALL MOVEMENT
                   if (!tourStarted) return;
               
                   const prevCoords = lastCoords;
                   lastCoords = coords;
               
                   updateArrowPositionFromCoords(coords);
               
                   /* ========================================================
   =============== GPS ROTATION + MAP ROTATION ============
   ======================================================== */

if (!compassActive && prevCoords) {
    const angle = calculateAngle(prevCoords, coords);
    gpsAngleLast = Math.round(angle);
    gpsUpdates++;

    // Поворот стрелки — всегда можно
    applyArrowTransform(angle);

    // 🚫 НЕ КРУТИМ КАРТУ ДО СТАРТА ТУРА
    if (!tourStarted) {
        return;
    }

    // Поворот карты — только если пользователь не трогает экран
    if (!userTouching) {
        map.easeTo({
            bearing: angle,
            duration: 300
        });
    }
}
               /* ========================================================
                  ========== ЧАСТИЧНАЯ ПЕРЕКРАСКА КАК В СТАРОЙ ВЕРСИИ =====
                  ======================================================== */
               
               // ищем ближайший сегмент
               let nearestIndex = null;
               let nearestDist = Infinity;
               let nearestProj = null;
               let nearestT = 0;
               
               for (let i = 0; i < fullRoute.length - 1; i++) {
                   const a = fullRoute[i].coord;
                   const b = fullRoute[i + 1].coord;
               
                   const info = pointToSegmentInfo([coords[0], coords[1]], a, b);
               
                   if (info.dist < nearestDist) {
                       nearestDist = info.dist;
                       nearestIndex = i;
                       nearestProj = info.projLngLat;
                       nearestT = info.t;
                   }
               }
               
               // если далеко от маршрута — не красим
               if (nearestDist > 12) return;
               
               const passedCoords = [];
               const remainingCoords = [];
               
               // 1) все сегменты ДО текущего — полностью пройденные
               for (let i = 0; i < nearestIndex; i++) {
                   passedCoords.push(fullRoute[i].coord);
                   passedCoords.push(fullRoute[i + 1].coord);
               }
               
               // 2) текущий сегмент — частичная перекраска
               const segA = fullRoute[nearestIndex].coord;
               const segB = fullRoute[nearestIndex + 1].coord;
               
               // пройденная часть: A → proj
               passedCoords.push(segA);
               passedCoords.push(nearestProj);
               
               // оставшаяся часть: proj → B
               remainingCoords.push(nearestProj);
               remainingCoords.push(segB);
               
               // 3) все сегменты ПОСЛЕ текущего — полностью оставшиеся
               for (let i = nearestIndex + 1; i < fullRoute.length - 1; i++) {
                   remainingCoords.push(fullRoute[i].coord);
                   remainingCoords.push(fullRoute[i + 1].coord);
               }
               
                   // === UPDATE SOURCES ===
                   map.getSource("route-passed").setData({
                       type: "Feature",
                       geometry: { type: "LineString", coordinates: passedCoords }
                   });
               
                   map.getSource("route-remaining").setData({
                       type: "Feature",
                       geometry: { type: "LineString", coordinates: remainingCoords }
                   });
               
                   // === ZONES ===
                   checkZones(coords);
               
                
                   const src = compassActive ? "compass" : "gps";
                   const ang = compassActive ? lastCorrectedAngle : gpsAngleLast;
                   debugUpdate(src, ang);
               }
               
               /* ========================================================
                  ================== SIMULATION STEP ======================
                  ======================================================== */
               function simulateNextStep() {
                   if (!simulationActive) return;
               // ЖДЁМ окончания аудио перед движением
if (audioPlaying) {
    setTimeout(simulateNextStep, 300);
    return;
}
                   // Если дошли до конца маршрута — стоп
                   if (simulationIndex >= simulationPoints.length) {
                       simulationActive = false;
                       gpsActive = true;
                       return;
                   }
               
                   const next = simulationPoints[simulationIndex];
               
                   // 1) Двигаемся по маршруту
                   moveMarker(next);
               
                  
               
                   // 3) Если прыжков больше нет — обычная симуляция
                   simulationIndex++;
                   setTimeout(simulateNextStep, 1200);
               }
               
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
               }/* ========================================================
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
   ========== PNG START / ARROW / FINISH (FIXED) ==========
   ======================================================== */

map.on("load", () => {

    Promise.all([
        new Promise(res => map.loadImage("icons/start.png",  (_, img) => { map.addImage("start-icon", img); res(); })),
        new Promise(res => map.loadImage("icons/strelka.png", (_, img) => { map.addImage("arrow-icon", img); res(); })),
        new Promise(res => map.loadImage("icons/finish.png", (_, img) => { map.addImage("finish-icon", img); res(); }))
    ]).then(() => {

        // === 1. УГОЛЫ
        const startCoord = fullRoute[0].coord;
        const secondCoord = fullRoute[1].coord;

        const startAngle = calculateAngle(
            [startCoord[1], startCoord[0]],
            [secondCoord[1], secondCoord[0]]
        );

        const lastCoord = fullRoute[fullRoute.length - 1].coord;
        const prevCoord = fullRoute[fullRoute.length - 2].coord;

        const finishAngle = calculateAngle(
            [prevCoord[1], prevCoord[0]],
            [lastCoord[1], lastCoord[0]]
        );

        // === 2. ПРОЕКЦИЯ СТРЕЛКИ
        const desiredArrowPoint = [55.786833, 49.121359];

        let nearestProj = null;
        let nearestDist = Infinity;

        for (let i = 0; i < fullRoute.length - 1; i++) {
            const a = fullRoute[i].coord;
            const b = fullRoute[i+1].coord;

            const info = pointToSegmentInfo(desiredArrowPoint, a, b);

            if (info.dist < nearestDist) {
                nearestDist = info.dist;
                nearestProj = info.projLngLat;
            }
        }

        // === 3. СТАРТ
        map.addLayer({
            id: "start-marker",
            type: "symbol",
            source: {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: startCoord }
                }
            },
            layout: {
                "icon-image": "start-icon",
                "icon-size": 0.12,
                "icon-rotate": startAngle,
                "icon-rotation-alignment": "viewport",
                "icon-pitch-alignment": "viewport",
                "icon-allow-overlap": true
            }
        });

        // === 4. СТРЕЛКА
        map.addLayer({
            id: "arrow-marker",
            type: "symbol",
            source: {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: nearestProj }
                }
            },
            layout: {
                "icon-image": "arrow-icon",
                "icon-size": 0.12,
                "icon-rotate": startAngle,
                "icon-rotation-alignment": "viewport",
                "icon-pitch-alignment": "viewport",
                "icon-allow-overlap": true
            }
        });

        // === 5. ФИНИШ
        map.addLayer({
            id: "finish-marker",
            type: "symbol",
            source: {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: { type: "Point", coordinates: lastCoord }
                }
            },
            layout: {
                "icon-image": "finish-icon",
                "icon-size": 0.12,
                "icon-rotate": finishAngle,
                "icon-rotation-alignment": "viewport",
                "icon-pitch-alignment": "viewport",
                "icon-allow-overlap": true
            }
        });

    });

});
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
        image: p.image || null
    });

    if (p.type === "audio") totalAudioZones++;

    if (p.type === "audio") {
        circleFeatures.push({
            type: "Feature",
            properties: { id: p.id, visited: false },
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

    /* === PNG markers === */
    if (p.type === "square") {
        const el = document.createElement("div");
        el.style.width = "40px";
        el.style.height = "40px";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";

        const img = document.createElement("img");
        img.src = p.icon;
        img.style.width = "32px";
        img.style.height = "32px";

        img.onload = () => { iconsPngStatus = "ok"; };
        img.onerror = () => {
            iconsPngStatus = "error";
            debugUpdate("none", null, "PNG_LOAD_FAIL");
        };

        el.appendChild(img);

        new maplibregl.Marker({ element: el })
            .setLngLat([p.lng, p.lat])
            .addTo(map);
    }
});

/* === 2. СТАРТОВАЯ ПОДГРУЗКА (ТОЛЬКО ЗДЕСЬ!) === */
const audioZones = zones.filter(z => z.type === "audio");

const firstThree = audioZones.slice(0, 3);
let initialFiles = [];

firstThree.forEach(z => {
    if (z.audio) initialFiles.push(z.audio);

    
});

queuePreload(initialFiles);

/* === 3. ОБНОВЛЯЕМ ПРОГРЕСС === */
updateProgress();

/* ========================================================
   ==================== AUDIO CIRCLES ======================
   ======================================================== */

map.addSource("audio-circles", {
    type: "geojson",
    data: { type: "FeatureCollection", features: circleFeatures }
});

map.addLayer({
    id: "audio-circles-layer",
    type: "circle",
    source: "audio-circles",
    paint: {
        "circle-radius": 0,
        "circle-color": [
            "case",
            ["boolean", ["get", "visited"], false],
            "rgba(0,255,0,0.25)",
            "rgba(255,0,0,0.15)"
        ],
        "circle-stroke-color": [
            "case",
            ["boolean", ["get", "visited"], false],
            "rgba(0,255,0,0.6)",
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





