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
    // Fix for WAAPI animations with NaN iterations
    if (typeof window !== 'undefined') {
      // We can't modify the prototype directly due to TypeScript restrictions
      // Instead, we'll use a MutationObserver to detect and fix animations
      const fixAnimations = () => {
        if (!document) return;
        try {
          document.querySelectorAll('*').forEach(element => {
            const animations = (element as any).getAnimations?.();
            if (animations) {
              animations.forEach((animation: any) => {
                try {
                  if (animation && animation.effect && typeof animation.effect.updateTiming === 'function') {
                    const timing = animation.effect.getTiming?.();
                    if (timing && (timing.iterations === undefined || isNaN(timing.iterations))) {
                      // Fix the NaN iterations by setting it to 1
                      animation.effect.updateTiming({ iterations: 1 });
                    }
                  }
                } catch (e) {
                  // Silently handle errors
                }
              });
            }
          });
        } catch (e) {
          // Silently handle errors
        }
      };
      
      // Run the fix periodically
      const intervalId = setInterval(fixAnimations, 1000);
      
      // Also run it on DOM mutations
      const observer = new MutationObserver(fixAnimations);
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Clean up
      return () => {
        clearInterval(intervalId);
        observer.disconnect();
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
    }
    
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
          // If this is a WAAPI animation, ensure iterations is valid
          if (animation.effect && typeof animation.effect.updateTiming === 'function') {
            try {
              const timing = animation.effect.getTiming?.();
              if (timing && (timing.iterations === undefined || isNaN(timing.iterations))) {
                animation.effect.updateTiming({ iterations: 1 });
              }
            } catch (e) {
              // Silently handle errors
            }
          }
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
        try {
          document.querySelectorAll('*').forEach(element => {
            try {
              const animations = (element as any).getAnimations?.();
              if (animations) {
                animations.forEach((animation: any) => {
                  try {
                    // Fix or cancel animations with NaN iterations
                    if (animation && animation.effect) {
                      if (typeof animation.effect.updateTiming === 'function') {
                        const timing = animation.effect.getTiming?.();
                        if (timing && (timing.iterations === undefined || isNaN(timing.iterations))) {
                          animation.effect.updateTiming({ iterations: 1 });
                        }
                      } else if (typeof animation.cancel === 'function') {
                        // If we can't update timing, cancel the animation
                        animation.cancel();
                      }
                    }
                  } catch (e) {
                    // Silently handle errors
                  }
                });
              }
            } catch (e) {
              // Silently handle errors for this element
            }
          });
        } catch (e) {
          // Silently handle any errors
        }
      });
    }
  }
};
