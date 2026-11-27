import './battleCard.js';
import './battleControls.js';
import {
  createBattleCard, startTurn, performAction, machineChooseAction, isDefeated, pointsFor,
} from '../../utils/battleEngine.js';
import { coinFlip } from '../../utils/random.js';
import { playSound, SOUNDS, isMuted, setMuted } from '../../utils/audio.js';
import { patchPlayer } from '../../api/playersApi.js';
import { postBattle } from '../../api/battlesApi.js';
import { escapeHtml } from '../../utils/assets.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const other = (side) => (side === 'player' ? 'machine' : 'player');
const NAMES = { player: 'Tú', machine: 'La máquina' };


export class CardBattle extends HTMLElement {
  constructor() {
    super();
    this.finished = false;
    this.busy = true;
    this.mode = 'manual';
    this.autoTimer = null; 
    this.render();
    this.setupEvents();
  }

  render() {
    this.innerHTML =  `
      <section class="battle">
        <div class="battle-top">
          <p class="turn-banner" role="status" aria-live="polite">Preparando el combate…</p>
                    <div class="mode-selector">
            <button class="btn btn-ghost active" data-mode="manual">Modo manual</button>
            <button class="btn btn-ghost" data-mode="automatic">Modo automático</button>
          </div>
          <button class="btn btn-ghost" data-mute>${isMuted() ? '🔇 Sonido apagado' : '🔊 Sonido'}</button>
        </div>
        <div class="arena">
          <div class="side side-machine">
            <div class="pips" data-pips="machine"></div>
            <battle-card id="machine-card"></battle-card>
          </div>
          <div class="versus">VS</div>
          <div class="side side-player">
            <div class="pips" data-pips="player"></div>
            <battle-card id="player-card"></battle-card>
          </div>
        </div>
        <battle-controls></battle-controls>
        <ol class="battle-log" aria-label="Registro del combate"></ol>
        <div class="overlay" hidden></div>
      </section>`;
  }

  connectedCallback() {
    if (this.started || !this.setup) return;
    this.started = true;
    const { player, playerCards, machineCards } = this.setup;
    this.player = player;
    this.deck = {
      player: playerCards.map(createBattleCard),
      machine: machineCards.map(createBattleCard),
    };
    this.idx = { player: 0, machine: 0 };
    this.startedAt = new Date().toISOString();
    this.turnCount = 0;

    this.cardEl('player').show(this.active('player'), 'player');
    this.cardEl('machine').show(this.active('machine'), 'machine');
    playSound(SOUNDS.enter);
    this.renderPips();

    // Sorteo del primer turno
    this.turn = coinFlip() ? 'player' : 'machine';
    this.banner(this.turn === 'player' ? '🎲 Sorteo: ¡empiezas tú!' : '🎲 Sorteo: empieza la máquina', this.turn);
    this.addLog(`Sorteo: empieza ${this.turn === 'player' ? 'el jugador' : 'la máquina'}.`);
    wait(1800).then(() => this.beginTurn());
  }

  disconnectedCallback() {
    this.finished = true;
    this.stopAuto(); 
  }

  // ---------- ayudas ----------
  active(side) { return this.deck[side][this.idx[side]]; }
  cardEl(side) { return this.querySelector(`#${side}-card`); }
  get controls() { return this.querySelector('battle-controls'); }
  get round() { return Math.floor(this.turnCount / 2) + 1; }

  banner(text, side) {
    const b = this.querySelector('.turn-banner');
    b.textContent = text;
    b.dataset.side = side;
  }

  addLog(text) {
    const log = this.querySelector('.battle-log');
    const li = document.createElement('li');
    li.textContent = text;
    log.prepend(li);
    while (log.children.length > 8) log.lastElementChild.remove();
  }

