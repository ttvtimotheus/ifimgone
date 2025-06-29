'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to safely handle Framer Motion animations and prevent cleanup errors
 */
export function useSafeAnimation() {
  const isMountedRef = useRef(true);
  const animationRefs = useRef<Set<any>>(new Set());

  // Mark component as unmounted when it unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Clean up any remaining animation references
      animationRefs.current.forEach(ref => {
        if (ref && typeof ref.stop === 'function') {
          try {
            ref.stop();
          } catch (e) {
            // Silently handle cleanup errors
          }
        }
      });
      animationRefs.current.clear();
    };
  }, []);

  // Register an animation reference for cleanup
  const registerAnimation = useCallback((animationRef: any) => {
    if (isMountedRef.current && animationRef) {
      animationRefs.current.add(animationRef);
    }
  }, []);

  // Unregister an animation reference
  const unregisterAnimation = useCallback((animationRef: any) => {
    if (animationRef) {
      animationRefs.current.delete(animationRef);
    }
  }, []);

  // Check if component is still mounted
  const isMounted = useCallback(() => isMountedRef.current, []);

  // Safe animation starter that checks if component is mounted
  const safeAnimate = useCallback((animateFunction: () => any) => {
    if (isMountedRef.current) {
      try {
        const animation = animateFunction();
        if (animation) {
          registerAnimation(animation);
        }
        return animation;
      } catch (e) {
        // Handle animation errors gracefully
        console.warn('Animation error:', e);
        return null;
      }
    }
    return null;
  }, [registerAnimation]);

  return {
    isMounted,
    safeAnimate,
    registerAnimation,
    unregisterAnimation
  };
}

/**
 * Safe animation variants with cleanup considerations
 */
export const SafeAnimationVariants = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: "easeOut" }
  },
  
  // Slide animations
  slideInFromBottom: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  slideInFromTop: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  slideInFromLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  slideInFromRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: "easeOut" }
  },
  
  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: 0.2, ease: "easeOut" }
  },
  
  // Stagger animations for lists
  staggerContainer: {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: {
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  },
  
  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

/**
 * Safe AnimatePresence wrapper that handles cleanup properly
 */
export const SafeAnimatePresenceProps = {
  mode: "wait" as const,
  initial: false,
  onExitComplete: () => {
    // Force cleanup after exit animations complete
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        // Cleanup any lingering animation references
      });
    }
  }
};
