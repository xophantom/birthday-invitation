import { config } from 'dotenv'

// Mesma precedência que o Next.js aplica: .env.local vence, .env é o padrão.
// dotenv não sobrescreve o que já está definido, então a ordem importa.
config({ path: '.env.local' })
config({ path: '.env' })

import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não encontrada. Copie .env.example para .env.local e preencha com a connection string do Neon.'
  )
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
})
