import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/api-response";

function buildValidationDetails(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "request";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    sendError(res, "Validation failed", 400, buildValidationDetails(err));
    return;
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    err.code === "23505"
  ) {
    sendError(res, "Resource already exists", 409);
    return;
  }

  if (err instanceof Error) {
    console.error("Error:", err);
    sendError(res, err.message, 500);
    return;
  }

  sendError(res, "Internal server error", 500);
}
