import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getPracticeSubscription, 
  PracticeSubscription,
  canAddUser,
  canAddStaff,
  hasFeature
} from '../services/subscriptionService';

interface SubscriptionContextType {
  subscription: PracticeSubscription | null;
  loading: boolean;
  error: string | null;
  canAddUser: () => Promise<boolean>;
  canAddStaff: () => Promise<boolean>;
  hasFeature: (featureName: string) => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  isAtLimit: (type: 'users' | 'staff' | 'tasks') => boolean;
  getUsagePercentage: (type: 'users' | 'staff' | 'tasks') => number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [subscription, setSubscription] = useState<PracticeSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!userProfile?.practice_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const subscriptionData = await getPracticeSubscription(userProfile.practice_id);
      setSubscription(subscriptionData);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [userProfile?.practice_id]);

  const checkCanAddUser = async (): Promise<boolean> => {
    if (!userProfile?.practice_id) return false;
    return await canAddUser(userProfile.practice_id);
  };

  const checkCanAddStaff = async (): Promise<boolean> => {
    if (!userProfile?.practice_id) return false;
    return await canAddStaff(userProfile.practice_id);
  };

  const checkHasFeature = async (featureName: string): Promise<boolean> => {
    if (!userProfile?.practice_id) return false;
    return await hasFeature(userProfile.practice_id, featureName);
  };

  const isAtLimit = (type: 'users' | 'staff' | 'tasks'): boolean => {
    if (!subscription) return false;
    
    switch (type) {
      case 'users':
        return subscription.limits.current_users >= subscription.limits.max_users;
      case 'staff':
        return subscription.limits.current_staff >= subscription.limits.max_staff;
      case 'tasks':
        return subscription.limits.current_tasks >= subscription.limits.max_tasks;
      default:
        return false;
    }
  };

  const getUsagePercentage = (type: 'users' | 'staff' | 'tasks'): number => {
    if (!subscription) return 0;
    
    switch (type) {
      case 'users':
        return Math.round((subscription.limits.current_users / subscription.limits.max_users) * 100);
      case 'staff':
        return Math.round((subscription.limits.current_staff / subscription.limits.max_staff) * 100);
      case 'tasks':
        return Math.round((subscription.limits.current_tasks / subscription.limits.max_tasks) * 100);
      default:
        return 0;
    }
  };

  const value: SubscriptionContextType = {
    subscription,
    loading,
    error,
    canAddUser: checkCanAddUser,
    canAddStaff: checkCanAddStaff,
    hasFeature: checkHasFeature,
    refreshSubscription: fetchSubscription,
    isAtLimit,
    getUsagePercentage,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 