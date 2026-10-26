import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atención', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          Alert.alert('Credenciales Inválidas', 'El correo o la contraseña son incorrectos.');
        } else if (status === 400) {
          Alert.alert('Datos incompletos', 'Por favor llena todos los campos.');
        } else {
          Alert.alert('Error del Servidor', error.response.data?.error || 'Ocurrió un error inesperado.');
        }
      } else {
        Alert.alert('Falla de Conexión', 'No se pudo comunicar con el servidor backend.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        className="px-6 py-10"
        showsVerticalScrollIndicator={false}
      >
        {/* CABECERA CON BRANDING ACADÉMICO */}
        <View className="items-center mb-6">
          {/* Imagen Completa de UTEC (Reemplaza al círculo recortado) */}
          <View className="w-48 h-12 mb-3 items-center justify-center">
            <Image
              source={require('../images/utec_completo.png')} 
              style={{ width: '100%', height: '180%', resizeMode: 'contain' }}
            />
          </View>

          {/* Badge de Proyecto */}
          <View className="bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full mb-2">
            <Text className="text-blue-400 text-[10px] font-extrabold uppercase tracking-wider">
              Desarrollo de Producto de Datos
            </Text>
          </View>

          <Text className="text-white text-2xl font-extrabold tracking-tight">UrbanSafe</Text>
          <Text className="text-slate-400 text-xs text-center mt-1 px-4 leading-relaxed">
            Plataforma inteligente de monitoreo de aforo y navegación segura en transporte público para Lima.
          </Text>
        </View>

        {/* TARJETA DEL FORMULARIO DE ACCESO */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
          <Text className="text-slate-200 font-extrabold text-lg mb-1">Iniciar Sesión</Text>
          <Text className="text-slate-400 text-xs mb-5">
            Ingresa con tu cuenta registrada para acceder a la planificación de rutas directas.
          </Text>

          {/* Input Email */}
          <View className="mb-4">
            <Text className="text-slate-300 text-xs font-semibold mb-1.5 ml-1">Correo Electrónico</Text>
            <View className="flex-row items-center bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3">
              <Ionicons name="mail-outline" size={18} color="#64748b" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="usuario@utec.edu.pe"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Input Password */}
          <View className="mb-2">
            <Text className="text-slate-300 text-xs font-semibold mb-1.5 ml-1">Contraseña</Text>
            <View className="flex-row items-center bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3">
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Botón Iniciar Sesión */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-blue-600 py-3.5 rounded-xl items-center mt-6 shadow-lg active:bg-blue-700"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View className="flex-row items-center space-x-2">
                <Text className="text-white font-bold text-base">Entrar a la Plataforma</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Acceso a Registro */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            className="py-3 items-center mt-3 border-t border-slate-700/60"
          >
            <Text className="text-slate-400 text-xs">
              ¿No tienes una cuenta? <Text className="text-blue-400 font-bold">Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* PIE DE PÁGINA INFORMATIVO */}
        <View className="mt-8 items-center">
          <View className="flex-row items-center space-x-2 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-700/40">
            <Ionicons name="shield-checkmark-sharp" size={14} color="#38bdf8" />
            <Text className="text-slate-400 text-[11px] font-medium ml-1">
              Integración GTFS · Metropolitano & Línea 1
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}