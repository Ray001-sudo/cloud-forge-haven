
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
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

export interface TerminalCoreRef {
  clearTerminal: () => void;
  fitTerminal: () => void;
  exportLogs: () => string;
  copyContent: () => void;
}

const TerminalCore = forwardRef<TerminalCoreRef, TerminalCoreProps>(({ projectId, projectName, onClear }, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [currentPath, setCurrentPath] = useState('/home/project');
  const [terminalBuffer, setTerminalBuffer] = useState<string[]>([]);
  const { executeCommand, buildLogs, commandHistory, clearCommandHistory } = useTerminal(projectId);

  const clearTerminal = () => {
    if (xtermRef.current) {
      xtermRef.current.clear();
      setTerminalBuffer([]);
      onClear?.();
    }
  };

  const fitTerminal = () => {
    if (fitAddonRef.current) {
      fitAddonRef.current.fit();
    }
  };

  const exportLogs = () => {
    return terminalBuffer.join('\n');
  };

  const copyContent = () => {
    const content = terminalBuffer.join('\n');
    navigator.clipboard.writeText(content);
  };

  // Sanitize terminal output to prevent injection
  const sanitizeOutput = (text: string): string => {
    return text
      .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // Remove ANSI codes for export
      .replace(/[<>&"']/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return entities[char] || char;
      });
  };

  // Add content to terminal buffer
  const addToBuffer = (content: string) => {
    setTerminalBuffer(prev => [...prev, content]);
  };

  useImperativeHandle(ref, () => ({
    clearTerminal,
    fitTerminal,
    exportLogs,
    copyContent
  }));

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize terminal with enhanced theme
    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Courier New", monospace',
      lineHeight: 1.2,
      letterSpacing: 0.5,
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#ff9e64',
        cursorAccent: '#1a1b26',
        selection: '#33467c',
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

    // Enhanced welcome message with CloudForge branding
    const welcomeMessage = [
      '\x1b[1;32m╔══════════════════════════════════════╗',
      '║          CloudForge Terminal        ║',
      '╚══════════════════════════════════════╝\x1b[0m',
      `\x1b[1;36mProject: ${projectName}\x1b[0m`,
      '\x1b[33mType "help" for available commands\x1b[0m',
      '\x1b[90mReal-time logs and bot integration enabled\x1b[0m',
      ''
    ];

    welcomeMessage.forEach(line => {
      terminal.writeln(line);
      addToBuffer(line);
    });

    let currentInput = '';
    let cursorPosition = 0;
    let historyIndex = -1;
    const localHistory: string[] = [];

    // Load previous command history
    const recentCommands = commandHistory.slice(0, 10).map(cmd => cmd.command);
    localHistory.unshift(...recentCommands);

    function writePrompt() {
      const promptText = `\x1b[1;32mcloudforge\x1b[0m:\x1b[1;34m${currentPath}\x1b[0m$ `;
      terminal.write(promptText);
    }

    async function handleCommand(command: string) {
      if (!command.trim()) return;

      terminal.writeln('');
      addToBuffer(command);
      
      // Add to local history
      localHistory.unshift(command);
      if (localHistory.length > 50) localHistory.pop();

      // Handle special local commands
      if (command === 'clear') {
        terminal.clear();
        setTerminalBuffer([]);
        writePrompt();
        return;
      }

      if (command === 'reset' || command === 'clear-history') {
        await clearCommandHistory();
        localHistory.length = 0;
        terminal.writeln('\x1b[32mCommand history cleared\x1b[0m');
        addToBuffer('Command history cleared');
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

      // Execute command via Supabase with enhanced error handling
      try {
        terminal.writeln(`\x1b[90m[${new Date().toLocaleTimeString()}] Executing: ${command}\x1b[0m`);
        const result = await executeCommand(command);
        
        if (result.output) {
          const lines = result.output.split('\n');
          lines.forEach(line => {
            if (line) {
              terminal.writeln(line);
              addToBuffer(line);
            }
          });
        }
        
        if (result.exit_code !== 0) {
          const errorMsg = `\x1b[31mCommand exited with code ${result.exit_code}\x1b[0m`;
          terminal.writeln(errorMsg);
          addToBuffer(errorMsg);
        }
      } catch (error) {
        const errorMsg = `\x1b[31mError: ${error instanceof Error ? error.message : 'Unknown error'}\x1b[0m`;
        terminal.writeln(errorMsg);
        addToBuffer(errorMsg);
      }

      terminal.writeln('');
      writePrompt();
    }

    // Enhanced input handling with better key support
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
        addToBuffer('^C');
        currentInput = '';
        cursorPosition = 0;
        historyIndex = -1;
        writePrompt();
      } else if (code === 12) { // Ctrl+L
        terminal.clear();
        setTerminalBuffer([]);
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

    // Handle resize with debouncing
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        fitAddon.fit();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, [projectId, projectName, currentPath, executeCommand, commandHistory, clearCommandHistory]);

  // Enhanced real-time build logs display with bot integration
  useEffect(() => {
    if (!xtermRef.current || buildLogs.length === 0) return;

    const terminal = xtermRef.current;
    const latestLog = buildLogs[0];
    
    // Enhanced log formatting with timestamps and colors
    const getLogColor = (level: string, source: string) => {
      if (source === 'bot') return '\x1b[95m'; // Bright magenta for bot logs
      switch (level) {
        case 'error': return '\x1b[31m';
        case 'warn': return '\x1b[33m';
        case 'info': return '\x1b[36m';
        case 'debug': return '\x1b[37m';
        case 'success': return '\x1b[32m';
        default: return '\x1b[0m';
      }
    };

    const timestamp = new Date(latestLog.created_at).toLocaleTimeString();
    const colorCode = getLogColor(latestLog.log_level, latestLog.source);
    const resetCode = '\x1b[0m';
    const sourcePrefix = latestLog.source === 'bot' ? '[BOT] ' : '';
    
    const logLine = `${colorCode}[${timestamp}] ${sourcePrefix}${latestLog.log_level.toUpperCase()}: ${latestLog.message}${resetCode}`;
    terminal.writeln(logLine);
    addToBuffer(sanitizeOutput(logLine));

    // Auto-scroll to bottom
    terminal.scrollToBottom();
  }, [buildLogs]);

  return (
    <div 
      ref={terminalRef} 
      className="h-full w-full bg-[#1a1b26] rounded-lg overflow-hidden"
      style={{ minHeight: '400px' }}
    />
  );
});

TerminalCore.displayName = 'TerminalCore';

export default TerminalCore;
