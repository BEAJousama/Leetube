import { z } from "zod";
import { LoginCredentialsSchema } from "./LoginSchema";
import { t } from "i18next";

export const UserRegistrationSchema = LoginCredentialsSchema.extend({
  firstName: z
    .string()
    .min(2, { message: t("RegistrationSchema.firstName.min") })
    .max(50, { message: t("RegistrationSchema.firstName.max") }),
  lastName: z
    .string()
    .min(2, { message: t("RegistrationSchema.lastName.min") })
    .max(50, { message: t("RegistrationSchema.lastName.max") }),
  email: z.string().email({ message: t("RegistrationSchema.email.invalid") }),
});
