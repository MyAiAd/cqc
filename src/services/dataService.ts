import { supabase } from '../lib/supabase';
import type { Task, Staff, CompetencyStatus } from '../types';

// Get current user's practice ID
const getCurrentPracticeId = async (): Promise<string | null> => {
  console.log('=== GET CURRENT PRACTICE ID DEBUG ===');
  
  try {
    console.log('Step 1: Getting current user from Supabase auth...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Auth user result:', user ? { id: user.id, email: user.email } : null);
    
    if (!user) {
      console.log('ERROR: No authenticated user found');
      return null;
    }

    console.log('Step 2: Fetching user profile from database...');
    const { data: userProfile, error } = await supabase
      .from('users')
      .select('practice_id, role, email, name')
      .eq('id', user.id)
      .single();

    console.log('User profile query result:', userProfile);
    console.log('User profile query error:', error);

    if (error) {
      console.error('ERROR fetching user profile:', error);
      return null;
    }

    if (!userProfile) {
      console.log('ERROR: No user profile found in database');
      return null;
    }

    console.log('User profile data:', {
      practice_id: userProfile.practice_id,
      role: userProfile.role,
      email: userProfile.email,
      name: userProfile.name
    });

    const result = userProfile?.practice_id || null;
    console.log('Final practice_id result:', result);
    console.log('=== GET CURRENT PRACTICE ID COMPLETE ===');
    
    return result;
  } catch (error) {
    console.error('=== GET CURRENT PRACTICE ID ERROR ===');
    console.error('Error details:', error);
    return null;
  }
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    // Get current user to check if they're super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found for getTasks');
      return [];
    }

    console.log('Step 1: Checking user role for tasks...');
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('practice_id, role, email, name')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile for tasks:', userError);
      return [];
    }

    const isSuperAdmin = userProfile?.role === 'super_admin';
    console.log('User profile for tasks:', userProfile);
    console.log('Is super admin for tasks?', isSuperAdmin);

    let query = supabase.from('tasks').select(`
      *,
      practice:practices(id, name, email_domain)
    `);

    if (isSuperAdmin) {
      console.log('Super admin detected - fetching tasks from ALL practices');
      // Super admin sees all tasks from all practices
      query = query.order('created_at', { ascending: false });
    } else {
      console.log('Regular user - fetching tasks from their practice only');
      // Regular users only see tasks from their practice
      const practiceId = userProfile?.practice_id;
      if (!practiceId) {
        console.log('No practice ID found for regular user');
        return [];
      }
      query = query.eq('practice_id', practiceId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    console.log('Tasks fetched:', tasks?.length || 0);

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
    const result = tasks?.map(task => ({
      id: task.id,
      name: task.name,
      description: task.description,
      category: task.category as Task['category'],
      sopLink: task.sop_link,
      policyLink: task.policy_link,
      sopDocumentId: task.sop_document_id,
      policyDocumentId: task.policy_document_id,
      riskRating: task.risk_rating as Task['riskRating'],
      owner: task.owner,
      createdAt: new Date(task.created_at),
      updatedAt: new Date(task.updated_at),
      // Add practice information for super admin
      ...(isSuperAdmin && task.practice ? {
        practiceName: task.practice.name,
        practiceId: task.practice.id
      } : {}),
      competencies: competencies
        ?.filter(comp => comp.task_id === task.id)
        .map(comp => ({
          staffId: comp.staff_id,
          staffName: comp.staff?.name || 'Unknown',
          status: comp.status as CompetencyStatus,
          lastUpdated: new Date(comp.last_updated)
        })) || []
    })) || [];

    console.log('Processed tasks count:', result.length);
    return result;

  } catch (error) {
    console.error('Error in getTasks:', error);
    return [];
  }
};

