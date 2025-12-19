// ======================================================
// 1. ГЛОБАЛЬНОЕ СОСТОЯНИЕ
// ======================================================

let map;
let userMarker = null;

let lastCoords = null;
let zones = [];

let simulationActive = false;
let simulationPoints = [];
let simulationIndex = 0;

let gpsActive = true;

// Флаг, чтобы не накладывались аудио
let audioPlaying = false;

// Флаг, что пользователь разрешил звук
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

function playZoneAudio(src) {
    if (!audioEnabled) {
        log("Аудио заблокировано браузером — нажми кнопку 'Включить звук'");
        return;
    }

    if (audioPlaying) {
        log("Аудио уже играет — новое не запускаем");
        return;
    }

    log("Запуск аудио: " + src);

    const audio = new Audio(src);
    audioPlaying = true;

    audio.play()
        .then(() => {
            log("Аудио успешно проигрывается");
        })
        .catch(err => {
            log("Ошибка аудио: " + err.message);
            audioPlaying = false;
        });

    audio.onended = () => {
        audioPlaying = false;
        log("Аудио завершено");
    };
}


// ======================================================
// 4. ЗОНЫ
// ======================================================

function checkZones(coords) {
    zones.forEach(z => {
        const dist = distance(coords, [z.lat, z.lon]);

        if (dist <= z.radius && !z.visited) {
            z.visited = true;

            z.circle.options.set({
                fillColor: "rgba(0,255,0,0.15)",
                strokeColor: "rgba(0,255,0,0.4)"
            });

            log("Вход в зону: " + z.name);

            if (z.audio) {
                playZoneAudio(z.audio);
            }

            if (z.isLast) {
                setStatus("Финальная точка достигнута!");
                log("Финальная точка достигнута.");
            }
        }
    });
}


// ======================================================
// 5. ДВИЖЕНИЕ МАРКЕРА
// ======================================================

function moveMarker(coords) {
    if (lastCoords) {
        const angle = calculateAngle(lastCoords, coords);
        userMarker.options.set("iconImageRotation", angle);
    }

    lastCoords = coords;
    userMarker.geometry.setCoordinates(coords);

    checkZones(coords);
}


// ======================================================
// 6. СИМУЛЯЦИЯ (ТОЛЬКО ДО ПЕРВОЙ ТОЧКИ)
// ======================================================

function simulateNextStep() {
    if (!simulationActive) return;

    // Останавливаемся строго на первой точке
    if (simulationIndex >= 2) {
        simulationActive = false;
        gpsActive = true;
        setStatus("Симуляция завершена (до первой точки)");
        log("Симуляция завершена");
        return;
    }

    const next = simulationPoints[simulationIndex];
    simulationIndex++;

    moveMarker(next);

    setTimeout(simulateNextStep, 2000);
}

function startSimulation() {
    if (!simulationPoints.length) {
        setStatus("Нет точек для симуляции");
        log("Нет точек для симуляции");
        return;
    }

    simulationActive = true;
    gpsActive = false;
    simulationIndex = 0;

    const start = simulationPoints[0];
    moveMarker(start);
    map.setCenter(start, 15);

    setStatus("Симуляция запущена (до первой точки)");
    log("Симуляция запущена");

    setTimeout(simulateNextStep, 2000);
}


// ======================================================
// 7. ИНИЦИАЛИЗАЦИЯ КАРТЫ
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
            // Используем порядок из файла
            const sorted = points.slice();

            const routePoints = [];

            sorted.forEach((p, index) => {
                // Обычные точки маршрута
                if (p.type === "point") {
                    if (typeof p.lat !== "number" || typeof p.lng !== "number") {
                        console.warn("Некорректные координаты point", p);
                        return;
                    }

                    // Подпись точки (id)
                    const label = new ymaps.Placemark(
                        [p.lat, p.lng],
                        { iconContent: p.id },
                        {
                            preset: "islands#blueCircleIcon",
                            iconColor: "#1E90FF"
                        }
                    );
                    map.geoObjects.add(label);

                    // Круг радиуса
                    const circle = new ymaps.Circle(
                        [[p.lat, p.lng], p.radius],
                        {},
                        {
                            fillColor: "rgba(255,0,0,0.15)",
                            strokeColor: "rgba(255,0,0,0.4)",
                            strokeWidth: 2
                        }
                    );
                    map.geoObjects.add(circle);

                    // Пока простое аудио по индексу
                    const audioFile =
                        index === 0 ? "audio/start.mp3" : `audio/${index}.mp3`;

                    zones.push({
                        id: p.id,
                        name: p.name,
                        lat: p.lat,
                        lon: p.lng, // ВАЖНО: lng из JSON
                        radius: p.radius,
                        circle: circle,
                        visited: false,
                        isLast: index === sorted.length - 1,
                        audio: audioFile
                    });

                    // Для симуляции маршрута берём только точки
                    routePoints.push([p.lat, p.lng]);
                }

                // Навигационные точки (если хочешь видеть их отдельно)
                if (p.type === "nav") {
                    if (typeof p.lat !== "number" || typeof p.lng !== "number") {
                        console.warn("Некорректные координаты nav", p);
                        return;
                    }

                    const navPlacemark = new ymaps.Placemark(
                        [p.lat, p.lng],
                        { iconContent: p.id },
                        {
                            preset: "islands#darkOrangeDotIcon"
                        }
                    );
                    map.geoObjects.add(navPlacemark);
                }

                // Полигоны-зоны
                if (p.type === "area" && p.shape === "polygon" && Array.isArray(p.coordinates)) {
                    const polygonCoords = p.coordinates.map(c => [c.lat, c.lng]);

                    const polygon = new ymaps.Polygon(
                        [polygonCoords],
                        {},
                        {
                            fillColor: p.color || "rgba(0,80,0,0.25)",
                            strokeColor: p.strokeColor || "rgba(0,120,0,1)",
                            strokeWidth: 2
                        }
                    );
                    map.geoObjects.add(polygon);
                }
            });

            simulationPoints = routePoints;

            if (simulationPoints.length > 1) {
                const routeLine = new ymaps.Polyline(
                    simulationPoints,
                    {},
                    {
                        strokeColor: "#1E90FF",
                        strokeWidth: 4,
                        strokeOpacity: 0.8
                    }
                );

                map.geoObjects.add(routeLine);
            }

            setStatus("Готово к симуляции");
            log("Точки и маршрут загружены");
        });

    const btnSim = document.getElementById("simulate");
    if (btnSim) btnSim.addEventListener("click", startSimulation);

    // Кнопка включения звука
    const btnAudio = document.getElementById("enableAudio");
    if (btnAudio) {
        btnAudio.addEventListener("click", () => {
            const a = new Audio("audio/start.mp3");
            a.play()
                .then(() => {
                    audioEnabled = true;
                    log("Аудио разрешено браузером");
                })
                .catch(err => log("Ошибка разрешения аудио: " + err.message));
        });
    }

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            pos => {
                if (!gpsActive) return;
                moveMarker([pos.coords.latitude, pos.coords.longitude]);
            },
            err => log("Ошибка GPS: " + err.message),
            { enableHighAccuracy: true }
        );
    }

    setStatus("Карта инициализирована");
    log("Карта инициализирована");
}

document.addEventListener("DOMContentLoaded", () => {
    ymaps.ready(initMap);
});
