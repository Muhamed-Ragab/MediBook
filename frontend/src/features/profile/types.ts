import { z } from "zod";
import { doctorProfileSchema, patientProfileSchema } from "@/features/profile/constants";

export type DoctorProfileForm = z.infer<typeof doctorProfileSchema>;

export type PatientProfileForm = z.infer<typeof patientProfileSchema>;
