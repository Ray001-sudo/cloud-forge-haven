
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { User, Settings, CreditCard, LogOut, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'bg-sky-600';
      case 'elite': return 'bg-purple-600';
      default: return 'bg-slate-600';
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Terminal className="h-8 w-8 text-sky-400" />
            <h1 className="text-xl font-bold text-white">CloudForge</h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {profile && (
            <Badge className={`${getPlanColor(profile.plan_tier)} text-white`}>
              {profile.plan_tier.toUpperCase()}
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
                  <AvatarFallback className="bg-slate-700 text-white">
                    {profile?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700" align="end">
              <DropdownMenuLabel className="text-white">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || profile?.username}</p>
                  <p className="text-xs text-slate-400">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-slate-300 hover:bg-slate-700" onClick={() => navigate('/dashboard/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:bg-slate-700" onClick={() => navigate('/dashboard/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:bg-slate-700" onClick={() => navigate('/dashboard/billing')}>
                <CreditCard className="mr-2 h-4 w-4" />
                Billing
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem className="text-red-400 hover:bg-slate-700" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
