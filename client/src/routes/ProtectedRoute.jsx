import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from '../components/ui/Loader';

export default function ProtectedRoute({ requireAdmin = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return (
      <Navigate
        to={requireAdmin ? '/admin/login' : '/login'}
        state={{ from: location }}
        replace
      />
    );
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  if (!requireAdmin && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
