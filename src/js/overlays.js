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
  showLegends(overlays, "legends-container");
}

document.getElementById("pesquisar").addEventListener("click", (e) => {
  e.preventDefault();
  const selectedValue = document.getElementById("texto-pesquisa").value;
  if (selectedValue) {
    if (!layerValues.includes(selectedValue)) {
      layerValues.push(selectedValue);

      const camada = L.tileLayer.wms(`${urlWms}`, {
        layers: selectedValue,
        transparent: true,
        maxZoom: 22,
        format: "image/png",
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
      showLegends(overlays, "legends-container");
    }
  }
});
