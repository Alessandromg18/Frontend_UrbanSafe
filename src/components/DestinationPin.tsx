import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DestinationPinProps {
  resolvedName: string;
}

export default function DestinationPin({ resolvedName }: DestinationPinProps) {
  return (
    <View className="absolute top-24 left-4 right-4 z-35 flex-row items-center bg-red-600 rounded-2xl shadow-xl px-4 py-3">
      <View className="bg-white/20 p-2 rounded-xl mr-3">
        <Ionicons name="location" size={20} color="#ffffff" />
      </View>
      <View className="flex-1">
        <Text className="text-red-100 text-[10px] font-bold uppercase tracking-wider">Destino Fijado</Text>
        <Text className="text-white font-bold text-sm" numberOfLines={1}>
          {resolvedName}
        </Text>
      </View>
    </View>
  );
}