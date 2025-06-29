'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, ArrowRight, Shield, Clock, MessageCircle, Sparkles, Users, Lock, Star, Feather, Infinity, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const philosophicalQuotes = [
  {
    text: "Love is the bridge between two hearts, transcending time and space.",
    author: "Anonymous",
    emotion: "love"
  },
  {
    text: "In every ending, there is a new beginning waiting to unfold.",
    author: "Ancient Wisdom",
    emotion: "hope"
  },
  {
    text: "Words have the power to heal, to comfort, and to live forever.",
    author: "Literary Truth",
    emotion: "wisdom"
  },
  {
    text: "Memory is the treasury and guardian of all things.",
    author: "Cicero",
    emotion: "memory"
  }
];

const emotionalJourney = [
  {
    id: 1,
    title: "Reflection",
    subtitle: "Take a moment to pause and reflect on what truly matters",
    icon: BookOpen,
    gradient: "gradient-memory",
    particles: 8,
    delay: 0
  },
  {
    id: 2,
    title: "Connection",
    subtitle: "Think of those who have touched your heart and soul",
    icon: Heart,
    gradient: "gradient-love", 
    particles: 12,
    delay: 0.5
  },
  {
    id: 3,
    title: "Expression",
    subtitle: "Find the words that capture your deepest feelings",
    icon: Feather,
    gradient: "gradient-wisdom",
    particles: 10,
    delay: 1.0
  },
  {
    id: 4,
    title: "Legacy",
    subtitle: "Create something beautiful that will live on forever",
    icon: Infinity,
    gradient: "gradient-hope",
    particles: 15,
    delay: 1.5,
    isLast: true
  }
];

const features = [
  {
    icon: Heart,
    title: "Heartfelt Messages",
    description: "Craft deeply personal messages that speak from your soul",
    color: "text-love",
    bgColor: "bg-love"
  },
  {
    icon: Shield,
    title: "Sacred Protection",
    description: "Your most precious words are guarded with reverence",
    color: "text-hope",
    bgColor: "bg-hope"
  },
  {
    icon: Clock,
    title: "Perfect Timing",
    description: "Messages delivered when they're needed most",
    color: "text-wisdom",
    bgColor: "bg-wisdom"
  },
  {
    icon: Users,
    title: "Trusted Circle",
    description: "Build a network of love and trust around your legacy",
    color: "text-memory",
    bgColor: "bg-memory"
  }
];

