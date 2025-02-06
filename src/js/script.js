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

const urlWms = "https://geoserver.sefin.fortaleza.ce.gov.br/geoserver/ows";

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

const urlParams = new URLSearchParams(window.location.search);
const layerUrlParam = urlParams.get("layer");

let layerValues = layerUrlParam ? layerUrlParam.split(",") : [];

if (layerValues.length) {
  layerValues.forEach((layerValue) => {
    const camada = L.tileLayer.wms(`${urlWms}`, {
      layers: layerValue,
      transparent: true,
      maxZoom: 22,
      format: "image/png",
      attribution: "Prefeitura municipal de Fortaleza",
    });
    overlays[layerValue] = camada;
    map.addLayer(camada);
    layerControl.addOverlay(camada, layerValue);
  });
}

document.getElementById("pesquisar").addEventListener("click", (e) => {
  e.preventDefault();
  const selectedValue = document.getElementById("texto-pesquisa").value;
  if (selectedValue) {
    if (!layerValues.includes(selectedValue)) {
      layerValues.push(selectedValue); // Avoid duplicates

      const camada = L.tileLayer.wms(`${urlWms}`, {
        layers: selectedValue,
        transparent: true,
        maxZoom: 22,
        format: "image/png",
        attribution: "Prefeitura municipal de Fortaleza",
      });
      overlays[selectedValue] = camada;
      map.addLayer(camada);
      layerControl.addOverlay(camada, selectedValue);

      urlParams.set("layer", layerValues.join(","));
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${urlParams.toString()}`
      );
    }
  }
});

//seção info atributos

map.on("click", async ({ latlng: { lat, lng } }) => {
  const popup = L.popup()
    .setLatLng([lat, lng])
    .setContent(`
      <div class="d-flex align-items-center justify-content-center p-2">
        <div class="spinner-grow text-secondary" role="status"></div>
        <span class="ms-2 fw-semibold text-secondary">Carregando...</span>
      </div>
    `)
    .openOn(map);

  const getLayerData = async (layerName) => {
    const wfsUrl = `${urlWms}?service=WFS&version=1.0.0&request=GetFeature&typeName=${layerName}&outputFormat=application/json&CQL_FILTER=${encodeURIComponent(
      `INTERSECTS(the_geom, SRID=4326;POINT(${lng} ${lat}))`
    )}`;

    try {
      const response = await fetch(wfsUrl);
      const data = await response.json();
      return data.features.length ? { layerName, features: data.features } : null;
    } catch (error) {
      return null;
    }
  };

  const results = await Promise.all(Object.keys(overlays).map(getLayerData));
  const content = results
    .filter((result) => result && result.features.length > 0)
    .map(({ layerName, features }) => {
      const properties = features[0].properties;
      if (!properties || Object.keys(properties).length === 0) return "";

      const propertyRows = Object.entries(properties)
        .map(([key, value]) => `
          <tr class="d-flex text-break">
            <th class="col-7 d-flex align-items-center">${key}</th>
            <td class="col-5 d-flex align-items-center">${value}</td>
          </tr>
        `)
        .join("");

      return `
        <button class="btn btn-dark w-100" data-bs-toggle="collapse" data-bs-target="#collapse-${layerName}">
          <strong>${layerName}</strong>
        </button>
        <div class="table-responsive">
          <table class="table table-hover">
            <tbody id="collapse-${layerName}" class="collapse">
              ${propertyRows}
            </tbody>
          </table>
        </div>
      `;
    })
    .filter((html) => html.trim() !== "")
    .join("");

  popup.setContent(content || "<div class='p-2 text-center text-muted'>Nenhum dado encontrado.</div>");
});

