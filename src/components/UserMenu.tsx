import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const navigate = useNavigate();
  const { user, primaryRole, signOut } = useAuth();

  if (!user) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => navigate('/auth')}
        className="gap-1.5 rounded-xl"
      >
        <LogIn className="w-3.5 h-3.5" /> Sign in
      </Button>
    );
  }

  const initials = (user.user_metadata?.display_name || user.email || 'U')
    .split(/\s+/).map((s: string) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-teal-500 text-white text-xs font-bold flex items-center justify-center shadow ring-2 ring-white/20 hover:ring-white/40 transition">
          {initials}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm">{user.user_metadata?.display_name ?? 'User'}</div>
          <div className="text-[11px] text-muted-foreground font-normal">{user.email}</div>
          {primaryRole && (
            <div className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
              {primaryRole}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(primaryRole === 'authority' ? '/dashboard' : primaryRole === 'worker' ? '/worker' : '/citizen')}>
          <User className="w-3.5 h-3.5 mr-2" /> My portal
        </DropdownMenuItem>
        <DropdownMenuItem onClick={async () => { await signOut(); navigate('/'); }}>
          <LogOut className="w-3.5 h-3.5 mr-2" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
