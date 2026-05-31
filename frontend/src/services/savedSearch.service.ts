import { apiRequest } from "./api";

export interface SavedSearch {
  id: number;
  user_id: number;
  query: string;
  category: string | null;
  min_price: number | null;
  max_price: number | null;
  created_at: string;
}

export interface CreateSavedSearchInput {
  query: string;
  category?: string;
  min_price?: number;
  max_price?: number;
}

export async function createSavedSearch(
  input: CreateSavedSearchInput,
): Promise<{ savedSearch: SavedSearch }> {
  return apiRequest<{ savedSearch: SavedSearch }>("/saved-searches", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchSavedSearches(): Promise<{ items: SavedSearch[] }> {
  return apiRequest<{ items: SavedSearch[] }>("/saved-searches");
}

export async function deleteSavedSearch(id: number): Promise<void> {
  await apiRequest<{ deleted: boolean }>(`/saved-searches/${id}`, {
    method: "DELETE",
  });
}
