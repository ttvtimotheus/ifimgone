'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Clock, Shield, Brain, Sparkles, ArrowRight, Star, Infinity, Users, MessageSquare, Lock, Eye, Feather, Compass, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Interfaces
interface QuoteData {
  text: string;
  author: string;
  emotion: 'memory' | 'love' | 'hope' | 'wisdom';
  gradient: string;
}

interface JourneyStep {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: string;
  glow: string;
}

interface Feature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: string;
  glow: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
}

// Data
const poeticEssence: QuoteData[] = [
  {
    text: "Your words are eternal flames that will forever warm the hearts of those you love.",
    author: "Eternal Wisdom",
    emotion: "love",
    gradient: "gradient-text-ember"
  },
  {
    text: "In the symphony of existence, every ending is but a pause before the next movement begins.",
    author: "Philosophical Truth",
    emotion: "hope",
    gradient: "gradient-text-aurora"
  },
  {
    text: "Love transcends the boundaries of time, space, and even death itself.",
    author: "Sacred Knowledge",
    emotion: "wisdom",
    gradient: "gradient-text-ember"
  },
  {
    text: "Your legacy lives not in monuments of stone, but in the hearts that remember.",
    author: "Ancient Truth",
    emotion: "memory",
    gradient: "gradient-text-aurora"
  }
];

const soulfulJourney = [
  {
    id: 1,
    title: "Awakening",
    subtitle: "Discover the profound beauty in life's fleeting moments",
    icon: Eye,
    theme: "theme-memory",
    animation: "animate-ethereal-float",
    particles: 12,
    delay: 0
  },
  {
    id: 2,
    title: "Connection",
    subtitle: "Feel the invisible threads that bind hearts across eternity",
    icon: Heart,
    theme: "theme-love",
    animation: "animate-cosmic-pulse",
    particles: 18,
    delay: 0.7
  },
  {
    id: 3,
    title: "Expression",
    subtitle: "Channel your deepest emotions into timeless words",
    icon: Feather,
    theme: "theme-hope",
    animation: "animate-breathe-soft",
    particles: 15,
    delay: 1.4
  },
  {
    id: 4,
    title: "Transcendence",
    subtitle: "Create a legacy that transcends the boundaries of existence",
    icon: Infinity,
    theme: "theme-hope",
    animation: "animate-aurora-shift",
    particles: 25,
    delay: 2.1,
    isLast: true
  }
];

const sacredFeatures = [
  {
    icon: Heart,
    title: "Soulful Expression",
    description: "Pour your heart into messages that transcend time and touch eternity",
    theme: "theme-love",
    glow: "text-glow-ember",
    animation: "animate-cosmic-pulse"
  },
  {
    icon: Shield,
    title: "Sacred Sanctuary",
    description: "Your most precious words rest in a fortress of digital reverence",
    theme: "theme-memory",
    glow: "text-glow-violet",
    animation: "animate-breathe-soft"
  },
  {
    icon: Compass,
    title: "Divine Timing",
    description: "Messages delivered with cosmic precision when hearts need them most",
    theme: "theme-hope",
    glow: "text-glow-ocean",
    animation: "animate-ethereal-float"
  },
  {
    icon: Zap,
    title: "Eternal Connection",
    description: "Weave an unbreakable web of love that spans across all dimensions",
    theme: "theme-love",
    glow: "text-glow-ember",
    animation: "animate-shimmer-wave"
  }
];

