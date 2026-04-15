import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType, useAuth, doc, updateDoc } from '../services/firebase';

const levels = [
  { value: 20, label: 'fumes', desc: 'running on empty', icon: BatteryLow, color: 'var(--color-amber)', bg: 'rgba(184,112,48,0.08)' },
  { value: 50, label: 'okay', desc: 'getting by', icon: BatteryMedium, color: 'var(--color-warning)', bg: 'rgba(196,134,10,0.08)' },
  { value: 80, label: 'good', desc: 'feeling capable', icon: BatteryFull, color: 'var(--color-teal)', bg: 'rgba(30,122,110,0.08)' },
  { value: 100, label: 'charged', desc: 'fully ready', icon: Zap, color: 'var(--color-teal-mid)', bg: 'rgba(46,148,134,0.1)' },
];

export default function EnergyTracker({ currentEnergy = 100 }: { currentEnergy?: number }) {
  const { user } = useAuth();
  const [selectedEnergy, setSelectedEnergy] = useState(currentEnergy);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (value: number) => {
    if (!user || isUpdating) return;
    setIsUpdating(true);
    setSelectedEnergy(value);
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, path), { energyLevel: value, lastCheckIn: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="nd-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display italic text-ink text-base">energy</h3>
        <span className="nd-label text-muted">{currentEnergy}% now</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {levels.map((level) => {
          const active = selectedEnergy === level.value;
          return (
            <button
              key={level.value}
              onClick={() => handleUpdate(level.value)}
              disabled={isUpdating}
              className={cn(
                "p-3.5 rounded-xl border text-left transition-all",
                active ? "border-transparent" : "border-border/60 hover:border-border"
              )}
              style={active ? { background: level.bg, borderColor: 'transparent' } : { background: 'rgba(255,255,255,0.4)' }}
            >
              <level.icon className="w-4 h-4 mb-2" style={{ color: level.color }} />
              <p className="text-xs font-medium text-ink">{level.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: level.color }}>{level.desc}</p>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted leading-relaxed font-light italic font-display">
        flo uses this to match tasks to your capacity. no pressure to be at 100.
      </p>
    </div>
  );
}
