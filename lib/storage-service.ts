import { supabase } from './supabase';

export interface StorageUploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export class StorageService {
  private static instance: StorageService;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Create storage buckets if they don't exist
  async initializeStorage(): Promise<void> {
    try {
      // Check if buckets exist, create if they don't
      const buckets = ['message-media', 'avatars', 'attachments'];
      
      for (const bucketName of buckets) {
        const { data: existingBucket } = await supabase.storage.getBucket(bucketName);
        
        if (!existingBucket) {
          const { error } = await supabase.storage.createBucket(bucketName, {
            public: false, // Private by default for security
            allowedMimeTypes: this.getAllowedMimeTypes(bucketName),
            fileSizeLimit: this.getFileSizeLimit(bucketName)
          });
          
          if (error) {
            console.warn(`Could not create bucket ${bucketName}:`, error);
          } else {
            console.log(`Created storage bucket: ${bucketName}`);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  private getAllowedMimeTypes(bucketName: string): string[] {
    switch (bucketName) {
      case 'message-media':
        return [
          'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg',
          'video/webm', 'video/mp4', 'video/quicktime', 'video/ogg'
        ];
      case 'avatars':
        return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      case 'attachments':
        return [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
          'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
          'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
          'application/pdf', 'text/plain', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
      default:
        return ['*'];
    }
  }

  private getFileSizeLimit(bucketName: string): number {
    switch (bucketName) {
      case 'message-media':
        return 500 * 1024 * 1024; // 500MB for recordings
      case 'avatars':
        return 5 * 1024 * 1024; // 5MB for avatars
      case 'attachments':
        return 100 * 1024 * 1024; // 100MB for attachments
      default:
        return 50 * 1024 * 1024; // 50MB default
    }
  }

  // Upload media recording (audio/video)
  async uploadRecording(
    blob: Blob, 
    type: 'audio' | 'video',
    messageId: string,
    userId: string
  ): Promise<StorageUploadResult> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = this.getFileExtension(blob.type, type);
      const fileName = `${type}_${messageId}_${timestamp}.${extension}`;
      const filePath = `recordings/${userId}/${fileName}`;

      console.log('Uploading recording:', {
        fileName,
        filePath,
        size: blob.size,
        type: blob.type
      });

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('message-media')
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL (for private buckets, we'll use signed URLs later)
      const { data: urlData } = supabase.storage
        .from('message-media')
        .getPublicUrl(filePath);

      console.log('Upload successful:', {
        path: data.path,
        url: urlData.publicUrl
      });

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading recording:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Upload file attachment
  async uploadAttachment(
    file: File,
    messageId: string,
    userId: string
  ): Promise<StorageUploadResult> {
    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `attachments/${userId}/${messageId}/${fileName}`;

      console.log('Uploading attachment:', {
        fileName,
        filePath,
        size: file.size,
        type: file.type
      });

      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        console.error('Attachment upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Get signed URL for private files
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }

  // Delete file from storage
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        console.error('Error deleting file:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  // Get file extension based on MIME type
  private getFileExtension(mimeType: string, fallbackType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp4': 'm4a',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/ogg': 'ogg',
      'video/webm': 'webm',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/ogg': 'ogv'
    };

    return mimeToExt[mimeType] || (fallbackType === 'audio' ? 'webm' : 'mp4');
  }

  // Calculate file hash for deduplication
  async calculateFileHash(file: File | Blob): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error calculating file hash:', error);
      return '';
    }
  }
}