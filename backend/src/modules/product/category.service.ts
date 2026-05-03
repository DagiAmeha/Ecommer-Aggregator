import {
  createCategory,
  CreateCategoryInput,
  deleteCategoryById,
  findAllCategories,
  findCategoryById,
  Category,
} from "./category.model";

export async function createCategoryRecord(
  payload: CreateCategoryInput,
): Promise<Category> {
  return createCategory(payload);
}

export async function listCategoryRecords(): Promise<Category[]> {
  return findAllCategories();
}

export async function deleteCategoryRecord(id: number): Promise<boolean> {
  return deleteCategoryById(id);
}

export async function getCategoryDetails(id: number): Promise<Category | null> {
  return findCategoryById(id);
}
