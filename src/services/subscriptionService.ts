import { supabase } from '../lib/supabase';

export interface SubscriptionLimits {
  max_users: number;
  max_staff: number;
  max_tasks: number;
  current_users: number;
  current_staff: number;
  current_tasks: number;
}

export interface PracticeFeatures {
  reports: boolean;
  api_access: boolean;
  custom_branding: boolean;
}

export interface PracticeSubscription {
  id: string;
  name: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  is_active: boolean;
  limits: SubscriptionLimits;
  features: PracticeFeatures;
}

// Get current practice subscription details
export const getPracticeSubscription = async (practiceId: string): Promise<PracticeSubscription | null> => {
  try {
    // Get practice details with limits
    const { data: practice, error: practiceError } = await supabase
      .from('practices')
      .select('*')
      .eq('id', practiceId)
      .single();

    if (practiceError) {
      console.error('Error fetching practice:', practiceError);
      return null;
    }

    // Get current usage counts
    const [usersResult, staffResult, tasksResult] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('practice_id', practiceId),
      supabase.from('staff').select('id', { count: 'exact', head: true }).eq('practice_id', practiceId),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('practice_id', practiceId)
    ]);

    return {
      id: practice.id,
      name: practice.name,
      subscription_tier: practice.subscription_tier,
      is_active: practice.is_active,
      limits: {
        max_users: practice.max_users || 10,
        max_staff: practice.max_staff || 50,
        max_tasks: practice.max_tasks || 100,
        current_users: usersResult.count || 0,
        current_staff: staffResult.count || 0,
        current_tasks: tasksResult.count || 0,
      },
      features: practice.features || {
        reports: false,
        api_access: false,
        custom_branding: false
      }
    };
  } catch (error) {
    console.error('Error getting practice subscription:', error);
    return null;
  }
};

// Check if practice can add more users
export const canAddUser = async (practiceId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('can_add_user', {
      target_practice_id: practiceId
    });

    if (error) {
      console.error('Error checking user limit:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error checking user limit:', error);
    return false;
  }
};

// Check if practice can add more staff
export const canAddStaff = async (practiceId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('can_add_staff', {
      target_practice_id: practiceId
    });

    if (error) {
      console.error('Error checking staff limit:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error checking staff limit:', error);
    return false;
  }
};

// Check if practice has a specific feature
export const hasFeature = async (practiceId: string, featureName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('has_feature', {
      target_practice_id: practiceId,
      feature_name: featureName
    });

    if (error) {
      console.error('Error checking feature:', error);
      return false;
    }

    return data;
  } catch (error) {
    console.error('Error checking feature:', error);
    return false;
  }
};

// Get subscription tier limits (for display purposes)
export const getSubscriptionTierLimits = (tier: 'free' | 'basic' | 'premium'): { max_users: number; max_staff: number; max_tasks: number; features: PracticeFeatures } => {
  switch (tier) {
    case 'free':
      return {
        max_users: 5,
        max_staff: 25,
        max_tasks: 50,
        features: {
          reports: false,
          api_access: false,
          custom_branding: false
        }
      };
    case 'basic':
      return {
        max_users: 25,
        max_staff: 100,
        max_tasks: 250,
        features: {
          reports: true,
          api_access: false,
          custom_branding: false
        }
      };
    case 'premium':
      return {
        max_users: 100,
        max_staff: 500,
        max_tasks: 1000,
        features: {
          reports: true,
          api_access: true,
          custom_branding: true
        }
      };
    default:
      return getSubscriptionTierLimits('free');
  }
};

// Suspend practice (super admin only)
export const suspendPractice = async (practiceId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('suspend_practice', {
      target_practice_id: practiceId
    });

    if (error) {
      console.error('Error suspending practice:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error suspending practice:', error);
    throw error;
  }
};

// Reactivate practice (super admin only)
export const reactivatePractice = async (practiceId: string): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc('reactivate_practice', {
      target_practice_id: practiceId
    });

    if (error) {
      console.error('Error reactivating practice:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error('Error reactivating practice:', error);
    throw error;
  }
}; 