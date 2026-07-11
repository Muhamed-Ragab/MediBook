import { useAdminSpecialties } from "@/features/admin/hooks/useAdminSpecialties";

export default function AdminSpecialties() {
  const {
    specialties,
    isLoading,
    isError,
    formName,
    formDescription,
    formError,
    addModalRef,
    editModalRef,
    deleteModalRef,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    deleteTarget,
    setFormName,
    setFormDescription,
    setModalMode,
    setEditingSpecialty,
    setDeleteTarget,
    handleAdd,
    handleEdit,
    handleDelete,
    openEdit,
    openDelete,
  } = useAdminSpecialties();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-error font-medium">Failed to load specialties</p>
          <p className="text-base-content/60 text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Specialties</h1>
          <p className="text-base-content/60 mt-1">
            {specialties && specialties.length > 0
              ? `${specialties.length} specialt${specialties.length !== 1 ? "ies" : "y"} configured`
              : "Configure medical specialties"}
          </p>
        </div>
        <button onClick={() => setModalMode("add")} className="btn btn-primary">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
          Add Specialty
        </button>
      </div>

      {!specialties || specialties.length === 0 ? (
        <div className="card bg-base-100 border border-base-200">
          <div className="card-body items-center py-16">
            <p className="text-base-content/40 font-medium">No specialties found</p>
            <p className="text-base-content/30 text-sm">
              Click "Add Specialty" to create the first one
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 border border-base-200">
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th className="w-40">Actions</th>
                </tr>
              </thead>
              <tbody>
                {specialties.map((specialty) => (
                  <tr key={specialty.id}>
                    <td className="font-medium">{specialty.name}</td>
                    <td className="text-base-content/70 max-w-md truncate">
                      {specialty.description || (
                        <span className="text-base-content/30 italic">No description</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          aria-label={`Edit ${specialty.name}`}
                          onClick={() => openEdit(specialty)}
                          className="btn btn-xs btn-ghost"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${specialty.name}`}
                          onClick={() => openDelete(specialty)}
                          className="btn btn-xs btn-ghost text-error"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <dialog ref={addModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Add Specialty</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            className="space-y-4"
          >
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Name</legend>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Cardiology"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Description</legend>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Optional description"
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </fieldset>
            {formError && <p className="text-error text-sm">{formError}</p>}
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  addModalRef.current?.close();
                  setModalMode(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createSpecialty.isPending}
              >
                {createSpecialty.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : null}
                Add Specialty
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" onClick={() => setModalMode(null)}>
            close
          </button>
        </form>
      </dialog>

      {/* Edit Modal */}
      <dialog ref={editModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Specialty</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEdit();
            }}
            className="space-y-4"
          >
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Name</legend>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Cardiology"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                autoFocus
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Description</legend>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Optional description"
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </fieldset>
            {formError && <p className="text-error text-sm">{formError}</p>}
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  editModalRef.current?.close();
                  setModalMode(null);
                  setEditingSpecialty(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updateSpecialty.isPending}
              >
                {updateSpecialty.isPending ? (
                  <span className="loading loading-spinner loading-xs" />
                ) : null}
                Save Changes
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button
            type="submit"
            onClick={() => {
              setModalMode(null);
              setEditingSpecialty(null);
            }}
          >
            close
          </button>
        </form>
      </dialog>

      {/* Delete Confirmation Modal */}
      <dialog ref={deleteModalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Delete Specialty</h3>
          <p className="text-base-content/70">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deleteTarget?.name}</span>? This action cannot be
            undone.
          </p>
          {deleteSpecialty.isError && (
            <p className="text-error text-sm mt-2">{deleteSpecialty.error.message}</p>
          )}
          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                deleteModalRef.current?.close();
                setDeleteTarget(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-error"
              onClick={handleDelete}
              disabled={deleteSpecialty.isPending}
            >
              {deleteSpecialty.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : null}
              Delete
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" onClick={() => setDeleteTarget(null)}>
            close
          </button>
        </form>
      </dialog>
    </div>
  );
}