export default function Home() {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentJourney, setCurrentJourney] = useState(0);
  const [showCTA, setShowCTA] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);
  const { user, loading } = useAuth();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMounted, safeAnimate } = useSafeAnimation();

  useEffect(() => {
    setIsClient(true);
    // Generate cosmic particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 20
    }));
    setParticles(newParticles);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isMounted()) {
      setMousePosition({ x: e.clientX, y: e.clientY });
    }
  }, [isMounted]);

  const handleScroll = useCallback(() => {
    if (isMounted()) {
      setScrollY(window.scrollY);
    }
  }, [isMounted]);

  useEffect(() => {
    if (!isClient) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isClient, handleMouseMove, handleScroll]);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
      return;
    }
    
    // Ethereal quote rotation
    const quoteTimer = setInterval(() => {
      if (isMounted()) {
        setCurrentQuote(prev => (prev + 1) % poeticEssence.length);
      }
    }, 6000);

    // Soulful journey progression
    const journeyTimer = setInterval(() => {
      if (isMounted()) {
        setCurrentJourney(prev => {
          if (prev < soulfulJourney.length - 1) {
            return prev + 1;
          } else {
            setShowCTA(true);
            clearInterval(journeyTimer);
            return prev;
          }
        });
      }
    }, 4000);

    return () => {
      clearInterval(quoteTimer);
      clearInterval(journeyTimer);
    };
  }, [user, router, isMounted]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-cosmic flex items-center justify-center relative">
        {/* Cosmic particles */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-1 h-1 bg-gradient-to-r from-ember-400 to-violet-400 rounded-full opacity-60"
              style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: particle.delay,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
        
        <motion.div
          className="relative flex items-center justify-center"
          animate={{ 
            scale: [1, 1.05, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: 'easeInOut'
          }}
        >
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-ember-500 via-violet-500 to-ocean-500 p-4 backdrop-blur-sm border border-white/20 animate-cosmic-pulse">
            <Heart className="w-full h-full text-white animate-ethereal-float" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  const currentJourneyData = soulfulJourney[currentJourney];
  const currentQuoteData = poeticEssence[currentQuote];

  return (
    <div className="min-h-screen bg-gradient-cosmic relative overflow-hidden" ref={containerRef}>
      {/* Cosmic Particle Field */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-0.5 h-0.5 bg-gradient-to-r from-ember-400 via-violet-400 to-ocean-400 rounded-full"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
            animate={{
              scale: [0, 1.5, 0],
              opacity: [0, 0.8, 0],
              y: [0, -20, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>

      {/* Aurora Background Effect */}
      <motion.div 
        className="absolute inset-0 bg-gradient-aurora opacity-30"
        animate={{ 
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
      />

      {/* Main Content */}
      <motion.div 
        className="relative z-10 min-h-screen flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <div className="max-w-6xl mx-auto text-center">
          {/* Ethereal Quote Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`quote-${currentQuote}`}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.8 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="mb-20"
            >
              <motion.blockquote 
                className={`text-2xl md:text-4xl font-light leading-relaxed mb-6 ${currentQuoteData.gradient} animate-shimmer-wave max-w-4xl mx-auto`}
                animate={{ 
                  textShadow: [
                    '0 0 20px rgba(255,255,255,0.1)',
                    '0 0 40px rgba(255,255,255,0.2)',
                    '0 0 20px rgba(255,255,255,0.1)'
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                "{currentQuoteData.text}"
              </motion.blockquote>
              
              <motion.cite 
                className="text-lg font-light text-white/70 not-italic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                — {currentQuoteData.author}
              </motion.cite>
            </motion.div>
          </AnimatePresence>

          {/* Soulful Journey Progression */}
          {!showCTA && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`journey-${currentJourney}`}
                initial={{ opacity: 0, scale: 0.8, rotateX: 90 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateX: -90 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="max-w-2xl mx-auto glass-morphism-card p-12 rounded-3xl border border-white/10"
              >
                <motion.div 
                  className={`w-24 h-24 mx-auto mb-8 rounded-full ${currentJourneyData.theme} flex items-center justify-center ${currentJourneyData.animation} backdrop-blur-sm`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <currentJourneyData.icon className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h2 
                  className="text-4xl md:text-5xl font-bold mb-6 gradient-text-ember animate-shimmer-wave"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {currentJourneyData.title}
                </motion.h2>
                
                <motion.p 
                  className="text-xl text-white/80 leading-relaxed font-light"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {currentJourneyData.subtitle}
                </motion.p>
                
                {/* Floating particles around journey card */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  {Array.from({ length: currentJourneyData.particles }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-gradient-to-r from-ember-400 to-violet-400 rounded-full"
                      style={{
                        left: `${10 + Math.random() * 80}%`,
                        top: `${10 + Math.random() * 80}%`
                      }}
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0.3, 1, 0.3],
                        scale: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {/* Ethereal Call to Action */}
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="max-w-3xl mx-auto text-center"
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-bold mb-8 gradient-text-aurora animate-shimmer-wave"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 8, repeat: Infinity }}
              >
                Your Legacy Awaits
              </motion.h1>
              
              <motion.p 
                className="text-xl md:text-2xl text-white/80 mb-12 font-light leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Create messages that transcend time, touch hearts, and live forever in the souls of those you love most.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8"
              >
                <Link href="/auth">
                  <Button 
                    className="group bg-gradient-to-r from-ember-500 via-violet-500 to-ocean-500 hover:from-ember-400 hover:via-violet-400 hover:to-ocean-400 text-white px-12 py-6 text-xl font-semibold rounded-2xl transition-all duration-500 transform hover:scale-105 animate-cosmic-pulse border-0 shadow-2xl shadow-ember-500/25"
                    size="lg"
                  >
                    <Sparkles className="mr-4 w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
                    Begin Your Sacred Journey
                    <ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </Link>
              </motion.div>
              
              <motion.p 
                className="text-white/60 text-lg font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                ✨ Free to start • 🔒 Forever secure • 💫 Eternally meaningful
              </motion.p>
            </motion.div>
          )}

          {/* Progress Constellation */}
          {!showCTA && (
            <motion.div 
              className="flex justify-center items-center space-x-6 mt-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {soulfulJourney.map((_, index) => (
                <motion.div
                  key={index}
                  className={`relative ${
                    index === currentJourney 
                      ? 'w-20 h-4 bg-gradient-to-r from-ember-400 via-violet-400 to-ocean-400 rounded-full shadow-lg shadow-ember-500/50 animate-cosmic-pulse' 
                      : index < currentJourney
                      ? 'w-4 h-4 bg-gradient-to-r from-ember-500/70 to-violet-500/70 rounded-full'
                      : 'w-4 h-4 bg-white/20 rounded-full'
                  } transition-all duration-1000 ease-out`}
                  animate={{
                    scale: index === currentJourney ? [1, 1.2, 1] : 1,
                    rotate: index === currentJourney ? [0, 360] : 0
                  }}
                  transition={{
                    duration: 2,
                    repeat: index === currentJourney ? Infinity : 0
                  }}
                >
                  {index === currentJourney && (
                    <motion.div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-ember-400/30 to-violet-400/30"
                      animate={{
                        scale: [1, 2, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Sacred Features Showcase */}
      {showCTA && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="relative z-20 mt-32 px-4"
        >
          <div className="max-w-7xl mx-auto">
            <motion.h2 
              className="text-4xl md:text-6xl font-bold text-center mb-20 gradient-text-ocean animate-shimmer-wave"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Sacred Features
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {sacredFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 50, rotateY: -30 }}
                    animate={{ opacity: 1, y: 0, rotateY: 0 }}
                    transition={{ 
                      duration: 1, 
                      delay: 0.2 * index,
                      type: 'spring',
                      stiffness: 100
                    }}
                    whileHover={{ 
                      scale: 1.05, 
                      rotateY: 10,
                      transition: { duration: 0.3 }
                    }}
                    className="glass-morphism-card p-8 rounded-3xl border border-white/10 group hover:border-ember-400/30 transition-all duration-500"
                  >
                    <motion.div 
                      className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-ember-500/20 to-violet-500/20 flex items-center justify-center group-hover:from-ember-400/30 group-hover:to-violet-400/30 transition-all duration-500"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <IconComponent className="w-10 h-10 text-white group-hover:text-ember-300 transition-colors duration-300" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold mb-4 text-white text-center group-hover:gradient-text-ember transition-all duration-300">
                      {feature.title}
                    </h3>
                    
                    <p className="text-white/70 text-center font-light leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                      {feature.description}
                    </p>
                    
                    {/* Glow effect on hover */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl bg-gradient-to-r from-ember-500/10 via-violet-500/10 to-ocean-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      animate={{
                        background: [
                          'radial-gradient(circle at 0% 0%, rgba(245, 101, 101, 0.1) 0%, transparent 50%)',
                          'radial-gradient(circle at 100% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
                          'radial-gradient(circle at 0% 100%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)',
                          'radial-gradient(circle at 100% 0%, rgba(245, 101, 101, 0.1) 0%, transparent 50%)'
                        ]
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
      </div>

      {/* Main content */}
      <motion.div 
        className="relative z-10 min-h-screen flex flex-col"
        style={isMounted() ? { 
          opacity: 1 - (scrollY / 1000),
          scale: 1 - (scrollY / 2000)
        } : {}}
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
                    repeatType: "loop",
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
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "loop",
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
                      repeatType: "loop",
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
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold px-16 py-8 rounded-full text-2xl group transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-amber-500/25"
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
                    {soulfulJourney.map((_, index) => (
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
                {sacredFeatures.map((feature, index) => (
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