export const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'competencies'>, practice_id?: string): Promise<Task | null> => {
  console.log('=== CREATE TASK SERVICE DEBUG START ===');
  console.log('Input taskData:', taskData);
  console.log('Input practice_id:', practice_id);
  
  try {
    // Use provided practice_id (for super admin) or get current user's practice_id
    let targetPracticeId = practice_id;
    
    console.log('Step 1: Determining target practice ID for task...');
    console.log('Provided practice_id:', practice_id);
    
    if (!targetPracticeId) {
      console.log('No practice_id provided, getting current user practice...');
      const currentPracticeId = await getCurrentPracticeId();
      console.log('getCurrentPracticeId result for task:', currentPracticeId);
      if (!currentPracticeId) {
        console.log('ERROR: getCurrentPracticeId returned null for task');
        return null;
      }
      targetPracticeId = currentPracticeId;
    }
    
    console.log('Final targetPracticeId for task:', targetPracticeId);
    
    console.log('Step 2: Preparing task data for database insertion...');
    const insertData = {
      practice_id: targetPracticeId,
      name: taskData.name,
      description: taskData.description,
      category: taskData.category,
      sop_link: taskData.sopLink,
      policy_link: taskData.policyLink,
      sop_document_id: taskData.sopDocumentId,
      policy_document_id: taskData.policyDocumentId,
      risk_rating: taskData.riskRating,
      owner: taskData.owner,
    };
    console.log('Task data to insert:', insertData);

    console.log('Step 3: Executing Supabase task insert...');
    const { data: task, error } = await supabase
      .from('tasks')
      .insert(insertData)
      .select()
      .single();

    console.log('Step 4: Supabase task response...');
    console.log('Supabase task data:', task);
    console.log('Supabase task error:', error);

    if (error) {
      console.error('=== SUPABASE TASK ERROR DETAILS ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Full error object:', error);
      return null;
    }

    if (!task) {
      console.log('WARNING: No error but no task data returned');
      return null;
    }

    console.log('Step 5: Transforming task result...');
    const result = {
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

    console.log('Final task result:', result);
    console.log('=== CREATE TASK SERVICE SUCCESS ===');
    return result;

  } catch (error) {
    console.error('=== CREATE TASK SERVICE ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Full error object:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
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
      sop_document_id: updates.sopDocumentId,
      policy_document_id: updates.policyDocumentId,
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
  console.log('=== GET STAFF DEBUG START ===');
  
  try {
    // Get current user to check if they're super admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user found');
      return [];
    }

    console.log('Step 1: Checking user role...');
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('practice_id, role, email, name')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return [];
    }

    console.log('User profile:', userProfile);
    const isSuperAdmin = userProfile?.role === 'super_admin';
    console.log('Is super admin?', isSuperAdmin);

    let query = supabase.from('staff').select(`
      *,
      practice:practices(id, name, email_domain)
    `);

    if (isSuperAdmin) {
      console.log('Super admin detected - fetching staff from ALL practices');
      // Super admin sees all staff from all practices
      query = query.order('created_at', { ascending: false });
    } else {
      console.log('Regular user - fetching staff from their practice only');
      // Regular users only see staff from their practice
      const practiceId = userProfile?.practice_id;
      if (!practiceId) {
        console.log('No practice ID found for regular user');
        return [];
      }
      query = query.eq('practice_id', practiceId);
    }

    const { data: staff, error } = await query;

    if (error) {
      console.error('Error fetching staff:', error);
      return [];
    }

    console.log('Step 2: Staff query results...');
    console.log('Total staff found:', staff?.length || 0);
    if (isSuperAdmin) {
      console.log('Staff by practice:');
      const staffByPractice = staff?.reduce((acc, member) => {
        const practiceName = member.practice?.name || 'Unknown Practice';
        if (!acc[practiceName]) acc[practiceName] = 0;
        acc[practiceName]++;
        return acc;
      }, {} as Record<string, number>);
      console.log(staffByPractice);
    }

    const result = staff?.map(member => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      department: member.department,
      // Add practice information for super admin
      ...(isSuperAdmin && member.practice ? {
        practiceName: member.practice.name,
        practiceId: member.practice.id
      } : {})
    })) || [];

    console.log('Step 3: Final processed results...');
    console.log('Processed staff count:', result.length);
    console.log('=== GET STAFF DEBUG END ===');
    
    return result;

  } catch (error) {
    console.error('=== GET STAFF ERROR ===');
    console.error('Error details:', error);
    return [];
  }
};

