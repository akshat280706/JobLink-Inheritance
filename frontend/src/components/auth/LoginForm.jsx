import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await login(formData);
      const userType = response.profile.user_type;

      navigate(
        userType === 'candidate'
          ? '/candidate/dashboard'
          : '/company/dashboard'
      );
    } catch (err) {
      setError('Invalid email or password.');
      console.error('Login failed:', err);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(error.message);
        console.error('Google sign-in error:', error);
      }
    } catch (err) {
      toast.error('Failed to sign in with Google');
      console.error('Google sign-in error:', err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Google Sign In Button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full btn btn-lg bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-md"
      >
        {isGoogleLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <>
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </>
        )}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">
            Or continue with email
          </span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">
              Email Address
            </span>
          </label>
          <label className="input input-bordered flex items-center gap-3 focus-within:border-gray-900 rounded-md h-12 border-gray-300">
            <Mail className="w-5 h-5 text-gray-400" />
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              autoComplete="email"
              className="grow text-gray-900"
            />
          </label>
        </div>

        {/* Password */}
        <div className="form-control">
          <div className="flex items-center justify-between mb-2">
            <label className="label-text font-medium text-gray-700">
              Password
            </label>
            <a
              href="/forgot-password"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Forgot password?
            </a>
          </div>

          <label className="input input-bordered flex items-center gap-3 focus-within:border-gray-900 rounded-md h-12 border-gray-300 relative">
            <Lock className="w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              autoComplete="current-password"
              className="grow text-gray-900 pr-8"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-500 hover:text-gray-900"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>
        </div>

        {/* Remember Me */}
        <div className="form-control">
          <label className="cursor-pointer flex items-center gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-sm border-gray-300"
            />
            <span className="label-text text-gray-600">
              Remember me
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-lg w-full bg-gray-900 hover:bg-gray-800 text-white border-0 rounded-md"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;