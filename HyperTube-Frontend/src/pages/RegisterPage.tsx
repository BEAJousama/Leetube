import { type UserRegistrationSchema } from "@/schemas/RegistrationSchema";
import type z from "zod";
import RegisterForm from "@/containers/RegisterForm";

export type UserRegistrationType = z.infer<typeof UserRegistrationSchema>;
const RegisterPage = () => {
  return <RegisterForm />;
};

export default RegisterPage;
