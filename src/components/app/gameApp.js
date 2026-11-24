import '../auth/playerRegister.js';
import '../auth/adminLogin.js';
import '../cards/cards.js';
import '../deck/deckSelector.js';
import '../battle/battle.js';
import '../leaderboard/leaderboard.js';
import { getPlayer, addPlayerMatchResult } from '../../api/playersApi.js';
import { escapeHtml } from '../../utils/assets.js';

// Crea un componente "vacío" y le asigna propiedades antes de mostrarlo.
// (document.createElement falla si el constructor del componente dibuja contenido,
// por eso se crea desde un <template>; el navegador lo inicia al insertarlo en la página)
function create(tag, props = {}) {
  const tpl = document.createElement('template');
  tpl.innerHTML = `<${tag}></${tag}>`;
  const el = tpl.content.firstElementChild;
  Object.assign(el, props);
  return el;
}

// Componente raíz: navegación y control de pantallas
export class GameApp extends HTMLElement {
  constructor() {
    super();
    this.player = null;
    this.isAdmin = false;
    this.view = 'play';
    this.render();
    this.setupEvents();
    this.restoreSession();
  }

  render() {
    this.innerHTML = /* html */ `
      <header class="topbar">
        <h1 class="logo">Card Battle Arena</h1>
        <nav class="nav" aria-label="Principal">
          <button data-nav="play">Jugar</button>
          <button data-nav="leaderboard">Ranking</button>
          <button data-nav="admin">Administración</button>
        </nav>
        <div class="who" data-who></div>
      </header>
      <main class="screen" data-screen></main>`;
  }

  async restoreSession() {
    try {
      const id = sessionStorage.getItem('playerId');
      if (id) this.player = await getPlayer(id);
    } catch {
      sessionStorage.removeItem('playerId');
    }
    this.show('play');
  }

  setPlayer(player) {
    this.player = player;
    try {
      player ? sessionStorage.setItem('playerId', player.id) : sessionStorage.removeItem('playerId');
    } catch { /* sin sessionStorage */ }
    this.updateChrome();
  }

  // Cambia de pantalla creando el componente correspondiente
  show(view) {
    this.view = view;
    const screen = this.querySelector('[data-screen]');
    let el;

    if (view === 'play') {
      el = this.player ? create('deck-selector', { player: this.player }) : create('player-register');
    } else if (view === 'battle') {
      el = create('card-battle', { setup: this.battleSetup });
    } else if (view === 'leaderboard') {
      el = create('game-leaderboard', { highlightId: this.player?.id });
    } else if (view === 'admin') {
      el = create(this.isAdmin ? 'cards-admin' : 'admin-login');
    }

    screen.replaceChildren(el);
    this.updateChrome();
    window.scrollTo({ top: 0 });
  }

  updateChrome() {
    const active = this.view === 'battle' ? 'play' : this.view;
    this.querySelectorAll('[data-nav]').forEach((b) =>
      b.setAttribute('aria-current', b.dataset.nav === active ? 'page' : 'false')
    );
    this.querySelector('[data-who]').innerHTML = this.player
      ? `<span class="chip">👤 ${escapeHtml(this.player.nickname)} · ${this.player.points ?? 0} pts</span>
         <button class="link-btn" data-switch>Cambiar jugador</button>`
      : '';
  }

  setupEvents() {
    this.addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (nav) {
        const inBattle = this.view === 'battle' && this.querySelector('card-battle')?.finished === false;
        if (inBattle && !confirm('¿Abandonar la partida en curso? Se perderá el progreso.')) return;
        this.show(nav.dataset.nav);
      }
      if (e.target.closest('[data-switch]')) {
        this.setPlayer(null);
        this.show('play');
      }
    });

    this.addEventListener('player-registered', (e) => {
      this.setPlayer(e.detail.player);
      this.show('play');
    });

    this.addEventListener('deck-ready', (e) => {
      this.battleSetup = { player: this.player, ...e.detail };
      this.show('battle');
    });

    this.addEventListener('battle-finished', async (e) => {
      const detail = e.detail || {};
      const playerId = detail.player?.id || this.player?.id;

      // Si el evento trae datos de resultado (won, points / earnedPoints), suma al historial en la API
      const hasResultPayload =
        typeof detail.won === 'boolean' ||
        typeof detail.points === 'number' ||
        typeof detail.earnedPoints === 'number';

      if (playerId && hasResultPayload) {
        try {
          const earned = detail.earnedPoints ?? detail.points ?? 0;
          const updated = await addPlayerMatchResult(playerId, {
            won: Boolean(detail.won),
            points: earned,
          });
          this.setPlayer(updated);
        } catch (err) {
          console.error('Error actualizando historial del jugador:', err);
          if (detail.player) this.setPlayer(detail.player);
        }
      } else if (detail.player) {
        this.setPlayer(detail.player);
      }

      this.show(detail.next || 'leaderboard');
    });

    this.addEventListener('admin-login', () => {
      this.isAdmin = true;
      this.show('admin');
    });

    this.addEventListener('admin-logout', () => {
      this.isAdmin = false;
      this.show('admin');
    });
  }
}

customElements.define('game-app', GameApp);