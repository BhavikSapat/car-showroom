import React from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  User,
  LogOut,
  Database,
  CarFront,
  Link2,
  PanelLeftClose,
  PanelLeft,
  X,
  Shield,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { InitialsAvatar } from "../common/InitialsAvatar";
import { UserRole } from "../../types";

export type PageId =
  | "dashboard"
  | "cars"
  | "customers"
  | "relationships"
  | "queries"
  | "users"
  | "profile";

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ReactNode;
  allowedRoles: UserRole[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { role, logout, user } = useAuth();

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      allowedRoles: ["OWNER"],
    },
    {
      id: "cars",
      label: "Cars",
      icon: <CarFront className="w-4 h-4 shrink-0" />,
      allowedRoles: ["OWNER", "MANAGER"],
    },
    {
      id: "customers",
      label: "Customers",
      icon: <Users className="w-4 h-4 shrink-0" />,
      allowedRoles: ["OWNER", "MANAGER"],
    },
    {
      id: "relationships",
      label: "Car-Customer",
      icon: <Link2 className="w-4 h-4 shrink-0" />,
      allowedRoles: ["OWNER", "MANAGER"],
    },
    {
      id: "queries",
      label: "Advanced Queries",
      icon: <Database className="w-4 h-4 shrink-0" />,
      allowedRoles: ["OWNER", "MANAGER"],
    },
    {
      id: "users",
      label: "Accounts & Roles",
      icon: <UserCog className="w-4 h-4 shrink-0" />,
      allowedRoles: ["OWNER"],
    },
    {
      id: "profile",
      label: "Profile",
      icon: <User className="w-4 h-4 shrink-0" />,
      allowedRoles: ["OWNER", "MANAGER"],
    },
  ];

  const visibleItems = navItems.filter(
    (item) => role && item.allowedRoles.includes(role),
  );

  const handleItemClick = (pageId: PageId) => {
    onNavigate(pageId);
    onCloseMobile();
  };

  const roleBadgeStyle =
    role === "OWNER"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : role === "MANAGER"
        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Component */}
      <aside
        className={`
          bg-white border-r border-[#E4E4E7] flex flex-col shrink-0 select-none z-50 transition-all duration-300 ease-in-out
          
          /* Mobile Drawer Positioning */
          fixed inset-y-0 left-0 w-72 transform ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          } md:relative md:translate-x-0

          /* Desktop Width Controls */
          ${isCollapsed ? "md:w-20" : "md:w-64"}
        `}
      >
        {/* Brand Header & Collapse Toggle */}
        <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[#E4E4E7]">
          <div className="flex items-center gap-2.5 overflow-visible">
            {/* Logo: only when desktop sidebar is collapsed */}
            <div
              className={`shrink-0 ${isCollapsed ? "md:block" : "md:hidden"}`}
            >
              <img
                src="/favicon.png"
                alt="Grand Theft Autos"
                className="relative w-15 h-15 overflow-hidden -ml-2.5"
              />
            </div>

            {/* Existing brand text */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isCollapsed ? "md:hidden" : "block"
              }`}
            >
              <span className="font-heading font-bold tracking-tight text-sm text-[#18181B] block truncate">
                GRAND THEFT AUTOS
              </span>

              <span className="text-[10px] text-[#71717A] uppercase">
                Car Showroom Management Portal
              </span>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded transition-colors"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Pill Banner */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-[#E4E4E7] bg-[#FAFAFB]">
          <div
            className={`flex items-center justify-between text-xs ${
              isCollapsed ? "md:justify-center" : ""
            }`}
          >
            <span
              className={`text-[#71717A] font-medium text-[11px] uppercase tracking-wider ${
                isCollapsed ? "md:hidden" : "block"
              }`}
            >
              Role
            </span>
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${roleBadgeStyle}`}
              title={`Role: ${role || "GUEST"}`}
            >
              {isCollapsed ? role || "G" : role || "GUEST"}
            </span>
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors cursor-pointer ${
                  isActive
                    ? "font-semibold text-black bg-[#F4F4F5]"
                    : "text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]"
                } ${isCollapsed ? "md:justify-center md:px-0" : ""}`}
              >
                <span
                  className={`${
                    isActive ? "text-black" : "text-[#71717A]"
                  } shrink-0`}
                >
                  {item.icon}
                </span>

                <span
                  className={`truncate transition-all duration-300 ${
                    isCollapsed ? "md:hidden" : "block"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-[#E4E4E7] bg-white">
          <div
            className={`flex items-center justify-between gap-2 ${
              isCollapsed ? "md:flex-col md:gap-3" : ""
            }`}
          >
            <div
              className={`flex items-center gap-3 overflow-hidden ${
                isCollapsed ? "md:justify-center" : ""
              }`}
            >
              <InitialsAvatar name={user?.username} role={role} size="sm" />
              <div
                className={`overflow-hidden text-left ${
                  isCollapsed ? "md:hidden" : "block"
                }`}
              >
                <span className="text-xs font-semibold text-[#18181B] block truncate">
                  {user?.username || "Logged User"}
                </span>
                <span className="text-[10px] text-[#71717A] block truncate font-mono">
                  {role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-[#71717A] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
