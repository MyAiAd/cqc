import React, { useEffect, useState } from 'react';
import { Building, Plus, Edit, Eye, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { getAllPractices, createPractice } from '../../services/dataService';

interface Practice {
  id: string;
  name: string;
  email_domain: string;
  subscription_tier: 'free' | 'basic' | 'premium';
  created_at: string;
  updated_at: string;
}

interface NewPracticeData {
  name: string;
  email_domain: string;
  subscription_tier: 'free' | 'basic' | 'premium';
}

export const ManagePractices: React.FC = () => {
  const { userProfile } = useAuth();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPractice, setNewPractice] = useState<NewPracticeData>({
    name: '',
    email_domain: '',
    subscription_tier: 'free'
  });

  useEffect(() => {
    loadPractices();
  }, []);

  const loadPractices = async () => {
    try {
      setLoading(true);
      const data = await getAllPractices();
      setPractices(data);
    } catch (err) {
      setError('Failed to load practices');
      console.error('Error loading practices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPractice.name || !newPractice.email_domain) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      await createPractice(newPractice);
      setShowAddModal(false);
      setNewPractice({
        name: '',
        email_domain: '',
        subscription_tier: 'free'
      });
      await loadPractices(); // Refresh the list
    } catch (err) {
      setError('Failed to create practice. Please try again.');
      console.error('Error creating practice:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const resetModal = () => {
    setShowAddModal(false);
    setNewPractice({
      name: '',
      email_domain: '',
      subscription_tier: 'free'
    });
    setError(null);
  };

  // Redirect if not super admin
  if (userProfile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. Super admin privileges required.</p>
        </div>
      </div>
    );
  }

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Practices</h1>
          <p className="text-gray-600">Oversee all healthcare practices in the system</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Practice</span>
        </Button>
      </div>

      {/* Add Practice Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add New Practice</h2>
              <button
                onClick={resetModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePractice} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Practice Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newPractice.name}
                  onChange={(e) => setNewPractice(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter practice name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email_domain" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Domain *
                </label>
                <input
                  type="text"
                  id="email_domain"
                  value={newPractice.email_domain}
                  onChange={(e) => setNewPractice(prev => ({ ...prev, email_domain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="subscription_tier" className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Tier
                </label>
                <select
                  id="subscription_tier"
                  value={newPractice.subscription_tier}
                  onChange={(e) => setNewPractice(prev => ({ ...prev, subscription_tier: e.target.value as 'free' | 'basic' | 'premium' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  onClick={resetModal}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Practice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && !showAddModal && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <Button onClick={loadPractices} className="mt-2">
            Retry
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Building className="h-12 w-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">{practices.length}</h3>
              <p className="text-gray-600">Total Practices</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">
                {practices.filter(p => p.subscription_tier === 'premium').length}
              </h3>
              <p className="text-gray-600">Premium Practices</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">
                {practices.filter(p => new Date(p.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
              </h3>
              <p className="text-gray-600">New This Month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Practice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {practices.map((practice) => (
                  <tr key={practice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {practice.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {practice.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {practice.email_domain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionColor(practice.subscription_tier)}`}>
                        {practice.subscription_tier.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(practice.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button className="text-primary-600 hover:text-primary-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {practices.length === 0 && (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No practices found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 