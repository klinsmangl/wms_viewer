const provider = new GeoSearch.OpenStreetMapProvider({
  params: { countrycodes: 'br' }
});
const searchInput = document.getElementById('search-input');
const autocompleteList = document.getElementById('autocomplete-list');

let lastResults = [];

function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

const handleInput = async (event) => {
  const query = event.target.value.trim();
  
  if (!query) {
    lastResults = [];
    autocompleteList.innerHTML = '';
    return;
  }
  
  try {
    const results = await provider.search({ query });
    lastResults = results;
    
    autocompleteList.innerHTML = '';
    results.forEach(result => {
      const option = document.createElement('option');
      option.value = result.label;
      autocompleteList.appendChild(option);
    });
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
  }
};

const debouncedHandleInput = debounce(handleInput, 300);

searchInput.addEventListener('input', debouncedHandleInput);

searchInput.addEventListener('change', () => {
  const selectedResult = lastResults.find(result => result.label === searchInput.value);
  if (selectedResult) {
    const { x: lon, y: lat } = selectedResult;
    map.flyTo([lat, lon], 19);
    L.popup()
      .setLatLng([lat, lon])
      .setContent(selectedResult.label)
      .openOn(map);
  }
});

