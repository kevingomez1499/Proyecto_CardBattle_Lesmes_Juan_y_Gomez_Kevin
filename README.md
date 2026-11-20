# Card Battle Arena

**Integrantes:** gomez zafra kevin ricardo_y_lesmes velez juan sebastian_
**Temática:** Criaturas elementales (eléctrico, fuego, agua, planta, hielo, sombra, tierra y viento)

## Descripción
Juego web de cartas de combate: el jugador se registra con un apodo único, elige y ordena 5 cartas y pelea contra 5 cartas elegidas por la máquina. Los puntos se acumulan en un ranking. Un panel de administración protegido permite gestionar las cartas con un CRUD completo (GET, POST, PUT, PATCH, DELETE) usando Fetch API.

## Tecnologías
HTML5, CSS3, JavaScript Vanilla (módulos ES, Web Components, Fetch API), Vite (servidor de desarrollo y build) y JSON Server (API local).

## Instalación
```bash
npm install
```

## Cómo ejecutarlo (dos terminales)
```bash
npm run server   # API JSON Server  → http://localhost:3000
npm run dev      # Vite (la página) → http://localhost:5173
```
Para publicar: `npm run build` (genera la carpeta `dist/`).

## Variables de `.env`
| Variable | Descripción |
|---|---|
| `VITE_API_MODE` | `development` o `production` (se elige con un `switch` en `src/api/apiConfig.js`) |
| `VITE_API_DEV_URL` | URL de la API local (`http://localhost:3000`) |
| `VITE_API_PROD_URL` | URL de la API en producción (MockAPI, Supabase REST, Railway…) |

Hay un `.env.example` con la estructura. No guardes secretos en `.env`.

## Credenciales de administrador (solo evaluación académica)
- Usuario: `administrador`
- Contraseña: `tarjetas2026`

## Estructura principal
```
public/images/cards/   imágenes de las 20 cartas (SVG)
public/sounds/         efectos de sonido (MP3)
src/api/               peticiones fetch (cards, players, admins, battles)
src/components/        Web Components: app, auth, cards (CRUD), deck, battle, leaderboard
src/data/db.json       base de datos con 20 cartas
src/utils/             battleEngine, random, validators, audio, assets
src/app.js             punto de entrada
```

## Reglas del juego
- Cada carta tiene 250 PV, 4 ataques (daño base 20/30/40/50 con factor aleatorio 0.85–1.15), una defensa y un poder especial.
- Se sortea quién empieza y los turnos se alternan.
- **Defensa:** consume el turno y reduce un 50 % el siguiente golpe recibido.
- **Poder especial:** disponible desde el 2.º turno de esa carta; tras usarlo, 3 turnos propios de recarga.
- La carta ganadora **no recupera vida**. Al caer una carta entra la siguiente con 250 PV.
- Gana quien deje al rival sin cartas: **victoria +50 puntos, derrota +10**.
- Para jugar deben existir al menos 10 cartas activas.

## Publicación
1. Sube el repositorio a GitHub.
2. En *Settings → Pages* elige **Source: GitHub Actions** (el workflow `.github/workflows/deploy.yml` ya está incluido).
3. GitHub Pages solo sirve archivos estáticos: **no puede ejecutar JSON Server**. Para producción crea una API compatible (MockAPI, Supabase REST o JSON Server en Railway) con los recursos `cards`, `players`, `admins` y `battles`, y escribe su URL en `VITE_API_PROD_URL` y `VITE_API_MODE=production`.
