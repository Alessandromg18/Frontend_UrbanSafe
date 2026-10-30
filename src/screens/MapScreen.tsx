import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { getStations, getRouteGeoJson, getRouteCodeFromStation, matchTrip, getStationPrediction } from '../api/services';
import { etiquetaClase, etiquetaRecomendacion, colorRecomendacion, textoOcupacion, textoEspera, formatoHora } from '../utils/aforo';
import { Station, TripMatchResponse, MatchedRoute, AutocompleteSuggestion } from '../types';
import SearchAutocomplete from '../components/SearchAutocomplete';
import TripSummaryCard from '../components/TripSummaryCard';

export default function MapScreen({ route }: any) {
  const webViewRef = useRef<WebView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  // 👈 Estado unificado para la predicción actual y el forecast futuro
  const [forecastData, setForecastData] = useState<any>(null);  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingMap, setLoadingMap] = useState(true);

  // Estados para el planificador de viajes y filtros
  const [tripData, setTripData] = useState<TripMatchResponse | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<MatchedRoute | null>(null);
  const [activeRouteFilter, setActiveRouteFilter] = useState<string[] | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoadingMap(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      try {
        const allStations = await getStations();
        setStations(allStations);
      } catch (error) {
        console.error("Error cargando estaciones para el mapa:", error);
      } finally {
        setLoadingMap(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (route.params?.selectedRoute && route.params?.destination && location) {
      const { selectedRoute: incomingRoute, destination } = route.params;

      setTripData({
        origin: { lat: location.coords.latitude, lon: location.coords.longitude },
        destination: destination,
        radius_meters: 1000,
        found_routes: [incomingRoute]
      });
      setSelectedRoute(incomingRoute);

      const allowedIds = [incomingRoute.boarding_id, incomingRoute.leaving_id];
      setActiveRouteFilter(allowedIds);

      sendToMap('SET_DESTINATION_PIN', {
        lat: destination.lat,
        lon: destination.lon,
        name: destination.resolved_name,
        allowedIds: allowedIds,
        userLat: location.coords.latitude,
        userLon: location.coords.longitude
      });

      const boardingStationObj = stations.find(s => s.id === incomingRoute.boarding_id);
      if (boardingStationObj) {
        // el destino (estación de bajada) fija el sentido de viaje del aforo
        handleSelectStation(boardingStationObj, false, incomingRoute.leaving_id);
      }
    }
  }, [route.params, location, stations]);

  const sendToMap = (action: string, payload: any = {}) => {
    if (webViewRef.current) {
      webViewRef.current.postMessage(JSON.stringify({ action, payload }));
    }
  };

  const handleSearchDestination = async (queryOrSuggestion: string | AutocompleteSuggestion) => {
    if (!location) return;

    const queryText = typeof queryOrSuggestion === 'string' ? queryOrSuggestion : queryOrSuggestion.display_name;
    const coords = typeof queryOrSuggestion === 'object' ? { lat: queryOrSuggestion.lat, lon: queryOrSuggestion.lon } : undefined;

    try {
      const response = await matchTrip(
        location.coords.latitude,
        location.coords.longitude,
        coords || queryText
      );

      setTripData(response);

      if (response.found_routes && response.found_routes.length > 0) {
        const bestRoute = response.found_routes[0];
        setSelectedRoute(bestRoute);

        const allowedIds = [bestRoute.boarding_id, bestRoute.leaving_id];
        setActiveRouteFilter(allowedIds);

        sendToMap('SET_DESTINATION_PIN', {
          lat: response.destination.lat,
          lon: response.destination.lon,
          name: response.destination.resolved_name,
          allowedIds: allowedIds,
          userLat: location.coords.latitude,
          userLon: location.coords.longitude
        });

        const boardingStationObj = stations.find(s => s.id === bestRoute.boarding_id);
        if (boardingStationObj) {
          handleSelectStation(boardingStationObj, false, bestRoute.leaving_id);
        }
      } else {
        alert("No se encontró una ruta directa a ese destino dentro del radio de búsqueda.");
      }
    } catch (error) {
      console.error("Error al planificar el viaje:", error);
    }
  };

  const handleSelectStation = async (station: Station, openCard = true, haciaId?: string) => {
    if (openCard) {
      setSelectedStation(station);
    }
    setLoadingForecast(true);
    setForecastData(null);
    sendToMap('CLEAR_ROUTE');

    try {
      const routeCode = getRouteCodeFromStation(station);
      const geoData = await getRouteGeoJson(station.system, routeCode);

      if (!geoData || (Array.isArray(geoData) && geoData.length === 0)) return;

      let finalFeatures = geoData.features || [];
      if (Array.isArray(geoData)) {
        finalFeatures = geoData;
      }

      if (routeCode && finalFeatures.length > 0) {
        const matchedFeatures = finalFeatures.filter((f: any) => {
          const props = f.properties || {};
          const featureValue = props.ruta || props.servicio || props.osm_ref || props.codigo || props.estacion;
          return String(featureValue).toLowerCase() === String(routeCode).toLowerCase();
        });

        if (matchedFeatures.length > 0) {
          finalFeatures = matchedFeatures;
        }
      }

      if (finalFeatures.length > 0) {
        sendToMap('DRAW_ROUTE', {
          type: "FeatureCollection",
          features: finalFeatures
        });
      }
    } catch (error) {
      console.error("Error al obtener GeoJSON de la ruta:", error);
    }

    try {
      // Una sola llamada: estado actual + pronóstico del día (sentido según el destino, si hay)
      const data = await getStationPrediction(station, haciaId);
      setForecastData(data
        ? { current: data.current, predictions: data.forecast, referencia: data.referencia }
        : { sinDatos: true });
    } catch (error: any) {
      console.error("Error al obtener predicciones:", error);
    } finally {
      setLoadingForecast(false);
    }
  };

  const handleCloseTrip = () => {
    setTripData(null);
    setSelectedRoute(null);
    setActiveRouteFilter(null);
    sendToMap('CLEAR_DESTINATION_PIN');
    sendToMap('CLEAR_ROUTE');
  };

  const handleCloseCard = () => {
    setSelectedStation(null);
  };

  // El backend ya entrega la hora de Lima ("YYYY-MM-DD HH:MM"): se muestra tal cual
  const formatTime = formatoHora;

  if (loadingMap || !location) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: '#0f172a' }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ color: '#ffffff', marginTop: 16, fontSize: 14, fontWeight: '500' }}>
          Obteniendo ubicación y red de transporte...
        </Text>
      </View>
    );
  }

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin: 0; padding: 0; height: 100%; width: 100%; background: #0f172a; }
        #map { height: 100%; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${location.coords.latitude}, ${location.coords.longitude}], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var userIcon = L.divIcon({
          className: 'custom-user-marker',
          html: '<div style="background-color: #2563eb; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
          iconSize: [16, 16]
        });
        var userMarker = L.marker([${location.coords.latitude}, ${location.coords.longitude}], {icon: userIcon}).addTo(map).bindPopup('Mi ubicación');

        var allStations = ${JSON.stringify(stations)};
        var markersGroup = L.layerGroup().addTo(map);
        var routeLayer = null;
        var destinationMarker = null;
        var activeFilterIds = null;

        function renderMarkers() {
          markersGroup.clearLayers();
          var currentZoom = map.getZoom();
          var bounds = map.getBounds();

          allStations.forEach(function(st) {
            if (activeFilterIds && !activeFilterIds.includes(st.id)) {
              return;
            }

            var latLng = L.latLng(st.latitude, st.longitude);

            if (!bounds.contains(latLng) && !activeFilterIds) return;

            if (currentZoom < 13 && st.system !== 'metropolitano' && st.system !== 'metro_l1' && !activeFilterIds) {
              return;
            }

            var color = st.system === 'metropolitano' ? 'orange' : (st.system === 'metro_l1' ? 'green' : 'red');
            var stationIcon = L.divIcon({
              className: 'custom-station-marker',
              html: '<div style="background-color: ' + color + '; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
              iconSize: [14, 14]
            });

            var marker = L.marker(latLng, {icon: stationIcon});
            marker.bindPopup('<b>' + st.name + '</b><br>Sistema: ' + st.system);

            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATION_CLICK', data: st }));
            });

            markersGroup.addLayer(marker);
          });
        }

        renderMarkers();
        map.on('moveend zoomend', renderMarkers);

        document.addEventListener("message", handleNativeMessage);
        window.addEventListener("message", handleNativeMessage);

        function handleNativeMessage(event) {
          try {
            var msg = JSON.parse(event.data);

            if (msg.action === 'CLEAR_ROUTE') {
              if (routeLayer) {
                map.removeLayer(routeLayer);
                routeLayer = null;
              }
            } else if (msg.action === 'DRAW_ROUTE') {
              if (routeLayer) {
                map.removeLayer(routeLayer);
              }

              routeLayer = L.geoJSON(msg.payload, {
                style: function(feature) {
                  var routeColor = (feature.properties && feature.properties.color_hex) ? feature.properties.color_hex : '#2563eb';
                  return {
                    color: routeColor,
                    weight: 5,
                    opacity: 0.8
                  };
                }
              }).addTo(map);
            } else if (msg.action === 'SET_DESTINATION_PIN') {
              activeFilterIds = msg.payload.allowedIds;

              if (destinationMarker) {
                map.removeLayer(destinationMarker);
              }

              var destIcon = L.divIcon({
                className: 'custom-dest-marker',
                html: '<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 12px rgba(220,38,38,0.7); display: flex; align-items: center; justify-content: center;"><div style="background: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>',
                iconSize: [20, 20]
              });

              destinationMarker = L.marker([msg.payload.lat, msg.payload.lon], { icon: destIcon }).addTo(map);
              destinationMarker.bindPopup('<b>Destino:</b><br>' + msg.payload.name);

              renderMarkers();

              var group = new L.featureGroup([
                userMarker,
                destinationMarker,
                ...markersGroup.getLayers()
              ]);
              map.fitBounds(group.getBounds(), { padding: [50, 50] });

            } else if (msg.action === 'CLEAR_DESTINATION_PIN') {
              activeFilterIds = null;
              if (destinationMarker) {
                map.removeLayer(destinationMarker);
                destinationMarker = null;
              }
              renderMarkers();
              map.setView([${location.coords.latitude}, ${location.coords.longitude}], 15);
            }
          } catch(e) {
            console.error(e);
          }
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <SearchAutocomplete onSelectDestination={handleSearchDestination} onSearchSubmit={handleSearchDestination} />

      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={(event) => {
          try {
            const parsed = JSON.parse(event.nativeEvent.data);
            if (parsed.type === 'STATION_CLICK') {
              handleSelectStation(parsed.data);
            }
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {tripData && selectedRoute && (
        <TripSummaryCard
          tripData={tripData}
          selectedRoute={selectedRoute}
          forecastData={forecastData}
          loadingForecast={loadingForecast}
          onClose={handleCloseTrip}
        />
      )}

      {/* Tarjeta clásica de estación con la predicción actual arriba y el forecast después */}
      {!tripData && selectedStation && (
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.systemText}>{selectedStation.system}</Text>
              <Text style={styles.stationTitle}>{selectedStation.name}</Text>
              <Text style={styles.refText}>Avenida / Ref: {selectedStation.avenida || 'No especificada'}</Text>
            </View>
            <TouchableOpacity onPress={handleCloseCard} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.forecastSection}>
            {loadingForecast ? (
              <ActivityIndicator size="small" color="#2563eb" style={{ paddingVertical: 16 }} />
            ) : forecastData?.sinDatos ? (
              <Text style={styles.noForecastText}>
                Sin predicción: este paradero no tiene datos de validaciones ATU propios.
              </Text>
            ) : forecastData ? (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
                {/* 1. TARJETA DESTACADA: ESTADO ACTUAL EN TIEMPO REAL */}
                {forecastData.current && (
                  <View style={styles.currentCard}>
                    <View style={styles.currentHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.currentTitle}>
                          Estado Actual ({formatTime(forecastData.current.datetime)})
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: colorRecomendacion(forecastData.current.recommendation).bg }]}>
                        <Text style={[styles.badgeText, { color: colorRecomendacion(forecastData.current.recommendation).fg }]}>
                          {etiquetaRecomendacion(forecastData.current.recommendation).toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.currentDetails}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.currentClassText}>{etiquetaClase(forecastData.current.class)}</Text>
                        {forecastData.current.sentido ? (
                          <Text style={styles.currentEtaText}>{forecastData.current.sentido}</Text>
                        ) : null}
                        <Text style={styles.currentEtaText}>
                          Espera estimada: <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>{textoEspera(forecastData.current)}</Text>
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 10, color: '#64748b' }}>Ocupación</Text>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: '#0f172a' }}>
                          {textoOcupacion(forecastData.current.crowding)}
                        </Text>
                        {forecastData.current.pasajeros_por_tren != null ? (
                          <Text style={{ fontSize: 9, color: '#64748b' }}>≈ {forecastData.current.pasajeros_por_tren} a bordo</Text>
                        ) : null}
                      </View>
                    </View>
                    {forecastData.referencia ? (
                      <Text style={styles.referenciaText}>
                        Estimado con datos ATU del {forecastData.referencia.fecha_referencia_datos} (día equivalente)
                      </Text>
                    ) : null}
                  </View>
                )}

                {/* 2. PRONÓSTICO PARA LAS PRÓXIMAS HORAS (FORECAST) */}
                {forecastData.predictions && forecastData.predictions.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.forecastSubtitle}>Predicciones del día :</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {forecastData.predictions.map((item: any, index: number) => (
                        <View key={index} style={styles.forecastCard}>
                          <Text style={styles.forecastTime}>
                            {formatTime(item.datetime)}
                          </Text>
                          <Text style={styles.forecastClass}>{etiquetaClase(item.class)}</Text>
                          <Text style={styles.forecastEta}>{textoOcupacion(item.crowding)} · {textoEspera(item)}</Text>
                          <View style={[styles.badge, { backgroundColor: colorRecomendacion(item.recommendation).bg }]}>
                            <Text style={[styles.badgeText, { color: colorRecomendacion(item.recommendation).fg }]}>
                              {etiquetaRecomendacion(item.recommendation).toUpperCase()}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </ScrollView>
            ) : (
              <Text style={styles.noForecastText}>No hay predicciones disponibles para esta estación.</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardContainer: {
    position: 'absolute',
    bottom: 115,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  systemText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 2,
  },
  refText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  closeButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
  },
  forecastSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  currentCard: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#2563eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  currentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textTransform: 'uppercase',
  },
  currentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  currentClassText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  currentEtaText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  forecastSubtitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 6,
  },
  forecastCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
    width: 110,
    alignItems: 'center',
  },
  forecastTime: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
  },
  forecastClass: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 4,
    textAlign: 'center',
  },
  forecastEta: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    marginTop: 2,
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  referenciaText: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 6,
  },
  noForecastText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 8,
  },
});