import { z } from "zod";
import { t } from "i18next";
import { PasswordSchema } from "./PasswordSchema";

export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, t("ForgotPasswordSchema.email.required"))
    .email(t("ForgotPasswordSchema.email.invalid")),
});

export const ResetPasswordSchema = z
  .object({
    password: PasswordSchema,
    confirmPassword: z
      .string()
      .min(1, t("ResetPasswordSchema.confirmPassword.required")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("ResetPasswordSchema.confirmPassword.match"),
    path: ["confirmPassword"],
  });

export type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof ResetPasswordSchema>;
