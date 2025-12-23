console.log("UPDATED APP JS — LOCAL STYLE + POINTS + ROUTE + SIMULATION");

// Инициализация карты
const map = new maplibregl.Map({
    container: "map",
    style: "style.json", // ЛОКАЛЬНЫЙ СТИЛЬ В КОРНЕ РЕПОЗИТОРИЯ
    center: [49.1223, 55.7873],
    zoom: 14,
    pitch: 0
});

// Добавляем контролы
map.addControl(new maplibregl.NavigationControl());

// Глобальные переменные
let userMarker = null;
let routeCoords = [];
let simulationIndex = 0;
let simulationInterval = null;

// Загружаем точки
async function loadPoints() {
    const response = await fetch("points.json");
    const points = await response.json();

    points.forEach(p => {
        if (p.type === "point") {
            new maplibregl.Marker({
                color: "#ff0000"
            })
            .setLngLat([p.lng, p.lat])
            .addTo(map);
        }

        if (p.type === "nav") {
            new maplibregl.Marker({
                color: "#0078ff"
            })
            .setLngLat([p.lng, p.lat])
            .addTo(map);
        }

        if (p.type === "area") {
            map.addSource(p.id, {
                type: "geojson",
                data: {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [
                            p.coordinates.map(c => [c.lng, c.lat])
                        ]
                    }
                }
            });

            map.addLayer({
                id: p.id,
                type: "fill",
                source: p.id,
                paint: {
                    "fill-color": p.color,
                    "fill-outline-color": p.strokeColor
                }
            });
        }
    });
}

// Загружаем маршрут
async function loadRoute() {
    const response = await fetch("route.json");
    const route = await response.json();

    routeCoords = route.features[0].geometry.coordinates;

    map.addSource("route", {
        type: "geojson",
        data: route
    });

    map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
            "line-color": "#ff0000",
            "line-width": 4
        }
    });
}

// Создаём пользовательский маркер
function createUserMarker() {
    const el = document.createElement("div");
    el.className = "user-marker";
    el.style.width = "40px";
    el.style.height = "40px";
    el.style.backgroundImage = "url('arrow.png')";
    el.style.backgroundSize = "contain";

    userMarker = new maplibregl.Marker({
        element: el,
        rotationAlignment: "map"
    })
    .setLngLat([49.1223, 55.7873])
    .addTo(map);
}

// Симуляция движения
function startSimulation() {
    if (!routeCoords.length) {
        console.warn("Маршрут ещё не загружен");
        return;
    }

    if (simulationInterval) {
        clearInterval(simulationInterval);
    }

    simulationIndex = 0;

    simulationInterval = setInterval(() => {
        if (simulationIndex >= routeCoords.length) {
            clearInterval(simulationInterval);
            return;
        }

        const [lng, lat] = routeCoords[simulationIndex];

        userMarker.setLngLat([lng, lat]);
        map.flyTo({ center: [lng, lat], zoom: 17, speed: 0.5 });

        simulationIndex++;
    }, 500);
}

// Когда карта загрузилась
map.on("load", async () => {
    console.log("MAP LOADED");

    createUserMarker();
    await loadPoints();
    await loadRoute();

    console.log("POINTS + ROUTE LOADED");
});

// Кнопка симуляции
document.getElementById("simulateBtn").addEventListener("click", startSimulation);
