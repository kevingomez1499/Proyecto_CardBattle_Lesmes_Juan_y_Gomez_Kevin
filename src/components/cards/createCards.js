import { postCard } from '../../api/cardsApi.js';
import { emptyCard, openCardDialog } from './cardForm.js';

// CREATE → POST /cards
export function createCard(onSaved) {
  openCardDialog({
    title: 'Nueva carta',
    card: emptyCard(),
    submitLabel: 'Crear carta',
    onSubmit: async (data) => {
      await postCard({ ...data, id: `card-${Date.now().toString(36)}` });
      onSaved('Carta creada (POST).');
    },
  });
}
