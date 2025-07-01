import React, { useState } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Normalize email to lowercase
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

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome to Harmony360
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md placeholder-neutral-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.includes('Error') 
                    ? 'bg-error-50 text-error-800' 
                    : 'bg-success-50 text-success-800'
                }`}>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>

            <div className="mt-4 text-xs text-neutral-500">
              <p>We'll send you a secure link to sign in without a password.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 