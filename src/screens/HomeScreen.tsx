import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSystems } from '../api/services';
import { System } from '../types';

export default function HomeScreen({ navigation }: any) {
  const [systems, setSystems] = useState<System[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystems()
      .then((data) => setSystems(data))
      .catch((err) => console.error('Error al cargar sistemas:', err))
      .finally(() => setLoading(false));
  }, []);

  const getSystemColor = (id: string) => {
    switch (id) {
      case 'metropolitano': return 'bg-amber-600';
      case 'corredores': return 'bg-red-600';
      case 'metro_l1': return 'bg-emerald-600';
      case 'alimentadores': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-900 pt-12 px-4">
      {/* Saludo y Encabezado */}
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Bienvenido a</Text>
          <Text className="text-white text-3xl font-extrabold tracking-tight">UrbanSafe</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Buscar')}
          className="bg-slate-800 p-3 rounded-full border border-slate-700"
        >
          <Ionicons name="search" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Banner Informativo */}
      <View className="bg-blue-600 rounded-2xl p-5 mb-6 shadow-lg">
        <Text className="text-white text-lg font-bold">Monitoreo en Tiempo Real</Text>
        <Text className="text-blue-100 text-xs mt-1">
          Consulta el aforo de tus estaciones y planifica tu ruta con nuestras predicciones inteligentes.
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.navigate('Mapa')}
          className="bg-white rounded-xl py-2 px-4 mt-3 self-start"
        >
          <Text className="text-blue-600 text-xs font-bold">Ver Mapa Interactivo</Text>
        </TouchableOpacity>
      </View>

      {/* Redes de Transporte */}
      <Text className="text-white text-lg font-bold mb-3">Redes de Transporte</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#2563eb" className="py-8" />
      ) : (
        <View className="space-y-3 mb-8">
          {systems.map((sys) => (
            <TouchableOpacity
              key={sys.id}
              onPress={() => navigation.navigate('Buscar', { system: sys.id })}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex-row justify-between items-center mb-3"
            >
              <View className="flex-row items-center space-x-3">
                <View className={`w-3 h-10 rounded-full ${getSystemColor(sys.id)} mr-3`} />
                <View>
                  <Text className="text-white font-bold text-base capitalize">{sys.name}</Text>
                  <Text className="text-slate-400 text-xs">{sys.total_stations} paraderos registrados</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}