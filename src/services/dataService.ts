import { supabase } from '../lib/supabase';
import type { Task, Staff, CompetencyStatus } from '../types';

// Get current user's practice ID
const getCurrentPracticeId = async (): Promise<string | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userProfile } = await supabase
    .from('users')
    .select('practice_id')
    .eq('id', user.id)
    .single();

  return userProfile?.practice_id || null;
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  const practiceId = await getCurrentPracticeId();
  if (!practiceId) return [];

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('practice_id', practiceId);

  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  // Get competencies for all tasks
  const taskIds = tasks?.map(task => task.id) || [];
  const { data: competencies } = await supabase
    .from('competencies')
    .select(`
      *,
      staff:staff(name)
    `)
    .in('task_id', taskIds);

  // Transform to match your existing Task interface
  return tasks?.map(task => ({
    id: task.id,
    name: task.name,
    description: task.description,
    category: task.category as Task['category'],
    sopLink: task.sop_link,
    policyLink: task.policy_link,
    riskRating: task.risk_rating as Task['riskRating'],
    owner: task.owner,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
    competencies: competencies
      ?.filter(comp => comp.task_id === task.id)
      .map(comp => ({
        staffId: comp.staff_id,
        staffName: comp.staff?.name || 'Unknown',
        status: comp.status as CompetencyStatus,
        lastUpdated: new Date(comp.last_updated)
      })) || []
  })) || [];
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'competencies'>): Promise<Task | null> => {
  const practiceId = await getCurrentPracticeId();
  if (!practiceId) return null;

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      practice_id: practiceId,
      name: taskData.name,
      description: taskData.description,
      category: taskData.category,
      sop_link: taskData.sopLink,
      policy_link: taskData.policyLink,
      risk_rating: taskData.riskRating,
      owner: taskData.owner,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return null;
  }

  return {
    id: task.id,
    name: task.name,
    description: task.description,
    category: task.category as Task['category'],
    sopLink: task.sop_link,
    policyLink: task.policy_link,
    riskRating: task.risk_rating as Task['riskRating'],
    owner: task.owner,
    createdAt: new Date(task.created_at),
    updatedAt: new Date(task.updated_at),
    competencies: []
  };
};

export const updateTask = async (taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'competencies'>>): Promise<boolean> => {
  const { error } = await supabase
    .from('tasks')
    .update({
      name: updates.name,
      description: updates.description,
      category: updates.category,
      sop_link: updates.sopLink,
      policy_link: updates.policyLink,
      risk_rating: updates.riskRating,
      owner: updates.owner,
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task:', error);
    return false;
  }

  return true;
};

export const deleteTask = async (taskId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }

  return true;
};

// Staff
export const getStaff = async (): Promise<Staff[]> => {
  const practiceId = await getCurrentPracticeId();
  if (!practiceId) return [];

  const { data: staff, error } = await supabase
    .from('staff')
    .select('*')
    .eq('practice_id', practiceId);

  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }

  return staff?.map(member => ({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    department: member.department
  })) || [];
};

