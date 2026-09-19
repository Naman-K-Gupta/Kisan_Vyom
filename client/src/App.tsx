import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Farmer Pages
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { FarmerProfilePage } from './pages/farmer/FarmerProfilePage';
import { ProcurementCentresPage } from './pages/farmer/ProcurementCentresPage';
import { LiveQueueTrackerPage } from './pages/farmer/LiveQueueTrackerPage';
import { PricesPage } from './pages/farmer/PricesPage';
import { AIAssistantPage } from './pages/farmer/AIAssistantPage';
import { FarmerPaymentsPage } from './pages/farmer/FarmerPaymentsPage';
import { FarmerSchemesPage } from './pages/farmer/FarmerSchemesPage';

// Manager Pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminFarmersPage } from './pages/admin/AdminFarmersPage';
import { AdminCentresPage } from './pages/admin/AdminCentresPage';
import { AdminMSPPage } from './pages/admin/AdminMSPPage';
import { AdminAlertsPage } from './pages/admin/AdminAlertsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminProcurementRecordsPage } from './pages/admin/AdminProcurementRecordsPage';
import { AdminSchemesPage } from './pages/admin/AdminSchemesPage';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to proper role dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'PROCUREMENT_CENTRE_MANAGER') return <Navigate to="/manager/dashboard" replace />;
    return <Navigate to="/farmer/dashboard" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Farmer Routes */}
      <Route
        path="/farmer"
        element={
          <ProtectedRoute allowedRoles={['FARMER']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<FarmerDashboard />} />
        <Route path="profile" element={<FarmerProfilePage />} />
        <Route path="crops" element={<Navigate to="/farmer/dashboard" replace />} />
        <Route path="centres" element={<ProcurementCentresPage />} />
        <Route path="queue" element={<LiveQueueTrackerPage />} />
        <Route path="prices" element={<PricesPage />} />
        <Route path="payments" element={<FarmerPaymentsPage />} />
        <Route path="schemes" element={<FarmerSchemesPage />} />
        <Route path="policies" element={<FarmerSchemesPage />} />
        <Route path="ai" element={<AIAssistantPage />} />
        <Route index element={<Navigate to="/farmer/dashboard" replace />} />
      </Route>

      {/* Centre Manager Routes */}
      <Route
        path="/manager"
        element={
          <ProtectedRoute allowedRoles={['PROCUREMENT_CENTRE_MANAGER', 'ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ManagerDashboard />} />
        <Route path="capacity" element={<ManagerDashboard />} />
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="procurement-records" element={<AdminProcurementRecordsPage />} />
        <Route path="farmers" element={<AdminFarmersPage />} />
        <Route path="centres" element={<AdminCentresPage />} />
        <Route path="msp" element={<AdminMSPPage />} />
        <Route path="schemes" element={<AdminSchemesPage />} />
        <Route path="policies" element={<AdminSchemesPage />} />
        <Route path="alerts" element={<AdminAlertsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
