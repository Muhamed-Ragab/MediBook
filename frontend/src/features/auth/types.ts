import { z } from "zod";
import { loginSchema, registerSchema } from "@/features/auth/constants";

export type LoginForm = z.infer<typeof loginSchema>;

export type RegisterForm = z.infer<typeof registerSchema>;

export type VerifyEmailStatus = "loading" | "success" | "error";
