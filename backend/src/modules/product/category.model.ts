import { pool } from "../../config/db";

export interface Category {
  id: number;
  name: string;
}

export interface CreateCategoryInput {
  name: string;
}

export async function createCategory(
  data: CreateCategoryInput,
): Promise<Category> {
  const result = await pool.query<Category>(
    `
      INSERT INTO categories (name)
      VALUES ($1)
      RETURNING id, name
    `,
    [data.name],
  );

  return result.rows[0];
}

export async function findAllCategories(): Promise<Category[]> {
  const result = await pool.query<Category>(
    `
      SELECT id, name
      FROM categories
      ORDER BY name ASC
    `,
  );

  return result.rows;
}

export async function findCategoryById(id: number): Promise<Category | null> {
  const result = await pool.query<Category>(
    `
      SELECT id, name
      FROM categories
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function deleteCategoryById(id: number): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM categories
      WHERE id = $1
    `,
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}
