import { z } from "zod";

const schema = z.object({
  APP_NAME: z.string().default("AI LeadFlow CRM"),
  APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required (mongodb://...)"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be set (openssl rand -hex 32)"),
  AI_API_KEY: z.string().default(""),
  AI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  AI_MODEL: z.string().default("gpt-4o-mini"),
  EMAIL_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("AI LeadFlow CRM <noreply@example.com>"),
  ADMIN_NAME: z.string().default("Admin"),
  ADMIN_EMAIL: z.string().default(""),
  ADMIN_PASSWORD: z.string().default(""),
  INVITE_TTL_HOURS: z.coerce.number().int().positive().default(48),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ");
  throw new Error("Invalid environment configuration -> " + issues);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
