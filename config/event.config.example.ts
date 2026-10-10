import type { EventConfig } from './event.schema'

/**
 * Shape reference for `config/event.config.ts`, with fictional data: copy this
 * file over it and fill in the real party details.
 *
 * Both files are committed — the README explains why the real one can't live
 * outside the repo (a static import breaks the Vercel build).
 */
export const eventConfig: EventConfig = {
  celebrant: {
    name: 'Alice Fernandes',
    monogram: 'AF',
    age: 15,
  },
  event: {
    startsAt: '2026-11-14T19:00:00-03:00',
    timeZone: 'America/Sao_Paulo',
  },
  venue: {
    name: 'Espaço Jardim das Acácias',
    address: 'Rua das Acácias, 500 - Jardim Botânico, Porto Alegre - RS, 90000-000',
    mapsQuery: 'Espaço Jardim das Acácias, Rua das Acácias, 500, Porto Alegre - RS',
    notes: ['O local possui estacionamento próprio.'],
  },
  guide: [
    'Confirme sua presença com antecedência.',
    'Seja pontual.',
    'Este convite é exclusivo e pessoal.',
    'Sinta-se à vontade para tirar fotos.',
    'Evite atrapalhar o trabalho do fotógrafo oficial.',
    'Aproveite a festa!',
  ],
  gifts: {
    clothingSize: null,
    shoeSize: null,
    preferences: [
      'Perfumes de fragrância doce',
      'Maquiagem',
      'Acessórios dourados',
    ],
    pixKey: null,
  },
  dressCode: {
    style: 'Esporte fino',
    avoid: ['Tons de verde'],
    reason: 'O verde é a cor da debutante e fica reservado a ela na festa.',
  },
  theme: {
    colors: {
      surface: '#0B2E1E',
      surfaceDeep: '#071A11',
      highlight: '#A9C64C',
      accent: '#C9A227',
      accentLight: '#E8C766',
      foreground: '#F3EAD3',
    },
    poster: '/poster.jpeg',
  },
  media: {
    openingVideo: null,
    soundtrack: null,
  },
  photos: {
    maxPerUpload: 10,
    maxFileSizeMb: 15,
  },
}
