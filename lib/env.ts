import { z } from "zod";

const booleanSchema = z.preprocess((value) => {
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().default(false));

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url("Invalid NEXT_PUBLIC_APP_URL"),
  NEXT_PUBLIC_SITE_URL: z.string().url("Invalid NEXT_PUBLIC_SITE_URL"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().url("Invalid NEXT_PUBLIC_MAP_STYLE_URL").optional(),
  NEXT_PUBLIC_USE_MOCK_DATA: booleanSchema,
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const serverEnvSchema = publicEnvSchema.extend({
  APP_URL: z.string().url("Invalid APP_URL"),
  SUPABASE_URL: z.string().url("Invalid SUPABASE_URL"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  BILLING_PORTAL_URL: z.string().url("Invalid BILLING_PORTAL_URL").optional(),
  SUPPORT_EMAIL: z.string().email("Invalid SUPPORT_EMAIL").default("support@movrr.nl"),
});

type PublicEnv = z.infer<typeof publicEnvSchema>;
type ServerEnv = z.infer<typeof serverEnvSchema>;

const isBrowser = typeof window !== "undefined";

function parseEnv(): PublicEnv | ServerEnv {
  const publicValues = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL,
    NEXT_PUBLIC_USE_MOCK_DATA: process.env.NEXT_PUBLIC_USE_MOCK_DATA,
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    if (isBrowser) {
      return publicEnvSchema.parse(publicValues);
    }

    return serverEnvSchema.parse({
      ...publicValues,
      APP_URL: process.env.APP_URL,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      BILLING_PORTAL_URL: process.env.BILLING_PORTAL_URL,
      SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n");
      throw new Error(`Invalid environment variables:\n${message}`);
    }
    throw error;
  }
}

export const env = parseEnv();
const serverEnv = !isBrowser ? (env as ServerEnv) : undefined;

export const APP_URL = serverEnv?.APP_URL ?? env.NEXT_PUBLIC_APP_URL;
export const NEXT_PUBLIC_APP_URL = env.NEXT_PUBLIC_APP_URL;
export const NEXT_PUBLIC_SITE_URL = env.NEXT_PUBLIC_SITE_URL;
export const NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
export const NEXT_PUBLIC_SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const NEXT_PUBLIC_MAP_STYLE_URL = env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";
export const NEXT_PUBLIC_USE_MOCK_DATA = env.NEXT_PUBLIC_USE_MOCK_DATA;
export const SUPABASE_URL = serverEnv?.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = serverEnv?.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const BILLING_PORTAL_URL = serverEnv?.BILLING_PORTAL_URL ?? "";
export const SUPPORT_EMAIL = serverEnv?.SUPPORT_EMAIL ?? "support@movrr.nl";
export const NODE_ENV = env.NODE_ENV;
export const isProduction = NODE_ENV === "production";
