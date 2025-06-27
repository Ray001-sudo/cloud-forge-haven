
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Trash2, 
  Plus,
  RefreshCw,
  Edit,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  lastModified?: string;
  path: string;
}

interface FileManagerProps {
  projectId: string;
  projectName: string;
}

const FileManager: React.FC<FileManagerProps> = ({ projectId, projectName }) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [editingFile, setEditingFile] = useState<string | null>(null);

  const bucketName = `project-${projectId}`;

  useEffect(() => {
    if (projectId && user) {
      loadFiles();
    }
  }, [projectId, user, currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      
      // First, ensure bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        const { error: bucketError } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 1024 * 1024 * 100 // 100MB limit
        });
        
        if (bucketError && !bucketError.message.includes('already exists')) {
          throw bucketError;
        }
      }

      // List files in current path
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(currentPath, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;

      const fileItems: FileItem[] = data?.map(item => ({
        name: item.name,
        type: item.metadata?.mimetype?.startsWith('application/x-directory') ? 'folder' : 'file',
        size: item.metadata?.size,
        lastModified: item.updated_at,
        path: currentPath ? `${currentPath}/${item.name}` : item.name
      })) || [];

      setFiles(fileItems);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setUploading(true);
      
      for (const file of selectedFiles) {
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
        
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;
      }

      toast.success(`Uploaded ${selectedFiles.length} file(s)`);
      loadFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('File downloaded');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      toast.success('File deleted');
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folderPath = currentPath ? `${currentPath}/${newFolderName}/.keep` : `${newFolderName}/.keep`;
      
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(folderPath, new Blob([''], { type: 'text/plain' }));

      if (error) throw error;

      toast.success('Folder created');
      setNewFolderName('');
      setShowNewFolder(false);
      loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const navigateToFolder = (folderName: string) => {
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    setCurrentPath(newPath);
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/');
    pathParts.pop();
    setCurrentPath(pathParts.join('/'));
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (type: string, fileName: string) => {
    if (type === 'folder') return <Folder className="h-5 w-5 text-blue-400" />;
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconColor = {
      'js': 'text-yellow-400',
      'ts': 'text-blue-400',
      'json': 'text-green-400',
      'html': 'text-orange-400',
      'css': 'text-pink-400',
      'md': 'text-gray-400',
      'txt': 'text-gray-400',
      'png': 'text-purple-400',
      'jpg': 'text-purple-400',
      'gif': 'text-purple-400'
    }[extension || ''] || 'text-slate-400';

    return <File className={`h-5 w-5 ${iconColor}`} />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">File Manager</h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowNewFolder(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
            <label className="cursor-pointer">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <Button
              onClick={loadFiles}
              size="sm"
              variant="outline"
              className="border-slate-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-slate-400">
          <button
            onClick={() => setCurrentPath('')}
            className="hover:text-white"
          >
            {projectName}
          </button>
          {currentPath && (
            <>
              {currentPath.split('/').map((part, index, array) => (
                <React.Fragment key={index}>
                  <span>/</span>
                  <button
                    onClick={() => {
                      const pathToIndex = array.slice(0, index + 1).join('/');
                      setCurrentPath(pathToIndex);
                    }}
                    className="hover:text-white"
                  >
                    {part}
                  </button>
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <div className="p-4 border-b border-slate-600">
          <div className="flex items-center space-x-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="bg-slate-700 border-slate-600 text-white"
              autoFocus
            />
            <Button
              onClick={createFolder}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                setShowNewFolder(false);
                setNewFolderName('');
              }}
              size="sm"
              variant="outline"
              className="border-slate-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
          </div>
        ) : (
          <div className="p-4">
            {currentPath && (
              <div
                onClick={navigateUp}
                className="flex items-center space-x-3 p-2 hover:bg-slate-700 rounded cursor-pointer mb-2"
              >
                <Folder className="h-5 w-5 text-blue-400" />
                <span className="text-white">.. (Parent Directory)</span>
              </div>
            )}
            
            {files.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files in this directory</p>
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center justify-between p-2 hover:bg-slate-700 rounded group"
                >
                  <div
                    className="flex items-center space-x-3 flex-1 cursor-pointer"
                    onClick={() => file.type === 'folder' ? navigateToFolder(file.name) : undefined}
                  >
                    {getFileIcon(file.type, file.name)}
                    <div>
                      <div className="text-white">{file.name}</div>
                      {file.type === 'file' && (
                        <div className="text-xs text-slate-400">
                          {formatFileSize(file.size)} • {file.lastModified && new Date(file.lastModified).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.type === 'file' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(file.path, file.name)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(file.path)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;
