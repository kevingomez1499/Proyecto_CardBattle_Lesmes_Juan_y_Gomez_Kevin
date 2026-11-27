// [NUEVO] Estrategia automática para la carta del jugador (modo AUTOMÁTICO).
// Reutiliza getAvailableActions para elegir SOLO entre acciones válidas.
import { getAvailableActions } from './battleEngine.js';
import { pickRandom } from './random.js';


const SPECIAL_CHANCE = 0.7; // prioriza el especial cuando está disponible
const DEFEND_CHANCE_LOW_HP = 0.45; // más probable defenderse con poca vida
const DEFEND_CHANCE_NORMAL = 0.12;
const LOW_HP_RATIO = 0.35; 


// card: carta activa del jugador · lastAction: última acción elegida por este bando
export function chooseAutoAction(card, lastAction = null) {
  const available = getAvailableActions(card);

  // 1. Poder especial si está desbloqueado y sin cooldown
  if (available.includes('special') && Math.random() < SPECIAL_CHANCE) return 'special';

  // 2. Defensa: nunca dos veces seguidas ni si ya está defendiendo
  const canDefend = available.includes('defend') && !card.isDefending && lastAction !== 'defend';
  const lowHp = card.hp / card.maxHp < LOW_HP_RATIO;
  if (canDefend && Math.random() < (lowHp ? DEFEND_CHANCE_LOW_HP : DEFEND_CHANCE_NORMAL)) return 'defend';

  // 3. Ataque: 60 % de las veces uno de los dos más fuertes
  const attacks = available.filter((a) => a.startsWith('attack-'));
  const strong = attacks.filter((a) => a === 'attack-2' || a === 'attack-3');
  if (strong.length && Math.random() < 0.6) return pickRandom(strong);
  return pickRandom(attacks);
}


