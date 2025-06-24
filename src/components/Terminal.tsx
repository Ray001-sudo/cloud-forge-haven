
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Terminal as TerminalIcon, Maximize2, Minimize2, Trash2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface TerminalProps {
  projectId: string;
  projectName: string;
}

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  content: string;
  timestamp: Date;
}

interface FileSystem {
  [key: string]: {
    type: 'file' | 'directory';
    content?: string;
    children?: string[];
  };
}

const Terminal: React.FC<TerminalProps> = ({ projectId, projectName }) => {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentDirectory, setCurrentDirectory] = useState('/');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Simulated file system
  const [fileSystem, setFileSystem] = useState<FileSystem>({
    '/': { type: 'directory', children: ['app.js', 'package.json', 'README.md', 'src', 'public'] },
    '/app.js': { type: 'file', content: 'const express = require("express");\nconst app = express();\n\napp.get("/", (req, res) => {\n  res.send("Hello World!");\n});\n\napp.listen(3000, () => {\n  console.log("Server running on port 3000");\n});' },
    '/package.json': { type: 'file', content: '{\n  "name": "' + projectName + '",\n  "version": "1.0.0",\n  "main": "app.js",\n  "scripts": {\n    "start": "node app.js",\n    "dev": "nodemon app.js"\n  },\n  "dependencies": {\n    "express": "^4.18.2"\n  }\n}' },
    '/README.md': { type: 'file', content: '# ' + projectName + '\n\nA Node.js application deployed on CloudForge.\n\n## Getting Started\n\n```bash\nnpm install\nnpm start\n```' },
    '/src': { type: 'directory', children: ['index.js', 'utils.js'] },
    '/src/index.js': { type: 'file', content: 'console.log("Application starting...");' },
    '/src/utils.js': { type: 'file', content: 'module.exports = {\n  formatDate: (date) => date.toISOString()\n};' },
    '/public': { type: 'directory', children: ['index.html', 'style.css'] },
    '/public/index.html': { type: 'file', content: '<!DOCTYPE html>\n<html>\n<head>\n  <title>' + projectName + '</title>\n</head>\n<body>\n  <h1>Welcome to ' + projectName + '</h1>\n</body>\n</html>' },
    '/public/style.css': { type: 'file', content: 'body {\n  font-family: Arial, sans-serif;\n  margin: 40px;\n}' }
  });

  useEffect(() => {
    // Welcome message
    addLine('output', `Welcome to CloudForge Terminal - ${projectName}`);
    addLine('output', 'Type "help" for available commands.');
    addLine('output', '');
  }, [projectName]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    // Focus input when component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addLine = (type: 'input' | 'output' | 'error', content: string) => {
    const newLine: TerminalLine = {
      id: Date.now().toString() + Math.random(),
      type,
      content,
      timestamp: new Date()
    };
    setLines(prev => [...prev, newLine]);
  };

  const resolvePath = (path: string): string => {
    if (path.startsWith('/')) {
      return path;
    }
    
    if (path === '.') {
      return currentDirectory;
    }
    
    if (path === '..') {
      const parts = currentDirectory.split('/').filter(Boolean);
      parts.pop();
      return '/' + parts.join('/');
    }
    
    if (currentDirectory === '/') {
      return '/' + path;
    }
    
    return currentDirectory + '/' + path;
  };

  const executeCommand = async (command: string) => {
    const parts = command.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    addLine('input', `${currentDirectory}$ ${command}`);

    switch (cmd) {
      case '':
        break;

      case 'help':
        addLine('output', 'Available commands:');
        addLine('output', '  ls [path]     - List directory contents');
        addLine('output', '  cd <path>     - Change directory');
        addLine('output', '  cat <file>    - Display file contents');
        addLine('output', '  mkdir <dir>   - Create directory');
        addLine('output', '  touch <file>  - Create empty file');
        addLine('output', '  rm <file>     - Remove file');
        addLine('output', '  pwd           - Show current directory');
        addLine('output', '  clear         - Clear terminal');
        addLine('output', '  npm install   - Install dependencies');
        addLine('output', '  npm start     - Start the application');
        addLine('output', '  python3 <file> - Run Python script');
        addLine('output', '  node <file>   - Run Node.js script');
        addLine('output', '  htop          - Show system processes');
        addLine('output', '  ps aux        - List running processes');
        addLine('output', '  tail -f <file> - Follow file changes');
        break;

      case 'ls':
        const lsPath = args[0] ? resolvePath(args[0]) : currentDirectory;
        const lsDir = fileSystem[lsPath];
        
        if (!lsDir) {
          addLine('error', `ls: ${args[0] || '.'}: No such file or directory`);
        } else if (lsDir.type !== 'directory') {
          addLine('error', `ls: ${args[0]}: Not a directory`);
        } else {
          const items = lsDir.children || [];
          if (items.length === 0) {
            addLine('output', '(empty directory)');
          } else {
            items.forEach(item => {
              const itemPath = lsPath === '/' ? `/${item}` : `${lsPath}/${item}`;
              const itemData = fileSystem[itemPath];
              const prefix = itemData?.type === 'directory' ? 'd' : '-';
              const permissions = itemData?.type === 'directory' ? 'rwxr-xr-x' : 'rw-r--r--';
              const size = itemData?.content?.length || 0;
              const date = new Date().toLocaleDateString();
              addLine('output', `${prefix}${permissions} 1 user user ${size.toString().padStart(8)} ${date} ${item}`);
            });
          }
        }
        break;

      case 'cd':
        if (!args[0]) {
          setCurrentDirectory('/');
        } else {
          const newPath = resolvePath(args[0]);
          const targetDir = fileSystem[newPath];
          
          if (!targetDir) {
            addLine('error', `cd: ${args[0]}: No such file or directory`);
          } else if (targetDir.type !== 'directory') {
            addLine('error', `cd: ${args[0]}: Not a directory`);
          } else {
            setCurrentDirectory(newPath);
          }
        }
        break;

      case 'pwd':
        addLine('output', currentDirectory);
        break;

      case 'cat':
        if (!args[0]) {
          addLine('error', 'cat: missing file argument');
        } else {
          const filePath = resolvePath(args[0]);
          const file = fileSystem[filePath];
          
          if (!file) {
            addLine('error', `cat: ${args[0]}: No such file or directory`);
          } else if (file.type !== 'file') {
            addLine('error', `cat: ${args[0]}: Is a directory`);
          } else {
            const content = file.content || '';
            content.split('\n').forEach(line => addLine('output', line));
          }
        }
        break;

      case 'mkdir':
        if (!args[0]) {
          addLine('error', 'mkdir: missing directory name');
        } else {
          const dirPath = resolvePath(args[0]);
          if (fileSystem[dirPath]) {
            addLine('error', `mkdir: ${args[0]}: File exists`);
          } else {
            setFileSystem(prev => ({
              ...prev,
              [dirPath]: { type: 'directory', children: [] }
            }));
            
            // Update parent directory
            const parentPath = dirPath.substring(0, dirPath.lastIndexOf('/')) || '/';
            const dirName = dirPath.substring(dirPath.lastIndexOf('/') + 1);
            
            setFileSystem(prev => ({
              ...prev,
              [parentPath]: {
                ...prev[parentPath],
                children: [...(prev[parentPath]?.children || []), dirName]
              }
            }));
            
            addLine('output', `Directory '${args[0]}' created`);
          }
        }
        break;

      case 'touch':
        if (!args[0]) {
          addLine('error', 'touch: missing file name');
        } else {
          const filePath = resolvePath(args[0]);
          setFileSystem(prev => ({
            ...prev,
            [filePath]: { type: 'file', content: '' }
          }));
          
          // Update parent directory
          const parentPath = filePath.substring(0, filePath.lastIndexOf('/')) || '/';
          const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
          
          setFileSystem(prev => ({
            ...prev,
            [parentPath]: {
              ...prev[parentPath],
              children: [...(prev[parentPath]?.children || []), fileName]
            }
          }));
          
          addLine('output', `File '${args[0]}' created`);
        }
        break;

      case 'clear':
        setLines([]);
        break;

      case 'npm':
        if (args[0] === 'install') {
          setIsRunning(true);
          addLine('output', 'Installing dependencies...');
          setTimeout(() => {
            addLine('output', 'npm WARN deprecated some-package@1.0.0');
            setTimeout(() => {
              addLine('output', 'added 245 packages from 180 contributors and audited 1024 packages in 3.2s');
              addLine('output', 'found 0 vulnerabilities');
              setIsRunning(false);
            }, 1500);
          }, 1000);
        } else if (args[0] === 'start') {
          setIsRunning(true);
          addLine('output', 'Starting application...');
          setTimeout(() => {
            addLine('output', '> ' + projectName + '@1.0.0 start');
            addLine('output', '> node app.js');
            setTimeout(() => {
              addLine('output', 'Server running on port 3000');
              addLine('output', 'Application started successfully!');
              addLine('output', 'Visit: http://localhost:3000');
              setIsRunning(false);
            }, 1000);
          }, 500);
        } else {
          addLine('error', `npm: '${args[0]}' is not a recognized command`);
        }
        break;

      case 'python3':
      case 'python':
        if (!args[0]) {
          addLine('error', 'python3: missing script argument');
        } else {
          setIsRunning(true);
          addLine('output', `Running Python script: ${args[0]}`);
          setTimeout(() => {
            addLine('output', 'Python 3.9.2 (default, Feb 28 2021, 17:03:44)');
            addLine('output', 'Hello from Python!');
            addLine('output', 'Script execution completed.');
            setIsRunning(false);
          }, 800);
        }
        break;

      case 'node':
        if (!args[0]) {
          addLine('error', 'node: missing script argument');
        } else {
          setIsRunning(true);
          addLine('output', `Running Node.js script: ${args[0]}`);
          setTimeout(() => {
            addLine('output', 'Node.js v16.14.0');
            addLine('output', 'Script executed successfully.');
            setIsRunning(false);
          }, 600);
        }
        break;

      case 'htop':
        addLine('output', 'Tasks: 42 total, 1 running, 41 sleeping, 0 stopped, 0 zombie');
        addLine('output', '%Cpu(s): 12.3 us, 3.2 sy, 0.0 ni, 84.1 id, 0.4 wa, 0.0 hi, 0.0 si, 0.0 st');
        addLine('output', 'MiB Mem : 1024.0 total, 256.3 free, 512.1 used, 255.6 buff/cache');
        addLine('output', 'MiB Swap: 2048.0 total, 2048.0 free, 0.0 used. 467.2 avail Mem');
        addLine('output', '');
        addLine('output', '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND');
        addLine('output', ' 1234 user      20   0  123456  45678  12345 S   5.3   4.5   0:12.34 node');
        addLine('output', ' 5678 user      20   0   87654  32109   8765 S   2.1   3.1   0:05.67 npm');
        addLine('output', ' 9012 user      20   0   65432  21098   6543 S   0.7   2.1   0:02.10 chrome');
        break;

      case 'ps':
        if (args[0] === 'aux') {
          addLine('output', 'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');
          addLine('output', 'user      1234  5.3  4.5 123456 45678 ?       Sl   10:30   0:12 node app.js');
          addLine('output', 'user      5678  2.1  3.1  87654 32109 ?       Sl   10:28   0:05 npm start');
          addLine('output', 'user      9012  0.7  2.1  65432 21098 ?       Sl   10:25   0:02 chrome --type=renderer');
          addLine('output', 'user     10234  0.0  0.5  12345  6789 pts/0   R+   10:35   0:00 ps aux');
        } else {
          addLine('output', '  PID TTY          TIME CMD');
          addLine('output', ' 1234 pts/0    00:00:12 node');
          addLine('output', ' 5678 pts/0    00:00:05 npm');
          addLine('output', '10234 pts/0    00:00:00 ps');
        }
        break;

      case 'tail':
        if (args[0] === '-f' && args[1]) {
          setIsRunning(true);
          addLine('output', `Following ${args[1]}...`);
          addLine('output', 'Press Ctrl+C to stop');
          
          // Simulate log streaming
          let logCount = 0;
          const logInterval = setInterval(() => {
            const timestamp = new Date().toISOString();
            const logMessages = [
              `[${timestamp}] INFO: Application running normally`,
              `[${timestamp}] INFO: Processing request from 192.168.1.100`,
              `[${timestamp}] INFO: Database connection established`,
              `[${timestamp}] WARN: High memory usage detected`,
              `[${timestamp}] INFO: Cache cleared successfully`,
              `[${timestamp}] INFO: User authentication successful`,
              `[${timestamp}] INFO: Background job completed`
            ];
            
            addLine('output', logMessages[Math.floor(Math.random() * logMessages.length)]);
            logCount++;
            
            if (logCount >= 10) {
              clearInterval(logInterval);
              addLine('output', '');
              addLine('output', 'Log streaming stopped');
              setIsRunning(false);
            }
          }, 1000);
          
          // Auto-stop after 10 seconds
          setTimeout(() => {
            clearInterval(logInterval);
            if (isRunning) {
              addLine('output', '');
              addLine('output', '^C');
              addLine('output', 'Log streaming stopped');
              setIsRunning(false);
            }
          }, 10000);
        } else {
          addLine('error', 'tail: invalid option. Use: tail -f <filename>');
        }
        break;

      default:
        addLine('error', `${cmd}: command not found. Type "help" for available commands.`);
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRunning) {
      if (currentInput.trim()) {
        setCommandHistory(prev => [...prev, currentInput]);
        setHistoryIndex(-1);
        executeCommand(currentInput);
      } else {
        addLine('input', `${currentDirectory}$ `);
      }
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab completion for directories
      const parts = currentInput.split(' ');
      const lastPart = parts[parts.length - 1];
      const currentDir = fileSystem[currentDirectory];
      
      if (currentDir && currentDir.children) {
        const matches = currentDir.children.filter(child => 
          child.startsWith(lastPart)
        );
        
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          setCurrentInput(parts.join(' '));
        } else if (matches.length > 1) {
          addLine('output', `${currentDirectory}$ ${currentInput}`);
          addLine('output', matches.join('  '));
        }
      }
    } else if (e.ctrlKey && e.key === 'c') {
      if (isRunning) {
        setIsRunning(false);
        addLine('output', '^C');
        addLine('output', 'Process interrupted');
      }
    }
  };

  const handleClear = () => {
    setLines([]);
  };

  const handleCopy = () => {
    const terminalText = lines.map(line => {
      const prefix = line.type === 'input' ? '' : '';
      return prefix + line.content;
    }).join('\n');
    
    navigator.clipboard.writeText(terminalText).then(() => {
      toast.success('Terminal content copied to clipboard');
    });
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case 'input': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-slate-200';
    }
  };

  return (
    <Card className={`bg-slate-800 border-slate-700 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[600px]'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <TerminalIcon className="h-5 w-5 mr-2" />
            Terminal - {projectName}
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              className="text-slate-400 hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClear}
              className="text-slate-400 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-slate-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-full">
        <div
          ref={terminalRef}
          className="flex-1 bg-slate-900 p-4 overflow-y-auto font-mono text-sm"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map(line => (
            <div key={line.id} className={`${getLineColor(line.type)} whitespace-pre-wrap`}>
              {line.content}
            </div>
          ))}
          
          {/* Current input line */}
          <div className="flex items-center text-green-400">
            <span className="mr-2">{currentDirectory}$</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-green-400"
              disabled={isRunning}
              autoFocus
            />
            {isRunning && <span className="ml-2 animate-pulse">⏳</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Terminal;
