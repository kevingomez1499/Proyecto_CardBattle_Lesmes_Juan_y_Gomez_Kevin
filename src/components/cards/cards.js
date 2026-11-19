import { getCards } from '../../api/cardsApi.js';
import { createCard } from './createCards.js';
import { editCardFull, toggleCardActive } from './editCards.js';
import { removeCard } from './deleteCards.js';
import { asset, escapeHtml } from '../../utils/assets.js';

// Componente principal del CRUD de cartas (listado + acciones)
export class CardsAdmin extends HTMLElement {
  constructor() {
    super();
    this.cards = [];
    this.notice = null;
    this.status = 'loading';
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
      this.cards = await getCards(); // GET
      this.status = 'ready';
    } catch (err) {
      console.error(err);
      this.status = 'error';
    }
    this.render();
  }

  // Se pasa a los componentes de crear/editar/eliminar: muestra aviso y recarga
  done = (text) => {
    this.notice = { text, kind: 'success' };
    this.load();
  };

  fail(text) {
    this.notice = { text, kind: 'error' };
    this.render();
  }

  render() {
    if (this.status === 'loading') {
      this.innerHTML = '<p class="state state-loading">Cargando cartas…</p>';
      return;
    }
    if (this.status === 'error') {
      this.innerHTML = '<div class="state state-error"><p>No se pudieron cargar las cartas.</p><button class="btn btn-primary" data-reload>Reintentar</button></div>';
      return;
    }
    const activeCount = this.cards.filter((c) => c.active).length;
    const rows = this.cards
      .map(
        (c) => /* html */ `
        <article class="adm-card ${c.active ? '' : 'is-inactive'}">
          <img src="${asset(c.image)}" alt="" loading="lazy" />
          <div class="adm-info">
            <h3>${escapeHtml(c.name)} <small>${escapeHtml(c.type)}</small></h3>
            <p>${escapeHtml(c.description)}</p>
            <p class="adm-state">${c.active ? 'Activa' : 'Inactiva'} · Especial: ${escapeHtml(c.special.name)}</p>
          </div>
          <div class="adm-actions">
            <button class="btn btn-small" data-edit="${c.id}">Editar (PUT)</button>
            <button class="btn btn-small btn-ghost" data-toggle="${c.id}">${c.active ? 'Desactivar' : 'Activar'} (PATCH)</button>
            <button class="btn btn-small btn-danger" data-delete="${c.id}">Eliminar</button>
          </div>
        </article>`
      )
      .join('');

    this.innerHTML = /* html */ `
      <section class="admin">
        <header class="admin-head">
          <div>
            <h2>Gestión de cartas</h2>
            <p>${this.cards.length} cartas · ${activeCount} activas${activeCount < 10 ? ' · ⚠ Se necesitan al menos 10 activas para jugar' : ''}</p>
          </div>
          <div class="admin-tools">
            <button class="btn btn-primary" data-create>+ Nueva carta (POST)</button>
            <button class="btn btn-ghost" data-logout>Cerrar sesión</button>
          </div>
        </header>
        <p class="admin-note"><b>PUT</b> reemplaza la carta completa con el formulario. <b>PATCH</b> cambia solo un campo (activar/desactivar).</p>
        ${this.notice ? `<p class="notice notice-${this.notice.kind}" role="status">${escapeHtml(this.notice.text)}</p>` : ''}
        <div class="adm-list">${rows || '<p class="state">No hay cartas. Crea la primera.</p>'}</div>
      </section>`;
  }

  setupEvents() {
    this.addEventListener('click', async (e) => {
      const find = (attr) => this.cards.find((c) => c.id === e.target.closest(`[${attr}]`)?.getAttribute(attr));
      try {
        if (e.target.closest('[data-reload]')) return this.load();
        if (e.target.closest('[data-logout]')) {
          return this.dispatchEvent(new CustomEvent('admin-logout', { bubbles: true }));
        }
        if (e.target.closest('[data-create]')) return createCard(this.done);
        const edit = find('data-edit');
        if (edit) return editCardFull(edit, this.done);
        const toggle = find('data-toggle');
        if (toggle) return await toggleCardActive(toggle, this.done);
        const del = find('data-delete');
        if (del) return await removeCard(del, this.done);
      } catch (err) {
        console.error(err);
        this.fail('Ocurrió un error al comunicarse con el servidor.');
      }
    });
  }
}

customElements.define('cards-admin', CardsAdmin);
