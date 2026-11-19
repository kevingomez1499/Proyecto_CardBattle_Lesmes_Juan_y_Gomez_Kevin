import { getCards } from '../../api/cardsApi.js';
import { pickMany } from '../../utils/random.js';
import { asset, escapeHtml } from '../../utils/assets.js';

const DECK_SIZE = 5;
const MIN_ACTIVE = 10;

// Selección (exactamente 5 cartas) y orden del mazo.
// Antes de añadirlo al DOM:  el.player = jugador
export class DeckSelector extends HTMLElement {
  constructor() {
    super();
    this.cards = [];
    this.selected = []; // ids en el orden de combate
    this.status = 'loading'; // loading | error | ready
    this.message = '';
    this.render();
    this.setupEvents();
  }

  connectedCallback() {
    this.load();
  }

  async load() {
    this.status = 'loading';
    this.render();
    try {
      const all = await getCards(); // GET
      this.cards = all.filter((c) => c.active);
      this.status = 'ready';
    } catch (err) {
      console.error(err);
      this.status = 'error';
    }
    this.render();
  }

  byId(id) {
    return this.cards.find((c) => c.id === id);
  }

  render() {
    if (this.status === 'loading') {
      this.innerHTML = '<p class="state state-loading">Cargando cartas…</p>';
      return;
    }
    if (this.status === 'error') {
      this.innerHTML = `<div class="state state-error"><p>No se pudieron cargar las cartas. ¿Está encendido el servidor (npm run server)?</p>
        <button class="btn btn-primary" data-retry>Reintentar</button></div>`;
      return;
    }
    if (this.cards.length < MIN_ACTIVE) {
      this.innerHTML = `<div class="state state-error"><p>Hay solo ${this.cards.length} cartas activas. Se necesitan al menos ${MIN_ACTIVE} para jugar.
        Activa más cartas desde el panel de administración.</p></div>`;
      return;
    }

    const count = this.selected.length;
    const full = count === DECK_SIZE;
    const grid = this.cards
      .map((c) => {
        const pos = this.selected.indexOf(c.id);
        const isSel = pos >= 0;
        return /* html */ `
        <button class="pick ${isSel ? 'is-selected' : ''}" data-pick="${c.id}" aria-pressed="${isSel}" ${full && !isSel ? 'data-full="true"' : ''}>
          <img src="${asset(c.image)}" alt="" loading="lazy" />
          <span class="pick-name">${escapeHtml(c.name)}</span>
          <span class="pick-type">${escapeHtml(c.type)}</span>
          <span class="pick-stats">❤ ${c.hp} · ✨ ${c.special.baseDamage}</span>
          ${isSel ? `<span class="pick-order">${pos + 1}</span>` : ''}
        </button>`;
      })
      .join('');

    const slots = Array.from({ length: DECK_SIZE }, (_, i) => {
      const card = this.byId(this.selected[i]);
      if (!card) return `<li class="slot slot-empty"><span class="slot-num">${i + 1}</span> Vacío</li>`;
      return /* html */ `
        <li class="slot">
          <span class="slot-num">${i + 1}</span>
          <img src="${asset(card.image)}" alt="" />
          <span class="slot-name">${escapeHtml(card.name)}</span>
          <span class="slot-btns">
            <button class="icon-btn" data-up="${i}" aria-label="Subir ${escapeHtml(card.name)}" ${i === 0 ? 'disabled' : ''}>▲</button>
            <button class="icon-btn" data-down="${i}" aria-label="Bajar ${escapeHtml(card.name)}" ${i === count - 1 ? 'disabled' : ''}>▼</button>
            <button class="icon-btn" data-remove="${card.id}" aria-label="Quitar ${escapeHtml(card.name)}">✕</button>
          </span>
        </li>`;
    }).join('');

    this.innerHTML = /* html */ `
      <section class="deck">
        <header class="deck-head">
          <div>
            <h2>Arma tu mazo, ${escapeHtml(this.player?.nickname ?? '')}</h2>
            <p class="deck-help">Elige 5 cartas distintas y ordénalas: la de arriba combate primero.</p>
          </div>
          <p class="deck-counter ${full ? 'is-full' : ''}" role="status">${count} / ${DECK_SIZE} seleccionadas</p>
        </header>
        <div class="deck-layout">
          <div class="pick-grid">${grid}</div>
          <aside class="deck-order">
            <h3>Orden de combate</h3>
            <ol class="slots">${slots}</ol>
            <p class="form-msg" role="alert" aria-live="polite" data-kind="error">${this.message}</p>
            <button class="btn btn-primary btn-block" data-start ${full ? '' : 'disabled'}>¡A combatir!</button>
          </aside>
        </div>
      </section>`;
  }

  setupEvents() {
    this.addEventListener('click', (e) => {
      if (e.target.closest('[data-retry]')) return this.load();

      const pick = e.target.closest('[data-pick]');
      if (pick) {
        const id = pick.dataset.pick;
        if (this.selected.includes(id)) {
          this.selected = this.selected.filter((x) => x !== id);
          this.message = '';
        } else if (this.selected.length >= DECK_SIZE) {
          this.message = 'Ya elegiste 5 cartas. Quita una para cambiarla.';
        } else {
          this.selected.push(id);
          this.message = '';
        }
        return this.render();
      }

      const up = e.target.closest('[data-up]');
      const down = e.target.closest('[data-down]');
      if (up || down) {
        const i = Number((up || down).dataset.up ?? (up || down).dataset.down);
        const j = up ? i - 1 : i + 1;
        [this.selected[i], this.selected[j]] = [this.selected[j], this.selected[i]];
        return this.render();
      }

      const remove = e.target.closest('[data-remove]');
      if (remove) {
        this.selected = this.selected.filter((x) => x !== remove.dataset.remove);
        this.message = '';
        return this.render();
      }

      if (e.target.closest('[data-start]')) this.startBattle();
    });
  }

  startBattle() {
    if (this.selected.length !== DECK_SIZE) return;
    const playerCards = this.selected.map((id) => this.byId(id));
    // La máquina elige 5 cartas distintas entre las que el jugador NO eligió
    const rest = this.cards.filter((c) => !this.selected.includes(c.id));
    const machineCards = pickMany(rest, DECK_SIZE);
    this.dispatchEvent(new CustomEvent('deck-ready', { detail: { playerCards, machineCards }, bubbles: true }));
  }
}

customElements.define('deck-selector', DeckSelector);
