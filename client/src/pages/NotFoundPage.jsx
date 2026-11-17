import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Icon from '../components/ui/Icon';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();
  const home = user ? (user.role === 'admin' ? '/admin' : '/app') : '/login';

  return (
    <main className="not-found">
      <div className="not-found__brand">
        <Logo />
      </div>
      <div className="not-found__code">404</div>
      <h1>Page not found</h1>
      <p>The page you are looking for may have moved, or the link is no longer available.</p>
      <Link to={home} className="button button--primary">
        <Icon name="arrow-right" size={17} />
        <span>{user ? 'Back to dashboard' : 'Go to sign in'}</span>
      </Link>
    </main>
  );
}
