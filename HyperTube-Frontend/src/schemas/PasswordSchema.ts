import z from "zod";
import { t } from "i18next";

export const PasswordSchema = z
  .string()
  .min(8, t("LoginSchema.password.min"))
  .max(100, t("LoginSchema.password.max"))
  .regex(/[A-Z]/, t("LoginSchema.password.uppercase"))
  .regex(/[a-z]/, t("LoginSchema.password.lowercase"))
  .regex(/[0-9]/, t("LoginSchema.password.number"))
  .regex(/[^a-zA-Z0-9]/, t("LoginSchema.password.special"));
export type PasswordType = z.infer<typeof PasswordSchema>;
