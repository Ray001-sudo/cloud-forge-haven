
import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { useTerminal } from '@/hooks/useTerminal';
import 'xterm/css/xterm.css';

interface TerminalCoreProps {
  projectId: string;
  projectName: string;
  onClear?: () => void;
}

const TerminalCore: React.FC<TerminalCoreProps> = ({ projectId, projectName, onClear }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [currentPath, setCurrentPath] = useState('/home/project');
  const { executeCommand, buildLogs, commandHistory } = useTerminal(projectId);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal
    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#c0caf5',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
        brightBlack: '#414868',
        brightRed: '#f7768e',
        brightGreen: '#9ece6a',
        brightYellow: '#e0af68',
        brightBlue: '#7aa2f7',
        brightMagenta: '#bb9af7',
        brightCyan: '#7dcfff',
        brightWhite: '#c0caf5'
      }
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Welcome message
    terminal.writeln('\x1b[1;32m╔══════════════════════════════════════╗');
    terminal.writeln('║          CloudForge Terminal        ║');
    terminal.writeln('╚══════════════════════════════════════╝\x1b[0m');
    terminal.writeln(`\x1b[1;36mProject: ${projectName}\x1b[0m`);
    terminal.writeln('\x1b[33mType "help" for available commands\x1b[0m');
    terminal.writeln('');

    let currentInput = '';
    let cursorPosition = 0;
    let historyIndex = -1;
    const localHistory: string[] = [];

    function writePrompt() {
      terminal.write(`\x1b[1;32mcloudforge\x1b[0m:\x1b[1;34m${currentPath}\x1b[0m$ `);
    }

    async function handleCommand(command: string) {
      if (!command.trim()) return;

      terminal.writeln('');
      
      // Add to local history
      localHistory.unshift(command);
      if (localHistory.length > 50) localHistory.pop();

      // Handle local commands
      if (command === 'clear') {
        terminal.clear();
        writePrompt();
        return;
      }

      if (command.startsWith('cd ')) {
        const newPath = command.substring(3).trim();
        if (newPath === '..') {
          const pathParts = currentPath.split('/').filter(p => p);
          pathParts.pop();
          setCurrentPath('/' + pathParts.join('/'));
        } else if (newPath === '/') {
          setCurrentPath('/');
        } else if (newPath.startsWith('/')) {
          setCurrentPath(newPath);
        } else {
          setCurrentPath(`${currentPath}/${newPath}`.replace(/\/+/g, '/'));
        }
        writePrompt();
        return;
      }

      // Execute command via Supabase
      try {
        const result = await executeCommand(command);
        if (result.output) {
          const lines = result.output.split('\n');
          lines.forEach(line => {
            if (line) terminal.writeln(line);
          });
        }
        
        if (result.exit_code !== 0) {
          terminal.writeln(`\x1b[31mCommand exited with code ${result.exit_code}\x1b[0m`);
        }
      } catch (error) {
        terminal.writeln(`\x1b[31mError: ${error.message}\x1b[0m`);
      }

      terminal.writeln('');
      writePrompt();
    }

    // Handle input
    terminal.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        handleCommand(currentInput);
        currentInput = '';
        cursorPosition = 0;
        historyIndex = -1;
      } else if (code === 127) { // Backspace
        if (cursorPosition > 0) {
          currentInput = currentInput.slice(0, cursorPosition - 1) + currentInput.slice(cursorPosition);
          cursorPosition--;
          terminal.write('\b \b');
        }
      } else if (code === 3) { // Ctrl+C
        terminal.writeln('^C');
        currentInput = '';
        cursorPosition = 0;
        historyIndex = -1;
        writePrompt();
      } else if (code === 12) { // Ctrl+L
        terminal.clear();
        writePrompt();
      } else if (code === 27) { // ESC sequences (arrow keys)
        terminal.onData((escSeq) => {
          if (escSeq === '[A' && localHistory.length > 0) { // Up arrow
            if (historyIndex < localHistory.length - 1) {
              historyIndex++;
              // Clear current line
              terminal.write('\x1b[2K\r');
              writePrompt();
              currentInput = localHistory[historyIndex];
              cursorPosition = currentInput.length;
              terminal.write(currentInput);
            }
          } else if (escSeq === '[B' && historyIndex >= 0) { // Down arrow
            historyIndex--;
            // Clear current line
            terminal.write('\x1b[2K\r');
            writePrompt();
            if (historyIndex >= 0) {
              currentInput = localHistory[historyIndex];
              cursorPosition = currentInput.length;
              terminal.write(currentInput);
            } else {
              currentInput = '';
              cursorPosition = 0;
            }
          }
        });
      } else if (code >= 32) { // Printable characters
        currentInput = currentInput.slice(0, cursorPosition) + data + currentInput.slice(cursorPosition);
        cursorPosition++;
        terminal.write(data);
      }
    });

    writePrompt();

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, [projectId, projectName, currentPath, executeCommand]);

  // Display real-time build logs
  useEffect(() => {
    if (!xtermRef.current || buildLogs.length === 0) return;

    const terminal = xtermRef.current;
    const latestLog = buildLogs[0];
    
    // Format log message with colors
    const getLogColor = (level: string) => {
      switch (level) {
        case 'error': return '\x1b[31m';
        case 'warn': return '\x1b[33m';
        case 'info': return '\x1b[36m';
        case 'debug': return '\x1b[37m';
        default: return '\x1b[0m';
      }
    };

    const timestamp = new Date(latestLog.created_at).toLocaleTimeString();
    const colorCode = getLogColor(latestLog.log_level);
    const resetCode = '\x1b[0m';
    
    terminal.writeln(`${colorCode}[${timestamp}] ${latestLog.log_level.toUpperCase()}: ${latestLog.message}${resetCode}`);
  }, [buildLogs]);

  const clearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      onClear?.();
    }
  };

  const fitTerminal = () => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  };

  // Expose methods for parent component
  useEffect(() => {
    const terminal = xtermRef.current;
    if (terminal) {
      (terminal as any).clearTerminal = clearTerminal;
      (terminal as any).fitTerminal = fitTerminal;
    }
  }, []);

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-full bg-[#1a1b26] rounded-lg"
      style={{ minHeight: '400px' }}
    />
  );
};

export default TerminalCore;
