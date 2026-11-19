import { specialStatus } from '../../utils/battleEngine.js';
import { escapeHtml } from '../../utils/assets.js';

// Botones de acción del jugador. Emite el evento "battle-action".
export class BattleControls extends HTMLElement {
  constructor() {
    super();
    this.render();
    this.setupEvents();
  }

  render() {
    this.innerHTML = '<div class="bctl"><p class="bctl-empty">Esperando el turno…</p></div>';
  }

  // card: carta activa del jugador · enabled: si es su turno
  setCard(card, enabled) {
    const sp = specialStatus(card);
    const attacks = card.attacks
      .map(
        (a, i) => `
        <button class="act act-attack" data-action="attack-${i}" ${enabled ? '' : 'disabled'}>
          <span class="act-name">${escapeHtml(a.name)}</span>
          <span class="act-meta">Daño ~${a.baseDamage}</span>
        </button>`
      )
      .join('');

    this.innerHTML = /* html */ `
      <div class="bctl">
        <div class="bctl-attacks">${attacks}</div>
        <div class="bctl-extra">
          <button class="act act-defense" data-action="defend" ${enabled ? '' : 'disabled'}>
            <span class="act-name">🛡 ${escapeHtml(card.defense.name)}</span>
            <span class="act-meta">Reduce el próximo golpe 50%</span>
          </button>
          <button class="act act-special" data-action="special" data-state="${sp.kind}" ${enabled && sp.ready ? '' : 'disabled'}>
            <span class="act-name">✨ ${escapeHtml(card.special.name)}</span>
            <span class="act-meta">${sp.ready ? `Daño ~${card.special.baseDamage}` : escapeHtml(sp.label)}</span>
          </button>
        </div>
      </div>`;
  }

  disable() {
    this.querySelectorAll('button').forEach((b) => (b.disabled = true));
  }

  setupEvents() {
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn || btn.disabled) return;
      this.dispatchEvent(new CustomEvent('battle-action', { detail: { actionId: btn.dataset.action }, bubbles: true }));
    });
  }
}

customElements.define('battle-controls', BattleControls);
