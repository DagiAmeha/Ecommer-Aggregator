import {
  CreateSavedSearchInput,
  SavedSearch,
  deleteSavedSearch,
  findSavedSearches,
  insertSavedSearch,
} from "./savedSearch.model";

export async function createSavedSearch(
  userId: number,
  input: CreateSavedSearchInput,
): Promise<SavedSearch> {
  return insertSavedSearch(userId, input);
}

export async function listSavedSearches(
  userId: number,
): Promise<SavedSearch[]> {
  return findSavedSearches(userId);
}

export async function removeSavedSearch(
  userId: number,
  id: number,
): Promise<boolean> {
  return deleteSavedSearch(userId, id);
}
