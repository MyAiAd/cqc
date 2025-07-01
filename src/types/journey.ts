// COMPLIANCE JOURNEY TYPES
// Types for tracking compliance journeys, progress, and evidence linking

export interface ComplianceFramework {
  id: string;
  name: string;
  description?: string;
  version?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JourneyTemplate {
  id: string;
  framework_id: string;
  name: string;
  description?: string;
  estimated_duration_days?: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  framework?: ComplianceFramework;
  steps?: JourneyStep[];
}

export interface JourneyStep {
  id: string;
  template_id: string;
  step_number: number;
  title: string;
  description?: string;
  category?: string;
  estimated_hours?: number;
  is_mandatory: boolean;
  prerequisites?: string[];
  evidence_types_required?: string[];
  min_evidence_count: number;
  guidance_text?: string;
  resources?: Record<string, any>;
  created_at: string;
  updated_at: string;
  template?: JourneyTemplate;
}

export type JourneyStatus = 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
export type StepStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
export type ReviewStatus = 'pending' | 'approved' | 'needs_revision';

export interface PracticeJourney {
  id: string;
  practice_id: string;
  template_id: string;
  status: JourneyStatus;
  progress_percentage: number;
  started_at?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  assigned_to?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  template?: JourneyTemplate;
  steps?: PracticeJourneyStep[];
  milestones?: JourneyMilestone[];
}

export interface PracticeJourneyStep {
  id: string;
  practice_id: string;
  journey_id: string;
  step_id: string;
  status: StepStatus;
  completion_percentage: number;
  started_at?: string;
  completed_at?: string;
  due_date?: string;
  assigned_to?: string;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_status?: ReviewStatus;
  review_notes?: string;
  created_at: string;
  updated_at: string;
  step?: JourneyStep;
  evidence?: JourneyStepEvidence[];
}

export interface JourneyStepEvidence {
  id: string;
  practice_id: string;
  journey_step_id: string;
  evidence_item_id: string;
  relevance_score?: number;
  is_primary: boolean;
  linked_by?: string;
  linked_at: string;
  notes?: string;
  evidence_item?: any; // Will be EvidenceItem from evidence types
}

export interface JourneyMilestone {
  id: string;
  practice_id: string;
  journey_id: string;
  milestone_type: string;
  title: string;
  description?: string;
  achieved_at?: string;
  target_date?: string;
  is_celebrated: boolean;
  celebration_message?: string;
  created_at: string;
}

export interface JourneyProgressSnapshot {
  id: string;
  practice_id: string;
  journey_id: string;
  total_steps: number;
  completed_steps: number;
  in_progress_steps: number;
  evidence_items_linked: number;
  progress_percentage: number;
  velocity?: number;
  estimated_completion_date?: string;
  snapshot_date: string;
  created_at: string;
}

// API Request/Response Types
export interface CreatePracticeJourneyRequest {
  template_id: string;
  assigned_to?: string;
  target_completion_date?: string;
}

export interface UpdateJourneyStepRequest {
  status?: StepStatus;
  completion_percentage?: number;
  notes?: string;
  due_date?: string;
  assigned_to?: string;
}

export interface LinkEvidenceToStepRequest {
  evidence_item_id: string;
  relevance_score?: number;
  is_primary?: boolean;
  notes?: string;
}

export interface JourneyAnalytics {
  total_journeys: number;
  active_journeys: number;
  completed_journeys: number;
  average_progress: number;
  total_steps_completed: number;
  evidence_items_linked: number;
  upcoming_deadlines: number;
  overdue_steps: number;
}

export interface JourneyProgressData {
  dates: string[];
  progress_percentages: number[];
  completed_steps: number[];
  evidence_linked: number[];
  velocity: number[];
}

// Component Props Types
export interface JourneyCardProps {
  journey: PracticeJourney;
  onSelect?: (journey: PracticeJourney) => void;
  onUpdate?: (journey: PracticeJourney) => void;
}

export interface JourneyStepCardProps {
  step: PracticeJourneyStep;
  onUpdate?: (step: PracticeJourneyStep) => void;
  onLinkEvidence?: (stepId: string) => void;
}

export interface JourneyProgressChartProps {
  data: JourneyProgressData;
  height?: number;
  showVelocity?: boolean;
}

export interface JourneyFilters {
  status?: JourneyStatus[];
  template_id?: string;
  assigned_to?: string;
  overdue_only?: boolean;
  search_term?: string;
}

export interface StepFilters {
  status?: StepStatus[];
  category?: string[];
  assigned_to?: string;
  overdue_only?: boolean;
  missing_evidence?: boolean;
}

// Search and Pagination
export interface JourneySearchResult {
  journeys: PracticeJourney[];
  total_count: number;
  page: number;
  page_size: number;
  filters_applied: JourneyFilters;
}

export interface StepSearchResult {
  steps: PracticeJourneyStep[];
  total_count: number;
  page: number;
  page_size: number;
  filters_applied: StepFilters;
} 