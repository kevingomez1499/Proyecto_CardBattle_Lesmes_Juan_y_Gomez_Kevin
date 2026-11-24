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

/**
 * Suma una partida, victoria/derrota y puntos al historial actual del jugador en la API.
 * @param {string} id - ID del jugador (player.id)
 * @param {object} result - { won: boolean, points?: number }
 * @returns {Promise<object>} El jugador actualizado con los nuevos totales
 */
export async function addPlayerMatchResult(id, { won, points = 0 }) {
  const current = await getPlayer(id);
  if (!current) {
    throw new Error(`No se encontró el jugador con id: ${id}`);
  }

  const updatedStats = {
    gamesPlayed: (current.gamesPlayed ?? 0) + 1,
    wins: (current.wins ?? 0) + (won ? 1 : 0),
    losses: (current.losses ?? 0) + (won ? 0 : 1),
    points: (current.points ?? 0) + points,
  };

  return patchPlayer(updatedStats, id);
}