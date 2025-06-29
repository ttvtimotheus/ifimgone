'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Settings, Heart, Clock, Shield, Users, Loader2, Sparkles, ArrowRight, Calendar, Send } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { ProfileCompletionWidget } from '@/components/profile-completion-widget';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
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
  const supabase = useSupabaseClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [trustedContacts, setTrustedContacts] = useState(0);
  const [showProfileWidget, setShowProfileWidget] = useState(true);

  // Optimized data fetching with a single query using joins
  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Use a single query with joins to get messages and recipients in one go
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            message_recipients!inner (recipient_id),
            recipients:message_recipients!inner(recipients(*))
          `)
          .eq('user_id', user.id);

        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
        } else {
          // Process the joined data
          const processedMessages = messagesData.map(message => {
            // Extract recipient from the nested structure
            const recipient = message.recipients?.recipients || null;
            
            // Return a clean message object
            return {
              ...message,
              recipient
            };
          });
          setMessages(processedMessages);
        }
        
        // Fetch trusted contacts count in parallel with messages
        const { count, error: contactsError } = await supabase
          .from('trusted_contacts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (!contactsError) {
          setTrustedContacts(count || 0);
        }
      } catch (error) {
        console.error('Exception during message fetch:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your messages',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user, toast, supabase]);

  // Add debounce to prevent excessive re-renders
  const debouncedMessages = useMemo(() => messages, [messages]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
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
                <motion.h1 
                  className="text-4xl font-bold text-white mb-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Your Digital Legacy
                </motion.h1>
                <motion.p 
                  className="text-slate-400 text-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Manage your final messages and preserve your memories
                </motion.p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Link href="/create-message">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold mt-4 md:mt-0 group transition-all duration-300 hover:scale-105 hover:shadow-lg">
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                    Create Message
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {/* Profile Completion Widget */}
              <div className="lg:col-span-1">
                {showProfileWidget && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <ProfileCompletionWidget 
                      onDismiss={() => setShowProfileWidget(false)}
                      showDismiss={true}
                    />
                  </motion.div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Total Messages",
                      value: stats.totalMessages,
                      icon: MessageSquare,
                      color: "text-amber-500",
                      bgColor: "from-amber-500/20 to-orange-500/20",
                      delay: 0.6
                    },
                    {
                      title: "Active",
                      value: stats.activeMessages,
                      icon: Shield,
                      color: "text-green-500",
                      bgColor: "from-green-500/20 to-emerald-500/20",
                      delay: 0.7
                    },
                    {
                      title: "Trusted Contacts",
                      value: stats.trustedContacts,
                      icon: Users,
                      color: "text-blue-500",
                      bgColor: "from-blue-500/20 to-cyan-500/20",
                      delay: 0.8
                    },
                    {
                      title: "Last Active",
                      value: "Today",
                      icon: Clock,
                      color: "text-purple-500",
                      bgColor: "from-purple-500/20 to-pink-500/20",
                      delay: 0.9
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: stat.delay }}
                    >
                      <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-300 group">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-slate-400 text-sm">{stat.title}</p>
                              <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                              <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Messages List */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                className="flex items-center justify-between"
              >
                <h2 className="text-2xl font-semibold text-white flex items-center">
                  <Heart className="w-6 h-6 mr-2 text-amber-500" />
                  Your Messages
                </h2>
                <Link href="/create-message">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 group">
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                    New Message
                  </Button>
                </Link>
              </motion.div>
              
              {loading ? (
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardContent className="p-12 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-8 h-8 text-amber-500 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-slate-400">Loading your messages...</p>
                  </CardContent>
                </Card>
              ) : messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 }}
                >
                  <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                    <CardContent className="p-12 text-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Heart className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                      </motion.div>
                      <h3 className="text-2xl font-semibold text-white mb-3">No messages yet</h3>
                      <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Create your first message to begin your digital legacy. Share your love, wisdom, and memories with those who matter most.
                      </p>
                      <Link href="/create-message">
                        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold group transition-all duration-300 hover:scale-105">
                          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                          Create Your First Message
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="grid gap-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
                    >
                      <Card className="border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-all duration-300 group backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-semibold text-white group-hover:text-amber-400 transition-colors">
                                  {message.title}
                                </h3>
                                <Badge 
                                  variant="secondary" 
                                  className="bg-amber-500/20 text-amber-400 border-amber-500/30"
                                >
                                  {message.content.length > 100 ? 'Long message' : 'Short note'}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className="border-green-500/30 text-green-400"
                                >
                                  {message.status}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <p className="text-slate-400 flex items-center">
                                  <Users className="w-4 h-4 mr-2" />
                                  For: {message.recipient?.name || 'Unknown Recipient'}
                                </p>
                                <p className="text-sm text-slate-500 flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  Trigger: {message.trigger_type} {message.trigger_date ? `- ${message.trigger_date}` : ''}
                                </p>
                                <p className="text-xs text-slate-600 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Created: {new Date(message.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white group">
                                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
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

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="mt-12"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: "Add Trusted Contact",
                    description: "Designate someone to help manage your legacy",
                    icon: Users,
                    href: "/trusted-contacts",
                    color: "from-blue-500/20 to-cyan-500/20"
                  },
                  {
                    title: "Security Settings",
                    description: "Manage your account security and privacy",
                    icon: Shield,
                    href: "/security",
                    color: "from-green-500/20 to-emerald-500/20"
                  },
                  {
                    title: "Profile Settings",
                    description: "Update your profile and preferences",
                    icon: Settings,
                    href: "/profile",
                    color: "from-purple-500/20 to-pink-500/20"
                  }
                ].map((action, index) => (
                  <Link key={action.title} href={action.href}>
                    <Card className="border-slate-800 bg-slate-900/50 hover:bg-slate-800/50 transition-all duration-300 group cursor-pointer">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <action.icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-white font-semibold mb-2 group-hover:text-amber-400 transition-colors">
                          {action.title}
                        </h4>
                        <p className="text-slate-400 text-sm">{action.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}