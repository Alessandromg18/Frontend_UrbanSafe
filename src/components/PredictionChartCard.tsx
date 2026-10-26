import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PredictionItem } from '../types';

interface PredictionChartCardProps {
  prediction: PredictionItem;
}

export default function PredictionChartCard({ prediction }: PredictionChartCardProps) {
  const isAbordar = prediction.recommendation === 'abordar';

  // Barra de progreso simulada para el aforo según el valor o clase
  const getCrowdingColor = (crowdingVal: number) => {
    if (crowdingVal > 0.7) return 'bg-red-500';
    if (crowdingVal > 0.4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const timeFormatted = new Date(prediction.datetime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 mr-3 w-44 shadow-lg justify-between">
      <View>
        {/* Hora y Estado */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-bold text-slate-300">{timeFormatted}</Text>
          <Ionicons 
            name={isAbordar ? "checkmark-circle" : "alert-circle"} 
            size={16} 
            color={isAbordar ? "#34d399" : "#fbbf24"} 
          />
        </View>

        <Text className="text-white font-extrabold text-sm mb-1">{prediction.class}</Text>
        <Text className="text-slate-400 text-[11px]">ETA bus: <Text className="text-sky-400 font-bold">{prediction.eta_min} min</Text></Text>
      </View>

      {/* Diagrama de Aforo visual */}
      <View className="mt-4 pt-3 border-t border-slate-700">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-[10px] text-slate-400">Aforo estimado</Text>
          <Text className="text-[10px] font-bold text-slate-300">{Math.round((prediction.crowding || 0) * 100)}%</Text>
        </View>
        <View className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <View 
            className={`h-full rounded-full ${getCrowdingColor(prediction.crowding || 0)}`} 
            style={{ width: `${Math.min(Math.max((prediction.crowding || 0) * 100, 10), 100)}%` }}
          />
        </View>

        {/* Badge de recomendación */}
        <View className={`mt-3 py-1 px-2 rounded-lg items-center ${isAbordar ? 'bg-emerald-950/60 border border-emerald-500/40' : 'bg-amber-950/60 border border-amber-500/40'}`}>
          <Text className={`text-[10px] font-extrabold uppercase ${isAbordar ? 'text-emerald-400' : 'text-amber-400'}`}>
            {prediction.recommendation.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </View>
  );
}