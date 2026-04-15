import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType, useAuth, doc, setDoc } from '../services/firebase';

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
    <div className="nd-card p-5 flex flex-col gap-4 h-full min-h-[200px]">
      <div className="flex items-center justify-between">
        <h3 className="font-display italic text-ink text-base">dump pad</h3>
        <span className="nd-label text-muted">brain dump</span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSave(); }}
        placeholder="get it out of your head. no order, no pressure."
        className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-ink placeholder:text-muted font-display italic font-light leading-relaxed"
        rows={5}
      />

      <div className="flex items-center justify-between">
        <span className="nd-label text-muted/60">⌘ + enter to save</span>
        <button
          onClick={handleSave}
          disabled={!content.trim() || isSaving}
          className={cn("nd-button text-sm px-4 py-2 gap-1.5", (!content.trim() || isSaving) && "opacity-30")}
        >
          <span>{isSaving ? 'saving...' : 'save'}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
