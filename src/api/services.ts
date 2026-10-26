import { api } from './client';
import { System, Station, ForecastResponse } from '../types';
import { AutocompleteSuggestion, TripMatchResponse } from '../types';

// 1. Mapeador para llamadas a endpoints de Backend (p. ej. GET /api/stations?system=...)
export const mapSystemToBackendApi = (system: string): string => {
  const cleanSystem = system ? system.toLowerCase().trim() : '';

  switch (cleanSystem) {
    case 'alimentador':
    case 'alimentadores':
      return 'alimentadores';
    case 'corredor':
    case 'corredores':
      return 'corredores';
    case 'metro_l1':
    case 'metrol_l1':
    case 'metro_linea1':
      return 'metro_l1';
    case 'troncal':
    case 'metropolitano':
      return 'metropolitano';
    default:
      return cleanSystem;
  }
};

// 2. Mapeador para las series del Modelo de ML / Predicción (singular / troncal)
export const mapSystemToBackendModel = (system: string): string => {
  const cleanSystem = system ? system.toLowerCase().trim() : '';

  switch (cleanSystem) {
    case 'alimentadores':
    case 'alimentador':
      return 'alimentador';
    case 'corredores':
    case 'corredor':
      return 'corredor';
    case 'metro_l1':
    case 'metrol_l1':
    case 'metro_linea1':
      return 'metro_l1';
    case 'metropolitano':
    case 'troncal':
      return 'troncal';
    default:
      return cleanSystem;
  }
};

// 3. Mapeador de paraderos de la BD a las series reales del modelo de predicción
export const mapStationToModelSeries = (system: string, stationName: string, avenueOrRoute: string = ''): string => {
  const mappedSys = mapSystemToBackendModel(system);
  const name = stationName ? stationName.toLowerCase() : '';
  const route = avenueOrRoute ? avenueOrRoute.toLowerCase() : '';

  // 1. Mapeo para Alimentadores
  if (mappedSys === 'alimentador') {
    if (name.includes('tortugas') || name.includes('espanola') || name.includes('lorenzo')) return 'Naranjal';
    if (name.includes('camelias') || name.includes('plaza vea')) return 'Universitaria'; 
    if (name.includes('machupicchu')) return 'Carabayllo';
    
    const validAlimentador = [
      "Alisos", "Antúnez de Mayolo", "Belaunde", "Bertello", "Carabayllo",
      "Cedros de Villa", "Collique", "Ensenada", "Izaguirre", "Las Américas",
      "Los Olivos", "Los Próceres", "Milagro de Jesús", "Naranjal", "Payet",
      "Puente Piedra", "Puno", "San Juan de Dios", "Tahuantinsuyo",
      "Torre Blanca", "Trapiche", "Universitaria", "Villa El Salvador"
    ];
    const found = validAlimentador.find(s => name.includes(s.toLowerCase()) || route.includes(s.toLowerCase()));
    if (found) return found;
    return 'Naranjal';
  }

  // 2. Mapeo para Corredores (Lee la ruta de la avenida/código o del nombre)
  if (mappedSys === 'corredor') {
    const validCorredor = ["201", "204", "206", "209", "301", "305", "370", "371", "404", "405", "406", "412"];
    
    // Busca primero en la ruta/avenida (ej. "401")
    const foundRoute = validCorredor.find(s => route === s.toLowerCase() || route.includes(s.toLowerCase()));
    if (foundRoute) return foundRoute;

    // Si no está ahí, busca en el nombre
    const foundName = validCorredor.find(s => name.includes(s.toLowerCase()));
    if (foundName) return foundName;
    
    if (name.includes('chipoco') || name.includes('acacias') || name.includes('paz') || name.includes('balboa') || name.includes('butters') || name.includes('pavos')) {
      return '301';
    }
    
    return '301'; // Fallback por defecto
  }

  // 3. Mapeo para Metro Línea 1
  if (mappedSys === 'metro_l1') {
    const validMetro = [
      "Angamos", "Atocongo", "Ayacucho", "Bayóvar", "Cabitos", "Caja de Agua", 
      "El Ángel", "Gamarra", "Jorge Chavez", "La Cultura", "Los Jardines", 
      "Los Postes", "Maria Auxiliadora", "Miguel Grau", "Nicolas Arriola", 
      "Parque Industrial", "Piramides del Sol", "Presbitero Maestro", "Pumacahua", 
      "San Borja Sur", "San Carlos", "San Juan", "San Martin", "Santa Rosa", 
      "Villa El Salvador", "Villa Maria"
    ];
    const found = validMetro.find(s => name.includes(s.toLowerCase()));
    if (found) return found;
    return 'Angamos';
  }

  // 4. Mapeo para Troncal (Metropolitano)
  if (mappedSys === 'troncal') {
    const validTroncal = [
      "2 de Mayo", "22 De Agosto", "28 de Julio", "Andres Belaunde", "Andrés Reyes", 
      "Angamos", "Aramburu", "Balta", "Benavides", "Bulevar", "Canadá", 
      "Canaval y Moreyra", "Caqueta", "Chimpu Ocllo", "Colmena", "Domingo Orué", 
      "El Milagro", "Escuela Militar", "España", "Estacion Central", "Estadio Nacional", 
      "Honorio Delgado", "Independencia", "Izaguirre", "Javier Prado", "Jiron de la Unión", 
      "Los Incas", "Los jazmines", "Matellini", "México", "Naranjal", "Naranjal Alimentador", 
      "Pacifico", "Parque del Trabajo", "Plaza de Flores", "Quilca", "Ramon Castilla", 
      "Ricardo Palma", "Rosario de Villa", "Tacna", "Terán", "Tomas Valle", "Uni", "Union", "Universidad"
    ];
    const found = validTroncal.find(s => name.includes(s.toLowerCase()));
    if (found) return found;
    return 'Estacion Central';
  }

  return stationName;
};

