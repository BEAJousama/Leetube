import { type z } from "zod";
import { type EnvSchema } from "./Env";
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof EnvSchema> {}
  }
}
