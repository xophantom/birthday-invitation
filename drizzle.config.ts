import { config } from 'dotenv'

// Same precedence Next.js applies: .env.local wins, .env is the default.
// dotenv never overwrites what is already set, so the order matters.
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
