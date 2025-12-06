import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SaaSProvider } from './context/SaaSContext';
import { ClinicProvider } from './context/ClinicContext';
import { Layout } from './components/Layout';
import { ClinicStaffLayout } from './components/layouts/ClinicStaffLayout'; // ← CORRECT PATH

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ChatBot } from './components/ChatBot';

// Public
import { LandingPage } from './pages/LandingPage';
import { Pricing } from './pages/Pricing';
import { PaymentSuccess } from './pages/PaymentSuccess';

// Patient
import { Dashboard as PatientDashboard } from './pages/Dashboard';
import { MedicalData } from './pages/MedicalData';
import { Analysis } from './pages/Analysis';
import { PatientProfile } from './pages/PatientProfile';
import { Documents } from './pages/Documents';
import { RecommendedClinics } from './pages/clinics/RecommendedClinics';
import { PatientInvoices } from './pages/invoices/PatientInvoices';

// Clinic Patient Mode
import { ClinicPatientDashboard } from './pages/clinics/patient/dashboard';
import { ClinicDoctorsList } from './pages/clinics/patient/DoctorsList';
import { ClinicBooking } from './pages/clinics/patient/Booking';
import { ClinicPatientRecords } from './pages/clinics/patient/Records';
import { ClinicPatientInvoices } from './pages/clinics/patient/Invoices';

// Clinic Staff
import { ClinicStaffDashboard } from './pages/clinics/staff/dashboard';
import { ClinicRequests } from './pages/clinics/staff/ClinicRequests';
import { ClinicManageDoctors } from './pages/clinics/staff/ClinicManageDoctors';
import { ClinicInvoicesList } from './pages/clinics/staff/InvoicesList';
import { ClinicAppointments } from './pages/clinics/staff/ClinicAppointments';
import { ClinicSettings } from './pages/clinics/staff/ClinicSettings';

// Doctor
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { PatientList } from './pages/doctor/PatientList';
import { Appointments } from './pages/Appointments';
import { LabOrders } from './pages/doctor/LabOrders';
import { DocumentReviews } from './pages/doctor/DocumentReviews';
import DoctorProfile from './pages/doctor/DoctorProfile';

// Admin
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { AdminSettings } from './pages/admin/AdminSettings';
import { PaymentDashboard } from './pages/admin/PaymentDashboard';
import { ClinicsManagement } from './pages/admin/ClinicsManagement';
import { DoctorsManagement } from './pages/admin/DoctorsManagement';
import { PatientsManagement } from './pages/admin/PatientsManagement';
import { AppointmentsManagement } from './pages/admin/AppointmentsManagement';
import { PlansManagement } from './pages/admin/PlansManagement';
import { ROUTES } from './constants';
import { UserRole } from './types';
import { RecommendedDoctors } from './pages/clinics/RecommendedDoctors';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactElement; allowedRoles?: UserRole[] }) => {
  const { token, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-slate-50">Chargement...</div>;
  }

  if (!token) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (role === 'admin') return <Navigate to="/v1/portal/admin/dashboard" replace />;
    if (role === 'clinic_staff' || role === 'clinic_admin') return <Navigate to="/clinic/dashboard" replace />;
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path={ROUTES.LANDING} element={<LandingPage />} />
        <Route path={ROUTES.PRICING} element={<Pricing />} />
        <Route path={ROUTES.PAYMENT_SUCCESS} element={<PaymentSuccess />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />

        {/* Patient Main Dashboard */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Layout>
              <Routes>
                <Route index element={<PatientDashboard />} />
                <Route path="records" element={<MedicalData />} />
                <Route path="analysis" element={<Analysis />} />
                <Route path="documents" element={<Documents />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="clinics/recommended" element={<RecommendedClinics />} />
                <Route path="invoices" element={<PatientInvoices />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="doctors/best" element={<RecommendedDoctors />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Patient inside Clinic (branded mode) */}
        <Route path="/clinic/patient/*" element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<ClinicPatientDashboard />} />
                <Route path="doctors" element={<ClinicDoctorsList />} />
                <Route path="book" element={<ClinicBooking />} />
                <Route path="records" element={<ClinicPatientRecords />} />
                <Route path="invoices" element={<ClinicPatientInvoices />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* CLINIC STAFF & ADMIN — FULLY FIXED */}
        <Route path="/clinic/dashboard/*" element={
          <ProtectedRoute allowedRoles={['clinic_staff', 'clinic_admin']}>
            <ClinicStaffLayout>
              <Routes>
                <Route index element={<ClinicStaffDashboard />} />
                <Route path="requests" element={<ClinicRequests />} />
                <Route path="doctors" element={<ClinicManageDoctors />} />
                <Route path="invoices" element={<ClinicInvoicesList />} />
                <Route path="appointments" element={<ClinicAppointments />} />
                <Route path="settings" element={<ClinicSettings />} />
              </Routes>
            </ClinicStaffLayout>
          </ProtectedRoute>
        } />

        {/* Doctor Routes */}
        <Route path="/doctor/*" element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="patients" element={<PatientList />} />
                <Route path="appointments" element={<Appointments />} />
                <Route path="orders" element={<LabOrders />} />
                <Route path="reviews" element={<DocumentReviews />} />
                <Route path="profile" element={<DoctorProfile />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/v1/portal/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="payments" element={<PaymentDashboard />} />
                <Route path="clinics" element={<ClinicsManagement />} />
<Route path="doctors" element={<DoctorsManagement />} />
<Route path="patients" element={<PatientsManagement />} />
<Route path="appointments" element={<AppointmentsManagement />} />
<Route path="plans" element={<PlansManagement />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to={ROUTES.LANDING} replace />} />
      </Routes>

      <ChatBot />
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SaaSProvider>
        <ClinicProvider>
          <AppRoutes />
        </ClinicProvider>
      </SaaSProvider>
    </AuthProvider>
  );
};

export default App;