export const createStaff = async (staffData: Omit<Staff, 'id'>, practice_id?: string): Promise<Staff | null> => {
  console.log('=== CREATE STAFF SERVICE DEBUG START ===');
  console.log('Input staffData:', staffData);
  console.log('Input practice_id:', practice_id);
  
  try {
    // Use provided practice_id (for super admin) or get current user's practice_id
    let targetPracticeId = practice_id;
    
    console.log('Step 1: Determining target practice ID...');
    console.log('Provided practice_id:', practice_id);
    
    if (!targetPracticeId) {
      console.log('No practice_id provided, getting current user practice...');
      const currentPracticeId = await getCurrentPracticeId();
      console.log('getCurrentPracticeId result:', currentPracticeId);
      if (!currentPracticeId) {
        console.log('ERROR: getCurrentPracticeId returned null');
        return null;
      }
      targetPracticeId = currentPracticeId;
    }
    
    console.log('Final targetPracticeId:', targetPracticeId);
    
    console.log('Step 2: Preparing data for database insertion...');
    const insertData = {
      practice_id: targetPracticeId,
      name: staffData.name,
      email: staffData.email,
      role: staffData.role,
      department: staffData.department,
    };
    console.log('Data to insert:', insertData);

    console.log('Step 3: Executing Supabase insert...');
    const { data: staff, error } = await supabase
      .from('staff')
      .insert(insertData)
      .select()
      .single();

    console.log('Step 4: Supabase response...');
    console.log('Supabase data:', staff);
    console.log('Supabase error:', error);

    if (error) {
      console.error('=== SUPABASE ERROR DETAILS ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Full error object:', error);
      return null;
    }

    if (!staff) {
      console.log('WARNING: No error but no staff data returned');
      return null;
    }

    console.log('Step 5: Transforming result...');
    const result = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      department: staff.department
    };
    
    console.log('Final result:', result);
    console.log('=== CREATE STAFF SERVICE SUCCESS ===');
    return result;

  } catch (error) {
    console.error('=== CREATE STAFF SERVICE ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : error);
    console.error('Full error object:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return null;
  }
};

export const updateStaff = async (staffId: string, staffData: Partial<Omit<Staff, 'id'>>, targetPracticeId?: string): Promise<Staff | null> => {
  console.log('=== UPDATE STAFF SERVICE DEBUG START ===');
  console.log('Staff ID to update:', staffId);
  console.log('Update data:', staffData);
  console.log('Target practice ID:', targetPracticeId);
  
  try {
    // Get current user to check permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('ERROR: No authenticated user found');
      return null;
    }

    console.log('Step 1: Checking user permissions...');
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('practice_id, role, email, name')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return null;
    }

    const isSuperAdmin = userProfile?.role === 'super_admin';
    console.log('User profile:', userProfile);
    console.log('Is super admin?', isSuperAdmin);

    // Get the staff member to check permissions
    console.log('Step 2: Fetching existing staff member...');
    const { data: existingStaff, error: fetchError } = await supabase
      .from('staff')
      .select('*, practice:practices(id, name)')
      .eq('id', staffId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing staff:', fetchError);
      return null;
    }

    console.log('Existing staff:', existingStaff);

    // Permission check
    if (!isSuperAdmin && existingStaff.practice_id !== userProfile?.practice_id) {
      console.log('ERROR: Permission denied - user can only edit staff from their practice');
      throw new Error('Permission denied: You can only edit staff from your practice');
    }

    console.log('Step 3: Permission check passed');

    // Prepare update data
    const updateData: any = {};
    if (staffData.name !== undefined) updateData.name = staffData.name;
    if (staffData.email !== undefined) updateData.email = staffData.email;
    if (staffData.role !== undefined) updateData.role = staffData.role;
    if (staffData.department !== undefined) updateData.department = staffData.department;
    
    // If super admin is changing practice
    if (isSuperAdmin && targetPracticeId && targetPracticeId !== existingStaff.practice_id) {
      updateData.practice_id = targetPracticeId;
      console.log('Super admin changing practice from', existingStaff.practice_id, 'to', targetPracticeId);
    }

    console.log('Step 4: Update data prepared:', updateData);

    // Execute update
    const { data: updatedStaff, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', staffId)
      .select(`
        *,
        practice:practices(id, name, email_domain)
      `)
      .single();

    console.log('Step 5: Supabase update response...');
    console.log('Updated staff data:', updatedStaff);
    console.log('Update error:', error);

    if (error) {
      console.error('=== SUPABASE UPDATE ERROR ===');
      console.error('Error details:', error);
      return null;
    }

    // Transform result
    const result = {
      id: updatedStaff.id,
      name: updatedStaff.name,
      email: updatedStaff.email,
      role: updatedStaff.role,
      department: updatedStaff.department,
      // Include practice info for super admin
      ...(isSuperAdmin && updatedStaff.practice ? {
        practiceName: updatedStaff.practice.name,
        practiceId: updatedStaff.practice.id
      } : {})
    };

    console.log('Final result:', result);
    console.log('=== UPDATE STAFF SERVICE SUCCESS ===');
    return result;

  } catch (error) {
    console.error('=== UPDATE STAFF SERVICE ERROR ===');
    console.error('Error details:', error);
    throw error;
  }
};

