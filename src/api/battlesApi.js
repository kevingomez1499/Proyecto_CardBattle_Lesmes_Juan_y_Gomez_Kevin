import { request } from './apiConfig.js';

export const getBattles = () => request('/battles');
export const postBattle = (battle) => request('/battles', { method: 'POST', body: JSON.stringify(battle) });
