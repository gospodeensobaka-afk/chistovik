console.log("UPDATED APP JS — LOCAL SMOOTHING p02 → p04 ONLY (hidden-based)");

// ======================================================
// 1. ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ======================================================

let map;
let userMarker = null;

let lastCoords = null;

let allPoints = [];          // все точки (point/nav/trigger)
let routePoints = [];        // все точки маршрута (сырые)
let finalRoute = [];         // итоговый маршрут: сглаженный участок + обычные точки

let triggerStates = {};

let simulationActive = false;
let simulationIndex = 0;

let gpsActive = true;

let audioPlaying = false;
let audioEnabled = false;


// ======================================================
// 2. УТИЛИТЫ
// ======================================================

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


// ======================================================
// 3. АУДИО
// ======================================================

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


// ======================================================
// 4. ГЕОМЕТРИЯ КВАДРАТОВ
// ======================================================

function createSquare(lat, lng, sizeMeters) {
    const half = sizeMeters / 2;

    const meterInDegLat = 1 / 111320;
    const meterInDegLng = 1 / (111320 * Math.cos(lat * Math.PI / 180));

    const dLat = half * meterInDegLat;
    const dLng = half * meterInDegLng;

    return [
        [lat - dLat, lng - dLng],
        [lat - dLat, lng + dLng],
        [lat + dLat, lng + dLng],
        [lat + dLat, lng - dLng],
        [lat - dLat, lng - dLng]
    ];
}


// ======================================================
// 5. СГЛАЖИВАНИЕ (Catmull-Rom)
// ======================================================

function catmullRomSpline(points, segments = 12) {
    const result = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] || p2;

        for (let t = 0; t <= 1; t += 1 / segments) {
            const t2 = t * t;
            const t3 = t2 * t;

            const lat =
                0.5 * (
                    (2 * p1[0]) +
                    (-p0[0] + p2[0]) * t +
                    (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
                    (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
                );

            const lng =
                0.5 * (
                    (2 * p1[1]) +
                    (-p0[1] + p2[1]) * t +
                    (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
                    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
                );

            result.push([lat, lng]);
        }
    }

    return result;
}


// ======================================================
// 6. ОБРАБОТКА ТОЧЕК
// ======================================================

function handlePoint(p, index) {
    const coords = [p.lat, p.lng];

    // 6.1. HIDDEN — только геометрия, вообще ничего не рисуем
    if (p.hidden === true) {
        routePoints.push(coords);
        return;
    }

    // 6.2. POINT
    if (p.type === "point") {
        const circle = new ymaps.Circle(
            [coords, 20],
            {},
            {
                fillColor: "rgba(255,0,0,0.15)",
                strokeColor: "rgba(255,0,0,0.4)",
                strokeWidth: 2
            }
        );
        map.geoObjects.add(circle);

        allPoints.push({
            id: p.id,
            type: "point",
            coords,
            radius: 20,
            audio: `audio/${index}.mp3`,
            visited: false,
            circle
        });

        routePoints.push(coords);
        return;
    }

    // 6.3. NAV (обычные, видимые)
    if (p.type === "nav" && !p.triggerMode) {
        const square = createSquare(p.lat, p.lng, 25);

        const polygon = new ymaps.Polygon(
            [square],
            {},
            {
                fillColor: "rgba(0,120,255,0.15)",
                strokeColor: "rgba(0,120,255,1)",
                strokeWidth: 2
            }
        );
        map.geoObjects.add(polygon);

        let arrow = "";
        if (p.direction === "left") arrow = "←";
        if (p.direction === "right") arrow = "→";
        if (p.direction === "u-turn") arrow = "⟲";

        const arrowPlacemark = new ymaps.Placemark(
            coords,
            { iconContent: arrow },
            { preset: "islands#blueStretchyIcon" }
        );
        map.geoObjects.add(arrowPlacemark);

        allPoints.push({
            id: p.id,
            type: "nav",
            coords,
            polygon,
            size: 25
        });

        routePoints.push(coords);
        return;
    }

    // 6.4. TRIGGER
    if (p.type === "nav" && p.triggerMode === "double") {
        const square = createSquare(p.lat, p.lng, 20);

        const polygon = new ymaps.Polygon(
            [square],
            {},
            {
                fillColor: "rgba(255,0,0,0.25)",
                strokeColor: "rgba(0,0,0,1)",
                strokeWidth: 2
            }
        );
        map.geoObjects.add(polygon);

        let arrow = "";
        if (p.direction === "left") arrow = "←";
        if (p.direction === "right") arrow = "→";

        const arrowPlacemark = new ymaps.Placemark(
            coords,
            { iconContent: arrow },
            { preset: "islands#redStretchyIcon" }
        );
        map.geoObjects.add(arrowPlacemark);

        triggerStates[p.id] = 0;

        allPoints.push({
            id: p.id,
            type: "trigger",
            coords,
            polygon,
            size: 20,
            audio: `audio/${index}.mp3`
        });

        routePoints.push(coords);
        return;
    }
}// ======================================================
// 7. ПРОВЕРКА ПОПАДАНИЯ В ТОЧКИ
// ======================================================

function checkPoints(coords) {
    allPoints.forEach(p => {

        // POINT
        if (p.type === "point") {
            const dist = distance(coords, p.coords);
            if (dist <= p.radius && !p.visited) {
                p.visited = true;

                p.circle.options.set({
                    fillColor: "rgba(0,255,0,0.15)",
                    strokeColor: "rgba(0,255,0,0.4)"
                });

                playAudio(p.audio);
            }
        }

        // TRIGGER
        if (p.type === "trigger") {
            const square = p.polygon.geometry.getCoordinates()[0];

            const inside = ymaps.util.bounds.containsPoint(
                ymaps.util.bounds.fromPoints(square),
                coords
            );

            if (inside) {
                if (triggerStates[p.id] === 0) {
                    triggerStates[p.id] = 1;
                    p.polygon.options.set("fillColor", "rgba(255,255,0,0.25)");
                    playAudio(p.audio);
                } else if (triggerStates[p.id] === 1) {
                    triggerStates[p.id] = 2;
                    p.polygon.options.set("fillColor", "rgba(0,255,0,0.25)");
                    playAudio(p.audio);
                }
            } else {
                triggerStates[p.id] = 0;
                p.polygon.options.set("fillColor", "rgba(255,0,0,0.25)");
            }
        }
    });
}


// ======================================================
// 8. ДВИЖЕНИЕ МАРКЕРА
// ======================================================

function moveMarker(coords) {
    if (lastCoords) {
        const angle = calculateAngle(lastCoords, coords);
        userMarker.options.set("iconImageRotation", angle);
    }

    lastCoords = coords;
    userMarker.geometry.setCoordinates(coords);

    checkPoints(coords);
}


// ======================================================
// 9. СИМУЛЯЦИЯ
// ======================================================

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
    map.setCenter(finalRoute[0], 16);

    setTimeout(simulateNextStep, 1500);
}


