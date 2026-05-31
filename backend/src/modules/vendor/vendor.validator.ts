import { z } from "zod";

export const vendorProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const vendorProductCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  description: z.string().trim().optional(),
  price: z.number().nonnegative("price must be a non-negative number"),
  category_id: z
    .number()
    .int()
    .positive("category_id must be a positive integer"),
  image_url: z.string().url("image_url must be a valid URL").optional(),
  product_url: z.string().url("product_url must be a valid URL").optional(),
});

export const vendorProductUpdateSchema = vendorProductCreateSchema.partial();

export const vendorStoreSourceSchema = z.object({
  url: z.string().url("url must be a valid URL"),
  is_active: z.boolean(),
});
