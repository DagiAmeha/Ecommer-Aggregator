import { z } from "zod";

export const createSavedSearchSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "query is required")
    .max(255, "query must be at most 255 characters"),
  category: z
    .string()
    .trim()
    .max(100, "category must be at most 100 characters")
    .optional(),
  min_price: z.number().nonnegative("min_price cannot be negative").optional(),
  max_price: z.number().nonnegative("max_price cannot be negative").optional(),
});

export const savedSearchIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive number"),
});
