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
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  public static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  // Recording Functions
  async startAudioRecording(messageId: string): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Create recording session in database
      const { data: sessionId, error } = await supabase
        .rpc('start_recording_session', {
          p_message_id: messageId,
          p_session_type: 'audio',
          p_quality_settings: {
            sampleRate: 44100,
            echoCancellation: true,
            noiseSuppression: true
          }
        });

      if (error) throw error;

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      return sessionId;
    } catch (error) {
      console.error('Error starting audio recording:', error);
      return null;
    }
  }

  async startVideoRecording(messageId: string): Promise<string | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Create recording session in database
      const { data: sessionId, error } = await supabase
        .rpc('start_recording_session', {
          p_message_id: messageId,
          p_session_type: 'video',
          p_quality_settings: {
            width: 1280,
            height: 720,
            frameRate: 30,
            echoCancellation: true,
            noiseSuppression: true
          }
        });

      if (error) throw error;

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000);
      return sessionId;
    } catch (error) {
      console.error('Error starting video recording:', error);
      return null;
    }
  }

  async stopRecording(sessionId: string): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm'
        });

        // Upload the recording
        const uploadResult = await this.uploadRecording(sessionId, blob);
        
        if (uploadResult) {
          // Complete the recording session
          await supabase.rpc('complete_recording_session', {
            p_session_id: sessionId,
            p_duration: Math.floor(blob.size / 16000), // Rough estimate
            p_file_size: blob.size,
            p_storage_path: uploadResult.path
          });
        }

        // Stop all tracks
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }

        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  private async uploadRecording(sessionId: string, blob: Blob): Promise<{ path: string } | null> {
    try {
      const fileName = `recording_${sessionId}_${Date.now()}.webm`;
      const filePath = `recordings/${fileName}`;

      const { error } = await supabase.storage
        .from('message-media')
        .upload(filePath, blob);

      if (error) throw error;

      return { path: filePath };
    } catch (error) {
      console.error('Error uploading recording:', error);
      return null;
    }
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
        .upload(filePath, file, {
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

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
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