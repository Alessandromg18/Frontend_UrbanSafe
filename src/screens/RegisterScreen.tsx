import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Atención', 'Por favor completa todos los campos.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error: any) {
      if (error.response) {
        const status = error.response.status;
        const msg = error.response.data?.error || 'Error al registrarse';
        if (status === 409) {
          Alert.alert('Correo en uso', msg);
        } else {
          Alert.alert('Error de API', msg);
        }
      } else {
        Alert.alert('Error de Red', 'No se pudo conectar con el servidor.');
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
        {/* BOTÓN VOLVER ATRÁS */}
        <TouchableOpacity 
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
          }} 
          className="mb-4 self-start bg-slate-800 p-2.5 rounded-full border border-slate-700/80 flex-row items-center space-x-1"
        >
          <Ionicons name="arrow-back" size={18} color="#94a3b8" />
        </TouchableOpacity>

        {/* CABECERA CON IDENTIDAD ACADÉMICA */}
        <View className="mb-6">
          <View className="flex-row items-center space-x-2 mb-2">
            <View className="bg-blue-500/10 border border-blue-500/30 px-3 py-0.5 rounded-full">
              <Text className="text-blue-400 text-[10px] font-extrabold uppercase tracking-wider">
                Desarrollo de Producto de Datos
              </Text>
            </View>
          </View>
          <Text className="text-white text-3xl font-extrabold tracking-tight">Crear Cuenta</Text>
          <Text className="text-slate-400 text-xs mt-1 leading-relaxed">
            Únete a la plataforma de <Text className="text-blue-400 font-bold">UrbanSafe</Text> para acceder a la predicción de aforo en paraderos y cálculo de rutas óptimas.
          </Text>
        </View>

        {/* TARJETA DEL FORMULARIO DE REGISTRO */}
        <View className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl">
          {/* Input Nombre */}
          <View className="mb-4">
            <Text className="text-slate-300 text-xs font-semibold mb-1.5 ml-1">Nombre Completo</Text>
            <View className="flex-row items-center bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3">
              <Ionicons name="person-outline" size={18} color="#64748b" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="Ej. Alessandro"
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Input Email */}
          <View className="mb-4">
            <Text className="text-slate-300 text-xs font-semibold mb-1.5 ml-1">Correo Electrónico</Text>
            <View className="flex-row items-center bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3">
              <Ionicons name="mail-outline" size={18} color="#64748b" style={{ marginRight: 10 }} />
              <TextInput
                className="flex-1 text-white text-sm"
                placeholder="alessandro@utec.edu.pe"
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
            <Text className="text-slate-500 text-[10px] mt-1 ml-1">Mínimo 6 caracteres</Text>
          </View>

          {/* Botón Registrarse */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-blue-600 py-3.5 rounded-xl items-center mt-6 shadow-lg active:bg-blue-700"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View className="flex-row items-center space-x-2">
                <Text className="text-white font-bold text-base">Registrar Mi Cuenta</Text>
                <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Enlace para Iniciar Sesión */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            className="py-3 items-center mt-3 border-t border-slate-700/60"
          >
            <Text className="text-slate-400 text-xs">
              ¿Ya posees una cuenta? <Text className="text-blue-400 font-bold">Inicia sesión aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER DESTACANDO EL VALOR DE LA APP */}
        <View className="mt-6 items-center">
          <Text className="text-slate-500 text-[11px] text-center leading-relaxed">
            UrbanSafe integra algoritmos de enrutamiento en grafos y estimación de crowding en tiempo real.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}