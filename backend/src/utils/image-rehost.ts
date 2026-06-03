import { randomUUID } from "crypto";
import axios from "axios";
import { insertProductImage } from "../modules/product/productImage.model";

/**
 * Path (relative to the API root) under which re-hosted images are served.
 * The product router is mounted at /api/products, so the public URL is
 * `${baseUrl}/api/products/images/${id}`.
 */
const IMAGE_PATH_SEGMENT = "/api/products/images/";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Error thrown when a remote image cannot be downloaded or is not a valid
 * image. The vendor controller maps this to a 400 so vendors get actionable
 * feedback instead of a generic 500.
 */
export class ImageRehostError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageRehostError";
  }
}

/**
 * True when `url` already points at one of our own re-hosted images, so we
 * don't download and store a second copy on every edit. Matches regardless of
 * which host served it (the origin can change between environments).
 */
export function isRehostedImageUrl(url: string): boolean {
  return url.includes(IMAGE_PATH_SEGMENT);
}

/**
 * Download an image from an arbitrary URL, persist its bytes in the database,
 * and return a public URL served by our own API.
 *
 * Re-hosting fixes the common "image URL doesn't work" failure: many sites
 * block hotlinking (403), require a Referer, or serve over http (mixed-content
 * block), so a remote URL pasted by a vendor often fails to render in the
 * browser. Storing the bytes in Postgres (the only persistent storage that's
 * configured) means the image works on any host, including serverless, with no
 * extra accounts or env vars.
 *
 * @param sourceUrl Vendor-supplied image URL.
 * @param baseUrl   Public origin of this backend, derived from the request
 *                  (e.g. "https://api.example.com"). Used to build the URL we
 *                  store on the product so the browser loads it from us.
 */
export async function rehostImageFromUrl(
  sourceUrl: string,
  baseUrl: string,
): Promise<string> {
  let response;
  try {
    response = await axios.get<ArrayBuffer>(sourceUrl, {
      responseType: "arraybuffer",
      timeout: 10_000,
      maxContentLength: MAX_IMAGE_BYTES,
      maxRedirects: 5,
      // A browser-like UA gets past the simplest hotlink/User-Agent filters.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; EcommerceAggregator/1.0; +https://localhost)",
        Accept:
          "image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8,*/*;q=0.5",
      },
    });
  } catch (error) {
    const reason =
      axios.isAxiosError(error) && error.response
        ? `the source returned HTTP ${error.response.status}`
        : "the source could not be reached";
    throw new ImageRehostError(
      `Could not download the image from that URL (${reason}). ` +
        "Check the link points directly to an image, or try a different host.",
    );
  }

  const contentType = String(response.headers["content-type"] || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (!EXTENSION_BY_CONTENT_TYPE[contentType]) {
    throw new ImageRehostError(
      "That URL does not point to a supported image " +
        "(expected JPEG, PNG, WebP, GIF, or AVIF).",
    );
  }

  const buffer = Buffer.from(response.data);
  if (buffer.byteLength === 0) {
    throw new ImageRehostError("The downloaded image was empty.");
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageRehostError("The image is larger than the 5MB limit.");
  }

  const id = randomUUID();
  await insertProductImage(id, buffer, contentType);

  return `${baseUrl.replace(/\/+$/, "")}${IMAGE_PATH_SEGMENT}${id}`;
}
