async function showLegends(overlays, targetElementId) {
    const targetElement = document.getElementById(targetElementId);
    if (!targetElement) {
      console.error(`Element with ID ${targetElementId} not found`);
      return;
    }
  
    const getLegend = async (layerName) => {
      const legendParams = {
        format: "image/png",
        transparent: true,
        width: 20,
        height: 20,
        style: "",
        layers: layerName,
        legend_options: "dpi:120;forceLabels:on;fontAntiAliasing:true;countMatched:false;fontName:sans;hideEmptyRules:false;forceTitles:off",
      };

      const wmsBaseUrl = `${urlWms}?service=WMS&request=GetLegendGraphic&version=1.1.0&`;
      const wmsUrl = `${wmsBaseUrl}FORMAT=${legendParams.format}&WIDTH=${legendParams.width}&HEIGHT=${legendParams.height}&STYLE=${legendParams.style}&LAYER=${legendParams.layers}&LEGEND_OPTIONS=${legendParams.legend_options}&TRANSPARENT=${legendParams.transparent}`;

      try {
        const response = await fetch(wmsUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        return `
          <div class="card-group">
            <div class="card mb-3">
              <div class="card-header">
                <span class="fw-semibold">${layerName}</span>
              </div>
              <div class="card-body">
                <img src="${url}" alt="${layerName}">
              </div>
            </div>
          </div>
        `;
      } catch (error) {
        return "";
      }
    };

    const results = await Promise.all(Object.keys(overlays).map(getLegend));
    const content = results.filter((html) => html.trim() !== "").join("");
    targetElement.innerHTML = content || "Nenhum dado encontrado.";
}

showLegends(overlays, "legends-container");

