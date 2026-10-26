import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de producción en Render
const API_BASE_URL = 'https://backend-urbansafe.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@urbansafe_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error al recuperar el token:', error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ==========================================
// FUNCIONES DE GESTIÓN DE CUENTA Y PERFIL
// ==========================================

// Actualizar nombre o email (PUT /auth/me o /me según cómo esté mapeado en tu Flask)
export const updateProfileApi = async (name?: string, email?: string) => {
  const response = await api.put('/auth/me', { name, email });
  return response.data;
};

// Cambiar contraseña (PUT /auth/me/password)
export const updatePasswordApi = async (current_password: string, new_password: string) => {
  const response = await api.put('/auth/me/password', {
    current_password,
    new_password,
  });
  return response.data;
};

// Eliminar cuenta (DELETE /auth/me)
export const deleteAccountApi = async () => {
  const response = await api.delete('/auth/me');
  return response.data;
};