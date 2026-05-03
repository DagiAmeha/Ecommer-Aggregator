import { z } from "zod";

export const createStoreSchema = z
  .object({
    owner_id: z.number().int().positive("owner_id must be a positive integer"),
    store_name: z.string().trim().min(1, "store_name is required"),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
    source_type: z.enum(["api", "manual"], {
      message: "source_type must be either 'api' or 'manual'",
    }),
    url: z.string().url("Invalid URL format").optional(),
  })
  .refine(
    (data) => {
      if (data.source_type === "api") {
        // Returns true only if url is present and not an empty string
        return !!data.url && data.url.trim().length > 0;
      }
      return true;
    },
    {
      message: "URL is required when source_type is 'api'",
      path: ["url"], // This attaches the error specifically to the url field
    },
  );

export const updateStoreSchema = z
  .object({
    store_name: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const storeIdParamSchema = z.object({
  id: z.coerce
    .number()
    .int("id must be an integer")
    .positive("id must be a positive number"),
});
