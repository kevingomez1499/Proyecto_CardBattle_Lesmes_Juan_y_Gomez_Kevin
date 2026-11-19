// Motor de combate: funciones puras, no tocan el DOM.
import { randomBetween, pickRandom } from './random.js';

export const MAX_HP = 250;
export const DEFENSE_REDUCTION = 0.5; // la defensa reduce el siguiente golpe un 50%
export const POINTS = { win: 50, loss: 10 };

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

// "IA" de la máquina: sin inteligencia real, solo reglas simples y azar
export function machineChooseAction(card) {
  const available = getAvailableActions(card);
  if (available.includes('special') && Math.random() < 0.6) return 'special';
  const options = available.filter((a) => a !== 'special' && !(a === 'defend' && card.isDefending));
  return pickRandom(options);
}

// Ejecuta una acción. Modifica las cartas y devuelve un resumen para la interfaz.
export function performAction(attacker, defender, actionId) {
  if (actionId === 'defend') {
    attacker.isDefending = true;
    return { type: 'defend', name: attacker.defense.name, damage: 0, blocked: false };
  }

  let type = 'attack';
  let move;
  if (actionId === 'special') {
    if (!canUseSpecial(attacker)) throw new Error('El poder especial no está disponible.');
    type = 'special';
    move = attacker.special;
    attacker.cooldown = attacker.special.cooldown ?? 3;
  } else {
    move = attacker.attacks[Number(actionId.split('-')[1])];
  }

  let damage = calcDamage(move.baseDamage);
  const blocked = defender.isDefending;
  if (blocked) {
    damage = Math.round(damage * (1 - DEFENSE_REDUCTION));
    defender.isDefending = false; // la defensa se consume
  }
  defender.hp = Math.max(0, defender.hp - damage);
  return { type, name: move.name, damage, blocked };
}

export const isDefeated = (card) => card.hp <= 0;
export const pointsFor = (result) => POINTS[result];
