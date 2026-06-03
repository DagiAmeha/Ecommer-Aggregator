import { randomUUID } from "crypto";
import { insertProductImage } from "../modules/product/productImage.model";

/**
 * Path (relative to the API root) under which uploaded images are served. The
 * product router is mounted at /api/products, so the public URL is
 * `${baseUrl}/api/products/images/${id}`.
 */
const IMAGE_PATH_SEGMENT = "/api/products/images/";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/**
 * Error thrown when an uploaded image is missing, too large, or not a
 * supported image type. The vendor controller maps this to a 400 so vendors
 * get actionable feedback instead of a generic 500.
 */
export class ImageStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageStorageError";
  }
}

function normalizeContentType(contentType: string | undefined): string {
  return String(contentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

/**
 * Persist uploaded image bytes in the database and return a public URL served
 * by our own API.
 *
 * Storing the bytes in Postgres (the only persistent storage configured) means
 * the image works on any host — including serverless/ephemeral ones like
 * Vercel — with no extra accounts, buckets, or env vars.
 *
 * @param buffer      Decoded image bytes.
 * @param contentType MIME type reported by the browser (e.g. "image/png").
 * @param baseUrl     Public origin of this backend, derived from the request.
 */
export async function storeImageBytes(
  buffer: Buffer,
  contentType: string | undefined,
  baseUrl: string,
): Promise<string> {
  const type = normalizeContentType(contentType);

  if (!ALLOWED_CONTENT_TYPES.has(type)) {
    throw new ImageStorageError(
      "Unsupported image type. Please upload a JPEG, PNG, WebP, GIF, or AVIF.",
    );
  }

  if (buffer.byteLength === 0) {
    throw new ImageStorageError("The uploaded image was empty.");
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new ImageStorageError("The image is larger than the 5MB limit.");
  }

  const id = randomUUID();
  await insertProductImage(id, buffer, type);

  return `${baseUrl.replace(/\/+$/, "")}${IMAGE_PATH_SEGMENT}${id}`;
}
