import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Mic, Image as ImageIcon, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType, useAuth, collection, doc, setDoc } from '../services/firebase';

export default function DumpPad() {
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim() || !user) return;
    
    setIsSaving(true);
    const path = `users/${user.uid}/dump`;
    const itemId = Math.random().toString(36).substring(7);
    
    try {
      await setDoc(doc(db, path, itemId), {
        id: itemId,
        userId: user.uid,
        content: content.trim(),
        type: 'text',
        createdAt: new Date().toISOString(),
        processed: false
      });
      setContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${itemId}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="florr-card p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-deep-plum font-display italic">dump pad</h2>
        <div className="flex gap-2">
          <button className="p-3 bg-sage-mist/30 text-forest-green rounded-2xl hover:bg-sage-mist/50 transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          <button className="p-3 bg-dusty-blush/30 text-terracotta rounded-2xl hover:bg-dusty-blush/50 transition-colors">
            <ImageIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="get it out of your head. no order, no pressure. flo will help you sort it later."
          className="w-full h-full bg-transparent border-none resize-none focus:ring-0 text-lg placeholder:text-dark-text/20 leading-relaxed font-display italic"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={!content.trim() || isSaving}
          className={cn(
            "florr-button flex items-center gap-2",
            (!content.trim() || isSaving) && "opacity-30 cursor-not-allowed"
          )}
        >
          <span>{isSaving ? 'saving...' : 'save to the nest'}</span>
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

