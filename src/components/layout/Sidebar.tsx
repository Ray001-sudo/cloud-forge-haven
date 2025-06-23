
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Home,
  Rocket,
  Bot,
  Monitor,
  Settings,
  CreditCard,
  FileText,
  Globe,
  Clock,
  Webhook,
  FolderOpen
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Projects', href: '/dashboard/projects', icon: Rocket },
  { name: 'Deployments', href: '/dashboard/deployments', icon: Globe },
  { name: 'Bots', href: '/dashboard/bots', icon: Bot },
  { name: 'File Manager', href: '/dashboard/files', icon: FolderOpen },
  { name: 'Monitoring', href: '/dashboard/monitoring', icon: Monitor },
  { name: 'Cron Jobs', href: '/dashboard/cron', icon: Clock },
  { name: 'Webhooks', href: '/dashboard/webhooks', icon: Webhook },
  { name: 'Logs', href: '/dashboard/logs', icon: FileText },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={cn('flex flex-col w-64 bg-slate-800 border-r border-slate-700', className)}>
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.name}
                variant="ghost"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                )}
                onClick={() => navigate(item.href)}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
