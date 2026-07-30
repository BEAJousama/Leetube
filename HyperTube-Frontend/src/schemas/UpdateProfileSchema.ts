import z from "zod";
import { t } from "i18next";
import { PasswordSchema } from "./PasswordSchema";

export const UpdateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: t("UpdateProfileSchema.firstName.min") })
    .max(50, { message: t("UpdateProfileSchema.firstName.max") })
    .optional(),
  lastName: z
    .string()
    .min(2, { message: t("UpdateProfileSchema.lastName.min") })
    .max(50, { message: t("UpdateProfileSchema.lastName.max") })
    .optional(),
  email: z
    .string()
    .email({ message: t("UpdateProfileSchema.email.invalid") })
    .optional(),
  username: z
    .string()
    .min(3, { message: t("UpdateProfileSchema.username.min") })
    .max(30, { message: t("UpdateProfileSchema.username.max") })
    .optional(),
  preferredLanguage: z
    .string()
    .min(2, { message: t("UpdateProfileSchema.preferredLanguage.min") })
    .optional(),
});

export const UpdatePasswordSchema = z
  .object({
    currentPassword: PasswordSchema,
    newPassword: PasswordSchema,
    confirmNewPassword: z.string().min(1, {
      message: t("UpdateProfileSchema.confirmNewPassword.required"),
    }),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: t("UpdateProfileSchema.confirmNewPassword.match"),
    path: ["confirmNewPassword"],
  });
