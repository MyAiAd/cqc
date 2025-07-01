import { Task, Staff, CompetencyStatus, RiskRating, TaskFrequency } from '../types';

export const sampleStaff: Staff[] = [
  { id: '1', name: 'Team Member 1', email: 'tm1@example.com', role: 'Nurse', department: 'Clinical' },
  { id: '2', name: 'Team Member 2', email: 'tm2@example.com', role: 'Admin', department: 'Front Office' },
  { id: '3', name: 'Team Member 3', email: 'tm3@example.com', role: 'Doctor', department: 'Clinical' },
];

export const mapCompetencyString = (status: string): CompetencyStatus => {
  switch (status) {
    case 'Competent':
      return 'Competent';
    case 'Training Required':
      return 'Training Required';
    case 'Re-Training Required':
      return 'Re-Training Required';
    case 'Trained awaiting sign off':
      return 'Trained awaiting sign off';
    default:
      return 'Not Applicable';
  }
};

export const sampleTasks: Task[] = [
  {
    id: '1',
    name: 'Email Management',
    description: 'Managing and responding to patient emails',
    category: 'Continuous' as TaskFrequency,
    sopLink: '[SOP Link]',
    policyLink: '[Policy Link]',
    riskRating: 'Medium' as RiskRating,
    competencies: [
      { staffId: '1', staffName: 'Team Member 1', status: 'Competent' },
      { staffId: '2', staffName: 'Team Member 2', status: 'Training Required' },
      { staffId: '3', staffName: 'Team Member 3', status: 'Competent' },
    ],
    owner: 'Team Member 1',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-06-20'),
  },
  {
    id: '2',
    name: 'Prescription Requests',
    description: 'Processing repeat prescription requests',
    category: 'Continuous' as TaskFrequency,
    sopLink: '[SOP Link]',
    policyLink: '[Policy Link]',
    riskRating: 'High' as RiskRating,
    competencies: [
      { staffId: '1', staffName: 'Team Member 1', status: 'Trained awaiting sign off' },
      { staffId: '2', staffName: 'Team Member 2', status: 'Competent' },
      { staffId: '3', staffName: 'Team Member 3', status: 'Competent' },
    ],
    owner: 'Team Member 3',
    createdAt: new Date('2023-02-10'),
    updatedAt: new Date('2023-07-05'),
  },
  {
    id: '3',
    name: 'Phone Call Triage',
    description: 'Handling incoming patient calls and prioritising',
    category: 'Continuous' as TaskFrequency,
    sopLink: '[SOP Link]',
    policyLink: '[Policy Link]',
    riskRating: 'Medium' as RiskRating,
    competencies: [
      { staffId: '1', staffName: 'Team Member 1', status: 'Competent' },
      { staffId: '2', staffName: 'Team Member 2', status: 'Re-Training Required' },
      { staffId: '3', staffName: 'Team Member 3', status: 'Competent' },
    ],
    owner: 'Team Member 1',
    createdAt: new Date('2023-03-05'),
    updatedAt: new Date('2023-08-15'),
  },
  {
    id: '4',
    name: 'Clinic Preparation',
    description: 'Setting up consultation rooms and equipment',
    category: 'Daily' as TaskFrequency,
    sopLink: '[SOP Link]',
    policyLink: '[Policy Link]',
    riskRating: 'Low' as RiskRating,
    competencies: [
      { staffId: '1', staffName: 'Team Member 1', status: 'Competent' },
      { staffId: '2', staffName: 'Team Member 2', status: 'Competent' },
      { staffId: '3', staffName: 'Team Member 3', status: 'Competent' },
    ],
    owner: 'Team Member 2',
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-06-10'),
  },
  {
    id: '5',
    name: 'Data Entry',
    description: 'Inputting patient data into electronic systems',
    category: 'Daily' as TaskFrequency,
    sopLink: '[SOP Link]',
    policyLink: '[Policy Link]',
    riskRating: 'Medium' as RiskRating,
    competencies: [
      { staffId: '1', staffName: 'Team Member 1', status: 'Training Required' },
      { staffId: '2', staffName: 'Team Member 2', status: 'Trained awaiting sign off' },
      { staffId: '3', staffName: 'Team Member 3', status: 'Competent' },
    ],
    owner: 'Team Member 3',
    createdAt: new Date('2023-02-25'),
    updatedAt: new Date('2023-07-20'),
  },
  {
    id: '6',
    name: 'Lab Results Review',
    description: 'Reviewing and filing lab results',
    category: 'Daily' as TaskFrequency,
    sopLink: '[SOP Link]',
    policyLink: '[Policy Link]',
    riskRating: 'High' as RiskRating,
    competencies: [
      { staffId: '1', staffName: 'Team Member 1', status: 'Re-Training Required' },
      { staffId: '2', staffName: 'Team Member 2', status: 'Competent' },
      { staffId: '3', staffName: 'Team Member 3', status: 'Competent' },
    ],
    owner: 'Team Member 3',
    createdAt: new Date('2023-03-15'),
    updatedAt: new Date('2023-08-25'),
  },
  {
    id: '7',
    name: 'Inventory Checks',
    description: 'Reviewing and restocking medical supplies',
    category: 'Weekly' as TaskFrequency,
    sopLink: '[SOP Link]',
    policyLink: '[Policy Link]',
    riskRating: 'Low' as RiskRating,
    competencies: [
      { staffId: '1', staffName: 'Team Member 1', status: 'Competent' },
      { staffId: '2', staffName: 'Team Member 2', status: 'Competent' },
      { staffId: '3', staffName: 'Team Member 3', status: 'Trained awaiting sign off' },
    ],
    owner: 'Team Member 2',
    createdAt: new Date('2023-01-30'),
    updatedAt: new Date('2023-06-30'),
  },
];

export const getDashboardSummary = () => {
  return {
    totalTasks: sampleTasks.length,
    completedTasks: 0,
    highRiskTasks: sampleTasks.filter(task => task.riskRating === 'High').length,
    trainingRequired: sampleTasks.reduce((count, task) => {
      const trainingNeeded = task.competencies.some(comp => 
        comp.status === 'Training Required' || 
        comp.status === 'Re-Training Required'
      );
      return trainingNeeded ? count + 1 : count;
    }, 0),
    recentlyUpdated: [...sampleTasks]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 3),
  };
};