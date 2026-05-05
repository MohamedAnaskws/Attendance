import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// ── Login ──────────────────────────────────────────────
import Login from './pages/Login';

// ── CRM Admin Pages ────────────────────────────────────
import DashboardPage from './pages/admin/Dashboard';
import UsersPage from './pages/admin/Userspage';
import RolesPage from './pages/admin/Rolespage';
import DepartmentsPage from './pages/admin/Departmentpage';
import AttendancePage from './pages/admin/Attendancepage';
import HolidayPage from './pages/admin/Holidaypage';
import LeavesPage from './pages/admin/LeavesPage';
import AdminCalendar from './pages/admin/Calender';
import SalaryProcessPage from './pages/admin/Salaryprocesspage';
import CalendarPage from './pages/admin/Workschedulepage';
import ChatLogsPage from './pages/admin/ChatLogsPage'; 

// ── CRM User Pages ────────────────────────────────────
import UserDashboard from './pages/users/Userspage';
import UserCalendar from './pages/users/Usercalendarpage';

// ── Chat ──────────────────────────────────────────────
import ChatLayout from './components/ChatLayout';

// ── Chat Floating Button (shown on all CRM pages) ─────
import ChatFloatingButton from './components/layout/ChatFloatingButton';

// ── Auth helpers ──────────────────────────────────────
import { getToken, getUser } from './utils/auth';

// ─────────────────────────────────────────────────────
// Role-based permission map
// ─────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<number, string[]> = {
  1: ['*'],
  2: ['dashboard', 'users', 'departments', 'attendance', 'leaves', 'calendar', 'holidays', 'chat', 'employee-calendar'],
  3: ['dashboard', 'attendance', 'holidays', 'calendar', 'leaves', 'chat'],
  4: ['user-dashboard', 'user-calendar', 'chat'],
};

const hasAccess = (routeKey: string): boolean => {
  const user = getUser();
  if (!user) return false;
  const permissions = ROLE_PERMISSIONS[user.roleid as number] || [];
  return permissions.includes('*') || permissions.includes(routeKey);
};

// ─────────────────────────────────────────────────────
// Protected Route wrapper
// ─────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode; routeKey: string }> = ({
  children,
  routeKey,
}) => {
  if (!getToken()) return <Navigate to="/" replace />;
  if (!hasAccess(routeKey)) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

// ─────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────
const App: React.FC = () => {
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      useAuthStore.getState().loadUser();
    } else {
      useAuthStore.setState({ loading: false });
    }
  }, []);

  const getRoleRedirect = () => {
    if (!getToken()) return <Navigate to="/" />;
    const user = getUser();
    switch (user?.roleid) {
      case 1:
      case 2:
      case 3:
        return <Navigate to="/dashboard" />;
      case 4:
        return <Navigate to="/user-dashboard" />;
      default:
        return <Navigate to="/" />;
    }
  };

  return (
    <>
      <Routes>
        {/* ── Public ─────────────────────────────── */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* ── Role redirect ─────────────────────── */}
        <Route path="/home" element={getRoleRedirect()} />

        {/* ── Admin CRM ──────────────────────────── */}
        <Route path="/dashboard" element={<ProtectedRoute routeKey="dashboard"><DashboardPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute routeKey="users"><UsersPage /></ProtectedRoute>} />
        <Route path="/roles" element={<ProtectedRoute routeKey="roles"><RolesPage /></ProtectedRoute>} />
        <Route path="/departments" element={<ProtectedRoute routeKey="departments"><DepartmentsPage /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute routeKey="attendance"><AttendancePage /></ProtectedRoute>} />
        <Route path="/holidays" element={<ProtectedRoute routeKey="holidays"><HolidayPage /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute routeKey="calendar"><AdminCalendar /></ProtectedRoute>} />
        <Route path="/salary-process" element={<ProtectedRoute routeKey="salary-process"><SalaryProcessPage /></ProtectedRoute>} />
        <Route path="/leavespage" element={<ProtectedRoute routeKey="leaves"><LeavesPage /></ProtectedRoute>} />
        <Route path="/employee-calendar" element={<ProtectedRoute routeKey="employee-calendar"><CalendarPage /></ProtectedRoute>} />

        {/* ── User CRM ───────────────────────────── */}
        <Route path="/user-dashboard" element={<ProtectedRoute routeKey="user-dashboard"><UserDashboard /></ProtectedRoute>} />
        <Route path="/user-calendar" element={<ProtectedRoute routeKey="user-calendar"><UserCalendar /></ProtectedRoute>} />

        {/* ── Chat (full page) ───────────────────── */}
        <Route path="/chat" element={<ProtectedRoute routeKey="chat"><ChatLayout /></ProtectedRoute>} />
           {/* 🆕 CHAT LOGS - Owner only */}
        <Route path="/chat-log" element={<ProtectedRoute routeKey="chat-logs"><ChatLogsPage /></ProtectedRoute>} />

        {/* ── Fallback ───────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      {/* Floating chat button visible on all CRM pages */}
      <ChatFloatingButton />
    </>
  );
};

export default App;
