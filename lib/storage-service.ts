import { supabase } from './supabase';

export interface StorageUploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export class StorageService {
  private static instance: StorageService;
  private bucketsInitialized = false;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Create storage buckets if they don't exist
  async initializeStorage(): Promise<void> {
    if (this.bucketsInitialized) return;

    try {
      console.log('Initializing storage buckets...');
      
      // List existing buckets first
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.warn('Could not list buckets:', listError);
        // Continue anyway, try to create buckets
      }

      const existingBucketNames = existingBuckets?.map(b => b.name) || [];
      console.log('Existing buckets:', existingBucketNames);

      // Define buckets to create
      const bucketsToCreate = [
        {
          name: 'message-media',
          options: {
            public: false,
            allowedMimeTypes: [
              'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg',
              'video/webm', 'video/mp4', 'video/quicktime', 'video/ogg'
            ],
            fileSizeLimit: 500 * 1024 * 1024 // 500MB
          }
        },
        {
          name: 'attachments',
          options: {
            public: false,
            allowedMimeTypes: [
              'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
              'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm',
              'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
              'application/pdf', 'text/plain', 'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ],
            fileSizeLimit: 100 * 1024 * 1024 // 100MB
          }
        },
        {
          name: 'avatars',
          options: {
            public: true, // Avatars can be public
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            fileSizeLimit: 5 * 1024 * 1024 // 5MB
          }
        }
      ];

      // Create missing buckets
      for (const bucket of bucketsToCreate) {
        if (!existingBucketNames.includes(bucket.name)) {
          console.log(`Creating bucket: ${bucket.name}`);
          
          const { data, error } = await supabase.storage.createBucket(bucket.name, bucket.options);
          
          if (error) {
            console.warn(`Could not create bucket ${bucket.name}:`, error);
            // Don't throw error, continue with other buckets
          } else {
            console.log(`✅ Created storage bucket: ${bucket.name}`);
          }
        } else {
          console.log(`✅ Bucket ${bucket.name} already exists`);
        }
      }

      this.bucketsInitialized = true;
      console.log('Storage initialization complete');
      
    } catch (error) {
      console.error('Error initializing storage:', error);
      // Don't throw error, allow app to continue
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
      // Ensure storage is initialized
      await this.initializeStorage();

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

      console.log('Upload successful:', {
        path: data.path
      });

      return {
        success: true,
        path: data.path,
        url: await this.getSignedUrl('message-media', data.path)
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
      // Ensure storage is initialized
      await this.initializeStorage();

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

      return {
        success: true,
        path: data.path,
        url: await this.getSignedUrl('attachments', data.path)
      };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  // Upload avatar
  async uploadAvatar(
    file: File,
    userId: string
  ): Promise<StorageUploadResult> {
    try {
      // Ensure storage is initialized
      await this.initializeStorage();

      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar_${userId}_${timestamp}.${extension}`;
      const filePath = `avatars/${fileName}`;

      console.log('Uploading avatar:', {
        fileName,
        filePath,
        size: file.size,
        type: file.type
      });

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true // Allow overwriting avatars
        });

      if (error) {
        console.error('Avatar upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL for avatars (since bucket is public)
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
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

  // Check if bucket exists
  async bucketExists(bucketName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  // Get bucket info
  async getBucketInfo(bucketName: string) {
    try {
      const { data, error } = await supabase.storage.getBucket(bucketName);
      if (error) {
        console.error(`Error getting bucket info for ${bucketName}:`, error);
        return null;
      }
      return data;
    } catch (error) {
      console.error(`Error getting bucket info for ${bucketName}:`, error);
      return null;
    }
  }
}