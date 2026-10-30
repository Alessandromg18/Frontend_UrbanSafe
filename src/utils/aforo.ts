import { ClaseAforo, Recomendacion, PredictionItem } from '../types';

// Textos y colores únicos para mostrar el aforo v2 (ocupación real estimada con matriz O-D)

export const etiquetaClase = (clase?: ClaseAforo | string | null): string => {
  switch (clase) {
    case 'Asientos':
      return 'Con asientos';
    case 'De_pie':
      return 'De pie';
    case 'Saturado':
      return 'Saturado';
    case 'Sin_servicio':
      return 'Fuera de horario';
    default:
      return 'Sin dato';
  }
};

export const etiquetaRecomendacion = (rec?: Recomendacion | string | null): string => {
  switch (rec) {
    case 'abordar':
      return 'Abordar';
    case 'esperar_siguiente':
      return 'Esperar el siguiente';
    case 'cambiar_paradero':
      return 'Cambiar de paradero';
    case 'sin_servicio':
      return 'Sin servicio';
    default:
      return '—';
  }
};

// Colores (fondo, texto) por recomendación
export const colorRecomendacion = (rec?: Recomendacion | string | null): { bg: string; fg: string } => {
  switch (rec) {
    case 'abordar':
      return { bg: '#dcfce7', fg: '#15803d' };
    case 'esperar_siguiente':
      return { bg: '#fef3c7', fg: '#b45309' };
    case 'cambiar_paradero':
      return { bg: '#fee2e2', fg: '#b91c1c' };
    default:
      return { bg: '#e2e8f0', fg: '#475569' };
  }
};

// "% de ocupación": pasajeros a bordo / capacidad nominal del vehículo. Puede superar 100 %
// cuando la demanda excede la oferta (hay pasajeros que no logran subir).
export const textoOcupacion = (crowding?: number | null): string => {
  if (crowding === null || crowding === undefined) return '—';
  return `${Math.round(crowding * 100)}%`;
};

export const anchoBarra = (crowding?: number | null): number =>
  Math.min(Math.max((crowding ?? 0) * 100, 4), 100);

export const colorOcupacion = (clase?: ClaseAforo | string | null): string => {
  switch (clase) {
    case 'Saturado':
      return '#ef4444';
    case 'De_pie':
      return '#f59e0b';
    case 'Asientos':
      return '#10b981';
    default:
      return '#94a3b8';
  }
};

export const textoEspera = (p?: PredictionItem | null): string => {
  if (!p || p.class === 'Sin_servicio' || p.eta_min === null || p.eta_min === undefined) return 'Sin servicio';
  return `${p.eta_min} min`;
};

// Hora local de Lima (UTC-5 fijo; Perú no tiene horario de verano)
export const formatoHora = (fechaHora?: string): string => {
  if (!fechaHora) return '';
  const hhmm = fechaHora.includes(' ') ? fechaHora.split(' ')[1] : fechaHora.slice(11, 16);
  return hhmm.slice(0, 5);
};
