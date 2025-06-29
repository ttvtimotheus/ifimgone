'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Menu, X, Home, Settings, Plus, LogOut, User, Shield, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useSafeAnimation, SafeAnimationVariants, SafeAnimatePresenceProps } from '@/hooks/use-safe-animation';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { isMounted, safeAnimate } = useSafeAnimation();

  const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/create-message', label: 'Create Message', icon: Plus },
    { href: '/trusted-contacts', label: 'Trusted Contacts', icon: Users },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/security', label: 'Security', icon: Shield },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  const handleSignOut = useCallback(async () => {
    if (!isMounted()) return;
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut, isMounted]);

  const handleNavigation = useCallback((href: string) => {
    if (!isMounted()) return;
    setIsOpen(false);
    router.push(href);
  }, [router, isMounted]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => handleNavigation('/dashboard')} 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity group"
          >
            <motion.div 
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 backdrop-blur-sm"
              whileHover={isMounted() ? { scale: 1.1 } : {}}
              whileTap={isMounted() ? { scale: 0.95 } : {}}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Heart className="w-5 h-5 text-amber-500 group-hover:text-amber-400 transition-colors" />
            </motion.div>
            <span className="text-white font-semibold text-xl font-serif">If I'm Gone</span>
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <motion.button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={`flex items-center text-slate-300 hover:text-white transition-colors relative ${
                  pathname === item.href ? 'text-amber-400' : ''
                }`}
                whileHover={isMounted() ? { y: -2 } : {}}
                whileTap={isMounted() ? { y: 0 } : {}}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
                {pathname === item.href && isMounted() && (
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            <AnimatePresence {...SafeAnimatePresenceProps}>
              {isMounted() && (
                <motion.div
                  key={isOpen ? 'close' : 'open'}
                  {...SafeAnimationVariants.fadeIn}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence {...SafeAnimatePresenceProps}>
          {isOpen && isMounted() && (
            <motion.div
              {...SafeAnimationVariants.slideInFromTop}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden border-t border-slate-800/50 py-4 bg-slate-950/90 backdrop-blur-xl"
            >
              <motion.div 
                className="space-y-2"
                {...SafeAnimationVariants.staggerContainer}
              >
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.href}
                    onClick={() => handleNavigation(item.href)}
                    className={`flex items-center text-slate-300 hover:text-white transition-colors py-3 w-full text-left ${
                      pathname === item.href ? 'text-amber-400' : ''
                    }`}
                    {...SafeAnimationVariants.staggerItem}
                    transition={{ delay: index * 0.1, duration: 0.3, ease: "easeOut" }}
                  >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                    {pathname === item.href && (
                      <Sparkles className="w-4 h-4 ml-auto text-amber-400" />
                    )}
                  </motion.button>
                ))}
                
                <motion.div
                  {...SafeAnimationVariants.staggerItem}
                  transition={{ delay: menuItems.length * 0.1, duration: 0.3, ease: "easeOut" }}
                >
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleSignOut}
                    className="text-slate-400 hover:text-white w-full justify-start p-0 py-3"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}