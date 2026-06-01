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
  listSearchSuggestionCandidates,
} from "./product.model";

export interface SearchSuggestion {
  query: string;
  type: "product" | "category" | "store";
}

export interface SearchSuggestionResult {
  suggestions: SearchSuggestion[];
  didYouMean: string | null;
}

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
    sort: (filters as any).sort,
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

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(left: string, right: string): number {
  const a = normalizeSearchText(left);
  const b = normalizeSearchText(right);

  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

function scoreSuggestion(query: string, candidate: string): number {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedCandidate = normalizeSearchText(candidate);

  if (!normalizedQuery || !normalizedCandidate) return 0;
  if (normalizedCandidate === normalizedQuery) return 1;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 0.92;
  if (normalizedCandidate.includes(normalizedQuery)) return 0.82;

  const distance = editDistance(normalizedQuery, normalizedCandidate);
  const longest = Math.max(normalizedQuery.length, normalizedCandidate.length);
  return Math.max(0, 1 - distance / longest);
}

export async function getSearchSuggestions(
  query: string,
  limit = 6,
): Promise<SearchSuggestionResult> {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return { suggestions: [], didYouMean: null };
  }

  const candidates = await listSearchSuggestionCandidates(normalizedQuery);
  const ranked = candidates
    .map((candidate) => ({
      query: candidate.value,
      type: candidate.type,
      score: scoreSuggestion(normalizedQuery, candidate.value),
    }))
    .filter((candidate) => candidate.score >= 0.45)
    .sort((a, b) => b.score - a.score || a.query.localeCompare(b.query));

  const seen = new Set<string>();
  const suggestions = ranked
    .filter((candidate) => {
      const key = normalizeSearchText(candidate.query);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ query: value, type }) => ({ query: value, type }));

  const best = ranked.find(
    (candidate) => normalizeSearchText(candidate.query) !== normalizedQuery,
  );
  const didYouMean = best && best.score >= 0.58 ? best.query : null;

  return { suggestions, didYouMean };
}

export async function getCategoryByName(
  name: string,
): Promise<Category | null> {
  return getCategoriesByName(name);
}

export async function getStoreById(id: number): Promise<Vendor | null> {
  return getStoreByIdModel(id);
}
