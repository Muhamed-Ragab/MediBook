import { usePatientProfileForm } from "@/features/profile/hooks/usePatientProfileForm";

export default function PatientProfilePage() {
  const {
    isLoading,
    isError,
    error,
    updateMutation,
    register,
    errors,
    isDirty,
    reset,
    onSubmit,
  } = usePatientProfileForm();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>
            {error instanceof Error
              ? error.message
              : "Failed to load profile"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-base-content mb-6">
        Edit Profile
      </h1>

      {updateMutation.isSuccess && (
        <div className="alert alert-success mb-6" role="alert">
          <span>Profile updated successfully</span>
        </div>
      )}

      {updateMutation.isError && (
        <div className="alert alert-error mb-6" role="alert">
          <span>
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "Failed to update profile"}
          </span>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <fieldset className="form-control">
          <label className="label py-1" htmlFor="phone">
            <span className="label-text text-sm font-medium">Phone</span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            className={`input input-bordered w-full text-sm ${
              errors.phone ? "input-error" : ""
            }`}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-error mt-1">{errors.phone.message}</p>
          )}
        </fieldset>

        <fieldset className="form-control">
          <label className="label py-1" htmlFor="date_of_birth">
            <span className="label-text text-sm font-medium">
              Date of Birth
            </span>
          </label>
          <input
            id="date_of_birth"
            type="date"
            className={`input input-bordered w-full text-sm ${
              errors.date_of_birth ? "input-error" : ""
            }`}
            {...register("date_of_birth")}
          />
          {errors.date_of_birth && (
            <p className="text-xs text-error mt-1">
              {errors.date_of_birth.message}
            </p>
          )}
        </fieldset>

        <fieldset className="form-control">
          <label className="label py-1" htmlFor="emergency_contact">
            <span className="label-text text-sm font-medium">
              Emergency Contact
            </span>
          </label>
          <input
            id="emergency_contact"
            type="text"
            placeholder="Name and phone number"
            className={`input input-bordered w-full text-sm ${
              errors.emergency_contact ? "input-error" : ""
            }`}
            {...register("emergency_contact")}
          />
          {errors.emergency_contact && (
            <p className="text-xs text-error mt-1">
              {errors.emergency_contact.message}
            </p>
          )}
        </fieldset>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <span className="loading loading-spinner loading-sm" />
            ) : null}
            Save Changes
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => reset()}
            disabled={!isDirty}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
