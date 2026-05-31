import { z } from "zod";

export const createReviewSchema = z.object({
  product_id: z
    .number()
    .int()
    .positive("product_id must be a positive integer"),
  rating: z
    .number()
    .int("rating must be an integer")
    .min(1, "rating must be between 1 and 5")
    .max(5, "rating must be between 1 and 5"),
  comment: z.string().trim().max(2000).optional(),
});

export const reviewIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive number"),
});

export const productIdParamSchema = z.object({
  productId: z.coerce
    .number()
    .int("productId must be an integer")
    .positive("productId must be a positive number"),
});