export const createStaff = async (staffData: Omit<Staff, 'id'>): Promise<Staff | null> => {
  const practiceId = await getCurrentPracticeId();
  if (!practiceId) return null;

  const { data: staff, error } = await supabase
    .from('staff')
    .insert({
      practice_id: practiceId,
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      department: staffData.department,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating staff:', error);
    return null;
  }

  return {
    id: staff.id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    department: staff.department
  };
};

// Competencies
export const updateCompetency = async (
  taskId: string, 
  staffId: string, 
  status: CompetencyStatus
): Promise<boolean> => {
  const practiceId = await getCurrentPracticeId();
  if (!practiceId) return false;

  const { error } = await supabase
    .from('competencies')
    .upsert({
      practice_id: practiceId,
      task_id: taskId,
      staff_id: staffId,
      status: status,
      last_updated: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating competency:', error);
    return false;
  }

  return true;
};

// Statements (global, no practice isolation needed)
export const getHarmony360Statements = async () => {
  const { data, error } = await supabase
    .from('harmony360_statements')
    .select('*');
  
  if (error) {
    console.error('Error fetching Harmony360 statements:', error);
    throw new Error(error.message);
  }
  return data;
};

// Dashboard stats
export const getDashboardStats = async () => {
  const practiceId = await getCurrentPracticeId();
  if (!practiceId) return null;

  // Get task counts
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, risk_rating')
    .eq('practice_id', practiceId);

  // Get competency stats
  const { data: competencies } = await supabase
    .from('competencies')
    .select('status')
    .eq('practice_id', practiceId);

  const totalTasks = tasks?.length || 0;
  const highRiskTasks = tasks?.filter(task => task.risk_rating === 'High').length || 0;
  
  const trainingRequired = competencies?.filter(
    comp => comp.status === 'Training Required' || comp.status === 'Re-Training Required'
  ).length || 0;

  const competentCount = competencies?.filter(comp => comp.status === 'Competent').length || 0;

  return {
    totalTasks,
    highRiskTasks,
    trainingRequired,
    competentCount
  };
};

// Super Admin Functions
export const getAllPractices = async () => {
  const { data, error } = await supabase
    .from('practices')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching all practices:', error);
    throw error;
  }

  return data;
};

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select(`
      *,
      practice:practices(*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }

  return data;
};

export const createPractice = async (practiceData: {
  name: string;
  email_domain: string;
  subscription_tier: 'free' | 'basic' | 'premium';
}) => {
  const { data, error } = await supabase
    .from('practices')
    .insert([{
      name: practiceData.name,
      email_domain: practiceData.email_domain,
      subscription_tier: practiceData.subscription_tier,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating practice:', error);
    throw error;
  }

  return data;
};

export const getPracticeById = async (practiceId: string) => {
  const { data, error } = await supabase
    .from('practices')
    .select('*')
    .eq('id', practiceId)
    .single();

  if (error) {
    console.error('Error fetching practice:', error);
    throw error;
  }

  return data;
};

export const updatePractice = async (practiceId: string, updates: {
  name?: string;
  email_domain?: string;
  subscription_tier?: 'free' | 'basic' | 'premium';
}) => {
  const { data, error } = await supabase
    .from('practices')
    .update(updates)
    .eq('id', practiceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating practice:', error);
    throw error;
  }

  return data;
};

export const createUser = async (userData: {
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'manager' | 'super_admin';
  practice_id: string;
}) => {
  console.log('createUser called with data:', userData);
  
  try {
    // Generate a UUID for the user
    // We'll use a temporary UUID that will be replaced when they actually sign up
    const tempUserId = crypto.randomUUID();
    
    console.log('Generated temp user ID:', tempUserId);

    // Create the user record in public.users
    // When the user signs up later, the trigger will update this record with their real auth ID
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert({
        id: tempUserId,
        email: userData.email.toLowerCase(),
        name: userData.name,
        role: userData.role,
        practice_id: userData.practice_id,
        // Add a flag to indicate this is a pre-created user awaiting signup
        created_by_admin: true
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    console.log('User record created successfully:', userRecord);
    return userRecord;

  } catch (error) {
    console.error('Error in createUser:', error);
    throw error;
  }
};

export const getGlobalStats = async () => {
  try {
    // Get all practices count
    const { count: practicesCount } = await supabase
      .from('practices')
      .select('*', { count: 'exact', head: true });

    // Get all users count
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get all tasks count
    const { count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    // Get all staff count
    const { count: staffCount } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true });

    return {
      totalPractices: practicesCount || 0,
      totalUsers: usersCount || 0,
      totalTasks: tasksCount || 0,
      totalStaff: staffCount || 0,
    };
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return {
      totalPractices: 0,
      totalUsers: 0,
      totalTasks: 0,
      totalStaff: 0,
    };
  }
}; 