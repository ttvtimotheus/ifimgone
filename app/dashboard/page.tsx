'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Settings, Heart, Clock, Shield, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// Define types for our data
type Message = {
  id: string;
  title: string;
  content: string;
  status: string;
  trigger_type: string;
  trigger_date?: string;
  created_at: string;
  updated_at: string;
  recipient?: {
    name: string;
    email: string;
    relationship: string;
  };
};

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [trustedContacts, setTrustedContacts] = useState(0);
  
  // Fetch messages from Supabase
  useEffect(() => {
    async function fetchMessages() {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', user.id);
          
        if (messagesError) throw messagesError;
        
        // Fetch recipients for each message
        const messagesWithRecipients = await Promise.all(
          messagesData.map(async (message) => {
            const { data: recipientData, error: recipientError } = await supabase
              .from('message_recipients')
              .select('recipient_id')
              .eq('message_id', message.id)
              .single();
              
            if (recipientError) return message;
            
            const { data: recipient, error: recipientDetailsError } = await supabase
              .from('recipients')
              .select('*')
              .eq('id', recipientData.recipient_id)
              .single();
              
            if (recipientDetailsError) return message;
            
            return {
              ...message,
              recipient
            };
          })
        );
        
        setMessages(messagesWithRecipients);
        
        // Fetch trusted contacts count
        const { count, error: contactsError } = await supabase
          .from('trusted_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (!contactsError) {
          setTrustedContacts(count || 0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your messages',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchMessages();
  }, [user, toast]);

  const stats = {
    totalMessages: messages.length,
    activeMessages: messages.filter(m => m.status === 'draft').length,
    trustedContacts: trustedContacts,
    lastActivity: user?.user_metadata?.last_sign_in_at 
      ? new Date(user.user_metadata.last_sign_in_at).toLocaleDateString() 
      : new Date().toLocaleDateString()
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        
        <div className="container mx-auto px-4 py-8 pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Your Digital Legacy</h1>
                <p className="text-slate-400">Manage your final messages and privacy settings</p>
              </div>
              
              <Link href="/create-message">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold mt-4 md:mt-0">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Message
                </Button>
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Messages</p>
                      <p className="text-2xl font-bold text-white">{stats.totalMessages}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Active</p>
                      <p className="text-2xl font-bold text-white">{stats.activeMessages}</p>
                    </div>
                    <Shield className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Trusted Contacts</p>
                      <p className="text-2xl font-bold text-white">{stats.trustedContacts}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Last Active</p>
                      <p className="text-sm font-medium text-white">Today</p>
                    </div>
                    <Clock className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages List */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-white">Your Messages</h2>
              
              {loading ? (
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="w-8 h-8 text-amber-500 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-400">Loading your messages...</p>
                  </CardContent>
                </Card>
              ) : messages.length === 0 ? (
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No messages yet</h3>
                    <p className="text-slate-400 mb-6">Create your first message to begin your digital legacy</p>
                    <Link href="/create-message">
                      <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Message
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <Card className="border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-white">{message.title}</h3>
                                <Badge 
                                  variant="secondary" 
                                  className="bg-amber-500/20 text-amber-400 border-amber-500/30"
                                >
                                  {message.content.length > 100 ? 'text' : 'note'}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="border-green-500/30 text-green-400"
                                >
                                  {message.status}
                                </Badge>
                              </div>
                              <p className="text-slate-400 mb-2">For: {message.recipient?.name || 'Unknown Recipient'}</p>
                              <p className="text-sm text-slate-500">
                                Trigger: {message.trigger_type} {message.trigger_date ? `- ${message.trigger_date}` : ''}
                              </p>
                              <p className="text-xs text-slate-600 mt-1">
                                Created: {new Date(message.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="text-slate-400">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}