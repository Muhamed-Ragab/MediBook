import { z } from "zod";

export const doctorProfileSchema = z.object({
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  phone: z.string().max(20, "Phone must be under 20 characters").optional(),
  photo_url: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

export const patientProfileSchema = z.object({
  phone: z.string().max(20, "Phone must be under 20 characters").optional(),
  date_of_birth: z.string().optional(),
  emergency_contact: z
    .string()
    .max(100, "Emergency contact must be under 100 characters")
    .optional(),
});
