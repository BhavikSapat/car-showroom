import React, { useState, useEffect } from "react";
import { User, UserRole } from "../../types";
import { userService } from "../../services/userService";
import { useToast } from "../common/Toast";
import {
  UserPlus,
  User as UserIcon,
  Lock,
  Loader2,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { InitialsAvatar } from "../common/InitialsAvatar";
import { Modal } from "../common/Modal";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { useAuth } from "../../context/AuthContext";

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] =
    useState<boolean>(false);

  const [regUsername, setRegUsername] = useState<string>("");
  const [regEmail, setRegEmail] = useState<string>("");
  const [regPassword, setRegPassword] = useState<string>("");
  const [regRole, setRegRole] = useState<UserRole>("MANAGER");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toast = useToast();

  // Get currently logged-in user's role
  const { role } = useAuth();

  // Only OWNER can manage system accounts
  const isOwner = role === "OWNER";

  // ============================================================
  // LOAD USERS
  // ============================================================

  const loadUsers = async () => {
    // MANAGER must never load user data
    if (!isOwner) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err: any) {
      toast.error(
        "Failed to load accounts",
        err?.message || "Unable to fetch registered accounts.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      loadUsers();
    } else {
      // Do not request the users API for MANAGER
      setUsers([]);
      setIsLoading(false);
    }
  }, [isOwner]);

  // ============================================================
  // REGISTER USER
  // ============================================================

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extra frontend safeguard
    // Even if this function is triggered manually,
    // MANAGER cannot create accounts.
    if (!isOwner) {
      toast.error(
        "Access Denied",
        "Only OWNER accounts can register new system users.",
      );

      setIsRegisterModalOpen(false);
      return;
    }

    if (!regUsername.trim() || !regPassword.trim()) {
      toast.error("Validation Error", "Username and password are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await userService.registerUser({
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword.trim(),
        role: regRole,
      });

      if (typeof res === "string") {
        toast.error("Registration Response", res);
      } else {
        toast.success(
          "Account Registered",
          `Account "${res.username}" created with role ${res.role}`,
        );

        setIsRegisterModalOpen(false);

        setRegUsername("");
        setRegEmail("");
        setRegPassword("");
        setRegRole("MANAGER");

        await loadUsers();
      }
    } catch (err: any) {
      toast.error(
        "Registration failed",
        err?.message || "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // DELETE USER
  // ============================================================

  const handleDeleteUser = async (user: User) => {
    // Extra frontend safeguard
    if (!isOwner) {
      toast.error(
        "Access Denied",
        "Only OWNER accounts can delete system users.",
      );
      return;
    }

    if (!user.id) return;

    if (
      !window.confirm(
        `Are you sure you want to delete account "${user.username}"?`,
      )
    ) {
      return;
    }

    try {
      const msg = await userService.deleteUser(user.id);

      toast.success("Account Deletion", msg);

      await loadUsers();
    } catch (err: any) {
      toast.error("Delete failed", err?.message || "Unable to delete account.");
    }
  };

  // ============================================================
  // MANAGER ACCESS DENIED
  // ============================================================

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-6 h-6 text-rose-600" />
        </div>

        <h2 className="text-lg font-bold text-[#18181B]">Access Denied</h2>

        <p className="text-xs text-[#71717A] mt-1 max-w-sm">
          User Management is restricted to OWNER accounts. MANAGER accounts
          cannot view, create, or delete system users.
        </p>

        <span className="mt-3 inline-block px-2.5 py-1 rounded border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold">
          {role || "UNAUTHORIZED"}
        </span>
      </div>
    );
  }

  // ============================================================
  // OWNER USER MANAGEMENT
  // ============================================================

  return (
    <div className="space-y-4 font-sans">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E4E4E7] rounded-lg p-5">
        <div>
          <h3 className="text-sm font-semibold text-[#18181B]">
            Account & Role Administration
          </h3>

          <p className="text-xs text-[#71717A] mt-0.5">
            Manage registered system accounts.
          </p>
        </div>

        {/* OWNER ONLY */}
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />

          <span>Register New Manager</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Fetching registered accounts..." />
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#71717A] space-y-2">
            <p>No registered accounts found.</p>

            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="text-xs font-semibold text-black underline hover:text-[#27272A] cursor-pointer"
            >
              Click here to register a new manager
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F9FAFB] text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#E4E4E7]">
                <tr>
                  <th className="px-6 py-3 w-20">Account ID</th>

                  <th className="px-6 py-3">Username / Identity</th>

                  <th className="px-6 py-3">Assigned Role</th>

                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F4F4F5] text-sm">
                {users.map((u, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-[#F9FAFB] transition-colors"
                  >
                    {/* Account ID */}
                    <td className="px-6 py-4 font-mono text-xs text-[#71717A]">
                      {idx + 1}
                    </td>

                    {/* Username / Identity */}
                    <td className="px-6 py-4 font-medium text-[#18181B]">
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar
                          name={u.username}
                          role={u.role}
                          size="sm"
                        />

                        <div>
                          <span className="block">{u.username}</span>

                          {u.email && (
                            <span className="text-[11px] text-[#71717A] block font-normal">
                              {u.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Assigned Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          u.role === "OWNER"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Actions */}
                    {u.role !== "OWNER" && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="text-[10px] border px-2.5 py-1 rounded border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          REGISTER USER MODAL
          OWNER ONLY
      ======================================================= */}

      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsRegisterModalOpen(false);
          }
        }}
        title="Register New System Account"
        subtitle="Create a MANAGER or OWNER account with system credentials"
      >
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-[#71717A] mb-1 uppercase tracking-wider">
              Username
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="e.g. manager_talha or owner_bhavik"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              />

              <UserIcon className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-medium text-[#71717A] mb-1 uppercase tracking-wider">
              Email Address
            </label>

            <div className="relative">
              <input
                type="email"
                placeholder="user@dealership.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              />

              <Mail className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-[#71717A] mb-1 uppercase tracking-wider">
              Password
            </label>

            <div className="relative">
              <input
                type="password"
                placeholder="Enter account password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full pl-8 pr-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
              />

              <Lock className="w-3.5 h-3.5 text-[#71717A] absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Assigned Role */}
          <div>
            <label className="block text-xs font-medium text-[#71717A] mb-1 uppercase tracking-wider">
              Assigned Role
            </label>

            <select
              value={regRole}
              onChange={(e) => setRegRole(e.target.value as UserRole)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-xs text-[#18181B] bg-white border border-[#E4E4E7] rounded focus:ring-1 focus:ring-black outline-none"
            >
              <option value="MANAGER">MANAGER</option>

              {/* <option value="OWNER">OWNER</option> */}
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E4E4E7]">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(false)}
              disabled={isSubmitting}
              className="px-3 py-2 text-xs font-medium text-[#71717A] bg-[#F4F4F5] rounded border border-[#E4E4E7] hover:bg-[#E4E4E7] cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white bg-black rounded hover:bg-[#27272A] transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />

                  <span>Creating Manager...</span>
                </div>
              ) : (
                <span>Register Manager</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
