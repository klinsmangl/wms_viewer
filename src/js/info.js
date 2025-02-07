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

  const getLayerData = async (layerName, lat, lng) => {
    const point = map.latLngToContainerPoint([lat, lng]);
    const size = map.getSize();
    const bbox = map.getBounds().toBBoxString();

    const getFeatureInfoUrl = `${urlWms}?service=WMS` +
      `&version=1.1.1` +
      `&request=GetFeatureInfo` +
      `&layers=${layerName}` +
      `&query_layers=${layerName}` +
      `&bbox=${bbox}` +
      `&width=${size.x}` +
      `&height=${size.y}` +
      `&srs=EPSG:4326` +
      `&X=${Math.floor(point.x)}` +
      `&Y=${Math.floor(point.y)}` +
      `&info_format=application/json`;

    try {
      const response = await fetch(getFeatureInfoUrl);
      const data = await response.json();

      return data && data.features && data.features.length
        ? { layerName, features: data.features }
        : null;
    } catch (error) {
      console.error("Erro ao obter dados da camada:", error);
      return null;
    }
  };

  // Corrigindo a chamada: passando explicitamente lat e lng
  const results = await Promise.all(
    Object.keys(overlays).map(layerName => getLayerData(layerName, lat, lng))
  );

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
        <button class="btn btn-dark w-100 text-truncate" title="${layerName}" data-bs-toggle="collapse" data-bs-target="#collapse-${layerName}">
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
