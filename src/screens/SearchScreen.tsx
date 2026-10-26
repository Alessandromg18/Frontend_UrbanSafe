import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStations } from '../api/services';
import { Station } from '../types';
import StationCard from '../components/StationCard';

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | undefined>(undefined);

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carga inicial de estaciones
  useEffect(() => {
    fetchStations(query, selectedSystem);
  }, [selectedSystem]);

  const fetchStations = async (searchText: string, systemFilter?: string) => {
    setLoading(true);
    try {
      const results = await getStations(systemFilter, searchText);
      setStations(results);
    } catch (error) {
      console.error('Error al buscar estaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setQuery(text);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(() => {
      fetchStations(text, selectedSystem);
    }, 350);
  };

  const handleSystemFilter = (system: string | undefined) => {
    if (selectedSystem === system) return; // Evita re-renders innecesarios si se presiona el mismo
    setSelectedSystem(system);
  };

  const clearSearch = () => {
    setQuery('');
    fetchStations('', selectedSystem);
    Keyboard.dismiss();
  };

  return (
    <View className="flex-1 bg-slate-900 pt-12 px-4">
      <View className="mb-4">
        <Text className="text-2xl font-extrabold text-white tracking-tight">Buscar Estaciones</Text>
        <Text className="text-slate-400 text-xs mt-0.5">Encuentra paraderos, avenidas y sistemas de transporte</Text>
      </View>

      <View className="relative flex-row items-center">
        <Ionicons name="search" size={18} color="#94a3b8" style={{ position: 'absolute', left: 14, zIndex: 1 }} />
        <TextInput
          className="flex-1 bg-slate-800 text-white pl-11 pr-10 py-3.5 rounded-2xl border border-slate-700/80 text-sm shadow-inner"
          placeholder="Ej: Arequipa, Naranjal, Angamos..."
          placeholderTextColor="#64748b"
          value={query}
          onChangeText={handleTextChange}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} className="absolute right-3 p-1">
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros rápidos corregidos con los IDs exactos del backend */}
      <View className="my-3">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: undefined, label: 'Todos' },
            { id: 'metropolitano', label: 'Metropolitano' }, // 👈 Cambiado a 'metropolitano'
            { id: 'corredores', label: 'Corredores' },       // 👈 Cambiado a 'corredores'
            { id: 'metro_l1', label: 'Metro L1' },
            { id: 'alimentadores', label: 'Alimentadores' }, // 👈 Cambiado a 'alimentadores'
          ]}
          keyExtractor={(item, index) => `${item.id || 'todos'}-${index}`}
          renderItem={({ item }) => {
            const isSelected = selectedSystem === item.id;
            return (
              <TouchableOpacity
                onPress={() => handleSystemFilter(item.id)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: isSelected ? '#2563eb' : '#1e293b',
                  borderColor: isSelected ? '#3b82f6' : '#334155',
                  borderWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 12,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: 'bold', color: isSelected ? '#ffffff' : '#94a3b8' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {loading ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text className="text-slate-500 text-xs mt-3">Buscando paraderos...</Text>
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item, index) => `${item.id || item.name || 'station'}-${index}`}
          className="mt-1"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <StationCard
              station={item}
              onPress={() => {
                // Navegación segura controlada
                navigation.navigate('Detail', { station: item });
              }}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <View className="bg-slate-800 p-4 rounded-full mb-3 border border-slate-700">
                <Ionicons name="search-outline" size={32} color="#64748b" />
              </View>
              <Text className="text-white font-bold text-base text-center">Sin resultados</Text>
              <Text className="text-slate-500 text-xs text-center mt-1">
                No encontramos paraderos que coincidan con tu búsqueda. Prueba con otro nombre o avenida.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}