import React from "react";
import { LogOut, Menu, PanelLeftClose, PanelLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { InitialsAvatar } from "../common/InitialsAvatar";

interface NavbarProps {
  pageTitle: string;
  onProfileClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  pageTitle,
  onProfileClick,
  isCollapsed,
  onToggleCollapse,
  onToggleMobileMenu,
}) => {
  const { user, role, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-[#E4E4E7] px-4 sm:px-6 md:px-8 flex items-center justify-between shrink-0">
      {/* Left Side: Mobile Menu Button + Desktop Collapse Toggle + Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 text-[#18181B] hover:bg-[#F4F4F5] rounded-md transition-colors cursor-pointer"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded transition-colors cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Page Title */}
        <h1 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#18181B] truncate max-w-[230px] md:max-w-full">
          {pageTitle}
        </h1>
      </div>

      {/* Right Navbar Controls */}
      <div className="flex items-center gap-3">
        {/* User Profile section */}
        <div className="flex items-center gap-3 border-l pl-3 sm:pl-4 border-[#E4E4E7]">
          <button
            onClick={onProfileClick}
            className="flex text-left items-center gap-2.5 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
            title="View Profile"
          >
            <InitialsAvatar name={user?.username} role={role} size="sm" />
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-[#18181B] block leading-none">
                {user?.username}
              </span>
              <span className="text-[10px] text-[#71717A] font-mono leading-none mt-1 block">
                {role}
              </span>
            </div>
          </button>

          <button
            onClick={logout}
            className="p-1.5 text-[#71717A] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
