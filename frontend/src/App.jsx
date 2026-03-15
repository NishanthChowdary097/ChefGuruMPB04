import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage      from './pages/LandingPage';
import LoginPage        from './pages/LoginPage';
import SignupPage       from './pages/SignupPage';
import AppPage          from './pages/AppPage';
// import VerifyEmailPage  from './pages/VerifyEmailPage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/app" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/login"   element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup"  element={<PublicRoute><SignupPage /></PublicRoute>} />
        <Route path="/app"     element={<ProtectedRoute><AppPage /></ProtectedRoute>} />

        {/* Email verification link from backend:
            GET /api/auth/mail/verify/:userId/:token
            The email contains a link like:
            http://yourfrontend.com/verify/:userId/:token  */}
        {/* <Route path="/verify/:userId/:token" element={<VerifyEmailPage />} /> */}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
