
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Terminal from '@/components/Terminal';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TerminalPage = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId && user) {
      loadProject();
    }
  }, [projectId, user]);

  const loadProject = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">Project Not Found</h3>
            <p className="text-slate-400">The project you're looking for doesn't exist or you don't have access to it.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Terminal</h1>
          <p className="text-slate-400 mt-1">
            Interactive terminal for {project.name}
          </p>
        </div>

        <div className="h-[calc(100vh-12rem)]">
          <Terminal projectId={project.id} projectName={project.name} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TerminalPage;
