import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('Authenticating...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      setStatus('Verifying session...');

      // Wait for session with retry logic
      let session = null;
      let attempts = 0;
      const maxAttempts = 10;

      while (!session && attempts < maxAttempts) {
        const { data: { session: currentSession }, error: sessionError } = 
          await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }

        if (currentSession) {
          session = currentSession;
          break;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (!session) {
        throw new Error('No session found after authentication');
      }

      setStatus('Setting up your profile...');

      const user = session.user;
      const token = session.access_token;

      // Get user type from localStorage (set before OAuth redirect)
      const oauthUserType = localStorage.getItem('oauth_user_type') || 'candidate';

      // Check if profile exists
      const { data: existingProfile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      let profile;

      if (profileFetchError || !existingProfile) {
        // Profile doesn't exist, create it
        const newProfileData = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          profile_pic: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
          user_type: oauthUserType, // Use the selected user type
        };

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfileData)
          .select()
          .single();

        if (createError) {
          console.error('Profile creation error:', createError);
          throw new Error('Failed to create profile');
        }

        profile = newProfile;
        console.log('✅ Profile created:', profile);
      } else {
        // Profile exists, update it with Google metadata
        const updateData = {
          full_name: user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     existingProfile.full_name,
          profile_pic: user.user_metadata?.avatar_url || 
                       user.user_metadata?.picture || 
                       existingProfile.profile_pic,
          email: user.email,
        };

        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)
          .select()
          .single();

        if (updateError) {
          console.error('Profile update error:', updateError);
          // Use existing profile if update fails
          profile = existingProfile;
        } else {
          profile = updatedProfile;
          console.log('✅ Profile updated:', profile);
        }
      }

      // Store in localStorage for backend
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('profile', JSON.stringify(profile));

      // Clean up oauth_user_type
      localStorage.removeItem('oauth_user_type');

      // Update authStore manually
      const { useAuthStore } = await import('../../store/authStore');
      useAuthStore.setState({
        user,
        profile,
        token,
        isAuthenticated: true,
      });

      setStatus('Redirecting...');

      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect based on user type
      if (profile.user_type === 'candidate') {
        navigate('/candidate/dashboard', { replace: true });
      } else {
        navigate('/company/dashboard', { replace: true });
      }

      toast.success('Successfully signed in!');

    } catch (err) {
      console.error('Auth callback error:', err);
      setError(err.message || 'Authentication failed');
      setStatus('Authentication failed');
      
      toast.error('Authentication failed. Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Redirecting to login page...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-16 w-16 text-gray-900 animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Setting Up Your Account
          </h2>
          <p className="text-gray-600">{status}</p>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                style={{ width: '75%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;