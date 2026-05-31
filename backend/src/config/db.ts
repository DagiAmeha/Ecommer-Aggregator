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
      provider VARCHAR(50) DEFAULT 'password',
      profile_image TEXT,
      status VARCHAR(20) DEFAULT 'active',
      deleted_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'password',
      ADD COLUMN IF NOT EXISTS profile_image TEXT,
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
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
      ADD COLUMN IF NOT EXISTS external_rating_rate DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS external_rating_count INTEGER,
      ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (product_id, user_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
  `);

  await pool.query(`
    WITH ranked AS (
      SELECT
        id,
        ROW_NUMBER() OVER (
          PARTITION BY store_id, external_id
          ORDER BY updated_at DESC, created_at DESC, id DESC
        ) AS row_rank
      FROM products
      WHERE source IN ('api', 'scraping') AND external_id IS NOT NULL
    )
    DELETE FROM products
    WHERE id IN (SELECT id FROM ranked WHERE row_rank > 1);
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_store_external_external
      ON products (store_id, external_id)
      WHERE external_id IS NOT NULL AND source IN ('api', 'scraping');
  `);

  // 5. Store Sources Table (Store can have multiple ingestion sources)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_sources (
      id SERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      url TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true,
      source_name VARCHAR(255),
      last_sync_at TIMESTAMPTZ,
      last_sync_status VARCHAR(30),
      last_imported_count INTEGER,
      last_updated_count INTEGER,
      last_failed_count INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (store_id, type, url)
    );
  `);

  await pool.query(`
    ALTER TABLE store_sources
      ADD COLUMN IF NOT EXISTS source_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_sync_status VARCHAR(30),
      ADD COLUMN IF NOT EXISTS last_imported_count INTEGER,
      ADD COLUMN IF NOT EXISTS last_updated_count INTEGER,
      ADD COLUMN IF NOT EXISTS last_failed_count INTEGER;
  `);

  // 6. Performance Indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_store ON products(store_id);
    CREATE INDEX IF NOT EXISTS idx_store_sources_store_id ON store_sources(store_id);
    CREATE INDEX IF NOT EXISTS idx_store_sources_type_active ON store_sources(type, is_active);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, product_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
  `);

  // Saved Searches: lets a user store a search query (plus optional filters)
  // and revisit it later.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS saved_searches (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      query VARCHAR(255) NOT NULL,
      category VARCHAR(100),
      min_price NUMERIC(12, 2),
      max_price NUMERIC(12, 2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, query, category)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
  `);

  await pool.query(`
    ALTER TABLE products
      ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_price_history (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      price NUMERIC(12, 2) NOT NULL,
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_price_history_product_id
      ON product_price_history(product_id, recorded_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS price_alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      is_active BOOLEAN NOT NULL DEFAULT true,
      last_notified_price NUMERIC(12, 2),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, product_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON price_alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_price_alerts_product_id ON price_alerts(product_id);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      related_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id
      ON notifications(user_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_events (
      id SERIAL PRIMARY KEY,
      event_type VARCHAR(30) NOT NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      search_query VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_product_events_type_created
      ON product_events(event_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_events_product_id
      ON product_events(product_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS import_jobs (
      id SERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      source_id INTEGER REFERENCES store_sources(id) ON DELETE SET NULL,
      job_type VARCHAR(30) NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'running',
      imported_count INTEGER NOT NULL DEFAULT 0,
      updated_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_import_jobs_store_id
      ON import_jobs(store_id, started_at DESC);
  `);
}
