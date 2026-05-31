import { z } from "zod";

export const scrapingSyncParamsSchema = z.object({
  sourceId: z.coerce
    .number()
    .int("sourceId must be an integer")
    .positive("sourceId must be a positive number"),
});

export const scrapingSyncQuerySchema = z.object({
  pages: z.coerce.number().int().min(1).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
