import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool(
  connectionString
    ? { connectionString }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_NAME || "aggregator",
      },
);

export async function initDb(): Promise<void> {
  // 1. Users Table (Internal ID is PK, Firebase UID is for Auth lookup)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      firebase_uid VARCHAR(255) UNIQUE NOT NULL, 
      email VARCHAR(255) UNIQUE NOT NULL,
      full_name VARCHAR(255),
      phone_number VARCHAR(50),
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 2. Categories Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      slug VARCHAR(100) UNIQUE -- Good for URLs
    );
  `);

  // 3. Vendors Table (One-to-One with User)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      owner_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      store_name VARCHAR(255) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true
    );
  `);

  // 4. Products Table (Points to Category and Vendor)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      image_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS product_url TEXT,
      ADD COLUMN IF NOT EXISTS source VARCHAR(20),
      ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

    UPDATE products
    SET source = 'manual'
    WHERE source IS NULL;

    UPDATE products
    SET updated_at = COALESCE(updated_at, created_at)
    WHERE updated_at IS NULL;

    ALTER TABLE products
      ALTER COLUMN source SET DEFAULT 'manual',
      ALTER COLUMN source SET NOT NULL,
      ALTER COLUMN updated_at SET DEFAULT NOW(),
      ALTER COLUMN updated_at SET NOT NULL;
  `);

  // 5. Store Sources Table (Store can have multiple ingestion sources)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_sources (
      id SERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      url TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (store_id, type, url)
    );
  `);

  // 6. Performance Indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
    CREATE INDEX IF NOT EXISTS idx_store_sources_store_id ON store_sources(store_id);
    CREATE INDEX IF NOT EXISTS idx_store_sources_type_active ON store_sources(type, is_active);
  `);
}
