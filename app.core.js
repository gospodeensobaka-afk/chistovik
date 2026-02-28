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
async function hardPreloadVideo(src) {
    try {
        const blob = await fetch(src).then(r => r.blob());
        const url = URL.createObjectURL(blob);

        window.__videoCache = window.__videoCache || {};
        window.__videoCache[src] = url;
    } catch (e) {
        console.warn("Video preload failed:", src, e);
    }
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

        // VIDEO — грузим через fetch()
        hardPreloadVideo(src).then(resolve).catch(resolve);
        return;
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

function preloadAllMediaForCurrentAudio(audioSrc) {
    const clean = audioSrc.split("?")[0].split("#")[0];
    const key = clean.startsWith("audio/") ? clean : "audio/" + clean.split("/").pop();

    const p = photoTimings[key];
    const v = videoTimings[key];

    // Фото
    if (p) {
        for (const t in p) {
            queuePreload([p[t].open]);
        }
    }

    // Видео по таймингам
    if (v) {
        for (const t in v) {
            queuePreload([v[t].open]);
        }
    }
}

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
    const circleSource = map.getSource("audio-circles");
    const polygonSource = map.getSource("audio-polygons");
    if (!circleSource && !polygonSource) return;

    const audioZones = zones.filter(z => z.type === "audio");

    if (circleSource) {
        circleSource.setData({
            type: "FeatureCollection",
            features: audioZones
                .filter(z => !z.shape || z.shape !== "polygon")
                .map(z => ({
                    type: "Feature",
                    properties: {
                        id: z.id,
                        visited: z.visited,
                        ...(z.customColor ? { customColor: z.customColor } : {})
                    },
                    geometry: { type: "Point", coordinates: [z.lng, z.lat] }
                }))
        });
    }

    if (polygonSource) {
        polygonSource.setData({
            type: "FeatureCollection",
            features: audioZones
                .filter(z => z.shape === "polygon" && Array.isArray(z.polygon))
                .map(z => ({
                    type: "Feature",
                    properties: {
                        id: z.id,
                        visited: z.visited,
                        ...(z.customColor ? { customColor: z.customColor } : {})
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: [z.polygon]
                    }
                }))
        });
    }
}

function pointInPolygon(point, polygon) {
    const x = point[1]; // lat
    const y = point[0]; // lng

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect =
            ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi + 0.0000001) + xi);

        if (intersect) inside = !inside;
    }
    return inside;
}
function checkZones(coords) {
    zones.forEach(z => {
        if (z.type !== "audio") return;

        let inside = false;

        if (z.shape === "polygon" && Array.isArray(z.polygon)) {
            inside = pointInPolygon([coords[0], coords[1]], z.polygon);
        } else {
            const dist = distance(coords, [z.lat, z.lng]);
            inside = dist <= z.radius;
        }

        if (!z.visited && inside) {
            z.visited = true;

// === КАСТОМНЫЙ ТРИГГЕР ПРЕДЗАГРУЗКИ ===
if (z.preloadTarget) {
    const targets = Array.isArray(z.preloadTarget)
        ? z.preloadTarget
        : [z.preloadTarget];

    targets.forEach(tid => {
        const target = zones.find(a => a.id === tid);
        if (!target) return;

        let files = [];

        // аудио
        if (target.audio) files.push(target.audio);

        // ключ для таймингов
        const key = "audio/" + target.audio.split("/").pop();

        // фото
        const p = photoTimings[key];
        if (p) {
            for (const t in p) files.push(p[t].open);
        }

        // видео
        const v = videoTimings[key];
        if (v) {
            for (const t in v) files.push(v[t].open);
        }

        queuePreload(files, target.id);
    });
}
          
            const audioZonesList = zones.filter(a => a.type === "audio");
            const idx = audioZonesList.findIndex(a => a.id === z.id);
            const next = audioZonesList[idx + 1];

            if (next && !next.preloadTriggered) {
                next.preloadTriggered = true;

                let files = [];
                if (next.audio) files.push(next.audio);

                queuePreload(files, next.id);
            }

            visitedAudioZones++;
            updateProgress();

            updateCircleColors();

            if (z.audio) {
                preloadAllMediaForCurrentAudio(z.audio);
                playZoneAudio(z.audio, z.id);
            }
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
      preloadAllMediaForCurrentAudio(z.audio); // ← ДОП-ПРЕДЗАГРУЗКА ДЛЯ СИМУЛЯЦИИ   

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
               
             /* START TOUR BTN — обновлённый, с компасом */
const startBtn = document.getElementById("startTourBtn");
if (startBtn) {
    startBtn.onclick = async () => {
        tourStarted = true;
        gpsActive = true;

        const intro = new Audio("audio/start.mp3");
        intro.play().catch(() => console.log("Не удалось проиграть start.mp3"));

        startBtn.style.display = "none";

        /* === ВКЛЮЧАЕМ КОМПАС ПРИ СТАРТЕ === */
        try {
            compassActive = true;

            // iOS
            if (typeof DeviceOrientationEvent !== "undefined" &&
                typeof DeviceOrientationEvent.requestPermission === "function") {

                const state = await DeviceOrientationEvent.requestPermission();

                if (state === "granted") {
                    window.addEventListener("deviceorientation", handleIOSCompass);
                } else {
                    console.warn("Пользователь не дал разрешение на компас");
                }

            } else {
                // Android / Desktop
                window.addEventListener("deviceorientationabsolute", handleIOSCompass);
            }

        } catch (err) {
            console.warn("Ошибка при запросе компаса:", err);
        }
    };
}

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

