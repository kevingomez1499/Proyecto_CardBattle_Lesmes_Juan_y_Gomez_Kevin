import { request } from './apiConfig.js';

export const getCards = () => request('/cards');
export const getCard = (id) => request(`/cards/${id}`);
export const postCard = (card) => request('/cards', { method: 'POST', body: JSON.stringify(card) });
// PUT reemplaza TODA la carta (si falta un campo, desaparece)
export const putCard = (card, id) => request(`/cards/${id}`, { method: 'PUT', body: JSON.stringify(card) });
// PATCH cambia SOLO los campos enviados
export const patchCard = (data, id) => request(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteCard = (id) => request(`/cards/${id}`, { method: 'DELETE' });
