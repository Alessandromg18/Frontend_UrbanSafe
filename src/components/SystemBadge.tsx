import React from 'react';
import { View, Text } from 'react-native';

interface SystemBadgeProps {
  system: string;
}

export default function SystemBadge({ system }: SystemBadgeProps) {
  const getBadgeStyle = (sys: string) => {
    switch (sys) {
      case 'metropolitano':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'corredores':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'metro_l1':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'alimentadores':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <View className={`px-2.5 py-0.5 rounded-full border self-start ${getBadgeStyle(system)}`}>
      <Text className="text-[10px] font-extrabold uppercase tracking-wider">{system}</Text>
    </View>
  );
}