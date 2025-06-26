
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import TerminalCore from './terminal/TerminalCore';
import TerminalHeader from './terminal/TerminalHeader';

interface TerminalProps {
  projectId: string;
  projectName: string;
}

const Terminal: React.FC<TerminalProps> = ({ projectId, projectName }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const terminalRef = useRef<any>(null);

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

  return (
    <Card className={`bg-slate-800 border-slate-700 ${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'}`}>
      <TerminalHeader
        projectName={projectName}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onClear={clearTerminal}
      />
      <CardContent className="p-0">
        <div 
          className={`bg-[#1a1b26] rounded-b-lg ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-96'}`}
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
