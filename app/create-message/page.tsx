'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, ArrowRight, Heart, MessageSquare, Mic, Video, Image, Clock, Shield, Eye, Upload, FileText } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { MediaRecorder } from '@/components/media-recorder';
import { FileUploader } from '@/components/file-uploader';
import { MessageTemplates } from '@/components/message-templates';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const steps = [
  { id: 'recipient', title: 'Choose Recipient', icon: Heart },
  { id: 'format', title: 'Message Format', icon: MessageSquare },
  { id: 'content', title: 'Create Content', icon: MessageSquare },
  { id: 'trigger', title: 'Delivery Settings', icon: Clock },
  { id: 'security', title: 'Security & Privacy', icon: Shield },
  { id: 'preview', title: 'Preview & Save', icon: Eye },
];

const messageFormats = [
  { id: 'text', title: 'Text Message', description: 'Write a heartfelt letter', icon: MessageSquare },
  { id: 'audio', title: 'Voice Recording', description: 'Record your voice', icon: Mic },
  { id: 'video', title: 'Video Message', description: 'Record a video message', icon: Video },
  { id: 'mixed', title: 'Rich Content', description: 'Combine text, media, and files', icon: Image },
];

const triggerTypes = [
  { id: 'inactivity', title: 'Inactivity Period', description: 'After no activity for a set time' },
  { id: 'manual', title: 'Trusted Contact', description: 'Released by a trusted person' },
  { id: 'date', title: 'Specific Date', description: 'Delivered on a particular date' },
];

