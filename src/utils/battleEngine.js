// Motor de combate: funciones, no tocan el DOM.
import { randomBetween, pickRandom } from './random.js';

export const MAX_HP = 250;
export const DEFENSE_REDUCTION = 0.5; // la defensa reduce el siguiente golpe un 50%
export const POINTS = { win: 50, loss: 10 };

// [EXAMEN] Golpe crítico
export const CRIT_CHANCE = 0.12;   // 12 % del  golpe  crítico
export const CRIT_MULTIPLIER = 1.5; // el critico  multiplica el daño ×1.5

// Copia de la carta con el estado de combate
export function createBattleCard(card) {
  return {
    ...structuredClone(card),
    hp: MAX_HP,
    maxHp: MAX_HP,
    isDefending: false,
    turnsPlayed: 0, // turnos propios de esta carta
    cooldown: 0, // turnos propios que faltan para reutilizar el especial
  };
}

// Se llama al comenzar cada turno propio de la carta
export function startTurn(card) {
  card.turnsPlayed += 1;
  if (card.cooldown > 0) card.cooldown -= 1;
}

// daño real = daño base × factor entre 0.85 y 1.15, redondeado
export const calcDamage = (baseDamage) => Math.round(baseDamage * randomBetween(0.85, 1.15));

// [NUEVO] Resuelve el daño de UN ataque en este orden:
// factor aleatorio -> golpe crítico -> defensa -> redondeo.
// `rng` se puede reemplazar en las pruebas para obtener resultados predecibles.
export function resolveDamage(baseDamage, defenderIsDefending = false, rng = Math.random) {
  // 2. Factor aleatorio de daño (sin redondear todavía)
  const factor = 0.85 + rng() * 0.3;
  let damage = baseDamage * factor;

  // 3. ¿Golpe crítico? (12 %) -> daño × 1.5
  const critical = rng() < CRIT_CHANCE;
  if (critical) damage *= CRIT_MULTIPLIER;

  // 4. ¿El defensor estaba defendiendo? Reducción del 50 %
  const blocked = defenderIsDefending;
  if (blocked) damage *= 1 - DEFENSE_REDUCTION;

  // 5. Redondear el daño final
  return { damage: Math.round(damage), critical, blocked, factor };
}

export function specialStatus(card) {
  if (card.cooldown > 0) return { ready: false, kind: 'cooldown', label: `Recarga: ${card.cooldown}` };
  const unlock = card.special.unlockTurn ?? 2;
  if (card.turnsPlayed < unlock) {
    const left = unlock - card.turnsPlayed;
    return { ready: false, kind: 'locked', label: `Bloqueado: ${left} turno${left > 1 ? 's' : ''}` };
  }
  return { ready: true, kind: 'ready', label: 'Listo' };
}

export const canUseSpecial = (card) => specialStatus(card).ready;

// Acciones válidas ahora mismo: 'attack-0'..'attack-3', 'defend', 'special'
export function getAvailableActions(card) {
  const actions = ['attack-0', 'attack-1', 'attack-2', 'attack-3', 'defend'];
  if (canUseSpecial(card)) actions.push('special');
  return actions;
}

// [NUEVO] ¿La acción está permitida ahora mismo para esta carta?
export const isValidAction = (card, actionId) => getAvailableActions(card).includes(actionId);

// "IA" solo reglas simples y azar
export function machineChooseAction(card) {
  const available = getAvailableActions(card);
  if (available.includes('special') && Math.random() < 0.6) return 'special';
  const options = available.filter((a) => a !== 'special' && !(a === 'defend' && card.isDefending));
  return pickRandom(options);
}

// Ejecuta una acción. Modifica las cartas y devuelve un resumen para la interfaz:
// { type, name, damage, blocked, critical }
export function performAction(attacker, defender, actionId, rng = Math.random) {
  if (!isValidAction(attacker, actionId)) {
    throw new Error('Acción no válida o bloqueada.');
  }

  if (actionId === 'defend') {
    attacker.isDefending = true;
    return { type: 'defend', name: attacker.defense.name, damage: 0, blocked: false, critical: false };
  }

  let type = 'attack';
  let move;
  if (actionId === 'special') {
    type = 'special';
    move = attacker.special;
    attacker.cooldown = attacker.special.cooldown ?? 3;
  } else {
    move = attacker.attacks[Number(actionId.split('-')[1])];
  }

  // Factor, crítico, defensa y redondeo (ver resolveDamage)
  const outcome = resolveDamage(move.baseDamage, defender.isDefending, rng);

  // La defensa se consume al recibir el golpe
  if (outcome.blocked) defender.isDefending = false;

  // Restar HP (nunca por debajo de 0)
  defender.hp = Math.max(0, defender.hp - outcome.damage);

  return { type, name: move.name, ...outcome };
}

export const isDefeated = (card) => card.hp <= 0;
export const pointsFor = (result) => POINTS[result];
