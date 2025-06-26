
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  Settings,
  FileText,
  Activity,
  Clock,
  Webhook,
  Bot,
  Files,
  Terminal,
  Rocket
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const projectId = location.pathname.split('/')[2];
  const isProjectPage = location.pathname.startsWith('/project/');

  const mainNavItems = [
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

  const projectNavItems = projectId ? [
    {
      title: 'Overview',
      href: `/project/${projectId}`,
      icon: LayoutDashboard,
    },
    {
      title: 'Files',
      href: `/project/${projectId}/files`,
      icon: Files,
    },
    {
      title: 'Terminal',
      href: `/project/${projectId}/terminal`,
      icon: Terminal,
    },
    {
      title: 'Deployments',
      href: `/project/${projectId}/deployments`,
      icon: Rocket,
    },
    {
      title: 'Logs',
      href: `/project/${projectId}/logs`,
      icon: FileText,
    },
    {
      title: 'Monitoring',
      href: `/project/${projectId}/monitoring`,
      icon: Activity,
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

  const navItems = isProjectPage ? projectNavItems : mainNavItems;

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6">
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CF</span>
          </div>
          <span className="text-white font-semibold text-xl">CloudForge</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 pb-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
