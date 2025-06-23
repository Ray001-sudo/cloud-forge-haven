
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Terminal as TerminalIcon, Play, Square, RotateCcw, Trash2 } from 'lucide-react';

interface TerminalProps {
  projectId: string;
  projectName: string;
}

interface TerminalCommand {
  command: string;
  output: string;
  timestamp: string;
  exitCode: number;
}

const Terminal: React.FC<TerminalProps> = ({ projectId, projectName }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDir, setCurrentDir] = useState('/app');
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulated file system
  const [fileSystem] = useState({
    '/': {
      'app': {
        'main.py': `# Main application file
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, CloudForge!'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)`,
        'requirements.txt': 'Flask==2.3.2\ngunicorn==21.2.0\npython-dotenv==1.0.0',
        '.env': 'PORT=5000\nDEBUG=true',
        'package.json': '{\n  "name": "cloudforge-app",\n  "version": "1.0.0",\n  "main": "server.js"\n}'
      },
      'logs': {
        'app.log': '[2024-01-15 10:30:00] INFO: Application started\n[2024-01-15 10:30:01] INFO: Server running on port 5000'
      },
      'data': {}
    }
  });

  const executeCommand = async (command: string): Promise<{ output: string; exitCode: number }> => {
    setIsProcessing(true);
    
    // Simulate command execution delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const cmd = command.trim();
    const args = cmd.split(' ');
    const baseCmd = args[0];
    
    let output = '';
    let exitCode = 0;

    try {
      switch (baseCmd) {
        case 'ls':
          const path = currentDir === '/app' ? fileSystem['/'].app : 
                      currentDir === '/logs' ? fileSystem['/'].logs :
                      currentDir === '/data' ? fileSystem['/'].data :
                      fileSystem['/'];
          
          if (typeof path === 'object') {
            output = Object.keys(path).map(name => {
              const isDir = typeof path[name] === 'object' && path[name] !== null && typeof path[name] !== 'string';
              return isDir ? `${name}/` : name;
            }).join('  ');
          } else {
            output = 'ls: cannot access directory';
            exitCode = 1;
          }
          break;

        case 'cd':
          const targetDir = args[1] || '/';
          const validDirs = ['/', '/app', '/logs', '/data'];
          if (validDirs.includes(targetDir)) {
            setCurrentDir(targetDir);
            output = '';
          } else if (targetDir === '..') {
            const parent = currentDir === '/app' || currentDir === '/logs' || currentDir === '/data' ? '/' : currentDir;
            setCurrentDir(parent);
            output = '';
          } else {
            output = `cd: ${targetDir}: No such file or directory`;
            exitCode = 1;
          }
          break;

        case 'pwd':
          output = currentDir;
          break;

        case 'cat':
          const fileName = args[1];
          if (!fileName) {
            output = 'cat: missing file operand';
            exitCode = 1;
          } else {
            const currentPath = currentDir === '/app' ? fileSystem['/'].app : 
                              currentDir === '/logs' ? fileSystem['/'].logs :
                              fileSystem['/'];
            
            if (typeof currentPath === 'object' && currentPath[fileName] && typeof currentPath[fileName] === 'string') {
              output = currentPath[fileName] as string;
            } else {
              output = `cat: ${fileName}: No such file or directory`;
              exitCode = 1;
            }
          }
          break;

        case 'python':
          if (args[1] === 'main.py') {
            output = `Starting Python application...
 * Running on http://0.0.0.0:5000
 * Debug mode: on
 * Restarting with stat
 * Debugger is active!
Use Ctrl+C to stop the server`;
          } else {
            output = 'Python 3.11.0 (main, Oct 24 2022, 18:26:48) [GCC 9.4.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n>>> ';
          }
          break;

        case 'npm':
          if (args[1] === 'install') {
            output = `npm notice created a lockfile as package-lock.json. You should commit this file.
npm WARN ${projectName}@1.0.0 No repository field.

added 50 packages from 37 contributors and audited 50 packages in 2.5s
found 0 vulnerabilities`;
          } else if (args[1] === 'start') {
            output = `> ${projectName}@1.0.0 start
> node server.js

Server running on port 3000
Application started successfully`;
          } else {
            output = 'npm <command>\n\nUsage:\n  npm install    Install dependencies\n  npm start      Start the application';
          }
          break;

        case 'ps':
          output = `  PID TTY          TIME CMD
 1234 pts/0    00:00:01 python
 1235 pts/0    00:00:00 gunicorn
 1236 pts/0    00:00:00 node`;
          break;

        case 'htop':
          output = `Tasks: 3 total,   1 running,   2 sleeping,   0 stopped,   0 zombie
%Cpu(s):  5.2 us,  2.1 sy,  0.0 ni, 92.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
MiB Mem :   1024.0 total,    512.0 free,    256.0 used,    256.0 buff/cache
MiB Swap:      0.0 total,      0.0 free,      0.0 used.    768.0 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
 1234 app       20   0  145364  23456   8192 S   2.0  2.3   0:01.23 python
 1235 app       20   0   12345   6789   4321 S   0.0  0.7   0:00.45 gunicorn`;
          break;

        case 'tail':
          if (args[1] === '-f' && args[2]) {
            output = `==> ${args[2]} <==
[2024-01-15 10:30:00] INFO: Application started
[2024-01-15 10:30:01] INFO: Server running on port 5000
[2024-01-15 10:30:02] INFO: New request received
[2024-01-15 10:30:03] INFO: Response sent successfully
Waiting for more data... (Press Ctrl+C to stop)`;
          } else {
            output = 'tail: missing file operand\nTry: tail -f filename';
            exitCode = 1;
          }
          break;

        case 'systemctl':
          if (args[1] === 'status' && args[2]) {
            output = `● ${args[2]}.service - ${projectName} Application
   Loaded: loaded (/etc/systemd/system/${args[2]}.service; enabled; vendor preset: enabled)
   Active: active (running) since Mon 2024-01-15 10:30:00 UTC; 2h 15min ago
 Main PID: 1234 (python)
    Tasks: 1 (limit: 1157)
   Memory: 25.6M
   CGroup: /system.slice/${args[2]}.service
           └─1234 python main.py`;
          } else {
            output = 'systemctl [OPTIONS...] COMMAND [UNIT...]\n\nUsage: systemctl status <service>';
          }
          break;

        case 'clear':
          setCommandHistory([]);
          output = '';
          break;

        case 'help':
          output = `Available commands:
ls          - List directory contents
cd <dir>    - Change directory
pwd         - Print working directory
cat <file>  - Display file contents
python      - Run Python interpreter
npm         - Node package manager
ps          - Show running processes
htop        - Display running processes
tail -f     - Follow file contents
systemctl   - Control systemd services
clear       - Clear terminal
help        - Show this help message`;
          break;

        default:
          output = `${baseCmd}: command not found`;
          exitCode = 127;
      }
    } catch (error) {
      output = `Error executing command: ${error}`;
      exitCode = 1;
    }

    setIsProcessing(false);
    return { output, exitCode };
  };

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const command = input.trim();
    setInput('');

    const { output, exitCode } = await executeCommand(command);
    
    const newCommand: TerminalCommand = {
      command,
      output,
      timestamp: new Date().toISOString(),
      exitCode
    };

    setCommandHistory(prev => [...prev, newCommand]);
  };

  const handleConnect = () => {
    setIsConnected(true);
    setCommandHistory([{
      command: 'connect',
      output: `Welcome to CloudForge Terminal
Project: ${projectName}
Container ID: ${projectId.substring(0, 12)}
Working directory: ${currentDir}

Type 'help' for available commands.`,
      timestamp: new Date().toISOString(),
      exitCode: 0
    }]);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setCommandHistory([]);
    setCurrentDir('/app');
  };

  const handleClear = () => {
    setCommandHistory([]);
  };

  return (
    <Card className="bg-slate-800 border-slate-700 h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TerminalIcon className="h-5 w-5 text-sky-400" />
            <CardTitle className="text-white">Terminal</CardTitle>
            <Badge className={`${isConnected ? 'bg-green-600' : 'bg-red-600'} text-white`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
          <div className="flex space-x-2">
            {!isConnected ? (
              <Button
                onClick={handleConnect}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Connect
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleClear}
                  size="sm"
                  variant="outline"
                  className="border-slate-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleDisconnect}
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-4">
        {isConnected ? (
          <>
            <div className="flex-1 bg-slate-900 rounded-lg p-4 overflow-y-auto font-mono text-sm mb-4">
              {commandHistory.map((cmd, index) => (
                <div key={index} className="mb-4">
                  <div className="flex items-center text-green-400 mb-1">
                    <span className="text-sky-400">app@cloudforge</span>
                    <span className="text-white mx-1">:</span>
                    <span className="text-purple-400">{currentDir}</span>
                    <span className="text-white mx-1">$</span>
                    <span className="text-white">{cmd.command}</span>
                  </div>
                  {cmd.output && (
                    <pre className="text-slate-300 whitespace-pre-wrap mb-2">
                      {cmd.output}
                    </pre>
                  )}
                </div>
              ))}
              {isProcessing && (
                <div className="text-yellow-400 animate-pulse">Processing...</div>
              )}
            </div>
            <form onSubmit={handleCommandSubmit} className="flex items-center space-x-2">
              <div className="flex items-center text-sm font-mono text-green-400">
                <span className="text-sky-400">app@cloudforge</span>
                <span className="text-white mx-1">:</span>
                <span className="text-purple-400">{currentDir}</span>
                <span className="text-white mx-1">$</span>
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-white font-mono text-sm outline-none"
                placeholder="Enter command..."
                disabled={isProcessing}
                autoFocus
              />
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <TerminalIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Terminal Disconnected</h3>
              <p className="text-slate-400 mb-4">Connect to start using the terminal</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Terminal;
