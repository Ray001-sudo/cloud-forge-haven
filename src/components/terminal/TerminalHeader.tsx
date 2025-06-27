
import React from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, RotateCcw, Copy, Terminal as TerminalIcon, Download } from 'lucide-react';
import { toast } from 'sonner';

interface TerminalHeaderProps {
  projectName: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClear: () => void;
  onCopy?: () => void;
  onExportLogs?: () => void;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  projectName,
  isFullscreen,
  onToggleFullscreen,
  onClear,
  onCopy,
  onExportLogs
}) => {
  const handleCopy = () => {
    if (onCopy) {
      onCopy();
    } else {
      // Default copy behavior - copy current URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Terminal URL copied to clipboard');
    }
  };

  const handleExportLogs = () => {
    if (onExportLogs) {
      onExportLogs();
      toast.success('Terminal logs exported');
    }
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-slate-800 border-b border-slate-700">
      <div className="flex items-center space-x-3">
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="flex items-center space-x-2">
          <TerminalIcon className="h-5 w-5 text-sky-400" />
          <h3 className="text-white text-lg font-semibold">Terminal - {projectName}</h3>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={handleExportLogs}
          className="text-slate-400 hover:text-white"
          title="Export Logs"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="text-slate-400 hover:text-white"
          title="Copy"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClear}
          className="text-slate-400 hover:text-white"
          title="Clear Terminal"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleFullscreen}
          className="text-slate-400 hover:text-white"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default TerminalHeader;
