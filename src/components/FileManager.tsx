
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Folder, 
  File, 
  Upload, 
  Download, 
  Edit3, 
  Trash2, 
  Save, 
  X,
  Plus,
  ChevronRight,
  ChevronDown,
  FileText,
  Image,
  Code,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  lastModified?: string;
  content?: string;
  children?: FileItem[];
}

interface FileManagerProps {
  projectId: string;
  projectName: string;
}

const FileManager: React.FC<FileManagerProps> = ({ projectId, projectName }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['']));
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const { data: projectFiles, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('file_path');

      if (error) throw error;

      // Convert flat file list to tree structure
      const fileTree = buildFileTree(projectFiles || []);
      setFiles(fileTree);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const buildFileTree = (flatFiles: any[]): FileItem[] => {
    const tree: FileItem[] = [];
    const map = new Map<string, FileItem>();

    // Add root folder
    map.set('', { id: 'root', name: projectName, type: 'folder', path: '', children: [] });

    // Process each file
    flatFiles.forEach(file => {
      const pathParts = file.file_path.split('/');
      let currentPath = '';

      // Create folder structure
      pathParts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (index === pathParts.length - 1) {
          // This is the file
          const fileItem: FileItem = {
            id: file.id,
            name: file.file_name,
            type: 'file',
            path: file.file_path,
            size: file.file_size,
            lastModified: file.updated_at
          };

          const parent = map.get(parentPath);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(fileItem);
          }
          map.set(currentPath, fileItem);
        } else {
          // This is a folder
          if (!map.has(currentPath)) {
            const folderItem: FileItem = {
              id: `folder-${currentPath}`,
              name: part,
              type: 'folder',
              path: currentPath,
              children: []
            };

            const parent = map.get(parentPath);
            if (parent) {
              parent.children = parent.children || [];
              parent.children.push(folderItem);
            }
            map.set(currentPath, folderItem);
          }
        }
      });
    });

    return map.get('')?.children || [];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-green-400" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'html':
      case 'css':
      case 'json':
        return <Code className="h-4 w-4 text-blue-400" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <Archive className="h-4 w-4 text-yellow-400" />;
      default:
        return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const handleFileSelect = async (file: FileItem) => {
    if (file.type === 'folder') {
      toggleFolder(file.path);
      return;
    }

    setSelectedFile(file);
    
    // Load file content if it's a text file
    if (isTextFile(file.name)) {
      try {
        const { data, error } = await supabase.storage
          .from('project-files')
          .download(`${projectId}/${file.path}`);

        if (error) throw error;
        
        const content = await data.text();
        setSelectedFile({ ...file, content });
      } catch (error) {
        console.error('Error loading file content:', error);
        toast.error('Failed to load file content');
      }
    }
  };

  const isTextFile = (fileName: string) => {
    const textExtensions = ['txt', 'js', 'ts', 'jsx', 'tsx', 'py', 'html', 'css', 'json', 'md', 'yml', 'yaml', 'xml'];
    const ext = fileName.split('.').pop()?.toLowerCase();
    return textExtensions.includes(ext || '');
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = selectedFile?.type === 'folder' ? `${selectedFile.path}/${file.name}` : file.name;
      
      try {
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(`${projectId}/${filePath}`, file);

        if (uploadError) throw uploadError;

        // Save file metadata to database
        const { error: dbError } = await supabase
          .from('project_files')
          .insert({
            project_id: projectId,
            file_path: filePath,
            file_name: file.name,
            file_size: file.size,
            mime_type: file.type,
            storage_path: `${projectId}/${filePath}`
          });

        if (dbError) throw dbError;

        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Reset input and reload files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    loadFiles();
  };

  const handleFileEdit = () => {
    if (!selectedFile) return;
    setEditingFile(selectedFile);
    setEditContent(selectedFile.content || '');
  };

  const handleSaveEdit = async () => {
    if (!editingFile) return;

    try {
      // Upload updated content to storage
      const blob = new Blob([editContent], { type: 'text/plain' });
      const { error } = await supabase.storage
        .from('project-files')
        .update(`${projectId}/${editingFile.path}`, blob);

      if (error) throw error;

      // Update file metadata
      const { error: updateError } = await supabase
        .from('project_files')
        .update({ 
          file_size: blob.size,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingFile.id);

      if (updateError) throw updateError;

      toast.success('File saved successfully');
      setEditingFile(null);
      setSelectedFile({ ...editingFile, content: editContent });
      loadFiles();
    } catch (error) {
      console.error('Error saving file:', error);
      toast.error('Failed to save file');
    }
  };

  const handleFileDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-files')
        .remove([`${projectId}/${file.path}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      toast.success(`Deleted ${file.name}`);
      setSelectedFile(null);
      loadFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleFileDownload = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(`${projectId}/${file.path}`);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${file.name}`);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderPath = newFolderPath ? `${newFolderPath}/${newFolderName}` : newFolderName;

    try {
      // Create a placeholder file to represent the folder
      const placeholderContent = new Blob([''], { type: 'text/plain' });
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(`${projectId}/${folderPath}/.gitkeep`, placeholderContent);

      if (uploadError) throw uploadError;

      // Save folder metadata
      const { error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          file_path: `${folderPath}/.gitkeep`,
          file_name: '.gitkeep',
          file_size: 0,
          mime_type: 'text/plain',
          storage_path: `${projectId}/${folderPath}/.gitkeep`
        });

      if (dbError) throw dbError;

      toast.success(`Created folder ${newFolderName}`);
      setNewFolderName('');
      setShowNewFolder(false);
      loadFiles();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map(item => (
      <div key={item.id} className="select-none">
        <div
          className={`flex items-center py-1 px-2 hover:bg-slate-700 cursor-pointer ${
            selectedFile?.id === item.id ? 'bg-slate-700' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => handleFileSelect(item)}
        >
          {item.type === 'folder' ? (
            <>
              {expandedFolders.has(item.path) ? (
                <ChevronDown className="h-4 w-4 text-slate-400 mr-1" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-400 mr-1" />
              )}
              <Folder className="h-4 w-4 text-blue-400 mr-2" />
            </>
          ) : (
            <>
              <div className="w-5" />
              {getFileIcon(item.name)}
              <span className="ml-2" />
            </>
          )}
          <span className="text-slate-200 text-sm truncate">{item.name}</span>
          {item.type === 'file' && item.size && (
            <span className="text-slate-500 text-xs ml-auto">
              {(item.size / 1024).toFixed(1)}KB
            </span>
          )}
        </div>
        
        {item.type === 'folder' && expandedFolders.has(item.path) && item.children && (
          renderFileTree(item.children, level + 1)
        )}
      </div>
    ));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-slate-400">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* File Tree Sidebar */}
      <div className="w-1/3 border-r border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold">Files</h3>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNewFolderPath(selectedFile?.type === 'folder' ? selectedFile.path : '');
                  setShowNewFolder(true);
                }}
                className="text-slate-400 hover:text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-white"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {showNewFolder && (
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                className="bg-slate-700 border-slate-600 text-white text-sm"
              />
              <Button size="sm" onClick={handleCreateFolder} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowNewFolder(false)}
                className="text-slate-400"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        <div className="p-2">
          {renderFileTree(files)}
        </div>
      </div>

      {/* File Content/Editor */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                {getFileIcon(selectedFile.name)}
                <h3 className="text-white font-medium">{selectedFile.name}</h3>
                {selectedFile.lastModified && (
                  <span className="text-slate-500 text-sm">
                    Modified: {new Date(selectedFile.lastModified).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                {selectedFile.type === 'file' && isTextFile(selectedFile.name) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleFileEdit}
                    className="text-slate-400 hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleFileDownload(selectedFile)}
                  className="text-slate-400 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleFileDelete(selectedFile)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto">
              {editingFile ? (
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium">Editing {editingFile.name}</h4>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingFile(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 bg-slate-900 border-slate-700 text-slate-200 font-mono text-sm resize-none"
                    placeholder="File content..."
                  />
                </div>
              ) : selectedFile.content !== undefined ? (
                <pre className="text-slate-200 font-mono text-sm whitespace-pre-wrap">
                  {selectedFile.content}
                </pre>
              ) : (
                <div className="text-slate-400 text-center py-8">
                  <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Cannot preview this file type</p>
                  <p className="text-sm">Use the download button to view the file</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a file to view its contents</p>
              <p className="text-sm mt-2">Upload files by clicking the upload button</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default FileManager;
