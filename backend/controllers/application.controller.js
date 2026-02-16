import { supabase } from '../lib/supabase.config.js';
import { calculateMatchScore } from '../services/ai.service.js';

// Apply for a job (candidate only) - WITH AI MATCH SCORE
export const applyForJob = async (req, res) => {
  try {
    const { jobId, resumeId } = req.body;
    const candidateId = req.user.id;

    if (!jobId || !resumeId) {
      return res.status(400).json({ message: "Job ID and Resume ID are required" });
    }

    // Check if already applied
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .single();

    if (existing) {
      return res.status(400).json({ message: "You have already applied for this job" });
    }

    // 1️⃣ Get resume with analysis data
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('analysis_data')
      .eq('id', resumeId)
      .eq('candidate_id', candidateId)
      .single();

    if (resumeError || !resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    // 2️⃣ Get job posting details
    const { data: job, error: jobError } = await supabase
      .from('job_postings')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ message: "Job posting not found" });
    }

    // 3️⃣ Calculate match score using AI
    let matchScore = null;
    let matchDetails = null;

    try {
      if (resume.analysis_data && resume.analysis_data.skills) {
        console.log('Calculating AI match score...');
        const matchResult = await calculateMatchScore(resume.analysis_data, job);
        matchScore = matchResult.matchScore;
        matchDetails = matchResult;
        console.log('Match score calculated:', matchScore);
      } else {
        console.log('No resume analysis data available, skipping match score');
        matchScore = null;
      }
    } catch (aiError) {
      console.error('Match score calculation failed:', aiError);
      // Continue without match score
      matchScore = null;
    }

    // 4️⃣ Create application with match score
    const { data: application, error } = await supabase
      .from('applications')
      .insert([
        {
          candidate_id: candidateId,
          job_id: jobId,
          resume_id: resumeId,
          status: 'pending',
          match_score: matchScore,
          match_details: matchDetails // Store full analysis
        }
      ])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(201).json(application);
  } catch (error) {
    console.error("Error in applyForJob:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get candidate's applications
export const getMyApplications = async (req, res) => {
  try {
    const candidateId = req.user.id;

    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        job_postings(
          title,
          description,
          location,
          salary_range,
          profiles(full_name, profile_pic)
        ),
        resumes(file_name, storage_path)
      `)
      .eq('candidate_id', candidateId)
      .order('applied_at', { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json(applications);
  } catch (error) {
    console.error("Error in getMyApplications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get applications for a specific job (company only)
export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const companyId = req.user.id;

    // Verify job belongs to company
    const { data: job, error: jobError } = await supabase
      .from('job_postings')
      .select('company_id')
      .eq('id', jobId)
      .single();

    if (jobError || job.company_id !== companyId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles!applications_candidate_id_fkey(
          id,
          full_name,
          email,
          profile_pic
        ),
        resumes(
          id,
          file_name,
          storage_path,
          analysis_data
        )
      `)
      .eq('job_id', jobId)
      .order('match_score', { ascending: false, nullsFirst: false })
      .order('applied_at', { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }
    
    // 🔐 Generate signed URLs for resumes
    for (const app of applications) {
      if (app.resumes?.storage_path) {
        const { data, error: signError } = await supabase
          .storage
          .from('uploads') // bucket name
          .createSignedUrl(app.resumes.storage_path, 60 * 10); // 10 minutes

        if (!signError) {
          app.resumes.resume_url = data.signedUrl;
        }
      }
    }

    res.status(200).json(applications);
  } catch (error) {
    console.error("Error in getJobApplications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update application status (company only)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, matchScore } = req.body;
    const companyId = req.user.id;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Verify application belongs to company's job
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        job_id,
        job_postings(company_id)
      `)
      .eq('id', applicationId)
      .single();

    if (appError || application.job_postings.company_id !== companyId) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const updateData = { status };
    if (matchScore !== undefined) updateData.match_score = Number(matchScore);

    const { data: updatedApplication, error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .maybeSingle();

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    res.status(200).json(updatedApplication);
  } catch (error) {
    console.error("Error in updateApplicationStatus:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single application details
export const getApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user.id;

    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        *,
        profiles!applications_candidate_id_fkey(
          full_name,
          email,
          profile_pic
        ),
        job_postings(
          *,
          profiles!job_postings_company_id_fkey(
            full_name,
            profile_pic
          )
        ),
        resumes(*)
      `)
      .eq('id', applicationId)
      .single();

    if (error) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check authorization
    const isCandidate = application.candidate_id === userId;
    const isCompany = application.job_postings.company_id === userId;

    if (!isCandidate && !isCompany) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(application);
  } catch (error) {
    console.error("Error in getApplication:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Withdraw application (candidate only)
export const withdrawApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const candidateId = req.user.id;

    // Delete the application and return the deleted row(s)
    const { data, error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)
      .eq('candidate_id', candidateId)
      .select(); // Important: get deleted rows

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ 
        message: "Application not found or you are not authorized to delete it" 
      });
    }

    res.status(200).json({ 
      message: "Application withdrawn successfully",
      deletedApplication: data[0]
    });
  } catch (error) {
    console.error("Error in withdrawApplication:", error);
    res.status(500).json({ message: "Server error" });
  }
};