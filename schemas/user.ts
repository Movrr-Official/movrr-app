import { z } from "zod";

export const productRoleSchema = z.enum(["rider", "advertiser"]);
export const userStatusSchema = z.enum(["active", "inactive", "pending"]);

export const appUserSchema = z.object({
  id: z.string(),
  authUserId: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: productRoleSchema,
  status: userStatusSchema,
  avatarUrl: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
  languagePreference: z.string().default("en"),
});

export type AppUser = z.infer<typeof appUserSchema>;
export type ProductRole = z.infer<typeof productRoleSchema>;
