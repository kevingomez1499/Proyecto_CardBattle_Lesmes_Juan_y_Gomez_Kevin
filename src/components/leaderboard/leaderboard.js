import { getPlayers } from '../../api/playersApi.js';
import { escapeHtml } from '../../utils/assets.js';

const MEDALS = ['🥇', '🥈', '🥉'];

// Tabla de clasificación con podio para el Top 3.
// Opcional antes de añadirlo:  el.highlightId = id del jugador actual
export class GameLeaderboard extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = '<p class="state state-loading">Cargando ranking…</p>';
  }

  connectedCallback() {
    this.load();
  }

  async load() {
    try {
      const players = await getPlayers(); // GET
      const sorted = [...players].sort((a, b) => b.points - a.points || b.wins - a.wins);
      this.render(sorted);
    } catch (err) {
      console.error(err);
      this.innerHTML = '<div class="state state-error"><p>No se pudo cargar el ranking.</p></div>';
    }
  }

  render(players) {
    if (!players.length) {
      this.innerHTML = '<div class="state"><p>Aún no hay jugadores. ¡Sé el primero en la tabla!</p></div>';
      return;
    }
    const me = (p) => (p.id === this.highlightId ? 'is-me' : '');
    const podiumOrder = [1, 0, 2].filter((i) => players[i]); // 2.º, 1.º, 3.º
    const podium = podiumOrder
      .map((i) => {
        const p = players[i];
        return /* html */ `
        <div class="podium-spot place-${i + 1} ${me(p)}">
          <span class="podium-medal">${MEDALS[i]}</span>
          <strong class="podium-name">${escapeHtml(p.nickname)}</strong>
          <span class="podium-points">${p.points} pts</span>
          <span class="podium-meta">${p.wins} victorias · ${p.gamesPlayed} partidas</span>
          <span class="podium-block">${i + 1}.º</span>
        </div>`;
      })
      .join('');

    const rows = players
      .slice(3)
      .map(
        (p, k) => `
        <tr class="${me(p)}">
          <td>${k + 4}</td><td>${escapeHtml(p.nickname)}</td><td>${p.points}</td><td>${p.wins}</td><td>${p.gamesPlayed}</td>
        </tr>`
      )
      .join('');

    this.innerHTML = /* html */ `
      <section class="board">
        <h2>Ranking</h2>
        <div class="podium">${podium}</div>
        ${
          rows
            ? `<div class="table-wrap"><table class="board-table">
                <thead><tr><th>#</th><th>Apodo</th><th>Puntos</th><th>Victorias</th><th>Partidas</th></tr></thead>
                <tbody>${rows}</tbody></table></div>`
            : ''
        }
      </section>`;
  }
}

customElements.define('game-leaderboard', GameLeaderboard);
