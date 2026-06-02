import axios from "axios";
import {
  createImportJob,
  completeImportJob,
} from "../importJob/importJob.model";
import * as cheerio from "cheerio";
import {
  normalizeProductTitle,
  upsertApiProduct,
} from "../product/product.model";
import { getStoreByOwnerId } from "../store/store.service";
import {
  findStoreSourceById,
  updateStoreSourceSyncStatus,
  StoreSource,
} from "../store/store_source.model";

const DEFAULT_MAX_PAGES = 3;
const DEFAULT_MAX_PRODUCTS = 50;
const BOOKS_BASE_HOST = "books.toscrape.com";
const DEFAULT_CATEGORY = "Books";

interface ScrapedBook {
  name: string;
  price: number;
  image_url: string | null;
  product_url: string;
  availability: string | null;
  external_id: string;
  rating: number | null;
}

function buildPageUrl(baseUrl: string, page: number): string {
  const base = new URL(baseUrl);
  const path = `catalogue/page-${page}.html`;
  return new URL(path, base).toString();
}

function resolveUrl(value: string | undefined, baseUrl: string): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function parsePrice(value: string): number | null {
  const normalized = value.replace(/[^0-9.]/g, "").trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRating(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const classes = value.split(/\s+/);
  const ratingClass = classes.find((item) => item !== "star-rating");
  if (!ratingClass) {
    return null;
  }

  const mapping: Record<string, number> = {
    One: 1,
    Two: 2,
    Three: 3,
    Four: 4,
    Five: 5,
  };

  return mapping[ratingClass] ?? null;
}

function parseBooksFromHtml(html: string, pageUrl: string): ScrapedBook[] {
  const $ = cheerio.load(html);
  const products: ScrapedBook[] = [];

  $("article.product_pod").each((_index, element) => {
    const node = $(element);
    const title = node.find("h3 a").attr("title")?.trim();
    const priceText = node.find(".price_color").text().trim();
    const price = parsePrice(priceText);
    const imageSrc = node.find("img").attr("src");
    const linkHref = node.find("h3 a").attr("href");
    const ratingClass = node.find(".star-rating").attr("class");
    const availability = node
      .find(".availability")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (!title || price === null || !linkHref) {
      return;
    }

    const productUrl = resolveUrl(linkHref, pageUrl);
    if (!productUrl) {
      return;
    }

    const imageUrl = resolveUrl(imageSrc, pageUrl);

    products.push({
      name: title,
      price,
      image_url: imageUrl,
      product_url: productUrl,
      availability: availability || null,
      external_id: productUrl,
      rating: parseRating(ratingClass),
    });
  });

  return products;
}

async function fetchBooksFromSource(
  source: StoreSource,
  options: { pages?: number; limit?: number },
): Promise<ScrapedBook[]> {
  const baseUrl = source.url;
  const baseHost = new URL(baseUrl).hostname;
  if (baseHost !== BOOKS_BASE_HOST) {
    throw new Error("Scraping is restricted to books.toscrape.com");
  }

  const maxPages = Math.min(
    options.pages ?? DEFAULT_MAX_PAGES,
    DEFAULT_MAX_PAGES,
  );
  const maxProducts = Math.min(
    options.limit ?? DEFAULT_MAX_PRODUCTS,
    DEFAULT_MAX_PRODUCTS,
  );
  const results: ScrapedBook[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    if (results.length >= maxProducts) {
      break;
    }

    const pageUrl = buildPageUrl(baseUrl, page);

    try {
      const response = await axios.get<string>(pageUrl, {
        timeout: 15000,
      });
      const parsed = parseBooksFromHtml(response.data, pageUrl);

      for (const item of parsed) {
        results.push(item);
        if (results.length >= maxProducts) {
          break;
        }
      }
    } catch (error) {
      console.error(`[scraping] failed to fetch ${pageUrl}:`, error);
    }
  }

  return results;
}

export async function syncScrapingSourceForVendor(
  userId: number,
  sourceId: number,
  options: { pages?: number; limit?: number },
): Promise<{
  imported_products: number;
  updated_products: number;
  failed_products: number;
}> {
  const store = await getStoreByOwnerId(userId);
  if (!store) {
    throw new Error("Vendor store not found");
  }

  const source = await findStoreSourceById(sourceId);
  if (!source || source.store_id !== store.id || source.type !== "scraping") {
    throw new Error("Scraping source not found for this vendor");
  }

  if (!source.is_active) {
    throw new Error("Scraping source is disabled");
  }

  const job = await createImportJob({
    store_id: source.store_id,
    source_id: source.id,
    job_type: "scraping",
  });

  const items = await fetchBooksFromSource(source, options);

  let importedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  for (const item of items) {
    try {
      const normalizedTitle = normalizeProductTitle(item.name);
      const action = await upsertApiProduct({
        name: normalizedTitle,
        description: item.availability ?? undefined,
        price: item.price,
        category: DEFAULT_CATEGORY,
        store_id: source.store_id,
        image_url: item.image_url ?? undefined,
        product_url: item.product_url,
        external_id: item.external_id,
        source: "scraping",
        external_rating_rate: item.rating,
        external_rating_count: null,
        stock_quantity: item.availability?.toLowerCase().includes("in stock")
          ? 1
          : 0,
      });

      if (action.action === "imported") {
        importedCount += 1;
      } else {
        updatedCount += 1;
      }
    } catch (error) {
      failedCount += 1;
      console.error(
        `[scraping] product upsert failed for source ${source.id} (${source.url}):`,
        error,
      );
    }
  }

  const status =
    failedCount > 0 && importedCount + updatedCount > 0
      ? "partial"
      : failedCount > 0
        ? "failed"
        : "success";

  await updateStoreSourceSyncStatus(source.id, {
    last_sync_status: status,
    last_imported_count: importedCount,
    last_updated_count: updatedCount,
    last_failed_count: failedCount,
  });

  await completeImportJob(job.id, {
    status,
    imported_count: importedCount,
    updated_count: updatedCount,
    failed_count: failedCount,
  });

  return {
    imported_products: importedCount,
    updated_products: updatedCount,
    failed_products: failedCount,
  };
}
