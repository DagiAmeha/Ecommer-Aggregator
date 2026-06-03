import { Request } from "express";

/**
 * Derive this backend's public origin (e.g. "https://api.example.com") from
 * the incoming request. With `trust proxy` enabled, req.protocol reflects the
 * X-Forwarded-Proto header, so this stays correct behind Vercel/host proxies
 * without any hard-coded base-URL env var.
 */
export function getRequestBaseUrl(req: Request): string {
  return `${req.protocol}://${req.get("host")}`;
}
