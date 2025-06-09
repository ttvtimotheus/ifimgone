'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  Video, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Download,
  Volume2,
  VolumeX,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MediaRecorderComponentProps {
  messageId: string;
  onRecordingComplete?: (blob: Blob, type: 'audio' | 'video') => void;
  maxDuration?: number; // in seconds
}

export function MediaRecorder({ messageId, onRecordingComplete, maxDuration = 300 }: MediaRecorderComponentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorderInstance, setMediaRecorderInstance] = useState<globalThis.MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [supportedMimeTypes, setSupportedMimeTypes] = useState<string[]>([]);
  const [hasPermissions, setHasPermissions] = useState<{audio: boolean, video: boolean}>({
    audio: false,
    video: false
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkBrowserSupport();
    checkPermissions();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkBrowserSupport = () => {
    // Check if MediaRecorder is available
    if (typeof window === 'undefined' || typeof globalThis.MediaRecorder === 'undefined') {
      console.warn('MediaRecorder not available');
      return;
    }

    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
      'video/ogg'
    ];

    const supported = types.filter(type => {
      try {
        return globalThis.MediaRecorder.isTypeSupported && globalThis.MediaRecorder.isTypeSupported(type);
      } catch (error) {
        console.warn('Error checking MIME type support:', type, error);
        return false;
      }
    });

    setSupportedMimeTypes(supported);
    console.log('Supported MIME types:', supported);
  };

  const checkPermissions = async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      console.warn('MediaDevices not available');
      return;
    }

    try {
      // Check audio permission
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermissions(prev => ({ ...prev, audio: true }));
        audioStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.log('Audio permission not granted or not available');
      }

      // Check video permission
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasPermissions(prev => ({ ...prev, video: true }));
        videoStream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.log('Video permission not granted or not available');
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const getBestMimeType = (type: 'audio' | 'video'): string => {
    if (type === 'audio') {
      const audioTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      for (const mimeType of audioTypes) {
        if (supportedMimeTypes.includes(mimeType)) {
          return mimeType;
        }
      }
      return 'audio/webm'; // Fallback
    } else {
      const videoTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4'
      ];
      
      for (const mimeType of videoTypes) {
        if (supportedMimeTypes.includes(mimeType)) {
          return mimeType;
        }
      }
      return 'video/webm'; // Fallback
    }
  };

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      // Check if MediaRecorder is available
      if (typeof globalThis.MediaRecorder === 'undefined') {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      setRecordingType(type);
      setDuration(0);
      setRecordedBlob(null);
      setRecordedChunks([]);

      let mediaStream: MediaStream;

      if (type === 'audio') {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
      } else {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });

        // Show video preview
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.muted = true; // Prevent feedback
          try {
            await videoRef.current.play();
          } catch (playError) {
            console.warn('Could not start video preview:', playError);
          }
        }
      }

      setStream(mediaStream);

      // Get the best supported MIME type
      const mimeType = getBestMimeType(type);
      console.log('Using MIME type:', mimeType);

      // Create MediaRecorder with fallback options
      let recorder: globalThis.MediaRecorder;
      try {
        // Check if the MIME type is supported
        if (globalThis.MediaRecorder.isTypeSupported && globalThis.MediaRecorder.isTypeSupported(mimeType)) {
          recorder = new globalThis.MediaRecorder(mediaStream, { mimeType });
        } else {
          recorder = new globalThis.MediaRecorder(mediaStream);
        }
      } catch (error) {
        console.warn('Failed to create MediaRecorder with MIME type, using default:', error);
        recorder = new globalThis.MediaRecorder(mediaStream);
      }

      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        const finalMimeType = recorder.mimeType || (type === 'audio' ? 'audio/webm' : 'video/webm');
        const blob = new Blob(chunks, { type: finalMimeType });
        
        console.log('Recording stopped. Blob size:', blob.size, 'MIME type:', finalMimeType);
        
        setRecordedBlob(blob);
        onRecordingComplete?.(blob, type);
        
        // Stop video preview
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // Stop all tracks
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: 'Recording Error',
          description: 'An error occurred during recording',
          variant: 'destructive'
        });
      };

      setMediaRecorderInstance(recorder);
      
      try {
        recorder.start(1000); // Collect data every second
        setIsRecording(true);

        // Start duration timer
        intervalRef.current = setInterval(() => {
          setDuration(prev => {
            const newDuration = prev + 1;
            if (newDuration >= maxDuration) {
              stopRecording();
            }
            return newDuration;
          });
        }, 1000);

        toast({
          title: 'Recording Started',
          description: `${type === 'audio' ? 'Audio' : 'Video'} recording has begun`,
          variant: 'default'
        });
      } catch (startError) {
        console.error('Error starting recording:', startError);
        throw startError;
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Failed to start recording. ';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please allow microphone and camera access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No microphone or camera found. Please check your devices.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Recording is not supported in this browser.';
        } else if (error.name === 'NotReadableError') {
          errorMessage += 'Your microphone or camera is already in use by another application.';
        } else {
          errorMessage += error.message;
        }
      }
      
      toast({
        title: 'Recording Error',
        description: errorMessage,
        variant: 'destructive'
      });

      // Cleanup on error
      setIsRecording(false);
      setRecordingType(null);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderInstance || !isRecording) return;

    setIsRecording(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      if (mediaRecorderInstance.state === 'recording') {
        mediaRecorderInstance.stop();
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
    
    setMediaRecorderInstance(null);

    toast({
      title: 'Recording Complete',
      description: 'Your recording has been saved successfully',
      variant: 'default'
    });
  };

  const playRecording = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    
    if (recordingType === 'audio') {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          toast({
            title: 'Playback Error',
            description: 'Could not play the audio recording',
            variant: 'destructive'
          });
        });
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
      }
    } else {
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.muted = false; // Allow sound for playback
        videoRef.current.play().catch(error => {
          console.error('Error playing video:', error);
          toast({
            title: 'Playback Error',
            description: 'Could not play the video recording',
            variant: 'destructive'
          });
        });
        setIsPlaying(true);
        
        videoRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
      }
    }
  };

  const pausePlayback = () => {
    if (recordingType === 'audio' && audioRef.current) {
      audioRef.current.pause();
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    
    // Determine file extension based on MIME type
    const mimeType = recordedBlob.type;
    let extension = 'webm';
    if (mimeType.includes('mp4')) extension = 'mp4';
    else if (mimeType.includes('ogg')) extension = 'ogg';
    
    a.download = `recording_${Date.now()}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Download Started',
      description: 'Your recording is being downloaded',
      variant: 'default'
    });
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    setDuration(0);
    setIsPlaying(false);
    setRecordingType(null);
    setRecordedChunks([]);
    
    if (audioRef.current) audioRef.current.src = '';
    if (videoRef.current) videoRef.current.src = '';

    toast({
      title: 'Recording Deleted',
      description: 'The recording has been removed',
      variant: 'default'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (duration / maxDuration) * 100;

  // Check if MediaRecorder is supported
  const isMediaRecorderSupported = typeof window !== 'undefined' && typeof globalThis.MediaRecorder !== 'undefined';

  if (!isMediaRecorderSupported) {
    return (
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Recording Not Supported</h3>
          <p className="text-slate-400">
            Your browser doesn't support media recording. Please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Record Message</span>
          <Badge variant="outline" className="border-slate-600 text-slate-300">
            {formatDuration(duration)} / {formatDuration(maxDuration)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Support Info */}
        {supportedMimeTypes.length === 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <p className="text-yellow-300 text-sm">
                Limited recording support detected. Some features may not work properly.
              </p>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        {!isRecording && !recordedBlob && (
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => startRecording('audio')}
              disabled={!hasPermissions.audio && supportedMimeTypes.length === 0}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold disabled:opacity-50"
            >
              <Mic className="w-4 h-4 mr-2" />
              Record Audio
            </Button>
            <Button
              onClick={() => startRecording('video')}
              disabled={!hasPermissions.video && supportedMimeTypes.length === 0}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold disabled:opacity-50"
            >
              <Video className="w-4 h-4 mr-2" />
              Record Video
            </Button>
          </div>
        )}

        {/* Recording in Progress */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">
                Recording {recordingType === 'audio' ? 'Audio' : 'Video'}...
              </span>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <Button
              onClick={stopRecording}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop Recording
            </Button>
          </motion.div>
        )}

        {/* Video Preview/Playback */}
        {((isRecording && recordingType === 'video') || (recordedBlob && recordingType === 'video')) && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              muted={isMuted || isRecording}
              controls={!isRecording && recordedBlob}
              playsInline
              autoPlay={isRecording}
            />
            {isRecording && (
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMuted(!isMuted)}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              </div>
            )}
            {!isRecording && recordedBlob && (
              <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPlaying ? pausePlayback : playRecording}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Audio Player */}
        {recordedBlob && recordingType === 'audio' && (
          <div className="bg-slate-800 p-4 rounded-lg">
            <audio ref={audioRef} className="hidden" />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPlaying ? pausePlayback : playRecording}
                  className="text-white hover:bg-slate-700"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <span className="text-slate-300 text-sm">Audio Recording</span>
              </div>
              <Badge variant="outline" className="border-slate-600 text-slate-300">
                {formatDuration(duration)}
              </Badge>
            </div>
          </div>
        )}

        {/* Recording Actions */}
        {recordedBlob && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 justify-center"
          >
            <Button
              variant="outline"
              onClick={downloadRecording}
              className="border-slate-600 text-slate-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={deleteRecording}
              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              onClick={() => startRecording(recordingType!)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
            >
              Record Again
            </Button>
          </motion.div>
        )}

        {/* Recording Info */}
        <div className="text-xs text-slate-500 text-center space-y-1">
          <p>Maximum recording duration: {formatDuration(maxDuration)}</p>
          {supportedMimeTypes.length > 0 && (
            <p>Supported formats: {supportedMimeTypes.slice(0, 2).join(', ')}</p>
          )}
          <p>Make sure to allow microphone and camera permissions when prompted</p>
        </div>
      </CardContent>
    </Card>
  );
}