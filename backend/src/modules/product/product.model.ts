import { pool } from "../../config/db";
import { getCategoryByName } from "./product.service";
import { createCategory } from "./category.model";
import {
  handleProductPriceChange,
  recordPriceHistory,
} from "../price/priceMonitor.service";

export interface Category {
  id: number;
  name: string;
}

export interface Vendor {
  id: number;
  user_id: number;
  store_name: string;
}

export type ProductSource = "manual" | "api" | "scraping";
export type RatingSource = "internal" | "external";

export interface ProductRelation {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
  source: ProductSource;
  external_id: string | null;
  stock_quantity: number;
  category: ProductRelation;
  store: ProductRelation;
  group_id: string;
  normalized_title: string;
  product_group_id: string;
  average_rating: number;
  review_count: number;
  rating_source: RatingSource;
  is_wishlisted: boolean;
}

export interface ProductWithRelations extends Product {}

export interface ProductRow {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string | null;
  source: ProductSource;
  external_id: string | null;
  stock_quantity: number;
  external_rating_rate: number | null;
  external_rating_count: number | null;
  category_id: number;
  category_name: string;
  store_id: number;
  store_name: string;
  average_rating: number;
  review_count: number;
  rating_source: RatingSource;
  is_wishlisted: boolean;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  store_id: number;
  image_url?: string;
  product_url?: string;
  stock_quantity?: number;
  source?: ProductSource;
  external_id?: string | number;
  external_rating_rate?: number | null;
  external_rating_count?: number | null;
  last_synced_at?: string | null;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  keywords?: string[];
  store_id?: number;
}

