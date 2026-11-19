// Utilidades de azar
export const randomBetween = (min, max) => min + Math.random() * (max - min);
export const coinFlip = () => Math.random() < 0.5;
export const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Devuelve n elementos distintos del arreglo (mezcla Fisher-Yates)
export function pickMany(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
