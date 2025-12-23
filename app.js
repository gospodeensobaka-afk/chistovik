console.log("UPDATED APP JS — MAPLIBRE VERSION (FIXED ROUTE + OVERLAP PROTECTION)");

let map;
let userMarker = null;

let lastCoords = null;

let allPoints = [];
let routePoints = [];
let finalRoute = [];

let triggerStates = {};

let simulationActive = false;
let simulationIndex = 0;

let gpsActive = true;

let audioPlaying = false;
let audioEnabled = false;

// ===============================
//  УТИЛИТЫ
// ===============================

function log(t) {
    const el = document.getElementById("debug");
    if (el) {
        el.textContent += t + "\n";
        el.scrollTop = el.scrollHeight;
    }
}

function setStatus(t) {
    const el = document.getElementById("status");
    if (el) el.textContent = t;
}

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

// ===============================
//  АУДИО
// ===============================

function playAudio(src) {
    if (!audioEnabled) {
        log("Аудио заблокировано — нажми 'Включить звук'");
        return;
    }

    if (audioPlaying) return;

    const audio = new Audio(src);
    audioPlaying = true;

    audio.play().catch(err => {
        log("Ошибка аудио: " + err.message);
        audioPlaying = false;
    });

    audio.onended = () => audioPlaying = false;
}

// ===============================
//  ГЕОМЕТРИЯ КВАДРАТОВ
// ===============================

function createSquare(lat, lng, sizeMeters) {
    const half = sizeMeters / 2;

    const meterInDegLat = 1 / 111320;
    const meterInDegLng = 1 / (111320 * Math.cos(lat * Math.PI / 180));

    const dLat = half * meterInDegLat;
    const dLng = half * meterInDegLng;

    return [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat]
    ];
}

// ===============================
//  GEOJSON
// ===============================

function addGeoJSON(id, data) {
    if (map.getSource(id)) return;
    map.addSource(id, {
        type: "geojson",
        data
    });
}

function updateGeoJSON(id, data) {
    const src = map.getSource(id);
    if (src) src.setData(data);
}

// ===============================
//  ОБРАБОТКА ТОЧЕК
// ===============================

function handlePoint(p, index) {
    const lat = p.lat;
    const lng = p.lng;

    const coordsLatLng = [lat, lng];
    const coords = [lng, lat];

    if (p.hidden === true) {
        routePoints.push(coordsLatLng);
        return;
    }

    if (p.type === "point") {
        const id = `point-${p.id}`;

        addGeoJSON(id, {
            type: "Feature",
            geometry: { type: "Point", coordinates: coords }
        });

        map.addLayer({
            id,
            type: "circle",
            source: id,
            paint: {
                "circle-radius": p.radius || 20,
                "circle-color": p.color || "rgba(255,0,0,0.15)",
                "circle-stroke-color": p.strokeColor || "rgba(255,0,0,0.4)",
                "circle-stroke-width": 2
            }
        });

        allPoints.push({
            id: p.id,
            type: "point",
            coords: coordsLatLng,
            radius: p.radius || 20,
            audio: `audio/${index}.mp3`,
            visited: false,
            layerId: id
        });

        routePoints.push(coordsLatLng);
        return;
    }    // NAV (обычные квадраты)
    if (p.type === "nav" && !p.triggerMode) {
        const square = createSquare(lat, lng, 25);
        const id = `nav-${p.id}`;

        addGeoJSON(id, {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [square] }
        });

        map.addLayer({
            id,
            type: "fill",
            source: id,
            paint: {
                "fill-color": p.color || "rgba(0,120,255,0.15)",
                "fill-outline-color": p.strokeColor || "rgba(0,120,255,1)"
            }
        });

        let arrow = "";
        if (p.direction === "left") arrow = "←";
        if (p.direction === "right") arrow = "→";
        if (p.direction === "u-turn") arrow = "⟲";

        const el = document.createElement("div");
        el.textContent = arrow;
        el.style.fontSize = "22px";
        el.style.fontWeight = "bold";

        new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(map);

        allPoints.push({
            id: p.id,
            type: "nav",
            coords: coordsLatLng,
            size: 25,
            polygon: square,
            layerId: id
        });

        routePoints.push(coordsLatLng);
        return;
    }

    // TRIGGER (двойные)
    if (p.type === "nav" && p.triggerMode === "double") {
        const square = createSquare(lat, lng, 20);
        const id = `trigger-${p.id}`;

        addGeoJSON(id, {
            type: "Feature",
            geometry: { type: "Polygon", coordinates: [square] }
        });

        map.addLayer({
            id,
            type: "fill",
            source: id,
            paint: {
                "fill-color": "rgba(255,0,0,0.25)",
                "fill-outline-color": "rgba(0,0,0,1)"
            }
        });

        let arrow = "";
        if (p.direction === "left") arrow = "←";
        if (p.direction === "right") arrow = "→";

        const el = document.createElement("div");
        el.textContent = arrow;
        el.style.fontSize = "22px";
        el.style.fontWeight = "bold";
        el.style.color = "red";

        new maplibregl.Marker({ element: el })
            .setLngLat(coords)
            .addTo(map);

        triggerStates[p.id] = 0;

        allPoints.push({
            id: p.id,
            type: "trigger",
            coords: coordsLatLng,
            polygon: square,
            size: 20,
            audio: `audio/${index}.mp3`,
            layerId: id
        });

        routePoints.push(coordsLatLng);
        return;
    }
}

