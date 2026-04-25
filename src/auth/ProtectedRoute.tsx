import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth, type AppRole } from '@/auth/AuthContext';

interface Props {
  children: ReactNode;
  allow: AppRole[];
}

export function ProtectedRoute({ children, allow }: Props) {
  const { user, roles, loading, primaryRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const ok = roles.some((r) => allow.includes(r));
  if (!ok) {
    // Redirect to user's actual area
    const target = primaryRole === 'authority' ? '/dashboard' : primaryRole === 'worker' ? '/worker' : '/citizen';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
}
