import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getForecast } from '../api/services';
import { Station, ForecastResponse } from '../types';
import SystemBadge from '../components/SystemBadge';
import PredictionChartCard from '../components/PredictionChartCard';

export default function DetailScreen({ route, navigation }: any) {
  const { station }: { station: Station } = route.params || {};
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (station) {
      const today = new Date().toISOString().split('T')[0];
      // ✅ CORRECTO: Pasar station.name para que el mapeador reconozca el texto
      getForecast(station.system, station.name, today)
        .then((data) => setForecast(data))
        .catch((err) => console.error('Error al cargar predicción:', err))
        .finally(() => setLoading(false));
    }
  }, [station]);

  if (!station) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center p-4">
        <Ionicons name="alert-circle-outline" size={48} color="#64748b" />
        <Text className="text-white text-base font-bold mt-2">Estación no encontrada</Text>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="mt-4 bg-blue-600 px-4 py-2 rounded-xl"
        >
          <Text className="text-white text-xs font-bold">Regresar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-900 pt-12 px-4" showsVerticalScrollIndicator={false}>
      {/* Botón de retroceso superior */}
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        className="bg-slate-800/80 p-2 rounded-full self-start mb-4 border border-slate-700/80 flex-row items-center px-3.5 shadow-md"
      >
        <Ionicons name="arrow-back" size={16} color="#ffffff" />
        <Text className="text-white text-xs font-bold ml-1.5">Volver</Text>
      </TouchableOpacity>

      {/* Tarjeta de Cabecera del Paradero */}
      <View className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 mb-5 shadow-lg">
        <View className="flex-row justify-between items-start mb-2">
          <SystemBadge system={station.system} />
          <Text className="text-[10px] text-slate-400 font-mono">ID: {station.id}</Text>
        </View>

        <Text className="text-white text-2xl font-extrabold mt-1">{station.name}</Text>
        <Text className="text-slate-400 text-xs mt-1">
          Avenida / Referencia: <Text className="text-slate-200 font-medium">{station.avenida || 'No especificada'}</Text>
        </Text>
        
        {/* Coordenadas GPS con estilo limpio */}
        <View className="mt-4 pt-3 border-t border-slate-700/80 flex-row justify-between items-center">
          <View className="flex-row items-center space-x-1">
            <Ionicons name="location" size={14} color="#38bdf8" />
            <Text className="text-slate-400 text-xs">Ubicación GPS</Text>
          </View>
          <Text className="text-sky-400 text-xs font-mono font-bold">
            {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
          </Text>
        </View>
      </View>

      {/* Sección de Pronóstico de Aforo (LightGBM) */}
      <View className="mb-2">
        <Text className="text-white text-lg font-bold">Pronóstico Inteligente de Aforo</Text>
        <Text className="text-slate-400 text-xs mt-0.5">Predicciones basadas en flujo histórico y modelo LightGBM</Text>
      </View>

      {loading ? (
        <View className="py-16 items-center justify-center">
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text className="text-slate-500 text-xs mt-3">Calculando predicciones de aforo...</Text>
        </View>
      ) : forecast && forecast.predictions.length > 0 ? (
        <View className="mb-10 mt-3">
          {/* Carrusel horizontal de tarjetas de predicción detalladas */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            {forecast.predictions.map((pred, idx) => (
              <PredictionChartCard key={idx} prediction={pred} />
            ))}
          </ScrollView>

          {/* Nota informativa de recomendación */}
          <View className="bg-blue-950/40 border border-blue-500/30 rounded-2xl p-4 mt-4 flex-row items-start space-x-3">
            <Ionicons name="information-circle" size={20} color="#38bdf8" style={{ marginTop: 2 }} />
            <View className="flex-1">
              <Text className="text-blue-300 text-xs font-bold">Consejo UrbanSafe</Text>
              <Text className="text-slate-300 text-xs mt-0.5 leading-relaxed">
                Las recomendaciones de <Text className="text-emerald-400 font-bold">ABORDAR</Text> o <Text className="text-amber-400 font-bold">ESPERAR</Text> se calculan en tiempo real para optimizar tu tiempo de espera en la estación.
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="bg-slate-800 p-8 rounded-2xl border border-slate-700/80 items-center my-4">
          <Ionicons name="calendar-outline" size={32} color="#64748b" />
          <Text className="text-white font-bold text-sm mt-2">Sin pronósticos activos</Text>
          <Text className="text-slate-400 text-xs text-center mt-1">
            No hay datos de predicción disponibles actualmente para este paradero en el día de hoy.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}