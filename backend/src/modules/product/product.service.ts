import {
  Category,
  createProduct,
  CreateProductInput,
  findAllProducts,
  findProductById,
  findProductsByNormalizedTitle,
  getCategoriesByName,
  findProductsByIds,
  Product,
  ProductFilters,
  Vendor,
  getStoreById as getStoreByIdModel,
  searchProductsWithPagination,
  SearchFilters,
  ProductWithRelations,
} from "./product.model";

export async function createProductRecord(
  payload: CreateProductInput,
): Promise<Product> {
  return createProduct(payload);
}

export async function getAllProducts(
  filters: ProductFilters,
  userId?: number,
): Promise<Product[]> {
  return findAllProducts(filters, userId);
}

export async function getProductDetails(
  id: number,
  userId?: number,
): Promise<Product | null> {
  return findProductById(id, userId);
}

export async function getProductsByIds(
  ids: number[],
  userId?: number,
): Promise<Product[]> {
  return findProductsByIds(ids, userId);
}

export async function getRelatedOffers(
  productId: number,
  userId?: number,
): Promise<Product[] | null> {
  const product = await findProductById(productId, userId);

  if (!product) {
    return null;
  }

  return findProductsByNormalizedTitle(
    product.normalized_title,
    product.id,
    product.store?.id,
    userId,
  );
}

export async function searchProducts(
  filters: ProductFilters,
  userId?: number,
): Promise<{
  data: ProductWithRelations[];
  pagination: { page: number; limit: number; total: number };
}> {
  // Map service-level filters to model search filters
  const modelFilters: SearchFilters = {
    search: filters.search,
    category: filters.category,
    keywords: filters.keywords,
    store_id: (filters as any).store_id,
    page: (filters as any).page,
    limit: (filters as any).limit,
    min_price: (filters as any).min_price,
    max_price: (filters as any).max_price,
  };

  const page =
    modelFilters.page && modelFilters.page > 0 ? modelFilters.page : 1;
  const limit =
    modelFilters.limit && modelFilters.limit > 0 ? modelFilters.limit : 10;

  const result = await searchProductsWithPagination(modelFilters, userId);

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total: result.total,
    },
  };
}

export async function getCategoryByName(
  name: string,
): Promise<Category | null> {
  return getCategoriesByName(name);
}

export async function getStoreById(id: number): Promise<Vendor | null> {
  return getStoreByIdModel(id);
}
