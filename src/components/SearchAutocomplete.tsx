import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAutocompleteSuggestions } from '../api/services'; // Ajusta tu ruta de importación si es necesario
import { AutocompleteSuggestion } from '../types/index';

interface SearchAutocompleteProps {
  onSelectDestination: (suggestion: AutocompleteSuggestion) => void;
  onSearchSubmit: (searchText: string) => void;
  placeholder?: string;
}

export default function SearchAutocomplete({
  onSelectDestination,
  onSearchSubmit,
  placeholder = "¿A dónde quieres ir?"
}: SearchAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Efecto para buscar sugerencias con debounce mientras escribe
  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await getAutocompleteSuggestions(query);
        setSuggestions(results);
        setShowDropdown(true);
      } catch (error) {
        console.error("Error en autocompletado:", error);
      } finally {
        setLoading(false);
      }
    }, 400); // Espera 400ms tras dejar de escribir

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: AutocompleteSuggestion) => {
    setQuery(item.display_name);
    setShowDropdown(false);
    onSelectDestination(item);
  };

  return (
    <View className="absolute top-12 left-4 right-4 z-50">
      {/* Barra de Búsqueda Principal */}
      <View className="flex-row items-center bg-white rounded-2xl shadow-lg px-4 py-3 border border-gray-100">
        <Ionicons name="search" size={20} color="#6b7280" className="mr-2" />
        <TextInput
          className="flex-1 text-gray-800 text-base font-medium"
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => {
            setShowDropdown(false);
            onSearchSubmit(query);
          }}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color="#3b82f6" className="ml-2" />}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Desplegable de Sugerencias en Tiempo Real */}
      {showDropdown && suggestions.length > 0 && (
        <View className="bg-white mt-2 rounded-xl shadow-xl overflow-hidden border border-gray-100 max-h-60">
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3 border-b border-gray-50 active:bg-gray-50"
                onPress={() => handleSelect(item)}
              >
                <Ionicons name="location-outline" size={18} color="#ef4444" className="mr-3" />
                <Text className="flex-1 text-gray-700 text-sm" numberOfLines={2}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}