export const deleteStaff = async (staffId: string): Promise<boolean> => {
  console.log('=== DELETE STAFF SERVICE DEBUG START ===');
  console.log('Staff ID to delete:', staffId);
  
  try {
    // Get current user to check permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('ERROR: No authenticated user found');
      return false;
    }

    console.log('Step 1: Checking user permissions...');
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('practice_id, role, email, name')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return false;
    }

    const isSuperAdmin = userProfile?.role === 'super_admin';
    console.log('User profile:', userProfile);
    console.log('Is super admin?', isSuperAdmin);

    // Get the staff member to check permissions
    console.log('Step 2: Fetching existing staff member...');
    const { data: existingStaff, error: fetchError } = await supabase
      .from('staff')
      .select('*, practice:practices(id, name)')
      .eq('id', staffId)
      .single();

    if (fetchError) {
      console.error('Error fetching existing staff:', fetchError);
      return false;
    }

    console.log('Existing staff:', existingStaff);

    // Permission check
    if (!isSuperAdmin && existingStaff.practice_id !== userProfile?.practice_id) {
      console.log('ERROR: Permission denied - user can only delete staff from their practice');
      throw new Error('Permission denied: You can only delete staff from your practice');
    }

    console.log('Step 3: Permission check passed');

    // Check if staff member has competencies (might want to handle this)
    console.log('Step 4: Checking for related competencies...');
    const { data: competencies } = await supabase
      .from('competencies')
      .select('id')
      .eq('staff_id', staffId);

    if (competencies && competencies.length > 0) {
      console.log(`Found ${competencies.length} competencies for this staff member`);
      // Delete related competencies first
      const { error: competencyError } = await supabase
        .from('competencies')
        .delete()
        .eq('staff_id', staffId);

      if (competencyError) {
        console.error('Error deleting related competencies:', competencyError);
        return false;
      }
      console.log('Related competencies deleted successfully');
    }

    // Execute delete
    console.log('Step 5: Deleting staff member...');
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId);

    console.log('Step 6: Delete response...');
    console.log('Delete error:', error);

    if (error) {
      console.error('=== SUPABASE DELETE ERROR ===');
      console.error('Error details:', error);
      return false;
    }

    console.log('=== DELETE STAFF SERVICE SUCCESS ===');
    return true;

  } catch (error) {
    console.error('=== DELETE STAFF SERVICE ERROR ===');
    console.error('Error details:', error);
    throw error;
  }
};

