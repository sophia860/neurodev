import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Sparkles, MessageCircle } from 'lucide-react';
import { getFloResponse } from '../services/gemini';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType, useAuth, collection, addDoc, onSnapshot, query, orderBy, limit } from '../services/firebase';

export default function Flo() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/chats`;
    const q = query(collection(db, path), orderBy('timestamp', 'asc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data() as ChatMessage);
      if (msgs.length === 0) {
        setMessages([{ 
          role: 'model', 
          text: 'hey. i\'m flo. i\'m here to help you figure out how you work best. before we do anything else — what\'s been making work feel really hard lately?', 
          timestamp: new Date().toISOString() 
        }]);
      } else {
        setMessages(msgs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date().toISOString() };
    const path = `users/${user.uid}/chats`;
    
    try {
      await addDoc(collection(db, path), userMsg);
      setInput('');
      setIsTyping(true);

      const history = messages.concat(userMsg).map(m => ({ role: m.role, text: m.text }));
      const response = await getFloResponse(history);
      
      const modelMsg: ChatMessage = { role: 'model', text: response, timestamp: new Date().toISOString() };
      await addDoc(collection(db, path), modelMsg);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsTyping(false);
    }
  };


  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-12 right-12 w-20 h-20 bg-deep-plum text-warm-cream rounded-[32px] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group z-50"
      >
        <div className="absolute inset-0 bg-deep-plum rounded-[32px] animate-ping opacity-20 group-hover:opacity-40" />
        <Sparkles className="w-10 h-10 relative z-10" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-deep-plum/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
              className="fixed bottom-12 right-12 w-[450px] h-[700px] glass-panel shadow-2xl flex flex-col z-[70] overflow-hidden"
            >
              {/* Header */}
              <div className="p-8 border-b border-white/20 flex items-center justify-between bg-white/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-deep-plum rounded-2xl flex items-center justify-center text-warm-cream shadow-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-deep-plum font-display italic">flo</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-forest-green animate-pulse" />
                      <span className="text-[9px] font-bold text-forest-green uppercase tracking-widest font-mono">perceiving</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-black/5 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-soft-grey" />
                </button>
              </div>

              {/* Messages */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-8 space-y-6 mask-fade-bottom"
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div className={cn(
                      "p-5 rounded-[28px] text-sm leading-relaxed shadow-sm tracking-tight",
                      msg.role === 'user' 
                        ? "bg-deep-plum text-warm-cream rounded-tr-none" 
                        : "bg-white/80 text-dark-text rounded-tl-none border border-white/50"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-soft-grey mt-2 font-mono opacity-50 uppercase tracking-widest">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 p-5 bg-white/40 rounded-[28px] rounded-tl-none w-20"
                  >
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-deep-plum/30 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-deep-plum/30 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-deep-plum/30 rounded-full" />
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div className="p-8 bg-white/20 border-t border-white/20">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="talk to flo..."
                    className="w-full bg-white/60 border-none rounded-2xl pl-6 pr-14 py-4 text-sm focus:ring-2 focus:ring-deep-plum/10 placeholder:text-soft-grey/50 shadow-inner font-display italic"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-2 p-3 bg-deep-plum text-warm-cream rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[9px] text-center text-soft-grey mt-4 font-bold uppercase tracking-widest font-mono opacity-60">
                  flo is unhurried. take your time.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

