
import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import 'xterm/css/xterm.css';

interface TerminalProps {
  projectId: string;
  projectName: string;
}

interface FileSystem {
  [key: string]: {
    type: 'file' | 'directory';
    content?: string;
    children?: FileSystem;
  };
}

const Terminal: React.FC<TerminalProps> = ({ projectId, projectName }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/home/project');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [currentCommand, setCurrentCommand] = useState('');

  // Mock filesystem for demonstration
  const [filesystem] = useState<FileSystem>({
    home: {
      type: 'directory',
      children: {
        project: {
          type: 'directory',
          children: {
            'package.json': {
              type: 'file',
              content: JSON.stringify({
                name: projectName.toLowerCase().replace(/\s+/g, '-'),
                version: '1.0.0',
                main: 'index.js',
                scripts: {
                  start: 'node index.js',
                  dev: 'nodemon index.js',
                  build: 'npm run compile'
                }
              }, null, 2)
            },
            'index.js': {
              type: 'file',
              content: `console.log('Hello from ${projectName}!');\n\nconst express = require('express');\nconst app = express();\nconst port = process.env.PORT || 3000;\n\napp.get('/', (req, res) => {\n  res.send('Hello World!');\n});\n\napp.listen(port, () => {\n  console.log(\`Server running on port \${port}\`);\n});`
            },
            'README.md': {
              type: 'file',
              content: `# ${projectName}\n\nThis is a CloudForge project.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm start\n\`\`\``
            },
            src: {
              type: 'directory',
              children: {
                'app.js': {
                  type: 'file',
                  content: '// Main application file'
                },
                utils: {
                  type: 'directory',
                  children: {
                    'helpers.js': {
                      type: 'file',
                      content: '// Utility functions'
                    }
                  }
                }
              }
            },
            logs: {
              type: 'directory',
              children: {
                'app.log': {
                  type: 'file',
                  content: '[2024-01-01 12:00:00] INFO: Application started\n[2024-01-01 12:00:01] INFO: Server listening on port 3000'
                }
              }
            }
          }
        }
      }
    }
  });

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
    writePrompt();

    let currentInput = '';
    let cursorPosition = 0;

    function writePrompt() {
      terminal.write(`\x1b[1;32mcloudforge\x1b[0m:\x1b[1;34m${currentPath}\x1b[0m$ `);
    }

    function clearCurrentLine() {
      terminal.write('\x1b[2K\r');
      writePrompt();
    }

    function executeCommand(command: string) {
      const parts = command.trim().split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      terminal.writeln('');

      switch (cmd) {
        case '':
          break;

        case 'help':
          terminal.writeln('\x1b[1;33mAvailable commands:\x1b[0m');
          terminal.writeln('  ls [-la]     - List directory contents');
          terminal.writeln('  cd <dir>     - Change directory');
          terminal.writeln('  pwd          - Print working directory');
          terminal.writeln('  cat <file>   - Display file contents');
          terminal.writeln('  touch <file> - Create empty file');
          terminal.writeln('  mkdir <dir>  - Create directory');
          terminal.writeln('  rm <file>    - Remove file');
          terminal.writeln('  clear        - Clear terminal');
          terminal.writeln('  whoami       - Display current user');
          terminal.writeln('  ps           - List running processes');
          terminal.writeln('  htop         - Display system resources');
          terminal.writeln('  npm <cmd>    - Run npm commands');
          terminal.writeln('  python3 <file> - Run Python script');
          terminal.writeln('  tail -f <file> - Follow file output');
          terminal.writeln('  exit         - Exit terminal');
          break;

        case 'ls':
          const showHidden = args.includes('-a') || args.includes('-la');
          const showDetails = args.includes('-l') || args.includes('-la');
          const targetPath = args.find(arg => !arg.startsWith('-')) || '.';
          
          const currentDir = getCurrentDirectory(targetPath === '.' ? currentPath : targetPath);
          if (!currentDir || currentDir.type !== 'directory') {
            terminal.writeln(`\x1b[31mls: cannot access '${targetPath}': No such file or directory\x1b[0m`);
            break;
          }

          if (showDetails) {
            terminal.writeln('total 8');
          }

          Object.entries(currentDir.children || {}).forEach(([name, item]) => {
            if (!showHidden && name.startsWith('.')) return;
            
            if (showDetails) {
              const permissions = item.type === 'directory' ? 'drwxr-xr-x' : '-rw-r--r--';
              const size = item.type === 'file' ? (item.content?.length || 0).toString().padStart(8) : '4096';
              const date = 'Jan  1 12:00';
              const color = item.type === 'directory' ? '\x1b[1;34m' : '\x1b[0m';
              terminal.writeln(`${permissions} 1 user user ${size} ${date} ${color}${name}\x1b[0m`);
            } else {
              const color = item.type === 'directory' ? '\x1b[1;34m' : '\x1b[0m';
              terminal.write(`${color}${name}\x1b[0m  `);
            }
          });
          
          if (!showDetails) {
            terminal.writeln('');
          }
          break;

        case 'cd':
          const newPath = args[0];
          if (!newPath) {
            setCurrentPath('/home/project');
          } else if (newPath === '..') {
            const pathParts = currentPath.split('/').filter(p => p);
            pathParts.pop();
            setCurrentPath('/' + pathParts.join('/'));
          } else if (newPath === '/') {
            setCurrentPath('/');
          } else {
            const targetDir = getCurrentDirectory(newPath.startsWith('/') ? newPath : `${currentPath}/${newPath}`);
            if (!targetDir || targetDir.type !== 'directory') {
              terminal.writeln(`\x1b[31mbash: cd: ${newPath}: No such file or directory\x1b[0m`);
            } else {
              const newFullPath = newPath.startsWith('/') ? newPath : `${currentPath}/${newPath}`.replace(/\/+/g, '/');
              setCurrentPath(newFullPath);
            }
          }
          break;

        case 'pwd':
          terminal.writeln(currentPath);
          break;

        case 'cat':
          const filename = args[0];
          if (!filename) {
            terminal.writeln('\x1b[31mcat: missing file operand\x1b[0m');
            break;
          }
          
          const file = getCurrentDirectory(`${currentPath}/${filename}`);
          if (!file || file.type !== 'file') {
            terminal.writeln(`\x1b[31mcat: ${filename}: No such file or directory\x1b[0m`);
          } else {
            terminal.writeln(file.content || '');
          }
          break;

        case 'touch':
          const newFileName = args[0];
          if (!newFileName) {
            terminal.writeln('\x1b[31mtouch: missing file operand\x1b[0m');
          } else {
            terminal.writeln(`Created file: ${newFileName}`);
          }
          break;

        case 'mkdir':
          const dirName = args[0];
          if (!dirName) {
            terminal.writeln('\x1b[31mmkdir: missing operand\x1b[0m');
          } else {
            terminal.writeln(`Created directory: ${dirName}`);
          }
          break;

        case 'clear':
          terminal.clear();
          break;

        case 'whoami':
          terminal.writeln('cloudforge-user');
          break;

        case 'ps':
          terminal.writeln('  PID TTY          TIME CMD');
          terminal.writeln('  123 pts/0    00:00:01 node');
          terminal.writeln('  456 pts/0    00:00:00 npm');
          terminal.writeln('  789 pts/0    00:00:00 bash');
          break;

        case 'htop':
          terminal.writeln('\x1b[1;32m┌─ CloudForge Container Resources ─────────────────────┐\x1b[0m');
          terminal.writeln('\x1b[1;33mCPU Usage:  ████████░░ 80%\x1b[0m');
          terminal.writeln('\x1b[1;33mMemory:     ██████░░░░ 60% (153MB/256MB)\x1b[0m');
          terminal.writeln('\x1b[1;33mDisk:       ███░░░░░░░ 30% (307MB/1GB)\x1b[0m');
          terminal.writeln('\x1b[1;33mNetwork:    ↑ 1.2MB/s ↓ 0.8MB/s\x1b[0m');
          terminal.writeln('\x1b[1;32m└─────────────────────────────────────────────────────┘\x1b[0m');
          break;

        case 'npm':
          const npmCmd = args[0];
          if (!npmCmd) {
            terminal.writeln('\x1b[31mUsage: npm <command>\x1b[0m');
            break;
          }
          
          terminal.writeln(`\x1b[33mRunning: npm ${args.join(' ')}\x1b[0m`);
          
          setTimeout(() => {
            switch (npmCmd) {
              case 'install':
                terminal.writeln('added 234 packages in 12.4s');
                terminal.writeln('\x1b[32m✓ Installation complete\x1b[0m');
                break;
              case 'start':
                terminal.writeln('> node index.js');
                terminal.writeln('Server running on port 3000');
                terminal.writeln('\x1b[32m✓ Application started\x1b[0m');
                break;
              case 'run':
                terminal.writeln(`> ${args.slice(1).join(' ')}`);
                terminal.writeln('\x1b[32m✓ Script executed\x1b[0m');
                break;
              default:
                terminal.writeln(`\x1b[31mUnknown npm command: ${npmCmd}\x1b[0m`);
            }
            writePrompt();
          }, 1500);
          return; // Don't write prompt immediately

        case 'python3':
          const pythonFile = args[0];
          if (!pythonFile) {
            terminal.writeln('Python 3.9.2 (default, Feb 28 2021, 17:03:44)');
            terminal.writeln('[GCC 10.2.1 20210110] on linux');
            terminal.writeln('Type "help", "copyright", "credits" or "license" for more information.');
            terminal.writeln('>>> exit()');
          } else {
            terminal.writeln(`Running: python3 ${pythonFile}`);
            setTimeout(() => {
              terminal.writeln('Hello from Python!');
              terminal.writeln('\x1b[32m✓ Python script executed\x1b[0m');
              writePrompt();
            }, 1000);
            return;
          }
          break;

        case 'tail':
          if (args[0] === '-f' && args[1]) {
            const logFile = args[1];
            terminal.writeln(`Following ${logFile}...`);
            terminal.writeln('\x1b[33mPress Ctrl+C to stop\x1b[0m');
            
            // Simulate log streaming
            let logCount = 0;
            const logInterval = setInterval(() => {
              if (logCount++ < 5) {
                const timestamp = new Date().toISOString();
                terminal.writeln(`[${timestamp}] INFO: Application heartbeat`);
              } else {
                clearInterval(logInterval);
                terminal.writeln('\x1b[33m^C\x1b[0m');
                writePrompt();
              }
            }, 2000);
            return;
          }
          terminal.writeln('\x1b[31mUsage: tail -f <filename>\x1b[0m');
          break;

        case 'exit':
          terminal.writeln('Goodbye!');
          return;

        default:
          terminal.writeln(`\x1b[31mbash: ${cmd}: command not found\x1b[0m`);
      }

      terminal.writeln('');
      writePrompt();
    }

    function getCurrentDirectory(path: string): any {
      const parts = path.split('/').filter(p => p);
      let current = filesystem;
      
      for (const part of parts) {
        if (current[part] && current[part].type === 'directory' && current[part].children) {
          current = current[part].children!;
        } else if (current[part] && current[part].type === 'file') {
          return current[part];
        } else {
          return null;
        }
      }
      
      return { type: 'directory', children: current };
    }

    // Handle input
    terminal.onData((data) => {
      const code = data.charCodeAt(0);

      if (code === 13) { // Enter
        executeCommand(currentInput);
        setCommandHistory(prev => [...prev, currentInput]);
        setHistoryIndex(-1);
        currentInput = '';
        cursorPosition = 0;
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
        writePrompt();
      } else if (code === 12) { // Ctrl+L
        terminal.clear();
        writePrompt();
      } else if (code === 27) { // ESC sequences
        // Handle arrow keys for command history
        return;
      } else if (code >= 32) { // Printable characters
        currentInput = currentInput.slice(0, cursorPosition) + data + currentInput.slice(cursorPosition);
        cursorPosition++;
        terminal.write(data);
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      terminal.dispose();
    };
  }, [projectId, projectName, currentPath, filesystem]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      fitAddonRef.current?.fit();
    }, 100);
  };

  const clearTerminal = () => {
    xtermRef.current?.clear();
  };

  return (
    <Card className={`bg-slate-800 border-slate-700 ${isFullscreen ? 'fixed inset-4 z-50' : 'h-full'}`}>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-white text-lg">Terminal - {projectName}</CardTitle>
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={clearTerminal}
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleFullscreen}
            className="text-slate-400 hover:text-white"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={terminalRef} 
          className="h-96 bg-[#1a1b26] rounded-b-lg"
          style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '400px' }}
        />
      </CardContent>
    </Card>
  );
};

export default Terminal;
