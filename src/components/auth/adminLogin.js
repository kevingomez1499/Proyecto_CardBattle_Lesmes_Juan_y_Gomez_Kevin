import { loginAdmin } from '../../api/adminsApi.js';

// Inicio de sesión del administrador (solo con fines académicos)
export class AdminLogin extends HTMLElement {
  constructor() {
    super();
    this.render();
    this.setupEvents();
  }

  render() {
    this.innerHTML = /* html */ `
      <section class="auth-card">
        <h2>Panel de administración</h2>
        <p class="auth-help">Ingresa tus credenciales para gestionar las cartas.</p>
        <form class="auth-form" novalidate>
          <label for="admin-user">Usuario</label>
          <input id="admin-user" name="username" type="text" autocomplete="username" />
          <label for="admin-pass">Contraseña</label>
          <input id="admin-pass" name="password" type="password" autocomplete="current-password" />
          <p class="form-msg" role="alert" aria-live="polite"></p>
          <button class="btn btn-primary" type="submit">Iniciar sesión</button>
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
      const username = this.querySelector('#admin-user').value.trim();
      const password = this.querySelector('#admin-pass').value;
      if (!username || !password) return this.setMessage('Escribe usuario y contraseña.');

      const button = this.querySelector('button[type="submit"]');
      button.disabled = true;
      this.setMessage('Validando…', 'info');
      try {
        const admin = await loginAdmin(username, password);
        if (!admin) {
          this.setMessage('Usuario o contraseña incorrectos.');
          button.disabled = false;
          return;
        }
        this.dispatchEvent(new CustomEvent('admin-login', { detail: { admin }, bubbles: true }));
      } catch (err) {
        console.error(err);
        this.setMessage('No se pudo conectar con el servidor.');
        button.disabled = false;
      }
    });
  }
}

customElements.define('admin-login', AdminLogin);
