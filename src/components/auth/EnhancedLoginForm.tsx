import React, { useState } from 'react';
import { Mail, Loader2, Eye, EyeOff, Key } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

type AuthMode = 'magic-link' | 'password';

export const EnhancedLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('magic-link');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signInWithPassword } = useAuth();

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const normalizedEmail = email.toLowerCase().trim();
    const { error } = await signIn(normalizedEmail);

    if (error) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('An unknown error occurred. Please try again.');
      }
    } else {
      setMessage(`Check your email (${normalizedEmail}) for a magic link to sign in!`);
    }

    setLoading(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const normalizedEmail = email.toLowerCase().trim();
    const { error } = await signInWithPassword(normalizedEmail, password);

    if (error) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('An unknown error occurred. Please try again.');
      }
    } else {
      setMessage('Signing in...');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Options</CardTitle>
            
            {/* Auth Mode Toggle */}
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setAuthMode('magic-link')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'magic-link'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="h-4 w-4" />
                <span>Magic Link</span>
                <span className="text-xs text-green-600 font-semibold">(Recommended)</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'password'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Key className="h-4 w-4" />
                <span>Password</span>
              </button>
            </div>
          </CardHeader>

          <CardContent>
            {authMode === 'magic-link' ? (
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your email address"
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex">
                    <Mail className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div className="ml-3 text-sm text-blue-700">
                      <p><strong>Secure Magic Link Authentication</strong></p>
                      <p>We'll send you a secure, single-use link to sign in. No password needed!</p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex justify-center items-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Sending...' : 'Send Magic Link'}</span>
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email-password" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email-password"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Enter your email address"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-amber-50 p-3 rounded-md">
                  <div className="flex">
                    <Key className="h-5 w-5 text-amber-400 mt-0.5" />
                    <div className="ml-3 text-sm text-amber-700">
                      <p><strong>Password Authentication</strong></p>
                      <p>For admin users with pre-configured passwords. Magic links are recommended for better security.</p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full flex justify-center items-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Signing in...' : 'Sign In with Password'}</span>
                </Button>
              </form>
            )}

            {message && (
              <div className={`mt-4 p-3 rounded-md ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {message}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Having trouble? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}; 