'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight, Shield, Clock, MessageCircle, Sparkles, Users, Lock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const onboardingSlides = [
  {
    id: 1,
    title: "If you're reading this...",
    subtitle: "Love transcends time, and some words deserve to live forever.",
    icon: Heart,
    gradient: "from-rose-500/20 via-pink-500/20 to-red-500/20",
    particles: 15
  },
  {
    id: 2,
    title: "Your final messages,",
    subtitle: "Delivered when it matters most. Secured with care.",
    icon: Shield,
    gradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20",
    particles: 12
  },
  {
    id: 3,
    title: "Time may pass,",
    subtitle: "But your voice will always be heard by those who need it.",
    icon: Clock,
    gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
    particles: 18
  },
  {
    id: 4,
    title: "Begin your legacy",
    subtitle: "Create messages of love, wisdom, and remembrance.",
    icon: MessageCircle,
    gradient: "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
    particles: 20,
    isLast: true
  }
];

const features = [
  {
    icon: Heart,
    title: "Heartfelt Messages",
    description: "Create deeply personal messages for your loved ones"
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Bank-level encryption protects your most precious words"
  },
  {
    icon: Clock,
    title: "Perfect Timing",
    description: "Intelligent delivery when your messages matter most"
  },
  {
    icon: Users,
    title: "Trusted Network",
    description: "Designate trusted contacts to help manage your legacy"
  }
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
      return;
    }
    
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
    }, 4000);

    return () => clearInterval(timer);
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <Heart className="w-12 h-12 text-amber-500" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber-500/30"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  const currentSlideData = onboardingSlides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-950/80 to-slate-900/50" />
        
        {/* Floating particles */}
        {[...Array(currentSlideData.particles)].map((_, i) => (
          <motion.div
            key={`${currentSlide}-${i}`}
            className="absolute w-1 h-1 bg-gradient-to-r from-amber-400 to-rose-400 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
              x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)]
            }}
            transition={{
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Mouse follower effect */}
        <motion.div
          className="absolute w-96 h-96 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${currentSlideData.gradient.includes('rose') ? 'rgba(244, 63, 94, 0.1)' : 
              currentSlideData.gradient.includes('blue') ? 'rgba(59, 130, 246, 0.1)' :
              currentSlideData.gradient.includes('emerald') ? 'rgba(16, 185, 129, 0.1)' :
              'rgba(139, 92, 246, 0.1)'} 0%, transparent 70%)`,
          }}
          animate={{
            x: mousePosition.x - 192,
            y: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.9 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              {/* Icon with enhanced animation */}
              <motion.div 
                className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${currentSlideData.gradient} mb-12 border border-white/10 backdrop-blur-sm`}
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0],
                  boxShadow: [
                    "0 0 0 0 rgba(245, 158, 11, 0)",
                    "0 0 0 20px rgba(245, 158, 11, 0.1)",
                    "0 0 0 0 rgba(245, 158, 11, 0)"
                  ]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <currentSlideData.icon className="w-16 h-16 text-white drop-shadow-lg" />
                
                {/* Sparkle effects */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-amber-400 rounded-full"
                    style={{
                      top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 40}%`,
                      left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 40}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </motion.div>

              {/* Title with gradient text */}
              <motion.h1 
                className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                  {currentSlideData.title}
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                className="text-2xl md:text-3xl text-slate-300 mb-16 leading-relaxed max-w-4xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                {currentSlideData.subtitle}
              </motion.p>

              {/* CTA Section */}
              {showCTA && currentSlideData.isLast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
                  className="space-y-8"
                >
                  <Link href="/auth">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-12 py-6 rounded-full text-xl group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                    >
                      <Sparkles className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform" />
                      Begin Your Legacy
                      <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  
                  <p className="text-slate-400 text-lg">
                    Create your first message in minutes • Free to start
                  </p>

                  {/* Feature highlights */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + index * 0.1 }}
                        className="text-center group"
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <feature.icon className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                        <p className="text-slate-400 text-sm">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Progress indicator */}
              {!showCTA && (
                <div className="flex justify-center space-x-3 mt-20">
                  {onboardingSlides.map((_, index) => (
                    <motion.div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-500 ${
                        index === currentSlide 
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 w-12' 
                          : 'bg-slate-600 w-2'
                      }`}
                      animate={{
                        scale: index === currentSlide ? 1.2 : 1,
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
    </div>
  );
}