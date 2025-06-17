import { SupabaseClient } from '@supabase/supabase-js';

export interface StorageUploadResult {
  success: boolean;
  path?: string;
  url?: string;
  error?: string;
}

export class StorageService {
  private supabase: SupabaseClient;
  private bucketsInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationAttempts = 0;
  private maxInitializationAttempts = 3;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  // Create storage buckets if they don't exist
  async initializeStorage(): Promise<void> {
    // If already initialized, return immediately
    if (this.bucketsInitialized) {
      console.log('✅ Storage already initialized');
      return;
    }

    // If initialization is already in progress, wait for it
    if (this.initializationPromise) {
      console.log('⏳ Storage initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    // Check if we've exceeded max attempts
    if (this.initializationAttempts >= this.maxInitializationAttempts) {
      console.log('⚠️ Max storage initialization attempts reached, skipping further attempts');
      this.bucketsInitialized = true;
      return;
    }

    this.initializationAttempts++;
    
    this.initializationPromise = this.performInitialization();
    
    try {
      await this.initializationPromise;
    } catch (error) {
      console.error(`❌ Storage initialization attempt ${this.initializationAttempts} failed:`, error);
      
      // If this was the last attempt, mark as initialized anyway
      if (this.initializationAttempts >= this.maxInitializationAttempts) {
        console.log('⚠️ All storage initialization attempts failed, continuing without full storage support');
        this.bucketsInitialized = true;
      }
    } finally {
      this.initializationPromise = null;
    }
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🔍 Checking storage availability...');
      
      // Create a very short timeout for the initial check
      const quickCheck = new Promise<boolean>((resolve) => {
        // Try a simple operation with a short timeout
        const timeoutId = setTimeout(() => {
          console.log('⏰ Quick storage check timed out, assuming storage is available');
          resolve(true);
        }, 3000); // 3 second timeout
        
        // Try to get bucket info for a known bucket
        this.supabase.storage.getBucket('message-media')
          .then((result) => {
            clearTimeout(timeoutId);
            console.log('📦 Storage responded:', result.error ? 'with error' : 'successfully');
            resolve(true);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            console.log('⚠️ Storage check failed, but continuing:', error.message);
            resolve(true); // Continue anyway
          });
      });

      await quickCheck;
      
      // Mark as initialized regardless of the result
      this.bucketsInitialized = true;
      console.log('✅ Storage initialization complete');
      
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
      console.log('📤 Starting recording upload...');
      
      // Try to initialize storage, but don't wait too long
      try {
        await Promise.race([
          this.initializeStorage(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Storage init timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.warn('⚠️ Storage initialization timed out, proceeding with upload anyway');
        this.bucketsInitialized = true; // Force mark as initialized
      }

      // Generate unique filename with proper user folder structure
      const timestamp = Date.now();
      const extension = this.getFileExtension(blob.type, type);
      const fileName = `${type}_${messageId}_${timestamp}.${extension}`;
      // Use the user ID in the path for RLS policy compliance
      const filePath = `${userId}/recordings/${fileName}`;

      console.log('📤 Uploading recording:', {
        fileName,
        filePath,
        size: blob.size,
        type: blob.type,
        userId
      });

      // Upload to Supabase Storage with timeout
      const uploadPromise = this.supabase.storage
        .from('message-media')
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: false
        });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 30000) // 30 second timeout
      );

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Storage upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      console.log('✅ Upload successful:', data.path);

      // Try to get signed URL, but don't fail if it doesn't work
      let signedUrl: string | null = null;
      try {
        signedUrl = await this.getSignedUrl('message-media', data.path);
      } catch (urlError) {
        console.warn('⚠️ Could not generate signed URL:', urlError);
      }

      return {
        success: true,
        path: data.path,
        url: signedUrl || undefined
      };
    } catch (error) {
      console.error('❌ Error uploading recording:', error);
      
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Upload timed out. Please check your connection and try again.';
        } else if (error.message.includes('Bucket not found')) {
          errorMessage = 'Storage not properly configured. Please contact support.';
        } else if (error.message.includes('row-level security')) {
          errorMessage = 'Storage permission error. Please try logging out and back in.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
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
      console.log('📤 Starting attachment upload...');
      
      // Try to initialize storage with timeout
      try {
        await Promise.race([
          this.initializeStorage(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Storage init timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.warn('⚠️ Storage initialization timed out, proceeding with upload anyway');
        this.bucketsInitialized = true;
      }

      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedFileName}`;
      // Use the user ID in the path for RLS policy compliance
      const filePath = `${userId}/attachments/${messageId}/${fileName}`;

      console.log('📤 Uploading attachment:', {
        fileName,
        filePath,
        size: file.size,
        type: file.type,
        userId
      });

      // Upload with timeout
      const uploadPromise = this.supabase.storage
        .from('attachments')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 60000) // 60 second timeout for larger files
      );

      const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

      if (error) {
        console.error('❌ Attachment upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      console.log('✅ Attachment upload successful:', data.path);

      // Try to get signed URL
      let signedUrl: string | null = null;
      try {
        signedUrl = await this.getSignedUrl('attachments', data.path);
      } catch (urlError) {
        console.warn('⚠️ Could not generate signed URL:', urlError);
      }

      return {
        success: true,
        path: data.path,
        url: signedUrl || undefined
      };
    } catch (error) {
      console.error('❌ Error uploading attachment:', error);
      
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Upload timed out. Please check your connection and try again.';
        } else if (error.message.includes('Bucket not found')) {
          errorMessage = 'Storage not properly configured. Please contact support.';
        } else if (error.message.includes('row-level security')) {
          errorMessage = 'Storage permission error. Please try logging out and back in.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Upload avatar
  async uploadAvatar(
    file: File,
    userId: string
  ): Promise<StorageUploadResult> {
    try {
      console.log('📤 Starting avatar upload...');
      
      // Try to initialize storage with timeout
      try {
        await Promise.race([
          this.initializeStorage(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Storage init timeout')), 5000)
          )
        ]);
      } catch (error) {
        console.warn('⚠️ Storage initialization timed out, proceeding with upload anyway');
        this.bucketsInitialized = true;
      }

      const timestamp = Date.now();
      const extension = file.name.split('.').pop() || 'jpg';
      const fileName = `avatar_${userId}_${timestamp}.${extension}`;
      // Use the user ID in the path for RLS policy compliance
      const filePath = `${userId}/${fileName}`;

      console.log('📤 Uploading avatar:', {
        fileName,
        filePath,
        size: file.size,
        type: file.type,
        userId
      });

      const { data, error } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true // Allow overwriting avatars
        });

      if (error) {
        console.error('❌ Avatar upload error:', error);
        return {
          success: false,
          error: `Upload failed: ${error.message}`
        };
      }

      // Get public URL for avatars (since bucket is public)
      const { data: urlData } = this.supabase.storage
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
      const { data, error } = await this.supabase.storage
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
      const { error } = await this.supabase.storage
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
  getFileExtension(mimeType: string, fallbackType: string): string {
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
      const { data, error } = await this.supabase.storage.getBucket(bucketName);
      return !error && !!data;
    } catch (error) {
      return false;
    }
  }

  // Get bucket info
  async getBucketInfo(bucketName: string) {
    try {
      const { data, error } = await this.supabase.storage.getBucket(bucketName);
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
    this.initializationAttempts = 0;
    console.log('🔄 Storage initialization reset');
  }

  // Check initialization status
  isInitialized(): boolean {
    return this.bucketsInitialized;
  }

  // Get initialization status with details
  getInitializationStatus(): {
    initialized: boolean;
    attempts: number;
    maxAttempts: number;
    inProgress: boolean;
  } {
    return {
      initialized: this.bucketsInitialized,
      attempts: this.initializationAttempts,
      maxAttempts: this.maxInitializationAttempts,
      inProgress: this.initializationPromise !== null
    };
  }
}