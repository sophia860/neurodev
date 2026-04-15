import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, MessageCircle } from 'lucide-react';
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
      const msgs = snapshot.docs.map(d => d.data() as ChatMessage);
      setMessages(msgs.length === 0 ? [{ role: 'model', text: "hey. i'm flo. i'm here to help you figure out how you work best. what's been making work feel really hard lately?", timestamp: new Date().toISOString() }] : msgs);
    }, (e) => handleFirestoreError(e, OperationType.LIST, path));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
      await addDoc(collection(db, path), { role: 'model', text: response, timestamp: new Date().toISOString() });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className="fixed bottom-20 right-8 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center z-50"
        style={{ background: 'var(--color-teal)' }}
        title="talk to flo"
      >
        <MessageCircle className="w-6 h-6 text-canvas" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="fixed bottom-36 right-8 w-[380px] h-[520px] nd-card shadow-2xl flex flex-col z-[70] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-teal)' }}>
                  <MessageCircle className="w-4 h-4 text-canvas" />
                </div>
                <div>
                  <h3 className="text-sm font-display italic text-ink">flo</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" style={{ background: 'var(--color-teal)' }} />
                    <span className="nd-label" style={{ color: 'var(--color-teal)' }}>perceiving</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn("flex flex-col max-w-[88%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}
                >
                  <div
                    className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={msg.role === 'user'
                      ? { background: 'var(--color-ink)', color: 'var(--color-canvas)', borderRadius: '16px 16px 4px 16px' }
                      : { background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(228,224,216,0.6)', color: 'var(--color-ink)', borderRadius: '16px 16px 16px 4px' }
                    }
                  >
                    {msg.text}
                  </div>
                  <span className="nd-label text-muted/60 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-1.5 px-4 py-3 rounded-2xl w-16 border border-border/50"
                  style={{ background: 'rgba(255,255,255,0.7)', borderRadius: '16px 16px 16px 4px' }}
                >
                  {[0, 0.2, 0.4].map((delay, i) => (
                    <motion.div key={i} animate={{ scale: [1, 1.6, 1] }}
                      transition={{ repeat: Infinity, duration: 1, delay }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--color-muted)' }}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            <div className="px-4 py-4 border-t border-border/50">
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="talk to flo..."
                  className="nd-input flex-1 text-sm py-2.5"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
                  style={{ background: 'var(--color-teal)' }}
                >
                  <Send className="w-3.5 h-3.5 text-canvas" />
                </button>
              </div>
              <p className="reassurance-line text-center mt-2.5">flo is unhurried. take your time.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
