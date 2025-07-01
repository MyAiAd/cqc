// MOCK JOURNEY SERVICE FOR DEMO
// Provides mock data for the compliance journey tracking system

import {
  ComplianceFramework,
  JourneyTemplate,
  JourneyStep,
  PracticeJourney,
  PracticeJourneyStep,
  JourneyAnalytics,
  JourneyProgressData,
  JourneySearchResult,
  JourneyFilters,
  CreatePracticeJourneyRequest
} from '../types/journey';

class MockJourneyService {
  private getMockFrameworks(): ComplianceFramework[] {
    return [
      {
        id: 'cqc-framework',
        name: 'CQC Fundamental Standards',
        description: 'Care Quality Commission Fundamental Standards for Healthcare Providers',
        version: '2024',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockSteps(): JourneyStep[] {
    return [
      {
        id: 'step-1',
        template_id: 'cqc-registration',
        step_number: 1,
        title: 'Understand CQC Requirements',
        description: 'Review and understand all CQC fundamental standards and regulations',
        category: 'preparation',
        estimated_hours: 8,
        is_mandatory: true,
        prerequisites: [],
        evidence_types_required: ['document'],
        min_evidence_count: 1,
        guidance_text: 'Start by reviewing the CQC guidance documents and understanding what evidence you need to collect.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'step-2',
        template_id: 'cqc-registration',
        step_number: 2,
        title: 'Develop Policies & Procedures',
        description: 'Create comprehensive policies covering all CQC fundamental standards',
        category: 'policy',
        estimated_hours: 40,
        is_mandatory: true,
        prerequisites: ['step-1'],
        evidence_types_required: ['policy', 'procedure'],
        min_evidence_count: 5,
        guidance_text: 'Develop policies for person-centred care, dignity & respect, consent, safe care, and safeguarding.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'step-3',
        template_id: 'cqc-registration',
        step_number: 3,
        title: 'Staff Training Program',
        description: 'Implement comprehensive staff training on CQC requirements and policies',
        category: 'training',
        estimated_hours: 24,
        is_mandatory: true,
        prerequisites: ['step-2'],
        evidence_types_required: ['training_record', 'certificate'],
        min_evidence_count: 3,
        guidance_text: 'Ensure all staff are trained on CQC requirements, policies, and their roles in compliance.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'step-4',
        template_id: 'cqc-registration',
        step_number: 4,
        title: 'Risk Assessment & Management',
        description: 'Conduct comprehensive risk assessments and implement management plans',
        category: 'assessment',
        estimated_hours: 16,
        is_mandatory: true,
        prerequisites: ['step-2'],
        evidence_types_required: ['document', 'audit_report'],
        min_evidence_count: 2,
        guidance_text: 'Identify and assess all risks to service users and implement appropriate management strategies.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'step-5',
        template_id: 'cqc-registration',
        step_number: 5,
        title: 'Quality Assurance Systems',
        description: 'Establish systems for monitoring and improving quality of care',
        category: 'system',
        estimated_hours: 20,
        is_mandatory: true,
        prerequisites: ['step-3', 'step-4'],
        evidence_types_required: ['procedure', 'audit_report'],
        min_evidence_count: 2,
        guidance_text: 'Set up regular audits, feedback systems, and quality improvement processes.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockTemplates(): JourneyTemplate[] {
    return [
      {
        id: 'cqc-registration',
        framework_id: 'cqc-framework',
        name: 'CQC Registration & Compliance Journey',
        description: 'Complete journey from CQC registration preparation through ongoing compliance maintenance',
        estimated_duration_days: 180,
        difficulty_level: 'intermediate',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        framework: this.getMockFrameworks()[0],
        steps: this.getMockSteps()
      }
    ];
  }

  private getMockJourneySteps(): PracticeJourneyStep[] {
    const steps = this.getMockSteps();
    return [
      {
        id: 'journey-step-1',
        practice_id: '00000000-0000-0000-0000-000000000003',
        journey_id: 'journey-1',
        step_id: 'step-1',
        status: 'completed',
        completion_percentage: 100,
        started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'sage@myai.ad',
        notes: 'Completed review of all CQC documentation and requirements.',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        step: steps[0],
        evidence: []
      },
      {
        id: 'journey-step-2',
        practice_id: '00000000-0000-0000-0000-000000000003',
        journey_id: 'journey-1',
        step_id: 'step-2',
        status: 'in_progress',
        completion_percentage: 60,
        started_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        assigned_to: 'sage@myai.ad',
        notes: 'Working on developing comprehensive policies. 3 out of 5 policies completed.',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        step: steps[1],
        evidence: []
      },
      {
        id: 'journey-step-3',
        practice_id: '00000000-0000-0000-0000-000000000003',
        journey_id: 'journey-1',
        step_id: 'step-3',
        status: 'not_started',
        completion_percentage: 0,
        assigned_to: 'sage@myai.ad',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        step: steps[2],
        evidence: []
      },
      {
        id: 'journey-step-4',
        practice_id: '00000000-0000-0000-0000-000000000003',
        journey_id: 'journey-1',
        step_id: 'step-4',
        status: 'not_started',
        completion_percentage: 0,
        assigned_to: 'sage@myai.ad',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        step: steps[3],
        evidence: []
      },
      {
        id: 'journey-step-5',
        practice_id: '00000000-0000-0000-0000-000000000003',
        journey_id: 'journey-1',
        step_id: 'step-5',
        status: 'not_started',
        completion_percentage: 0,
        assigned_to: 'sage@myai.ad',
        created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        step: steps[4],
        evidence: []
      }
    ];
  }

  private getMockJourneys(): PracticeJourney[] {
    return [
      {
        id: 'journey-1',
        practice_id: '00000000-0000-0000-0000-000000000003',
        template_id: 'cqc-registration',
        status: 'in_progress',
        progress_percentage: 20,
        started_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        target_completion_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        assigned_to: 'sage@myai.ad',
        created_by: 'sage@myai.ad',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        template: this.getMockTemplates()[0],
        steps: this.getMockJourneySteps()
      }
    ];
  }

  private getMockProgressData(): JourneyProgressData {
    const dates = [];
    const progressPercentages = [];
    const completedSteps = [];
    const evidenceLinked = [];
    const velocity = [];

    // Generate 30 days of mock progress data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dates.push(date.toISOString().split('T')[0]);
      
      // Simulate gradual progress
      const progress = Math.min(20, (30 - i) * 0.8);
      progressPercentages.push(progress);
      
      const steps = progress > 15 ? 1 : 0;
      completedSteps.push(steps);
      
      evidenceLinked.push(Math.floor(progress / 10));
      velocity.push(0.2); // 0.2 steps per week
    }

    return {
      dates,
      progress_percentages: progressPercentages,
      completed_steps: completedSteps,
      evidence_linked: evidenceLinked,
      velocity
    };
  }

  private getMockAnalytics(): JourneyAnalytics {
    return {
      total_journeys: 1,
      active_journeys: 1,
      completed_journeys: 0,
      average_progress: 20,
      total_steps_completed: 1,
      evidence_items_linked: 0,
      upcoming_deadlines: 2,
      overdue_steps: 0
    };
  }

  // Public API methods
  async getFrameworks(): Promise<ComplianceFramework[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.getMockFrameworks();
  }

  async getJourneyTemplates(frameworkId?: string): Promise<JourneyTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const templates = this.getMockTemplates();
    return frameworkId ? templates.filter(t => t.framework_id === frameworkId) : templates;
  }

  async getJourneyTemplate(id: string): Promise<JourneyTemplate> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const template = this.getMockTemplates().find(t => t.id === id);
    if (!template) throw new Error('Template not found');
    return template;
  }

  async getPracticeJourneys(filters?: JourneyFilters): Promise<JourneySearchResult> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const journeys = this.getMockJourneys();
    
    return {
      journeys,
      total_count: journeys.length,
      page: 1,
      page_size: 50,
      filters_applied: filters || {}
    };
  }

  async getPracticeJourney(id: string): Promise<PracticeJourney> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const journey = this.getMockJourneys().find(j => j.id === id);
    if (!journey) throw new Error('Journey not found');
    return journey;
  }

