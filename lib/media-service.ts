import { supabase } from './supabase';

export interface RecordingSession {
  id: string;
  session_type: 'audio' | 'video' | 'screen';
  status: 'recording' | 'processing' | 'completed' | 'failed';
  duration?: number;
  file_size?: number;
  quality_settings?: any;
  storage_path?: string;
  created_at: string;
}

export interface FileUploadSession {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  upload_status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed';
  upload_progress: number;
  storage_path?: string;
  created_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content_template: string;
  rich_content_template?: any;
  is_public: boolean;
  usage_count: number;
}

export class MediaService {
  private static instance: MediaService;

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  // File Upload Functions
  async createFileUploadSession(
    messageId: string, 
    file: File
  ): Promise<string | null> {
    try {
      const { data: sessionId, error } = await supabase
        .rpc('create_file_upload_session', {
          p_message_id: messageId,
          p_file_name: file.name,
          p_file_size: file.size,
          p_mime_type: file.type
        });

      if (error) throw error;
      return sessionId;
    } catch (error) {
      console.error('Error creating file upload session:', error);
      return null;
    }
  }

  async uploadFile(
    sessionId: string, 
    file: File, 
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      const fileName = `attachment_${sessionId}_${Date.now()}_${file.name}`;
      const filePath = `attachments/${fileName}`;

      // For large files, we could implement chunked upload here
      const { error } = await supabase.storage
        .from('message-media')
        .upload(filePath, file, {}, {
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            onProgress?.(percentage);
          }
        });

      if (error) throw error;

      // Update upload session
      await supabase
        .from('file_upload_sessions')
        .update({
          upload_status: 'completed',
          upload_progress: 100,
          storage_path: filePath
        })
        .eq('id', sessionId);

      // Create attachment record
      await supabase
        .from('attachments')
        .insert({
          message_id: (await supabase
            .from('file_upload_sessions')
            .select('message_id')
            .eq('id', sessionId)
            .single()).data?.message_id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          mime_type: file.type,
          storage_path: filePath,
          file_hash: await this.calculateFileHash(file)
        });

      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Update upload session with error
      await supabase
        .from('file_upload_sessions')
        .update({
          upload_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Upload failed'
        })
        .eq('id', sessionId);

      return false;
    }
  }

  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Template Functions
  async getMessageTemplates(category?: string): Promise<MessageTemplate[]> {
    try {
      let query = supabase
        .from('message_templates')
        .select('*')
        .order('usage_count', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching message templates:', error);
      return [];
    }
  }

  async createMessageTemplate(
    name: string,
    description: string,
    category: string,
    contentTemplate: string,
    richContentTemplate?: any
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          name,
          description,
          category,
          content_template: contentTemplate,
          rich_content_template: richContentTemplate,
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating message template:', error);
      return null;
    }
  }

  async useTemplate(templateId: string, variables: Record<string, string>): Promise<string> {
    try {
      // Increment usage count
      await supabase
        .from('message_templates')
        .update({ usage_count: supabase.sql`usage_count + 1` })
        .eq('id', templateId);

      // Get template
      const { data: template, error } = await supabase
        .from('message_templates')
        .select('content_template')
        .eq('id', templateId)
        .single();

      if (error) throw error;

      // Replace variables in template
      let content = template.content_template;
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{${key}}`, 'g'), value);
      });

      return content;
    } catch (error) {
      console.error('Error using template:', error);
      return '';
    }
  }

  // Utility Functions
  async getFileUrl(storagePath: string): Promise<string | null> {
    try {
      const { data } = supabase.storage
        .from('message-media')
        .getPublicUrl(storagePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  }

  async deleteFile(storagePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('message-media')
        .remove([storagePath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  getSupportedMimeTypes(): string[] {
    const types = [
      'audio/webm;codecs=opus',
      'audio/mp4',
      'video/webm;codecs=vp9,opus',
      'video/mp4'
    ];

    return types.filter(type => MediaRecorder.isTypeSupported(type));
  }
}