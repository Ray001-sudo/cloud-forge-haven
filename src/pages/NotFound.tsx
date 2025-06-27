
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Terminal, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <Terminal className="h-12 w-12 text-sky-400" />
          <span className="text-3xl font-bold text-white">CloudForge</span>
        </div>
        
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-sky-400 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-2">Page Not Found</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved to a different location.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="bg-sky-600 hover:bg-sky-700"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>

        <div className="mt-12 text-sm text-slate-500">
          <p>Lost? Try navigating to:</p>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sky-400 hover:text-sky-300"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/dashboard/projects')}
              className="text-sky-400 hover:text-sky-300"
            >
              Projects
            </button>
            <button
              onClick={() => navigate('/dashboard/billing')}
              className="text-sky-400 hover:text-sky-300"
            >
              Billing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
