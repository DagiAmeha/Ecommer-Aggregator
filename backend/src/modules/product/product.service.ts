import {
  Category,
  createProduct,
  CreateProductInput,
  findAllProducts,
  findProductById,
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
): Promise<Product[]> {
  return findAllProducts(filters);
}

export async function getProductDetails(id: number): Promise<Product | null> {
  return findProductById(id);
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  const products = await findProductsByIds(ids);
  const seenGroups = new Set<string>();
  const uniqueProducts: Product[] = [];

  for (const product of products) {
    if (seenGroups.has(product.group_id)) {
      continue;
    }

    seenGroups.add(product.group_id);
    uniqueProducts.push(product);
  }

  return uniqueProducts;
}

export async function searchProducts(filters: ProductFilters): Promise<{
  data: ProductWithRelations[];
  pagination: { page: number; limit: number; total: number };
}> {
  // Map service-level filters to model search filters
  const modelFilters: SearchFilters = {
    search: filters.search,
    category: filters.category,
    keywords: filters.keywords,
    page: (filters as any).page,
    limit: (filters as any).limit,
    min_price: (filters as any).min_price,
    max_price: (filters as any).max_price,
  };

  const page =
    modelFilters.page && modelFilters.page > 0 ? modelFilters.page : 1;
  const limit =
    modelFilters.limit && modelFilters.limit > 0 ? modelFilters.limit : 10;

  const result = await searchProductsWithPagination(modelFilters);

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
