import React from 'react';
import { Users, UserCheck, ListChecks, AlertTriangle, Crown, Zap } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';

interface UsageBarProps {
  current: number;
  max: number;
  label: string;
  icon: React.ReactNode;
  type: 'users' | 'staff' | 'tasks';
}

const UsageBar: React.FC<UsageBarProps> = ({ current, max, label, icon, type }) => {
  const percentage = Math.round((current / max) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getBarColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isAtLimit) return 'text-red-700';
    if (isNearLimit) return 'text-yellow-700';
    return 'text-green-700';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="mr-2 text-gray-600">{icon}</div>
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        {isNearLimit && (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className={getTextColor()}>
            {current} of {max} used
          </span>
          <span className={getTextColor()}>
            {percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getBarColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      
      {isAtLimit && (
        <div className="text-xs text-red-600 bg-red-50 rounded p-2">
          Limit reached. Upgrade your plan to add more {type}.
        </div>
      )}
      {isNearLimit && !isAtLimit && (
        <div className="text-xs text-yellow-600 bg-yellow-50 rounded p-2">
          Approaching limit. Consider upgrading your plan.
        </div>
      )}
    </div>
  );
};

export const UsageDashboard: React.FC = () => {
  const { subscription, loading, error } = useSubscription();

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center text-red-600">
          <AlertTriangle className="w-5 h-5 mr-2" />
          <span>Unable to load subscription information</span>
        </div>
      </div>
    );
  }

  const getTierIcon = () => {
    switch (subscription.subscription_tier) {
      case 'premium':
        return <Crown className="w-5 h-5 text-purple-600" />;
      case 'basic':
        return <Zap className="w-5 h-5 text-blue-600" />;
      default:
        return <Users className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTierColor = () => {
    switch (subscription.subscription_tier) {
      case 'premium':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'basic':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Plan Header */}
      <div className={`rounded-lg border p-4 ${getTierColor()}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getTierIcon()}
            <div className="ml-3">
              <h3 className="font-semibold capitalize">
                {subscription.subscription_tier} Plan
              </h3>
              <p className="text-sm opacity-75">
                {subscription.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {subscription.is_active ? 'Active' : 'Suspended'}
            </div>
          </div>
        </div>
      </div>

      {/* Usage Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UsageBar
          current={subscription.limits.current_users}
          max={subscription.limits.max_users}
          label="Users"
          icon={<Users className="w-4 h-4" />}
          type="users"
        />
        <UsageBar
          current={subscription.limits.current_staff}
          max={subscription.limits.max_staff}
          label="Staff"
          icon={<UserCheck className="w-4 h-4" />}
          type="staff"
        />
        <UsageBar
          current={subscription.limits.current_tasks}
          max={subscription.limits.max_tasks}
          label="Tasks"
          icon={<ListChecks className="w-4 h-4" />}
          type="tasks"
        />
      </div>

      {/* Features */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Available Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`flex items-center p-2 rounded ${subscription.features.reports ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${subscription.features.reports ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm">Advanced Reports</span>
          </div>
          <div className={`flex items-center p-2 rounded ${subscription.features.api_access ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${subscription.features.api_access ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm">API Access</span>
          </div>
          <div className={`flex items-center p-2 rounded ${subscription.features.custom_branding ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
            <div className={`w-2 h-2 rounded-full mr-2 ${subscription.features.custom_branding ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm">Custom Branding</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 