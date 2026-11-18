const geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
const forecastUrl = 'https://api.open-meteo.com/v1/forecast';
const refreshInterval = 15 * 60 * 1000;
const requestTimeout = 10000;
const geocodingCache = new Map();

const conditions = {
  0: ['Céu limpo', 'sun'],
  1: ['Maioritariamente limpo', 'sun'],
  2: ['Parcialmente nublado', 'cloud'],
  3: ['Encoberto', 'cloud'],
  45: ['Nevoeiro', 'cloud'],
  48: ['Nevoeiro com geada', 'cloud'],
  51: ['Chuvisco ligeiro', 'rain'],
  53: ['Chuvisco moderado', 'rain'],
  55: ['Chuvisco intenso', 'rain'],
  56: ['Chuvisco gelado ligeiro', 'rain'],
  57: ['Chuvisco gelado intenso', 'rain'],
  61: ['Chuva ligeira', 'rain'],
  63: ['Chuva moderada', 'rain'],
  65: ['Chuva intensa', 'rain'],
  66: ['Chuva gelada ligeira', 'rain'],
  67: ['Chuva gelada intensa', 'rain'],
  71: ['Queda de neve ligeira', 'snow'],
  73: ['Queda de neve moderada', 'snow'],
  75: ['Queda de neve intensa', 'snow'],
  77: ['Grãos de neve', 'snow'],
  80: ['Aguaceiros ligeiros', 'rain'],
  81: ['Aguaceiros moderados', 'rain'],
  82: ['Aguaceiros intensos', 'rain'],
  85: ['Aguaceiros de neve ligeiros', 'snow'],
  86: ['Aguaceiros de neve intensos', 'snow'],
  95: ['Trovoada', 'storm'],
  96: ['Trovoada com granizo ligeiro', 'storm'],
  99: ['Trovoada com granizo intenso', 'storm']
};

async function fetchJSON(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`O serviço meteorológico respondeu com o erro ${response.status}.`);
  return response.json();
}

async function geocode(place, signal) {
  const locality = place.split(/[·,]/)[0].trim();
  if (!locality) throw new Error('Indica a localidade da exploração para consultar a meteorologia.');
  const cacheKey = locality.toLocaleLowerCase('pt-PT');
  if (geocodingCache.has(cacheKey)) return geocodingCache.get(cacheKey);

  const url = new URL(geocodingUrl);
  url.search = new URLSearchParams({
    name: locality,
    count: '1',
    language: 'pt',
    countryCode: 'PT'
  });
  const data = await fetchJSON(url, signal);
  const result = data.results?.[0];
  if (!result || !Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    throw new Error(`Não foi possível localizar "${locality}". Verifica a localidade da exploração.`);
  }

  const location = { latitude: result.latitude, longitude: result.longitude };
  geocodingCache.set(cacheKey, location);
  return location;
}

function isWeatherResponse(data) {
  return data?.current
    && typeof data.current.time === 'string'
    && Number.isFinite(data.current.temperature_2m)
    && Number.isFinite(data.current.weather_code)
    && Array.isArray(data.hourly?.time)
    && Array.isArray(data.hourly?.precipitation_probability);
}

export async function getCurrentWeather(place, signal) {
  const location = await geocode(place, signal);
  const url = new URL(forecastUrl);
  url.search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: 'temperature_2m,weather_code',
    hourly: 'precipitation_probability',
    forecast_days: '1',
    timezone: 'auto'
  });
  const data = await fetchJSON(url, signal);
  if (!isWeatherResponse(data)) throw new Error('O serviço meteorológico devolveu dados incompletos.');

  let hourIndex = -1;
  for (let index = 0; index < data.hourly.time.length; index += 1) {
    if (data.hourly.time[index] > data.current.time) break;
    hourIndex = index;
  }
  const probability = data.hourly.precipitation_probability[hourIndex];
  const [description, icon] = conditions[data.current.weather_code] || ['Condição meteorológica desconhecida', 'cloud'];
  return {
    temperature: Math.round(data.current.temperature_2m),
    description,
    icon,
    precipitationProbability: Number.isFinite(probability) ? probability : null,
    validAt: data.current.time.slice(11, 16)
  };
}

export { refreshInterval, requestTimeout };
