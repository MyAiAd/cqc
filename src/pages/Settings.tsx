import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useDebugMode } from '../hooks/useDebugMode';
import { updatePractice, getPracticeById } from '../services/dataService';

export const Settings: React.FC = () => {
  const { userProfile } = useAuth();
  const { debugMode, toggleDebugMode } = useDebugMode();
  const [practiceData, setPracticeData] = useState({
    name: '',
    email_domain: '',
    subscription_tier: 'free' as 'free' | 'basic' | 'premium'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const isSuperAdmin = userProfile?.role === 'super_admin';

  // Load practice data on component mount
  useEffect(() => {
    const loadPracticeData = async () => {
      if (!userProfile?.practice_id) {
        setLoading(false);
        return;
      }

      try {
        const practice = await getPracticeById(userProfile.practice_id);
        setPracticeData({
          name: practice.name || '',
          email_domain: practice.email_domain || '',
          subscription_tier: practice.subscription_tier || 'free'
        });
      } catch (error) {
        console.error('Error loading practice data:', error);
        setMessage({ type: 'error', text: 'Failed to load practice information' });
      } finally {
        setLoading(false);
      }
    };

    if (userProfile?.practice_id) {
      loadPracticeData();
    } else {
      setLoading(false);
    }
  }, []); // Empty dependency - run only once on mount

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile?.practice_id) {
      setMessage({ type: 'error', text: 'No practice associated with your account' });
      return;
    }

    // For super admins, prevent updating the system administration practice
    if (isSuperAdmin && userProfile.practice_id === '00000000-0000-0000-0000-000000000001') {
      setMessage({ type: 'error', text: 'System Administration practice cannot be modified' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await updatePractice(userProfile.practice_id, {
        name: practiceData.name,
        email_domain: practiceData.email_domain,
        subscription_tier: practiceData.subscription_tier
      });
      
      setMessage({ type: 'success', text: 'Practice settings updated successfully!' });
    } catch (error) {
      console.error('Error updating practice:', error);
      setMessage({ type: 'error', text: 'Failed to update practice settings' });
    } finally {
      setSaving(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setPracticeData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Practice Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Loading practice information...</span>
            </div>
          ) : (
            <>
              {message && (
                <div className={`mb-4 p-3 rounded-md ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}
              
              {isSuperAdmin && userProfile?.practice_id === '00000000-0000-0000-0000-000000000001' && (
                <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800">
                  <strong>Note:</strong> As a super admin, you cannot modify the System Administration practice. 
                  Use the Practice Management page to manage other practices.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="practiceName" className="block text-sm font-medium text-neutral-700">
                    Practice Name
                  </label>
                  <input
                    type="text"
                    id="practiceName"
                    value={practiceData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={isSuperAdmin && userProfile?.practice_id === '00000000-0000-0000-0000-000000000001'}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter practice name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="emailDomain" className="block text-sm font-medium text-neutral-700">
                    Email Domain
                  </label>
                  <input
                    type="text"
                    id="emailDomain"
                    value={practiceData.email_domain}
                    onChange={(e) => handleInputChange('email_domain', e.target.value)}
                    disabled={isSuperAdmin && userProfile?.practice_id === '00000000-0000-0000-0000-000000000001'}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="practice.nhs.uk"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Users with email addresses from this domain will be automatically assigned to this practice
                  </p>
                </div>

                <div>
                  <label htmlFor="subscriptionTier" className="block text-sm font-medium text-neutral-700">
                    Subscription Tier
                  </label>
                  <select
                    id="subscriptionTier"
                    value={practiceData.subscription_tier}
                    onChange={(e) => handleInputChange('subscription_tier', e.target.value)}
                    disabled={isSuperAdmin && userProfile?.practice_id === '00000000-0000-0000-0000-000000000001'}
                    className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>

                <Button 
                  type="submit" 
                  disabled={saving || (isSuperAdmin && userProfile?.practice_id === '00000000-0000-0000-0000-000000000001')}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Email Notifications</h3>
                <p className="text-sm text-neutral-500">Receive updates about task changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super Admin Only - Debug Mode Toggle */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Developer Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-neutral-900">Debug Mode</h3>
                  <p className="text-sm text-neutral-500">Show debug information on the dashboard</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={debugMode}
                    onChange={toggleDebugMode}
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Debug mode displays technical information about user authentication, 
                  database queries, and system state. This is intended for development and troubleshooting purposes only.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};