  async createPracticeJourney(request: CreatePracticeJourneyRequest): Promise<PracticeJourney> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const template = this.getMockTemplates().find(t => t.id === request.template_id);
    if (!template) throw new Error('Template not found');

    const newJourney: PracticeJourney = {
      id: 'journey-' + Date.now(),
      practice_id: '00000000-0000-0000-0000-000000000003',
      template_id: request.template_id,
      status: 'not_started',
      progress_percentage: 0,
      assigned_to: request.assigned_to,
      target_completion_date: request.target_completion_date,
      created_by: 'sage@myai.ad',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      template,
      steps: template.steps?.map((step, index) => ({
        id: `journey-step-${Date.now()}-${index}`,
        practice_id: '00000000-0000-0000-0000-000000000003',
        journey_id: `journey-${Date.now()}`,
        step_id: step.id,
        status: 'not_started' as const,
        completion_percentage: 0,
        assigned_to: request.assigned_to,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        step,
        evidence: []
      })) || []
    };

    return newJourney;
  }

  async updatePracticeJourney(id: string, updates: Partial<PracticeJourney>): Promise<PracticeJourney> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const journey = this.getMockJourneys()[0];
    return { ...journey, ...updates, updated_at: new Date().toISOString() };
  }

  async getJourneyAnalytics(): Promise<JourneyAnalytics> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.getMockAnalytics();
  }

  async getJourneyProgressData(journeyId: string, days: number = 30): Promise<JourneyProgressData> {
    await new Promise(resolve => setTimeout(resolve, 400));
    return this.getMockProgressData();
  }
}

export const mockJourneyService = new MockJourneyService(); 