export default function Home() {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentJourney, setCurrentJourney] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const { user, loading } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
      return;
    }
    
    // Quote rotation
    const quoteTimer = setInterval(() => {
      setCurrentQuote(prev => (prev + 1) % philosophicalQuotes.length);
    }, 6000);

    // Journey progression
    const journeyTimer = setInterval(() => {
      setCurrentJourney(prev => {
        if (prev < emotionalJourney.length - 1) {
          return prev + 1;
        } else {
          setShowCTA(true);
          clearInterval(journeyTimer);
          return prev;
        }
      });
    }, 4000);

    return () => {
      clearInterval(quoteTimer);
      clearInterval(journeyTimer);
    };
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <Heart className="w-16 h-16 text-amber-500" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-amber-500/30"
            animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  const currentJourneyData = emotionalJourney[currentJourney];
  const currentQuoteData = philosophicalQuotes[currentQuote];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden" ref={containerRef}>
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 bg-gradient-to-r from-amber-400/30 to-rose-400/30 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              opacity: 0,
              scale: 0
            }}
            animate={{ 
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
              x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000)]
            }}
            transition={{
              duration: 15 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Constellation effect */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute w-0.5 h-0.5 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 5
              }}
            />
          ))}
        </div>

        {/* Mouse follower effect */}
        <motion.div
          className="absolute w-96 h-96 rounded-full pointer-events-none opacity-30"
          style={{
            background: `radial-gradient(circle, ${
              currentQuoteData.emotion === 'love' ? 'rgba(244, 114, 182, 0.1)' :
              currentQuoteData.emotion === 'hope' ? 'rgba(52, 211, 153, 0.1)' :
              currentQuoteData.emotion === 'wisdom' ? 'rgba(251, 191, 36, 0.1)' :
              'rgba(167, 139, 250, 0.1)'
            } 0%, transparent 70%)`,
          }}
          animate={{
            x: mousePosition.x - 192,
            y: mousePosition.y - 192,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 200 }}
        />
      </div>

      {/* Main content */}
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col"
        style={{ opacity, scale }}
      >
        {/* Hero section */}
        <div className="flex-1 flex items-center justify-center px-8 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentJourney}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="space-y-12"
              >
                {/* Philosophical quote */}
                <motion.div
                  key={currentQuote}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 2 }}
                  className="mb-16"
                >
                  <blockquote className="font-serif text-xl md:text-2xl text-slate-300 italic leading-relaxed-plus max-w-4xl mx-auto">
                    "{currentQuoteData.text}"
                  </blockquote>
                  <cite className="text-slate-500 text-sm mt-4 block">— {currentQuoteData.author}</cite>
                </motion.div>

                {/* Journey icon with enhanced animation */}
                <motion.div 
                  className={`inline-flex items-center justify-center w-40 h-40 rounded-full ${currentJourneyData.gradient} mb-16 relative`}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, -1, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <currentJourneyData.icon className="w-20 h-20 text-white drop-shadow-2xl" />
                  
                  {/* Orbital particles */}
                  {[...Array(currentJourneyData.particles)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/40 rounded-full"
                      style={{
                        top: `${50 + Math.sin(i * (360 / currentJourneyData.particles) * Math.PI / 180) * 60}%`,
                        left: `${50 + Math.cos(i * (360 / currentJourneyData.particles) * Math.PI / 180) * 60}%`,
                      }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        rotate: [0, 360]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}

                  {/* Breathing glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(255, 255, 255, 0)",
                        "0 0 0 30px rgba(255, 255, 255, 0.1)",
                        "0 0 0 0 rgba(255, 255, 255, 0)"
                      ]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>

                {/* Journey title with gradient text */}
                <motion.h1 
                  className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  <span className="gradient-text font-serif">
                    {currentJourneyData.title}
                  </span>
                </motion.h1>

                {/* Journey subtitle */}
                <motion.p 
                  className="text-2xl md:text-3xl text-slate-300 mb-16 leading-relaxed max-w-4xl mx-auto font-light"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  {currentJourneyData.subtitle}
                </motion.p>

                {/* CTA Section */}
                {showCTA && currentJourneyData.isLast && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9, duration: 0.8, ease: "easeOut" }}
                    className="space-y-12"
                  >
                    <Link href="/auth">
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-16 py-8 rounded-full text-2xl group transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-amber-500/25 animate-pulse-glow"
                      >
                        <Sparkles className="mr-4 w-8 h-8 group-hover:rotate-12 transition-transform" />
                        Begin Your Legacy
                        <ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-2 transition-transform" />
                      </Button>
                    </Link>
                    
                    <p className="text-slate-400 text-xl font-light">
                      Create your first message in minutes • Free to start • Forever meaningful
                    </p>
                  </motion.div>
                )}

                {/* Progress indicator */}
                {!showCTA && (
                  <div className="flex justify-center space-x-4 mt-20">
                    {emotionalJourney.map((_, index) => (
                      <motion.div
                        key={index}
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          index === currentJourney 
                            ? 'bg-gradient-to-r from-amber-400 to-orange-400 w-16 shadow-lg shadow-amber-500/50' 
                            : index < currentJourney
                            ? 'bg-amber-500/50 w-3'
                            : 'bg-slate-600 w-3'
                        }`}
                        animate={{
                          scale: index === currentJourney ? 1.2 : 1,
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Features section */}
        {showCTA && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="py-32 px-8"
          >
            <div className="max-w-6xl mx-auto">
              <motion.h2 
                className="text-4xl md:text-5xl font-bold text-center text-white mb-6 font-serif"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 }}
              >
                Crafted with Love & Reverence
              </motion.h2>
              
              <motion.p
                className="text-xl text-slate-400 text-center mb-20 max-w-3xl mx-auto leading-relaxed-plus"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9 }}
              >
                Every feature is designed to honor the sacred nature of your final words, 
                ensuring they reach the right hearts at the right time.
              </motion.p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 2.1 + index * 0.2 }}
                    className="text-center group"
                  >
                    <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-all duration-500 interactive-card`}>
                      <feature.icon className={`w-10 h-10 ${feature.color}`} />
                    </div>
                    <h3 className="text-white font-semibold mb-3 text-lg">{feature.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
      </motion.div>
    </div>
  );
}