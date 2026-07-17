import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/utils/api";
import type { Specialty } from "@/shared/types";

// Specialties are a public/global catalog (GET /api/specialties/ is AllowAny),
// so the hook lives in shared/ rather than any single feature.
export function useSpecialties() {
  return useQuery<Specialty[]>({
    queryKey: ["specialties"],
    queryFn: () => api.get<Specialty[]>("/specialties/"),
  });
}