// ======================================================
// 10. ИНИЦИАЛИЗАЦИЯ КАРТЫ + ЛОКАЛЬНОЕ СГЛАЖИВАНИЕ
// ======================================================

function initMap() {
    const initialCenter = [55.78724, 49.121848];

    map = new ymaps.Map("map", {
        center: initialCenter,
        zoom: 15,
        controls: []
    });

    userMarker = new ymaps.Placemark(
        initialCenter,
        {},
        {
            iconLayout: "default#image",
            iconImageHref: "arrow.png",
            iconImageSize: [40, 40],
            iconImageOffset: [-20, -20],
            iconRotate: true
        }
    );

    map.geoObjects.add(userMarker);

    fetch("points.json")
        .then(r => r.json())
        .then(points => {

            // сортировка по числовой части ID
            points.sort((a, b) => {
                const na = parseInt(a.id.match(/\d+/));
                const nb = parseInt(b.id.match(/\d+/));
                return na - nb;
            });

            // обработка всех точек
            points.forEach((p, i) => handlePoint(p, i));

            // -----------------------------------------------------
            // ЛОКАЛЬНОЕ СГЛАЖИВАНИЕ: p02 (k02) → hidden → p03 → hidden → p04
            // -----------------------------------------------------

            const idxP02 = points.findIndex(p => p.id === "k02_pushkina_bulak");
            const idxP04 = points.findIndex(p => p.id === "p04_chasha");

            // выделяем участок по routePoints в тех же индексах
            const segment = routePoints.slice(idxP02, idxP04 + 1);

            const smoothSegment = catmullRomSpline(segment, 12);

            finalRoute = [
                ...routePoints.slice(0, idxP02),   // p01 без сглаживания
                ...smoothSegment,                  // p02 → hidden → p03 → hidden → p04
                ...routePoints.slice(idxP04 + 1)   // всё после p04 без сглаживания
            ];

            const routeLine = new ymaps.Polyline(
                finalRoute,
                {},
                {
                    strokeColor: "#1E90FF",
                    strokeWidth: 4,
                    strokeOpacity: 0.9
                }
            );
            map.geoObjects.add(routeLine);

            setStatus("Готово");
            log("Маршрут загружен. Сглажен только участок p02 → p04, hidden-точки полностью невидимы.");
        });

    document.getElementById("simulate").addEventListener("click", startSimulation);

    document.getElementById("enableAudio").addEventListener("click", () => {
        const a = new Audio("audio/start.mp3");
        a.play()
            .then(() => {
                audioEnabled = true;
                log("Аудио разрешено");
            })
            .catch(err => log("Ошибка аудио: " + err.message));
    });

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

document.addEventListener("DOMContentLoaded", () => {
    ymaps.ready(initMap);
});
