import { deleteCard } from '../../api/cardsApi.js';

// DELETE → DELETE /cards/:id
export async function removeCard(card, onDeleted) {
  if (!confirm(`¿Eliminar "${card.name}"? Esta acción no se puede deshacer.`)) return;
  await deleteCard(card.id);
  onDeleted(`"${card.name}" eliminada (DELETE).`);
}
