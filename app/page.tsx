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
    author: "Digital Legacy",
    emotion: 'memory',
    gradient: 'gradient-memory'
  },
  {
    text: "Love transcends time, space, and even silence—your message will echo through eternity.",
    author: "Infinite Connection",
    emotion: 'love', 
    gradient: 'gradient-love'
  },
  {
    text: "In every ending lies the seed of a new beginning, your words become their strength.",
    author: "Eternal Hope",
    emotion: 'hope',
    gradient: 'gradient-hope'
  },
  {
    text: "Wisdom shared becomes a lighthouse for souls navigating the storms of loss.",
    author: "Sacred Knowledge",
    emotion: 'wisdom',
    gradient: 'gradient-wisdom'
  }
];

const journeySteps: JourneyStep[] = [
  {
    title: "Sacred Memory",
    subtitle: "Preserve your most precious thoughts",
    icon: Heart,
    theme: "memory",
    glow: "shadow-[0_0_30px_rgba(255,107,107,0.4)]"
  },
  {
    title: "Eternal Love",
    subtitle: "Express your deepest feelings",
    icon: Sparkles,
    theme: "love",
    glow: "shadow-[0_0_30px_rgba(165,94,234,0.4)]"
  },
  {
    title: "Living Hope",
    subtitle: "Share your dreams for their future",
    icon: Star,
    theme: "hope", 
    glow: "shadow-[0_0_30px_rgba(84,160,255,0.4)]"
  },
  {
    title: "Infinite Wisdom",
    subtitle: "Guide them with your life lessons",
    icon: Brain,
    theme: "wisdom",
    glow: "shadow-[0_0_30px_rgba(254,202,87,0.4)]"
  }
];

const features: Feature[] = [
  {
    title: "Secure & Private",
    description: "Your messages are encrypted and protected with military-grade security",
    icon: Shield,
    theme: "security",
    glow: "shadow-[0_0_20px_rgba(72,219,251,0.3)]"
  },
  {
    title: "Time-Triggered Delivery", 
    description: "Messages are delivered exactly when you want them to be received",
    icon: Clock,
    theme: "timing",
    glow: "shadow-[0_0_20px_rgba(165,94,234,0.3)]"
  },
  {
    title: "Emotional Intelligence",
    description: "AI helps craft messages that resonate deeply with your loved ones",
    icon: Brain,
    theme: "ai",
    glow: "shadow-[0_0_20px_rgba(254,202,87,0.3)]"
  },
  {
    title: "Multi-Media Legacy",
    description: "Combine text, voice, images, and videos in your eternal messages",
    icon: Users,
    theme: "media",
    glow: "shadow-[0_0_20px_rgba(255,107,107,0.3)]"
  }
];

// Create floating particles
const generateParticles = (count: number): Particle[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 20,
    size: Math.random() * 4 + 2
  }));
};

