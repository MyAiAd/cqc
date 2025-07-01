import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CheckSquare, AlertTriangle, CheckCircle, XCircle, Clock, FileText, Users, Shield } from 'lucide-react';
import { calculateCQCCompliance, getCQCComplianceByKeyQuestion, CQC_FUNDAMENTAL_STANDARDS } from '../data/cqcCompliance';
import { CQCKeyQuestion } from '../types';

const ComplianceCheck = () => {
  const [selectedKeyQuestion, setSelectedKeyQuestion] = useState<CQCKeyQuestion | null>(null);
  const complianceReport = calculateCQCCompliance();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success-600';
    if (score >= 75) return 'text-warning-600';
    return 'text-error-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-success-100';
    if (score >= 75) return 'bg-warning-100';
    return 'bg-error-100';
  };

  const keyQuestionIcons = {
    'Safe': <Shield className="h-6 w-6" />,
    'Effective': <CheckCircle className="h-6 w-6" />,
    'Caring': <Users className="h-6 w-6" />,
    'Responsive': <Clock className="h-6 w-6" />,
    'Well-led': <FileText className="h-6 w-6" />
  };

  const keyQuestionDescriptions = {
    'Safe': 'You are protected from abuse and avoidable harm',
    'Effective': 'Your care achieves good outcomes and is based on best evidence',
    'Caring': 'Staff treat you with compassion, kindness, dignity and respect',
    'Responsive': 'Services are organised to meet your needs',
    'Well-led': 'Leadership ensures high-quality care and promotes learning'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">CQC Compliance Check</h1>
        <div className="text-sm text-neutral-500">
          Last updated: {complianceReport.lastUpdated.toLocaleDateString()}
        </div>
      </div>
      
      {/* Overall Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${getScoreBgColor(complianceReport.overallScore)}`}>
              <CheckSquare className={`h-6 w-6 ${getScoreColor(complianceReport.overallScore)}`} />
            </div>
            <div className="flex-1">
              <p className={`text-lg font-medium ${getScoreColor(complianceReport.overallScore)}`}>
                {complianceReport.overallScore}% Compliant
              </p>
              <p className="text-sm text-neutral-600">
                {complianceReport.completedRequirements} of {complianceReport.totalRequirements} requirements met
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Based on CQC Fundamental Standards and Quality Statements
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-neutral-700">
                Fundamental Standards: {complianceReport.fundamentalStandardsCompliance}%
              </p>
              <p className="text-xs text-neutral-500">
                Next review: {complianceReport.nextReviewDate.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Issues */}
      {complianceReport.criticalIssues.length > 0 && (
        <Card className="border-error-200 bg-error-50">
          <CardHeader>
            <CardTitle className="text-error-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Critical Issues Requiring Immediate Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {complianceReport.criticalIssues.map((issue, index) => (
                <li key={index} className="text-sm text-error-700 flex items-start">
                  <XCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Key Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Object.keys(complianceReport.keyQuestionScores) as CQCKeyQuestion[]).map((keyQuestion) => {
          const score = complianceReport.keyQuestionScores[keyQuestion];
          return (
            <Card 
              key={keyQuestion} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedKeyQuestion(keyQuestion)}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className={getScoreColor(score)}>
                    {keyQuestionIcons[keyQuestion]}
                  </span>
                  <span>{keyQuestion}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getScoreBgColor(score)} ${getScoreColor(score)}`}>
                      {score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : 'Needs Improvement'}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600">
                    {keyQuestionDescriptions[keyQuestion]}
                  </p>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        score >= 90 ? 'bg-success-500' : 
                        score >= 75 ? 'bg-warning-500' : 'bg-error-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fundamental Standards Summary */}
      <Card>
        <CardHeader>
          <CardTitle>CQC Fundamental Standards Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CQC_FUNDAMENTAL_STANDARDS.map((standard) => (
              <div key={standard.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className="flex-shrink-0 mt-1">
                  {standard.isCompliant ? (
                    <CheckCircle className="h-5 w-5 text-success-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-error-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-neutral-900 truncate">
                    {standard.name}
                  </h4>
                  <p className="text-xs text-neutral-500 mt-1">
                    {standard.regulation} • {standard.category}
                  </p>
                  <p className="text-xs text-neutral-600 mt-1 line-clamp-2">
                    {standard.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {complianceReport.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckSquare className="h-5 w-5 mr-2 text-primary-600" />
              Recommendations for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {complianceReport.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-primary-600">{index + 1}</span>
                  </div>
                  <p className="text-sm text-neutral-700">{recommendation}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Detailed View Modal/Section */}
      {selectedKeyQuestion && (
        <Card className="border-primary-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <span className="text-primary-600">
                  {keyQuestionIcons[selectedKeyQuestion]}
                </span>
                <span>{selectedKeyQuestion} - Detailed View</span>
              </span>
              <button 
                onClick={() => setSelectedKeyQuestion(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const details = getCQCComplianceByKeyQuestion(selectedKeyQuestion);
              return (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-neutral-900">Overall Score</h3>
                      <p className="text-sm text-neutral-600">{keyQuestionDescriptions[selectedKeyQuestion]}</p>
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(details.compliance)}`}>
                      {details.compliance}%
                    </div>
                  </div>

                  {details.standards.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-3">Fundamental Standards</h4>
                      <div className="space-y-3">
                        {details.standards.map((standard) => (
                          <div key={standard.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {standard.isCompliant ? (
                                    <CheckCircle className="h-5 w-5 text-success-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-error-600" />
                                  )}
                                  <h5 className="font-medium text-neutral-900">{standard.name}</h5>
                                  <span className="text-xs text-neutral-500">({standard.regulation})</span>
                                </div>
                                <p className="text-sm text-neutral-600 mt-1">{standard.description}</p>
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-neutral-700 mb-1">Evidence Required:</p>
                                  <ul className="text-xs text-neutral-600 space-y-1">
                                    {standard.evidenceRequired.map((evidence, idx) => (
                                      <li key={idx} className="flex items-center space-x-1">
                                        <span className="w-1 h-1 bg-neutral-400 rounded-full"></span>
                                        <span>{evidence}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {details.statements.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-3">Quality Statements</h4>
                      <div className="space-y-3">
                        {details.statements.map((statement) => (
                          <div key={statement.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                {statement.isCompliant ? (
                                  <CheckCircle className="h-5 w-5 text-success-600" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-error-600" />
                                )}
                                <span className="text-xs bg-neutral-100 px-2 py-1 rounded">
                                  Weight: {statement.weight}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-neutral-700 mb-3">{statement.statement}</p>
                            <div>
                              <p className="text-xs font-medium text-neutral-700 mb-2">Evidence Items:</p>
                              <div className="space-y-2">
                                {statement.evidenceItems.map((evidence) => (
                                  <div key={evidence.id} className="flex items-center space-x-2 text-xs">
                                    {evidence.isComplete ? (
                                      <CheckCircle className="h-4 w-4 text-success-600" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-error-600" />
                                    )}
                                    <span className="flex-1">{evidence.description}</span>
                                    {evidence.completedDate && (
                                      <span className="text-neutral-500">
                                        {evidence.completedDate.toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComplianceCheck;