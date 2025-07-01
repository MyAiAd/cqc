import { CQCFundamentalStandard, CQCQualityStatement, CQCKeyQuestion, CQCEvidenceItem } from '../types';

// CQC Fundamental Standards (Regulations 9-20A)
export const CQC_FUNDAMENTAL_STANDARDS: CQCFundamentalStandard[] = [
  {
    id: 'reg-9',
    name: 'Person-centred care',
    description: 'Care and treatment must be appropriate and reflect service users\' needs and preferences',
    regulation: 'Regulation 9',
    category: 'Caring',
    isCompliant: true,
    evidenceRequired: [
      'Care plans tailored to individual needs',
      'Evidence of patient involvement in care decisions',
      'Patient feedback and satisfaction surveys',
      'Staff training records on person-centred care'
    ]
  },
  {
    id: 'reg-10',
    name: 'Dignity and respect',
    description: 'Service users must be treated with dignity and respect at all times',
    regulation: 'Regulation 10',
    category: 'Caring',
    isCompliant: true,
    evidenceRequired: [
      'Privacy policies and procedures',
      'Staff training on dignity and respect',
      'Patient feedback on treatment',
      'Equality and diversity policies'
    ]
  },
  {
    id: 'reg-11',
    name: 'Need for consent',
    description: 'Care and treatment must only be provided with the consent of the relevant person',
    regulation: 'Regulation 11',
    category: 'Safe',
    isCompliant: false,
    evidenceRequired: [
      'Consent policies and procedures',
      'Mental Capacity Act training records',
      'Consent forms and documentation',
      'Best interest decision records'
    ]
  },
  {
    id: 'reg-12',
    name: 'Safe care and treatment',
    description: 'Care and treatment must be provided in a safe way',
    regulation: 'Regulation 12',
    category: 'Safe',
    isCompliant: true,
    evidenceRequired: [
      'Risk assessments and management plans',
      'Infection prevention and control policies',
      'Medicine management procedures',
      'Equipment maintenance records',
      'Staff competency assessments'
    ]
  },
  {
    id: 'reg-13',
    name: 'Safeguarding service users from abuse and improper treatment',
    description: 'Service users must be protected from abuse and improper treatment',
    regulation: 'Regulation 13',
    category: 'Safe',
    isCompliant: true,
    evidenceRequired: [
      'Safeguarding policies and procedures',
      'Staff safeguarding training records',
      'Incident reporting systems',
      'DBS checks for all staff'
    ]
  },
  {
    id: 'reg-14',
    name: 'Meeting nutritional and hydration needs',
    description: 'Service users\' nutritional and hydration needs must be met',
    regulation: 'Regulation 14',
    category: 'Effective',
    isCompliant: true,
    evidenceRequired: [
      'Nutritional assessment procedures',
      'Dietary policies and menus',
      'Staff training on nutrition',
      'Monitoring and review processes'
    ]
  },
  {
    id: 'reg-15',
    name: 'Premises and equipment',
    description: 'Premises and equipment must be clean, secure, suitable and used properly',
    regulation: 'Regulation 15',
    category: 'Safe',
    isCompliant: false,
    evidenceRequired: [
      'Premises maintenance schedules',
      'Equipment calibration records',
      'Cleaning schedules and audits',
      'Health and safety assessments'
    ]
  },
  {
    id: 'reg-16',
    name: 'Receiving and acting on complaints',
    description: 'There must be an accessible system for identifying, receiving, handling and responding to complaints',
    regulation: 'Regulation 16',
    category: 'Responsive',
    isCompliant: true,
    evidenceRequired: [
      'Complaints policy and procedure',
      'Complaints log and outcomes',
      'Staff training on complaint handling',
      'Patient information on how to complain'
    ]
  },
  {
    id: 'reg-17',
    name: 'Good governance',
    description: 'Systems or processes must be established and operated effectively',
    regulation: 'Regulation 17',
    category: 'Well-led',
    isCompliant: false,
    evidenceRequired: [
      'Governance framework and policies',
      'Quality assurance systems',
      'Risk management procedures',
      'Performance monitoring systems',
      'Staff supervision and appraisal systems'
    ]
  },
  {
    id: 'reg-18',
    name: 'Staffing',
    description: 'Sufficient numbers of suitably qualified, competent, skilled and experienced persons must be deployed',
    regulation: 'Regulation 18',
    category: 'Safe',
    isCompliant: true,
    evidenceRequired: [
      'Staffing level assessments',
      'Staff recruitment procedures',
      'Training and development records',
      'Competency frameworks'
    ]
  },
  {
    id: 'reg-19',
    name: 'Fit and proper persons employed',
    description: 'Persons employed must be of good character and have the qualifications and skills necessary',
    regulation: 'Regulation 19',
    category: 'Safe',
    isCompliant: true,
    evidenceRequired: [
      'Recruitment and selection procedures',
      'DBS checks and references',
      'Professional registration checks',
      'Induction and training records'
    ]
  },
  {
    id: 'reg-20',
    name: 'Duty of candour',
    description: 'Openness, transparency and candour must be displayed when things go wrong',
    regulation: 'Regulation 20',
    category: 'Well-led',
    isCompliant: false,
    evidenceRequired: [
      'Duty of candour policy',
      'Incident notification procedures',
      'Staff training on duty of candour',
      'Records of candour communications'
    ]
  },
  {
    id: 'reg-20a',
    name: 'Display of ratings',
    description: 'CQC ratings must be displayed prominently',
    regulation: 'Regulation 20A',
    category: 'Well-led',
    isCompliant: true,
    evidenceRequired: [
      'CQC rating display in premises',
      'Website rating display',
      'Latest CQC report availability'
    ]
  }
];

// Quality Statements for each Key Question
export const CQC_QUALITY_STATEMENTS: CQCQualityStatement[] = [
  // SAFE
  {
    id: 'safe-1',
    keyQuestion: 'Safe',
    statement: 'People are protected from abuse, harassment, discrimination and breaches of their dignity and respect',
    isCompliant: true,
    weight: 5,
    evidenceItems: [
      {
        id: 'safe-1-1',
        description: 'Safeguarding policies in place and up to date',
        isComplete: true,
        completedDate: new Date('2024-01-15')
      },
      {
        id: 'safe-1-2',
        description: 'All staff completed safeguarding training',
        isComplete: true,
        completedDate: new Date('2024-02-01')
      }
    ]
  },
  {
    id: 'safe-2',
    keyQuestion: 'Safe',
    statement: 'People\'s care and treatment is planned and delivered in a way that is intended to ensure their safety and welfare',
    isCompliant: false,
    weight: 5,
    evidenceItems: [
      {
        id: 'safe-2-1',
        description: 'Risk assessments completed for all patients',
        isComplete: false
      },
      {
        id: 'safe-2-2',
        description: 'Care plans include safety considerations',
        isComplete: true,
        completedDate: new Date('2024-01-20')
      }
    ]
  },
  {
    id: 'safe-3',
    keyQuestion: 'Safe',
    statement: 'People receive safe care and treatment that meets their needs and protects their rights',
    isCompliant: true,
    weight: 4,
    evidenceItems: [
      {
        id: 'safe-3-1',
        description: 'Medicine management procedures followed',
        isComplete: true,
        completedDate: new Date('2024-01-10')
      }
    ]
  },

  // EFFECTIVE
  {
    id: 'effective-1',
    keyQuestion: 'Effective',
    statement: 'People\'s care, treatment and support achieves good outcomes, promotes a good quality of life and is based on the best available evidence',
    isCompliant: true,
    weight: 5,
    evidenceItems: [
      {
        id: 'effective-1-1',
        description: 'Evidence-based care protocols in use',
        isComplete: true,
        completedDate: new Date('2024-01-25')
      }
    ]
  },
  {
    id: 'effective-2',
    keyQuestion: 'Effective',
    statement: 'People\'s needs are holistically assessed, and their care, treatment and support is delivered in line with legislation, standards and evidence-based guidance',
    isCompliant: false,
    weight: 4,
    evidenceItems: [
      {
        id: 'effective-2-1',
        description: 'Holistic assessment tools implemented',
        isComplete: false
      }
    ]
  },

  // CARING
  {
    id: 'caring-1',
    keyQuestion: 'Caring',
    statement: 'People are treated with kindness, respect and compassion and they are given emotional support when needed',
    isCompliant: true,
    weight: 4,
    evidenceItems: [
      {
        id: 'caring-1-1',
        description: 'Patient feedback shows compassionate care',
        isComplete: true,
        completedDate: new Date('2024-02-10')
      }
    ]
  },
  {
    id: 'caring-2',
    keyQuestion: 'Caring',
    statement: 'People are supported and treated with dignity and their privacy is respected',
    isCompliant: true,
    weight: 4,
    evidenceItems: [
      {
        id: 'caring-2-1',
        description: 'Privacy and dignity policies implemented',
        isComplete: true,
        completedDate: new Date('2024-01-30')
      }
    ]
  },

  // RESPONSIVE
  {
    id: 'responsive-1',
    keyQuestion: 'Responsive',
    statement: 'People\'s needs are met through the way services are organised and delivered',
    isCompliant: true,
    weight: 4,
    evidenceItems: [
      {
        id: 'responsive-1-1',
        description: 'Services organized around patient needs',
        isComplete: true,
        completedDate: new Date('2024-02-05')
      }
    ]
  },
  {
    id: 'responsive-2',
    keyQuestion: 'Responsive',
    statement: 'People are able to access care and treatment in a timely way',
    isCompliant: false,
    weight: 5,
    evidenceItems: [
      {
        id: 'responsive-2-1',
        description: 'Appointment waiting times within targets',
        isComplete: false
      }
    ]
  },

  // WELL-LED
  {
    id: 'well-led-1',
    keyQuestion: 'Well-led',
    statement: 'There is a clear vision and credible strategy to deliver high-quality care and support, and promote a positive culture',
    isCompliant: false,
    weight: 5,
    evidenceItems: [
      {
        id: 'well-led-1-1',
        description: 'Strategic plan documented and communicated',
        isComplete: false
      }
    ]
  },
  {
    id: 'well-led-2',
    keyQuestion: 'Well-led',
    statement: 'Leaders have the integrity, skills and abilities to run the service',
    isCompliant: true,
    weight: 4,
    evidenceItems: [
      {
        id: 'well-led-2-1',
        description: 'Leadership competency assessments completed',
        isComplete: true,
        completedDate: new Date('2024-01-12')
      }
    ]
  }
];

// Calculate compliance scores
export const calculateCQCCompliance = () => {
  // Calculate fundamental standards compliance
  const compliantStandards = CQC_FUNDAMENTAL_STANDARDS.filter(std => std.isCompliant).length;
  const fundamentalStandardsScore = Math.round((compliantStandards / CQC_FUNDAMENTAL_STANDARDS.length) * 100);

  // Calculate quality statements compliance by key question
  const keyQuestionScores: Record<CQCKeyQuestion, number> = {
    'Safe': 0,
    'Effective': 0,
    'Caring': 0,
    'Responsive': 0,
    'Well-led': 0
  };

  const keyQuestions: CQCKeyQuestion[] = ['Safe', 'Effective', 'Caring', 'Responsive', 'Well-led'];
  
  keyQuestions.forEach(kq => {
    const statements = CQC_QUALITY_STATEMENTS.filter(qs => qs.keyQuestion === kq);
    const totalWeight = statements.reduce((sum, qs) => sum + qs.weight, 0);
    const compliantWeight = statements
      .filter(qs => qs.isCompliant)
      .reduce((sum, qs) => sum + qs.weight, 0);
    
    keyQuestionScores[kq] = totalWeight > 0 ? Math.round((compliantWeight / totalWeight) * 100) : 0;
  });

  // Calculate overall score (weighted average)
  const totalStatements = CQC_QUALITY_STATEMENTS.length;
  const compliantStatements = CQC_QUALITY_STATEMENTS.filter(qs => qs.isCompliant).length;
  const qualityStatementsScore = Math.round((compliantStatements / totalStatements) * 100);

  // Overall score is average of fundamental standards and quality statements
  const overallScore = Math.round((fundamentalStandardsScore + qualityStatementsScore) / 2);

  // Identify critical issues
  const criticalIssues: string[] = [];
  CQC_FUNDAMENTAL_STANDARDS.forEach(std => {
    if (!std.isCompliant && (std.category === 'Safe' || std.regulation === 'Regulation 17')) {
      criticalIssues.push(`${std.name} (${std.regulation}) - ${std.description}`);
    }
  });

  // Generate recommendations
  const recommendations: string[] = [];
  if (keyQuestionScores.Safe < 80) {
    recommendations.push('Prioritize safety improvements - complete risk assessments and update safety procedures');
  }
  if (keyQuestionScores['Well-led'] < 80) {
    recommendations.push('Strengthen governance framework and leadership development');
  }
  if (fundamentalStandardsScore < 85) {
    recommendations.push('Focus on achieving compliance with all fundamental standards');
  }

  return {
    overallScore,
    keyQuestionScores,
    fundamentalStandardsCompliance: fundamentalStandardsScore,
    totalRequirements: CQC_FUNDAMENTAL_STANDARDS.length + CQC_QUALITY_STATEMENTS.length,
    completedRequirements: compliantStandards + compliantStatements,
    lastUpdated: new Date(),
    nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    criticalIssues,
    recommendations
  };
};

export const getCQCComplianceByKeyQuestion = (keyQuestion: CQCKeyQuestion) => {
  const standards = CQC_FUNDAMENTAL_STANDARDS.filter(std => std.category === keyQuestion);
  const statements = CQC_QUALITY_STATEMENTS.filter(qs => qs.keyQuestion === keyQuestion);
  
  return {
    standards,
    statements,
    compliance: calculateCQCCompliance().keyQuestionScores[keyQuestion]
  };
}; 