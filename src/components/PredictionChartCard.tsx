import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PredictionItem } from '../types';
import {
  etiquetaClase, etiquetaRecomendacion, colorRecomendacion, textoOcupacion, textoEspera,
  anchoBarra, colorOcupacion, formatoHora,
} from '../utils/aforo';

interface PredictionChartCardProps {
  prediction: PredictionItem;
}

export default function PredictionChartCard({ prediction }: PredictionChartCardProps) {
  const isAbordar = prediction.recommendation === 'abordar';
  const rec = colorRecomendacion(prediction.recommendation);

  return (
    <View className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 mr-3 w-44 shadow-lg justify-between">
      <View>
        {/* Hora y Estado */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-bold text-slate-300">{formatoHora(prediction.datetime)}</Text>
          <Ionicons
            name={isAbordar ? "checkmark-circle" : "alert-circle"}
            size={16}
            color={isAbordar ? "#34d399" : "#fbbf24"}
          />
        </View>

        <Text className="text-white font-extrabold text-sm mb-1">{etiquetaClase(prediction.class)}</Text>
        {prediction.sentido ? (
          <Text className="text-slate-500 text-[10px]" numberOfLines={1}>{prediction.sentido}</Text>
        ) : null}
        <Text className="text-slate-400 text-[11px]">
          Espera: <Text className="text-sky-400 font-bold">{textoEspera(prediction)}</Text>
        </Text>
      </View>

      {/* Ocupación: pasajeros a bordo / capacidad del vehículo */}
      <View className="mt-4 pt-3 border-t border-slate-700">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-[10px] text-slate-400">Ocupación</Text>
          <Text className="text-[10px] font-bold text-slate-300">{textoOcupacion(prediction.crowding)}</Text>
        </View>
        <View className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{ width: `${anchoBarra(prediction.crowding)}%`, backgroundColor: colorOcupacion(prediction.class) }}
          />
        </View>

        {/* Recomendación */}
        <View className="mt-3 py-1 px-2 rounded-lg items-center" style={{ backgroundColor: rec.bg }}>
          <Text className="text-[10px] font-extrabold uppercase" style={{ color: rec.fg }}>
            {etiquetaRecomendacion(prediction.recommendation)}
          </Text>
        </View>
      </View>
    </View>
  );
}
