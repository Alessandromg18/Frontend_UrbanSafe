import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripMatchResponse, MatchedRoute } from '../types';
import {
  etiquetaClase, etiquetaRecomendacion, colorRecomendacion, textoOcupacion, textoEspera, formatoHora,
} from '../utils/aforo';

interface TripSummaryCardProps {
  tripData: TripMatchResponse;
  selectedRoute: MatchedRoute;
  forecastData: any; // { current, predictions, referencia } o { sinDatos: true }
  loadingForecast: boolean;
  onClose: () => void;
}

const nombreServicio = (route: MatchedRoute): string => {
  switch (route.system) {
    case 'metropolitano':
      return 'Metropolitano';
    case 'metro_l1':
      return 'Metro Línea 1';
    case 'alimentadores':
      return `Alimentador ${route.route_code}`;
    default:
      return `Corredor ${route.route_code}`;
  }
};

export default function TripSummaryCard({
  tripData,
  selectedRoute,
  forecastData,
  loadingForecast,
  onClose
}: TripSummaryCardProps) {
  const totalWalk = Math.round(selectedRoute.origin_walk_m + selectedRoute.dest_walk_m);

  const currentPrediction = forecastData?.current;
  const predictionsList = forecastData?.predictions || forecastData?.forecast || [];

  return (
    <View className="absolute bottom-32 left-4 right-4 bg-white rounded-3xl shadow-2xl p-5 z-40 border border-gray-100">
      {/* Cabecera del Viaje y Destino */}
      <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
        <View className="flex-1 mr-2">
          <Text className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider">Mejor Ruta Directa</Text>
          <Text className="text-gray-900 font-bold text-base mt-0.5" numberOfLines={1}>
            {tripData.destination.resolved_name}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
          <Ionicons name="close" size={18} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {/* Resumen de Tiempos y Pasos (Caminata + Transporte) */}
      <View className="flex-row items-center justify-between bg-blue-50/60 rounded-2xl p-3.5 my-3 border border-blue-100">
        <View className="flex-row items-center flex-1">
          <View className="w-10 h-10 rounded-xl bg-blue-600 items-center justify-center mr-3 shadow-sm">
            <Ionicons
              name={selectedRoute.system === 'metropolitano' || selectedRoute.system === 'metro_l1' ? 'subway' : 'bus'}
              size={20}
              color="#ffffff"
            />
          </View>
          <View className="flex-1">
            <Text className="text-gray-800 font-bold text-sm">{nombreServicio(selectedRoute)}</Text>
            <Text className="text-gray-500 text-xs mt-0.5">
              Aborda en <Text className="font-bold text-gray-700">{selectedRoute.boarding_station}</Text>
            </Text>
          </View>
        </View>

        <View className="items-end pl-2">
          <Text className="text-xs text-gray-400 font-semibold">Caminata Total</Text>
          <Text className="text-blue-600 font-extrabold text-base">{totalWalk} m</Text>
        </View>
      </View>

      {/* Detalles de bajada */}
      <View className="flex-row items-center justify-between px-1 mb-3">
        <Text className="text-gray-500 text-xs">
          Bájate en: <Text className="font-bold text-gray-800">{selectedRoute.leaving_station}</Text>
        </Text>
        <Text className="text-gray-400 text-xs">Destino a {Math.round(selectedRoute.dest_walk_m)}m</Text>
      </View>

      {/* Ocupación estimada en el paradero de subida (en el sentido del viaje) */}
      <View className="pt-3 border-t border-gray-100">
        <Text className="text-xs font-bold text-gray-700 mb-2">Aforo en {selectedRoute.boarding_station}:</Text>

        {loadingForecast ? (
          <ActivityIndicator size="small" color="#2563eb" style={{ paddingVertical: 12 }} />
        ) : forecastData?.sinDatos ? (
          <Text className="text-gray-400 text-xs text-center py-2">
            Sin predicción: este paradero no tiene datos de validaciones ATU propios.
          </Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
            {/* 1. ESTADO ACTUAL */}
            {currentPrediction && (
              <View className="bg-blue-50/80 border border-blue-300 rounded-2xl p-3 mb-3">
                <View className="flex-row justify-between items-center mb-1.5">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                    <Text className="text-[10px] font-extrabold text-blue-800 uppercase">
                      Ahora ({formatoHora(currentPrediction.datetime)})
                    </Text>
                  </View>
                  <View
                    className="px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: colorRecomendacion(currentPrediction.recommendation).bg }}
                  >
                    <Text
                      className="text-[8px] font-bold"
                      style={{ color: colorRecomendacion(currentPrediction.recommendation).fg }}
                    >
                      {etiquetaRecomendacion(currentPrediction.recommendation).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-gray-900">{etiquetaClase(currentPrediction.class)}</Text>
                    {currentPrediction.sentido ? (
                      <Text className="text-[10px] text-gray-500">{currentPrediction.sentido}</Text>
                    ) : null}
                    <Text className="text-[11px] text-gray-600 mt-0.5">
                      Espera estimada: <Text className="text-blue-600 font-bold">{textoEspera(currentPrediction)}</Text>
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[9px] text-gray-400">Ocupación</Text>
                    <Text className="text-xs font-black text-gray-800">{textoOcupacion(currentPrediction.crowding)}</Text>
                    {currentPrediction.pasajeros_por_tren != null ? (
                      <Text className="text-[9px] text-gray-400">≈ {currentPrediction.pasajeros_por_tren} a bordo</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            )}

            {/* 2. PRONÓSTICO DEL DÍA */}
            {predictionsList.length > 0 ? (
              <View>
                <Text className="text-[11px] font-bold text-gray-400 mb-1.5">Pronóstico del día:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {predictionsList.map((item: any, index: number) => (
                    <View key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mr-2.5 w-24 items-center">
                      <Text className="text-[10px] font-bold text-gray-400">{formatoHora(item.datetime)}</Text>
                      <Text className="text-xs font-bold text-gray-800 mt-1" numberOfLines={1}>{etiquetaClase(item.class)}</Text>
                      <Text className="text-xs font-extrabold text-blue-600 mt-0.5">{textoOcupacion(item.crowding)}</Text>
                      <View
                        className="mt-1.5 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colorRecomendacion(item.recommendation).bg }}
                      >
                        <Text className="text-[8px] font-bold" style={{ color: colorRecomendacion(item.recommendation).fg }}>
                          {etiquetaRecomendacion(item.recommendation).toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : !currentPrediction ? (
              <Text className="text-gray-400 text-xs text-center py-2">No hay predicciones para este paradero.</Text>
            ) : null}

            {forecastData?.referencia ? (
              <Text className="text-[9px] text-gray-400 mt-2">
                Estimado con datos ATU del {forecastData.referencia.fecha_referencia_datos} (día equivalente)
              </Text>
            ) : null}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
