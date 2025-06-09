'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  Music, 
  Video,
  X,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { StorageService } from '@/lib/storage-service';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  messageId: string;
  onFileUploaded?: (file: File, uploadPath: string) => void;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
  storagePath?: string;
}

export function FileUploader({ 
  messageId, 
  onFileUploaded, 
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  allowedTypes = [
    'image/*',
    'audio/*',
    'video/*',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageService = StorageService.getInstance();
  const { user } = useAuth();
  const { toast } = useToast();

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds limit of ${formatFileSize(maxFileSize)}`;
    }

    // Check file type
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return 'File type not allowed';
    }

    return null;
  };

  const handleFileSelect = async (files: FileList) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to upload files',
        variant: 'destructive'
      });
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      toast({
        title: 'File Validation Errors',
        description: errors.join('\n'),
        variant: 'destructive'
      });
    }

    // Upload valid files
    for (const file of validFiles) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    try {
      // Add to uploading files
      const uploadingFile: UploadingFile = {
        file,
        progress: 0,
        status: 'uploading'
      };

      setUploadingFiles(prev => [...prev, uploadingFile]);
      const fileIndex = uploadingFiles.length;

      // Upload to storage
      const uploadResult = await storageService.uploadAttachment(file, messageId, user.id);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Calculate file hash
      const fileHash = await storageService.calculateFileHash(file);

      // Save attachment record to database
      const { error: attachmentError } = await supabase
        .from('attachments')
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          mime_type: file.type,
          storage_path: uploadResult.path,
          file_hash: fileHash,
          is_encrypted: false,
          access_level: 'private'
        });

      if (attachmentError) {
        console.error('Error saving attachment record:', attachmentError);
        throw new Error('Failed to save attachment record');
      }

      // Log the upload activity
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'file_uploaded',
          details: {
            message_id: messageId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: uploadResult.path
          }
        });

      // Update status
      setUploadingFiles(prev => 
        prev.map((uf, index) => 
          index === fileIndex 
            ? { 
                ...uf, 
                status: 'completed',
                progress: 100,
                storagePath: uploadResult.path
              }
            : uf
        )
      );

      onFileUploaded?.(file, uploadResult.path || '');
      
      toast({
        title: 'Upload Complete',
        description: `${file.name} has been uploaded successfully`,
        variant: 'default'
      });

    } catch (error) {
      console.error('Upload error:', error);
      
      // Update status to failed
      setUploadingFiles(prev => 
        prev.map((uf, index) => 
          index === uploadingFiles.length 
            ? { 
                ...uf, 
                status: 'failed',
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : uf
        )
      );

      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Upload failed',
        variant: 'destructive'
      });
    }
  };

  const removeUploadingFile = async (index: number) => {
    const file = uploadingFiles[index];
    
    // If file was successfully uploaded, delete it from storage
    if (file.status === 'completed' && file.storagePath && user) {
      try {
        await storageService.deleteFile('attachments', file.storagePath);
        
        // Remove attachment record
        await supabase
          .from('attachments')
          .delete()
          .eq('storage_path', file.storagePath)
          .eq('message_id', messageId);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Upload className="w-5 h-5 mr-2" />
          File Attachments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
              ? 'border-amber-500 bg-amber-500/10' 
              : 'border-slate-600 hover:border-slate-500'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Drop files here or click to browse
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            Support for images, audio, video, and documents
          </p>
          <Button 
            onClick={openFileDialog}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
          >
            Choose Files
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={allowedTypes.join(',')}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          />
        </div>

        {/* File Limits Info */}
        <Alert className="border-slate-700 bg-slate-800/50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-slate-300">
            <strong>File Limits:</strong> Maximum {formatFileSize(maxFileSize)} per file. 
            Supported types: Images, Audio, Video, PDF, Word documents.
          </AlertDescription>
        </Alert>

        {/* Uploading Files */}
        <AnimatePresence>
          {uploadingFiles.map((uploadingFile, index) => {
            const IconComponent = getFileIcon(uploadingFile.file.type);
            
            return (
              <motion.div
                key={`${uploadingFile.file.name}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-slate-800 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <IconComponent className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-white font-medium">{uploadingFile.file.name}</p>
                      <p className="text-slate-400 text-sm">
                        {formatFileSize(uploadingFile.file.size)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={
                        uploadingFile.status === 'completed' 
                          ? 'border-green-500 text-green-400'
                          : uploadingFile.status === 'failed'
                          ? 'border-red-500 text-red-400'
                          : 'border-blue-500 text-blue-400'
                      }
                    >
                      {uploadingFile.status === 'uploading' && `${Math.round(uploadingFile.progress)}%`}
                      {uploadingFile.status === 'completed' && (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Complete
                        </>
                      )}
                      {uploadingFile.status === 'failed' && 'Failed'}
                    </Badge>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUploadingFile(index)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {uploadingFile.status === 'uploading' && (
                  <Progress value={uploadingFile.progress} className="h-2" />
                )}
                
                {uploadingFile.status === 'failed' && uploadingFile.error && (
                  <p className="text-red-400 text-sm mt-2">{uploadingFile.error}</p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Upload Summary */}
        {uploadingFiles.length > 0 && (
          <div className="text-sm text-slate-400 text-center">
            {uploadingFiles.filter(f => f.status === 'completed').length} of {uploadingFiles.length} files uploaded
          </div>
        )}
      </CardContent>
    </Card>
  );
}