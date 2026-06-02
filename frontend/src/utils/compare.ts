import type { Product } from "@/types/catalog";

/**
 * From a product list (e.g. search results), pick up to 4 comparable offers:
 * same product group, one listing per store (cheapest per store).
 */
export function getCompareCandidateIds(products: Product[]): number[] {
  const byGroup = new Map<string, Product[]>();

  for (const product of products) {
    const groupId = product.product_group_id || product.group_id;
    if (!groupId) {
      continue;
    }

    const group = byGroup.get(groupId) ?? [];
    group.push(product);
    byGroup.set(groupId, group);
  }

  let bestCandidates: Product[] = [];

  for (const group of byGroup.values()) {
    const byStore = new Map<number, Product>();

    for (const product of group) {
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
  return match?.name ?? null;
}
