import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripMatchResponse, MatchedRoute, ForecastResponse } from '../types';

interface TripSummaryCardProps {
  tripData: TripMatchResponse;
  selectedRoute: MatchedRoute;
  forecastData: any; // Puede contener .current y .predictions (o .forecast)
  loadingForecast: boolean;
  onClose: () => void;
}

export default function TripSummaryCard({
  tripData,
  selectedRoute,
  forecastData,
  loadingForecast,
  onClose
}: TripSummaryCardProps) {
  const totalWalk = Math.round(selectedRoute.origin_walk_m + selectedRoute.dest_walk_m);

  // Función segura para formatear la fecha evitando el error de las 12 p.m. por espacio en blanco
  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const safeStr = dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString;
    const date = new Date(safeStr);
    return isNaN(date.getTime()) 
      ? dateString 
      : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Extraer correctamente las listas sin importar si vienen como predictions o forecast
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
              name={selectedRoute.system === 'metropolitano' ? 'subway' : 'bus'} 
              size={20} 
              color="#ffffff" 
            />
          </View>
          <View className="flex-1">
            <Text className="text-gray-800 font-bold text-sm">
              {selectedRoute.system === 'metropolitano' ? 'Metropolitano' : `Corredor ${selectedRoute.route_code}`}
            </Text>
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

      {/* Sección de Predicciones del Paradero (Actual + Forecast) */}
      <View className="pt-3 border-t border-gray-100">
        <Text className="text-xs font-bold text-gray-700 mb-2">Predicciones en {selectedRoute.boarding_station}:</Text>
        
        {loadingForecast ? (
          <ActivityIndicator size="small" color="#2563eb" style={{ paddingVertical: 12 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220 }}>
            {/* 1. TARJETA DESTACADA: ESTADO ACTUAL EN TIEMPO REAL */}
            {currentPrediction && (
              <View className="bg-blue-50/80 border border-blue-300 rounded-2xl p-3 mb-3">
                <View className="flex-row justify-between items-center mb-1.5">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                    <Text className="text-[10px] font-extrabold text-blue-800 uppercase">
                      Momento Actual ({formatTime(currentPrediction.datetime)})
                    </Text>
                  </View>
                  <View className={`px-2 py-0.5 rounded-full ${currentPrediction.recommendation === 'abordar' ? 'bg-green-100' : 'bg-amber-100'}`}>
                    <Text className={`text-[8px] font-bold ${currentPrediction.recommendation === 'abordar' ? 'text-green-700' : 'text-amber-700'}`}>
                      {currentPrediction.recommendation.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-xs font-bold text-gray-900">{currentPrediction.class}</Text>
                    <Text className="text-[11px] text-gray-600 mt-0.5">
                      Próximo bus: <Text className="text-blue-600 font-bold">{currentPrediction.eta_min} min</Text>
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[9px] text-gray-400">Aforo aprox.</Text>
                    <Text className="text-xs font-black text-gray-800">
                      {Math.round((currentPrediction.crowding || 0) * 100)}%
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* 2. CARRUSEL DE PRONÓSTICOS FUTUROS */}
            {predictionsList.length > 0 ? (
              <View>
                <Text className="text-[11px] font-bold text-gray-400 mb-1.5">Predicciones del día:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {predictionsList.map((item: any, index: number) => (
                    <View key={index} className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mr-2.5 w-24 items-center">
                      <Text className="text-[10px] font-bold text-gray-400">
                        {formatTime(item.datetime)}
                      </Text>
                      <Text className="text-xs font-bold text-gray-800 mt-1" numberOfLines={1}>{item.class}</Text>
                      <Text className="text-xs font-extrabold text-blue-600 mt-0.5">ETA: {item.eta_min}m</Text>
                      <View className={`mt-1.5 px-2 py-0.5 rounded-full ${item.recommendation === 'abordar' ? 'bg-green-100' : 'bg-amber-100'}`}>
                        <Text className={`text-[8px] font-bold ${item.recommendation === 'abordar' ? 'text-green-700' : 'text-amber-700'}`}>
                          {item.recommendation.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : !currentPrediction ? (
              <Text className="text-gray-400 text-xs text-center py-2">No hay predicciones en tiempo real para este paradero.</Text>
            ) : null}
          </ScrollView>
        )}
      </View>
    </View>
  );
}