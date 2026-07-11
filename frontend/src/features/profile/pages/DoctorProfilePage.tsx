import { useDoctorProfileForm } from "@/features/profile/hooks/useDoctorProfileForm";

export default function DoctorProfilePage() {
  const {
    profile,
    isLoading,
    isError,
    error,
    updateMutation,
    register,
    errors,
    isDirty,
    reset,
    onSubmit,
  } = useDoctorProfileForm();

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
          <label className="label py-1" htmlFor="specialty">
            <span className="label-text text-sm font-medium">Specialty</span>
          </label>
          <input
            id="specialty"
            type="text"
            className="input input-bordered w-full text-sm"
            value={profile?.specialty ?? ""}
            disabled
          />
        </fieldset>

        <fieldset className="form-control">
          <label className="label py-1" htmlFor="bio">
            <span className="label-text text-sm font-medium">Bio</span>
          </label>
          <textarea
            id="bio"
            rows={4}
            placeholder="Tell patients about yourself..."
            className={`textarea textarea-bordered w-full text-sm ${
              errors.bio ? "textarea-error" : ""
            }`}
            {...register("bio")}
          />
          {errors.bio && (
            <p className="text-xs text-error mt-1">{errors.bio.message}</p>
          )}
        </fieldset>

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
          <label className="label py-1" htmlFor="photo_url">
            <span className="label-text text-sm font-medium">
              Profile photo URL
            </span>
          </label>
          <input
            id="photo_url"
            type="url"
            placeholder="https://example.com/photo.jpg"
            className={`input input-bordered w-full text-sm ${
              errors.photo_url ? "input-error" : ""
            }`}
            {...register("photo_url")}
          />
          {errors.photo_url && (
            <p className="text-xs text-error mt-1">
              {errors.photo_url.message}
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
