// EVIDENCE & JOURNEY TRACKING DOCUMENTATION
// Comprehensive guide to the compliance evidence and journey tracking system

import React, { useState } from 'react';
import {
  BookOpen,
  Map,
  FolderOpen,
  BarChart3,
  Link,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Settings,
  Target,
  TrendingUp,
  Shield,
  Database,
  Workflow,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<SectionProps> = ({ title, children, icon, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <span className="mr-3 text-blue-600">{icon}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'typescript' }) => (
  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
    <code>{children}</code>
  </pre>
);

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
    <div className="flex items-center mb-3">
      <span className="mr-3 text-blue-600">{icon}</span>
      <h4 className="font-semibold text-gray-900">{title}</h4>
    </div>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

const Documentation: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <BookOpen className="h-12 w-12 text-blue-600 mr-4" />
          <h1 className="text-4xl font-bold text-gray-900">Evidence & Journey Tracking</h1>
        </div>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Comprehensive documentation for the compliance evidence collection and journey tracking system.
          Transform your compliance process from reactive evidence gathering to proactive journey management.
        </p>
      </div>

      {/* Quick Overview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center">
          <Target className="h-6 w-6 mr-2" />
          System Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Evidence Management</h3>
            <p className="text-blue-700 text-sm">
              Centralized collection, organization, and tracking of compliance evidence with automated workflows,
              file management, and approval processes.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">Journey Tracking</h3>
            <p className="text-blue-700 text-sm">
              Step-by-step compliance journey management with progress visualization, milestone tracking,
              and evidence linking to specific requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Core Features */}
      <CollapsibleSection
        title="Core Features & Capabilities"
        icon={<Shield />}
        defaultOpen={true}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <FeatureCard
            icon={<FolderOpen />}
            title="Evidence Collection"
            description="Upload, categorize, and manage all compliance evidence with automated metadata extraction and file organization."
          />
          <FeatureCard
            icon={<Map />}
            title="Journey Tracking"
            description="Follow predefined compliance paths with step-by-step guidance, progress tracking, and milestone celebrations."
          />
          <FeatureCard
            icon={<Link />}
            title="Evidence Linking"
            description="Connect evidence pieces to specific journey steps, creating a complete audit trail and proof of compliance."
          />
          <FeatureCard
            icon={<BarChart3 />}
            title="Progress Analytics"
            description="Real-time dashboards showing completion percentages, velocity metrics, and predictive completion dates."
          />
          <FeatureCard
            icon={<CheckCircle />}
            title="Approval Workflows"
            description="Multi-stage approval processes with reviewer assignments, status tracking, and automated notifications."
          />
          <FeatureCard
            icon={<TrendingUp />}
            title="Compliance Insights"
            description="Advanced analytics and reporting to identify gaps, track improvements, and demonstrate compliance readiness."
          />
        </div>
      </CollapsibleSection>

      {/* Evidence Management System */}
      <CollapsibleSection
        title="Evidence Management System"
        icon={<FolderOpen />}
      >
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Evidence Types & Categories</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'Documents', 'Policies', 'Procedures', 'Training Records',
                'Audit Reports', 'Certificates', 'Photos', 'Videos'
              ].map((type) => (
                <div key={type} className="bg-gray-100 px-3 py-2 rounded text-sm text-center">
                  {type}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Evidence Lifecycle</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { status: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
                { status: 'Under Review', color: 'bg-blue-100 text-blue-800' },
                { status: 'Approved', color: 'bg-green-100 text-green-800' },
                { status: 'Rejected', color: 'bg-red-100 text-red-800' },
                { status: 'Expired', color: 'bg-gray-100 text-gray-800' }
              ].map((item) => (
                <span key={item.status} className={`px-3 py-1 rounded-full text-sm font-medium ${item.color}`}>
                  {item.status}
                </span>
              ))}
            </div>
            <p className="text-gray-600 text-sm">
              Each evidence item follows a structured lifecycle from initial upload through review, approval,
              and eventual expiration or renewal.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">📤 Upload & Organize</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Drag-and-drop file upload</li>
                  <li>• Automatic metadata extraction</li>
                  <li>• Category and tag assignment</li>
                  <li>• Bulk upload capabilities</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">🔍 Review & Approve</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Multi-stage approval workflows</li>
                  <li>• Reviewer assignment and notifications</li>
                  <li>• Comment and feedback system</li>
                  <li>• Version control and history</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Compliance Journey System */}
      <CollapsibleSection
        title="Compliance Journey Tracking"
        icon={<Map />}
      >
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Journey Architecture</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Database className="h-6 w-6 text-blue-600" />
                  </div>
                  <h5 className="font-medium text-gray-900">Frameworks</h5>
                  <p className="text-sm text-gray-600">CQC, ISO, GDPR standards</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Workflow className="h-6 w-6 text-green-600" />
                  </div>
                  <h5 className="font-medium text-gray-900">Templates</h5>
                  <p className="text-sm text-gray-600">Predefined compliance paths</p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Target className="h-6 w-6 text-purple-600" />
                  </div>
                  <h5 className="font-medium text-gray-900">Journeys</h5>
                  <p className="text-sm text-gray-600">Practice-specific instances</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">CQC Compliance Journey Template</h4>
            <div className="space-y-3">
              {[
                { step: 1, title: 'Understand CQC Requirements', category: 'preparation', hours: 8 },
                { step: 2, title: 'Develop Policies & Procedures', category: 'policy', hours: 40 },
                { step: 3, title: 'Staff Training Program', category: 'training', hours: 24 },
                { step: 4, title: 'Risk Assessment & Management', category: 'assessment', hours: 16 },
                { step: 5, title: 'Quality Assurance Systems', category: 'system', hours: 20 },
                { step: 6, title: 'Documentation & Record Keeping', category: 'documentation', hours: 12 },
                { step: 7, title: 'Internal Audit & Review', category: 'audit', hours: 16 },
                { step: 8, title: 'CQC Registration Application', category: 'application', hours: 8 },
                { step: 9, title: 'Ongoing Compliance Monitoring', category: 'monitoring', hours: 4 }
              ].map((item) => (
                <div key={item.step} className="flex items-center p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-4">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{item.title}</h5>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                      <span>~{item.hours}h</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Progress Tracking Features</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2 text-blue-600" />
                  Visual Analytics
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Real-time progress charts</li>
                  <li>• Completion percentage tracking</li>
                  <li>• Velocity calculations (steps/week)</li>
                  <li>• Predictive completion dates</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-green-600" />
                  Timeline Management
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Target completion dates</li>
                  <li>• Deadline alerts and notifications</li>
                  <li>• Milestone celebrations</li>
                  <li>• Historical progress snapshots</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Evidence-Journey Integration */}
      <CollapsibleSection
        title="Evidence-Journey Integration"
        icon={<Link />}
      >
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Linking Evidence to Journey Steps</h4>
            <p className="text-gray-600 mb-4">
              The key innovation of this system is the ability to link evidence pieces directly to specific journey steps,
              creating a complete audit trail and proof of compliance.
            </p>
            
            <CodeBlock>
{`// Evidence can be linked to journey steps
interface JourneyStepEvidence {
  journey_step_id: string;
  evidence_item_id: string;
  relevance_score: number; // 1-5 rating
  is_primary: boolean;     // Main evidence for this step
  notes: string;           // Context about the link
}`}
            </CodeBlock>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Benefits of Integration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-800 mb-2">For Compliance Teams</h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Clear roadmap with step-by-step guidance</li>
                  <li>• Always know where you stand in the process</li>
                  <li>• Link proof directly to requirements</li>
                  <li>• Never miss important milestones</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-medium text-blue-800 mb-2">For Management</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Real-time compliance status visibility</li>
                  <li>• Resource planning with time estimates</li>
                  <li>• Complete audit readiness</li>
                  <li>• Team coordination and assignment</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Workflow Example</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</div>
                  <span className="text-gray-900">Start "Develop Policies & Procedures" step</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</div>
                  <span className="text-gray-900">Upload policy documents as evidence</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</div>
                  <span className="text-gray-900">Link evidence to the specific journey step</span>
                </div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">✓</div>
                  <span className="text-gray-900">Step automatically marked as having evidence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Technical Architecture */}
      <CollapsibleSection
        title="Technical Architecture"
        icon={<Database />}
      >
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Database Schema</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Evidence Tables</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">evidence_items</code> - Core evidence data</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">evidence_files</code> - File attachments</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">evidence_comments</code> - Review feedback</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">evidence_audit_log</code> - Change history</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Journey Tables</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">compliance_frameworks</code> - CQC, ISO, etc.</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">journey_templates</code> - Predefined paths</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">practice_journeys</code> - Active journeys</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">journey_step_evidence</code> - Evidence links</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Service Architecture</h4>
            <CodeBlock>
{`// Evidence Service
class EvidenceService {
  async uploadEvidence(data: EvidenceUploadRequest)
  async getEvidenceItems(filters: EvidenceSearchFilters)
  async updateEvidenceItem(id: string, updates: Partial<EvidenceItem>)
  async deleteEvidenceItem(id: string)
  async addComment(itemId: string, comment: string)
  async downloadFile(fileId: string)
}

// Journey Service  
class JourneyService {
  async getPracticeJourneys(filters?: JourneyFilters)
  async createPracticeJourney(request: CreatePracticeJourneyRequest)
  async updateJourneyStep(stepId: string, updates: UpdateJourneyStepRequest)
  async linkEvidenceToStep(stepId: string, evidenceId: string)
  async getJourneyAnalytics()
  async getJourneyProgressData(journeyId: string)
}`}
            </CodeBlock>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Security & Compliance</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Data Protection</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Row Level Security (RLS) policies</li>
                  <li>• Practice-based data isolation</li>
                  <li>• Encrypted file storage</li>
                  <li>• Audit trail for all changes</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">Access Control</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Role-based permissions</li>
                  <li>• Multi-tenant architecture</li>
                  <li>• Super admin global access</li>
                  <li>• Practice-specific user isolation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* User Guide */}
      <CollapsibleSection
        title="User Guide & Best Practices"
        icon={<Users />}
      >
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Getting Started</h4>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h5 className="font-medium text-gray-900">1. Start Your Compliance Journey</h5>
                <p className="text-sm text-gray-600">Navigate to the Compliance Journey page and click "Start New Journey" to begin with a CQC template.</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h5 className="font-medium text-gray-900">2. Upload Evidence</h5>
                <p className="text-sm text-gray-600">Use the Evidence Management page to upload documents, policies, and other compliance materials.</p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h5 className="font-medium text-gray-900">3. Link Evidence to Steps</h5>
                <p className="text-sm text-gray-600">Connect your evidence to specific journey steps to build a complete compliance picture.</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h5 className="font-medium text-gray-900">4. Track Progress</h5>
                <p className="text-sm text-gray-600">Monitor your progress through visual dashboards and analytics to stay on track.</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Best Practices</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h5 className="font-medium text-yellow-800 mb-2">📋 Evidence Organization</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use consistent naming conventions</li>
                  <li>• Add descriptive tags and categories</li>
                  <li>• Include version numbers for policies</li>
                  <li>• Set appropriate expiration dates</li>
                </ul>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h5 className="font-medium text-green-800 mb-2">🎯 Journey Management</h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Set realistic target completion dates</li>
                  <li>• Assign steps to specific team members</li>
                  <li>• Review progress weekly</li>
                  <li>• Celebrate milestone achievements</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Common Workflows</h4>
            <div className="space-y-3">
              <details className="border border-gray-200 rounded-lg">
                <summary className="p-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                  Policy Development Workflow
                </summary>
                <div className="p-3 border-t border-gray-200 text-sm text-gray-600">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Create policy document</li>
                    <li>Upload to Evidence Management</li>
                    <li>Link to "Develop Policies & Procedures" step</li>
                    <li>Submit for review and approval</li>
                    <li>Mark journey step as completed</li>
                  </ol>
                </div>
              </details>
              
              <details className="border border-gray-200 rounded-lg">
                <summary className="p-3 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                  Training Record Management
                </summary>
                <div className="p-3 border-t border-gray-200 text-sm text-gray-600">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Conduct staff training session</li>
                    <li>Upload training certificates and records</li>
                    <li>Link to "Staff Training Program" step</li>
                    <li>Track completion percentages</li>
                    <li>Schedule follow-up training</li>
                  </ol>
                </div>
              </details>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* API Reference */}
      <CollapsibleSection
        title="API Reference"
        icon={<Settings />}
      >
        <div className="space-y-6 mt-4">
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Evidence Management API</h4>
            <CodeBlock>
{`// Upload Evidence
POST /api/evidence
{
  "title": "Safeguarding Policy",
  "description": "Updated safeguarding policy for 2024",
  "type": "policy",
  "category": "safeguarding",
  "tags": ["policy", "safeguarding", "2024"],
  "expiry_date": "2025-12-31",
  "files": [/* file data */]
}

// Get Evidence Items
GET /api/evidence?type=policy&status=approved&page=1&limit=20

// Update Evidence
PUT /api/evidence/:id
{
  "status": "approved",
  "compliance_status": "compliant",
  "notes": "Policy approved by compliance team"
}`}
            </CodeBlock>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Journey Management API</h4>
            <CodeBlock>
{`// Create Journey
POST /api/journeys
{
  "template_id": "cqc-registration",
  "assigned_to": "user@example.com",
  "target_completion_date": "2024-12-31"
}

// Update Journey Step
PUT /api/journey-steps/:id
{
  "status": "completed",
  "completion_percentage": 100,
  "notes": "All policies have been developed and approved"
}

// Link Evidence to Step
POST /api/journey-steps/:stepId/evidence
{
  "evidence_item_id": "evidence-123",
  "relevance_score": 5,
  "is_primary": true,
  "notes": "Primary policy document for this requirement"
}`}
            </CodeBlock>
          </div>
        </div>
      </CollapsibleSection>

      {/* Footer */}
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
        <p className="text-gray-600 mb-4">
          This documentation covers the core features of the Evidence & Journey Tracking system.
          For additional support or feature requests, please contact your system administrator.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm">
          <a href="#" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ExternalLink className="h-4 w-4 mr-1" />
            User Guide
          </a>
          <a href="#" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ExternalLink className="h-4 w-4 mr-1" />
            API Documentation
          </a>
          <a href="#" className="text-blue-600 hover:text-blue-800 flex items-center">
            <ExternalLink className="h-4 w-4 mr-1" />
            Support Portal
          </a>
        </div>
      </div>
    </div>
  );
};

export default Documentation; 