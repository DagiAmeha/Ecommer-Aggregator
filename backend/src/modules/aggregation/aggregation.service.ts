import axios from "axios";
import { pool } from "../../config/db";
import { createProductRecord } from "../product/product.service";
import { createStore } from "../store/store.service";
import {
  activateStoreSource,
  createStoreSource,
  findActiveApiSources,
  findStoreSourceByStoreAndUrl,
  StoreSource,
} from "../store/store_source.model";
import { createUserRecord, getUserByEmail } from "../user/user.service";

const DEFAULT_API_SOURCE_URL = "https://fakestoreapi.com/products";
const DEFAULT_STORE_NAME = "FakeStore API";
const FAKESTORE_SYSTEM_UID = "system:fakestore-api";
const FAKESTORE_SYSTEM_EMAIL = "fakestore-api@system.local";

export interface FakeStoreApiProduct {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
}

export interface ImportedProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  store_id: number;
}

interface SourceImportError {
  source_id: number;
  store_id: number;
  url: string;
  error: string;
}

interface ImportResult {
  products_imported: number;
  sources_processed: number;
  sources_failed: number;
  source_errors: SourceImportError[];
}

async function getOrCreateDefaultStore(): Promise<{
  id: number;
  store_name: string;
}> {
  const existingVendor = await pool.query<{ id: number; store_name: string }>(
    `
      SELECT id, store_name
      FROM stores
      WHERE store_name = $1
      LIMIT 1
    `,
    [DEFAULT_STORE_NAME],
  );

  if (existingVendor.rows[0]) {
    return existingVendor.rows[0];
  }

  const existingUser = await getUserByEmail(FAKESTORE_SYSTEM_EMAIL);
  const systemUser =
    existingUser ??
    (await createUserRecord({
      firebase_uid: FAKESTORE_SYSTEM_UID,
      email: FAKESTORE_SYSTEM_EMAIL,
      full_name: DEFAULT_STORE_NAME,
      phone_number: "0000000000",
      role: "vendor",
    }));

  const createdVendor = await createStore({
    owner_id: systemUser.id,
    store_name: DEFAULT_STORE_NAME,
    description: "System store for imported API products",
    is_active: true,
  });

  return {
    id: createdVendor.id,
    store_name: createdVendor.store_name,
  };
}

async function saveImportedProduct(
  apiProduct: FakeStoreApiProduct,
  storeId: number,
): Promise<void> {
  await createProductRecord({
    name: apiProduct.title,
    description: apiProduct.description,
    price: apiProduct.price,
    category: apiProduct.category,
    store_id: storeId,
    image_url: apiProduct.image,
    source: "api",
    external_id: apiProduct.id,
    product_url:
      "https://jiji.com.et/bole/audio-and-music-equipment/sanen-sa200a-40w-outdoor-indoor-wireless-speaker-dj4rfg5Zcjt2yR32UK1OxWcH.html?page=1&pos=1&cur_pos=1&ads_per_page=23&ads_count=3937&lid=V3KJIBF5o0c6S9Pl&indexPosition=0",
  });
}

async function fetchProducts(source: StoreSource): Promise<any[]> {
  try {
    const response = await axios.get<any>(source.url, {
      timeout: 15000,
    });

    console.log("Response data:", response.data);
    const payload = response.data as any;
    const rawList = Array.isArray(payload)
      ? payload
      : payload?.data && Array.isArray(payload.data)
        ? payload.data
        : null;

    if (!rawList) {
      throw new Error("Source returned an invalid payload: Expected an array.");
    }

    return rawList;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.statusText || error.message;
      throw new Error(`API request failed: ${message}`);
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to fetch source products");
  }
}

export async function importFromActiveSources(): Promise<ImportResult> {
  const sources = await findActiveApiSources();
  const sourceErrors: SourceImportError[] = [];
  let importedCount = 0;
  let processedSources = 0;

  for (const source of sources) {
    try {
      const products = await fetchProducts(source);

      for (const product of products) {
        const apiProduct: FakeStoreApiProduct = {
          id: product.id || product._id,
          ...product,
        };
        await saveImportedProduct(apiProduct, source.store_id);
        importedCount += 1;
      }

      processedSources += 1;
    } catch (error) {
      sourceErrors.push({
        source_id: source.id,
        store_id: source.store_id,
        url: source.url,
        error:
          error instanceof Error ? error.message : "Unknown source failure",
      });
      console.error(
        `[aggregation] import failed for source ${source.id} (${source.url}):`,
        error,
      );
    }
  }

  if (processedSources === 0 && sourceErrors.length > 0) {
    throw new Error("All active sources failed during import");
  }

  return {
    products_imported: importedCount,
    sources_processed: processedSources,
    sources_failed: sourceErrors.length,
    source_errors: sourceErrors,
  };
}
