import { request } from './apiConfig.js';

// Valida las credenciales consultando la API. Devuelve el admin o undefined.
export async function loginAdmin(username, password) {
  const admins = await request(`/admins?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
  return admins[0];
}