function normalizeGroupSeed(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeProductTitle(title: string): string {
  const normalizedStorage = title
    .toLowerCase()
    .replace(/(\d+)\s*(gb|g)\b/g, "$1gb")
    .replace(/(\d+)\s*(tb|t)\b/g, "$1tb");

  return normalizedStorage
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildProductGroupId(normalizedTitle: string): string {
  return normalizeGroupSeed(normalizedTitle || "unknown-product");
}

function buildGroupId(
  row: Pick<ProductRow, "external_id" | "category_name" | "name">,
): string {
  const seed = row.external_id?.trim().length
    ? row.external_id.trim()
    : `${row.category_name}-${row.name}`;

  return (
    normalizeGroupSeed(seed) ||
    normalizeGroupSeed(`${row.category_name}-${row.name}`)
  );
}

export function mapProductRow(row: ProductRow): Product {
  const normalizedTitle = normalizeProductTitle(row.name);
  const productGroupId = buildProductGroupId(normalizedTitle);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image_url: row.image_url,
    product_url: row.product_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_synced_at: row.last_synced_at,
    source: row.source,
    external_id: row.external_id,
    stock_quantity: row.stock_quantity ?? 0,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
    store: {
      id: row.store_id,
      name: row.store_name,
    },
    group_id: buildGroupId(row),
    normalized_title: normalizedTitle,
    product_group_id: productGroupId,
    average_rating: row.average_rating,
    review_count: row.review_count,
    rating_source: row.rating_source,
    is_wishlisted: row.is_wishlisted,
  };
}

const REVIEW_AGG_JOIN = `
  LEFT JOIN (
    SELECT
      product_id,
      AVG(rating)::float8 AS avg_rating,
      COUNT(*)::int AS review_count
    FROM reviews
    GROUP BY product_id
  ) r ON r.product_id = p.id
`;

const RATING_SELECT_FIELDS = `
  p.external_rating_rate,
  p.external_rating_count,
  CASE
    WHEN p.source = 'api' THEN COALESCE(p.external_rating_rate, 0)
    ELSE COALESCE(r.avg_rating, 0)
  END AS average_rating,
  CASE
    WHEN p.source = 'api' THEN COALESCE(p.external_rating_count, 0)
    ELSE COALESCE(r.review_count, 0)
  END AS review_count,
  CASE
    WHEN p.source = 'api' THEN 'external'
    ELSE 'internal'
  END AS rating_source
`;

function buildWishlistJoin(
  userId: number | undefined,
  values: unknown[],
): { joinSql: string; selectSql: string } {
  if (!userId) {
    return { joinSql: "", selectSql: "false AS is_wishlisted" };
  }

  values.push(userId);
  const index = values.length;

  return {
    joinSql: `LEFT JOIN wishlists w ON w.product_id = p.id AND w.user_id = $${index}`,
    selectSql:
      "CASE WHEN w.id IS NULL THEN false ELSE true END AS is_wishlisted",
  };
}

const NORMALIZED_TITLE_SQL = `trim(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(p.name),
          '(\\d+)\\s*(gb|g)\\b',
          '\\1gb',
          'g'
        ),
        '(\\d+)\\s*(tb|t)\\b',
        '\\1tb',
        'g'
      ),
      '[^a-z0-9]+',
      ' ',
      'g'
    ),
      '\\s+',
    ' ',
    'g'
  )
)`;

function buildProductSelectQuery(
  whereClause = "",
  values: unknown[] = [],
  userId?: number,
) {
  const wishlist = buildWishlistJoin(userId, values);

  return pool.query<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price::float8 AS price,
        p.image_url,
        p.product_url,
        p.created_at::text AS created_at,
        p.updated_at::text AS updated_at,
        p.last_synced_at::text AS last_synced_at,
        p.source,
        p.external_id,
        p.stock_quantity::int AS stock_quantity,
        ${RATING_SELECT_FIELDS},
        ${wishlist.selectSql},
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      ${REVIEW_AGG_JOIN}
      ${wishlist.joinSql}
      ${whereClause}
      ORDER BY p.created_at DESC
    `,
    values,
  );
}

export async function findAllProducts(
  filters: ProductFilters,
  userId?: number,
): Promise<Product[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const index = values.length;
    conditions.push(
      `(p.name ILIKE $${index} OR p.description ILIKE $${index})`,
    );
  }

  if (filters.category) {
    const numericCategoryId = Number(filters.category);

    if (!Number.isNaN(numericCategoryId)) {
      values.push(numericCategoryId);
      conditions.push(`p.category_id = $${values.length}`);
    } else {
      values.push(filters.category);
      conditions.push(`c.name ILIKE $${values.length}`);
    }
  }

  if (filters.keywords && filters.keywords.length > 0) {
    for (const keyword of filters.keywords) {
      values.push(`%${keyword}%`);
      const index = values.length;
      conditions.push(
        `(p.name ILIKE $${index} OR p.description ILIKE $${index})`,
      );
    }
  }

  if (typeof filters.store_id !== "undefined") {
    values.push(filters.store_id);
    conditions.push(`p.store_id = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await buildProductSelectQuery(whereClause, values, userId);
  return result.rows.map(mapProductRow);
}

export async function findProductsByIds(
  ids: number[],
  userId?: number,
): Promise<Product[]> {
  if (ids.length === 0) {
    return [];
  }

  const values: unknown[] = [ids];
  const wishlist = buildWishlistJoin(userId, values);

  const result = await pool.query<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price::float8 AS price,
        p.image_url,
        p.product_url,
        p.created_at::text AS created_at,
        p.updated_at::text AS updated_at,
        p.last_synced_at::text AS last_synced_at,
        p.source,
        p.external_id,
        p.stock_quantity::int AS stock_quantity,
        ${RATING_SELECT_FIELDS},
        ${wishlist.selectSql},
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      ${REVIEW_AGG_JOIN}
      ${wishlist.joinSql}
      WHERE p.id = ANY($1::int[])
    `,
    values,
  );

  const rowsById = new Map(result.rows.map((row) => [row.id, row]));

  return ids
    .map((id) => rowsById.get(id))
    .filter((row): row is ProductRow => Boolean(row))
    .map(mapProductRow);
}

export async function findProductsByNormalizedTitle(
  normalizedTitle: string,
  excludeId?: number,
  excludeStoreId?: number,
  userId?: number,
): Promise<Product[]> {
  const conditions = [`${NORMALIZED_TITLE_SQL} = $1`];
  const values: Array<string | number> = [normalizedTitle];

  if (excludeId) {
    values.push(excludeId);
    conditions.push(`p.id <> $${values.length}`);
  }

  if (excludeStoreId) {
    values.push(excludeStoreId);
    conditions.push(`p.store_id <> $${values.length}`);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;
  const wishlist = buildWishlistJoin(userId, values);
  const result = await pool.query<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price::float8 AS price,
        p.image_url,
        p.product_url,
        p.created_at::text AS created_at,
        p.updated_at::text AS updated_at,
        p.last_synced_at::text AS last_synced_at,
        p.source,
        p.external_id,
        p.stock_quantity::int AS stock_quantity,
        ${RATING_SELECT_FIELDS},
        ${wishlist.selectSql},
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      ${REVIEW_AGG_JOIN}
      ${wishlist.joinSql}
      ${whereClause}
      ORDER BY p.price ASC, p.created_at DESC
    `,
    values,
  );

  return result.rows.map(mapProductRow);
}

export interface SearchFilters extends ProductFilters {
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "popularity";
}

function buildSortClause(
  sort: SearchFilters["sort"],
  popularityJoin: boolean,
): string {
  switch (sort) {
    case "price_asc":
      return "p.price ASC, p.created_at DESC";
    case "price_desc":
      return "p.price DESC, p.created_at DESC";
    case "rating":
      return `CASE
        WHEN p.source = 'api' THEN COALESCE(p.external_rating_rate, 0)
        ELSE COALESCE(r.avg_rating, 0)
      END DESC, p.created_at DESC`;
    case "popularity":
      return popularityJoin
        ? "COALESCE(pop.popularity, 0) DESC, p.created_at DESC"
        : "p.created_at DESC";
    case "newest":
    default:
      return "p.created_at DESC";
  }
}

