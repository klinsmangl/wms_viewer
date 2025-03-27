// Constantes para configurações comuns
const WMS_CONFIG = {
  transparent: true,
  maxZoom: 22,
  format: "image/png",
};

// Função para criar e adicionar camadas WMS
function addWMSLayer(layerValue, map, overlays, layerControl, urlWms) {
  try {
    // Verifica se a camada já existe para evitar duplicatas
    if (overlays[layerValue]) {
      console.warn(`Camada ${layerValue} já existe`);
      return false;
    }

    const camada = L.tileLayer.wms(urlWms, {
      ...WMS_CONFIG,
      layers: layerValue,
    });

    overlays[layerValue] = camada;
    map.addLayer(camada);
    layerControl.addOverlay(camada, layerValue);

    return true;
  } catch (error) {
    console.error(`Erro ao adicionar camada ${layerValue}:`, error);
    return false;
  }
}

// Função para atualizar parâmetros de URL
function updateUrlParams(layerValues) {
  try {
    urlParams.set("layer", layerValues.join(","));
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`
    );
  } catch (error) {
    console.error("Erro ao atualizar parâmetros de URL:", error);
  }
}

// Inicialização das camadas a partir dos parâmetros de URL
function initializeLayersFromUrlParams(map, overlays, layerControl, urlWms) {
  const layerUrlParam = urlParams.get("layer");
  let layerValues = layerUrlParam ? layerUrlParam.split(",") : [];

  // Usa filter para remover valores duplicados ou vazios
  layerValues = [...new Set(layerValues.filter(Boolean))];

  if (layerValues.length) {
    const addedLayers = layerValues.filter((layerValue) =>
      addWMSLayer(layerValue, map, overlays, layerControl, urlWms)
    );

    // Atualiza layerValues com camadas realmente adicionadas
    layerValues = addedLayers;

    // Mostra legendas apenas para camadas adicionadas com sucesso
    if (addedLayers.length) {
      showLegends(overlays, "legends-container");
    }
  }

  return layerValues;
}

// Configuração do evento de pesquisa
function setupLayerSearchEvent(map, overlays, layerControl, urlWms) {
  const pesquisarBtn = document.getElementById("pesquisar");
  const textoPesquisaInput = document.getElementById("texto-pesquisa");

  if (!pesquisarBtn || !textoPesquisaInput) {
    console.error("Elementos de pesquisa não encontrados");
    return [];
  }

  let layerValues = initializeLayersFromUrlParams(
    map,
    overlays,
    layerControl,
    urlWms
  );

  pesquisarBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const selectedValue = textoPesquisaInput.value.trim();

    if (!selectedValue) {
      console.warn("Nenhum valor selecionado");
      return;
    }

    if (!layerValues.includes(selectedValue)) {
      const layerAdded = addWMSLayer(
        selectedValue,
        map,
        overlays,
        layerControl,
        urlWms
      );

      if (layerAdded) {
        layerValues.push(selectedValue);
        updateUrlParams(layerValues);
        showLegends(overlays, "legends-container");

        // Limpa o campo de pesquisa após adicionar
        textoPesquisaInput.value = "";
      }
    } else {
      console.warn(`Camada ${selectedValue} já adicionada`);
    }
  });

  return layerValues;
}

// Chamada principal
const layerValues = setupLayerSearchEvent(map, overlays, layerControl, urlWms);
