import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout/Layout'
import { RequireAuth } from './RequireAuth'
import LoginPage from '../pages/LoginPage'
import ForgotPassword from '../pages/ForgotPassword'
import VerifyResetOTP from '../pages/VerifyResetOTP'
import ResetPassword from '../pages/ResetPassword'
import VerifyAccount from '../pages/VerifyAccount'
import NotFound from '../pages/NotFound'
import Clock from '../pages/Staff/Clock'
import StaffDashboard from '../pages/Staff/Dashboard'
import RequestLeave from '../pages/Staff/RequestLeave'
import ManagerDashboard from '../pages/Manager/Dashboard'
import LeaveRequests from '../pages/Manager/LeaveRequests'
import AdminDashboard from '../pages/Admin/Dashboard'
import RegisterStaff from '../pages/Admin/RegisterStaff'
import ManageStaff from '../pages/Admin/ManageStaff'
import ClockActivities from '../pages/Admin/ClockActivities'
import SecurityDashboard from '../pages/Security/Dashboard'
import CEODashboard from '../pages/CEO/Dashboard'

const L = (children, variant) => <Layout variant={variant}>{children}</Layout>

export default function AppRouter() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LoginPage role="staff" />} />
      <Route path="/staff" element={<Navigate to="/" replace />} />
      <Route path="/admin" element={<LoginPage role="admin" />} />
      <Route path="/security" element={<LoginPage role="security" />} />
      <Route path="/ceo" element={<LoginPage role="ceo" />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-account" element={<VerifyAccount />} />

      {/* Staff + Manager (CEO gets implicit access) */}
      <Route element={<RequireAuth roles={['staff']} />}>
        <Route path="/clock" element={L(<Clock />)} />
        <Route path="/staff-dashboard" element={L(<StaffDashboard />)} />
        <Route path="/staff/request-leave" element={L(<RequestLeave />)} />
        <Route path="/manager-dashboard" element={L(<ManagerDashboard />, 'manager')} />
        <Route path="/manager/leave-requests" element={L(<LeaveRequests />, 'manager')} />
      </Route>

      {/* Admin */}
      <Route element={<RequireAuth roles={['admin']} />}>
        <Route path="/admin-dashboard" element={L(<AdminDashboard />)} />
        <Route path="/admin/register-staff" element={L(<RegisterStaff />)} />
        <Route path="/admin/manage-staff" element={L(<ManageStaff />)} />
        <Route path="/admin/clock-activities" element={L(<ClockActivities />)} />
      </Route>

      {/* Security */}
      <Route element={<RequireAuth roles={['security']} />}>
        <Route path="/security-dashboard" element={L(<SecurityDashboard />)} />
      </Route>

      {/* CEO */}
      <Route element={<RequireAuth roles={['staff']} requireCEO />}>
        <Route path="/ceo-dashboard" element={L(<CEODashboard />)} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