export async function searchProductsWithPagination(
  filters: SearchFilters,
  userId?: number,
): Promise<{ rows: ProductWithRelations[]; total: number }> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const index = values.length;
    conditions.push(
      `(p.name ILIKE $${index} OR p.description ILIKE $${index})`,
    );
  }

  if (filters.category) {
    const numericCategoryId = Number(filters.category);

    if (!Number.isNaN(numericCategoryId)) {
      values.push(numericCategoryId);
      conditions.push(`p.category_id = $${values.length}`);
    } else {
      values.push(filters.category);
      conditions.push(`c.name ILIKE $${values.length}`);
    }
  }

  if (filters.keywords && filters.keywords.length > 0) {
    for (const keyword of filters.keywords) {
      values.push(`%${keyword}%`);
      const index = values.length;
      conditions.push(
        `(p.name ILIKE $${index} OR p.description ILIKE $${index})`,
      );
    }
  }

  if (typeof filters.store_id !== "undefined") {
    values.push(filters.store_id);
    conditions.push(`p.store_id = $${values.length}`);
  }

  if (typeof filters.min_price !== "undefined") {
    values.push(filters.min_price);
    conditions.push(`p.price >= $${values.length}`);
  }

  if (typeof filters.max_price !== "undefined") {
    values.push(filters.max_price);
    conditions.push(`p.price <= $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
  const offset = (page - 1) * limit;

  // Total count
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN stores s ON s.id = p.store_id
    ${whereClause}
  `;

  const countResult = await pool.query<{ total: string }>(countQuery, values);
  const total = Number(countResult.rows[0]?.total ?? 0);

  // Data query with relations
  const dataValues = values.slice();
  const wishlist = buildWishlistJoin(userId, dataValues);
  const usePopularity = filters.sort === "popularity";
  const popularityJoin = usePopularity
    ? `
      LEFT JOIN (
        SELECT product_id, COUNT(*)::int AS popularity
        FROM product_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY product_id
      ) pop ON pop.product_id = p.id
    `
    : "";
  const orderClause = buildSortClause(filters.sort, usePopularity);

  const dataQuery = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.price::float8 AS price,
      p.image_url,
      p.product_url,
      p.created_at::text AS created_at,
      p.updated_at::text AS updated_at,
      p.last_synced_at::text AS last_synced_at,
      p.source,
      p.external_id,
      p.stock_quantity::int AS stock_quantity,
      ${RATING_SELECT_FIELDS},
      ${wishlist.selectSql},
      c.id AS category_id,
      c.name AS category_name,
      s.id AS store_id,
      s.store_name AS store_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN stores s ON s.id = p.store_id
    ${REVIEW_AGG_JOIN}
    ${wishlist.joinSql}
    ${popularityJoin}
    ${whereClause}
    ORDER BY ${orderClause}
    LIMIT $${dataValues.length + 1} OFFSET $${dataValues.length + 2}
  `;

  dataValues.push(limit, offset);
  const result = await pool.query<ProductRow>(dataQuery, dataValues);

  return { rows: result.rows.map(mapProductRow), total };
}

export async function findWishlistedProducts(
  userId: number,
): Promise<Product[]> {
  const result = await pool.query<ProductRow>(
    `
      SELECT
        p.id,
        p.name,
        p.description,
        p.price::float8 AS price,
        p.image_url,
        p.product_url,
        p.created_at::text AS created_at,
        p.updated_at::text AS updated_at,
        p.last_synced_at::text AS last_synced_at,
        p.source,
        p.external_id,
        p.stock_quantity::int AS stock_quantity,
        ${RATING_SELECT_FIELDS},
        true AS is_wishlisted,
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM wishlists w
      JOIN products p ON p.id = w.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      ${REVIEW_AGG_JOIN}
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `,
    [userId],
  );

  return result.rows.map(mapProductRow);
}

export async function countWishlistedProducts(userId: number): Promise<number> {
  const result = await pool.query<{ total: string }>(
    "SELECT COUNT(*)::text AS total FROM wishlists WHERE user_id = $1",
    [userId],
  );

  return Number(result.rows[0]?.total ?? 0);
}

// product.model.ts

export async function findProductById(
  id: number,
  userId?: number,
): Promise<Product | null> {
  const result = await buildProductSelectQuery("WHERE p.id = $1", [id], userId);
  console.log("findProductById result:", result.rows);
  return result.rows[0] ? mapProductRow(result.rows[0]) : null;
}

export async function createProduct(
  data: CreateProductInput,
): Promise<Product> {
  const store = await getStoreById(data.store_id);
  const category = await getCategoryByName(data.category);
  let result: { id: number } | undefined;

  if (!store) {
    throw new Error("Store with this ID is not found");
  }

  if (!category) {
    result = await createCategory({ name: data.category });
  }

  const insertResult = await pool.query<{ id: number }>(
    `
      INSERT INTO products (
        name,
        description,
        price,
        category_id,
        store_id,
        image_url,
        product_url,
        source,
        external_id,
        last_synced_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `,
    [
      data.name,
      data.description ?? null,
      data.price,
      category?.id ?? result?.id,
      data.store_id,
      data.image_url ?? null,
      data.product_url ?? "https://jiji.com.et/",
      data.source ?? "api",
      data.external_id ? String(data.external_id) : null,
      data.last_synced_at ?? null,
    ],
  );

  const productId = insertResult.rows[0]?.id;
  const createdProduct = await findProductById(productId);

  if (!createdProduct) {
    throw new Error("Failed to load created product");
  }

  return createdProduct;
}

export async function getCategoriesByName(
  name: string,
): Promise<Category | null> {
  const result = await pool.query<Category>(
    "SELECT id, name FROM categories WHERE name ILIKE $1",
    [`%${name}%`],
  );
  return result.rows[0] ?? null;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const result = await pool.query<Category>(
    "SELECT id, name FROM categories WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function getStoreById(id: number): Promise<Vendor | null> {
  const result = await pool.query<Vendor>(
    "SELECT id, owner_id AS user_id, store_name FROM stores WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findProductByStoreAndExternalId(
  storeId: number,
  externalId: string,
): Promise<Product | null> {
  const result = await buildProductSelectQuery(
    "WHERE p.store_id = $1 AND p.external_id = $2",
    [storeId, externalId],
  );

  return result.rows[0] ? mapProductRow(result.rows[0]) : null;
}

async function resolveCategoryId(name: string): Promise<number> {
  const category = await getCategoryByName(name);
  if (category) {
    return category.id;
  }

  const created = await createCategory({ name });
  return created.id;
}

export async function upsertApiProduct(
  payload: Omit<CreateProductInput, "source"> & {
    external_id: string;
    source?: ProductSource;
  },
): Promise<{ product: Product; action: "imported" | "updated" }> {
  const store = await getStoreById(payload.store_id);
  if (!store) {
    throw new Error("Store with this ID is not found");
  }

  const categoryId = await resolveCategoryId(payload.category);
  const externalId = String(payload.external_id);
  const source = payload.source ?? "api";
  const existing = await findProductByStoreAndExternalId(
    payload.store_id,
    externalId,
  );

  if (existing) {
    const result = await pool.query<{ id: number }>(
      `
        UPDATE products
        SET
          name = $1,
          description = $2,
          price = $3,
          category_id = $4,
          image_url = $5,
          product_url = $6,
          external_rating_rate = $7,
          external_rating_count = $8,
          source = $9,
          stock_quantity = COALESCE($10, stock_quantity),
          updated_at = NOW(),
          last_synced_at = NOW()
        WHERE id = $11
        RETURNING id
      `,
      [
        payload.name,
        payload.description ?? null,
        payload.price,
        categoryId,
        payload.image_url ?? null,
        payload.product_url ?? "https://jiji.com.et/",
        payload.external_rating_rate ?? null,
        payload.external_rating_count ?? null,
        source,
        payload.stock_quantity ?? null,
        existing.id,
      ],
    );

    const updated = await findProductById(result.rows[0].id);
    if (!updated) {
      throw new Error("Failed to load updated product");
    }

    await handleProductPriceChange(
      updated.id,
      updated.name,
      existing.price,
      updated.price,
    );

    return { product: updated, action: "updated" };
  }

  const insertResult = await pool.query<{ id: number }>(
    `
      INSERT INTO products (
        name,
        description,
        price,
        category_id,
        store_id,
        image_url,
        product_url,
        source,
        external_id,
        external_rating_rate,
        external_rating_count,
        stock_quantity,
        last_synced_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id
    `,
    [
      payload.name,
      payload.description ?? null,
      payload.price,
      categoryId,
      payload.store_id,
      payload.image_url ?? null,
      payload.product_url ?? "https://jiji.com.et/",
      source,
      externalId,
      payload.external_rating_rate ?? null,
      payload.external_rating_count ?? null,
      payload.stock_quantity ?? 1,
    ],
  );

  const created = await findProductById(insertResult.rows[0].id);
  if (!created) {
    throw new Error("Failed to load imported product");
  }

  await recordPriceHistory(created.id, created.price);

  return { product: created, action: "imported" };
}

// export async function deleteProductById(id: number): Promise<boolean> {
//   const result = await pool.query(
//     `
//       DELETE FROM products
//       WHERE id = $1
//     `,
//     [id],
//   );
