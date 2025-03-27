const provider = new GeoSearch.OpenStreetMapProvider({
  params: { countrycodes: "br" },
});

const searchInput = document.getElementById("search-input");
const autocompleteList = document.getElementById("autocomplete-list");
const pesquisarLocalizacao = document.getElementById("pesquisar-localizacao");

let lastResults = [];

// Função de debounce mais robusta
function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

// Tratamento de erro mais detalhado
async function handleInput(event) {
  const query = searchInput.value.trim();

  // Limpa resultados se a consulta estiver vazia
  if (!query) {
    lastResults = [];
    autocompleteList.innerHTML = "";
    return;
  }

  try {
    // Adiciona tratamento de erro mais específico
    const results = await provider.search({ query }).catch((error) => {
      console.error("Erro na busca de localização:", error);
      return [];
    });

    // Verifica se há resultados
    if (results.length === 0) {
      autocompleteList.innerHTML = "";
      return;
    }

    lastResults = results;

    // Limpa lista anterior
    autocompleteList.innerHTML = "";

    // Adiciona resultados com segurança
    results.forEach((result) => {
      if (result && result.label) {
        const option = document.createElement("option");
        option.value = result.label;
        option.textContent = result.label;
        autocompleteList.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Erro inesperado:", error);
    // Opcional: mostrar mensagem de erro ao usuário
    showErrorMessage("Não foi possível realizar a busca");
  }
}

// Função para mostrar mensagem de erro
function showErrorMessage(message) {
  const errorElement = document.createElement("div");
  errorElement.textContent = message;
  errorElement.classList.add("error-message");
  searchInput.parentNode.insertBefore(errorElement, searchInput.nextSibling);

  // Remove a mensagem após alguns segundos
  setTimeout(() => {
    errorElement.remove();
  }, 3000);
}

const debouncedHandleInput = debounce(handleInput, 300);

// Adiciona verificações de segurança
searchInput?.addEventListener("input", debouncedHandleInput);

pesquisarLocalizacao?.addEventListener("click", async () => {
  const query = searchInput.value.trim();

  // Expressão regular mais precisa para coordenadas
  const coordinateRegex = /^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/;
  const isCoordinate = query.match(coordinateRegex);

  try {
    if (isCoordinate) {
      const [_, lat, , lon] = isCoordinate;

      // Validação adicional de coordenadas
      if (isValidCoordinate(lat, lon)) {
        map.flyTo([parseFloat(lat), parseFloat(lon)], 19);
        L.popup()
          .setLatLng([parseFloat(lat), parseFloat(lon)])
          .setContent(query)
          .openOn(map);
        return;
      }
    }

    // Busca resultado por label
    const selectedResult = lastResults.find((result) => result.label === query);

    if (selectedResult) {
      const { x: lon, y: lat } = selectedResult;

      // Validação adicional
      if (isValidCoordinate(lat, lon)) {
        map.flyTo([lat, lon], 19);
        L.popup()
          .setLatLng([lat, lon])
          .setContent(selectedResult.label)
          .openOn(map);
      }
    } else {
      showErrorMessage("Localização não encontrada");
    }
  } catch (error) {
    console.error("Erro ao processar localização:", error);
    showErrorMessage("Erro ao processar localização");
  }
});

// Função para validar coordenadas
function isValidCoordinate(lat, lon) {
  const latNum = parseFloat(lat);
  const lonNum = parseFloat(lon);

  return (
    !isNaN(latNum) &&
    !isNaN(lonNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lonNum >= -180 &&
    lonNum <= 180
  );
}
