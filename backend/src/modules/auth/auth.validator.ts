import { z } from "zod";
import { USER_ROLES } from "../user/user.model";

const signUpRoleSchema = z.enum(USER_ROLES).exclude(["admin"]);

export const authContextSchema = z.object({
  uid: z.string().min(1),
  email: z.string().email().optional(),
});

export const signUpSchema = z.object({
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  fullName: z.string().min(1),
  phoneNumber: z.string().min(1),
});

export const signInSchema = z.object({
  idToken: z.string().min(1),
});

export const logoutSchema = z.object({
  firebaseUid: z.string().min(1).optional(),
});
