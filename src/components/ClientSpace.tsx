import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Client } from '../types';
import { db, useAuth, handleFirestoreError, OperationType, collection, onSnapshot, query, addDoc, doc, deleteDoc } from '../services/firebase';

const colorPalette = [
  { bg: 'rgba(208,228,210,0.4)', color: 'var(--color-teal)' },
  { bg: 'rgba(232,213,204,0.4)', color: 'var(--color-amber)' },
  { bg: 'rgba(228,224,216,0.5)', color: 'var(--color-soft-grey)' },
  { bg: 'rgba(240,228,210,0.4)', color: 'var(--color-amber-warm)' },
  { bg: 'rgba(208,228,220,0.4)', color: 'var(--color-success)' },
];

export default function ClientSpace() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', type: '', rate: '' });

  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/clients`;
    const unsubscribe = onSnapshot(query(collection(db, path)), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Client[];
      setClients(docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (e) => handleFirestoreError(e, OperationType.LIST, path));
    return () => unsubscribe();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !newClient.name) return;
    const idx = clients.length % colorPalette.length;
    const path = `users/${user.uid}/clients`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid, name: newClient.name, type: newClient.type || 'client',
        rate: newClient.rate || 'tbd', status: 'active',
        initials: newClient.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewClient({ name: '', type: '', rate: '' });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  };

  const deleteClient = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/clients/${id}`;
    try { await deleteDoc(doc(db, path)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display font-light text-4xl text-ink mb-1.5">clients.</h2>
          <p className="text-soft-grey italic font-display font-light">managing your partnerships with care.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="nd-button text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> add client
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="nd-card p-12 text-center">
          <p className="text-soft-grey font-display italic font-light">no clients yet. add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client, i) => {
            const palette = colorPalette[i % colorPalette.length];
            return (
              <motion.div
                key={client.id}
                whileHover={{ y: -2 }}
                className="nd-card p-5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-light text-base"
                    style={{ background: palette.bg, color: palette.color }}>
                    {client.initials}
                  </div>
                  <button
                    onClick={() => deleteClient(client.id)}
                    className="p-1.5 opacity-0 group-hover:opacity-100 rounded-lg text-muted hover:text-error hover:bg-error/5 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="font-display text-lg text-ink font-light tracking-tight mb-0.5">{client.name}</h3>
                  <p className="text-sm text-soft-grey font-light italic">{client.type}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <div>
                    <p className="nd-label text-muted mb-0.5">rate</p>
                    <p className="text-sm font-mono font-bold text-ink">{client.rate}</p>
                  </div>
                  <span
                    className="nd-badge rounded-full"
                    style={client.status === 'active'
                      ? { background: 'rgba(30,122,110,0.1)', color: 'var(--color-teal)' }
                      : { background: 'rgba(196,134,10,0.1)', color: 'var(--color-warning)' }
                    }
                  >
                    {client.status}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)} className="fixed inset-0 backdrop-blur-sm z-[100]"
              style={{ background: 'rgba(22,32,42,0.25)' }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.23,1,0.32,1] }}
              className="fixed inset-0 m-auto w-[420px] h-fit nd-card shadow-2xl z-[110]"
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50">
                <h3 className="font-display italic text-ink text-lg font-light">add a client</h3>
                <button onClick={() => setIsAdding(false)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <X className="w-4 h-4 text-muted" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="nd-label text-muted mb-1.5">client name</p>
                  <input type="text" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="e.g. bloom studio" className="nd-input text-sm" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="nd-label text-muted mb-1.5">role type</p>
                    <input type="text" value={newClient.type} onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}
                      placeholder="e.g. social media pa" className="nd-input text-sm" />
                  </div>
                  <div>
                    <p className="nd-label text-muted mb-1.5">rate</p>
                    <input type="text" value={newClient.rate} onChange={(e) => setNewClient({ ...newClient, rate: e.target.value })}
                      placeholder="e.g. £25/hr" className="nd-input text-sm font-mono" />
                  </div>
                </div>
                <div className="flex gap-2.5 pt-2">
                  <button onClick={() => setIsAdding(false)} className="nd-button-ghost flex-1 text-sm">cancel</button>
                  <button onClick={handleAdd} disabled={!newClient.name} className="nd-button flex-1 text-sm">add client</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
