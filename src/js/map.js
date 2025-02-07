const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
const satelite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
);
const googlemaps = L.tileLayer(
  "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
  {
    maxZoom: 22,
  }
);

const urlParams = new URLSearchParams(window.location.search);
const urlWms = urlParams.get("wms");

const baselayers = {
  "Open Street Map": osm,
  Satelite: satelite,
  "Google Maps": googlemaps,
};

let overlays = {};

const map = L.map("map", {
  center: [-3.709, -38.532],
  zoom: 10,
  layers: [googlemaps],
  zoomControl: false,
  attributionControl: false,
});

const layerControl = L.control
  .layers(baselayers, overlays, { position: "bottomright" })
  .addTo(map);

L.control.scale({ imperial: false }).addTo(map);

async function fetchGetCapabilities() {
  try {
    const response = await fetch(
      `${urlWms}?service=WMS&request=GetCapabilities`
    );
    const text = await response.text();
    const xml = new window.DOMParser().parseFromString(text, "text/xml");

    const layers = Array.from(xml.querySelectorAll("Layer > Layer"));

    const datalistElement = document.getElementById("camadas-list");

    layers.forEach((layer) => {
      const optionElement = document.createElement("option");
      optionElement.value = layer.querySelector("Name").textContent;
      optionElement.textContent = layer.querySelector("Title").textContent;
      datalistElement.appendChild(optionElement);
    });

    console.log(layers);
  } catch (error) {
    console.error("Erro ao obter as camadas WMS:", error);
  }
}

fetchGetCapabilities();
