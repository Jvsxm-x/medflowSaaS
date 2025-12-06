
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

type PlanType = 'free' | 'pro' | 'enterprise';

interface SaaSContextType {
  currentPlan: PlanType;
  storageUsed: number; // in bytes
  storageLimit: number; // in bytes
  usagePercentage: number;
  uploadFile: (size: number) => boolean; // Returns false if full
  deleteFile: (size: number) => void;
  upgradePlan: (plan: PlanType) => void;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

const PLANS = {
  free: 50 * 1024 * 1024, // 50MB
  pro: 1 * 1024 * 1024 * 1024, // 1GB
  enterprise: 10 * 1024 * 1024 * 1024, // 10GB
};

export const SaaSProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('free');
  const [storageUsed, setStorageUsed] = useState(0);

  // Load SaaS state from local storage (Simulating Backend SaaS DB)
  useEffect(() => {
    if (user) {
      const savedPlan = localStorage.getItem(`saas_plan_${user.username}`) as PlanType;
      const savedUsage = localStorage.getItem(`saas_usage_${user.username}`);
      
      if (savedPlan) setCurrentPlan(savedPlan);
      if (savedUsage) setStorageUsed(parseInt(savedUsage));
    }
  }, [user]);

  const storageLimit = PLANS[currentPlan];
  const usagePercentage = Math.min(100, (storageUsed / storageLimit) * 100);

  const saveState = (newUsage: number, plan: PlanType) => {
    if (user) {
      localStorage.setItem(`saas_usage_${user.username}`, newUsage.toString());
      localStorage.setItem(`saas_plan_${user.username}`, plan);
    }
  };

  const uploadFile = (size: number): boolean => {
    if (storageUsed + size > storageLimit) {
      return false; // Storage full
    }
    const newUsage = storageUsed + size;
    setStorageUsed(newUsage);
    saveState(newUsage, currentPlan);
    return true;
  };

  const deleteFile = (size: number) => {
    const newUsage = Math.max(0, storageUsed - size);
    setStorageUsed(newUsage);
    saveState(newUsage, currentPlan);
  };

  const upgradePlan = (plan: PlanType) => {
    setCurrentPlan(plan);
    saveState(storageUsed, plan);
  };

  return (
    <SaaSContext.Provider value={{
      currentPlan,
      storageUsed,
      storageLimit,
      usagePercentage,
      uploadFile,
      deleteFile,
      upgradePlan
    }}>
      {children}
    </SaaSContext.Provider>
  );
};

export const useSaaS = () => {
  const context = useContext(SaaSContext);
  if (!context) throw new Error('useSaaS must be used within a SaaSProvider');
  return context;
};
