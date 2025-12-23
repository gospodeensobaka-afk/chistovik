console.log("UPDATED APP JS — LOCAL STYLE + POINTS + ROUTE + SIMULATION + ROTATION + CUSTOM MARKERS");

const map = new maplibregl.Map({
    container: "map",
    style: "style.json",
    center: [49.1223, 55.7873],
    zoom: 14,
    pitch: 0
});

map.addControl(new maplibregl.NavigationControl());

let userMarker = null;
let routeCoords = [];
let simulationIndex = 0;
let simulationInterval = null;

function createCircle(color, size) {
    const el = document.createElement("div");
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = "50%";
    el.style.backgroundColor = color;
    el.style.border = "2px solid black";
    return el;
}

function createSquare(color, size) {
    const el = document.createElement("div");
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.backgroundColor = color;
    el.style.border = "2px solid #0078ff";
    return el;
}

function calculateBearing(from, to) {
    const [lng1, lat1] = from;
    const [lng2, lat2] = to;
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    return Math.atan2(dy, dx) * (180 / Math.PI);
}

async function loadPoints() {
    const response = await fetch("points.json");
    const points = await response.json();

    points.forEach(p => {
        if (p.type === "point") {
            const marker = new maplibregl.Marker({
                element: createCircle(p.color, p.radius || 20)
            })
            .setLngLat([p.lng, p.lat])
            .addTo(map);
        }

        if (p.type === "nav") {
            const marker = new maplibregl.Marker({
                element: createSquare(p.color, 20)
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

function createUserMarker() {
    const el = document.createElement("div");
    el.className = "user-marker";
    el.style.width = "40px";
    el.style.height = "40px";
    el.style.backgroundImage = "url('arrow.png')";
    el.style.backgroundSize = "contain";
    el.style.transformOrigin = "center";

    userMarker = new maplibregl.Marker({
        element: el,
        rotationAlignment: "map"
    })
    .setLngLat([49.1223, 55.7873])
    .addTo(map);
}

function startSimulation() {
    if (!routeCoords.length || !userMarker) {
        console.warn("Маршрут или маркер не готовы");
        return;
    }

    if (simulationInterval) {
        clearInterval(simulationInterval);
    }

    simulationIndex = 0;

    simulationInterval = setInterval(() => {
        if (simulationIndex >= routeCoords.length - 1) {
            clearInterval(simulationInterval);
            return;
        }

        const current = routeCoords[simulationIndex];
        const next = routeCoords[simulationIndex + 1];
        const bearing = calculateBearing(current, next);

        userMarker.setLngLat(current);
        userMarker.setRotation(bearing);
        map.flyTo({ center: current, zoom: 17, speed: 0.5 });

        simulationIndex++;
    }, 500);
}

map.on("load", async () => {
    console.log("MAP LOADED");

    createUserMarker();
    await loadPoints();
    await loadRoute();

    console.log("POINTS + ROUTE LOADED");
});

document.getElementById("simulate").addEventListener("click", startSimulation);
