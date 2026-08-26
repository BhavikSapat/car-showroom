import React, { useState, useEffect } from "react";
import { ToastProvider } from "./components/common/Toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";
import { PageId } from "./components/layout/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { CustomersPage } from "./pages/CustomersPage";
import { CarsModule } from "./components/cars/CarsModule";
import { CarCustomerRelationshipModule } from "./components/relationships/CarCustomerRelationshipModule";
import { ServiceRecordsModule } from "./components/services/ServiceRecordsModule";
import { AdvancedQueries } from "./components/queries/AdvancedQueries";
import { UserManagement } from "./components/users/UserManagement";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { LandingPage } from "./components/landing/LandingPage";
import { ErrorState } from "./components/common/ErrorState";
import { LoadingSpinner } from "./components/common/LoadingSpinner";

const MainApp: React.FC<{ onReturnToLanding: () => void }> = ({
  onReturnToLanding,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");

  // Adjust default page based on user role when auth resolves
  useEffect(() => {
    if (!currentPage) {
      setCurrentPage("dashboard");
    }
  }, [role]);

  if (isLoading) {
    return <LoadingSpinner label="Authenticating session..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <LoginPage onBackToLanding={onReturnToLanding} />;
  }

  // Role Protection check
  const isPageAllowed = (page: PageId): boolean => {
    if (!role) return false;
    if (role === "OWNER") return true;
    if (role === "MANAGER") {
      return [
        "dashboard",
        "cars",
        "customers",
        "relationships",
        "services",
        // "queries",
        "profile",
      ].includes(page);
    }
    return false;
  };

  const renderCurrentPage = () => {
    if (!isPageAllowed(currentPage)) {
      return (
        <ErrorState
          code={403}
          message={`Access Denied! The ${role} role is not permitted to access the ${currentPage} page.`}
          onBack={() =>
            setCurrentPage(role === "MANAGER" ? "cars" : "dashboard")
          }
        />
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} />;
      case "customers":
        return <CustomersPage />;
      case "cars":
        return <CarsModule />;
      case "relationships":
        return <CarCustomerRelationshipModule />;
      case "services":
        return <ServiceRecordsModule />;
      // case "queries":
      //   return <AdvancedQueries />;
      case "users":
        return <UserManagement />;
      case "profile":
        return <ProfilePage />;
      default:
        return role === "MANAGER" ? <CarsModule /> : <DashboardPage />;
    }
  };

  return (
    <AppLayout currentPage={currentPage} onNavigate={(p) => setCurrentPage(p)}>
      {renderCurrentPage()}
    </AppLayout>
  );
};

export default function App() {
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);

  if (showLandingPage) {
    return <LandingPage onLaunchWebApp={() => setShowLandingPage(false)} />;
  }

  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp onReturnToLanding={() => setShowLandingPage(true)} />
      </AuthProvider>
    </ToastProvider>
  );
}
