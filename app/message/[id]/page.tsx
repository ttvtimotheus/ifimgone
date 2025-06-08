'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Heart, Lock, Play, Pause, Volume2 } from 'lucide-react';
import { useParams } from 'next/navigation';

// Mock message data - in real app this would come from Supabase
const getMockMessage = (id: string) => ({
  id,
  title: "A Message for You",
  content: `My dearest loved one,

If you're reading this, it means I'm no longer with you physically, but my love and memories will always remain in your heart.

I want you to know how incredibly proud I am of you and how much joy you've brought into my life. Every moment we shared, every laugh, every tear - they all helped shape the beautiful person you are today.

Please don't let grief consume you. Instead, let it transform into a celebration of the time we had together. Live boldly, love deeply, and remember that I'm always watching over you.

Take care of yourself, pursue your dreams, and know that wherever you are, whatever you do, you carry a piece of my heart with you always.

With all my love,
Forever yours`,
  sender: "Your Loving Parent",
  hasPin: true,
  format: "text",
  createdAt: new Date().toISOString(),
});

export default function MessagePage() {
  const params = useParams();
  const messageId = params.id as string;
  const [message] = useState(getMockMessage(messageId));
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isRevealing, setIsRevealing] = useState(false);

  const handleUnlock = () => {
    if (pin === '1234') { // Mock PIN
      setIsRevealing(true);
      setTimeout(() => {
        setIsUnlocked(true);
        setIsRevealing(false);
      }, 2000);
    } else {
      setError('Incorrect PIN. Please try again.');
      setPin('');
    }
  };

  if (!isUnlocked && !isRevealing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 mx-auto mb-4">
                <Heart className="w-8 h-8 text-amber-500" />
              </div>
              <CardTitle className="text-white text-2xl">Sealed Message</CardTitle>
              <p className="text-slate-400">
                This message requires a PIN to unlock
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="Enter PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pl-10 bg-slate-800 border-slate-700 text-white text-center tracking-widest"
                    maxLength={4}
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
              </div>
              
              <Button 
                onClick={handleUnlock}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                disabled={pin.length !== 4}
              >
                Unlock Message
              </Button>
              
              <div className="text-center text-sm text-slate-500">
                <p>Created with love • {new Date(message.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isRevealing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="text-center"
        >
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 mx-auto mb-6">
            <Heart className="w-12 h-12 text-amber-500" />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-white text-xl"
          >
            Revealing your message...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border border-white/10 mx-auto mb-6">
                <Heart className="w-8 h-8 text-amber-500" />
              </div>
              <CardTitle className="text-white text-3xl mb-2">{message.title}</CardTitle>
              <p className="text-slate-400">From: {message.sender}</p>
              <p className="text-slate-500 text-sm">
                {new Date(message.createdAt).toLocaleDateString()}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="bg-slate-800/50 p-8 rounded-lg"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 2 }}
                >
                  {message.content.split('\n').map((paragraph, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1 + (index * 0.3), duration: 0.8 }}
                      className="text-white leading-relaxed mb-4 last:mb-0"
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </motion.div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.5, duration: 0.8 }}
                className="text-center border-t border-slate-700 pt-6"
              >
                <p className="text-slate-400 text-sm mb-4">
                  This message was created with love and delivered when it was needed most.
                </p>
                <div className="flex items-center justify-center space-x-2 text-amber-500">
                  <Heart className="w-4 h-4" />
                  <span className="text-sm">Created with If I'm Gone</span>
                  <Heart className="w-4 h-4" />
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}