import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullPageLoader } from '../components/ui/Loader';

export default function PublicOnlyRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageLoader label="Preparing your session" />;
  }

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />;
  }

  return <Outlet />;
}
