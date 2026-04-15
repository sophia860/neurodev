import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Battery, BatteryLow, BatteryMedium, BatteryFull, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType, useAuth, doc, updateDoc } from '../services/firebase';

export default function EnergyTracker({ currentEnergy = 100 }: { currentEnergy?: number }) {
  const { user } = useAuth();
  const [selectedEnergy, setSelectedEnergy] = useState(currentEnergy);
  const [isUpdating, setIsUpdating] = useState(false);

  const energyLevels = [
    { value: 20, label: 'running on fumes', icon: BatteryLow, color: 'text-terracotta', bg: 'bg-terracotta/10' },
    { value: 50, label: 'getting by', icon: BatteryMedium, color: 'text-soft-grey', bg: 'bg-soft-grey/10' },
    { value: 80, label: 'feeling okay', icon: BatteryFull, color: 'text-forest-green', bg: 'bg-forest-green/10' },
    { value: 100, label: 'fully charged', icon: Zap, color: 'text-deep-plum', bg: 'bg-deep-plum/10' },
  ];

  const handleUpdateEnergy = async (value: number) => {
    if (!user || isUpdating) return;
    setIsUpdating(true);
    setSelectedEnergy(value);
    
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, path), {
        energyLevel: value,
        lastCheckIn: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="florr-card p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sage-mist/30 text-forest-green rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-deep-plum font-display italic">energy tracker</h3>
        </div>
        <span className="text-[9px] font-mono text-soft-grey uppercase tracking-widest">current: {currentEnergy}%</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {energyLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => handleUpdateEnergy(level.value)}
            disabled={isUpdating}
            className={cn(
              "p-4 rounded-2xl border transition-all flex flex-col items-center gap-3 text-center",
              selectedEnergy === level.value 
                ? `${level.bg} border-transparent shadow-inner` 
                : "bg-white/40 border-black/5 hover:bg-white/60"
            )}
          >
            <level.icon className={cn("w-6 h-6", level.color)} />
            <div className="space-y-1">
              <p className={cn("text-[9px] font-bold uppercase tracking-widest font-mono", level.color)}>
                {level.value}%
              </p>
              <p className="text-[10px] text-soft-grey font-medium leading-tight font-display italic">
                {level.label}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-black/5">
        <p className="text-xs text-soft-grey italic leading-relaxed font-display">
          flo uses this to suggest tasks that match your current capacity. no pressure to be at 100%.
        </p>
      </div>
    </div>
  );
}
