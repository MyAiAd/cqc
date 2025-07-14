import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create a default/dummy client if environment variables are missing
// This allows the app to load and show proper error messages
let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseKey || 
    supabaseUrl === 'your_supabase_project_url_here' || 
    supabaseKey === 'your_supabase_anon_key_here') {
  console.warn('Supabase environment variables are missing or not configured properly');
  // Create a dummy client with placeholder values to prevent immediate errors
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      // More aggressive session persistence
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Use PKCE flow for better security
      flowType: 'pkce',
      // Use localStorage for session storage
      storage: window.localStorage,
      // Disable debug to reduce noise
      debug: false,
      // More aggressive session refresh - refresh before expiry
      storageKey: 'supabase.auth.token'
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    },
    // Reduce the frequency of real-time connection attempts
    realtime: {
      params: {
        eventsPerSecond: 2
      }
    }
  });
}

export { supabase };

// Database types
export interface Database {
  public: {
    Tables: {
      practices: {
        Row: {
          id: string
          name: string
          email_domain: string
          subscription_tier: 'free' | 'basic' | 'premium'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email_domain: string
          subscription_tier?: 'free' | 'basic' | 'premium'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email_domain?: string
          subscription_tier?: 'free' | 'basic' | 'premium'
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          practice_id: string
          email: string
          name: string
          role: 'admin' | 'staff' | 'manager' | 'super_admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          practice_id: string
          email: string
          name: string
          role?: 'admin' | 'staff' | 'manager' | 'super_admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          email?: string
          name?: string
          role?: 'admin' | 'staff' | 'manager' | 'super_admin'
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          practice_id: string
          name: string
          email: string | null
          role: string | null
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          name: string
          email?: string | null
          role?: string | null
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          name?: string
          email?: string | null
          role?: string | null
          department?: string | null
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          practice_id: string
          name: string
          description: string
          category: 'Continuous' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'
          sop_link: string | null
          policy_link: string | null
          sop_document_id: string | null
          policy_document_id: string | null
          risk_rating: 'Low' | 'Medium-Low' | 'Medium' | 'Medium-High' | 'High'
          owner: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          name: string
          description: string
          category: 'Continuous' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'
          sop_link?: string | null
          policy_link?: string | null
          sop_document_id?: string | null
          policy_document_id?: string | null
          risk_rating?: 'Low' | 'Medium-Low' | 'Medium' | 'Medium-High' | 'High'
          owner?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          name?: string
          description?: string
          category?: 'Continuous' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly'
          sop_link?: string | null
          policy_link?: string | null
          sop_document_id?: string | null
          policy_document_id?: string | null
          risk_rating?: 'Low' | 'Medium-Low' | 'Medium' | 'Medium-High' | 'High'
          owner?: string | null
          updated_at?: string
        }
      }
      competencies: {
        Row: {
          id: string
          practice_id: string
          task_id: string
          staff_id: string
          status: 'Competent' | 'Training Required' | 'Re-Training Required' | 'Trained awaiting sign off' | 'Not Applicable'
          last_updated: string
          created_at: string
        }
        Insert: {
          id?: string
          practice_id: string
          task_id: string
          staff_id: string
          status: 'Competent' | 'Training Required' | 'Re-Training Required' | 'Trained awaiting sign off' | 'Not Applicable'
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          practice_id?: string
          task_id?: string
          staff_id?: string
          status?: 'Competent' | 'Training Required' | 'Re-Training Required' | 'Trained awaiting sign off' | 'Not Applicable'
          last_updated?: string
        }
      }
    }
  }
} 