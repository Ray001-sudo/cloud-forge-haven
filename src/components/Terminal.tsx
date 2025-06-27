
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TerminalCore, { type TerminalCoreRef } from './terminal/TerminalCore';
import TerminalHeader from './terminal/TerminalHeader';
import { toast } from 'sonner';

interface TerminalProps {
  projectId: string;
  projectName: string;
}

const Terminal: React.FC<TerminalProps> = ({ projectId, projectName }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminalRef = useRef<TerminalCoreRef>(null);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Fit terminal after fullscreen toggle
    setTimeout(() => {
      if (terminalRef.current?.fitTerminal) {
        terminalRef.current.fitTerminal();
      }
    }, 100);
  };

  const clearTerminal = () => {
    if (terminalRef.current?.clearTerminal) {
      terminalRef.current.clearTerminal();
    }
  };

  const copyTerminalContent = () => {
    if (terminalRef.current?.copyContent) {
      terminalRef.current.copyContent();
      toast.success('Terminal content copied to clipboard');
    }
  };

  const exportLogs = () => {
    if (terminalRef.current?.exportLogs) {
      const logs = terminalRef.current.exportLogs();
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName}-terminal-logs-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className={`bg-slate-800 border-slate-700 transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-4 z-50 shadow-2xl' 
        : 'h-full'
    }`}>
      <TerminalHeader
        projectName={projectName}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onClear={clearTerminal}
        onCopy={copyTerminalContent}
        onExportLogs={exportLogs}
      />
      <CardContent className="p-0">
        <div 
          className={`bg-[#1a1b26] rounded-b-lg transition-all duration-300 ${
            isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'
          }`}
        >
          <TerminalCore
            ref={terminalRef}
            projectId={projectId}
            projectName={projectName}
            onClear={clearTerminal}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default Terminal;
