import { MAX_HP, specialStatus } from '../../utils/battleEngine.js';
import { asset, escapeHtml } from '../../utils/assets.js';

// Carta en combate. Se crea una vez y luego se actualiza (para no cortar las animaciones).
export class BattleCard extends HTMLElement {
  constructor() {
    super();
    this.render();
  }

  render() {
    this.innerHTML = /* html */ `
      <article class="bc">
        <div class="bc-art"><img alt="" /></div>
        <div class="bc-head"><h3 class="bc-name"></h3><span class="bc-type"></span></div>
        <div class="bc-hp" role="progressbar" aria-valuemin="0" aria-valuemax="${MAX_HP}"><div class="bc-hp-fill"></div></div>
        <p class="bc-hp-text"></p>
        <div class="bc-badges"></div>
        <div class="bc-fx" aria-hidden="true"></div>
      </article>`;
  }

  get box() {
    return this.querySelector('.bc');
  }

  // Muestra una carta nueva (con animación de entrada)
  show(card, side) {
    this.box.dataset.side = side;
    this.querySelector('img').src = asset(card.image);
    this.querySelector('img').alt = card.name;
    this.querySelector('.bc-name').textContent = card.name;
    this.querySelector('.bc-type').textContent = card.type;
    this.refresh(card);
    this.play('enter');
  }

  // Actualiza vida y estados
  refresh(card) {
    const pct = Math.max(0, (card.hp / card.maxHp) * 100);
    const fill = this.querySelector('.bc-hp-fill');
    fill.style.width = `${pct}%`;
    fill.dataset.level = pct < 30 ? 'low' : pct < 60 ? 'mid' : 'high';
    this.querySelector('.bc-hp').setAttribute('aria-valuenow', card.hp);
    this.querySelector('.bc-hp-text').textContent = `${card.hp} / ${card.maxHp} PV`;

    const sp = specialStatus(card);
    const icon = { ready: '✨', locked: '🔒', cooldown: '⏳' }[sp.kind];
    this.querySelector('.bc-badges').innerHTML = `
      ${card.isDefending ? '<span class="badge badge-shield">🛡 En guardia</span>' : ''}
      <span class="badge badge-${sp.kind}">${icon} Especial: ${escapeHtml(sp.label)}</span>`;
    this.box.classList.toggle('is-defending', card.isDefending);
  }

  // Lanza una animación CSS (clase temporal)
  play(name) {
    const box = this.box;
    const cls = `anim-${name}`;
    box.classList.remove(cls);
    void box.offsetWidth; // reinicia la animación
    box.classList.add(cls);
    if (name !== 'defeated') box.addEventListener('animationend', () => box.classList.remove(cls), { once: true });
  }

  clearState() {
    this.box.className = 'bc';
  }

  // Texto flotante (daño recibido, etc.)
  floatText(text, kind = 'damage') {
    const span = document.createElement('span');
    span.className = `bc-float bc-float-${kind}`;
    span.textContent = text;
    this.querySelector('.bc-fx').append(span);
    span.addEventListener('animationend', () => span.remove(), { once: true });
  }
}

customElements.define('battle-card', BattleCard);