export const getSystems = async (): Promise<System[]> => {
  const res = await api.get('/systems');
  return res.data;
};

export const getStations = async (system?: string, q?: string): Promise<Station[]> => {
  const params: any = {};
  if (system) params.system = mapSystemToBackendApi(system); // Envía 'alimentadores', 'corredores', etc.
  if (q) params.q = q;
  const res = await api.get('/stations', { params });
  return res.data;
};

export const getNearbyStations = async (lat: number, lng: number, radius = 1500): Promise<Station[]> => {
  const res = await api.get('/stations/nearby', {
    params: { latitude: lat, longitude: lng, radius }
  });
  return res.data;
};

export const getRouteGeoJson = async (systemName: string, routeCode?: string | number) => {
  const mappedSystem = mapSystemToBackendModel(systemName);
  
  const params: any = {};
  if (routeCode) {
    // Pasamos el string limpio; Axios se encarga de codificar la barra '/' a '%2F' automáticamente
    params.code = routeCode; 
  }

  const res = await api.get(`/geo/routes/${mappedSystem}`, { params });
  return res.data;
};

export const getForecast = async (system: string, stationName: string, dia: string, avenida: string = ''): Promise<ForecastResponse> => {
  const modelSys = mapSystemToBackendModel(system); // Envía 'alimentador', 'corredor', etc.
  const finalSeries = mapStationToModelSeries(system, stationName, avenida);

  const res = await api.get(`/predictions/${modelSys}/${encodeURIComponent(finalSeries)}/forecast`, {
    params: { dia, hours: 24, modo: 'ligero' }
  });
  return res.data;
};

// Extrae el código o servicio de la ruta según el tipo de sistema del paradero
export const getRouteCodeFromStation = (station: Station): string | undefined => {
  switch (station.system) {
    case "corredores":
      return station.raw_properties?.ruta; // Ej: "306", "201" (Sí usa código específico)
    case "alimentadores":
      return station.raw_properties?.servicio; // Ej: "ChimpuOcllo/SanJuanDeDios" (Sí usa servicio)
    case "metropolitano":
      return undefined; // Retornamos undefined para que cargue toda la troncal/servicios del Metropolitano
    case "metro_l1":
      return undefined; // Retornamos undefined para que cargue toda la Línea 1 completa
    default:
      return undefined;
  }
};

export const getAutocompleteSuggestions = async (
  query: string
): Promise<AutocompleteSuggestion[]> => {
  if (!query || query.trim().length < 3) return [];
  const res = await api.get('/geo/autocomplete', {
    params: { q: query }
  });
  return res.data;
};

/**
 * Planifica el viaje entre la ubicación actual del usuario y un destino
 * (ya sea texto buscado o coordenadas seleccionadas).
 */
export const matchTrip = async (
  originLat: number,
  originLon: number,
  destination: string | { lat: number; lon: number },
  radius = 1000
): Promise<TripMatchResponse> => {
  const params: any = {
    origin_lat: originLat,
    origin_lon: originLon,
    radius
  };

  if (typeof destination === 'string') {
    params.destination = destination;
  } else {
    params.dest_lat = destination.lat;
    params.dest_lon = destination.lon;
  }

  const res = await api.get('/geo/match-trip', { params });
  return res.data;
};


export const getStationPredictionsCombined = async (system: string, stationName: string, avenueOrRoute: string = '') => {
  const modelSys = mapSystemToBackendModel(system);
  const finalSeries = mapStationToModelSeries(system, stationName, avenueOrRoute);

  const now = new Date();
  const currentHour = now.getHours();
  const today = now.toISOString().split('T')[0]; // Formato YYYY-MM-DD

  try {
    // Consultamos el estado actual y el forecast completo del día (pedimos 24 horas) en paralelo
    const [currentRes, forecastRes] = await Promise.all([
      api.get(`/predictions/${modelSys}/${encodeURIComponent(finalSeries)}`, {
        params: { dia: today, hour: currentHour, modo: 'ligero' }
      }),
      api.get(`/predictions/${modelSys}/${encodeURIComponent(finalSeries)}/forecast`, {
        params: { dia: today, hours: 24, modo: 'ligero' } // 👈 CAMBIADO A 24 HORAS
      })
    ]);

    // Estructuramos el item actual
    const p = currentRes.data;
    const currentPrediction = {
      datetime: p.datetime,
      value: p.prediction,
      crowding: p.crowding.index,
      class: p.crowding.class,
      eta_min: p.eta.next,
      eta2_min: p.eta.second,
      recommendation: p.recomendacion,
      isNow: true
    };

    // 👈 Devolvemos todo el array de predicciones del forecast sin recortarlo
    const allPredictions = forecastRes.data.predictions || [];

    return {
      current: currentPrediction,
      forecast: allPredictions
    };
  } catch (error) {
    console.error('Error al obtener predicciones combinadas:', error);
    throw error;
  }
};