import type { Product } from "@/types/catalog";

/**
 * From a product list (e.g. search results), pick up to 4 comparable offers:
 * same category, one listing per store (cheapest per store).
 */
export function getCompareCandidateIds(products: Product[]): number[] {
  const byCategory = new Map<number, Product[]>();

  for (const product of products) {
    const categoryId = product.category?.id;
    if (!categoryId) {
      continue;
    }

    const category = byCategory.get(categoryId) ?? [];
    category.push(product);
    byCategory.set(categoryId, category);
  }

  let bestCandidates: Product[] = [];

  for (const category of byCategory.values()) {
    const byStore = new Map<number, Product>();

    for (const product of category) {
      const storeId = product.store?.id;
      if (!storeId) {
        continue;
      }

      const existing = byStore.get(storeId);
      if (!existing || product.price < existing.price) {
        byStore.set(storeId, product);
      }
    }

    const candidates = Array.from(byStore.values());
    if (candidates.length > bestCandidates.length) {
      bestCandidates = candidates;
    }
  }

  return bestCandidates
    .sort((a, b) => a.price - b.price)
    .slice(0, 4)
    .map((product) => product.id);
}

export function getCompareCandidateLabel(
  products: Product[],
  candidateIds: number[],
): string | null {
  if (candidateIds.length === 0) {
    return null;
  }

  const match = products.find((product) => product.id === candidateIds[0]);
  return match?.category?.name ?? null;
}
