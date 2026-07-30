import z from "zod";
import { t } from "i18next";
import { PasswordSchema } from "./PasswordSchema";

export const LoginCredentialsSchema = z.object({
  username: z
    .string({ message: t("LoginSchema.username.required") })
    .min(1, t("LoginSchema.username.required"))
    .refine(
      (value: string) => {
        // Check if it's a valid email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // Check if it's a valid username (3-30 chars, alphanumeric + underscore)
        const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;

        return emailRegex.test(value) || usernameRegex.test(value);
      },
      {
        message: t("LoginSchema.username.invalid"),
      },
    ),
  password: PasswordSchema,
});

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
