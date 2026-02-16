import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'candidate',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('candidate');

  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        userType: formData.userType,
      });

      navigate(
        formData.userType === 'candidate'
          ? '/candidate/dashboard'
          : '/company/dashboard'
      );
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
      console.error('Signup failed:', err);
    }
  };

  const handleGoogleSignUp = async (userType) => {
    setIsGoogleLoading(true);
    try {
      // Store user type for callback handler
      localStorage.setItem('oauth_user_type', userType);

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
        console.error('Google sign-up error:', error);
      }
    } catch (err) {
      toast.error('Failed to sign up with Google');
      console.error('Google sign-up error:', err);
    } finally {
      setIsGoogleLoading(false);
      setShowUserTypeModal(false);
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

      {/* Google Sign Up Button - Opens Modal */}
      <button
        type="button"
        onClick={() => setShowUserTypeModal(true)}
        disabled={isGoogleLoading}
        className="w-full btn btn-lg bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-md"
      >
        {isGoogleLoading ? (
          <span className="loading loading-spinner loading-sm"></span>
        ) : (
          <>
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </>
        )}
      </button>

      {/* User Type Selection Modal */}
      {showUserTypeModal && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Select Account Type</h3>
            <p className="text-gray-600 mb-6">
              Are you signing up as a job seeker or employer?
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSelectedUserType('candidate')}
                className={`btn h-auto py-6 rounded-md flex flex-col items-center gap-3 ${
                  selectedUserType === 'candidate'
                    ? 'bg-gray-900 text-white border-0'
                    : 'btn-outline border-2 border-gray-300'
                }`}
              >
                <User className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Job Seeker</div>
                  <div className="text-xs opacity-70 mt-1">
                    Looking for jobs
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSelectedUserType('company')}
                className={`btn h-auto py-6 rounded-md flex flex-col items-center gap-3 ${
                  selectedUserType === 'company'
                    ? 'bg-gray-900 text-white border-0'
                    : 'btn-outline border-2 border-gray-300'
                }`}
              >
                <Building className="w-8 h-8" />
                <div className="text-center">
                  <div className="font-semibold">Employer</div>
                  <div className="text-xs opacity-70 mt-1">
                    Hiring talent
                  </div>
                </div>
              </button>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowUserTypeModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn bg-gray-900 text-white hover:bg-gray-800 border-0"
                onClick={() => handleGoogleSignUp(selectedUserType)}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Continue with Google'
                )}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowUserTypeModal(false)}>close</button>
          </form>
        </dialog>
      )}

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
        {/* User Type Selection */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">
              I am a
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, userType: 'candidate' })
              }
              className={`btn h-auto py-4 rounded-md flex flex-col items-center gap-2 ${
                formData.userType === 'candidate'
                  ? 'bg-gray-900 text-white border-0'
                  : 'btn-outline border-2 border-gray-300'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-sm font-medium">Job Seeker</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, userType: 'company' })
              }
              className={`btn h-auto py-4 rounded-md flex flex-col items-center gap-2 ${
                formData.userType === 'company'
                  ? 'bg-gray-900 text-white border-0'
                  : 'btn-outline border-2 border-gray-300'
              }`}
            >
              <Building className="w-6 h-6" />
              <span className="text-sm font-medium">Employer</span>
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">
              {formData.userType === 'candidate'
                ? 'Full Name'
                : 'Company Name'}
            </span>
          </label>
          <label className="input input-bordered flex items-center gap-3 focus-within:border-gray-900 rounded-md h-12 border-gray-300">
            <User className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={
                formData.userType === 'candidate'
                  ? 'John Doe'
                  : 'Acme Corporation'
              }
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              required
              autoComplete="name"
              className="grow text-gray-900"
            />
          </label>
        </div>

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
          <label className="label">
            <span className="label-text font-medium text-gray-700">
              Password
            </span>
          </label>
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
              autoComplete="new-password"
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
          <label className="label">
            <span className="label-text-alt text-gray-500">
              Minimum 6 characters
            </span>
          </label>
        </div>

        {/* Confirm Password */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">
              Confirm Password
            </span>
          </label>
          <label className="input input-bordered flex items-center gap-3 focus-within:border-gray-900 rounded-md h-12 border-gray-300 relative">
            <Lock className="w-5 h-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              autoComplete="new-password"
              className="grow text-gray-900 pr-8"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 text-gray-500 hover:text-gray-900"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </label>
        </div>

        {/* Terms */}
        <div className="form-control">
          <label className="cursor-pointer flex items-start gap-3">
            <input
              type="checkbox"
              required
              className="checkbox checkbox-sm border-gray-300 mt-0.5"
            />
            <span className="label-text text-gray-600 text-sm">
              I agree to the{' '}
              <a href="/terms" className="text-gray-900 font-medium hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-gray-900 font-medium hover:underline">
                Privacy Policy
              </a>
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
            'Create Account'
          )}
        </button>
      </form>
    </div>
  );
};

export default SignupForm;