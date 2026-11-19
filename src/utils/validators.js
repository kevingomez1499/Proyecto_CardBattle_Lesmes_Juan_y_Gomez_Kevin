export function validateNickname(value) {
  const nick = value.trim();
  if (!nick) return 'El apodo es obligatorio.';
  if (nick.length < 3) return 'El apodo debe tener al menos 3 caracteres.';
  if (nick.length > 16) return 'El apodo puede tener máximo 16 caracteres.';
  return null;
}

export function validateCard(card) {
  if (!card.name.trim()) return 'El nombre es obligatorio.';
  if (!card.type.trim()) return 'El tipo es obligatorio.';
  if (!card.image.trim()) return 'La imagen es obligatoria.';
  for (const a of card.attacks) {
    if (!a.name.trim()) return 'Los 4 ataques necesitan nombre.';
    if (a.baseDamage < 10 || a.baseDamage > 50) return 'El daño de los ataques debe estar entre 10 y 50.';
  }
  if (card.special.baseDamage < 55 || card.special.baseDamage > 70) return 'El poder especial debe hacer entre 55 y 70 de daño.';
  return null;
}
