import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import { Toaster } from 'react-hot-toast';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Sidebar from './components/layout/Sidebar';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

// Legal / Info Pages
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import Contact from './pages/public/Contact';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import SignupPage from './pages/public/SignupPage';
import AuthCallback from './pages/public/AuthCallback';

// Candidate Pages
import CandidateDashboard from './pages/candidate/CandidateDashboard';
import MyResumes from './pages/candidate/MyResumes';
import BrowseJobs from './pages/candidate/BrowseJobs';
import MyApplications from './pages/candidate/MyApplications';
import CandidateProfile from './pages/candidate/CandidateProfile';

// Company Pages
import CompanyDashboard from './pages/company/CompanyDashboard';
import MyJobPostings from './pages/company/MyJobPostings';
import CreateJob from './pages/company/CreateJob';
import ViewApplications from './pages/company/ViewApplications';
import CompanyProfile from './pages/company/CompanyProfile';
import EditJob from './pages/company/EditJob';

function AppLayout() {
  const { isAuthenticated } = useAuth();
  const { syncFromLocalStorage } = useAuthStore();
  const location = useLocation();

  // Sync state from localStorage on mount and route changes
  useEffect(() => {
    syncFromLocalStorage();
  }, [location.pathname, syncFromLocalStorage]);

  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/auth/callback',
    '/privacy-policy',
    '/terms-of-service',
    '/contact'
  ];

  const isPublicPage = publicPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
          },
        }}
      />
      <Navbar />

      <div className="flex flex-1">
        {isAuthenticated && !isPublicPage && <Sidebar />}

        <main className="flex-1 p-6">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/contact" element={<Contact />} />

            {/* Candidate Routes */}
            <Route
              path="/candidate/dashboard"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/resumes"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <MyResumes />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/jobs"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <BrowseJobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/applications"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <MyApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/candidate/profile"
              element={
                <ProtectedRoute requiredUserType="candidate">
                  <CandidateProfile />
                </ProtectedRoute>
              }
            />

            {/* Company Routes */}
            <Route
              path="/company/dashboard"
              element={
                <ProtectedRoute requiredUserType="company">
                  <CompanyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/jobs"
              element={
                <ProtectedRoute requiredUserType="company">
                  <MyJobPostings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/create-job"
              element={
                <ProtectedRoute requiredUserType="company">
                  <CreateJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/edit-job/:jobId"
              element={
                <ProtectedRoute requiredUserType="company">
                  <EditJob />
                </ProtectedRoute>
              }
            />

            <Route
              path="/company/applications/:jobId"
              element={
                <ProtectedRoute requiredUserType="company">
                  <ViewApplications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/company/profile"
              element={
                <ProtectedRoute requiredUserType="company">
                  <CompanyProfile />
                </ProtectedRoute>
              }
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  return (  
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;