export const getStaffById = async (staffId: string): Promise<Staff | null> => {
  console.log('=== GET STAFF BY ID DEBUG START ===');
  console.log('Staff ID:', staffId);
  
  try {
    // Get current user to check permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('ERROR: No authenticated user found');
      return null;
    }

    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('practice_id, role')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return null;
    }

    const isSuperAdmin = userProfile?.role === 'super_admin';

    // Fetch staff member with practice info
    let query = supabase
      .from('staff')
      .select(`
        *,
        practice:practices(id, name, email_domain)
      `)
      .eq('id', staffId);

    // Apply permission filter for non-super admins
    if (!isSuperAdmin) {
      query = query.eq('practice_id', userProfile?.practice_id);
    }

    const { data: staff, error } = await query.single();

    if (error) {
      console.error('Error fetching staff by ID:', error);
      return null;
    }

    // Transform result
    const result = {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      department: staff.department,
      // Include practice info for super admin
      ...(isSuperAdmin && staff.practice ? {
        practiceName: staff.practice.name,
        practiceId: staff.practice.id
      } : {})
    };

    console.log('Staff member found:', result);
    console.log('=== GET STAFF BY ID SUCCESS ===');
    return result;

  } catch (error) {
    console.error('=== GET STAFF BY ID ERROR ===');
    console.error('Error details:', error);
    return null;
  }
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

// DEBUG: Check what practices exist in the database
export const debugPractices = async () => {
  console.log('=== DEBUGGING PRACTICES IN DATABASE ===');
  
  const { data: practices, error } = await supabase
    .from('practices')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching practices:', error);
    return;
  }

  console.log('Total practices found:', practices?.length || 0);
  console.log('Practices in database:');
  practices?.forEach((practice, index) => {
    console.log(`${index + 1}. ${practice.name} (${practice.email_domain}) - ${practice.subscription_tier} - ID: ${practice.id}`);
  });
  
  return practices;
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

// ============================================================================
// DOCUMENT MANAGEMENT FUNCTIONS
// ============================================================================

export interface DocumentReference {
  id: string;
  title: string;
  description?: string;
  evidence_type: string;
  status: string;
  created_at: string;
}

// Get documents by type (for dropdown selection)
export const getDocumentsByType = async (type: 'sop' | 'policy'): Promise<DocumentReference[]> => {
  try {
    const practiceId = await getCurrentPracticeId();
    if (!practiceId) {
      console.error('No practice ID found for document retrieval');
      return [];
    }

    let query = supabase
      .from('evidence_items')
      .select('id, title, description, evidence_type, status, created_at')
      .eq('practice_id', practiceId);

    if (type === 'sop') {
      // For SOPs, look for documents with SOP in title or tags
      query = query.or('title.ilike.%sop%,title.ilike.%standard operating%,description.ilike.%sop%,description.ilike.%standard operating%');
    } else {
      // For policies, look for evidence_type = 'policy' or 'procedure'
      query = query.in('evidence_type', ['policy', 'procedure']);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getDocumentsByType:', error);
    return [];
  }
};

// Get a single document by ID
export const getDocumentById = async (documentId: string): Promise<DocumentReference | null> => {
  try {
    const { data, error } = await supabase
      .from('evidence_items')
      .select('id, title, description, evidence_type, status, created_at')
      .eq('id', documentId)
      .single();

    if (error) {
      console.error('Error fetching document by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getDocumentById:', error);
    return null;
  }
};

// Generate display text for a document link (internal or external)
export const getDocumentDisplayText = (
  documentId?: string,
  documentTitle?: string,
  externalUrl?: string
): string => {
  if (documentId && documentTitle) {
    return documentTitle;
  }
  if (externalUrl) {
    try {
      const url = new URL(externalUrl);
      return url.hostname;
    } catch {
      return 'External Link';
    }
  }
  return 'No Link';
};

// Check if a task has any document links (internal or external)
export const hasDocumentLinks = (task: Task): { hasSOP: boolean; hasPolicy: boolean } => {
  return {
    hasSOP: !!(task.sopDocumentId || task.sopLink),
    hasPolicy: !!(task.policyDocumentId || task.policyLink)
  };
}; 