/* Two independent mapping libraries using the same approximate city-centre data.
 * Requirement 1: markers are visible only at zoom > 5 (not at zoom === 5).
 * Requirement 2: raster AND vector wrapping are disabled; view bounds stay in one world.
 */
(() => {
    "use strict";
    const cities = window.visitedCities;
    const threshold = 5;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const explorers = {};
    const status = (id, zoom) => {
        document.getElementById(id + "-status").textContent =
            `Zoom ${zoom.toFixed(1)} · ${zoom > threshold ? "7 city markers visible" : "Zoom above 5 to reveal markers"}`;
    };
    const details = (city) => {
        const div = document.createElement("div");
        const title = document.createElement("h3");
        title.textContent = city.name;
        const text = document.createElement("p");
        text.textContent = city.note;
        const coordinates = document.createElement("p");
        coordinates.textContent = `${city.lat.toFixed(4)}° N · ${city.lon.toFixed(4)}° E`;
        div.append(title, text, coordinates);
        return div;
    };
    const failure = (engine) => {
        const target = document.getElementById(engine + "-map");
        const notice = document.createElement("p");
        notice.className = "notice";
        notice.textContent =
            "The map library could not load. Check your internet connection and refresh. You can still browse the city collection below.";
        target.append(notice);
        document.getElementById(engine + "-status").textContent = "Map unavailable";
    };
    // A single source of truth allows travel photographs to replace the illustrations.
    for (const city of cities) {
        const image = document.querySelector(`[data-city-image="${city.id}"]`);
        if (image) {
            image.src = city.image;
            image.alt = city.imageAlt;
        }
    }
    if (window.ol) {
        const features = cities.map(
            (city) =>
                new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([city.lon, city.lat])),
                    city,
                }),
        );
        const points = new ol.layer.Vector({
            source: new ol.source.Vector({ features, wrapX: false }),
            visible: false,
            style: new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 8,
                    fill: new ol.style.Fill({ color: "#476b29" }),
                    stroke: new ol.style.Stroke({ color: "#ffffff", width: 2 }),
                }),
            }),
        });
        const view = new ol.View({
            center: ol.proj.fromLonLat([31.3, 39.0]),
            zoom: 5,
            minZoom: 2,
            maxZoom: 18,
            multiWorld: false,
            extent: ol.proj.get("EPSG:3857").getExtent(),
            constrainOnlyCenter: false,
        });
        const tiles = new ol.source.OSM({ wrapX: false });
        const map = new ol.Map({
            target: "openlayers-map",
            layers: [new ol.layer.Tile({ source: tiles }), points],
            view,
        });
        const popup = document.createElement("div");
        popup.className = "map-popup";
        popup.hidden = true;
        const content = document.createElement("div");
        const close = document.createElement("button");
        close.className = "popup-close";
        close.textContent = "×";
        close.setAttribute("aria-label", "Close city details");
        popup.append(close, content);
        const overlay = new ol.Overlay({
            element: popup,
            positioning: "bottom-center",
            offset: [0, -15],
            autoPan: { animation: { duration: reducedMotion ? 0 : 200 } },
        });
        map.addOverlay(overlay);
        const dismiss = () => {
            overlay.setPosition(undefined);
            popup.hidden = true;
        };
        close.addEventListener("click", dismiss);
        document.getElementById("openlayers-map").addEventListener("keydown", (e) => {
            if (e.key === "Escape") dismiss();
        });
        const show = (city) => {
            content.replaceChildren(details(city));
            popup.hidden = false;
            overlay.setPosition(ol.proj.fromLonLat([city.lon, city.lat]));
        };
        const update = () => {
            const zoom = view.getZoom();
            points.setVisible(zoom > threshold);
            if (zoom <= threshold) dismiss();
            status("openlayers", zoom);
        };
        view.on("change:resolution", update);
        update();
        map.on("singleclick", (event) => {
            const feature = map.forEachFeatureAtPixel(event.pixel, (value) => value, {
                hitTolerance: 6,
            });
            if (feature) show(feature.get("city"));
            else dismiss();
        });
        map.on("pointermove", (event) => {
            map.getTargetElement().style.cursor = map.hasFeatureAtPixel(event.pixel)
                ? "pointer"
                : "";
        });
        explorers.openlayers = {
            focus(city) {
                dismiss();
                view.cancelAnimations();
                view.setCenter(ol.proj.fromLonLat([city.lon, city.lat]));
                view.setZoom(9);
                show(city);
            },
            reset() {
                dismiss();
                view.cancelAnimations();
                view.setCenter(ol.proj.fromLonLat([31.3, 39]));
                view.setZoom(5);
            },
            map,
            view,
            points,
            tiles,
        };
    } else failure("openlayers");
    if (window.L) {
        const map = L.map("leaflet-map", {
            minZoom: 2,
            maxZoom: 18,
            maxBounds: [
                [-85.0511, -180],
                [85.0511, 180],
            ],
            maxBoundsViscosity: 1,
            worldCopyJump: false,
            scrollWheelZoom: false,
            zoomAnimation: !reducedMotion,
            fadeAnimation: !reducedMotion,
        }).setView([39, 31.3], 5);
        const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            noWrap: true,
            minZoom: 2,
            maxZoom: 19,
            bounds: [
                [-85.0511, -180],
                [85.0511, 180],
            ],
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        const points = L.layerGroup();
        const markers = new Map();
        for (const city of cities) {
            const marker = L.circleMarker([city.lat, city.lon], {
                radius: 8,
                color: "#ffffff",
                weight: 2,
                fillColor: "#476b29",
                fillOpacity: 1,
            })
                .bindPopup(details(city))
                .addTo(points);
            markers.set(city.id, marker);
        }
        const update = () => {
            const zoom = map.getZoom();
            if (zoom > threshold) {
                if (!map.hasLayer(points)) points.addTo(map);
            } else {
                map.closePopup();
                if (map.hasLayer(points)) map.removeLayer(points);
            }
            status("leaflet", zoom);
        };
        map.on("zoomend", update);
        update();
        explorers.leaflet = {
            focus(city) {
                map.setView([city.lat, city.lon], 9, { animate: false });
                update();
                markers.get(city.id).openPopup();
            },
            reset() {
                map.closePopup();
                map.setView([39, 31.3], 5, { animate: false });
                update();
            },
            map,
            points,
            tiles,
        };
    } else failure("leaflet");
    const focusCity = (id) => {
        const city = cities.find((item) => item.id === id);
        if (!city) {
            document.getElementById("city-select").focus();
            return;
        }
        document.getElementById("city-select").value = id;
        for (const explorer of Object.values(explorers)) explorer.focus(city);
    };
    document
        .getElementById("locate-city")
        .addEventListener("click", () => focusCity(document.getElementById("city-select").value));
    document
        .getElementById("city-select")
        .addEventListener("change", (event) => focusCity(event.target.value));
    document.querySelectorAll("[data-city]").forEach((button) =>
        button.addEventListener("click", () => {
            focusCity(button.dataset.city);
            document
                .getElementById("atlas")
                .scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" });
        }),
    );
    document.querySelectorAll("[data-overview]").forEach((button) =>
        button.addEventListener("click", () => {
            explorers[button.dataset.overview]?.reset();
            document.getElementById("city-select").value = "";
        }),
    );
    // Exposes the map instances for learning and inspecting the two implementations.
    window.travelAtlas = { explorers, threshold };
})();
