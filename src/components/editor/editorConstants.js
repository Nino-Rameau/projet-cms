export const PAGE_SETTINGS_DEFAULTS = {
  metaTitle: '',
  metaDescription: '',
  noIndex: false,
  contentWidth: '100%',
  customClassName: '',
  backgroundColor: '',
  backgroundImage: '',
};

export const DEFAULT_PROPS_BY_TYPE = {
  H1: { content: 'Titre H1' },
  H2: { content: 'Titre H2' },
  H3: { content: 'Titre H3' },
  H4: { content: 'Titre H4' },
  Paragraph: { content: 'Paragraphe avec <strong>texte en gras</strong>.' },
  Text: { content: 'Texte simple. Vous pouvez ajouter des <a href="#">liens</a>.' },
  Quote: { content: '"Une citation met en avant une phrase importante."', author: 'Auteur' },
  Divider: { style: { borderTop: '1px solid #cbd5e1', margin: '24px 0' } },
  Spacer: { style: { height: '32px' } },
  Card: {
    style: {
      padding: '20px',
      borderRadius: '14px',
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      boxShadow: '0 6px 20px rgba(15, 23, 42, 0.06)',
    },
  },
  Button: { content: 'Bouton', actionType: 'none', href: '', pagePath: '', fileUrl: '', email: '', phone: '', openInNewTab: false },
  LI: { content: 'Element de liste' },
  UL: { items: ['Premier point', 'Deuxieme point', 'Troisieme point'] },
  Image: { src: 'https://placehold.co/600x400/png', alt: 'Image' },
  Section: {},
  Table: {
    headers: ['Colonne 1', 'Colonne 2', 'Colonne 3'],
    rows: [
      ['Cellule 1', 'Cellule 2', 'Cellule 3'],
      ['Cellule 4', 'Cellule 5', 'Cellule 6'],
    ],
  },
  SocialLinks: {
    items: [
      { icon: 'facebook', href: 'https://facebook.com', label: 'Facebook' },
      { icon: 'instagram', href: 'https://instagram.com', label: 'Instagram' },
      { icon: 'linkedin', href: 'https://linkedin.com', label: 'LinkedIn' },
    ],
  },
  Accordion: {
    items: [
      { title: 'Question 1', content: 'Ceci est la réponse à la première question.' },
      { title: 'Question 2', content: 'Ceci est la réponse à la deuxième question.' },
    ],
  },
};

export const SOCIAL_ICON_OPTIONS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'github', label: 'GitHub' },
  { value: 'website', label: 'Site web' },
];

export const BLOCK_CLIPBOARD_STORAGE_KEY = 'pb-editor-block-clipboard';
