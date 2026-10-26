import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { updateProfileApi, updatePasswordApi, deleteAccountApi } from '../api/client';

export default function AccountScreen({ navigation }: any) {
  const { user, logout, setUser } = useContext(AuthContext);

  // Estados para Modals
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Campos de Edición de Perfil
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Campos de Cambio de Contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // ✅ SOLUCIÓN: Sincroniza los campos de texto con el usuario real tan pronto se cargue/actualice en AuthContext
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // --- HANDLER: Cerrar Sesión ---
  const handleLogout = async () => {
    try {
      await logout();
      // Redirección segura a Login borrando la pila de navegación
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo cerrar la sesión.');
    }
  };

  // --- HANDLER: Actualizar Nombre y Email ---
  const handleUpdateProfile = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Atención', 'Por favor ingresa un nombre y correo válidos.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateProfileApi(name, email);
      Alert.alert('Éxito', res.message || 'Perfil actualizado correctamente.');

      // Sincronizar en el Contexto Global
      const updatedUser = res.user || { ...user, name, email };
      setUser(updatedUser);

      setShowEditProfileModal(false);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'No se pudo actualizar el perfil.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: Cambiar Contraseña ---
  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Atención', 'Por favor ingresa la contraseña actual y la nueva.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Atención', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePasswordApi(currentPassword, newPassword);
      Alert.alert('Éxito', res.message || 'Contraseña actualizada correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordModal(false);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'No se pudo actualizar la contraseña.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLER: Eliminar Cuenta ---
  const handleDeleteAccount = () => {
    Alert.alert(
      '¿Eliminar cuenta permanentemente?',
      'Esta acción no se puede deshacer. Todos tus datos se borrarán del sistema.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteAccountApi();
              Alert.alert('Cuenta Eliminada', 'Tu cuenta ha sido eliminada con éxito.');
              await handleLogout();
            } catch (error: any) {
              const msg = error.response?.data?.error || 'No se pudo eliminar la cuenta.';
              Alert.alert('Error', msg);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1 }} className="bg-slate-900 pt-12 px-4">
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <Text className="text-2xl font-extrabold text-white tracking-tight mb-6">Mi Cuenta</Text>

        {/* TARJETA PRINCIPAL DEL USUARIO */}
        <View className="bg-slate-800 border border-slate-700/80 rounded-2xl p-5 mb-6 flex-row items-center space-x-4">
          <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/50 bg-slate-900 items-center justify-center">
            <Image
              source={require('../images/logo_utec.png')} 
              style={{ width: '100%', height: '100%', resizeMode: 'cover' }}
            />
          </View>

          <View className="flex-1 ml-3">
            <Text className="text-white font-extrabold text-lg" numberOfLines={1}>
              {user?.name || 'Cargando...'}
            </Text>
            <Text className="text-slate-400 text-xs" numberOfLines={1}>
              {user?.email || 'cargando@utec.edu.pe'}
            </Text>
            <View className="bg-emerald-500/10 border border-emerald-500/30 self-start px-2 py-0.5 rounded-md mt-1.5">
              <Text className="text-emerald-400 text-[10px] font-bold">Cuenta Verificada</Text>
            </View>
          </View>
        </View>

        {/* OPCIONES DE CONFIGURACIÓN */}
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 ml-1">
          Ajustes de Seguridad y Perfil
        </Text>

        <View className="bg-slate-800 border border-slate-700/80 rounded-2xl overflow-hidden mb-6">
          <TouchableOpacity
            onPress={() => {
              setName(user?.name || '');
              setEmail(user?.email || '');
              setShowEditProfileModal(true);
            }}
            className="p-4 border-b border-slate-700/50 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3">
              <Ionicons name="person-outline" size={20} color="#94a3b8" />
              <Text className="text-slate-200 text-sm font-medium ml-2">Editar Datos Personales</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowPasswordModal(true)}
            className="p-4 border-b border-slate-700/50 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3">
              <Ionicons name="key-outline" size={20} color="#94a3b8" />
              <Text className="text-slate-200 text-sm font-medium ml-2">Cambiar Contraseña</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center space-x-3">
              <Ionicons name="trash-outline" size={20} color="#f87171" />
              <Text className="text-red-400 text-sm font-medium ml-2">Eliminar Cuenta</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/30 py-3.5 rounded-2xl items-center flex-row justify-center space-x-2 mt-2"
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text className="text-red-500 font-bold text-sm ml-2">Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* MODAL EDITAR PERFIL */}
      <Modal visible={showEditProfileModal} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
            <Text className="text-white font-extrabold text-lg mb-4">Editar Datos Personales</Text>
            
            <Text className="text-slate-300 text-xs font-semibold mb-1">Nombre Completo</Text>
            <TextInput
              className="bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 text-sm mb-4"
              value={name}
              onChangeText={setName}
            />

            <Text className="text-slate-300 text-xs font-semibold mb-1">Correo Electrónico</Text>
            <TextInput
              className="bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 text-sm mb-6"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowEditProfileModal(false)}
                className="flex-1 bg-slate-700 py-3 rounded-xl items-center"
              >
                <Text className="text-slate-200 font-bold text-sm">Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={loading}
                className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-sm">Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CAMBIAR CONTRASEÑA */}
      <Modal visible={showPasswordModal} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-center px-6">
          <View className="bg-slate-800 border border-slate-700 rounded-3xl p-6">
            <Text className="text-white font-extrabold text-lg mb-4">Cambiar Contraseña</Text>
            
            <Text className="text-slate-300 text-xs font-semibold mb-1">Contraseña Actual</Text>
            <TextInput
              className="bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 text-sm mb-4"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <Text className="text-slate-300 text-xs font-semibold mb-1">Nueva Contraseña</Text>
            <TextInput
              className="bg-slate-900 text-white px-4 py-3 rounded-xl border border-slate-700 text-sm mb-6"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                className="flex-1 bg-slate-700 py-3 rounded-xl items-center"
              >
                <Text className="text-slate-200 font-bold text-sm">Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleUpdatePassword}
                disabled={loading}
                className="flex-1 bg-blue-600 py-3 rounded-xl items-center"
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-sm">Actualizar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}