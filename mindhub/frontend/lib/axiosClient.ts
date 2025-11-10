'use client';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DJANGO_API_URL || 'https://mindhub-django-backend.vercel.app',
  headers: { 'Content-Type': 'application/json' },
});

// --- Helpers ---
const getToken = () =>
  (typeof window !== 'undefined' && localStorage.getItem('mindhub-token')) || '';

const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mindhub-token');
    // delete all coockies
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });


  }
};

const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    // ajusta la ruta si tu login es distinta
    window.location.href = '/auth/sign-in';
  }
};

// valida exp del JWT sin verificar firma (suficiente para UX)
const isJwtExpired = (token: string) => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    // exp viene en segundos
    const expSec = json?.exp;
    if (!expSec) return false; // si no hay exp, no lo marcamos como expirado
    const nowSec = Math.floor(Date.now() / 1000);
    return expSec <= nowSec;
  } catch {
    // token malformado => trátalo como inválido
    return true;
  }
};

// --- Request interceptor ---
axiosClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();

  // Si hay token pero ya expiró, limpia y redirige antes de hacer la petición
  if (token && isJwtExpired(token)) {
    clearAuth();
    redirectToLogin();
    // opcional: aborta la request
    return Promise.reject(new axios.Cancel('Token expirado'));
  }

  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor ---
axiosClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {    
    const status = error.response?.status;
    const msg = (error.response?.data?.detail || error.response?.data?.message || '').toString().toLowerCase();
    console.log('msg', msg);
    console.log('error', error)
    
    const looksUnauthorized =
      status === 401 ||
      msg.includes('credentials were not provided') ||
      msg.includes('no se proporcionaron credenciales') ||
      msg.includes('las credenciales de autenticación no se proveyeron.') ||
      msg.includes('Las credenciales de autenticación no se proveyeron.') ||
      msg.includes('token is invalid or expired') ||
      msg.includes('token inválido') ||
      msg.includes('not authenticated') ||
      msg.includes('no autenticado');

    if (looksUnauthorized) {
      // clearAuth();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default axiosClient;