const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png");
const satelite = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}");
const googlemaps = L.tileLayer(
  "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
{
  maxZoom: 22
}
  
);

const urlWms = "https://geoserver.sefin.fortaleza.ce.gov.br/geoserver/ows";

const baselayers = {
  "Open Street Map": osm,
  Satelite: satelite,
  "Google Maps": googlemaps,
};

let overlays = {};

const map = L.map("map",
{ 
  center: [-3.709, -38.532],
  zoom: 10,
  layers: [googlemaps],
  zoomControl: false ,
  attributionControl: false
}
);

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

let camadaSelecionada = null;

document.getElementById("pesquisar").addEventListener("click", (e) => {
  e.preventDefault();
  const selectedValue = document.getElementById("texto-pesquisa").value;
  if (selectedValue) {
    const camada = L.tileLayer.wms(`${urlWms}`, {
      layers: selectedValue,
      transparent: true,
      maxZoom: 22,
      format: "image/png",
      attribution: "Prefeitura Municipal de Fortaleza",
    });
    overlays[selectedValue] = camada;
    map.addLayer(camada);
    layerControl.addOverlay(camada, selectedValue);
    camadaSelecionada = selectedValue;
  }
});

map.on("click", async ({ latlng: { lat, lng } }) => {
  const popup = L.popup().setLatLng([lat, lng]).setContent("Loading...").openOn(map);

  const wfsUrl = `${urlWms}?service=WFS&version=1.0.0&request=GetFeature&typeName=${camadaSelecionada}&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(
    `INTERSECTS(the_geom, SRID=4326;POINT(${lng} ${lat}))`
  )}`;

  try {
    const response = await fetch(wfsUrl);
    const { features } = await response.json();

    if (features.length) {
      const content = Object.entries(features[0].properties)
        .map(([key, value]) => `${key}: ${value}`)
        .join("<br>");
      popup.setContent(`${content}`);
    } else {
      popup.setContent("No Data");
    }
  } catch (error) {
    console.error("Error fetching WFS data:", error);
    popup.setContent("Error loading data");
  }
});
