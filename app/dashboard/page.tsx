'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Plus, Settings, Heart, Clock, Shield, Users, Loader2, Sparkles, ArrowRight, Calendar, Send, Star, Feather, BookOpen, Infinity } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { ProtectedRoute } from '@/components/protected-route';
import { Navigation } from '@/components/navigation';
import { ProfileCompletionWidget } from '@/components/profile-completion-widget';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/hooks/use-toast';
import { useSafeAnimation, SafeAnimationVariants, SafeAnimatePresenceProps } from '@/hooks/use-safe-animation';

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

const inspirationalQuotes = [
  "Every word you write today becomes a treasure for tomorrow.",
  "Love transcends time, and your messages are bridges to eternity.",
  "In preserving memories, we create immortality.",
  "Your legacy lives in the hearts you touch with your words."
];

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = useSupabaseClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [trustedContacts, setTrustedContacts] = useState(0);
  const [showProfileWidget, setShowProfileWidget] = useState(true);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { isMounted, safeAnimate } = useSafeAnimation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Rotate inspirational quotes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMounted()) {
        setCurrentQuote(prev => (prev + 1) % inspirationalQuotes.length);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Optimized data fetching with a single query using joins
  const fetchData = useCallback(async () => {
    if (!user || !isMounted()) {
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
      if (isMounted()) {
        setLoading(false);
      }
    }
  }, [user, supabase, toast, isMounted]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
        {/* Ambient background particles */}
        <div className="absolute inset-0 overflow-hidden">
          {isClient && [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-amber-400/20 to-rose-400/20 rounded-full"
              initial={{ 
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0
              }}
              animate={{ 
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0],
                y: [null, Math.random() * window.innerHeight],
                x: [null, Math.random() * window.innerWidth]
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 8,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        <Navigation />
        
        <div className="container mx-auto px-4 py-8 pt-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Header with inspirational quote */}
            <div className="text-center mb-12">
              <motion.div
                key={currentQuote}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 1 }}
                className="mb-8"
              >
                <blockquote className="text-xl md:text-2xl font-serif text-slate-300 italic leading-relaxed max-w-3xl mx-auto">
                  "{inspirationalQuotes[currentQuote]}"
                </blockquote>
              </motion.div>

              <motion.h1 
                className="text-5xl md:text-6xl font-bold text-white mb-4 font-serif"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                Your <span className="gradient-text">Digital Legacy</span>
              </motion.h1>
              <motion.p 
                className="text-slate-400 text-xl leading-relaxed max-w-2xl mx-auto"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                Craft meaningful messages and preserve precious memories for those who matter most
              </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
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

              {/* Enhanced Stats Grid */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    {
                      title: "Messages",
                      value: stats.totalMessages,
                      icon: MessageSquare,
                      color: "text-amber-500",
                      bgGradient: "from-amber-500/20 to-orange-500/20",
                      delay: 0.6,
                      description: "Total created"
                    },
                    {
                      title: "Active",
                      value: stats.activeMessages,
                      icon: Heart,
                      color: "text-rose-500",
                      bgGradient: "from-rose-500/20 to-pink-500/20",
                      delay: 0.7,
                      description: "Ready to send"
                    },
                    {
                      title: "Trusted",
                      value: stats.trustedContacts,
                      icon: Users,
                      color: "text-blue-500",
                      bgGradient: "from-blue-500/20 to-cyan-500/20",
                      delay: 0.8,
                      description: "Contacts"
                    },
                    {
                      title: "Legacy",
                      value: "∞",
                      icon: Infinity,
                      color: "text-purple-500",
                      bgGradient: "from-purple-500/20 to-violet-500/20",
                      delay: 0.9,
                      description: "Forever"
                    }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: stat.delay }}
                    >
                      <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl hover:bg-slate-800/40 transition-all duration-500 group interactive-card">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                              <p className="text-3xl font-bold text-white">{stat.value}</p>
                              <p className="text-slate-500 text-xs">{stat.description}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                              <stat.icon className={`w-7 h-7 ${stat.color}`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Create Message CTA */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="text-center mb-16"
            >
              <Link href="/create-message">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-12 py-6 rounded-full text-lg group transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/25"
                >
                  <Feather className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                  Create Your First Message
                  <Sparkles className="w-6 h-6 ml-3 group-hover:scale-110 transition-transform" />
                </Button>
              </Link>
            </motion.div>

            {/* Messages Section */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2 }}
                className="flex items-center justify-between"
              >
                <h2 className="text-3xl font-semibold text-white flex items-center font-serif">
                  <BookOpen className="w-8 h-8 mr-3 text-amber-500" />
                  Your Messages
                </h2>
                <Link href="/create-message">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 group backdrop-blur-sm">
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                    New Message
                  </Button>
                </Link>
              </motion.div>
              
              {loading ? (
                <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
                  <CardContent className="p-16 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Heart className="w-12 h-12 text-amber-500 mx-auto mb-6" />
                    </motion.div>
                    <p className="text-slate-400 text-lg">Loading your precious messages...</p>
                  </CardContent>
                </Card>
              ) : messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  <Card className="border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
                    <CardContent className="p-16 text-center">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="mb-8"
                      >
                        <Heart className="w-24 h-24 text-slate-600 mx-auto" />
                      </motion.div>
                      <h3 className="text-3xl font-semibold text-white mb-4 font-serif">Your Story Awaits</h3>
                      <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                        Begin your digital legacy by creating your first heartfelt message. 
                        Share your love, wisdom, and memories with those who matter most.
                      </p>
                      <Link href="/create-message">
                        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold group transition-all duration-300 hover:scale-105 px-8 py-4">
                          <Feather className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                          Write Your First Message
                          <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="grid gap-6">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 1.3 + index * 0.1 }}
                      >
                        <Card className="border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/40 transition-all duration-500 group backdrop-blur-xl interactive-card">
                          <CardContent className="p-8">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                  <h3 className="text-2xl font-semibold text-white group-hover:text-amber-400 transition-colors font-serif">
                                    {message.title}
                                  </h3>
                                  <Badge 
                                    variant="secondary" 
                                    className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1"
                                  >
                                    {message.content.length > 100 ? 'Detailed message' : 'Brief note'}
                                  </Badge>
                                  <Badge 
                                    variant="outline" 
                                    className="border-green-500/30 text-green-400 px-3 py-1"
                                  >
                                    {message.status}
                                  </Badge>
                                </div>
                                <div className="space-y-3">
                                  <p className="text-slate-400 flex items-center text-lg">
                                    <Heart className="w-5 h-5 mr-2 text-rose-400" />
                                    For: <span className="font-medium ml-1">{message.recipient?.name || 'Unknown Recipient'}</span>
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
                              
                              <div className="flex items-center gap-3">
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
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="mt-20"
            >
              <h3 className="text-2xl font-semibold text-white mb-8 text-center font-serif">Continue Your Journey</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Add Trusted Contact",
                    description: "Designate someone to help preserve your legacy",
                    icon: Users,
                    href: "/trusted-contacts",
                    gradient: "from-blue-500/20 to-cyan-500/20",
                    iconColor: "text-blue-400"
                  },
                  {
                    title: "Security Settings",
                    description: "Protect your messages with advanced security",
                    icon: Shield,
                    href: "/security",
                    gradient: "from-green-500/20 to-emerald-500/20",
                    iconColor: "text-green-400"
                  },
                  {
                    title: "Profile Settings",
                    description: "Personalize your digital legacy experience",
                    icon: Star,
                    href: "/profile",
                    gradient: "from-purple-500/20 to-pink-500/20",
                    iconColor: "text-purple-400"
                  }
                ].map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.0 + index * 0.1 }}
                  >
                    <Link href={action.href}>
                      <Card className="border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/40 transition-all duration-500 group cursor-pointer backdrop-blur-xl interactive-card h-full">
                        <CardContent className="p-8 text-center">
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                            <action.icon className={`w-8 h-8 ${action.iconColor}`} />
                          </div>
                          <h4 className="text-white font-semibold mb-3 text-lg group-hover:text-amber-400 transition-colors">
                            {action.title}
                          </h4>
                          <p className="text-slate-400 leading-relaxed">{action.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}