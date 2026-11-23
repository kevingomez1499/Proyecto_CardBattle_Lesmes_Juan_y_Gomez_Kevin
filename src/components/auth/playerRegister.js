import { findPlayerByNickname, postPlayer } from '../../api/playersApi.js';
import { validateNickname } from '../../utils/validators.js';

// Entrada o registro del jugador con apodo único (se valida consultando la API)
export class PlayerRegister extends HTMLElement {
  constructor() {
    super();
    this.render();
    this.setupEvents();
  }

  render() {
    this.innerHTML = /* html */ `
      <section class="auth-card">
        <h2>Entra a la arena</h2>
        <p class="auth-help">Escribe tu apodo para entrar o crear uno nuevo y acumular puntos en el ranking.</p>
        <form class="auth-form" novalidate>
          <label for="nickname">Apodo</label>
          <input id="nickname" name="nickname" type="text" maxlength="16" autocomplete="off" placeholder="Ej: JCMASTER" />
          <p class="form-msg" role="alert" aria-live="polite"></p>
          <button class="btn btn-primary" type="submit">Entrar a jugar</button>
        </form>
      </section>`;
  }

  setMessage(text, kind = 'error') {
    const msg = this.querySelector('.form-msg');
    msg.textContent = text;
    msg.dataset.kind = kind;
  }

  setupEvents() {
    this.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = this.querySelector('#nickname');
      const button = this.querySelector('button[type="submit"]');
      const nickname = input.value.trim();

      const error = validateNickname(nickname);
      if (error) return this.setMessage(error);

      button.disabled = true;
      this.setMessage('Comprobando apodo…', 'info');
      try {
        const existing = await findPlayerByNickname(nickname); // GET
        if (existing) {
          this.setMessage(`¡Bienvenido de nuevo, ${existing.nickname}! Cargando historial…`, 'info');
          this.dispatchEvent(
            new CustomEvent('player-registered', {
              detail: { player: existing, isReturning: true },
              bubbles: true,
            })
          );
          return;
        }

        const player = await postPlayer({
          id: `player-${Date.now().toString(36)}`,
          nickname,
          points: 0,
          wins: 0,
          losses: 0,
          gamesPlayed: 0,
          createdAt: new Date().toISOString(),
        }); // POST

        this.dispatchEvent(
          new CustomEvent('player-registered', {
            detail: { player, isReturning: false },
            bubbles: true,
          })
        );
      } catch (err) {
        console.error(err);
        this.setMessage('No se pudo conectar con el servidor. ¿Está encendido (npm run server)?');
        button.disabled = false;
      }
    });
  }
}

customElements.define('player-register', PlayerRegister);