export default function Home() {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentJourney, setCurrentJourney] = useState(0);
  const [particles] = useState(() => generateParticles(50));
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Quote rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % poeticEssence.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Journey progression
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentJourney((prev) => (prev + 1) % journeySteps.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Mouse follower
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  // Navigation handlers
  const handleGetStarted = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/auth');
    }
  };

  const currentQuoteData = poeticEssence[currentQuote];
  const currentJourneyData = journeySteps[currentJourney];

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Cosmic Particle Field Background */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-cosmic opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.sin(particle.id) * 50, 0],
              opacity: [0.1, 0.6, 0.1],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 15 + particle.delay,
              repeat: Infinity,
              ease: "linear",
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* Aurora Background Overlay */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 80%, rgba(255,107,107,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(165,94,234,0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(84,160,255,0.1) 0%, transparent 50%)
            `
          }}
        />
      </div>

      {/* Mouse Follower Effect */}
      <div
        className="fixed pointer-events-none z-10 transition-all duration-300 ease-out"
        style={{
          left: mousePos.x - 100,
          top: mousePos.y - 100,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, rgba(72,219,251,0.1) 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(20px)',
        }}
      />

      {/* Main Content */}
      <div className="relative z-20">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-6">
          <div className="max-w-6xl mx-auto text-center">
            {/* Hero Title */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-12"
            >
              <h1 className="cosmic-hero mb-6">
                <span className="gradient-memory">If I'm</span>{' '}
                <span className="gradient-hope">Gone</span>
              </h1>
              <p className="story-body max-w-3xl mx-auto leading-relaxed">
                Create heartfelt messages for your loved ones that transcend time. 
                Your words of love, wisdom, and hope will be delivered exactly when they need them most.
              </p>
            </motion.div>

            {/* Rotating Quote Display */}
            <motion.div 
              className="mb-16 h-32 flex items-center justify-center"
              key={currentQuote}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuote}
                  initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-center max-w-4xl"
                >
                  <blockquote className={`emotional-header ${currentQuoteData.gradient} mb-4 shimmer-text`}>
                    "{currentQuoteData.text}"
                  </blockquote>
                  <cite className="whisper-text accent-mono">
                    — {currentQuoteData.author}
                  </cite>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mb-20"
            >
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="glass-button px-12 py-6 text-lg font-semibold glow-hover group"
              >
                <span className="gradient-cosmic">Begin Your Journey</span>
                <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Journey Steps Section */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="emotional-header gradient-cosmic mb-6">
                Your Soulful Journey
              </h2>
              <p className="story-body max-w-2xl mx-auto">
                Every message you create follows a sacred path of emotional connection
              </p>
            </motion.div>

            {/* Journey Progress Indicator */}
            <div className="flex justify-center mb-16">
              <div className="flex space-x-4">
                {journeySteps.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-500 ${
                      index === currentJourney 
                        ? 'bg-gradient-cosmic scale-150' 
                        : 'bg-white bg-opacity-20'
                    }`}
                    animate={{
                      scale: index === currentJourney ? 1.5 : 1,
                      rotate: index === currentJourney ? 180 : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  />
                ))}
              </div>
            </div>

            {/* Current Journey Step Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentJourney}
                initial={{ opacity: 0, scale: 0.9, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotateY: -90 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="text-center"
              >
                <div className={`glass-card p-12 max-w-2xl mx-auto ${currentJourneyData.glow}`}>
                  <motion.div
                    className="gentle-float mb-8"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <currentJourneyData.icon className="w-16 h-16 mx-auto gradient-cosmic" />
                  </motion.div>
                  <h3 className={`story-title mb-4 gradient-${currentJourneyData.theme}`}>
                    {currentJourneyData.title}
                  </h3>
                  <p className="story-body">
                    {currentJourneyData.subtitle}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="emotional-header gradient-wisdom mb-6">
                Sacred Features
              </h2>
              <p className="story-body max-w-2xl mx-auto">
                Every detail crafted with love and precision for your digital legacy
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`glass-card p-8 text-center glow-hover group ${feature.glow}`}
                >
                  <motion.div
                    className="mb-6 cosmic-drift"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <feature.icon className="w-12 h-12 mx-auto gradient-cosmic" />
                  </motion.div>
                  <h3 className="story-title mb-4 group-hover:gradient-cosmic transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="whisper-text">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="glass-card p-16"
            >
              <h2 className="emotional-header gradient-love mb-8">
                Your Story Awaits
              </h2>
              <p className="story-body mb-12 max-w-2xl mx-auto">
                Don't let your most important words go unspoken. Create messages that will 
                comfort, inspire, and guide your loved ones long after you're gone.
              </p>
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="glass-button px-16 py-8 text-xl font-bold glow-hover group"
              >
                <Heart className="mr-4 h-6 w-6 gradient-memory" />
                <span className="gradient-cosmic">Start Creating Today</span>
                <Sparkles className="ml-4 h-6 w-6 gradient-wisdom" />
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
}
