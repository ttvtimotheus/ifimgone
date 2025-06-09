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
  Settings
} from 'lucide-react';
import { MediaService } from '@/lib/media-service';
import { useToast } from '@/hooks/use-toast';

interface MediaRecorderProps {
  messageId: string;
  onRecordingComplete?: (blob: Blob, type: 'audio' | 'video') => void;
  maxDuration?: number; // in seconds
}

export function MediaRecorder({ messageId, onRecordingComplete, maxDuration = 300 }: MediaRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaService = MediaService.getInstance();
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      setRecordingType(type);
      setDuration(0);
      setRecordedBlob(null);

      let sessionId: string | null;
      let mediaStream: MediaStream;

      if (type === 'audio') {
        sessionId = await mediaService.startAudioRecording(messageId);
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
      } else {
        sessionId = await mediaService.startVideoRecording(messageId);
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
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

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }

      if (!sessionId) {
        throw new Error('Failed to start recording session');
      }

      setCurrentSessionId(sessionId);
      setStream(mediaStream);
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
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Failed to start recording. Please check your permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = async () => {
    if (!currentSessionId) return;

    try {
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const blob = await mediaService.stopRecording(currentSessionId);
      
      if (blob) {
        setRecordedBlob(blob);
        onRecordingComplete?.(blob, recordingType!);
        
        toast({
          title: 'Recording Complete',
          description: 'Your recording has been saved successfully',
          variant: 'default'
        });
      }

      // Stop video preview
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }

      setCurrentSessionId(null);
    } catch (error) {
      console.error('Error stopping recording:', error);
      toast({
        title: 'Recording Error',
        description: 'Failed to stop recording properly',
        variant: 'destructive'
      });
    }
  };

  const playRecording = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    
    if (recordingType === 'audio') {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(url);
        };
      }
    } else {
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.play();
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
    a.download = `recording_${Date.now()}.${recordingType === 'audio' ? 'webm' : 'webm'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const deleteRecording = () => {
    setRecordedBlob(null);
    setDuration(0);
    setIsPlaying(false);
    setRecordingType(null);
    
    if (audioRef.current) audioRef.current.src = '';
    if (videoRef.current) videoRef.current.src = '';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (duration / maxDuration) * 100;

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
        {/* Recording Controls */}
        {!isRecording && !recordedBlob && (
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => startRecording('audio')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold"
            >
              <Mic className="w-4 h-4 mr-2" />
              Record Audio
            </Button>
            <Button
              onClick={() => startRecording('video')}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold"
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

        {/* Video Preview */}
        {(isRecording && recordingType === 'video') || (recordedBlob && recordingType === 'video') && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              muted={isMuted}
              controls={!isRecording && recordedBlob}
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
          <p>Supported formats: WebM (Audio/Video)</p>
        </div>
      </CardContent>
    </Card>
  );
}