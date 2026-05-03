import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/api-response";

export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  sendError(res, "Route not found", 404, `Path: ${req.originalUrl}`);
}
