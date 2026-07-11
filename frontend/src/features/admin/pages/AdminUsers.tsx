import { useUsers } from "@/features/admin/api/adminApi";
import { useAdminUsers } from "@/features/admin/hooks/useAdminUsers";
import { RoleBadge } from "@/features/admin/components/RoleBadge";
import { StatusBadge } from "@/features/admin/components/StatusBadge";

export default function AdminUsers() {
  const { data: users, isLoading, isError } = useUsers();
  const { currentUser, actionUserId, handleToggle } = useAdminUsers();

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
          <p className="text-error font-medium">Failed to load users</p>
          <p className="text-base-content/60 text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
        <div className="card bg-base-100 border border-base-200">
          <div className="card-body items-center py-16">
            <p className="text-base-content/40 font-medium">No users found</p>
            <p className="text-base-content/30 text-sm">
              Users will appear here once they register
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
        <p className="text-base-content/60 mt-1">
          {users.length} user{users.length !== 1 ? "s" : ""} registered
        </p>
      </div>

      <div className="card bg-base-100 border border-base-200">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-medium">{user.username}</td>
                  <td className="text-base-content/70">{user.email}</td>
                  <td>
                    <RoleBadge role={user.role} />
                  </td>
                  <td>
                    <StatusBadge user={user} />
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggle(user)}
                      disabled={
                        actionUserId === user.id ||
                        user.role === "admin" ||
                        user.id === currentUser?.id
                      }
                      className={`btn btn-xs ${
                        user.is_blocked
                          ? "btn-success"
                          : user.is_approved
                            ? "btn-error"
                            : "btn-primary"
                      }`}
                      title={
                        user.role === "admin" || user.id === currentUser?.id
                          ? "Cannot modify admin users"
                          : undefined
                      }
                    >
                      {actionUserId === user.id ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : user.is_blocked ? (
                        "Unblock"
                      ) : user.is_approved ? (
                        "Block"
                      ) : (
                        "Approve"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
