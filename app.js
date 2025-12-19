// ======================================================
// 1. ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ======================================================

let map;
let userMarker = null;

let lastCoords = null;

let allPoints = [];          // ВСЕ точки (point + nav + triggers)
let routePoints = [];        // Координаты для маршрута
let triggerStates = {};      // Состояние триггеров (0 → 1 → 2)
let visitedPoints = {};      // Для обычных точек

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

    audio.play()
        .catch(err => {
            log("Ошибка аудио: " + err.message);
            audioPlaying = false;
        });

    audio.onended = () => {
        audioPlaying = false;
    };
}


// ======================================================
// 4. ГЕОМЕТРИЯ ТОЧЕК
// ======================================================

// Квадрат 25×25 или 20×20
function createSquare(lat, lng, sizeMeters) {
    const d = sizeMeters / 2 / 111320; // перевод метров в градусы
    return [
        [lat - d, lng - d],
        [lat - d, lng + d],
        [lat + d, lng + d],
        [lat + d, lng - d],
        [lat - d, lng - d]
    ];
}


// ======================================================
// 5. ОБРАБОТКА ТОЧЕК
// ======================================================

function handlePoint(p, index) {
    const coords = [p.lat, p.lng];

    // Добавляем в маршрут
    routePoints.push(coords);

    // -----------------------------
    // POINT (круг 20 м)
    // -----------------------------
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

        return;
    }

    // -----------------------------
    // NAV (костыль 25×25)
    // -----------------------------
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

        allPoints.push({
            id: p.id,
            type: "nav",
            coords,
            polygon,
            size: 25
        });

        return;
    }

    // -----------------------------
    // TRIGGER (двойной, 20×20)
    // -----------------------------
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

        triggerStates[p.id] = 0; // 0 → красный

        allPoints.push({
            id: p.id,
            type: "trigger",
            coords,
            polygon,
            size: 20,
            audio: `audio/${index}.mp3`
        });

        return;
    }
}


// ======================================================
// 6. ПРОВЕРКА ПОПАДАНИЯ В ТОЧКИ
// ======================================================

function checkPoints(coords) {
    allPoints.forEach(p => {

        // -----------------------------
        // POINT (круг)
        // -----------------------------
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

        // -----------------------------
        // TRIGGER (квадрат)
        // -----------------------------
        if (p.type === "trigger") {
            const square = p.polygon.geometry.getCoordinates()[0];

            // Проверяем попадание в квадрат
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
                // Выход → сброс
                triggerStates[p.id] = 0;
                p.polygon.options.set("fillColor", "rgba(255,0,0,0.25)");
            }
        }
    });
}


// ======================================================
// 7. ДВИЖЕНИЕ МАРКЕРА
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
// 8. СИМУЛЯЦИЯ
// ======================================================

function simulateNextStep() {
    if (!simulationActive) return;

    if (simulationIndex >= routePoints.length) {
        simulationActive = false;
        gpsActive = true;
        setStatus("Симуляция завершена");
        return;
    }

    const next = routePoints[simulationIndex];
    simulationIndex++;

    moveMarker(next);

    setTimeout(simulateNextStep, 1500);
}

function startSimulation() {
    if (!routePoints.length) return;

    simulationActive = true;
    gpsActive = false;
    simulationIndex = 0;

    moveMarker(routePoints[0]);
    map.setCenter(routePoints[0], 16);

    setTimeout(simulateNextStep, 1500);
}


// ======================================================
// 9. ИНИЦИАЛИЗАЦИЯ КАРТЫ
// ======================================================

function initMap() {
    const initialCenter = [55.826584, 49.082118];

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
            points.forEach(handlePoint);

            // Линия маршрута
            const routeLine = new ymaps.Polyline(
                routePoints,
                {},
                {
                    strokeColor: "#1E90FF",
                    strokeWidth: 4,
                    strokeOpacity: 0.8
                }
            );
            map.geoObjects.add(routeLine);

            setStatus("Готово");
            log("Все точки загружены");
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
