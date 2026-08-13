import React, { useState } from 'react';
import { Sidebar, PageId } from './Sidebar';
import { Navbar } from './Navbar';

interface AppLayoutProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  children: React.ReactNode;
}

const pageTitles: Record<PageId, string> = {
  dashboard: 'Dashboard',
  cars: 'Cars',
  customers: 'Customers',
  relationships: 'Car-Customer Relationships',
  queries: 'Advanced Queries',
  users: 'Users',
  profile: 'Profile',
};

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentPage,
  onNavigate,
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  const handleNavigate = (page: PageId) => {
    onNavigate(page);
    setIsMobileOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAFAFB] text-[#18181B] font-sans antialiased">
      {/* Responsive Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area - Auto-adjusts layout when sidebar toggles */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ease-in-out">
        {/* Top Navbar */}
        <Navbar
          pageTitle={pageTitles[currentPage] || 'Dashboard'}
          onProfileClick={() => handleNavigate('profile')}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onToggleMobileMenu={() => setIsMobileOpen(!isMobileOpen)}
        />

        {/* Main Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

