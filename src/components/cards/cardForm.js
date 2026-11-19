import { escapeHtml } from '../../utils/assets.js';
import { validateCard } from '../../utils/validators.js';

export const emptyCard = () => ({
  name: '', type: '', image: 'images/cards/', description: '', hp: 250,
  attacks: [20, 30, 40, 50].map((d, i) => ({ id: `attack-0${i + 1}`, name: '', baseDamage: d })),
  defense: { name: '', damageReduction: 0.5 },
  special: { name: '', baseDamage: 62, unlockTurn: 2, cooldown: 3 },
  sounds: { attack: 'sounds/attack-electric.mp3', defense: 'sounds/defense-electric.mp3', special: 'sounds/special-electric.mp3', defeated: 'sounds/defeated.mp3' },
  active: true,
});

const v = (x) => escapeHtml(x);

function formHTML(c) {
  const attacks = c.attacks
    .map(
      (a, i) => `
      <div class="f-row">
        <input name="atk-name-${i}" placeholder="Ataque ${i + 1}" value="${v(a.name)}" required />
        <input name="atk-dmg-${i}" type="number" min="10" max="50" value="${a.baseDamage}" aria-label="Daño ataque ${i + 1}" />
      </div>`
    )
    .join('');
  return /* html */ `
    <label>Nombre<input name="name" value="${v(c.name)}" required /></label>
    <label>Tipo / elemento<input name="type" value="${v(c.type)}" required /></label>
    <label>Imagen (ruta)<input name="image" value="${v(c.image)}" required /></label>
    <label>Descripción<textarea name="description" rows="2">${v(c.description)}</textarea></label>
    <fieldset><legend>4 ataques (nombre y daño base 10–50)</legend>${attacks}</fieldset>
    <fieldset><legend>Defensa y poder especial</legend>
      <div class="f-row"><input name="def-name" placeholder="Nombre de la defensa" value="${v(c.defense.name)}" required /></div>
      <div class="f-row">
        <input name="sp-name" placeholder="Nombre del poder especial" value="${v(c.special.name)}" required />
        <input name="sp-dmg" type="number" min="55" max="70" value="${c.special.baseDamage}" aria-label="Daño del especial" />
      </div>
    </fieldset>
    <fieldset><legend>Sonidos (rutas)</legend>
      <input name="snd-attack" value="${v(c.sounds.attack)}" aria-label="Sonido de ataque" />
      <input name="snd-defense" value="${v(c.sounds.defense)}" aria-label="Sonido de defensa" />
      <input name="snd-special" value="${v(c.sounds.special)}" aria-label="Sonido especial" />
      <input name="snd-defeated" value="${v(c.sounds.defeated)}" aria-label="Sonido de derrota" />
    </fieldset>
    <label class="check"><input type="checkbox" name="active" ${c.active ? 'checked' : ''} /> Carta activa</label>`;
}

// Convierte el formulario en un objeto carta completo (para POST o PUT)
export function readCardForm(form, base) {
  const f = new FormData(form);
  const s = (k) => String(f.get(k) ?? '').trim();
  return {
    ...(base.id ? { id: base.id } : {}),
    name: s('name'),
    type: s('type'),
    image: s('image'),
    description: s('description'),
    hp: 250,
    attacks: [0, 1, 2, 3].map((i) => ({ id: `attack-0${i + 1}`, name: s(`atk-name-${i}`), baseDamage: Number(f.get(`atk-dmg-${i}`)) })),
    defense: { name: s('def-name'), damageReduction: 0.5 },
    special: { name: s('sp-name'), baseDamage: Number(f.get('sp-dmg')), unlockTurn: 2, cooldown: 3 },
    sounds: { attack: s('snd-attack'), defense: s('snd-defense'), special: s('snd-special'), defeated: s('snd-defeated') },
    active: f.get('active') === 'on',
    createdAt: base.createdAt ?? new Date().toISOString(),
  };
}

// Abre un <dialog> con el formulario. onSubmit(card) debe guardar y puede lanzar error.
export function openCardDialog({ title, card, submitLabel, onSubmit }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'card-dialog';
  dialog.innerHTML = /* html */ `
    <form class="card-form" novalidate>
      <h3>${v(title)}</h3>
      ${formHTML(card)}
      <p class="form-msg" role="alert" aria-live="polite"></p>
      <div class="f-actions">
        <button type="button" class="btn btn-ghost" data-cancel>Cancelar</button>
        <button type="submit" class="btn btn-primary">${v(submitLabel)}</button>
      </div>
    </form>`;
  document.body.append(dialog);
  const form = dialog.querySelector('form');
  const msg = dialog.querySelector('.form-msg');
  const close = () => { dialog.close(); dialog.remove(); };

  dialog.querySelector('[data-cancel]').addEventListener('click', close);
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = readCardForm(form, card);
    const error = validateCard(data);
    if (error) { msg.textContent = error; return; }
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    msg.textContent = 'Guardando…';
    try {
      await onSubmit(data);
      close();
    } catch (err) {
      console.error(err);
      msg.textContent = 'No se pudo guardar. Revisa la conexión con el servidor.';
      btn.disabled = false;
    }
  });
  dialog.showModal();
}
