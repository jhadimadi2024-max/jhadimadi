import { Request, Response } from 'express';
import { 
  step1BasicInfoSchema,
  step2PersonalDetailsSchema,
  step3AddressSchema,
  step4EducationSchema,
  step5ExperienceSchema,
  step6SkillsCertSchema,
  step7DocumentsSchema,
  step8PortfolioSchema,
  step9VerificationSchema,
  registrationFullSchema,
  RegistrationFormData
} from '../../types/registration';

export const validateStepPayload = (stepId: number, payload: any): { valid: boolean; errors?: Record<string, string> } => {
  try {
    switch (stepId) {
      case 1:
        step1BasicInfoSchema.parse(payload);
        break;
      case 2:
        step2PersonalDetailsSchema.parse(payload);
        break;
      case 3:
        step3AddressSchema.parse(payload);
        break;
      case 4:
        step4EducationSchema.parse(payload);
        break;
      case 5:
        step5ExperienceSchema.parse(payload);
        break;
      case 6:
        step6SkillsCertSchema.parse(payload);
        break;
      case 7:
        step7DocumentsSchema.parse(payload);
        break;
      case 8:
        step8PortfolioSchema.parse(payload);
        break;
      case 9:
        step9VerificationSchema.parse(payload);
        break;
      default:
        break;
    }
    return { valid: true };
  } catch (err: any) {
    const issues = err?.issues || err?.errors;
    if (issues && Array.isArray(issues)) {
      const formattedErrors: Record<string, string> = {};
      issues.forEach((e: any) => {
        const path = e.path.join('.');
        formattedErrors[path] = e.message;
      });
      return { valid: false, errors: formattedErrors };
    }
    return { valid: false, errors: { general: err.message || 'Validation failed' } };
  }
};

/**
 * Validates a single registration step payload via API
 */
export const handleValidateStep = (req: Request, res: Response) => {
  const stepId = parseInt(req.params.stepId || req.body.stepId, 10);
  const payload = req.body.payload || req.body;

  if (isNaN(stepId) || stepId < 1 || stepId > 10) {
    return res.status(400).json({ success: false, message: 'Invalid step ID specified' });
  }

  const result = validateStepPayload(stepId, payload);
  if (!result.valid) {
    return res.status(422).json({
      success: false,
      stepId,
      message: 'ধাপে তথ্যের অসঙ্গতি পাওয়া গেছে। অনুগ্রহ করে সংশোধন করুন।',
      errors: result.errors,
    });
  }

  return res.json({
    success: true,
    stepId,
    message: `Step ${stepId} validated successfully.`,
  });
};

/**
 * Handles unified registration submission preserving existing schemas
 */
