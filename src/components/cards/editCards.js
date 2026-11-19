import { putCard, patchCard } from '../../api/cardsApi.js';
import { openCardDialog } from './cardForm.js';

// UPDATE completo → PUT /cards/:id  (se envía la carta ENTERA y reemplaza a la anterior)
export function editCardFull(card, onSaved) {
  openCardDialog({
    title: `Editar ${card.name}`,
    card,
    submitLabel: 'Guardar cambios',
    onSubmit: async (data) => {
      await putCard(data, card.id);
      onSaved(`"${data.name}" reemplazada completa (PUT).`);
    },
  });
}

// UPDATE parcial → PATCH /cards/:id  (solo se envía el campo "active")
export async function toggleCardActive(card, onSaved) {
  await patchCard({ active: !card.active }, card.id);
  onSaved(`"${card.name}" ${card.active ? 'desactivada' : 'activada'} (PATCH).`);
}
