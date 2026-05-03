import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  description: z.string().trim().optional(),
  price: z.number().nonnegative("price must be a non-negative number"),
  category: z.string().trim(),
  store_id: z.number().int().positive("store_id must be a positive integer"),
  image_url: z.string().url("image_url must be a valid URL").optional(),
});

export const productSearchQuerySchema = z.object({
  search: z.string().trim().optional(),
  category: z.string().trim().optional(),
  keywords: z.string().trim().optional(),
  ids: z.string().trim().optional(),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});
