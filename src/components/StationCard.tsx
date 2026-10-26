import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SystemBadge from './SystemBadge';
import { Station } from '../types';

interface StationCardProps {
  station: Station;
  onPress: () => void;
}

export default function StationCard({ station, onPress }: StationCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-slate-800 border border-slate-700/80 rounded-2xl p-4 mb-3 active:bg-slate-750 shadow-md"
    >
      <View className="flex-row justify-between items-start">
        <SystemBadge system={station.system} />
        {station.distance_m !== undefined && (
          <View className="flex-row items-center space-x-1">
            <Ionicons name="location-outline" size={14} color="#38bdf8" />
            <Text className="text-xs font-bold text-sky-400">
              {station.distance_m < 1000 
                ? `${Math.round(station.distance_m)} m` 
                : `${(station.distance_m / 1000).toFixed(1)} km`}
            </Text>
          </View>
        )}
      </View>

      <Text className="text-white font-bold text-base mt-2">{station.name}</Text>
      
      <View className="flex-row items-center mt-1">
        <Ionicons name="map-outline" size={12} color="#94a3b8" />
        <Text className="text-slate-400 text-xs ml-1">
          Avenida / Ref: {station.avenida || 'No especificada'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}