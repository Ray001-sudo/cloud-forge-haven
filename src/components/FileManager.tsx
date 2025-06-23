
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  File, 
  Folder, 
  FolderOpen, 
  Upload, 
  Download, 
  Edit, 
  Trash2, 
  Plus,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified: string;
  content?: string;
  path: string;
  parentId?: string;
}

interface FileManagerProps {
  projectId: string;
  projectName: string;
}

const FileManager: React.FC<FileManagerProps> = ({ projectId, projectName }) => {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'app',
      type: 'folder',
      lastModified: '2024-01-15T10:30:00Z',
      path: '/app',
    },
    {
      id: '2',
      name: 'main.py',
      type: 'file',
      size: 1024,
      lastModified: '2024-01-15T10:30:00Z',
      path: '/app/main.py',
      parentId: '1',
      content: `# Main application file
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello, CloudForge!'

@app.route('/api/status')
def status():
    return jsonify({'status': 'running', 'service': '${projectName}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
`
    },
    {
      id: '3',
      name: 'requirements.txt',
      type: 'file',
      size: 256,
      lastModified: '2024-01-15T10:30:00Z',
      path: '/app/requirements.txt',
      parentId: '1',
      content: `Flask==2.3.2
gunicorn==21.2.0
python-dotenv==1.0.0
`
    },
    {
      id: '4',
      name: '.env',
      type: 'file',
      size: 128,
      lastModified: '2024-01-15T10:30:00Z',
      path: '/app/.env',
      parentId: '1',
      content: `PORT=5000
DEBUG=true
DATABASE_URL=postgresql://localhost:5432/cloudforge
`
    },
    {
      id: '5',
      name: 'logs',
      type: 'folder',
      lastModified: '2024-01-15T10:30:00Z',
      path: '/logs',
    },
    {
      id: '6',
      name: 'app.log',
      type: 'file',
      size: 2048,
      lastModified: '2024-01-15T10:30:00Z',
      path: '/logs/app.log',
      parentId: '5',
      content: `[2024-01-15 10:30:00] INFO: Application started
[2024-01-15 10:30:01] INFO: Flask server running on port 5000
[2024-01-15 10:30:02] INFO: Database connection established
[2024-01-15 10:30:03] INFO: Routes registered successfully
`
    }
  ]);

  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['1', '5']));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<'file' | 'folder'>('file');
  const [createName, setCreateName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = (file: FileItem) => {
    if (file.type === 'folder') {
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        if (newSet.has(file.id)) {
          newSet.delete(file.id);
        } else {
          newSet.add(file.id);
        }
        return newSet;
      });
    } else {
      setSelectedFile(file);
    }
  };

  const handleEditFile = (file: FileItem) => {
    setEditingFile(file);
    setEditContent(file.content || '');
  };

  const handleSaveFile = () => {
    if (editingFile) {
      setFiles(prev => prev.map(f => 
        f.id === editingFile.id 
          ? { ...f, content: editContent, lastModified: new Date().toISOString() }
          : f
      ));
      setEditingFile(null);
      setEditContent('');
      toast.success('File saved successfully');
    }
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId && f.parentId !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
    toast.success('File deleted successfully');
  };

  const handleUploadFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: FileItem = {
          id: Date.now().toString(),
          name: file.name,
          type: 'file',
          size: file.size,
          lastModified: new Date().toISOString(),
          path: `/app/${file.name}`,
          parentId: '1',
          content: e.target?.result as string
        };
        setFiles(prev => [...prev, newFile]);
        toast.success('File uploaded successfully');
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadFile = (file: FileItem) => {
    if (file.content) {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    }
  };

  const handleCreateItem = () => {
    if (createName.trim()) {
      const newItem: FileItem = {
        id: Date.now().toString(),
        name: createName,
        type: createType,
        lastModified: new Date().toISOString(),
        path: `/app/${createName}`,
        parentId: '1',
        ...(createType === 'file' && { content: '', size: 0 })
      };
      setFiles(prev => [...prev, newItem]);
      setCreateName('');
      setIsCreateDialogOpen(false);
      toast.success(`${createType === 'file' ? 'File' : 'Folder'} created successfully`);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return expandedFolders.has(file.id) ? FolderOpen : Folder;
    }
    return File;
  };

  const renderFileTree = (parentId?: string, level = 0) => {
    return files
      .filter(file => file.parentId === parentId)
      .map(file => {
        const Icon = getFileIcon(file);
        const isExpanded = expandedFolders.has(file.id);
        
        return (
          <div key={file.id}>
            <div
              className={`flex items-center p-2 rounded cursor-pointer hover:bg-slate-700 ${
                selectedFile?.id === file.id ? 'bg-slate-600' : ''
              }`}
              style={{ paddingLeft: `${level * 20 + 8}px` }}
              onClick={() => handleFileClick(file)}
            >
              <Icon className="h-4 w-4 mr-2 text-slate-400" />
              <span className="text-sm text-white flex-1">{file.name}</span>
              {file.type === 'file' && (
                <span className="text-xs text-slate-400 ml-2">
                  {formatFileSize(file.size)}
                </span>
              )}
            </div>
            {file.type === 'folder' && isExpanded && renderFileTree(file.id, level + 1)}
          </div>
        );
      });
  };

  return (
    <div className="h-full flex">
      {/* File Tree Sidebar */}
      <div className="w-1/3 bg-slate-800 border-r border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Files</h3>
            <div className="flex space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadFile}
                className="hidden"
              />
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="bg-sky-600 hover:bg-sky-700"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="border-slate-600">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex space-x-4">
                      <Button
                        onClick={() => setCreateType('file')}
                        variant={createType === 'file' ? 'default' : 'outline'}
                        className={createType === 'file' ? 'bg-sky-600' : 'border-slate-600'}
                      >
                        File
                      </Button>
                      <Button
                        onClick={() => setCreateType('folder')}
                        variant={createType === 'folder' ? 'default' : 'outline'}
                        className={createType === 'folder' ? 'bg-sky-600' : 'border-slate-600'}
                      >
                        Folder
                      </Button>
                    </div>
                    <div>
                      <Label htmlFor="name" className="text-white">Name</Label>
                      <Input
                        id="name"
                        value={createName}
                        onChange={(e) => setCreateName(e.target.value)}
                        placeholder={`Enter ${createType} name`}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={() => setIsCreateDialogOpen(false)}
                        variant="outline"
                        className="border-slate-600"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateItem}
                        className="bg-sky-600 hover:bg-sky-700"
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        <div className="p-2">
          {renderFileTree()}
        </div>
      </div>

      {/* File Content Area */}
      <div className="flex-1 flex flex-col">
        {editingFile ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">Editing: {editingFile.name}</h3>
              <div className="flex space-x-2">
                <Button
                  onClick={handleSaveFile}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button
                  onClick={() => setEditingFile(null)}
                  variant="outline"
                  className="border-slate-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-full bg-slate-900 border-slate-600 text-white font-mono text-sm resize-none"
                placeholder="Enter file content..."
              />
            </div>
          </div>
        ) : selectedFile ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedFile.name}</h3>
                <p className="text-sm text-slate-400">
                  {formatFileSize(selectedFile.size)} • Modified {new Date(selectedFile.lastModified).toLocaleString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleEditFile(selectedFile)}
                  variant="outline"
                  className="border-slate-600"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDownloadFile(selectedFile)}
                  variant="outline"
                  className="border-slate-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => handleDeleteFile(selectedFile.id)}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              <pre className="bg-slate-900 rounded-lg p-4 text-white font-mono text-sm overflow-x-auto">
                {selectedFile.content || 'No content available'}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <File className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No file selected</h3>
              <p className="text-slate-400">Click on a file to view its contents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;
