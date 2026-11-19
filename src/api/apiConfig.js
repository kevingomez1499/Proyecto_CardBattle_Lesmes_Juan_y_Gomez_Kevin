// Selección del entorno con switch (desarrollo / producción) según el archivo .env
let API_URL;

switch (import.meta.env.VITE_API_MODE) {
  case 'production':
    API_URL = import.meta.env.VITE_API_PROD_URL;
    break;
  case 'development':
  default:
    API_URL = import.meta.env.VITE_API_DEV_URL || 'http://localhost:3000';
    break;
}

export { API_URL };

// Función común para todas las peticiones. Lanza un error si la respuesta no es correcta.
export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar ${path}`);
  }
  // DELETE devuelve un cuerpo vacío en json-server ({}), por eso se protege el parseo
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
