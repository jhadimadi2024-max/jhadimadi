import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Percent, 
  Star, 
  Compass, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  RefreshCw, 
  Clock,
  UserCheck,
  Shield,
  Activity,
  UserPlus,
  User,
  Mail,
  Copy,
  Check,
  Code2,
  Terminal,
  Sparkles
} from 'lucide-react';
import { useData, AdminLocation, AdminServiceCategory } from '../../context/DataContext';
import { 
  adminSecurityService, 
  AdminAccount, 
  AdminActivityLog, 
  AdminSession, 
  AdminRole, 
  validatePasswordStrength 
} from '../../services/adminSecurityService';
import { AdminConfirmDialog } from './AdminConfirmDialog';
import { AdminCredentialsUpdateCard } from './AdminCredentialsUpdateCard';
import { AdminAiKnowledgeBaseConfig } from './AdminAiKnowledgeBaseConfig';

interface AdminSettingsTabProps {
  initialSubTab?: 'locations' | 'categories' | 'security' | 'ai-config';
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ initialSubTab = 'locations' }) => {
  const {
    locations,
    addLocation,
    deleteLocation,
    addUpazilaToLocation,
    deleteUpazilaFromLocation,
    serviceCategories,
    addServiceCategory,
    updateServiceCategory,
    deleteServiceCategory
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'locations' | 'categories' | 'security' | 'ai-config'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(locations[0]?.id || null);

  // New Upazila input state mapped by district id
  const [upazilaInputs, setUpazilaInputs] = useState<Record<string, string>>({});

  // Add District Modal State
  const [isAddDistrictModalOpen, setIsAddDistrictModalOpen] = useState(false);
  const [newDistrictForm, setNewDistrictForm] = useState({
    districtBn: '',
    districtEn: '',
    upazilasText: 'সদর, পৌরসভা',
    isActive: true
  });

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminServiceCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    nameBn: '',
    nameEn: '',
    iconName: 'Wrench',
    commissionRate: 5,
    isFeatured: true
  });

  // Security Session & RBAC States
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Password Management State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passStatusMsg, setPassStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email Management State
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailCurrentPasswordInput, setEmailCurrentPasswordInput] = useState('');
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Username Management State
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameCurrentPasswordInput, setUsernameCurrentPasswordInput] = useState('');
  const [showUsernamePass, setShowUsernamePass] = useState(false);
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [usernameStatusMsg, setUsernameStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Supabase SQL Script Viewer State
  const [isSqlScriptExpanded, setIsSqlScriptExpanded] = useState(false);
  const [isCopiedSql, setIsCopiedSql] = useState(false);

  // Add Admin Account Modal State
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('admin');

  // Confirmation Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const closeConfirmDialog = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  // Load Admin Session, Accounts, and Activity Logs
  const loadSecurityData = async () => {
    try {
      const session = await adminSecurityService.getCurrentAdminSession();
      setAdminSession(session);

      if (session?.isSuperAdmin) {
        setIsLoadingAccounts(true);
        const accounts = await adminSecurityService.getAdminAccounts();
        setAdminAccounts(accounts);
        setIsLoadingAccounts(false);
      }

      setIsLoadingLogs(true);
      const logs = await adminSecurityService.getActivityLogs(20);
      setActivityLogs(logs);
      setIsLoadingLogs(false);
    } catch {
      setIsLoadingAccounts(false);
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'security') {
      loadSecurityData();
    }
  }, [activeSubTab]);

  // Handle Secure Password Update with validation
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatusMsg(null);

    const strength = validatePasswordStrength(newPasswordInput);
    if (!strength.isValid) {
      setPassStatusMsg({
        type: 'error',
        text: strength.errors[0] || 'পাসওয়ার্ড আরও সুরক্ষিত হতে হবে।'
      });
      return;
    }

    if (newPasswordInput !== confirmPasswordInput) {
      setPassStatusMsg({
        type: 'error',
        text: 'নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।'
      });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await adminSecurityService.changeSuperAdminPassword(
        currentPasswordInput,
        newPasswordInput,
        confirmPasswordInput
      );
      setIsChangingPass(false);

      if (res.success) {
        setPassStatusMsg({
          type: 'success',
          text: res.message
        });
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        loadSecurityData();
      } else {
        setPassStatusMsg({
          type: 'error',
          text: res.message
        });
      }
    } catch {
      setIsChangingPass(false);
      setPassStatusMsg({
        type: 'error',
        text: 'পাসওয়ার্ড আপডেটে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      });
    }
  };

  // Handle Secure Email / Username Update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailStatusMsg(null);

    const cleanEmail = newEmailInput.trim().toLowerCase();
    const isEmail = cleanEmail.includes('@') && cleanEmail.includes('.');
    const isUsername = /^[a-zA-Z0-9_.-]{3,30}$/.test(cleanEmail);
    if (!cleanEmail || (!isEmail && !isUsername)) {
      setEmailStatusMsg({
        type: 'error',
        text: 'সঠিক নতুন ইমেইল বা ইউজারনেম (কমপক্ষে ৩ অক্ষর) প্রদান করুন।'
      });
      return;
    }

    if (!emailCurrentPasswordInput) {
      setEmailStatusMsg({
        type: 'error',
        text: 'বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক।'
      });
      return;
    }

    setIsChangingEmail(true);
    try {
      const res = await adminSecurityService.changeSuperAdminEmail(
        emailCurrentPasswordInput,
        cleanEmail
      );
      setIsChangingEmail(false);

      if (res.success) {
        setEmailStatusMsg({
          type: 'success',
          text: res.message
        });
        setNewEmailInput('');
        setEmailCurrentPasswordInput('');
        loadSecurityData();
      } else {
        setEmailStatusMsg({
          type: 'error',
          text: res.message
        });
      }
    } catch {
      setIsChangingEmail(false);
      setEmailStatusMsg({
        type: 'error',
        text: 'ইমেইল আপডেটে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      });
    }
  };

  // Handle Secure Username Update
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameStatusMsg(null);

    const cleanUser = newUsernameInput.trim();
    if (!cleanUser || !/^[a-zA-Z0-9_.\-]{3,30}$/.test(cleanUser)) {
      setUsernameStatusMsg({
        type: 'error',
        text: 'ইউজারনেম ৩ থেকে ৩০ অক্ষরের হতে হবে (ইংরেজি বর্ণ, সংখ্যা, আন্ডারস্কোর, ডট বা হাইফেন)।'
      });
      return;
    }

    if (!usernameCurrentPasswordInput) {
      setUsernameStatusMsg({
        type: 'error',
        text: 'নিরাপত্তা যাচাইয়ের জন্য বর্তমান পাসওয়ার্ড প্রদান করা আবশ্যক।'
      });
      return;
    }

    setIsChangingUsername(true);
    try {
      const res = await adminSecurityService.updateUsername(
        usernameCurrentPasswordInput,
        cleanUser
      );
      setIsChangingUsername(false);

      if (res.success) {
        setUsernameStatusMsg({
          type: 'success',
          text: res.message || 'ইউজারনেম সফলভাবে পরিবর্তন ও ডাটাবেজে সংরক্ষণ করা হয়েছে!'
        });
        setNewUsernameInput('');
        setUsernameCurrentPasswordInput('');
        loadSecurityData();
      } else {
        setUsernameStatusMsg({
          type: 'error',
          text: res.message || 'ইউজারনেম পরিবর্তন ব্যর্থ হয়েছে। বর্তমান পাসওয়ার্ডটি যাচাই করুন।'
        });
      }
    } catch {
      setIsChangingUsername(false);
      setUsernameStatusMsg({
        type: 'error',
        text: 'ইউজারনেম আপডেটে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      });
    }
  };

  // Supabase SQL Script content for manual editor run
  const supabaseSuperAdminSql = `-- =========================================================
-- JHADIMADI.COM - SUPABASE SUPER ADMIN SETUP SCRIPT
-- =========================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Create admin_roles table in public schema
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    assigned_by TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create admin_activity_logs table for audit logging
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID,
    admin_email TEXT NOT NULL,
    action_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- 5. Set RLS Policies
DROP POLICY IF EXISTS "Allow public read of active admin roles" ON public.admin_roles;
CREATE POLICY "Allow public read of active admin roles" ON public.admin_roles
    FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow all admin activity inserts" ON public.admin_activity_logs;
CREATE POLICY "Allow all admin activity inserts" ON public.admin_activity_logs
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read admin activity logs" ON public.admin_activity_logs;
CREATE POLICY "Allow read admin activity logs" ON public.admin_activity_logs
    FOR SELECT USING (true);

-- 6. Insert / Update the Super Admin User into auth.users and admin_roles
DO $$
DECLARE
  target_user_id UUID := gen_random_uuid();
  target_email TEXT := 'admin@domain.com';
  target_password TEXT := 'YourSuperAdminPass2026!'; -- আপনার পছন্দের শক্তিশালী পাসওয়ার্ড দিন
  hashed_password TEXT;
BEGIN
  -- Generate bcrypt hash for password
  hashed_password := crypt(target_password, gen_salt('bf'));

  -- Check if user exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      target_user_id,
      '00000000-0000-0000-0000-000000000000',
      target_email,
      hashed_password,
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Super Admin"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  ELSE
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
    UPDATE auth.users 
    SET encrypted_password = hashed_password,
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = target_user_id;
  END IF;

  -- Upsert into public.admin_roles
  INSERT INTO public.admin_roles (user_id, email, role, is_active, assigned_by)
  VALUES (target_user_id, target_email, 'super_admin', true, 'system_init')
  ON CONFLICT (email) 
  DO UPDATE SET 
    role = 'super_admin', 
    is_active = true, 
    user_id = EXCLUDED.user_id, 
    updated_at = now();

  RAISE NOTICE 'Super Admin user successfully created with email % and role super_admin', target_email;
END $$;`;

  const handleCopySql = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(supabaseSuperAdminSql);
      setIsCopiedSql(true);
      setTimeout(() => setIsCopiedSql(false), 2500);
    }
  };

  // Handle Add New Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminEmail.includes('@')) {
      alert('সঠিক ইমেইল ঠিকানা প্রদান করুন');
      return;
    }

    const res = await adminSecurityService.updateAdminRole(newAdminEmail, newAdminRole, true);
    if (res.success) {
      setIsAddAdminModalOpen(false);
      setNewAdminEmail('');
      loadSecurityData();
    } else {
      alert(res.message);
    }
  };

  // Handle Change Admin Role
  const handleChangeRole = (account: AdminAccount, targetRole: AdminRole) => {
    setConfirmState({
      isOpen: true,
      title: 'অ্যাডমিন রোল পরিবর্তন নিশ্চিতকরণ',
      message: `আপনি কি '${account.email}'-এর রোল '${targetRole}'-এ পরিবর্তন করতে চান?`,
      confirmText: 'রোল পরিবর্তন করুন',
      isDanger: false,
      onConfirm: async () => {
        const res = await adminSecurityService.updateAdminRole(account.email, targetRole, account.isActive);
        if (res.success) {
          loadSecurityData();
        } else {
          alert(res.message);
        }
      }
    });
  };

  // Handle Toggle Admin Status
  const handleToggleAdminStatus = (account: AdminAccount) => {
    const nextStatus = !account.isActive;
    setConfirmState({
      isOpen: true,
      title: nextStatus ? 'অ্যাডমিন অ্যাক্সেস সক্রিয়করণ' : 'অ্যাডমিন অ্যাক্সেস স্থগিতকরণ',
      message: nextStatus
        ? `আপনি কি '${account.email}'-কে পুনরায় অ্যাডমিন অ্যাক্সেস দিতে চান?`
        : `আপনি কি '${account.email}'-এর অ্যাডমিন অ্যাক্সেস বন্ধ করতে চান? এটি করলে তিনি আর প্যানেলে লগইন করতে পারবেন না।`,
      confirmText: nextStatus ? 'সক্রিয় করুন' : 'স্থগিত করুন',
      isDanger: !nextStatus,
      onConfirm: async () => {
        const res = await adminSecurityService.updateAdminRole(account.email, account.role, nextStatus);
        if (res.success) {
          loadSecurityData();
        } else {
          alert(res.message);
        }
      }
    });
  };

  // Handle Add District
  const handleCreateDistrict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictForm.districtBn) {
      alert('অনুগ্রহ করে জেলার নাম প্রদান করুন');
      return;
    }

    const upazilas = newDistrictForm.upazilasText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    addLocation({
      districtBn: newDistrictForm.districtBn,
      districtEn: newDistrictForm.districtEn || newDistrictForm.districtBn,
      upazilasBn: upazilas.length > 0 ? upazilas : ['সদর'],
      isActive: newDistrictForm.isActive,
      totalPros: 0
    });

    setIsAddDistrictModalOpen(false);
    setNewDistrictForm({ districtBn: '', districtEn: '', upazilasText: 'সদর, পৌরসভা', isActive: true });
  };

  // Handle Add Upazila tag chip
  const handleAddUpazila = (districtId: string) => {
    const text = upazilaInputs[districtId]?.trim();
    if (!text) return;
    addUpazilaToLocation(districtId, text);
    setUpazilaInputs({ ...upazilaInputs, [districtId]: '' });
  };

  // Handle Category Add/Edit
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      nameBn: '',
      nameEn: '',
      iconName: 'Wrench',
      commissionRate: 5,
      isFeatured: true
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: AdminServiceCategory) => {
    setEditingCategory(cat);
    setCategoryForm({
      nameBn: cat.nameBn,
      nameEn: cat.nameEn,
      iconName: cat.iconName,
      commissionRate: cat.commissionRate,
      isFeatured: cat.isFeatured
    });
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.nameBn) {
      alert('অনুগ্রহ করে ক্যাটাগরির বাংলা নাম প্রদান করুন');
      return;
    }

    if (editingCategory) {
      updateServiceCategory(editingCategory.id, categoryForm);
    } else {
      addServiceCategory({
        ...categoryForm,
        totalProfessionals: 0
      });
    }

    setIsCategoryModalOpen(false);
  };

  const handleDeleteDistrictWithModal = (loc: AdminLocation) => {
    setConfirmState({
      isOpen: true,
      title: 'জেলা ও উপজেলা কভারেজ মুছে ফেলা',
      message: `আপনি কি '${loc.districtBn}' জেলা ও এর অন্তর্ভুক্ত সব উপজেলার কভারেজ ডেটা মুছে ফেলতে চান?`,
      confirmText: 'মুছে ফেলুন',
      isDanger: true,
      onConfirm: () => {
        deleteLocation(loc.id);
      }
    });
  };

  const handleDeleteCategoryWithModal = (cat: AdminServiceCategory) => {
    setConfirmState({
      isOpen: true,
      title: 'সার্ভিস ক্যাটাগরি মুছে ফেলা',
      message: `আপনি কি '${cat.nameBn}' সার্ভিস ক্যাটাগরি ডিলিট করতে চান?`,
      confirmText: 'মুছে ফেলুন',
      isDanger: true,
      onConfirm: () => {
        deleteServiceCategory(cat.id);
      }
    });
  };

  // Real-time password strength validation rules
  const passLengthOk = newPasswordInput.length >= 6;
  const passUpperOk = /[A-Z]/.test(newPasswordInput);
  const passLowerOk = /[a-z]/.test(newPasswordInput);
  const passNumOk = /[0-9]/.test(newPasswordInput);
  const passSpecialOk = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPasswordInput);

  const iconOptions = ['Wrench', 'Zap', 'Truck', 'Sparkles', 'Droplet', 'Hammer', 'Layers', 'Compass'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="admin-settings-tab">
      
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-black shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                সিস্টেম সেটিংস ও নিরাপত্তা হাব
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                এলাকা কভারেজ, কমিশন রেট, সুপার অ্যাডমিন পাসওয়ার্ড ও RBAC রোল ম্যানেজমেন্ট
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold self-stretch sm:self-auto overflow-x-auto">
          <button
            id="tab-locations"
            type="button"
            onClick={() => setActiveSubTab('locations')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'locations' 
                ? 'bg-white text-teal-700 shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>এলাকা কভারেজ</span>
          </button>
          <button
            id="tab-categories"
            type="button"
            onClick={() => setActiveSubTab('categories')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'categories' 
                ? 'bg-white text-emerald-700 shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>সার্ভিস ও কমিশন</span>
          </button>
          <button
            id="tab-security"
            type="button"
            onClick={() => setActiveSubTab('security')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'security' 
                ? 'bg-slate-900 text-white shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>ক্রেডেনশিয়াল ও সিকিউরিটি</span>
          </button>
          <button
            id="tab-ai-config"
            type="button"
            onClick={() => setActiveSubTab('ai-config')}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeSubTab === 'ai-config' 
                ? 'bg-purple-600 text-white shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Config</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 4: AI CONFIG (KNOWLEDGE BASE & VECTOR DATABASE) */}
      {activeSubTab === 'ai-config' && (
        <AdminAiKnowledgeBaseConfig />
      )}

      {/* SUB-TAB 3: SECURITY, RBAC & AUDIT LOGS */}
      {activeSubTab === 'security' && (
        <div className="space-y-6">
          
          {/* SECTION 0: SUPABASE SQL SCRIPT QUICK-SETUP */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950 text-white p-5 sm:p-6 rounded-3xl border border-indigo-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>Supabase SQL Editor স্ক্রিপ্ট (Super Admin সেটআপ)</span>
                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                      PostgreSQL
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Supabase Auth ও admin_roles টেবিলে ম্যানুয়ালি সুপার অ্যাডমিন তৈরি বা সিঙ্ক করার অফিসিয়াল SQL কোড।
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
                <button
                  id="btn-copy-supabase-sql"
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isCopiedSql ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopiedSql ? 'কপি হয়েছে!' : 'SQL কোড কপি করুন'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsSqlScriptExpanded(!isSqlScriptExpanded)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-slate-700"
                >
                  <Code2 className="w-4 h-4" />
                  <span>{isSqlScriptExpanded ? 'লুকান' : 'কোড দেখুন'}</span>
                  {isSqlScriptExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Collapsible SQL Script Preview */}
            {isSqlScriptExpanded && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Supabase SQL Script (auth.users + admin_roles + RLS)</span>
                  <span className="text-emerald-400 font-bold">অথোরাইজড: {adminSession?.email || 'সুপার অ্যাডমিন'}</span>
                </div>
                <div className="relative">
                  <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-indigo-900">
                    {supabaseSuperAdminSql}
                  </pre>
                  <button
                    onClick={handleCopySql}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                  >
                    {isCopiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopiedSql ? 'কপি সম্পন্ন' : 'কপি'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  💡 <strong>কীভাবে রান করবেন:</strong> Supabase প্রজেক্টে ঢুকে বাম পাশের মেনু থেকে <strong>SQL Editor</strong>-এ যান ➜ <strong>New Query</strong> তৈরি করুন ➜ কোডটি পেস্ট করে <strong>Run</strong> চাপুন।
                </p>
              </div>
            )}
          </div>

          {/* SECTION 1: DEDICATED ADMIN CREDENTIALS UPDATE */}
          <AdminCredentialsUpdateCard onSuccess={() => loadSecurityData()} />



          {/* SECTION 2: RBAC - ADMIN ACCOUNTS & ROLE MANAGEMENT */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <span>অ্যাডমিন অ্যাকাউন্ট ও রোল পারমিশন (RBAC)</span>
                      <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">
                        PostgreSQL RLS
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      সুপার অ্যাডমিন অন্যান্য অ্যাডমিনদের ক্ষমতা নির্ধারণ বা অ্যাক্সেস নিয়ন্ত্রণ করতে পারেন।
                    </p>
                  </div>
                </div>
              </div>

              {adminSession?.isSuperAdmin && (
                <button
                  id="btn-open-add-admin"
                  type="button"
                  onClick={() => setIsAddAdminModalOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>নতুন অ্যাডমিন যুক্ত করুন</span>
                </button>
              )}
            </div>

            {/* Admin List */}
            {isLoadingAccounts ? (
              <div className="py-8 flex justify-center items-center gap-2 text-slate-400 text-xs font-bold">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span>অ্যাকাউন্ট লোড হচ্ছে...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">অ্যাডমিন ইমেইল</th>
                      <th className="pb-3">রোল (Role)</th>
                      <th className="pb-3">স্ট্যাটাস</th>
                      <th className="pb-3 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {adminAccounts.map((acc) => {
                      const isSuper = acc.role === 'super_admin';
                      const isSelf = adminSession?.email?.toLowerCase() === acc.email.toLowerCase();

                      return (
                        <tr key={acc.id || acc.email} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 pr-4 font-semibold text-slate-900 flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                            <span>{acc.email}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                আপনি
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border inline-flex items-center gap-1 ${
                              acc.role === 'super_admin'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : acc.role === 'admin'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              <Shield className="w-3 h-3" />
                              {acc.role === 'super_admin' ? 'সুপার অ্যাডমিন' : acc.role === 'admin' ? 'অ্যাডমিন' : 'মডারেটর'}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              acc.isActive 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {acc.isActive ? 'সক্রিয়' : 'স্থগিত'}
                            </span>
                          </td>
                          <td className="py-3.5 text-right space-x-1.5">
                            {adminSession?.isSuperAdmin ? (
                              <>
                                <select
                                  disabled={acc.email === adminSession?.email}
                                  value={acc.role}
                                  onChange={(e) => handleChangeRole(acc, e.target.value as AdminRole)}
                                  className="text-[11px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                                >
                                  <option value="super_admin">সুপার অ্যাডমিন</option>
                                  <option value="admin">সাধারণ অ্যাডমিন</option>
                                  <option value="moderator">মডারেটর</option>
                                </select>

                                {acc.email !== adminSession?.email && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAdminStatus(acc)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                      acc.isActive 
                                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200' 
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                    }`}
                                  >
                                    {acc.isActive ? 'ডিজেবল' : 'সক্রিয়'}
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                পরিবর্তন সীমাবদ্ধ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* SECTION 3: ADMIN ACTIVITY LOG (AUDIT TRAIL) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-black">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    অ্যাডমিন অ্যাক্টিভিটি অডিট লগ (Security Audit Trail)
                  </h3>
                  <p className="text-xs text-slate-500">
                    লগইন, পাসওয়ার্ড পরিবর্তন ও সংবেদনশীল অ্যাকশনের অপরিবর্তনীয় রেকর্ড
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={loadSecurityData}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="লগ রিফ্রেশ করুন"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isLoadingLogs ? (
              <div className="py-6 flex justify-center items-center gap-2 text-slate-400 text-xs font-bold">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
                <span>লগ লোড হচ্ছে...</span>
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                কোনো সাম্প্রতিক অডিট লগ নেই।
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {activityLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                        log.actionType.includes('LOGIN')
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.actionType.includes('PASSWORD')
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : log.actionType.includes('ROLE')
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {log.actionType}
                      </span>
                      <span className="font-bold text-slate-800">{log.adminEmail}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.createdAt).toLocaleTimeString('bn-BD')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* SUB-TAB 1: LOCATIONS (DISTRICTS & UPAZILAS) */}
      {activeSubTab === 'locations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">কভারেজ জেলা ও উপজেলার তালিকা:</span>
            <button
              onClick={() => setIsAddDistrictModalOpen(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন জেলা যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {locations.map(loc => {
              const isExpanded = expandedDistrict === loc.id;
              return (
                <div 
                  key={loc.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition"
                >
                  <div className="p-4 flex items-center justify-between gap-3 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-black text-slate-900">{loc.districtBn}</h3>
                          <span className="text-[11px] text-slate-400 font-mono">({loc.districtEn})</span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">
                          উপজেলা সংখ্যা: {loc.upazilasBn.length} টি • নিবন্ধিত কর্মী: {loc.totalPros || 0} জন
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteDistrictWithModal(loc)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="জেলা মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={() => setExpandedDistrict(isExpanded ? null : loc.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Upazilas Expandable Container */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-white">
                      <span className="text-xs font-bold text-slate-600 block">উপজেলা ও এলাকা কভারেজ চিপস:</span>
                      
                      {/* Upazila Chips */}
                      <div className="flex flex-wrap gap-2">
                        {loc.upazilasBn.map((upz, idx) => (
                          <span 
                            key={idx}
                            className="bg-slate-100 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 group hover:border-slate-300"
                          >
                            <MapPin className="w-3 h-3 text-teal-600" />
                            <span>{upz}</span>
                            <button
                              onClick={() => deleteUpazilaFromLocation(loc.id, upz)}
                              className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-0.5"
                              title="মুছে ফেলুন"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add new upazila inline input */}
                      <div className="flex items-center gap-2 pt-2 max-w-md">
                        <input 
                          type="text" 
                          placeholder="নতুন উপজেলা লিখুন (যেমন: পানছড়ি)..."
                          value={upazilaInputs[loc.id] || ''}
                          onChange={e => setUpazilaInputs({ ...upazilaInputs, [loc.id]: e.target.value })}
                          onKeyDown={e => { if (e.key === 'Enter') handleAddUpazila(loc.id); }}
                          className="flex-1 p-2 rounded-xl border border-slate-300 text-xs outline-none focus:border-teal-500 font-semibold"
                        />
                        <button
                          onClick={() => handleAddUpazila(loc.id)}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>যোগ করুন</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SERVICE CATEGORIES & COMMISSION */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">সার্ভিস ক্যাটাগরি ও কমিশন রেট তালিকা:</span>
            <button
              onClick={handleOpenAddCategory}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ক্যাটাগরি যোগ করুন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceCategories.map(cat => (
              <div 
                key={cat.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-base border border-emerald-100">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{cat.nameBn}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">{cat.nameEn}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => updateServiceCategory(cat.id, { isFeatured: !cat.isFeatured })}
                      className={`p-1.5 rounded-lg border transition cursor-pointer ${
                        cat.isFeatured 
                          ? 'bg-amber-50 text-amber-600 border-amber-200' 
                          : 'bg-slate-50 text-slate-300 border-slate-200'
                      }`}
                      title={cat.isFeatured ? 'হোমপেজে ফিচার্ড' : 'সাধারণ ক্যাটাগরি'}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-200/60 flex items-center gap-1">
                      <Percent className="w-3 h-3" /> ফি: {cat.commissionRate}%
                    </span>
                    <span className="text-slate-400 font-medium">
                      পেশাজীবী: {cat.totalProfessionals || 0} জন
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>এডিট</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCategoryWithModal(cat)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add District Modal */}
      {isAddDistrictModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    নতুন জেলা ও উপজেলা কভারেজ যোগ
                  </h2>
                  <p className="text-xs text-slate-500">পার্বত্য এলাকা বা নতুন অঞ্চল অন্তর্ভুক্ত করুন</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddDistrictModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDistrict} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 block mb-1.5 font-bold">জেলার বাংলা নাম: *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="যেমন: খাগড়াছড়ি"
                    value={newDistrictForm.districtBn}
                    onChange={e => setNewDistrictForm({ ...newDistrictForm, districtBn: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1.5 font-bold">জেলার ইংরেজি নাম:</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: Khagrachhari"
                    value={newDistrictForm.districtEn}
                    onChange={e => setNewDistrictForm({ ...newDistrictForm, districtEn: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 block mb-1.5 font-bold">উপজেলাসমূহ (কমা দিয়ে আলাদা করুন): *</label>
                <textarea 
                  rows={3}
                  placeholder="যেমন: সদর, পানছড়ি, দীঘিনালা, মহালছড়ি, মাটিরাঙ্গা, মানিকছড়ি, লক্ষ্মীছড়ি, রামগড়..."
                  value={newDistrictForm.upazilasText}
                  onChange={e => setNewDistrictForm({ ...newDistrictForm, upazilasText: e.target.value })}
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-semibold"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddDistrictModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md transition cursor-pointer font-black"
                >
                  জেলা সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Service Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন সার্ভিস ক্যাটাগরি তৈরি'}
                  </h2>
                  <p className="text-xs text-slate-500">হোমপেজ ও সার্ভিস বুকিং ক্যাটাগরি কনফিগার করুন</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 block mb-1.5 font-bold">বাংলা ক্যাটাগরি নাম: *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="যেমন: সোলার ও বিদ্যুৎ মিস্ত্রি"
                    value={categoryForm.nameBn}
                    onChange={e => setCategoryForm({ ...categoryForm, nameBn: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-slate-700 block mb-1.5 font-bold">ইংরেজি ক্যাটাগরি নাম:</label>
                  <input 
                    type="text" 
                    placeholder="যেমন: Solar & Electrical"
                    value={categoryForm.nameEn}
                    onChange={e => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 block mb-1.5 font-bold">কমিশন রেট (%):</label>
                  <input 
                    type="number" 
                    min={0}
                    max={50}
                    value={categoryForm.commissionRate}
                    onChange={e => setCategoryForm({ ...categoryForm, commissionRate: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-700 block mb-1.5 font-bold">আইকন টাইপ:</label>
                  <select
                    value={categoryForm.iconName}
                    onChange={e => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-300 outline-none focus:border-emerald-500 font-semibold bg-white"
                  >
                    {iconOptions.map(ico => (
                      <option key={ico} value={ico}>{ico}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input 
                  type="checkbox" 
                  id="cat-is-featured"
                  checked={categoryForm.isFeatured}
                  onChange={e => setCategoryForm({ ...categoryForm, isFeatured: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer accent-emerald-600"
                />
                <label htmlFor="cat-is-featured" className="text-slate-700 cursor-pointer text-xs font-semibold">
                  হোমপেজের ফিচার্ড গ্রিডে প্রদর্শন করুন
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition cursor-pointer font-black"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Admin Account Modal (Super Admin only) */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">নতুন অ্যাডমিন অনুমোদন</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">Role-Based Access Control</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAdminModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs font-bold">
              <div>
                <label className="text-slate-700 block mb-1">অ্যাডমিনের ইমেইল: *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1">রোল ও পারমিশন লেভেল: *</label>
                <select
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 outline-none focus:border-indigo-500 font-semibold bg-white"
                >
                  <option value="admin">অ্যাডমিন (সাধারণ প্রশাসনিক ক্ষমতা)</option>
                  <option value="moderator">মডারেটর (শুধুমাত্র যাচাইকরণ ও কন্টেন্ট)</option>
                  <option value="super_admin">সুপার অ্যাডমিন (পূর্ণ ক্ষমতা)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddAdminModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition"
                >
                  অনুমোদন দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        isDanger={confirmState.isDanger}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirmDialog}
      />

    </div>
  );
};

export default AdminSettingsTab;
