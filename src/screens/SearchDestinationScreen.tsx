import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { matchTrip } from '../api/services';
import { rutasOfrecibles, etiquetaClase, textoOcupacion } from '../utils/aforo';
import { TripMatchResponse, MatchedRoute, AutocompleteSuggestion } from '../types';
import SearchAutocomplete from '../components/SearchAutocomplete';

export default function SearchDestinationScreen({ navigation }: any) {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [tripData, setTripData] = useState<TripMatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Obtener la ubicación actual al montar la pantalla
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Se requieren permisos de ubicación para calcular los paraderos.');
        return;
      }
      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  // Función ejecutada al seleccionar una sugerencia o dar Enter
  const handleSearchOrSelect = async (destinationInput: string | AutocompleteSuggestion) => {
    if (!location) {
      alert('No se pudo obtener tu ubicación actual.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setTripData(null);

    try {
      const response = await matchTrip(
        location.coords.latitude,
        location.coords.longitude,
        destinationInput
      );

      setTripData(response);

      if (rutasOfrecibles(response.found_routes).length === 0) {
        setErrorMessage('No se encontraron paraderos ni rutas directas a este destino dentro del radio.');
      }
    } catch (error) {
      console.error('Error al planificar el viaje:', error);
      setErrorMessage('Ocurrió un error al buscar los paraderos cercanos a tu destino.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }} className="bg-slate-900 pt-16 px-4">
      {/* Cabecera Principal (Más compacta y cercana arriba) */}
      <View className="mb-0.025">
        <Text className="text-2xl font-extrabold text-white tracking-tight">Buscar por Destino</Text>
        <Text className="text-slate-400 text-xs mt-1">
          Ingresa a dónde quieres ir para ver todas las rutas y paraderos directos disponibles
        </Text>
      </View>

      {/* Contenedor de la Barra de Autocompletado (Subida) */}
      <View style={{ zIndex: 50 }} className="relative z-50 w-full mb-3">
        <SearchAutocomplete
          placeholder="¿A qué lugar o avenida te diriges?"
          onSelectDestination={(suggestion) => handleSearchOrSelect(suggestion)}
          onSearchSubmit={(text) => handleSearchOrSelect(text)}
        />
      </View>

      {/* Indicador de Carga */}
      {loading && (
        <View className="py-16 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-slate-400 text-xs mt-3 font-medium">Buscando las mejores rutas directas...</Text>
        </View>
      )}

      {/* Mensaje de error o sin resultados (Añadido mt-4) */}
      {!loading && errorMessage && (
        <View className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mt-32 mb-4 items-center">
          <Ionicons name="alert-circle-outline" size={24} color="#f59e0b" style={{ marginBottom: 4 }} />
          <Text className="text-amber-200 text-xs text-center font-medium">{errorMessage}</Text>
        </View>
      )}

      {/* Tarjeta de Destino Seleccionado (Añadido mt-4) */}
      {!loading && tripData && (
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3.5 mt-32 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="bg-red-500/20 p-2 rounded-xl mr-3 border border-red-500/30">
              <Ionicons name="location" size={18} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Destino Encontrado</Text>
              <Text className="text-white font-bold text-xs" numberOfLines={1}>
                {tripData.destination.resolved_name}
              </Text>
            </View>
          </View>
          <View className="bg-blue-600/20 px-3 py-1 rounded-full border border-blue-500/30">
            <Text className="text-blue-400 text-[11px] font-bold">
              {rutasOfrecibles(tripData.found_routes).length} {rutasOfrecibles(tripData.found_routes).length === 1 ? 'opción' : 'opciones'}
            </Text>
          </View>
        </View>
      )}

      {/* LISTADO COMPLETO DE RUTAS Y PARADEROS (Añadido mt-2 para separar del destino seleccionado) */}
      {!loading && tripData?.recomendacion_viaje?.mensaje ? (
        <View className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 mb-2">
          <Text className="text-emerald-300 text-xs font-medium">{tripData.recomendacion_viaje.mensaje}</Text>
        </View>
      ) : null}

      {!loading && tripData && tripData.found_routes && (
        <View style={{ flex: 1 }} className="mt-2">
          <FlatList
            data={rutasOfrecibles(tripData.found_routes)}
            keyExtractor={(item, index) => `${item.boarding_id}-${item.route_code}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 110 }} // Espacio suficiente para no chocar con el navbar flotante
            renderItem={({ item, index }: { item: MatchedRoute; index: number }) => {
              const walkToStation = Math.round(item.origin_walk_m);
              const walkFromStation = Math.round(item.dest_walk_m);
              const totalWalk = walkToStation + walkFromStation;
              const isBestOption = index === 0;

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    navigation.navigate('MainTabs', {
                      screen: 'Mapa',
                      params: { selectedRoute: item, destination: tripData.destination }
                    });
                  }}
                  className={`rounded-2xl p-4 mb-3 border ${
                    isBestOption
                      ? 'bg-slate-800 border-blue-500/80 shadow-lg'
                      : 'bg-slate-800/80 border-slate-700/70'
                  }`}
                >
                  {/* Badge de Mejor Opción */}
                  {isBestOption && (
                    <View className="bg-blue-600 self-start px-2.5 py-0.5 rounded-full mb-2">
                      <Text className="text-white text-[10px] font-bold">🌟 Recomendada: menor tiempo total (caminata + espera + aforo)</Text>
                    </View>
                  )}

                  {/* Cabecera del Paradero de Abordaje */}
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider mr-2">
                          {item.system}
                        </Text>
                        {item.route_code && (
                          <View className="bg-slate-700/80 px-2 py-0.5 rounded">
                            <Text className="text-slate-200 text-[10px] font-extrabold">
                              Ruta: {item.route_code}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-white font-bold text-base">
                        Origen: {item.boarding_station}
                      </Text>
                    </View>

                    {/* Distancia a pie inicial */}
                    <View className="bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-700 items-end">
                      <Text className="text-[10px] text-slate-400 font-semibold">Caminata inicial</Text>
                      <Text className="text-blue-400 font-extrabold text-xs">{walkToStation} m</Text>
                    </View>
                  </View>

                  {/* Detalle de Bajada */}
                  <View className="bg-slate-900/60 rounded-xl p-3 mt-1 border border-slate-700/40">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Ionicons name="bus-outline" size={15} color="#94a3b8" style={{ marginRight: 8 }} />
                        <Text className="text-slate-300 text-xs flex-1">
                          Te bajas en: <Text className="font-bold text-white">{item.leaving_station}</Text>
                        </Text>
                      </View>
                      <Text className="text-slate-400 text-[11px]">
                        + {walkFromStation} m al destino
                      </Text>
                    </View>
                  </View>

                  {/* Aforo y espera pronosticados para la hora actual en el sentido del viaje */}
                  {item.aforo?.clase ? (
                    <Text className="text-slate-300 text-[11px] mt-2">
                      Aforo: <Text className="font-bold text-white">{etiquetaClase(item.aforo.clase as any)} ({textoOcupacion(item.aforo.ocupacion)})</Text>
                      {item.espera_min != null ? <Text>  ·  Espera ~{item.espera_min} min</Text> : null}
                      {item.viaje_min != null ? <Text>  ·  Viaje ~{Math.round(item.viaje_min)} min</Text> : null}
                    </Text>
                  ) : null}

                  {/* Pie de tarjeta con total y acceso rápido */}
                  <View className="flex-row items-center justify-between mt-3 pt-2 border-t border-slate-700/40">
                    <Text className="text-slate-400 text-[11px]">
                      Caminata total: <Text className="text-white font-bold">{totalWalk} m</Text>
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-blue-400 text-xs font-bold mr-1">Ver en mapa</Text>
                      <Ionicons name="chevron-forward" size={14} color="#60a5fa" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              !errorMessage ? (
                <View className="items-center justify-center py-20 px-6">
                  <Ionicons name="map-outline" size={44} color="#64748b" style={{ marginBottom: 12 }} />
                  <Text className="text-white font-bold text-base text-center">Escribe un destino</Text>
                  <Text className="text-slate-500 text-xs text-center mt-1 leading-relaxed">
                    Te mostraremos todos los paraderos cercanos con sus respectivas rutas de transporte público.
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      )}
    </View>
  );
}