  showEvent(text, kind) {
    const arena = this.querySelector('.arena');
    const el = document.createElement('div');
    el.className = `event-toast event-${kind}`;
    el.textContent = text;
    arena.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  
  autoPlay() {
    const card = this.active('player');
    this.busy = true;
    this.controls.setCard(card, false);
    this.banner(`Ronda ${this.round} · 🤖 Turno automático del jugador…`, 'player');
    clearTimeout(this.autoTimer);
    this.autoTimer = setTimeout(() => {
      this.autoTimer = null;
      if (this.finished || this.mode !== 'automatic' || this.turn !== 'player') return;
      this.execute('player', machineChooseAction(this.active('player')));
    }, 1100);
  }

 
  stopAuto() {
    clearTimeout(this.autoTimer);
    this.autoTimer = null;
  }

  
  setMode(mode) {
    this.mode = mode;
    this.querySelectorAll('[data-mode]').forEach((b) =>
      b.classList.toggle('active', b.dataset.mode === mode)
    );
    this.querySelector('.battle').classList.toggle('is-auto', mode === 'automatic');
    if (this.finished) return;

    if (mode === 'automatic') {
      
      if (this.turn === 'player' && !this.busy) this.autoPlay();
    } else if (this.autoTimer) {
      
      this.stopAuto();
      this.busy = false;
      this.controls.setCard(this.active('player'), true);
      this.banner(`Ronda ${this.round} · Tu turno: elige una acción`, 'player');
    }
  }

  renderPips() {
    ['player', 'machine'].forEach((side) => {
      this.querySelector(`[data-pips="${side}"]`).innerHTML = this.deck[side]
        .map((c, i) => {
          const state = isDefeated(c) ? 'dead' : i === this.idx[side] ? 'current' : 'waiting';
          return `<span class="pip pip-${state}" title="${escapeHtml(c.name)}"></span>`;
        })
        .join('');
    });
  }

 
  beginTurn() {
    if (this.finished) return;
    const card = this.active(this.turn);
    startTurn(card);
    this.cardEl(this.turn).refresh(card);
    this.banner(
      this.turn === 'player'
        ? `Ronda ${this.round} · Tu turno: elige una acción`
        : `Ronda ${this.round} · Turno de la máquina…`,
      this.turn
    );

    if (this.turn === 'player') {
      if (this.mode === 'automatic') {
        this.autoPlay();
        return;
      }
      this.busy = false;
      this.controls.setCard(card, true);
    } else {
      this.busy = true;
      this.controls.setCard(this.active('player'), false);
      wait(1100).then(() => {
        if (!this.finished) this.execute('machine', machineChooseAction(card));
      });
    }
  }

  async execute(side, actionId) {
    this.busy = true;
    this.controls.disable();
    const foe = other(side);
    const attacker = this.active(side);
    const defender = this.active(foe);
    const attackerEl = this.cardEl(side);
    const defenderEl = this.cardEl(foe);

    const result = performAction(attacker, defender, actionId);

    if (result.type === 'defend') {
      playSound(attacker.sounds.defense);
      attackerEl.play('defend');
      this.addLog(`${NAMES[side]}: ${attacker.name} se defiende con ${result.name}.`);
      attackerEl.refresh(attacker);
    } else {
      playSound(result.type === 'special' ? attacker.sounds.special : attacker.sounds.attack);
      attackerEl.play(result.type === 'special' ? 'special' : 'attack');
      await wait(350);
      if (this.finished) return;
      if (result.dodged) {
        playSound(defender.sounds.defense);
        this.showEvent('¡ATAQUE ESQUIVADO!', 'dodge');
        defenderEl.classList.add('dodging');
        setTimeout(() => defenderEl.classList.remove('dodging'), 700);
        defenderEl.floatText('¡Esquivado!');
        this.addLog(`${NAMES[foe]}: ${defender.name} esquivó ${result.name} de ${attacker.name}.`);
      } else {
        defenderEl.play('hit');
        if (result.critical) {
          playSound(attacker.sounds.special);
          this.showEvent('¡GOLPE CRÍTICO!', 'critical');
          defenderEl.classList.add('critical-hit');
          setTimeout(() => defenderEl.classList.remove('critical-hit'), 700);
        }
        defenderEl.floatText(`-${result.damage}${result.critical ? ' 💥' : ''}${result.blocked ? ' 🛡' : ''}`);
        this.addLog(
          `${NAMES[side]}: ${attacker.name} usa ${result.name} y causa ${result.damage} de daño` +
          `${result.critical ? ' (¡CRÍTICO!)' : ''}${result.blocked ? ' (reducido por defensa)' : ''}.`
        );
      }
      defenderEl.refresh(defender);
      attackerEl.refresh(attacker);
    }


    await wait(800);
    if (this.finished) return;

    if (isDefeated(defender)) {
      const ended = await this.handleDefeat(foe);
      if (ended) return;
    }

    this.turn = foe;
    this.turnCount += 1;
    this.beginTurn();
  }

  // Devuelve true si la partida terminó
  async handleDefeat(side) {
    const card = this.active(side);
    this.cardEl(side).play('defeated');
    playSound(card.sounds.defeated);
    this.addLog(`${card.name} (${NAMES[side].toLowerCase()}) fue derrotada.`);
    this.renderPips();
    await wait(1000);
    if (this.finished) return true;

    this.idx[side] += 1;
    if (this.idx[side] >= this.deck[side].length) {
      await this.finish(other(side));
      return true;
    }
    const next = this.active(side);
    const el = this.cardEl(side);
    el.clearState();
    el.show(next, side); // la nueva carta entra con 250 / 250 PV
    playSound(SOUNDS.enter);
    this.addLog(`Entra ${next.name} con ${next.hp} / ${next.maxHp} PV.`);
    this.renderPips();
    await wait(800);
    return this.finished;
  }

  // ---------- fin de partida ----------
  async finish(winnerSide) {
    this.finished = true;
    this.stopAuto();
    this.result = winnerSide === 'player' ? 'win' : 'loss';
    this.points = pointsFor(this.result);
    this.renderPips();
    this.banner(this.result === 'win' ? '🏆 ¡Victoria!' : '💀 Derrota', winnerSide);
    playSound(this.result === 'win' ? SOUNDS.victory : SOUNDS.defeat);
    this.showOverlay('saving');
    await this.saveResult();
  }

  // Guarda en la API: 1) actualiza al jugador (PATCH) 2) registra la batalla (POST).
  // Si falla algo, "Reintentar" repite solo lo que faltó (sin sumar puntos dos veces).
  async saveResult() {
    const p = this.player;
    this.battleRecord ??= {
      id: `battle-${Date.now()}`,
      playerId: p.id,
      nickname: p.nickname,
      result: this.result,
      pointsAwarded: this.points,
      mode: this.mode,
      playerDeck: this.deck.player.map((c) => c.id),
      machineDeck: this.deck.machine.map((c) => c.id),
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
    };
    try {
      if (!this.playerSaved) {
        this.player = await patchPlayer(
          {
            points: p.points + this.points,
            wins: p.wins + (this.result === 'win' ? 1 : 0),
            losses: p.losses + (this.result === 'loss' ? 1 : 0),
            gamesPlayed: p.gamesPlayed + 1,
          },
          p.id
        );
        this.playerSaved = true;
      }
      if (!this.battleSaved) {
        await postBattle(this.battleRecord);
        this.battleSaved = true;
      }
      this.showOverlay('saved');
    } catch (error) {
      console.error(error);
      this.showOverlay('error');
    }
  }

  showOverlay(status) {
    const o = this.querySelector('.overlay');
    o.hidden = false;
    o.dataset.result = this.result;
    const messages = {
      saving: 'Guardando resultado…',
      saved: `+${this.points} puntos · Total: ${this.player.points}`,
      error: 'No se pudo guardar el resultado. Revisa que el servidor (npm run server) esté encendido.',
    };
    o.innerHTML = /* html */ `
      <div class="overlay-box">
        <h2>${this.result === 'win' ? '🏆 ¡Victoria!' : '💀 Derrota'}</h2>
        <p class="overlay-msg" data-status="${status}">${messages[status]}</p>
        <div class="overlay-actions">
          ${status === 'error' ? '<button class="btn btn-primary" data-retry>Reintentar guardado</button>' : ''}
          <button class="btn btn-primary" data-finish="play" ${status === 'saved' ? '' : 'disabled'}>Jugar de nuevo</button>
          <button class="btn btn-ghost" data-finish="leaderboard" ${status === 'saved' ? '' : 'disabled'}>Ver ranking</button>
        </div>
      </div>`;
  }

  setupEvents() {
    this.addEventListener('battle-action', (e) => {
      if (this.busy || this.finished || this.turn !== 'player' || this.mode === 'automatic') return;
      this.execute('player', e.detail.actionId);
    });

    this.addEventListener('click', async (e) => {
      const modeBtn = e.target.closest('[data-mode]');
      if (modeBtn) this.setMode(modeBtn.dataset.mode);
      const mute = e.target.closest('[data-mute]');
      if (mute) {
        setMuted(!isMuted());
        mute.textContent = isMuted() ? '🔇 Sonido apagado' : '🔊 Sonido';
      }
      const finishBtn = e.target.closest('[data-finish]');
      if (finishBtn && !finishBtn.disabled) {
        this.dispatchEvent(
          new CustomEvent('battle-finished', { detail: { next: finishBtn.dataset.finish, player: this.player }, bubbles: true })
        );
      }
      if (e.target.closest('[data-retry]')) {
        this.showOverlay('saving');
        await this.saveResult();
      }
    });
  }
}

customElements.define('card-battle', CardBattle);
