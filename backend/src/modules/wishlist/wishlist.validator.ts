import { z } from "zod";

export const addWishlistSchema = z.object({
  product_id: z
    .number()
    .int()
    .positive("product_id must be a positive integer"),
});

export const productIdParamSchema = z.object({
  productId: z.coerce
    .number()
    .int("productId must be an integer")
    .positive("productId must be a positive number"),
});
