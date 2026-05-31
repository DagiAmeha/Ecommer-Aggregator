import { z } from "zod";

export const vendorStoreProfileSchema = z.object({
  store_name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().max(2000).optional(),
  is_active: z.boolean().optional(),
});
