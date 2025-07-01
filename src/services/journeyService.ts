// COMPLIANCE JOURNEY SERVICE
// Service for managing compliance journeys, progress tracking, and evidence linking

import { supabase } from '../lib/supabase';
import {
  ComplianceFramework,
  JourneyTemplate,
  JourneyStep,
  PracticeJourney,
  PracticeJourneyStep,
  JourneyStepEvidence,
  JourneyMilestone,
  JourneyProgressSnapshot,
  CreatePracticeJourneyRequest,
  UpdateJourneyStepRequest,
  LinkEvidenceToStepRequest,
  JourneyAnalytics,
  JourneyProgressData,
  JourneySearchResult,
  StepSearchResult,
  JourneyFilters,
  StepFilters
} from '../types/journey';

class JourneyService {
  private async getCurrentPracticeId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: userProfile } = await supabase
      .from('users')
      .select('practice_id, role')
      .eq('id', user.id)
      .single();

    // If user is super admin and doesn't have a practice_id, use Riverside Health Practice
    if (userProfile?.role === 'admin' && !userProfile?.practice_id) {
      return '00000000-0000-0000-0000-000000000003';
    }

    if (!userProfile?.practice_id) {
      throw new Error('User practice not found');
    }

    return userProfile.practice_id;
  }

  // ============================================================================
  // FRAMEWORKS AND TEMPLATES
  // ============================================================================

  async getFrameworks(): Promise<ComplianceFramework[]> {
    const { data, error } = await supabase
      .from('compliance_frameworks')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching frameworks:', error);
      throw new Error(`Failed to fetch frameworks: ${error.message}`);
    }

    return data || [];
  }

  async getJourneyTemplates(frameworkId?: string): Promise<JourneyTemplate[]> {
    let query = supabase
      .from('journey_templates')
      .select(`
        *,
        framework:compliance_frameworks(*),
        steps:journey_steps(*)
      `)
      .eq('is_active', true);

    if (frameworkId) {
      query = query.eq('framework_id', frameworkId);
    }

    query = query.order('name');

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching journey templates:', error);
      throw new Error(`Failed to fetch journey templates: ${error.message}`);
    }

    return data || [];
  }

  async getJourneyTemplate(id: string): Promise<JourneyTemplate> {
    const { data, error } = await supabase
      .from('journey_templates')
      .select(`
        *,
        framework:compliance_frameworks(*),
        steps:journey_steps(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching journey template:', error);
      throw new Error(`Failed to fetch journey template: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // PRACTICE JOURNEYS
  // ============================================================================

  async getPracticeJourneys(filters?: JourneyFilters): Promise<JourneySearchResult> {
    const practiceId = await this.getCurrentPracticeId();

    let query = supabase
      .from('practice_journeys')
      .select(`
        *,
        template:journey_templates(
          *,
          framework:compliance_frameworks(*)
        ),
        steps:practice_journey_steps(
          *,
          step:journey_steps(*)
        )
      `)
      .eq('practice_id', practiceId);

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.template_id) {
      query = query.eq('template_id', filters.template_id);
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching practice journeys:', error);
      throw new Error(`Failed to fetch practice journeys: ${error.message}`);
    }

    return {
      journeys: data || [],
      total_count: count || 0,
      page: 1,
      page_size: 50,
      filters_applied: filters || {}
    };
  }

  async getPracticeJourney(id: string): Promise<PracticeJourney> {
    const practiceId = await this.getCurrentPracticeId();

    const { data, error } = await supabase
      .from('practice_journeys')
      .select(`
        *,
        template:journey_templates(
          *,
          framework:compliance_frameworks(*),
          steps:journey_steps(*)
        ),
        steps:practice_journey_steps(
          *,
          step:journey_steps(*),
          evidence:journey_step_evidence(
            *,
            evidence_item:evidence_items(*)
          )
        ),
        milestones:journey_milestones(*)
      `)
      .eq('id', id)
      .eq('practice_id', practiceId)
      .single();

    if (error) {
      console.error('Error fetching practice journey:', error);
      throw new Error(`Failed to fetch practice journey: ${error.message}`);
    }

    return data;
  }

  async createPracticeJourney(request: CreatePracticeJourneyRequest): Promise<PracticeJourney> {
    const practiceId = await this.getCurrentPracticeId();
    const { data: { user } } = await supabase.auth.getUser();

    // First, create the journey
    const journeyData = {
      practice_id: practiceId,
      template_id: request.template_id,
      assigned_to: request.assigned_to,
      target_completion_date: request.target_completion_date,
      created_by: user?.id,
      status: 'not_started'
    };

    const { data: journey, error: journeyError } = await supabase
      .from('practice_journeys')
      .insert(journeyData)
      .select()
      .single();

    if (journeyError) {
      console.error('Error creating practice journey:', journeyError);
      throw new Error(`Failed to create practice journey: ${journeyError.message}`);
    }

    // Get template steps and create practice journey steps
    const { data: templateSteps, error: stepsError } = await supabase
      .from('journey_steps')
      .select('*')
      .eq('template_id', request.template_id)
      .order('step_number');

    if (stepsError) {
      console.error('Error fetching template steps:', stepsError);
      throw new Error(`Failed to fetch template steps: ${stepsError.message}`);
    }

    // Create practice journey steps
    const practiceSteps = templateSteps.map(step => ({
      practice_id: practiceId,
      journey_id: journey.id,
      step_id: step.id,
      status: 'not_started',
      completion_percentage: 0,
      assigned_to: request.assigned_to
    }));

    const { error: stepInsertError } = await supabase
      .from('practice_journey_steps')
      .insert(practiceSteps);

    if (stepInsertError) {
      console.error('Error creating practice journey steps:', stepInsertError);
      throw new Error(`Failed to create practice journey steps: ${stepInsertError.message}`);
    }

    return this.getPracticeJourney(journey.id);
  }

  async updatePracticeJourney(id: string, updates: Partial<PracticeJourney>): Promise<PracticeJourney> {
    const practiceId = await this.getCurrentPracticeId();

    const { data, error } = await supabase
      .from('practice_journeys')
      .update(updates)
      .eq('id', id)
      .eq('practice_id', practiceId)
      .select()
      .single();

    if (error) {
      console.error('Error updating practice journey:', error);
      throw new Error(`Failed to update practice journey: ${error.message}`);
    }

    return this.getPracticeJourney(id);
  }

  // ============================================================================
  // JOURNEY STEPS
  // ============================================================================

  async getJourneySteps(journeyId: string, filters?: StepFilters): Promise<StepSearchResult> {
    const practiceId = await this.getCurrentPracticeId();

    let query = supabase
      .from('practice_journey_steps')
      .select(`
        *,
        step:journey_steps(*),
        evidence:journey_step_evidence(
          *,
          evidence_item:evidence_items(*)
        )
      `)
      .eq('practice_id', practiceId)
      .eq('journey_id', journeyId);

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters?.overdue_only) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt('due_date', today);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching journey steps:', error);
      throw new Error(`Failed to fetch journey steps: ${error.message}`);
    }

    return {
      steps: data || [],
      total_count: count || 0,
      page: 1,
      page_size: 50,
      filters_applied: filters || {}
    };
  }

  async updateJourneyStep(stepId: string, request: UpdateJourneyStepRequest): Promise<PracticeJourneyStep> {
    const practiceId = await this.getCurrentPracticeId();

    const updateData: any = {
      ...request,
      updated_at: new Date().toISOString()
    };

    // If marking as completed, set completion date
    if (request.status === 'completed' && !request.completion_percentage) {
      updateData.completion_percentage = 100;
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('practice_journey_steps')
      .update(updateData)
      .eq('id', stepId)
      .eq('practice_id', practiceId)
      .select(`
        *,
        step:journey_steps(*),
        evidence:journey_step_evidence(
          *,
          evidence_item:evidence_items(*)
        )
      `)
      .single();

    if (error) {
      console.error('Error updating journey step:', error);
      throw new Error(`Failed to update journey step: ${error.message}`);
    }

    return data;
  }

  // ============================================================================
  // EVIDENCE LINKING
  // ============================================================================

  async linkEvidenceToStep(stepId: string, request: LinkEvidenceToStepRequest): Promise<JourneyStepEvidence> {
    const practiceId = await this.getCurrentPracticeId();
    const { data: { user } } = await supabase.auth.getUser();

    const linkData = {
      practice_id: practiceId,
      journey_step_id: stepId,
      evidence_item_id: request.evidence_item_id,
      relevance_score: request.relevance_score || 5,
      is_primary: request.is_primary || false,
      notes: request.notes,
      linked_by: user?.id
    };

    const { data, error } = await supabase
      .from('journey_step_evidence')
      .insert(linkData)
      .select(`
        *,
        evidence_item:evidence_items(*)
      `)
      .single();

    if (error) {
      console.error('Error linking evidence to step:', error);
      throw new Error(`Failed to link evidence to step: ${error.message}`);
    }

    return data;
  }

  async unlinkEvidenceFromStep(linkId: string): Promise<void> {
    const practiceId = await this.getCurrentPracticeId();

    const { error } = await supabase
      .from('journey_step_evidence')
      .delete()
      .eq('id', linkId)
      .eq('practice_id', practiceId);

    if (error) {
      console.error('Error unlinking evidence from step:', error);
      throw new Error(`Failed to unlink evidence from step: ${error.message}`);
    }
  }

  // ============================================================================
  // ANALYTICS AND PROGRESS
  // ============================================================================

  async getJourneyAnalytics(): Promise<JourneyAnalytics> {
    const practiceId = await this.getCurrentPracticeId();

    // Get journey counts
    const { data: journeys, error: journeyError } = await supabase
      .from('practice_journeys')
      .select('status, progress_percentage')
      .eq('practice_id', practiceId);

    if (journeyError) {
      console.error('Error fetching journey analytics:', journeyError);
      throw new Error(`Failed to fetch journey analytics: ${journeyError.message}`);
    }

    // Get step counts
    const { data: steps, error: stepError } = await supabase
      .from('practice_journey_steps')
      .select('status, due_date')
      .eq('practice_id', practiceId);

    if (stepError) {
      console.error('Error fetching step analytics:', stepError);
      throw new Error(`Failed to fetch step analytics: ${stepError.message}`);
    }

    // Get evidence link counts
    const { data: evidenceLinks, error: evidenceError } = await supabase
      .from('journey_step_evidence')
      .select('id')
      .eq('practice_id', practiceId);

    if (evidenceError) {
      console.error('Error fetching evidence analytics:', evidenceError);
      throw new Error(`Failed to fetch evidence analytics: ${evidenceError.message}`);
    }

    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const analytics: JourneyAnalytics = {
      total_journeys: journeys?.length || 0,
      active_journeys: journeys?.filter(j => j.status === 'in_progress').length || 0,
      completed_journeys: journeys?.filter(j => j.status === 'completed').length || 0,
      average_progress: journeys?.length ? 
        journeys.reduce((sum, j) => sum + j.progress_percentage, 0) / journeys.length : 0,
      total_steps_completed: steps?.filter(s => s.status === 'completed').length || 0,
      evidence_items_linked: evidenceLinks?.length || 0,
      upcoming_deadlines: steps?.filter(s => 
        s.due_date && new Date(s.due_date) <= sevenDaysFromNow && new Date(s.due_date) >= today
      ).length || 0,
      overdue_steps: steps?.filter(s => 
        s.due_date && new Date(s.due_date) < today && s.status !== 'completed'
      ).length || 0
    };

    return analytics;
  }

  async getJourneyProgressData(journeyId: string, days: number = 30): Promise<JourneyProgressData> {
    const practiceId = await this.getCurrentPracticeId();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const { data: snapshots, error } = await supabase
      .from('journey_progress_snapshots')
      .select('*')
      .eq('practice_id', practiceId)
      .eq('journey_id', journeyId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .lte('snapshot_date', endDate.toISOString().split('T')[0])
      .order('snapshot_date');

    if (error) {
      console.error('Error fetching progress data:', error);
      throw new Error(`Failed to fetch progress data: ${error.message}`);
    }

    const progressData: JourneyProgressData = {
      dates: snapshots?.map(s => s.snapshot_date) || [],
      progress_percentages: snapshots?.map(s => s.progress_percentage) || [],
      completed_steps: snapshots?.map(s => s.completed_steps) || [],
      evidence_linked: snapshots?.map(s => s.evidence_items_linked) || [],
      velocity: snapshots?.map(s => s.velocity || 0) || []
    };

    return progressData;
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  async createProgressSnapshot(journeyId: string): Promise<void> {
    const practiceId = await this.getCurrentPracticeId();

    // Get current journey state
    const { data: journey, error: journeyError } = await supabase
      .from('practice_journeys')
      .select('*')
      .eq('id', journeyId)
      .eq('practice_id', practiceId)
      .single();

    if (journeyError) {
      console.error('Error fetching journey for snapshot:', journeyError);
      return;
    }

    // Get step counts
    const { data: steps, error: stepError } = await supabase
      .from('practice_journey_steps')
      .select('status')
      .eq('journey_id', journeyId)
      .eq('practice_id', practiceId);

    if (stepError) {
      console.error('Error fetching steps for snapshot:', stepError);
      return;
    }

    // Get evidence count
    const { data: evidenceLinks, error: evidenceError } = await supabase
      .from('journey_step_evidence')
      .select('id')
      .eq('practice_id', practiceId);

    if (evidenceError) {
      console.error('Error fetching evidence for snapshot:', evidenceError);
      return;
    }

    const snapshotData = {
      practice_id: practiceId,
      journey_id: journeyId,
      total_steps: steps?.length || 0,
      completed_steps: steps?.filter(s => s.status === 'completed').length || 0,
      in_progress_steps: steps?.filter(s => s.status === 'in_progress').length || 0,
      evidence_items_linked: evidenceLinks?.length || 0,
      progress_percentage: journey.progress_percentage,
      snapshot_date: new Date().toISOString().split('T')[0]
    };

    const { error: insertError } = await supabase
      .from('journey_progress_snapshots')
      .insert(snapshotData);

    if (insertError) {
      console.error('Error creating progress snapshot:', insertError);
    }
  }
}

export const journeyService = new JourneyService(); 