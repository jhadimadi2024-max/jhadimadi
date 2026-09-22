import { useState, useEffect, useRef, useCallback } from 'react';
import { RegistrationFormData, INITIAL_REGISTRATION_DATA } from '../types/registration';
import { offlineStorage } from '../utils/offlineStorage';

const STORAGE_KEY = 'jhadimadi_registration_draft_v2';
const STEP_STORAGE_KEY = 'jhadimadi_registration_draft_step_v2';
const TIMESTAMP_KEY = 'jhadimadi_registration_draft_time_v2';

export function calculateCompletionPercentage(data: RegistrationFormData): number {
  let score = 0;
  const maxScore = 100;

  // Step 1: Basic Info (25 points)
  if (data.fullName && data.fullName.length >= 3) score += 6;
  if (data.email && data.email.includes('@')) score += 6;
  if (data.phone && data.phone.length === 11) score += 7;
  if (data.password && data.password.length >= 6) score += 6;

  // Step 2: Personal (12 points)
  if (data.dateOfBirth) score += 4;
  if (data.gender) score += 4;
  if (data.bioBn || data.bioEn) score += 4;

  // Step 3: Address (13 points)
  if (data.permanentAddress?.division && data.permanentAddress?.district) score += 7;
  if (data.permanentAddress?.villageOrMahalla) score += 6;

  // Step 4: Education (12 points)
  if (data.educationList && data.educationList.length > 0) score += 12;

  // Step 5: Experience (8 points)
  if (data.experienceList && data.experienceList.length > 0) score += 8;

  // Step 6: Skills (12 points)
  if (data.skillsList && data.skillsList.length > 0) score += 12;

  // Step 7: Documents (6 points)
  if (data.nidNumber || data.nidFrontUrl || data.cvResumeUrl) score += 6;

  // Step 8: Portfolio (6 points)
  if (data.portfolioWebsite || data.githubUrl || (data.projectsList && data.projectsList.length > 0)) score += 6;

  // Step 9: Verification (6 points)
  if (data.isPhoneVerified) score += 3;
  if (data.agreedToTerms) score += 3;

  return Math.min(maxScore, score);
}

export function useRegistrationDraft() {
  const [formData, setFormData] = useState<RegistrationFormData>(INITIAL_REGISTRATION_DATA);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isDraftSaving, setIsDraftSaving] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const parsed = offlineStorage.getItem<any>(STORAGE_KEY, null);
      const savedTime = offlineStorage.getItem<string | null>(TIMESTAMP_KEY, null);
      const savedStep = offlineStorage.getItem<string | null>(STEP_STORAGE_KEY, null);

      if (parsed) {
        // Check if there is meaningful data in draft
        if (parsed.fullName || parsed.phone || parsed.email || (parsed.educationList && parsed.educationList.length > 0)) {
          setHasSavedDraft(true);
          setLastSavedTime(savedTime || new Date().toISOString());
        }
      }
      if (savedStep) {
        const s = parseInt(savedStep, 10);
        if (s >= 1 && s <= 10) {
          // Do not auto-navigate yet until user decides to restore
        }
      }
    } catch (e) {
      console.warn('[useRegistrationDraft] Failed to check saved draft:', e);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Function to restore draft manually
  const restoreDraft = useCallback(() => {
    try {
      const parsed = offlineStorage.getItem<any>(STORAGE_KEY, null);
      const savedStep = offlineStorage.getItem<string | null>(STEP_STORAGE_KEY, null);
      if (parsed) {
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          permanentAddress: { ...prev.permanentAddress, ...(parsed.permanentAddress || {}) },
          presentAddress: { ...prev.presentAddress, ...(parsed.presentAddress || {}) },
          educationList: parsed.educationList || [],
          experienceList: parsed.experienceList || [],
          skillsList: parsed.skillsList || [],
          certificationsList: parsed.certificationsList || [],
          projectsList: parsed.projectsList || [],
        }));
        if (savedStep) {
          const s = parseInt(savedStep, 10);
          if (s >= 1 && s <= 10) {
            setCurrentStep(s);
          }
        }
        setHasSavedDraft(false); // restored
        return true;
      }
    } catch (e) {
      console.error('[useRegistrationDraft] Error restoring draft:', e);
    }
    return false;
  }, []);

  // Function to save draft immediately
  const saveDraftNow = useCallback((dataToSave?: RegistrationFormData, stepToSave?: number) => {
    try {
      setIsDraftSaving(true);
      const targetData = dataToSave || formData;
      const targetStep = stepToSave || currentStep;
      const nowIso = new Date().toISOString();

      offlineStorage.saveItem(STORAGE_KEY, targetData);
      offlineStorage.saveItem(STEP_STORAGE_KEY, targetStep.toString());
      offlineStorage.saveItem(TIMESTAMP_KEY, nowIso);
      setLastSavedTime(nowIso);

      setTimeout(() => {
        setIsDraftSaving(false);
      }, 400);
    } catch (e) {
      console.error('[useRegistrationDraft] Error saving draft:', e);
      setIsDraftSaving(false);
    }
  }, [formData, currentStep]);

  // Debounced auto-save on formData or currentStep change
  useEffect(() => {
    if (!isInitialized) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      // Only auto-save if at least something basic is entered
      if (formData.fullName || formData.phone || formData.email || formData.educationList.length > 0) {
        saveDraftNow(formData, currentStep);
      }
    }, 1200);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [formData, currentStep, isInitialized, saveDraftNow]);

  // Clear draft upon submission or explicit reset
  const clearDraft = useCallback(() => {
    try {
      offlineStorage.removeItem(STORAGE_KEY);
      offlineStorage.removeItem(STEP_STORAGE_KEY);
      offlineStorage.removeItem(TIMESTAMP_KEY);
      setFormData(INITIAL_REGISTRATION_DATA);
      setCurrentStep(1);
      setHasSavedDraft(false);
      setLastSavedTime(null);
    } catch (e) {
      console.error('[useRegistrationDraft] Error clearing draft:', e);
    }
  }, []);

  // Update helper for sub-objects
  const updateFormData = useCallback((fields: Partial<RegistrationFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...fields,
    }));
  }, []);

  const completionPercentage = calculateCompletionPercentage(formData);

  return {
    formData,
    setFormData,
    updateFormData,
    currentStep,
    setCurrentStep,
    hasSavedDraft,
    lastSavedTime,
    restoreDraft,
    clearDraft,
    saveDraftNow,
    isDraftSaving,
    completionPercentage,
    isInitialized,
  };
}
