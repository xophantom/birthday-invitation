import type { EventConfig } from './event.schema'

export const eventConfig: EventConfig = {
  celebrant: {
    name: 'Naiara Rocha',
    monogram: 'NR',
    age: 15,
  },
  event: {
    startsAt: '2026-12-11T19:00:00-03:00',
    timeZone: 'America/Sao_Paulo',
  },
  venue: {
    name: 'Quinta do Itacolomi',
    address: 'Estr. Beco do Pavão, 1150 - Itacolomi, Gravataí - RS, 94243-800',
    mapsQuery: 'Quinta do Itacolomi, Estr. Beco do Pavão, 1150, Gravataí - RS',
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
    openingVideo: '/video.mp4',
    soundtrack: '/song.mp3',
  },
  photos: {
    maxPerUpload: 10,
    maxFileSizeMb: 15,
  },
}
