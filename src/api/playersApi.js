import { request } from './apiConfig.js';

export const getPlayers = () => request('/players');
export const getPlayer = (id) => request(`/players/${id}`);
export const postPlayer = (player) => request('/players', { method: 'POST', body: JSON.stringify(player) });
export const patchPlayer = (data, id) => request(`/players/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Busca un apodo en la API (sin distinguir mayúsculas). Devuelve el jugador o undefined.
export async function findPlayerByNickname(nickname) {
  const players = await getPlayers();
  return players.find((p) => p.nickname.toLowerCase() === nickname.toLowerCase());
}
