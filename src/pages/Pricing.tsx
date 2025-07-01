import React from 'react';
import { Check, Star, Zap, Shield, Users, BarChart3, Settings, Globe } from 'lucide-react';

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limits: {
    users: number;
    staff: number;
    tasks: number;
  };
  popular?: boolean;
  cta: string;
  color: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for small practices getting started with compliance management',
    features: [
      'Basic compliance tracking',
      'Staff management',
      'Task assignment',
      'Email support',
      'Basic dashboard',
      'Data export (CSV)',
    ],
    limits: {
      users: 5,
      staff: 25,
      tasks: 50,
    },
    cta: 'Get Started Free',
    color: 'gray',
  },
  {
    name: 'Basic',
    price: '$29',
    period: 'per month',
    description: 'Ideal for growing practices that need advanced reporting and analytics',
    features: [
      'Everything in Free',
      'Advanced reporting & analytics',
      'Custom compliance templates',
      'Priority email support',
      'Advanced dashboard',
      'Data export (Excel, PDF)',
      'Automated reminders',
      'Bulk operations',
    ],
    limits: {
      users: 25,
      staff: 100,
      tasks: 250,
    },
    popular: true,
    cta: 'Start Free Trial',
    color: 'blue',
  },
  {
    name: 'Premium',
    price: '$99',
    period: 'per month',
    description: 'For large practices requiring enterprise features and maximum customization',
    features: [
      'Everything in Basic',
      'API access & integrations',
      'Custom branding & white-label',
      'Advanced user permissions',
      'Dedicated account manager',
      'Phone & chat support',
      'Custom compliance workflows',
      'Advanced audit trails',
      'SSO integration',
      'Custom reporting',
    ],
    limits: {
      users: 100,
      staff: 500,
      tasks: 1000,
    },
    cta: 'Contact Sales',
    color: 'purple',
  },
];

const additionalFeatures = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-level encryption, SOC 2 compliance, and advanced security features',
  },
  {
    icon: Users,
    title: 'Multi-Tenant Architecture',
    description: 'Complete data isolation between practices with role-based access control',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Comprehensive reporting and insights to optimize your compliance processes',
  },
  {
    icon: Globe,
    title: 'Global Compliance',
    description: 'Support for international compliance standards and regulations',
  },
];

const PricingCard: React.FC<{ tier: PricingTier }> = ({ tier }) => {
  const colorClasses = {
    gray: {
      border: 'border-gray-200',
      button: 'bg-gray-600 hover:bg-gray-700 text-white',
      accent: 'text-gray-600',
      badge: 'bg-gray-100 text-gray-800',
    },
    blue: {
      border: 'border-blue-200 ring-2 ring-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700 text-white',
      accent: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800',
    },
    purple: {
      border: 'border-purple-200',
      button: 'bg-purple-600 hover:bg-purple-700 text-white',
      accent: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800',
    },
  };

  const colors = colorClasses[tier.color as keyof typeof colorClasses];

  return (
    <div className={`relative bg-white rounded-2xl shadow-lg ${colors.border} p-8 ${tier.popular ? 'transform scale-105' : ''}`}>
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className={`inline-flex items-center px-4 py-1 rounded-full text-sm font-medium ${colors.badge}`}>
            <Star className="w-4 h-4 mr-1" />
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
          <span className="text-gray-600 ml-2">/{tier.period}</span>
        </div>
        <p className="text-gray-600 text-sm">{tier.description}</p>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 mb-4">Usage Limits</h4>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className={`text-2xl font-bold ${colors.accent}`}>{tier.limits.users}</div>
            <div className="text-sm text-gray-600">Users</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${colors.accent}`}>{tier.limits.staff}</div>
            <div className="text-sm text-gray-600">Staff</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${colors.accent}`}>{tier.limits.tasks}</div>
            <div className="text-sm text-gray-600">Tasks</div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="font-semibold text-gray-900 mb-4">Features</h4>
        <ul className="space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className={`w-5 h-5 ${colors.accent} mr-3 mt-0.5 flex-shrink-0`} />
              <span className="text-gray-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${colors.button}`}>
        {tier.cta}
      </button>
    </div>
  );
};

export const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Harmony360 Plan
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your compliance management with our flexible pricing plans. 
              Start free and scale as your practice grows.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {pricingTiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>

      {/* Additional Features */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-lg text-gray-600">
              Built for healthcare practices that demand the highest standards
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I upgrade or downgrade my plan at any time?
              </h3>
              <p className="text-gray-600">
                Yes, you can change your plan at any time. Upgrades take effect immediately, 
                while downgrades take effect at the end of your current billing cycle.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I exceed my plan limits?
              </h3>
              <p className="text-gray-600">
                We'll notify you when you're approaching your limits. You can upgrade your plan 
                or we'll help you optimize your usage to stay within your current limits.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is my data secure and compliant?
              </h3>
              <p className="text-gray-600">
                Absolutely. Harmony360 is built with enterprise-grade security, including 
                encryption at rest and in transit, SOC 2 compliance, and HIPAA-ready infrastructure.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer custom enterprise plans?
              </h3>
              <p className="text-gray-600">
                Yes, we offer custom enterprise plans for large organizations with specific 
                requirements. Contact our sales team to discuss your needs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Compliance Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of healthcare practices already using Harmony360
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Start Free Trial
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 