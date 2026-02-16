import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useAuthStore } from "../../store/authStore";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import toast from "react-hot-toast";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("🔄 Starting OAuth callback...");

        // Wait for session with retries
        let session = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!session && attempts < maxAttempts) {
          const { data, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("Session error:", sessionError);
            throw sessionError;
          }

          if (data?.session) {
            session = data.session;
            break;
          }

          attempts++;
          console.log(`⏳ Waiting for session... (${attempts}/${maxAttempts})`);
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (!session) {
          throw new Error("No session found after multiple attempts");
        }

        const user = session.user;
        console.log("✅ Got user:", user.email);

        // Get stored user type or default to candidate
        const userType = localStorage.getItem("oauth_user_type") || "candidate";
        localStorage.removeItem("oauth_user_type");

        // Store token for backend
        localStorage.setItem("token", session.access_token);

        // CRITICAL: Ensure profile exists in database
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        let profile;
        if (!existingProfile) {
          // Create profile if it doesn't exist
          console.log("🆕 Creating new profile...");
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0],
              profile_pic:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                null,
              user_type: userType,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (insertError) {
            console.error("Profile creation error:", insertError);
            throw insertError;
          }

          profile = newProfile;
        } else {
          // Update existing profile with Google data
          console.log("✅ Profile exists, updating...");
          const { data: updatedProfile, error: updateError } = await supabase
            .from("profiles")
            .update({
              profile_pic:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                existingProfile.profile_pic,
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                existingProfile.full_name,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)
            .select()
            .single();

          if (updateError) {
            console.error("Profile update error:", updateError);
            throw updateError;
          }

          profile = updatedProfile;
        }

        console.log("✅ Profile ready:", profile);

        // Update localStorage with user and profile data
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("profile", JSON.stringify(profile));

        // Update authStore state manually
        useAuthStore.setState({
          user: user,
          profile: profile,
          session: session,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Redirect based on user type
        const redirectPath =
          profile.user_type === "company"
            ? "/company/dashboard"
            : "/candidate/dashboard";

        console.log("🎉 OAuth complete! Redirecting to:", redirectPath);
        toast.success("Successfully signed in with Google!");

        // Small delay to ensure state is set
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 500);

      } catch (err) {
        console.error("❌ OAuth callback failed:", err);
        setError(err.message || "Authentication failed");
        toast.error("Authentication failed. Please try again.");

        // Redirect to login after showing error
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 font-medium">Completing sign in...</p>
        <p className="mt-2 text-sm text-gray-500">Please wait...</p>
      </div>
    </div>
  );
};

export default AuthCallback;