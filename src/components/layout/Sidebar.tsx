
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Rocket, 
  FileText, 
  BarChart3, 
  Clock, 
  Webhook, 
  Bot,
  Terminal as TerminalIcon,
  Files,
  Settings,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  projectId?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ projectId }) => {
  const location = useLocation();

  const dashboardItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Projects',
      href: '/dashboard/projects',
      icon: FolderOpen,
    },
    {
      title: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
    },
  ];

  const projectItems = projectId ? [
    {
      title: 'Overview',
      href: `/project/${projectId}`,
      icon: LayoutDashboard,
    },
    {
      title: 'Deployments',
      href: `/project/${projectId}/deployments`,
      icon: Rocket,
    },
    {
      title: 'Files',
      href: `/project/${projectId}/files`,
      icon: Files,
    },
    {
      title: 'Terminal',
      href: `/project/${projectId}/terminal`,
      icon: TerminalIcon,
    },
    {
      title: 'Logs',
      href: `/project/${projectId}/logs`,
      icon: FileText,
    },
    {
      title: 'Monitoring',
      href: `/project/${projectId}/monitoring`,
      icon: BarChart3,
    },
    {
      title: 'Cron Jobs',
      href: `/project/${projectId}/cron-jobs`,
      icon: Clock,
    },
    {
      title: 'Webhooks',
      href: `/project/${projectId}/webhooks`,
      icon: Webhook,
    },
    {
      title: 'Bots',
      href: `/project/${projectId}/bots`,
      icon: Bot,
    },
    {
      title: 'Settings',
      href: `/project/${projectId}/settings`,
      icon: Settings,
    },
  ] : [];

  const items = projectId ? projectItems : dashboardItems;

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 h-screen overflow-y-auto">
      <div className="p-6">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">CF</span>
          </div>
          <span className="text-xl font-bold text-white">CloudForge</span>
        </Link>
      </div>
      
      <nav className="px-6 pb-6">
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                location.pathname === item.href
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
