import { useState } from "react";
import { useNavigate } from "react-router";
import { useSpecialties } from "@/features/admin/api/adminApi";
import DoctorCard from "../components/DoctorCard";
import { useDoctors } from "../api/useDoctors";

export default function DoctorSearchPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");

  const { data: doctors = [], isLoading } = useDoctors(
    search || undefined,
    specialty || undefined,
  );
  const { data: specialties = [] } = useSpecialties();

  function handleDoctorClick(id: number) {
    navigate(`/patient/doctors/${id}`);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Find a Doctor</h1>

      <div className="flex gap-3 mb-6">
        <label className="input input-bordered flex items-center gap-2 flex-1">
          <span className="sr-only">Search by name</span>
          <input
            type="text"
            className="grow"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search by name"
          />
        </label>

        <select
          className="select select-bordered w-48"
          value={specialty}
          onChange={(e) => setSpecialty(e.target.value)}
        >
          <option value="">All Specialties</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          <p className="text-lg">No doctors found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onClick={handleDoctorClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
