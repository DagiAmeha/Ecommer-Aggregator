import { z } from "zod";

export const vendorProductQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const vendorProductCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  description: z.string().trim().optional(),
  price: z.number().nonnegative("price must be a non-negative number"),
  stock_quantity: z.number().int().nonnegative().optional(),
  category_id: z
    .number()
    .int()
    .positive("category_id must be a positive integer"),
  image_url: z.string().url("image_url must be a valid URL").optional(),
  product_url: z.string().url("product_url must be a valid URL").optional(),
});

export const vendorProductUpdateSchema = vendorProductCreateSchema.partial();

export const vendorStoreSourceSchema = z
  .object({
    source_type: z.enum(["manual", "api", "scraping"]),
    url: z.string().url("url must be a valid URL").optional(),
    is_active: z.boolean().optional(),
    source_name: z.string().trim().min(1).optional(),
  })
  .refine(
    (data) => {
      if (data.source_type === "manual") {
        return true;
      }

      return Boolean(data.url && data.url.trim().length > 0);
    },
    {
      message: "URL is required for API or scraping sources",
      path: ["url"],
    },
  );
