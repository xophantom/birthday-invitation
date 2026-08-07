import 'server-only'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

type Database = ReturnType<typeof createDb>

function createDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não definida. Copie .env.example para .env.local.')
  }

  const sql = neon(process.env.DATABASE_URL)
  return drizzle(sql, { schema })
}

let instance: Database | undefined

function getDb(): Database {
  if (!instance) {
    instance = createDb()
  }
  return instance
}

/**
 * `db` parece o cliente drizzle de sempre, mas é um Proxy: a criação real
 * (e a checagem de DATABASE_URL) só acontece no primeiro acesso a uma
 * propriedade, dentro de `getDb()`. Isso adia o erro de "faltou configurar
 * o banco" do momento em que este módulo é importado para o momento em que
 * uma query realmente roda — onde o try/catch de quem chama consegue
 * capturá-lo. Métodos são religados (`.bind`) à instância real para que
 * `this` dentro deles nunca aponte para o Proxy.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getDb()
    const value = Reflect.get(instance as object, prop)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export * from './schema'
