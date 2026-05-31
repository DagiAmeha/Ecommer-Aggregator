import { z } from "zod";
import { USER_ROLES } from "../user/user.model";

const statusSchema = z.enum(["active", "suspended"]);
const roleSchema = z.enum(USER_ROLES);

export const adminUserIdParamsSchema = z.object({
  id: z.coerce.number().int().positive("id must be a positive integer"),
});

export const adminListUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  search: z.string().trim().min(1).optional(),
  role: roleSchema.optional(),
  status: statusSchema.optional(),
});

export const adminCreateVendorSchema = z
  .object({
    full_name: z.string().trim().min(1, "full_name is required"),
    email: z.string().email("email must be valid"),
    phone: z
      .string()
      .regex(/\+2519\d{8}/, "phone must be a valid Ethiopian mobile number"),
    store_name: z.string().trim().min(1, "store_name is required"),
    password: z.string().min(6, "password must be at least 6 characters"),
    source_type: z.enum(["manual", "api", "scraping"]).optional(),
    source_url: z.string().url("source_url must be a valid URL").optional(),
  })
  .refine(
    (data) => {
      if (!data.source_type || data.source_type === "manual") {
        return true;
      }

      return Boolean(data.source_url && data.source_url.trim().length > 0);
    },
    {
      message: "source_url is required for API or scraping sources",
      path: ["source_url"],
    },
  );

export const adminUpdateRoleSchema = z.object({
  role: roleSchema,
});
