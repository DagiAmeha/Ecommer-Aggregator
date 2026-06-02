import { findActiveApiSources } from "../store/store_source.model";
import {
  ApiSourceSyncResult,
  syncApiSourceById,
} from "./apiImport.service";

interface SourceImportError {
  source_id: number;
  store_id: number;
  url: string;
  error: string;
}

interface ImportResult {
  imported_products: number;
  updated_products: number;
  failed_products: number;
  sources_processed: number;
  sources_failed: number;
  source_errors: SourceImportError[];
}

function accumulateResult(
  total: ImportResult,
  partial: ApiSourceSyncResult,
): void {
  total.imported_products += partial.imported_products;
  total.updated_products += partial.updated_products;
  total.failed_products += partial.failed_products;
}

/** Admin/batch import for every active API source in the system. */
export async function importFromActiveSources(): Promise<ImportResult> {
  const sources = await findActiveApiSources();
  const sourceErrors: SourceImportError[] = [];
  const result: ImportResult = {
    imported_products: 0,
    updated_products: 0,
    failed_products: 0,
    sources_processed: 0,
    sources_failed: 0,
    source_errors: sourceErrors,
  };

  for (const source of sources) {
    try {
      const partial = await syncApiSourceById(source);
      accumulateResult(result, partial);
      result.sources_processed += 1;
    } catch (error) {
      sourceErrors.push({
        source_id: source.id,
        store_id: source.store_id,
        url: source.url,
        error:
          error instanceof Error ? error.message : "Unknown source failure",
      });
      result.sources_failed += 1;
      console.error(
        `[aggregation] import failed for source ${source.id} (${source.url}):`,
        error,
      );
    }
  }

  if (result.sources_processed === 0 && sourceErrors.length > 0) {
    throw new Error("All active sources failed during import");
  }

  return result;
}
