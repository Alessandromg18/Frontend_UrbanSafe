export interface System {
  id: string;
  name: string;
  description: string;
  total_stations: number;
}

export interface Station {
  id: string;
  name: string;
  system: 'metropolitano' | 'corredores' | 'metro_l1' | 'alimentadores';
  avenida: string;
  latitude: number;
  longitude: number;
  distance_m?: number;
  raw_properties?: any;
}

export interface PredictionItem {
  datetime: string;
  value: number;
  crowding: number;
  class: string;
  eta_min: number;
  eta2_min: number;
  recommendation: 'abordar' | 'esperar_siguiente';
}

export interface ForecastResponse {
  system: string;
  series: string;
  model: string;
  predictions: PredictionItem[];
}

// Para la sugerencia de ubicaciones en tiempo real
export interface AutocompleteSuggestion {
  display_name: string;
  lat: number;
  lon: number;
}

// Estructura de cada ruta encontrada por match-trip
export interface MatchedRoute {
  type: 'DIRECTO_POR_RUTA' | 'DIRECTO_POR_SISTEMA';
  route_code: string;
  system: string;
  boarding_station: string;
  boarding_id: string;
  origin_walk_m: number;
  leaving_station: string;
  leaving_id: string;
  dest_walk_m: number;
}

// Respuesta completa del planificador
export interface TripMatchResponse {
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number; resolved_name: string };
  radius_meters: number;
  diagnostic?: {
    origin_stations_found: number;
    destination_stations_found: number;
    warning?: string;
  };
  found_routes: MatchedRoute[];
}