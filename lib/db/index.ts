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
 * Looks like the usual drizzle client but is a Proxy: the real client (and the
 * DATABASE_URL check) is created on first property access. That moves the
 * "database not configured" error from module import time to the moment a
 * query actually runs, where a caller's try/catch can catch it.
 *
 * Methods are `.bind`-ed to the real instance so `this` never points at the
 * Proxy.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getDb()
    const value = Reflect.get(instance as object, prop)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export * from './schema'
