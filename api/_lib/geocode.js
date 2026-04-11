const MOSCOW_COORDS = {
  lat: 55.7558,
  lon: 37.6173,
};

const GEOCODE_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const GEOCODE_TIMEOUT_MS = 7000;
const geocodeCache = new Map();

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistanceKm = (from, to) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLon = toRadians(to.lon - from.lon);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const normalizeAddressQuery = (value = "") => {
  const raw = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!raw) return "";
  if (/россия|russia/i.test(raw)) return raw;
  return `${raw}, Россия`;
};

const fetchGeocodeJson = async (url) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "accept-language": "ru",
        "user-agent": "GlobalBasket/1.0 (hello@globalbasket.ru)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Geocoder returned ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
};

const resolveDistanceFromMoscow = async (address) => {
  const query = normalizeAddressQuery(address);
  if (!query || query.length < 3) {
    return null;
  }

  const cacheKey = query.toLowerCase();
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const request = (async () => {
    const url = new URL(GEOCODE_ENDPOINT);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("q", query);

    const results = await fetchGeocodeJson(url);
    const item = Array.isArray(results) ? results[0] : null;

    if (!item) {
      throw new Error("Адрес не удалось распознать.");
    }

    const lat = Number.parseFloat(item.lat);
    const lon = Number.parseFloat(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error("Геокодер вернул некорректные координаты.");
    }

    return {
      distanceKm: Math.max(0, Math.round(haversineDistanceKm(MOSCOW_COORDS, { lat, lon }))),
      latitude: lat,
      longitude: lon,
      displayName: String(item.display_name || query).trim(),
    };
  })();

  geocodeCache.set(cacheKey, request);

  try {
    return await request;
  } catch (error) {
    geocodeCache.delete(cacheKey);
    throw error;
  }
};

module.exports = {
  MOSCOW_COORDS,
  haversineDistanceKm,
  normalizeAddressQuery,
  resolveDistanceFromMoscow,
};
