import React, { useEffect, useState } from 'react';
import { Database, Activity, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error';
  authentication: 'healthy' | 'warning' | 'error';
  api: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
}

interface SystemMetrics {
  uptime: string;
  activeUsers: number;
  dbConnections: number;
  responseTime: number;
  errorRate: number;
  storageUsed: number;
  storageTotal: number;
}

export const SystemStatus: React.FC = () => {
  const { userProfile } = useAuth();
  const [health, setHealth] = useState<SystemHealth>({
    database: 'healthy',
    authentication: 'healthy',
    api: 'healthy',
    storage: 'healthy',
  });
  const [metrics, setMetrics] = useState<SystemMetrics>({
    uptime: '99.8%',
    activeUsers: 127,
    dbConnections: 45,
    responseTime: 120,
    errorRate: 0.02,
    storageUsed: 23,
    storageTotal: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStatus();
    // Simulate real-time updates
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual system health check
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock some realistic variations
      setHealth({
        database: Math.random() > 0.9 ? 'warning' : 'healthy',
        authentication: 'healthy',
        api: Math.random() > 0.95 ? 'warning' : 'healthy',
        storage: metrics.storageUsed > 80 ? 'warning' : 'healthy',
      });
    } catch (err) {
      console.error('Error loading system status:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateMetrics = () => {
    setMetrics(prev => ({
      ...prev,
      activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
      dbConnections: Math.max(20, prev.dbConnections + Math.floor(Math.random() * 6 - 3)),
      responseTime: Math.max(50, prev.responseTime + Math.floor(Math.random() * 20 - 10)),
      errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.01),
    }));
  };

  // Redirect if not super admin
  if (userProfile?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Access denied. Super admin privileges required.</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading system status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Status</h1>
          <p className="text-gray-600">Real-time system health and performance monitoring</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database</p>
                <p className={`text-lg font-semibold ${getStatusColor(health.database)}`}>
                  {health.database.charAt(0).toUpperCase() + health.database.slice(1)}
                </p>
              </div>
              {getStatusIcon(health.database)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Authentication</p>
                <p className={`text-lg font-semibold ${getStatusColor(health.authentication)}`}>
                  {health.authentication.charAt(0).toUpperCase() + health.authentication.slice(1)}
                </p>
              </div>
              {getStatusIcon(health.authentication)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">API Services</p>
                <p className={`text-lg font-semibold ${getStatusColor(health.api)}`}>
                  {health.api.charAt(0).toUpperCase() + health.api.slice(1)}
                </p>
              </div>
              {getStatusIcon(health.api)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage</p>
                <p className={`text-lg font-semibold ${getStatusColor(health.storage)}`}>
                  {health.storage.charAt(0).toUpperCase() + health.storage.slice(1)}
                </p>
              </div>
              {getStatusIcon(health.storage)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">System Uptime</span>
                <span className="font-semibold text-green-600">{metrics.uptime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold">{metrics.activeUsers}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Database Connections</span>
                <span className="font-semibold">{metrics.dbConnections}/100</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Response Time</span>
                <span className={`font-semibold ${metrics.responseTime > 200 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {metrics.responseTime}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Error Rate</span>
                <span className={`font-semibold ${metrics.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'}`}>
                  {(metrics.errorRate * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Used Space</span>
                <span className="font-semibold">{metrics.storageUsed}GB of {metrics.storageTotal}GB</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    metrics.storageUsed > 80 ? 'bg-red-500' : 
                    metrics.storageUsed > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(metrics.storageUsed / metrics.storageTotal) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500">
                {metrics.storageUsed > 80 ? 
                  'Warning: Storage usage is high. Consider cleanup or expansion.' :
                  'Storage usage is within normal parameters.'
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent System Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">{new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString()}</span>
              <span>Database backup completed successfully</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">{new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString()}</span>
              <span>Security scan completed - no threats detected</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-gray-600">{new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString()}</span>
              <span>High CPU usage detected (resolved automatically)</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">{new Date(Date.now() - 60 * 60 * 1000).toLocaleTimeString()}</span>
              <span>System maintenance window completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 