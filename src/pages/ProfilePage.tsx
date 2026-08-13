import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/authService";
import { customerService } from "../services/customerService";
import { InitialsAvatar } from "../components/common/InitialsAvatar";
import { CustomerFormModal } from "../components/customers/CustomerFormModal";
import { Customer } from "../types";
import {
  Shield,
  Key,
  LogOut,
  CheckCircle2,
  RefreshCw,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  UserPlus,
  Users,
} from "lucide-react";
import { useToast } from "../components/common/Toast";

export const ProfilePage: React.FC = () => {
  const { user, role, token, logout } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showToken, setShowToken] = useState<boolean>(false);

  // Modal for adding customer
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState<boolean>(false);
  const [isSubmittingCustomer, setIsSubmittingCustomer] =
    useState<boolean>(false);

  const toast = useToast();

  const isManagerOrOwner = role === "OWNER" || role === "MANAGER";

  const fetchProfileEndpoint = async () => {
    setIsLoading(true);
    setProfileMessage(null);
    try {
      const res = await authService.getProfile();
      if (typeof res === "string") {
        setProfileMessage(res);
      } else {
        setProfileData(res);
      }
    } catch (err: any) {
      toast.error("Profile fetch failed", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileEndpoint();
  }, []);

  const handleCreateCustomerFromProfile = async (
    data: Omit<Customer, "id">,
  ) => {
    setIsSubmittingCustomer(true);
    try {
      const res = await customerService.saveCustomer(data);
      if (typeof res === "string") {
        toast.error("Failed to add customer", res);
      } else {
        toast.success(
          "Customer Added Successfully",
          `Created record for "${(res as Customer).name}" (${(res as Customer).email})`,
        );
        setIsAddCustomerOpen(false);
      }
    } catch (err: any) {
      toast.error("Error creating customer", err.message);
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  // Display user object fields with fallback
  const activeUser = profileData || user;
  const userEmail =
    activeUser?.email ||
    user?.email ||
    (user?.username
      ? `${user.username.toLowerCase()}@gtauto.com`
      : "user@gtauto.com");

  return (
    <div className="max-w-3xl mx-auto space-y-5 font-sans">
      {/* Primary Executive Profile Header */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar with Initials */}
          <InitialsAvatar
            name={activeUser?.username || user?.username}
            role={activeUser?.role || role}
            size="xl"
          />

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#18181B] tracking-tight">
              {activeUser?.username || user?.username || "Authenticated User"}
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5 flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5 text-[#71717A]" />
              <span>{userEmail}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${
                  role === "OWNER"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : role === "MANAGER"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{role || "USER"}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Token Active</span>
              </span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </div>

      {/* Account Profile Summary Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 space-y-4">
        {/* <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-3">
          <div>
            <h4 className="text-sm font-bold text-[#18181B]">
              Account & Session Profile
            </h4>
            <p className="text-xs text-[#71717A] mt-0.5">
              Verified identity parameters loaded from backend endpoint
            </p>
          </div>
          <button
            onClick={fetchProfileEndpoint}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] bg-[#F4F4F5] rounded border border-[#E4E4E7] transition-colors cursor-pointer"
            title="Refresh Account Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div> */}

        {profileMessage ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 font-medium">
            <p className="font-bold mb-1">Backend Notice:</p>
            {profileMessage}
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <span className="text-[#71717A] flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#71717A]" /> Username
              </span>
              <span className="font-semibold text-[#18181B]">
                {activeUser?.username || user?.username || "N/A"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <span className="text-[#71717A] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#71717A]" /> Email Address
              </span>
              <span className="font-mono text-[#18181B]">{userEmail}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#F4F4F5]">
              <span className="text-[#71717A] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#71717A]" /> Assigned Role
              </span>
              <span className="font-bold text-[#18181B]">
                {role || "CUSTOMER"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 border-b border-[#F4F4F5]">
              <span className="text-[#71717A] flex items-center gap-2 shrink-0">
                <Key className="w-4 h-4 text-[#71717A]" /> Active Auth Token
              </span>
              <div className="flex items-center gap-2 max-w-full min-w-0">
                <span className="font-mono text-[11px] text-[#18181B] bg-[#F4F4F5] px-2.5 py-1 rounded border border-[#E4E4E7] truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                  {showToken
                    ? activeUser?.token ||
                      token ||
                      "Bearer token-session-active-key-101"
                    : "•".repeat(Math.min(activeUser?.token?.length || 32, 32))}
                </span>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="p-1 text-[#71717A] hover:text-[#18181B] bg-[#F4F4F5] border border-[#E4E4E7] rounded transition-colors cursor-pointer shrink-0"
                  title={showToken ? "Hide full token" : "Show full token"}
                >
                  {showToken ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manager & Owner Portal Quick Actions */}
      {/* {isManagerOrOwner && (
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                <Users className="w-4 h-4 text-black" />
                Management & Operations Actions
              </h4>
              <p className="text-xs text-[#71717A] mt-0.5">
                Register new customer profiles and assign showroom bookings
              </p>
            </div>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-black rounded hover:bg-[#27272A] transition-colors cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      )} */}

      {/* Session Security Card */}
      <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 space-y-2">
        <h4 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
          <Key className="w-4 h-4 text-black" />
          Session Security & Compliance
        </h4>
        <p className="text-xs text-[#71717A]">
          Tokens remain active for up to 24 hours. Enterprise security checks
          enforce endpoint access according to your assigned account role.
        </p>
      </div>

      {/* Customer Registration Modal for Manager / Owner */}
      <CustomerFormModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSubmit={handleCreateCustomerFromProfile}
        isLoading={isSubmittingCustomer}
      />
    </div>
  );
};
