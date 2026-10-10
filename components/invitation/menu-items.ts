export const menuItems = [
  { href: '/manual', label: 'Manual do convidado', icon: 'sparkle' },
  { href: '/presentes', label: 'Sugestões de presente', icon: 'asterisk' },
  { href: '/dress-code', label: 'Dress code', icon: 'sparkle-outline' },
  { href: '/confirmar', label: 'Confirmar presença', icon: 'star-eight' },
  { href: '/local', label: 'Local', icon: 'star-six' },
] as const

export type MenuIconName = (typeof menuItems)[number]['icon']
