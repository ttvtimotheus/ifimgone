'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight, Shield, Clock, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

const onboardingSlides = [
  {
    id: 1,
    title: "If you're reading this...",
    subtitle: "Love transcends time, and some words deserve to live forever.",
    icon: Heart,
    gradient: "from-amber-500/20 to-red-500/20"
  },
  {
    id: 2,
    title: "Your final messages,",
    subtitle: "Delivered when it matters most. Secured with care.",
    icon: Shield,
    gradient: "from-blue-500/20 to-purple-500/20"
  },
  {
    id: 3,
    title: "Time may pass,",
    subtitle: "But your voice will always be heard by those who need it.",
    icon: Clock,
    gradient: "from-green-500/20 to-teal-500/20"
  },
  {
    id: 4,
    title: "Begin your legacy",
    subtitle: "Create messages of love, wisdom, and remembrance.",
    icon: MessageCircle,
    gradient: "from-purple-500/20 to-pink-500/20",
    isLast: true
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) return; // Skip onboarding if user is already authenticated
    
    const timer = setInterval(() => {
      setCurrentSlide(prev => {
        if (prev < onboardingSlides.length - 1) {
          return prev + 1;
        } else {
          setShowCTA(true);
          clearInterval(timer);
          return prev;
        }
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse">
          <Heart className="w-8 h-8 text-amber-500" />
        </div>
      </div>
    );
  }

  if (user) {
    // Redirect authenticated users to dashboard
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      
      {/* Animated background particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-500/30 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div 
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${onboardingSlides[currentSlide].gradient} mb-8 border border-white/10`}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {React.createElement(onboardingSlides[currentSlide].icon, {
                className: "w-12 h-12 text-white"
              })}
            </motion.div>

            <motion.h1 
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {onboardingSlides[currentSlide].title}
            </motion.h1>

            <motion.p 
              className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              {onboardingSlides[currentSlide].subtitle}
            </motion.p>

            {showCTA && onboardingSlides[currentSlide].isLast && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
                className="space-y-6"
              >
                <Link href="/auth">
                  <Button 
                    size="lg" 
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-8 py-4 rounded-full text-lg group transition-all duration-300 hover:scale-105"
                  >
                    Begin Your Legacy
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                
                <p className="text-sm text-slate-400">
                  Create your first message in minutes
                </p>
              </motion.div>
            )}

            {/* Progress indicator */}
            {!showCTA && (
              <div className="flex justify-center space-x-2 mt-16">
                {onboardingSlides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentSlide ? 'bg-amber-500 w-8' : 'bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}