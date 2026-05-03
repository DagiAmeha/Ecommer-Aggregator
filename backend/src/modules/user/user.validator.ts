import { z } from "zod";
import { USER_ROLES } from "./user.model";

const userRoleSchema = z.enum(USER_ROLES);

export const createUserSchema = z.object({
  firebase_uid: z.string().min(1),
  email: z.string().email(),
  full_name: z.string().min(1),
  phone_number: z.string().min(1),
  role: userRoleSchema.optional(),
});

export const registerUserSchema = z.object({
  uid: z.string().min(1),
  full_name: z.string().min(1),
  email: z.string().email(),
  phone: z
    .string()
    .regex(/^\+2519\d{8}$/, "phone must be a valid Ethiopian mobile number"),
});

export const updateMyProfileSchema = z
  .object({
    email: z.string().email().optional(),
    full_name: z.string().min(1).optional(),
    phone_number: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      typeof data.email !== "undefined" ||
      typeof data.full_name !== "undefined" ||
      typeof data.phone_number !== "undefined",
    {
      message:
        "At least one field (email or full_name or phone_number) must be provided",
    },
  );

export const updateUserRoleSchema = z.object({
  role: userRoleSchema,
});
