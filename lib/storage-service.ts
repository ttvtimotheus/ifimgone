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
  private initializationPromise: Promise<void> | null = null;

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Create storage buckets if they don't exist
  async initializeStorage(): Promise<void> {
    // If already initialized, return immediately
    if (this.bucketsInitialized) {
      return;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.performInitialization();
    
    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🔧 Starting storage initialization...');
      
      // Simple check - try to list buckets with a timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Storage check timeout')), 10000); // 10 second timeout
      });

      const listPromise = supabase.storage.listBuckets();
      
      const { data: existingBuckets, error: listError } = await Promise.race([
        listPromise,
        timeoutPromise
      ]) as any;
      
      if (listError) {
        console.warn('⚠️ Could not list buckets, but continuing:', listError.message);
        // Mark as initialized anyway to prevent infinite loops
        this.bucketsInitialized = true;
        return;
      }

      const existingBucketNames = existingBuckets?.map((b: any) => b.name) || [];
      console.log('📦 Found existing buckets:', existingBucketNames);

      // Check if required buckets exist
      const requiredBuckets = ['message-media', 'attachments', 'avatars'];
      const missingBuckets = requiredBuckets.filter(name => !existingBucketNames.includes(name));

      if (missingBuckets.length === 0) {
        console.log('✅ All required storage buckets exist');
        this.bucketsInitialized = true;
        return;
      }

      console.log('🔨 Missing buckets:', missingBuckets);
      console.log('ℹ️ Buckets should be created via Supabase migrations');
      
      // Mark as initialized even if some buckets are missing
      // The app should still work, just with limited functionality
      this.bucketsInitialized = true;
      console.log('✅ Storage initialization complete (with warnings)');
      
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      // Mark as initialized to prevent infinite retries
      this.bucketsInitialized = true;
      throw error;
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
      // Quick initialization check
      if (!this.bucketsInitialized) {
        await this.initializeStorage();
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = this.getFileExtension(blob.type, type);
      const fileName = `${type}_${messageId}_${timestamp}.${extension}`;
      const filePath = `recordings/${userId}/${fileName}`;

      console.log('📤 Uploading recording:', {
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
        console.error('❌ Storage upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Upload successful:', data.path);

      return {
        success: true,
        path: data.path,
        url: await this.getSignedUrl('message-media', data.path)
      };
    } catch (error) {
      console.error('❌ Error uploading recording:', error);
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
      // Quick initialization check
      if (!this.bucketsInitialized) {
        await this.initializeStorage();
      }

      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      const filePath = `attachments/${userId}/${messageId}/${fileName}`;

      console.log('📤 Uploading attachment:', {
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
        console.error('❌ Attachment upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ Attachment upload successful:', data.path);

      return {
        success: true,
        path: data.path,
        url: await this.getSignedUrl('attachments', data.path)
      };
    } catch (error) {
      console.error('❌ Error uploading attachment:', error);
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
      // Quick initialization check
      if (!this.bucketsInitialized) {
        await this.initializeStorage();
      }

      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar_${userId}_${timestamp}.${extension}`;
      const filePath = `avatars/${fileName}`;

      console.log('📤 Uploading avatar:', {
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
        console.error('❌ Avatar upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL for avatars (since bucket is public)
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('✅ Avatar upload successful:', data.path);

      return {
        success: true,
        path: data.path,
        url: urlData.publicUrl
      };
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
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
        console.error('❌ Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('❌ Error getting signed URL:', error);
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
        console.error('❌ Error deleting file:', error);
        return false;
      }

      console.log('✅ File deleted successfully:', path);
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
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
      console.error('❌ Error calculating file hash:', error);
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
        console.error(`❌ Error getting bucket info for ${bucketName}:`, error);
        return null;
      }
      return data;
    } catch (error) {
      console.error(`❌ Error getting bucket info for ${bucketName}:`, error);
      return null;
    }
  }

  // Force reset initialization (for debugging)
  resetInitialization(): void {
    this.bucketsInitialized = false;
    this.initializationPromise = null;
    console.log('🔄 Storage initialization reset');
  }

  // Check initialization status
  isInitialized(): boolean {
    return this.bucketsInitialized;
  }
}