export default function CreateMessage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientEmail: '',
    relationship: '',
    format: '',
    title: '',
    content: '',
    triggerType: '',
    triggerValue: '',
    hasPin: false,
    pin: '',
    attachments: [] as string[],
    recordingBlob: null as Blob | null,
    recordingPath: null as string | null,
    contentType: 'text' as string,
  });

  const currentStepId = steps[currentStep].id;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | Blob | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateSelect = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleFileUploaded = (file: File, uploadPath: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, uploadPath]
    }));
    
    toast({
      title: 'File Uploaded',
      description: `${file.name} has been added to your message`,
      variant: 'default'
    });
  };

  const handleRecordingComplete = (blob: Blob, type: 'audio' | 'video', storagePath?: string) => {
    setFormData(prev => ({
      ...prev,
      recordingBlob: blob,
      recordingPath: storagePath || null,
      contentType: type
    }));

    if (storagePath) {
      toast({
        title: 'Recording Saved',
        description: `Your ${type} recording has been saved to the message`,
        variant: 'default'
      });
    }
  };

  const saveMessage = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save a message',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Save the recipient
      const { data: recipientData, error: recipientError } = await supabase
        .from('recipients')
        .insert({
          name: formData.recipientName,
          email: formData.recipientEmail,
          relationship: formData.relationship,
          user_id: user.id
        })
        .select()
        .single();

      if (recipientError) throw recipientError;

      // 2. Save the message
      const triggerSettings: {
        trigger_type?: 'inactivity' | 'date' | 'manual' | 'location';
        trigger_date?: string;
        content_type?: string;
        media_duration?: number;
      } = {};
      
      if (formData.triggerType === 'inactivity') {
        triggerSettings.trigger_type = 'inactivity';
      } else if (formData.triggerType === 'date') {
        triggerSettings.trigger_type = 'date';
        triggerSettings.trigger_date = formData.triggerValue;
      } else if (formData.triggerType === 'manual') {
        triggerSettings.trigger_type = 'manual';
      }

      // Set content type based on format
      if (formData.format === 'audio' || formData.format === 'video') {
        triggerSettings.content_type = formData.format;
      } else if (formData.format === 'mixed') {
        triggerSettings.content_type = 'rich';
      } else {
        triggerSettings.content_type = 'text';
      }

      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          title: formData.title,
          content: formData.content,
          status: 'draft',
          pin_hash: formData.hasPin && formData.pin ? await hashPin(formData.pin) : null,
          ...triggerSettings
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // 3. Link message and recipient
      const { error: linkError } = await supabase
        .from('message_recipients')
        .insert({
          message_id: messageData.id,
          recipient_id: recipientData.id
        });

      if (linkError) throw linkError;

      // 4. Handle attachments if any (they should already be uploaded)
      if (formData.attachments.length > 0) {
        // Update attachment records to link them to the message
        const { error: attachmentUpdateError } = await supabase
          .from('attachments')
          .update({ message_id: messageData.id })
          .in('storage_path', formData.attachments);

        if (attachmentUpdateError) {
          console.error('Error updating attachment records:', attachmentUpdateError);
        }
      }

      // 5. Handle recording if saved
      if (formData.recordingPath) {
        // Update the recording attachment to link it to the message
        const { error: recordingUpdateError } = await supabase
          .from('attachments')
          .update({ message_id: messageData.id })
          .eq('storage_path', formData.recordingPath);

        if (recordingUpdateError) {
          console.error('Error updating recording attachment:', recordingUpdateError);
        }
      }

      // 6. Log the message creation
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action: 'message_created',
          details: {
            message_id: messageData.id,
            recipient_id: recipientData.id,
            format: formData.format,
            has_attachments: formData.attachments.length > 0,
            has_recording: !!formData.recordingPath,
            trigger_type: formData.triggerType
          }
        });

      toast({
        title: 'Success',
        description: 'Your message has been saved successfully',
        variant: 'default'
      });

      // Navigate to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hashPin = async (pin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const canProceed = () => {
    switch (currentStepId) {
      case 'recipient':
        return formData.recipientName && formData.recipientEmail && formData.relationship;
      case 'format':
        return formData.format;
      case 'content':
        return formData.title && (
          formData.content || 
          formData.recordingPath || 
          formData.attachments.length > 0
        );
      case 'trigger':
        return formData.triggerType && formData.triggerValue;
      case 'security':
        return true; // Optional step
      default:
        return true;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 pt-20 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-white">Create New Message</h1>
                <p className="text-slate-400">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-between mb-12">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    index <= currentStep 
                      ? 'bg-amber-500 border-amber-500 text-slate-950' 
                      : 'border-slate-600 text-slate-600'
                  }`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block w-16 h-0.5 mx-4 transition-all ${
                      index < currentStep ? 'bg-amber-500' : 'bg-slate-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <Card className="border-slate-800 bg-slate-900/50 mb-8">
              <CardHeader>
                <CardTitle className="text-white">{steps[currentStep].title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Recipient Step */}
                    {currentStepId === 'recipient' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="recipientName" className="text-slate-300">Recipient Name</Label>
                          <Input
                            id="recipientName"
                            placeholder="Who is this message for?"
                            value={formData.recipientName}
                            onChange={(e) => handleInputChange('recipientName', e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="recipientEmail" className="text-slate-300">Recipient Email</Label>
                          <Input
                            id="recipientEmail"
                            type="email"
                            placeholder="their@email.com"
                            value={formData.recipientEmail}
                            onChange={(e) => handleInputChange('recipientEmail', e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="relationship" className="text-slate-300">Relationship</Label>
                          <Select value={formData.relationship} onValueChange={(value) => handleInputChange('relationship', value)}>
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                              <SelectValue placeholder="Select your relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="spouse">Spouse/Partner</SelectItem>
                              <SelectItem value="child">Child</SelectItem>
                              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="sibling">Sibling</SelectItem>
                              <SelectItem value="friend">Friend</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Format Step */}
                    {currentStepId === 'format' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {messageFormats.map((format) => (
                          <Card 
                            key={format.id}
                            className={`cursor-pointer transition-all border-2 ${
                              formData.format === format.id 
                                ? 'border-amber-500 bg-amber-500/10' 
                                : 'border-slate-700 hover:border-slate-600'
                            }`}
                            onClick={() => handleInputChange('format', format.id)}
                          >
                            <CardContent className="p-6 text-center">
                              <format.icon className={`w-12 h-12 mx-auto mb-4 ${
                                formData.format === format.id ? 'text-amber-500' : 'text-slate-400'
                              }`} />
                              <h3 className="text-lg font-semibold text-white mb-2">{format.title}</h3>
                              <p className="text-slate-400 text-sm">{format.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Content Step */}
                    {currentStepId === 'content' && (
                      <div className="space-y-6">
                        <div>
                          <Label htmlFor="title" className="text-slate-300">Message Title</Label>
                          <Input
                            id="title"
                            placeholder="Give your message a meaningful title"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                          />
                        </div>

                        {/* Content based on format */}
                        {formData.format === 'text' && (
                          <Tabs defaultValue="write" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                              <TabsTrigger value="write" className="text-slate-300">Write Message</TabsTrigger>
                              <TabsTrigger value="template" className="text-slate-300">Use Template</TabsTrigger>
                            </TabsList>
                            <TabsContent value="write" className="space-y-4">
                              <div>
                                <Label htmlFor="content" className="text-slate-300">Your Message</Label>
                                <Textarea
                                  id="content"
                                  placeholder="Write your heartfelt message here..."
                                  value={formData.content}
                                  onChange={(e) => handleInputChange('content', e.target.value)}
                                  className="bg-slate-800 border-slate-700 text-white min-h-32"
                                  rows={8}
                                />
                              </div>
                            </TabsContent>
                            <TabsContent value="template">
                              <MessageTemplates onTemplateSelect={handleTemplateSelect} />
                            </TabsContent>
                          </Tabs>
                        )}

                        {(formData.format === 'audio' || formData.format === 'video') && (
                          <div className="space-y-4">
                            <MediaRecorder 
                              messageId="temp"
                              onRecordingComplete={handleRecordingComplete}
                              maxDuration={600} // 10 minutes
                            />
                            <div>
                              <Label htmlFor="content" className="text-slate-300">Additional Notes (Optional)</Label>
                              <Textarea
                                id="content"
                                placeholder="Add any additional text to accompany your recording..."
                                value={formData.content}
                                onChange={(e) => handleInputChange('content', e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                                rows={4}
                              />
                            </div>
                          </div>
                        )}

                        {formData.format === 'mixed' && (
                          <Tabs defaultValue="text" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-slate-800">
                              <TabsTrigger value="text" className="text-slate-300">
                                <FileText className="w-4 h-4 mr-1" />
                                Text
                              </TabsTrigger>
                              <TabsTrigger value="template" className="text-slate-300">
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Template
                              </TabsTrigger>
                              <TabsTrigger value="record" className="text-slate-300">
                                <Mic className="w-4 h-4 mr-1" />
                                Record
                              </TabsTrigger>
                              <TabsTrigger value="files" className="text-slate-300">
                                <Upload className="w-4 h-4 mr-1" />
                                Files
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="text" className="space-y-4">
                              <div>
                                <Label htmlFor="content" className="text-slate-300">Your Message</Label>
                                <Textarea
                                  id="content"
                                  placeholder="Write your heartfelt message here..."
                                  value={formData.content}
                                  onChange={(e) => handleInputChange('content', e.target.value)}
                                  className="bg-slate-800 border-slate-700 text-white min-h-32"
                                  rows={8}
                                />
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="template">
                              <MessageTemplates onTemplateSelect={handleTemplateSelect} />
                            </TabsContent>
                            
                            <TabsContent value="record">
                              <MediaRecorder 
                                messageId="temp"
                                onRecordingComplete={handleRecordingComplete}
                                maxDuration={600}
                              />
                            </TabsContent>
                            
                            <TabsContent value="files">
                              <FileUploader 
                                messageId="temp"
                                onFileUploaded={handleFileUploaded}
                                maxFileSize={100 * 1024 * 1024} // 100MB
                              />
                            </TabsContent>
                          </Tabs>
                        )}
                      </div>
                    )}

                    {/* Trigger Step */}
                    {currentStepId === 'trigger' && (
                      <div className="space-y-6">
                        <div>
                          <Label className="text-slate-300 text-lg">How should this message be delivered?</Label>
                          <div className="grid gap-4 mt-4">
                            {triggerTypes.map((trigger) => (
                              <Card 
                                key={trigger.id}
                                className={`cursor-pointer transition-all border-2 ${
                                  formData.triggerType === trigger.id 
                                    ? 'border-amber-500 bg-amber-500/10' 
                                    : 'border-slate-700 hover:border-slate-600'
                                }`}
                                onClick={() => handleInputChange('triggerType', trigger.id)}
                              >
                                <CardContent className="p-4">
                                  <h3 className="text-white font-semibold">{trigger.title}</h3>
                                  <p className="text-slate-400 text-sm">{trigger.description}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                        
                        {formData.triggerType && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                          >
                            <Label htmlFor="triggerValue" className="text-slate-300">
                              {formData.triggerType === 'inactivity' && 'Inactivity Period'}
                              {formData.triggerType === 'manual' && 'Trusted Contact Email'}
                              {formData.triggerType === 'date' && 'Delivery Date'}
                            </Label>
                            <Input
                              id="triggerValue"
                              placeholder={
                                formData.triggerType === 'inactivity' ? '6 months' :
                                formData.triggerType === 'manual' ? 'trusted@email.com' :
                                '2025-12-25'
                              }
                              type={formData.triggerType === 'date' ? 'date' : 'text'}
                              value={formData.triggerValue}
                              onChange={(e) => handleInputChange('triggerValue', e.target.value)}
                              className="bg-slate-800 border-slate-700 text-white"
                            />
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* Security Step */}
                    {currentStepId === 'security' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Additional Security</h3>
                          <Card className="border-slate-700">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-white font-medium">PIN Protection</h4>
                                  <p className="text-slate-400 text-sm">Add an extra layer of security</p>
                                </div>
                                <Button
                                  variant={formData.hasPin ? "default" : "outline"}
                                  onClick={() => handleInputChange('hasPin', !formData.hasPin)}
                                  className={formData.hasPin ? "bg-amber-500 text-slate-950" : ""}
                                >
                                  {formData.hasPin ? 'Enabled' : 'Enable'}
                                </Button>
                              </div>
                              {formData.hasPin && (
                                <div className="mt-4">
                                  <Input
                                    placeholder="Enter 4-digit PIN"
                                    type="password"
                                    maxLength={4}
                                    value={formData.pin}
                                    onChange={(e) => handleInputChange('pin', e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white"
                                  />
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    )}

                    {/* Preview Step */}
                    {currentStepId === 'preview' && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-white">Message Preview</h3>
                        <Card className="border-slate-700">
                          <CardContent className="p-6">
                            <h4 className="text-xl font-semibold text-white mb-2">{formData.title}</h4>
                            <p className="text-slate-400 mb-4">For: {formData.recipientName} ({formData.relationship})</p>
                            
                            {formData.content && (
                              <div className="bg-slate-800 p-4 rounded-lg mb-4">
                                <p className="text-white whitespace-pre-wrap">{formData.content}</p>
                              </div>
                            )}
                            
                            {formData.recordingPath && (
                              <div className="bg-slate-800 p-4 rounded-lg mb-4">
                                <p className="text-white">📹 {formData.contentType === 'video' ? 'Video' : 'Audio'} recording attached</p>
                              </div>
                            )}
                            
                            {formData.attachments.length > 0 && (
                              <div className="bg-slate-800 p-4 rounded-lg mb-4">
                                <p className="text-white">📎 {formData.attachments.length} file(s) attached</p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span>Format: {formData.format}</span>
                              <span>Trigger: {formData.triggerType}</span>
                              {formData.hasPin && <span>PIN Protected</span>}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="border-slate-600 text-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                  onClick={saveMessage}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-slate-950 rounded-full border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Save Message
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}