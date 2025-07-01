export type TaskFrequency = 'Continuous' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';

export type RiskRating = 'Low' | 'Medium' | 'High';

export type CompetencyStatus = 
  | 'Competent' 
  | 'Training Required' 
  | 'Re-Training Required' 
  | 'Trained awaiting sign off'
  | 'Not Applicable';

export interface StaffCompetency {
  staffId: string;
  staffName: string;
  status: CompetencyStatus;
  lastUpdated?: Date;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  category: TaskFrequency;
  sopLink?: string;
  policyLink?: string;
  riskRating: RiskRating;
  competencies: StaffCompetency[];
  owner?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Staff {
  id: string;
  name: string;
  email?: string;
  role?: string;
  department?: string;
}

export interface DashboardSummary {
  totalTasks: number;
  completedTasks: number;
  highRiskTasks: number;
  trainingRequired: number;
  recentlyUpdated: Task[];
}

export interface ImportResult {
  success: boolean;
  tasksImported?: number;
  errors?: string[];
}

// CQC Compliance Types
export interface CQCFundamentalStandard {
  id: string;
  name: string;
  description: string;
  regulation: string;
  category: CQCKeyQuestion;
  isCompliant: boolean;
  evidenceRequired: string[];
  lastAssessed?: Date;
  nextReviewDate?: Date;
  notes?: string;
}

export type CQCKeyQuestion = 'Safe' | 'Effective' | 'Caring' | 'Responsive' | 'Well-led';

export interface CQCQualityStatement {
  id: string;
  keyQuestion: CQCKeyQuestion;
  statement: string;
  isCompliant: boolean;
  evidenceItems: CQCEvidenceItem[];
  weight: number; // 1-5, importance weighting
}

export interface CQCEvidenceItem {
  id: string;
  description: string;
  isComplete: boolean;
  completedDate?: Date;
  completedBy?: string;
  documentPath?: string;
  notes?: string;
}

export interface CQCComplianceReport {
  overallScore: number;
  keyQuestionScores: Record<CQCKeyQuestion, number>;
  fundamentalStandardsCompliance: number;
  totalRequirements: number;
  completedRequirements: number;
  lastUpdated: Date;
  nextReviewDate: Date;
  criticalIssues: string[];
  recommendations: string[];
}