// ===============================
//  ПРОВЕРКА ПОПАДАНИЯ В ТОЧКИ
// ===============================

function checkPoints(coordsLatLng) {
    const pointFeature = turf.point([coordsLatLng[1], coordsLatLng[0]]);

    allPoints.forEach(p => {

        // POINT
        if (p.type === "point") {
            const dist = distance(coordsLatLng, p.coords);
            if (dist <= p.radius && !p.visited) {
                p.visited = true;

                map.setPaintProperty(p.layerId, "circle-color", "rgba(0,255,0,0.25)");
                map.setPaintProperty(p.layerId, "circle-stroke-color", "rgba(0,255,0,0.4)");

                playAudio(p.audio);
            }
        }

        // TRIGGER
        if (p.type === "trigger") {
            const poly = turf.polygon([p.polygon]);
            const inside = turf.booleanPointInPolygon(pointFeature, poly);

            if (inside) {
                if (triggerStates[p.id] === 0) {
                    triggerStates[p.id] = 1;
                    map.setPaintProperty(p.layerId, "fill-color", "rgba(255,255,0,0.25)");
                    playAudio(p.audio);
                } else if (triggerStates[p.id] === 1) {
                    triggerStates[p.id] = 2;
                    map.setPaintProperty(p.layerId, "fill-color", "rgba(0,255,0,0.25)");
                    playAudio(p.audio);
                }
            } else {
                triggerStates[p.id] = 0;
                map.setPaintProperty(p.layerId, "fill-color", "rgba(255,0,0,0.25)");
            }
        }
    });
}

// ===============================
//  ДВИЖЕНИЕ МАРКЕРА
// ===============================

let stableCounter = 0;
let previousDistance = Infinity;

function moveMarker(coordsLatLng) {
    const coords = [coordsLatLng[1], coordsLatLng[0]];

    if (lastCoords) {
        const angle = calculateAngle(lastCoords, coordsLatLng);
        userMarker.getElement().style.transform = `rotate(${angle}deg)`;
    }

    lastCoords = coordsLatLng;
    userMarker.setLngLat(coords);

    checkPoints(coordsLatLng);
}}

// ===============================
//  СИМУЛЯЦИЯ С ЗАЩИТОЙ ОТ ПЕРЕСКОКОВ
// ===============================

function simulateNextStep() {
    if (!simulationActive) return;

    if (simulationIndex >= finalRoute.length) {
        simulationActive = false;
        gpsActive = true;
        setStatus("Симуляция завершена");
        return;
    }

    const next = finalRoute[simulationIndex];
    simulationIndex++;

    moveMarker(next);

    setTimeout(simulateNextStep, 1500);
}

function startSimulation() {
    if (!finalRoute.length) return;

    simulationActive = true;
    gpsActive = false;
    simulationIndex = 0;

    moveMarker(finalRoute[0]);
    map.flyTo({
        center: [finalRoute[0][1], finalRoute[0][0]],
        zoom: 16
    });

    setTimeout(simulateNextStep, 1500);
}

// ===============================
//  ИНИЦИАЛИЗАЦИЯ MAPLIBRE
// ===============================

function initMap() {
    const initialCenter = [55.78724, 49.121848];

    map = new maplibregl.Map({
        container: "map",
        style: "https://tiles.openfreemap.org/styles/bright",
        center: [initialCenter[1], initialCenter[0]],
        zoom: 15,
        pitch: 45,
        bearing: 0
    });

    // Маркер пользователя
    const el = document.createElement("img");
    el.src = "arrow.png";
    el.style.width = "40px";
    el.style.height = "40px";
    el.style.transformOrigin = "center";

    userMarker = new maplibregl.Marker({ element: el })
        .setLngLat([initialCenter[1], initialCenter[0]])
        .addTo(map);

    // Загружаем точки
    fetch("points.json")
        .then(r => r.json())
        .then(points => {

            points.forEach((p, i) => handlePoint(p, i));

            // ВАЖНО: finalRoute = твой новый маршрут
            finalRoute = [...routePoints];

            // Рисуем линию маршрута
            const lineCoords = finalRoute.map(p => [p[1], p[0]]);

            addGeoJSON("route-line", {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: lineCoords
                }
            });

            map.addLayer({
                id: "route-line",
                type: "line",
                source: "route-line",
                paint: {
                    "line-color": "#1E90FF",
                    "line-width": 4,
                    "line-opacity": 0.9
                }
            });

            setStatus("Готово");
            log("Маршрут загружен. MapLibre версия.");
        });

    // Кнопка симуляции
    document.getElementById("simulate").addEventListener("click", startSimulation);

    // Кнопка включения аудио
    document.getElementById("enableAudio").addEventListener("click", () => {
        const a = new Audio("audio/start.mp3");
        a.play()
            .then(() => {
                audioEnabled = true;
                log("Аудио разрешено");
            })
            .catch(err => log("Ошибка аудио: " + err.message));
    });

    // GPS
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            pos => {
                if (!gpsActive) return;
                moveMarker([pos.coords.latitude, pos.coords.longitude]);
            },
            err => log("GPS ошибка: " + err.message),
            { enableHighAccuracy: true }
        );
    }
}

document.addEventListener("DOMContentLoaded", initMap);
