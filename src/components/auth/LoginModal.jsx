import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  RefreshCw,
  UserPlus,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient.js';

function LoginModal({ showLogin, setShowLogin, setCurrentUser, setShowSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  if (!showLogin) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Profile not found. Please contact administrator.');
        setLoading(false);
        return;
      }

      if (
        !profileData.role ||
        (profileData.role !== 'admin' &&
          profileData.role !== 'lecturer' &&
          profileData.role !== 'examiner' &&
          profileData.role !== 'coordinator')
      ) {
        setError('Access denied. This panel is for administrators and lecturers only.');
        setLoading(false);
        return;
      }

      // Keep profiles.last_sign_in_at in sync for immediate UI accuracy.
      const { error: lastSignInError } = await supabase
        .from('profiles')
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq('id', data.user.id);

      if (lastSignInError) {
        console.error('Error updating last_sign_in_at on login:', lastSignInError);
      }

      const user = {
        id: profileData.id,
        name: profileData.full_name || data.user.email?.split('@')[0] || 'User',
        email: data.user.email,
        role: profileData.role || 'lecturer',
        avatar: profileData.full_name?.[0]?.toUpperCase() || data.user.email?.[0]?.toUpperCase() || 'U',
      };

      setCurrentUser(user);
      localStorage.setItem('adminUser', JSON.stringify(user));
      setShowLogin(false);
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-blue-100 text-sm mt-1">Sign in to continue to Baraton EMS</p>
            </div>
            <button onClick={() => setShowLogin(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500 dark:bg-gray-800 cursor-pointer"
              />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
            </label>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 animate-shake">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 mr-2 flex-shrink-0" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">{error}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </span>
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
            className="w-full py-3 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all font-medium flex items-center justify-center"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Lecturer Account
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            Student login?{' '}
            <a
              href="https://baraton-exam-timetable-web-app.vercel.app/"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400 font-medium transition-colors"
            >
              Go to student portal
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginModal;

