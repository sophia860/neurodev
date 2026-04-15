import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PoundSterling, TrendingUp, Clock, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Plus, ArrowUpRight, Download, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Invoice } from '../types';
import { db, useAuth, handleFirestoreError, OperationType, collection, onSnapshot, query, addDoc, serverTimestamp, doc, updateDoc } from '../services/firebase';

export default function IncomeTracker() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ clientName: '', amount: '', status: 'pending' as const });
  
  const goal = 5000;

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/invoices`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      setInvoices(docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddInvoice = async () => {
    if (!user || !newInvoice.clientName || !newInvoice.amount) return;

    const path = `users/${user.uid}/invoices`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        clientName: newInvoice.clientName,
        amount: parseFloat(newInvoice.amount),
        date: new Date().toISOString(),
        status: newInvoice.status
      });
      setIsAdding(false);
      setNewInvoice({ clientName: '', amount: '', status: 'pending' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const toggleStatus = async (invoice: Invoice) => {
    if (!user) return;
    const path = `users/${user.uid}/invoices/${invoice.id}`;
    try {
      await updateDoc(doc(db, path), {
        status: invoice.status === 'paid' ? 'pending' : 'paid'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const invoicedTotal = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const receivedTotal = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingTotal = invoicedTotal - receivedTotal;
  const progress = goal > 0 ? (invoicedTotal / goal) * 100 : 0;

  return (
    <div className="h-full flex flex-col space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-6xl font-display font-bold text-deep-plum tracking-tighter">income</h2>
          <p className="text-soft-grey italic text-lg font-display">tracking your wins, one invoice at a time.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="florr-button flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>new invoice</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="florr-card p-8 bg-sage-mist/20 border-sage-mist/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/60 rounded-2xl">
              <PoundSterling className="w-6 h-6 text-forest-green" />
            </div>
            <span className="text-[9px] font-bold text-forest-green uppercase tracking-widest font-mono">this month</span>
          </div>
          <h3 className="text-4xl font-display font-bold text-forest-green tracking-tight">£{invoicedTotal.toLocaleString()}</h3>
          <p className="text-xs text-forest-green/60 mt-2 italic font-display">total invoiced so far</p>
        </div>

        <div className="florr-card p-8 bg-dusty-blush/20 border-dusty-blush/40">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/60 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-deep-plum" />
            </div>
            <span className="text-[9px] font-bold text-deep-plum uppercase tracking-widest font-mono">received</span>
          </div>
          <h3 className="text-4xl font-display font-bold text-deep-plum tracking-tight">£{receivedTotal.toLocaleString()}</h3>
          <p className="text-xs text-deep-plum/60 mt-2 italic font-display">{invoicedTotal > 0 ? Math.round((receivedTotal/invoicedTotal)*100) : 0}% of total</p>
        </div>

        <div className="florr-card p-8 bg-terracotta/10 border-terracotta/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white/60 rounded-2xl">
              <Clock className="w-6 h-6 text-terracotta" />
            </div>
            <span className="text-[9px] font-bold text-terracotta uppercase tracking-widest font-mono">pending</span>
          </div>
          <h3 className="text-4xl font-display font-bold text-terracotta tracking-tight">£{pendingTotal.toLocaleString()}</h3>
          <p className="text-xs text-terracotta/60 mt-2 italic font-display">{invoices.filter(i => i.status === 'pending').length} outstanding</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6 overflow-hidden">
          <div className="florr-card p-0 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-black/5 bg-white/40 flex items-center justify-between">
              <h3 className="text-xl font-bold text-deep-plum font-display italic">invoice history</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-black/5 rounded-xl transition-colors text-soft-grey"><Download className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              <div className="grid grid-cols-4 text-[9px] font-bold text-soft-grey uppercase tracking-widest px-4 mb-2 font-mono">
                <span>client</span>
                <span>amount</span>
                <span>date</span>
                <span>status</span>
              </div>
              {invoices.length === 0 ? (
                <div className="p-12 text-center opacity-30 italic font-display">no invoices yet.</div>
              ) : (
                invoices.map((inv) => (
                  <div key={inv.id} className="grid grid-cols-4 items-center p-4 bg-white/60 rounded-2xl border border-black/5 hover:border-deep-plum/20 transition-all group">
                    <span className="text-sm font-bold text-dark-text tracking-tight">{inv.clientName}</span>
                    <span className="text-sm font-mono text-dark-text">£{inv.amount.toLocaleString()}</span>
                    <span className="text-[10px] text-soft-grey font-mono">{new Date(inv.date).toLocaleDateString()}</span>
                    <div>
                      <button 
                        onClick={() => toggleStatus(inv)}
                        className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono transition-colors",
                          inv.status === 'paid' ? "bg-sage-mist/30 text-forest-green" : "bg-terracotta/10 text-terracotta"
                        )}
                      >
                        {inv.status}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="florr-card p-8 space-y-8">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-deep-plum font-display italic">goal tracker</h3>
              <p className="text-xs text-soft-grey italic font-display">aiming for £{goal.toLocaleString()} this month</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-4xl font-display font-bold text-deep-plum">{Math.round(progress)}%</span>
                <span className="text-[10px] font-mono text-soft-grey">£{invoicedTotal.toLocaleString()} / £{goal.toLocaleString()}</span>
              </div>
              <div className="h-3 bg-black/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-deep-plum"
                />
              </div>
            </div>

            <div className="p-6 bg-sage-mist/20 rounded-3xl border border-sage-mist/30 space-y-4">
              <div className="flex items-center gap-2 text-forest-green">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[9px] font-bold uppercase tracking-widest font-mono">insight</span>
              </div>
              <p className="text-sm text-forest-green/80 leading-relaxed font-light">
                {invoicedTotal >= goal ? (
                  "you've hit your goal! incredible work protecting your energy while winning."
                ) : (
                  <>you need <strong className="text-forest-green font-medium">£{(goal - invoicedTotal).toLocaleString()} more</strong> to hit your goal. keep going at your own pace.</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 bg-deep-plum/40 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-[450px] h-fit glass-panel shadow-2xl z-[110] p-10 space-y-8"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-3xl font-display font-bold text-deep-plum italic">new invoice</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">client name</label>
                  <input
                    type="text"
                    value={newInvoice.clientName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, clientName: e.target.value })}
                    placeholder="e.g., bloom studio"
                    className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-lg focus:ring-2 focus:ring-deep-plum/10 transition-all font-display italic"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">amount (£)</label>
                    <input
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-deep-plum/10 transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">status</label>
                    <select
                      value={newInvoice.status}
                      onChange={(e) => setNewInvoice({ ...newInvoice, status: e.target.value as 'pending' | 'paid' })}
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-deep-plum/10 transition-all font-mono uppercase tracking-widest"
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-black/5 text-soft-grey rounded-2xl font-bold hover:bg-black/10 transition-all font-mono uppercase tracking-widest text-[10px]"
                >
                  cancel
                </button>
                <button 
                  onClick={handleAddInvoice}
                  className="flex-1 florr-button py-4 text-lg"
                >
                  create
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
