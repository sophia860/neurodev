import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PoundSterling, TrendingUp, Clock, CircleCheck as CheckCircle2, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Invoice } from '../types';
import { db, useAuth, handleFirestoreError, OperationType, collection, onSnapshot, query, addDoc, doc, updateDoc } from '../services/firebase';

export default function IncomeTracker() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ clientName: '', amount: '', status: 'pending' as const });
  const goal = 5000;

  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/invoices`;
    const unsubscribe = onSnapshot(query(collection(db, path)), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Invoice[];
      setInvoices(docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (e) => handleFirestoreError(e, OperationType.LIST, path));
    return () => unsubscribe();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !newInvoice.clientName || !newInvoice.amount) return;
    const path = `users/${user.uid}/invoices`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid, clientName: newInvoice.clientName,
        amount: parseFloat(newInvoice.amount), date: new Date().toISOString(), status: newInvoice.status
      });
      setIsAdding(false);
      setNewInvoice({ clientName: '', amount: '', status: 'pending' });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  };

  const toggleStatus = async (inv: Invoice) => {
    if (!user) return;
    const path = `users/${user.uid}/invoices/${inv.id}`;
    try { await updateDoc(doc(db, path), { status: inv.status === 'paid' ? 'pending' : 'paid' }); }
    catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  };

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const received = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const pending = total - received;
  const progress = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display font-light text-4xl text-ink mb-1.5">income.</h2>
          <p className="text-soft-grey italic font-display font-light">tracking your wins, one invoice at a time.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="nd-button text-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> new invoice
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'total invoiced', value: `£${total.toLocaleString()}`, sub: 'this month', color: 'var(--color-teal)', bg: 'rgba(30,122,110,0.06)', icon: PoundSterling },
          { label: 'received', value: `£${received.toLocaleString()}`, sub: `${total > 0 ? Math.round((received/total)*100) : 0}% of total`, color: 'var(--color-success)', bg: 'rgba(45,122,74,0.06)', icon: CheckCircle2 },
          { label: 'pending', value: `£${pending.toLocaleString()}`, sub: `${invoices.filter(i=>i.status==='pending').length} outstanding`, color: 'var(--color-warning)', bg: 'rgba(196,134,10,0.06)', icon: Clock },
        ].map(({ label, value, sub, color, bg, icon: Icon }) => (
          <div key={label} className="nd-card p-5" style={{ background: bg, borderColor: `${color}22` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 rounded-xl border border-border/50 bg-white/50">
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <span className="nd-label" style={{ color }}>{label}</span>
            </div>
            <p className="font-display font-light text-3xl text-ink tracking-tight mb-1">{value}</p>
            <p className="text-[11px] text-muted font-light">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="nd-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-display italic text-ink text-base">invoice history</h3>
              <span className="nd-label text-muted">{invoices.length} invoices</span>
            </div>
            <div className="divide-y divide-border/40">
              {invoices.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-soft-grey text-sm font-display italic font-light">no invoices yet.</p>
                </div>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/30 transition-colors group">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">{inv.clientName}</p>
                      <p className="nd-label text-muted">{new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className="font-mono text-sm font-bold text-ink">£{inv.amount.toLocaleString()}</span>
                    <button
                      onClick={() => toggleStatus(inv)}
                      className="nd-badge px-3 py-1.5 rounded-full text-[10px] transition-all"
                      style={inv.status === 'paid'
                        ? { background: 'rgba(45,122,74,0.1)', color: 'var(--color-success)' }
                        : { background: 'rgba(196,134,10,0.1)', color: 'var(--color-warning)' }
                      }
                    >
                      {inv.status}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="nd-card p-6 space-y-6">
            <div>
              <h3 className="font-display italic text-ink text-base mb-0.5">goal tracker</h3>
              <p className="text-[11px] text-muted font-light">£{goal.toLocaleString()} / month</p>
            </div>

            <div>
              <div className="flex items-end justify-between mb-3">
                <span className="font-display font-light text-3xl text-ink">{Math.round(progress)}%</span>
                <span className="nd-label text-muted">£{total.toLocaleString()} / £{goal.toLocaleString()}</span>
              </div>
              <div className="energy-bar" style={{ height: '6px' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: 'var(--color-teal)' }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-sage/50" style={{ background: 'rgba(208,228,210,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: 'var(--color-teal)' }} />
                <span className="nd-label" style={{ color: 'var(--color-teal)' }}>insight</span>
              </div>
              <p className="text-[12px] text-soft-grey leading-relaxed font-light">
                {total >= goal
                  ? "you've hit your goal. that's real."
                  : <>you need <strong className="text-ink font-medium">£{(goal - total).toLocaleString()} more</strong> to hit your goal. keep going at your own pace.</>
                }
              </p>
            </div>
          </div>
        </div>
      </div>

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
                <div>
                  <h3 className="font-display italic text-ink text-lg font-light">new invoice</h3>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <X className="w-4 h-4 text-muted" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="nd-label text-muted mb-1.5">client name</p>
                  <input type="text" value={newInvoice.clientName} onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                    placeholder="e.g. bloom studio" className="nd-input text-sm" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="nd-label text-muted mb-1.5">amount (£)</p>
                    <input type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      placeholder="0.00" className="nd-input text-sm font-mono" />
                  </div>
                  <div>
                    <p className="nd-label text-muted mb-1.5">status</p>
                    <select value={newInvoice.status} onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value as 'pending' | 'paid' })}
                      className="nd-input text-sm">
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button onClick={() => setIsAdding(false)} className="nd-button-ghost flex-1 text-sm">cancel</button>
                  <button onClick={handleAdd} disabled={!newInvoice.clientName || !newInvoice.amount} className="nd-button flex-1 text-sm">create invoice</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
