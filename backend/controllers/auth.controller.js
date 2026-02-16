import { supabase } from '../lib/supabase.config.js';
import { uploadToSupabase } from '../lib/supabaseStorage.js';

export const signup = async (req, res) => {
  const { email, fullName, password, userType } = req.body;

  console.log("REQ BODY:", req.body);
  try {
    if (!fullName || !password || !userType) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!['candidate', 'company'].includes(userType)) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // 1️⃣ Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      return res.status(400).json({ message: authError.message });
    }

    // 2️⃣ Create profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        user_type: userType
      })
      .select()
      .single();

    if (profileError) {
      return res.status(400).json({ message: profileError.message });
    }

    res.status(201).json({
      user: authData.user,
      profile
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("BODY:", req.body);

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return res.status(400).json({ message: "Profile not found" });
    }

    res.status(200).json({
      user: data.user,
      session: data.session,
      profile
    });

  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    return res.status(200).json({
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    const userId = req.user.id;

    // Upload to Supabase Storage
    const uploadResult = await uploadToSupabase(
      profilePic, 
      'profile-pictures',
      `profile_${userId}_${Date.now()}`
    );

    // Update profile
    const { data, error } = await supabase
      .from('profiles')
      .update({ profile_pic: uploadResult.publicUrl })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in updateProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    // Get profile data
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json({
      user: req.user,
      profile
    });
  } catch (error) {
    console.error("Error in checkAuth:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user profile by ID
export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error in getProfile:", error);
    res.status(500).json({ message: "Server error" });
  }
};