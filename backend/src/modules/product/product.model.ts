import { pool } from "../../config/db";
import { getCategoryByName } from "./product.service";
import { createCategory } from "./category.model";

export interface Category {
  id: number;
  name: string;
}

export interface Vendor {
  id: number;
  user_id: number;
  store_name: string;
}

export type ProductSource = "manual" | "api";

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
  source: ProductSource;
  external_id: string | null;
  category: ProductRelation;
  store: ProductRelation;
  group_id: string;
}

export interface ProductWithRelations extends Product {}

interface ProductRow {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  product_url: string | null;
  created_at: string;
  updated_at: string;
  source: ProductSource;
  external_id: string | null;
  category_id: number;
  category_name: string;
  store_id: number;
  store_name: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  store_id: number;
  image_url?: string;
  product_url?: string;
  source?: ProductSource;
  external_id?: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  keywords?: string[];
}

function normalizeGroupSeed(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    image_url: row.image_url,
    product_url: row.product_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    source: row.source,
    external_id: row.external_id,
    category: {
      id: row.category_id,
      name: row.category_name,
    },
    store: {
      id: row.store_id,
      name: row.store_name,
    },
    group_id: buildGroupId(row),
  };
}

function buildProductSelectQuery(whereClause = "", values: unknown[] = []) {
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
        p.source,
        p.external_id,
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      ${whereClause}
      ORDER BY p.created_at DESC
    `,
    values,
  );
}

export async function findAllProducts(
  filters: ProductFilters,
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

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await buildProductSelectQuery(whereClause, values);
  return result.rows.map(mapProductRow);
}

export async function findProductsByIds(ids: number[]): Promise<Product[]> {
  if (ids.length === 0) {
    return [];
  }

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
        p.source,
        p.external_id,
        c.id AS category_id,
        c.name AS category_name,
        s.id AS store_id,
        s.store_name AS store_name
      FROM products p
      JOIN categories c ON c.id = p.category_id
      JOIN stores s ON s.id = p.store_id
      WHERE p.id = ANY($1::int[])
    `,
    [ids],
  );

  const rowsById = new Map(result.rows.map((row) => [row.id, row]));

  return ids
    .map((id) => rowsById.get(id))
    .filter((row): row is ProductRow => Boolean(row))
    .map(mapProductRow);
}

export interface SearchFilters extends ProductFilters {
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export async function searchProductsWithPagination(
  filters: SearchFilters,
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
  const dataQuery = `
    SELECT
      p.id,
      p.name,
      p.description,
      p.price::float8 AS price,
      p.image_url,
      p.product_url,
      p.created_at::text AS created_at
      ,p.updated_at::text AS updated_at
      ,p.source
      ,p.external_id
      ,c.id AS category_id
      ,c.name AS category_name
      ,s.id AS store_id
      ,s.store_name AS store_name
    FROM products p
    JOIN categories c ON c.id = p.category_id
    JOIN stores s ON s.id = p.store_id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;

  const dataValues = values.concat([limit, offset]);
  const result = await pool.query<ProductRow>(dataQuery, dataValues);

  return { rows: result.rows.map(mapProductRow), total };
}

// product.model.ts

export async function findProductById(id: number): Promise<Product | null> {
  const result = await buildProductSelectQuery("WHERE p.id = $1", [id]);
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
        external_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      data.external_id ?? null,
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

// export async function deleteProductById(id: number): Promise<boolean> {
//   const result = await pool.query(
//     `
//       DELETE FROM products
//       WHERE id = $1
//     `,
//     [id],
//   );
