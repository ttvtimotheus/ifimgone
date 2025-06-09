'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  TestTube,
  Settings,
  Eye,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { EmailService } from '@/lib/email-service';
import { useToast } from '@/hooks/use-toast';

export default function TestEmailPage() {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [customEmail, setCustomEmail] = useState({
    to: '',
    subject: 'Test Email from If I\'m Gone',
    html: '<h1>Test Email</h1><p>This is a test email to verify the email service is working correctly.</p>',
    text: 'Test Email\n\nThis is a test email to verify the email service is working correctly.'
  });
  const { toast } = useToast();
  const emailService = EmailService.getInstance();

  const runEmailTest = async () => {
    setLoading(true);
    setTestResults(null);

    try {
      console.log('🧪 Starting email service test...');
      
      const result = await emailService.testEmailService();
      
      console.log('📊 Test result:', result);
      setTestResults(result);

      if (result.success) {
        toast({
          title: 'Test Successful',
          description: 'Email service is working correctly',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.message,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('💥 Test error:', error);
      setTestResults({
        success: false,
        message: 'Test encountered an unexpected error',
        details: error
      });
      
      toast({
        title: 'Test Error',
        description: 'An unexpected error occurred during testing',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!customEmail.to || !customEmail.subject) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in recipient email and subject',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      console.log('📧 Sending custom test email...');
      
      const success = await emailService.sendCustomEmail(customEmail);
      
      if (success) {
        toast({
          title: 'Email Sent',
          description: `Test email sent to ${customEmail.to}`,
          variant: 'default'
        });
      } else {
        toast({
          title: 'Send Failed',
          description: 'Failed to send test email',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('💥 Send error:', error);
      toast({
        title: 'Send Error',
        description: 'An error occurred while sending the email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
              <TestTube className="w-8 h-8 mr-3 text-amber-500" />
              Email Service Testing
            </h1>
            <p className="text-slate-400">Test and debug the email delivery system</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Quick Test */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Quick Service Test
                </CardTitle>
                <CardDescription>
                  Test if the email service is properly configured and working
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-amber-500/50 bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-amber-300">
                    This will test the email service configuration without sending an actual email.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={runEmailTest}
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      Run Email Test
                    </>
                  )}
                </Button>

                {testResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <Separator className="bg-slate-700" />
                    
                    <div className="flex items-center space-x-2">
                      {testResults.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      )}
                      <Badge 
                        variant="outline" 
                        className={testResults.success 
                          ? 'border-green-500 text-green-400'
                          : 'border-red-500 text-red-400'
                        }
                      >
                        {testResults.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-lg">
                      <h4 className="text-white font-medium mb-2">Test Result</h4>
                      <p className="text-slate-300 text-sm mb-3">{testResults.message}</p>
                      
                      {testResults.details && (
                        <details className="text-xs">
                          <summary className="text-slate-400 cursor-pointer hover:text-white">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-900 rounded text-slate-300 overflow-auto">
                            {JSON.stringify(testResults.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Custom Email Test */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Send Test Email
                </CardTitle>
                <CardDescription>
                  Send a real test email to verify delivery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-email" className="text-slate-300">Recipient Email</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="your@email.com"
                    value={customEmail.to}
                    onChange={(e) => setCustomEmail(prev => ({ ...prev, to: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="test-subject" className="text-slate-300">Subject</Label>
                  <Input
                    id="test-subject"
                    placeholder="Test email subject"
                    value={customEmail.subject}
                    onChange={(e) => setCustomEmail(prev => ({ ...prev, subject: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="test-html" className="text-slate-300">HTML Content</Label>
                  <Textarea
                    id="test-html"
                    placeholder="HTML email content"
                    value={customEmail.html}
                    onChange={(e) => setCustomEmail(prev => ({ ...prev, html: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="test-text" className="text-slate-300">Plain Text Content</Label>
                  <Textarea
                    id="test-text"
                    placeholder="Plain text email content"
                    value={customEmail.text}
                    onChange={(e) => setCustomEmail(prev => ({ ...prev, text: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={sendCustomEmail}
                  disabled={loading || !customEmail.to || !customEmail.subject}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Test Email
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Debugging Information */}
          <Card className="border-slate-800 bg-slate-900/50 mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Debugging Information
              </CardTitle>
              <CardDescription>
                Check these items if emails are not being sent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Environment Variables</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">NEXT_PUBLIC_SUPABASE_URL:</span>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">NEXT_PUBLIC_APP_URL:</span>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {process.env.NEXT_PUBLIC_APP_URL ? 'Set' : 'Missing'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-white font-medium">Required Setup</h4>
                  <div className="space-y-2 text-sm text-slate-300">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      Edge functions deployed
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                      RESEND_API_KEY set in Supabase
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                      Domain verified in Resend
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              <div className="bg-slate-800 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Common Issues</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• RESEND_API_KEY not set in Supabase Edge Functions environment</li>
                  <li>• Domain not verified in Resend dashboard</li>
                  <li>• Edge functions not deployed or outdated</li>
                  <li>• CORS issues with edge function calls</li>
                  <li>• Invalid email addresses or formatting</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}