import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const SignupForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    userType: 'candidate',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const { signup, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      await signup(formData);
      navigate('/login');
    } catch (err) {
      setError('Signup failed. Please try again.');
      console.error(err);
    }
  };

  const handleGoogleSignUp = () => {
    alert('Google Sign-Up coming soon!');
  };

  return (
    <div className="space-y-6">

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Google Sign Up */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="w-full btn btn-lg bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 rounded-md"
      >
        Sign up with Google
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

      {/* Account Type */}
      <div className="grid grid-cols-2 gap-3">
        {['candidate', 'company'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFormData({ ...formData, userType: type })}
            className={`btn h-auto py-4 rounded-md ${
              formData.userType === type
                ? 'bg-gray-900 text-white border-0'
                : 'btn-outline border-2 border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              {type === 'candidate' ? (
                <User className="w-5 h-5" />
              ) : (
                <Building className="w-5 h-5" />
              )}
              <span>
                {type === 'candidate' ? 'Job Seeker' : 'Employer'}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name */}
        <div className="form-control">
          <label className="label-text font-medium text-gray-700 mb-2">
            {formData.userType === 'candidate'
              ? 'Full Name'
              : 'Company Name'}
          </label>

          <div className="input input-bordered flex items-center gap-3 rounded-md h-12 border-gray-300">
            {formData.userType === 'candidate' ? (
              <User className="w-5 h-5 text-gray-400" />
            ) : (
              <Building className="w-5 h-5 text-gray-400" />
            )}
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder={
                formData.userType === 'candidate'
                  ? 'John Doe'
                  : 'ABC Corp'
              }
              required
              autoComplete="name"
              className="grow text-gray-900"
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-control">
          <label className="label-text font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="input input-bordered flex items-center gap-3 rounded-md h-12 border-gray-300">
            <Mail className="w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="grow text-gray-900"
            />
          </div>
        </div>

        {/* Password */}
        <div className="form-control">
          <label className="label-text font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative input input-bordered flex items-center gap-3 rounded-md h-12 border-gray-300">
            <Lock className="w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              autoComplete="new-password"
              minLength={6}
              placeholder="••••••••"
              className="grow text-gray-900 pr-8"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-500 hover:text-gray-900"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="form-control">
          <label className="label-text font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative input input-bordered flex items-center gap-3 rounded-md h-12 border-gray-300">
            <Lock className="w-5 h-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              required
              autoComplete="new-password"
              placeholder="••••••••"
              className="grow text-gray-900 pr-8"
            />
            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              className="absolute right-3 text-gray-500 hover:text-gray-900"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>
        </div>

        {/* Terms */}
        <div className="form-control">
          <label className="cursor-pointer flex items-start gap-3">
            <input
              type="checkbox"
              className="checkbox checkbox-sm mt-1 border-gray-300"
              required
            />
            <span className="text-sm text-gray-600">
              I agree to the{' '}
              <a href="/terms" className="text-gray-900 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-gray-900 hover:underline">
                Privacy Policy
              </a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-lg w-full bg-gray-900 hover:bg-gray-800 text-white border-0 rounded-md"
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