export const handleRegistrationSubmit = async (
  req: Request, 
  res: Response, 
  context?: { serverSupabase?: any; liveFreelancers?: any[] }
) => {
  try {
    const rawData: RegistrationFormData = req.body;

    // Dual-Layer: Validate full submission schema
    const validationResult = registrationFullSchema.safeParse(rawData);
    if (!validationResult.success) {
      const formattedErrors: Record<string, string> = {};
      const issues = validationResult.error.issues || (validationResult.error as any).errors || [];
      issues.forEach((e: any) => {
        const path = e.path.join('.');
        formattedErrors[path] = e.message;
      });

      return res.status(422).json({
        success: false,
        message: 'নিবন্ধন তথ্যে কিছু অপূর্ণতা রয়েছে। অনুগ্রহ করে চেক করুন।',
        errors: formattedErrors,
      });
    }

    const validData = validationResult.data as RegistrationFormData;
    const { serverSupabase, liveFreelancers } = context || {};

    const generatedUserId = 'usr_' + Date.now();
    const cleanPhone = validData.phone.trim();
    const role = validData.accountType === 'member' 
      ? 'member' 
      : (validData.accountType === 'service_provider' ? 'provider' : 'freelancer');

    // 1. Prepare unified Profile record (preserves public.profiles schema)
    const profileRecord = {
      id: generatedUserId,
      full_name: validData.fullName,
      phone: cleanPhone,
      email: validData.email.toLowerCase(),
      role: role,
      division: validData.permanentAddress?.division || 'চট্টগ্রাম',
      district: validData.permanentAddress?.district || 'খাগড়াছড়ি',
      upazila: validData.permanentAddress?.upazila || 'খাগড়াছড়ি সদর',
      mahalla: validData.permanentAddress?.villageOrMahalla || '',
      detailed_address: validData.permanentAddress?.detailedAddress || `${validData.permanentAddress?.villageOrMahalla}, ${validData.permanentAddress?.upazila}, ${validData.permanentAddress?.district}`,
      blood_group: validData.bloodGroup || null,
      is_nid_verified: Boolean(validData.isNidVerified),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Prepare Freelancer / Service Provider record (preserves existing liveFreelancers store)
    const newWorker = {
      id: generatedUserId,
      name: validData.fullName,
      avatar: validData.selfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      categoryBn: validData.categoryBn || 'আইটি ও ফ্রিল্যান্সার',
      categoryEn: validData.categoryEn || 'IT & Freelancer',
      subCategory: validData.accountType,
      rating: 5.0,
      jobsCompleted: 0,
      experienceYears: validData.experienceList?.length ? Math.min(10, validData.experienceList.length * 2) : 1,
      hourlyRate: 350,
      rateType: 'Hourly',
      phoneHidden: cleanPhone.slice(0, 4) + 'XXXX' + cleanPhone.slice(-3),
      realPhone: cleanPhone,
      district: validData.permanentAddress?.district || 'Khagrachhari',
      upazila: validData.permanentAddress?.upazila || 'Khagrachhari Sadar',
      mahalla: validData.permanentAddress?.villageOrMahalla || 'সদর',
      coveredAreas: [
        validData.permanentAddress?.villageOrMahalla || 'সদর',
        validData.permanentAddress?.upazila || 'Khagrachhari Sadar',
        validData.permanentAddress?.district || 'Khagrachhari'
      ],
      coverageRadiusKm: 15,
      nidVerified: Boolean(validData.isNidVerified),
      selfieVerified: Boolean(validData.selfieUrl),
      blueTickActive: true,
      isAvailableNow: true,
      bioBn: validData.bioBn || `${validData.fullName} - ঝাদিমাদি ভেরিফাইড পেশাজীবী।`,
      bioEn: validData.bioEn || `${validData.fullName} - Jhadimadi Verified Professional.`,
      skills: validData.skillsList?.map(s => s.name) || ['পেশাদার সেবা', 'ভেরিফাইড প্রোভাইডার'],
      skillsDetails: validData.skillsList?.map(s => `${s.name} (${s.level})`).join(', ') || '',
      educationList: validData.educationList || [],
      experienceList: validData.experienceList || [],
      certificationsList: validData.certificationsList || [],
      projectsList: validData.projectsList || [],
      portfolioWebsite: validData.portfolioWebsite || '',
      githubUrl: validData.githubUrl || '',
      linkedinUrl: validData.linkedinUrl || '',
      nidNumber: validData.nidNumber || '',
      nidFrontUrl: validData.nidFrontUrl || '',
      nidBackUrl: validData.nidBackUrl || '',
      createdAt: new Date().toISOString(),
    };

    // Store in live in-memory registry if available
    if (liveFreelancers) {
      const existingIdx = liveFreelancers.findIndex(f => f.realPhone === cleanPhone);
      if (existingIdx >= 0) {
        liveFreelancers[existingIdx] = { ...liveFreelancers[existingIdx], ...newWorker };
      } else {
        liveFreelancers.unshift(newWorker);
      }
    }

    // Persist to Supabase if configured
    if (serverSupabase) {
      try {
        await serverSupabase.from('profiles').upsert(profileRecord, { onConflict: 'phone' });
      } catch (dbErr) {
        console.warn('[RegistrationController] Note persisting to Supabase profiles:', dbErr);
      }

      if (validData.accountType === 'freelancer') {
        try {
          await serverSupabase.from('freelancer_profiles').upsert({
            id: generatedUserId,
            full_name: validData.fullName,
            phone: cleanPhone,
            skills: validData.skillsList,
            portfolio: validData.projectsList,
            education: validData.educationList,
            experience: validData.experienceList,
            bio: validData.bioBn,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'phone' });
        } catch {}
      }
    }

    return res.status(201).json({
      success: true,
      message: 'অভিনন্দন! আপনার পেশাদার নিবন্ধন সফলভাবে সম্পন্ন হয়েছে।',
      userId: generatedUserId,
      accountType: validData.accountType,
      profile: {
        id: generatedUserId,
        name: validData.fullName,
        phone: cleanPhone,
        email: validData.email,
        role: role,
        district: validData.permanentAddress?.district,
        upazila: validData.permanentAddress?.upazila,
      }
    });
  } catch (err: any) {
    console.error('[RegistrationController] Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'সার্ভারে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
      error: err.message,
    });
  }
};
