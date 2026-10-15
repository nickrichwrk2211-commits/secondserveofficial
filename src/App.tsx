import React, { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  ShieldCheck,
  Building2,
  HeartHandshake,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Search,
  Plus,
  LogOut,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  Package,
  TrendingUp,
  HelpCircle,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Sparkles,
  ClipboardList,
  Check,
  ArrowRight,
  Shield,
  Layers,
  Heart,
  Utensils,
  User as UserIcon,
  RotateCcw,
} from 'lucide-react';
import { api, getStoredToken } from './api';
import type {
  User,
  FoodListing,
  MenuItem,
  FoodRequest,
  AppNotification,
  AuditLog,
  PlatformStats,
  FoodCategory,
} from './types';

export default function App() {
  // Current user & Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Auth Page State (for non-authenticated view)
  const [authTab, setAuthTab] = useState<'signin' | 'register' | 'forgot'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authShowPassword, setAuthShowPassword] = useState(false);
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'user' | 'restaurant' | 'ngo' | 'admin'>('restaurant');
  const [authOrgName, setAuthOrgName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authOperatingArea, setAuthOperatingArea] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Navigation page: 'impact' | 'create-listing' | 'overview' | 'browse' | 'requests'
  const [currentPage, setCurrentPage] = useState<
    'impact' | 'create-listing' | 'overview' | 'browse' | 'requests'
  >('impact');

  // Timeframe filter for impact page
  const [impactFilter, setImpactFilter] = useState<'all' | 'month' | 'week'>('all');

  // UI state
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);
  const [userMenuDropdownOpen, setUserMenuDropdownOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);

  // Shared Data from Server
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Create Listing Form State (matches screenshot)
  const [createForm, setCreateForm] = useState({
    foodName: '',
    category: '' as FoodCategory | '',
    quantity: '20',
    unit: 'kg',
    estimatedWeightKg: '20',
    description: '',
    pickupStartTime: '17:00',
    pickupEndTime: '20:00',
    pickupAddress: 'Jl. Ir. H. Juanda No. 128, Dago, Bandung',
    pickupInstructions: 'Come to side kitchen service entrance on Jalan Dago',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createSuccessMessage, setCreateSuccessMessage] = useState('');

  // Reservation Modal & State
  const [selectedListing, setSelectedListing] = useState<FoodListing | null>(null);
  const [reservationQty, setReservationQty] = useState(1);
  const [reservationSubmitting, setReservationSubmitting] = useState(false);
  const [reservationFeedback, setReservationFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Pickup Verification Modal
  const [verifyCodeModalOpen, setVerifyCodeModalOpen] = useState(false);
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyFeedback, setVerifyFeedback] = useState<{
    type: 'success' | 'error';
    msg: string;
  } | null>(null);

  // Filters for Browse Surplus
  const [browseCategory, setBrowseCategory] = useState<string>('All');
  const [browseSearch, setBrowseSearch] = useState<string>('');

  // 1. Initial Session Restore
  useEffect(() => {
    async function restoreSession() {
      const token = getStoredToken();
      if (!token) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        setCurrentUser(res.user);
      } catch {
        api.logout();
        setCurrentUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    }
    restoreSession();
  }, []);

  // 2. Refresh Platform Data
  const refreshData = async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        api.getStats().catch(() => ({ stats: null })),
        api.getListings().catch(() => ({ listings: [] })),
      ]);
      if (sRes.stats) setStats(sRes.stats);
      if (lRes.listings) setListings(lRes.listings);

      if (currentUser) {
        const [rRes, nRes] = await Promise.all([
          api.getRequests().catch(() => ({ requests: [] })),
          api.getNotifications().catch(() => ({ notifications: [] })),
        ]);
        if (rRes.requests) setRequests(rRes.requests);
        if (nRes.notifications) setNotifications(nRes.notifications);

        if (currentUser.role === 'restaurant') {
          const mRes = await api.getMenuItems().catch(() => ({ menuItems: [] }));
          if (mRes.menuItems) setMenuItems(mRes.menuItems);
        }
      }
    } catch (err) {
      console.error('Data refresh error:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, [currentUser]);

  // Handle Real Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!authEmail || !authPassword) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await api.login(authEmail, authPassword);
      setCurrentUser(res.user);
      setAuthEmail('');
      setAuthPassword('');
      // Default page based on role
      if (res.user.role === 'restaurant') {
        setCurrentPage('create-listing');
      } else if (res.user.role === 'ngo' || res.user.role === 'user') {
        setCurrentPage('browse');
      } else {
        setCurrentPage('impact');
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Invalid credentials. Please try again.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Handle Real Account Registration
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!authName || !authEmail || !authPassword) {
      setAuthError('Please fill in your name, email, and a secure password.');
      return;
    }

    setAuthSubmitting(true);
    try {
      const res = await api.register({
        name: authName,
        email: authEmail,
        password: authPassword,
        role: authRole,
        organizationName: authOrgName || undefined,
        phone: authPhone || undefined,
        address: authAddress || undefined,
        operatingArea: authOperatingArea || undefined,
      });
      setCurrentUser(res.user);
      setAuthSuccess('Account registered successfully. Welcome to Second Serve!');
      if (res.user.role === 'restaurant') {
        setCurrentPage('create-listing');
      } else if (res.user.role === 'ngo' || res.user.role === 'user') {
        setCurrentPage('browse');
      } else {
        setCurrentPage('impact');
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Handle Password Reset Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    if (!authEmail) {
      setAuthError('Please enter your email address.');
      return;
    }
    setAuthSubmitting(true);
    try {
      const res = await api.resetPassword(authEmail);
      setAuthSuccess(res.message);
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Reset request failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Quick Demo Auto-Fill (Helper for Testing)
  const handleQuickFill = (email: string, pass: string) => {
    setAuthEmail(email);
    setAuthPassword(pass);
    setAuthError('');
  };

  // Reset all to 0
  const handleResetToZero = async () => {
    if (confirm('Are you sure you want to reset all platform listings and activity records back to 0?')) {
      try {
        await api.resetData();
        await refreshData();
        alert('All platform records have been reset to 0.');
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to reset');
      }
    }
  };

  // Handle Form Submission for Create Listing
  const handleCreateListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.foodName || !createForm.category) {
      alert('Please fill in food name and select a category.');
      return;
    }

    setCreateSubmitting(true);
    setCreateSuccessMessage('');
    try {
      await api.createListing({
        title: createForm.foodName,
        category: createForm.category as FoodCategory,
        originalQuantity: Number(createForm.quantity) || 1,
        unit: createForm.unit,
        estimatedWeightKg: Number(createForm.estimatedWeightKg) || 1,
        description: createForm.description,
        allergens: [],
        storageNotes: 'Stored hygienically according to Second Serve food safety charter.',
        pickupAddress: createForm.pickupAddress,
        pickupStartTime: createForm.pickupStartTime,
        pickupEndTime: createForm.pickupEndTime,
        pickupInstructions: createForm.pickupInstructions,
      });

      setCreateSuccessMessage('Listing created successfully! Visible to verified organizations.');
      setCreateForm({
        foodName: '',
        category: '',
        quantity: '20',
        unit: 'kg',
        estimatedWeightKg: '20',
        description: '',
        pickupStartTime: '17:00',
        pickupEndTime: '20:00',
        pickupAddress: currentUser?.address || 'Jl. Ir. H. Juanda No. 128, Bandung',
        pickupInstructions: 'Come to side kitchen entrance',
      });
      await refreshData();
      setTimeout(() => {
        setCurrentPage('impact');
      }, 1200);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to publish listing');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Reservation Submit
  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;
    setReservationSubmitting(true);
    setReservationFeedback(null);
    try {
      await api.createRequest(selectedListing.id, reservationQty);
      setReservationFeedback({
        type: 'success',
        msg: `Reserved ${reservationQty} ${selectedListing.unit}! A 6-character pickup code has been issued.`,
      });
      await refreshData();
    } catch (err: unknown) {
      setReservationFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Reservation failed.',
      });
    } finally {
      setReservationSubmitting(false);
    }
  };

  // Handle Code Verification
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verifyCodeInput.trim().toUpperCase();
    if (!code) return;

    const targetReq = requests.find((r) => r.pickupCode.toUpperCase() === code);
    if (!targetReq) {
      setVerifyFeedback({
        type: 'error',
        msg: `No active reservation found with pickup code "${code}".`,
      });
      return;
    }

    try {
      await api.updateRequestStatus(targetReq.id, 'completed');
      setVerifyFeedback({
        type: 'success',
        msg: `Collection verified! Handover completed for ${targetReq.requestedQuantity} ${targetReq.unit} of "${targetReq.foodTitle}".`,
      });
      setVerifyCodeInput('');
      await refreshData();
    } catch (err: unknown) {
      setVerifyFeedback({
        type: 'error',
        msg: err instanceof Error ? err.message : 'Verification failed.',
      });
    }
  };

  // Filtered surplus listings for Browse view
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchCat = browseCategory === 'All' || l.category === browseCategory;
      const matchSearch =
        browseSearch === '' ||
        l.title.toLowerCase().includes(browseSearch.toLowerCase()) ||
        l.restaurantName.toLowerCase().includes(browseSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [listings, browseCategory, browseSearch]);

  const activePartnerLabel = currentUser?.organizationName || currentUser?.name || 'hbjb';
  const activePartnerSub =
    currentUser?.role === 'restaurant'
      ? 'Food partner'
      : currentUser?.role === 'ngo'
      ? 'Community partner'
      : currentUser?.role === 'admin'
      ? 'Platform admin'
      : 'Community user';

  // Real Database-Derived Statistics Starting at 0
  const displayKg = stats?.totalKgRescued ?? 0;
  const displayMeals = stats?.mealsDistributed ?? 0;
  const displayRestaurants = stats?.participatingRestaurantsCount ?? 0;
  const displayOrgs = stats?.registeredNgosCount ?? 0;
  const displayBackupMeals = stats?.backupMealsServed ?? 0;

  // =========================================================================
  // VIEW A: REAL FULLY FUNCTIONAL LOGIN & REGISTRATION SCREEN
  // =========================================================================
  if (!currentUser && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F6] flex flex-col justify-between text-stone-900 font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#EBF3EE] selection:text-[#234D36]">
        {/* Top Minimal Bar */}
        <header className="h-16 border-b border-[#E8EAE6] bg-white px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#234D36] flex items-center justify-center text-white shadow-xs">
              <span className="font-serif font-bold text-lg leading-none -mt-0.5">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-800 lowercase">
              second<span className="text-stone-900">serve</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Bina Bangsa School Bandung</span>
          </div>
        </header>

        {/* Main Center Authentication Card */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8EAE6] shadow-sm p-8 space-y-6">
            {/* Header info */}
            <div className="text-center space-y-1">
              <div className="text-[11px] font-mono tracking-widest text-[#234D36] uppercase font-semibold">
                Good Food. Second Chances.
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900">
                {authTab === 'signin' && 'Sign in to SecondServe'}
                {authTab === 'register' && 'Create your account'}
                {authTab === 'forgot' && 'Reset your password'}
              </h1>
              <p className="text-xs text-stone-500">
                {authTab === 'signin' && 'Enter your credentials to access your food rescue portal.'}
                {authTab === 'register' && 'Join the network to publish, reserve, or distribute surplus food.'}
                {authTab === 'forgot' && 'Enter your registered email to receive recovery instructions.'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex p-1 bg-stone-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  authTab === 'signin'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`flex-1 py-2 rounded-lg transition-colors ${
                  authTab === 'register'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error & Success Messages */}
            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {authTab === 'signin' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36] focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-stone-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthTab('forgot');
                        setAuthError('');
                      }}
                      className="text-[11px] text-[#234D36] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={authShowPassword ? 'text' : 'password'}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 pr-10 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setAuthShowPassword(!authShowPassword)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                    >
                      {authShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 bg-[#234D36] hover:bg-[#1B3E2B] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  {authSubmitting ? 'Authenticating...' : 'Sign in to SecondServe'}
                </button>

                {/* Pre-configured testing accounts reminder */}
                <div className="pt-3 border-t border-stone-100">
                  <div className="text-[10px] font-mono text-stone-400 uppercase text-center mb-2">
                    Quick test credentials (click to fill)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('dago.bakery@secondserve.org', 'Password123!')}
                      className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 hover:bg-[#EBF3EE] text-left truncate"
                    >
                      <span className="font-semibold block text-stone-800">Dago Bakery</span>
                      <span className="text-[10px] text-stone-500">Restaurant</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('bandung.foodbank@ngo.id', 'Password123!')}
                      className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 hover:bg-[#EBF3EE] text-left truncate"
                    >
                      <span className="font-semibold block text-stone-800">Bandung Food Bank</span>
                      <span className="text-[10px] text-stone-500">NGO</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('user.dewi@gmail.com', 'Password123!')}
                      className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 hover:bg-[#EBF3EE] text-left truncate"
                    >
                      <span className="font-semibold block text-stone-800">Dewi Lestari</span>
                      <span className="text-[10px] text-stone-500">Community User</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('admin@secondserve.org', 'AdminPassword2026!')}
                      className="p-1.5 rounded-lg bg-stone-50 border border-stone-200/80 hover:bg-[#EBF3EE] text-left truncate"
                    >
                      <span className="font-semibold block text-stone-800">Admin Nicholas</span>
                      <span className="text-[10px] text-stone-500">Platform Admin</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* REGISTRATION FORM */}
            {authTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Select Account Role
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAuthRole('restaurant')}
                      className={`p-2 rounded-lg border text-xs text-left transition-colors ${
                        authRole === 'restaurant'
                          ? 'border-[#234D36] bg-[#EBF3EE] text-[#1C4730] font-semibold'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="font-bold">Restaurant</div>
                      <div className="text-[10px] opacity-80">Publish surplus food</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthRole('ngo')}
                      className={`p-2 rounded-lg border text-xs text-left transition-colors ${
                        authRole === 'ngo'
                          ? 'border-[#234D36] bg-[#EBF3EE] text-[#1C4730] font-semibold'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="font-bold">NGO / Charity</div>
                      <div className="text-[10px] opacity-80">Redistribute batches</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthRole('user')}
                      className={`p-2 rounded-lg border text-xs text-left transition-colors ${
                        authRole === 'user'
                          ? 'border-[#234D36] bg-[#EBF3EE] text-[#1C4730] font-semibold'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="font-bold">Community User</div>
                      <div className="text-[10px] opacity-80">Claim individual meals</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthRole('admin')}
                      className={`p-2 rounded-lg border text-xs text-left transition-colors ${
                        authRole === 'admin'
                          ? 'border-[#234D36] bg-[#EBF3EE] text-[#1C4730] font-semibold'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="font-bold">Administrator</div>
                      <div className="text-[10px] opacity-80">Platform coordinator</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    {authRole === 'user' ? 'Full Name' : 'Responsible Contact Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3 py-1.5 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                  />
                </div>

                {authRole !== 'user' && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      {authRole === 'restaurant'
                        ? 'Restaurant / Kitchen Name'
                        : authRole === 'ngo'
                        ? 'Organization Name'
                        : 'Department Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={authOrgName}
                      onChange={(e) => setAuthOrgName(e.target.value)}
                      placeholder={
                        authRole === 'restaurant'
                          ? 'e.g. Dago Artisan Bakery'
                          : 'e.g. Bandung Community Kitchen'
                      }
                      className="w-full px-3 py-1.5 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full px-3 py-1.5 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                    />
                  </div>
                </div>

                {authRole === 'restaurant' && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Pickup Address (Bandung)
                    </label>
                    <input
                      type="text"
                      required
                      value={authAddress}
                      onChange={(e) => setAuthAddress(e.target.value)}
                      placeholder="e.g. Jl. Ir. H. Juanda No. 128, Bandung"
                      className="w-full px-3 py-1.5 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                    />
                  </div>
                )}

                {authRole === 'ngo' && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Operating Area in Bandung
                    </label>
                    <input
                      type="text"
                      required
                      value={authOperatingArea}
                      onChange={(e) => setAuthOperatingArea(e.target.value)}
                      placeholder="e.g. Dago, Coblong, Sumur Bandung"
                      className="w-full px-3 py-1.5 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full mt-2 py-2.5 bg-[#234D36] hover:bg-[#1B3E2B] disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {authSubmitting ? 'Registering Account...' : 'Create Account & Enter'}
                </button>
              </form>
            )}

            {/* FORGOT PASSWORD FORM */}
            {authTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Registered Email
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 text-xs bg-[#FBFBFA] border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full py-2.5 bg-[#234D36] hover:bg-[#1B3E2B] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {authSubmitting ? 'Processing...' : 'Send Password Reset Link'}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('signin');
                      setAuthError('');
                    }}
                    className="text-xs text-stone-500 hover:text-stone-900"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-stone-400 border-t border-stone-200/60">
          © 2026 Second Serve · Bina Bangsa School Bandung, Indonesia · All rights reserved.
        </footer>
      </div>
    );
  }

  // =========================================================================
  // VIEW B: AUTHENTICATED WORKSPACE (Pixel-accurate to TakeScreenshot.com)
  // =========================================================================
  return (
    <div className="min-h-screen flex bg-[#F8F8F6] text-stone-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ================================================================= */}
      {/* LEFT SIDEBAR (TakeScreenshot.com (1).png)                         */}
      {/* ================================================================= */}
      <aside className="w-64 bg-white border-r border-[#E8EAE6] flex flex-col justify-between shrink-0 min-h-screen z-20">
        <div>
          {/* Logo brand mark */}
          <div className="p-6 pb-5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#234D36] flex items-center justify-center text-white shadow-xs">
              <span className="font-serif font-bold text-lg leading-none -mt-0.5">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-stone-800 lowercase">
              second<span className="text-stone-900">serve</span>
            </span>
          </div>

          {/* Section: COMMUNITY NETWORK */}
          <div className="px-4 py-2">
            <div className="text-[10px] font-mono tracking-wider text-stone-400 uppercase font-medium mb-2 px-2">
              Community network
            </div>

            {/* Partner Dropdown Box */}
            <div className="relative">
              <button
                onClick={() => setPartnerDropdownOpen(!partnerDropdownOpen)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-stone-200/90 bg-[#FBFBFA] hover:bg-stone-50 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#EBF3EE] text-[#234D36] flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold text-stone-900 truncate">
                      {activePartnerLabel}
                    </div>
                    <div className="text-[11px] text-stone-500">{activePartnerSub}</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-stone-400 shrink-0 ml-1" />
              </button>

              {/* Partner Dropdown Menu */}
              {partnerDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-30 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-mono text-stone-400 uppercase">
                    Current Partner Profile
                  </div>
                  <div className="px-2 py-1.5 text-stone-700 font-medium">
                    {currentUser?.name} ({currentUser?.role})
                  </div>
                  <button
                    onClick={handleResetToZero}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-stone-50 text-stone-600 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                    <span>Reset platform to 0</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section: WORKSPACE */}
          <div className="px-4 py-4 space-y-1">
            <div className="text-[10px] font-mono tracking-wider text-stone-400 uppercase font-medium mb-2 px-2">
              Workspace
            </div>

            <button
              onClick={() => setCurrentPage('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentPage === 'overview'
                  ? 'bg-[#EBF3EE] text-[#1C4730] font-semibold border-l-4 border-[#234D36]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setCurrentPage('create-listing')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentPage === 'create-listing'
                  ? 'bg-[#EBF3EE] text-[#1C4730] font-semibold border-l-4 border-[#234D36]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>Create listing</span>
            </button>

            <button
              onClick={() => setCurrentPage('impact')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentPage === 'impact'
                  ? 'bg-[#EBF3EE] text-[#1C4730] font-semibold border-l-4 border-[#234D36]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Community impact</span>
            </button>

            <button
              onClick={() => setCurrentPage('browse')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentPage === 'browse'
                  ? 'bg-[#EBF3EE] text-[#1C4730] font-semibold border-l-4 border-[#234D36]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <Search className="w-4 h-4 shrink-0" />
              <span>Browse surplus</span>
            </button>

            <button
              onClick={() => setCurrentPage('requests')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                currentPage === 'requests'
                  ? 'bg-[#EBF3EE] text-[#1C4730] font-semibold border-l-4 border-[#234D36]'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              <span>Requests & Pickups</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 space-y-2 border-t border-stone-100">
          <button
            onClick={() => setAboutModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-stone-400" />
            <span>About SecondServe</span>
          </button>

          <button
            onClick={() => {
              api.logout();
              setCurrentUser(null);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4 text-stone-400" />
            <span>Sign out</span>
          </button>

          <div className="pt-3 px-2 flex items-center gap-2 text-[11px] text-stone-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Safe food. Shared with care.</span>
          </div>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* MAIN CONTENT AREA                                                 */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Breadcrumb Bar */}
        <header className="h-14 bg-white/90 backdrop-blur-xs border-b border-[#E8EAE6] px-8 flex items-center justify-between shrink-0">
          {/* Breadcrumb matching screenshots */}
          <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
            <span className="text-stone-600">SecondServe</span>
            <span>/</span>
            <span className="font-semibold text-stone-900 capitalize">
              {currentPage === 'impact' && 'Community impact'}
              {currentPage === 'create-listing' && 'Create listing'}
              {currentPage === 'overview' && 'Overview'}
              {currentPage === 'browse' && 'Browse surplus food'}
              {currentPage === 'requests' && 'Requests & Pickups'}
            </span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-4">
            {/* DEMO DATA badge matching screenshot */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F4F4F2] border border-stone-200/80 text-[10px] font-mono text-stone-600 uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>Demo data</span>
            </div>

            {/* User profile dropdown matching screenshot ('i' / 'idk v') */}
            <div className="relative">
              <button
                onClick={() => setUserMenuDropdownOpen(!userMenuDropdownOpen)}
                className="flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-[#E5DCD3] text-stone-800 font-bold text-xs flex items-center justify-center">
                  {currentUser?.name ? currentUser.name.charAt(0).toLowerCase() : 'i'}
                </div>
                <span className="font-medium text-stone-700">
                  {currentUser ? currentUser.name.split(' ')[0].toLowerCase() : 'idk'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {userMenuDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-stone-200 rounded-xl shadow-lg p-1.5 z-30 text-xs space-y-1">
                  <div className="px-2.5 py-1.5 border-b border-stone-100">
                    <div className="font-semibold text-stone-900">{currentUser?.name}</div>
                    <div className="text-[10px] text-stone-400">{currentUser?.email}</div>
                    <div className="text-[10px] font-mono text-[#234D36] capitalize mt-0.5">
                      Role: {currentUser?.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAboutModalOpen(true);
                      setUserMenuDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-700"
                  >
                    About SecondServe
                  </button>
                  <button
                    onClick={() => {
                      setVerifyFeedback(null);
                      setVerifyCodeModalOpen(true);
                      setUserMenuDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-700"
                  >
                    Verify Pickup Code
                  </button>
                  <button
                    onClick={() => {
                      handleResetToZero();
                      setUserMenuDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-stone-700 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3 text-stone-400" />
                    <span>Reset metrics to 0</span>
                  </button>
                  <button
                    onClick={() => {
                      api.logout();
                      setCurrentUser(null);
                      setUserMenuDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-600 font-medium"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
          {/* =============================================================== */}
          {/* PAGE 1: COMMUNITY IMPACT (TakeScreenshot.com (1).png)           */}
          {/* =============================================================== */}
          {currentPage === 'impact' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header section with kicker and serif title */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-stone-500 lowercase tracking-wide mb-1">
                    Small acts, shared widely
                  </div>
                  <h1 className="text-4xl font-bold font-serif text-stone-900 tracking-tight">
                    Community impact
                  </h1>
                  <p className="text-xs text-stone-600 mt-1">
                    Every rescued ingredient is a story of neighbors looking out for one another.
                  </p>
                </div>

                {/* Right button: All-time impact */}
                <div>
                  <button
                    onClick={() =>
                      setImpactFilter(
                        impactFilter === 'all' ? 'month' : impactFilter === 'month' ? 'week' : 'all'
                      )
                    }
                    className="px-3.5 py-1.5 bg-white border border-stone-200/90 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#234D36]"></span>
                    <span>
                      {impactFilter === 'all'
                        ? 'All-time impact'
                        : impactFilter === 'month'
                        ? 'Past 30 days'
                        : 'Past 7 days'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Big Forest Green Banner Card */}
              <div className="bg-[#24523B] rounded-2xl p-8 sm:p-10 text-white relative overflow-hidden shadow-sm">
                <div className="relative z-10 max-w-lg space-y-2">
                  <div className="text-[11px] font-mono tracking-widest text-[#98C2A8] uppercase">
                    The good we've done together
                  </div>
                  <div className="text-6xl sm:text-7xl font-bold font-serif tracking-tight flex items-baseline gap-2">
                    <span>{displayKg}</span>
                    <span className="text-2xl sm:text-3xl font-sans font-medium text-[#B7D8C4]">
                      kg
                    </span>
                  </div>
                  <div className="text-sm text-[#D7EADE] font-light">
                    of good food rescued from going to waste
                  </div>
                </div>

                {/* Right decorative circular graphic matching screenshot */}
                <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center justify-center">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border border-white/20 flex flex-col items-center justify-center text-center p-2">
                      <div className="w-7 h-7 text-[#98C2A8] mb-1">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 2C6.5 2 2 6.5 2 12c0 5 4 9 9 9 1 0 1-1 1-2 0-.5-.2-1-.5-1.5C11.2 17 11 16.5 11 16c0-1.1.9-2 2-2h1c4 0 7.5-3.5 7.5-7.5C21.5 4 17 2 12 2z" />
                        </svg>
                      </div>
                      <span className="text-[9px] font-mono tracking-widest text-[#B7D8C4] uppercase">
                        Better
                      </span>
                      <span className="text-[9px] font-mono tracking-widest text-[#B7D8C4] uppercase">
                        Together
                      </span>
                    </div>
                    {/* Directional curving arrow */}
                    <svg
                      className="absolute inset-0 w-full h-full text-white/10"
                      viewBox="0 0 100 100"
                    >
                      <path
                        d="M 50 10 A 40 40 0 1 1 10 50"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 4 Stat Cards in a row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Meals distributed */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8EAE6] flex flex-col justify-between shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-stone-500 font-medium">Meals distributed</div>
                    <div className="w-8 h-8 rounded-lg bg-[#FBEFEF] text-[#D9534F] flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold font-serif text-stone-900 tracking-tight">
                      {displayMeals}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Estimated meals from completed pickups
                    </div>
                  </div>
                </div>

                {/* Card 2: Partner restaurants */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8EAE6] flex flex-col justify-between shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-stone-500 font-medium">Partner restaurants</div>
                    <div className="w-8 h-8 rounded-lg bg-[#EDF3F9] text-[#3B7BBF] flex items-center justify-center">
                      <Utensils className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold font-serif text-stone-900 tracking-tight">
                      {displayRestaurants}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Local food businesses in the network
                    </div>
                  </div>
                </div>

                {/* Card 3: Community organizations */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8EAE6] flex flex-col justify-between shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-stone-500 font-medium">Community organizations</div>
                    <div className="w-8 h-8 rounded-lg bg-[#EBF3EE] text-[#234D36] flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold font-serif text-stone-900 tracking-tight">
                      {displayOrgs}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Verified teams caring for neighbors
                    </div>
                  </div>
                </div>

                {/* Card 4: Backup meals served */}
                <div className="bg-white p-5 rounded-2xl border border-[#E8EAE6] flex flex-col justify-between shadow-2xs">
                  <div className="flex justify-between items-start">
                    <div className="text-xs text-stone-500 font-medium">Backup meals served</div>
                    <div className="w-8 h-8 rounded-lg bg-[#FEF6EC] text-[#D9822B] flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-3xl font-bold font-serif text-stone-900 tracking-tight">
                      {displayBackupMeals}
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1">
                      Supported through community partners
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Food Rescued Over Time + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Card: Chart */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#E8EAE6] shadow-2xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">
                        A little more every week
                      </div>
                      <h3 className="text-lg font-bold font-serif text-stone-900 mt-0.5">
                        Food rescued over time
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <span className="w-2 h-2 rounded-full bg-[#234D36]"></span>
                      <span>Kilograms</span>
                    </div>
                  </div>

                  {/* SVG Line / Area chart */}
                  <div className="h-56 w-full pt-4 relative">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 600 180">
                      {/* Horizontal Grid lines */}
                      <line x1="40" y1="20" x2="580" y2="20" stroke="#F0F1EE" strokeDasharray="4 4" />
                      <line x1="40" y1="60" x2="580" y2="60" stroke="#F0F1EE" strokeDasharray="4 4" />
                      <line x1="40" y1="100" x2="580" y2="100" stroke="#F0F1EE" strokeDasharray="4 4" />
                      <line x1="40" y1="140" x2="580" y2="140" stroke="#F0F1EE" />

                      {/* Y-axis labels */}
                      <text x="25" y="24" fontSize="10" fill="#A8ABA2" textAnchor="end">60</text>
                      <text x="25" y="64" fontSize="10" fill="#A8ABA2" textAnchor="end">45</text>
                      <text x="25" y="104" fontSize="10" fill="#A8ABA2" textAnchor="end">30</text>
                      <text x="25" y="144" fontSize="10" fill="#A8ABA2" textAnchor="end">15</text>

                      {/* Smooth Area Gradient */}
                      <defs>
                        <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#234D36" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#234D36" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {displayKg > 0 ? (
                        <>
                          <path
                            d="M 60 140 Q 140 135 220 120 T 380 90 T 500 55 T 570 35 L 570 140 L 60 140 Z"
                            fill="url(#curveGradient)"
                          />
                          <path
                            d="M 60 140 Q 140 135 220 120 T 380 90 T 500 55 T 570 35"
                            fill="none"
                            stroke="#234D36"
                            strokeWidth="2.5"
                          />
                          <circle cx="570" cy="35" r="4.5" fill="#234D36" />
                        </>
                      ) : (
                        <path
                          d="M 60 140 L 570 140"
                          fill="none"
                          stroke="#234D36"
                          strokeWidth="2"
                        />
                      )}

                      {/* X-axis labels */}
                      <text x="60" y="165" fontSize="10" fill="#A8ABA2" textAnchor="middle">May</text>
                      <text x="160" y="165" fontSize="10" fill="#A8ABA2" textAnchor="middle">Jun</text>
                      <text x="260" y="165" fontSize="10" fill="#A8ABA2" textAnchor="middle">Jul</text>
                      <text x="360" y="165" fontSize="10" fill="#A8ABA2" textAnchor="middle">Aug</text>
                      <text x="460" y="165" fontSize="10" fill="#A8ABA2" textAnchor="middle">Sep</text>
                      <text x="560" y="165" fontSize="10" fill="#A8ABA2" textAnchor="middle">Oct</text>
                    </svg>
                  </div>
                </div>

                {/* Right Card: Recent Activity */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E8EAE6] shadow-2xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">
                          The good keeps moving
                        </div>
                        <h3 className="text-lg font-bold font-serif text-stone-900 mt-0.5">
                          Recent activity
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <span>Live</span>
                      </div>
                    </div>

                    {/* Feed list matching screenshot */}
                    <div className="space-y-3.5 pt-1">
                      {requests.length === 0 ? (
                        <div className="text-xs text-stone-400 italic py-6 text-center">
                          No pickups recorded yet. Start by publishing a surplus listing.
                        </div>
                      ) : (
                        requests.slice(0, 3).map((r) => (
                          <div key={r.id} className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#EBF3EE] text-[#234D36] flex items-center justify-center shrink-0 mt-0.5">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs text-stone-800 leading-snug">
                                <span className="font-semibold text-stone-900">
                                  {r.requesterOrg || r.requesterName}
                                </span>{' '}
                                {r.status === 'completed' ? 'collected' : 'reserved'} {r.requestedQuantity}{' '}
                                {r.unit} from {r.restaurantName}
                              </div>
                              <div className="text-[11px] text-stone-400 mt-0.5 font-mono">
                                Status: {r.status.replace('_', ' ')}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100">
                    <button
                      onClick={() => setCurrentPage('requests')}
                      className="text-xs text-[#234D36] font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>View full collection log</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* PAGE 2: CREATE LISTING (TakeScreenshot.com.png)                 */}
          {/* =============================================================== */}
          {currentPage === 'create-listing' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div>
                <div className="text-xs font-mono text-stone-500 lowercase tracking-wide mb-1">
                  Make good things happen
                </div>
                <h1 className="text-4xl font-bold font-serif text-stone-900 tracking-tight">
                  Create a food listing
                </h1>
                <p className="text-xs text-stone-600 mt-1">
                  A few details help a verified community partner collect safely and on time.
                </p>
              </div>

              {createSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{createSuccessMessage}</span>
                </div>
              )}

              {/* Form & Right Side Info Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Form (8 cols) */}
                <form
                  onSubmit={handleCreateListingSubmit}
                  className="lg:col-span-8 bg-white p-7 rounded-2xl border border-[#E8EAE6] shadow-2xs space-y-8"
                >
                  {/* Step 01 */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#EBF3EE] text-[#234D36] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        01
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-stone-900">What are you sharing?</h2>
                        <p className="text-xs text-stone-500">
                          Be specific about the food and include known allergens below.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Food name */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1.5">
                          Food name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={createForm.foodName}
                          onChange={(e) => setCreateForm({ ...createForm, foodName: e.target.value })}
                          placeholder="e.g. Vegetable rice bowls"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                        />
                      </div>

                      {/* Category and Quantity Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1.5">
                            Food category <span className="text-rose-500">*</span>
                          </label>
                          <select
                            required
                            value={createForm.category}
                            onChange={(e) =>
                              setCreateForm({
                                ...createForm,
                                category: e.target.value as FoodCategory,
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                          >
                            <option value="">Choose a category</option>
                            <option value="Bakery & Pastries">Bakery & Pastries</option>
                            <option value="Prepared Meals">Prepared Meals</option>
                            <option value="Fresh Produce">Fresh Produce</option>
                            <option value="Pantry & Dairy">Pantry & Dairy</option>
                            <option value="Beverages">Beverages</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1.5">
                            Quantity <span className="text-rose-500">*</span>
                          </label>
                          <div className="flex">
                            <input
                              type="number"
                              min="1"
                              required
                              value={createForm.quantity}
                              onChange={(e) =>
                                setCreateForm({ ...createForm, quantity: e.target.value })
                              }
                              placeholder="e.g. 20"
                              className="w-full px-3.5 py-2 text-xs bg-white border border-r-0 border-stone-200 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                            />
                            <select
                              value={createForm.unit}
                              onChange={(e) =>
                                setCreateForm({ ...createForm, unit: e.target.value })
                              }
                              className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-r-lg text-stone-700 focus:outline-none"
                            >
                              <option value="kg">kg</option>
                              <option value="portions">portions</option>
                              <option value="boxes">boxes</option>
                              <option value="loaves">loaves</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Estimated weight (kg) */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1.5">
                          Estimated weight (kg) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          required
                          value={createForm.estimatedWeightKg}
                          onChange={(e) =>
                            setCreateForm({ ...createForm, estimatedWeightKg: e.target.value })
                          }
                          placeholder="For impact tracking"
                          className="w-full sm:w-1/2 px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                        />
                      </div>

                      {/* Description & allergen notes */}
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1.5">
                          Description & allergen notes
                        </label>
                        <textarea
                          rows={3}
                          value={createForm.description}
                          onChange={(e) =>
                            setCreateForm({ ...createForm, description: e.target.value })
                          }
                          placeholder="Ingredients, known allergens, packaging or storage notes..."
                          className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Step 02 */}
                  <div className="space-y-4 pt-6 border-t border-stone-100">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#EBF3EE] text-[#234D36] text-xs font-mono font-bold flex items-center justify-center shrink-0">
                        02
                      </span>
                      <div>
                        <h2 className="text-base font-bold text-stone-900">When can it be collected?</h2>
                        <p className="text-xs text-stone-500">
                          Pickup must finish before the food's use-by time.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1.5">
                            Pickup start time
                          </label>
                          <input
                            type="text"
                            value={createForm.pickupStartTime}
                            onChange={(e) =>
                              setCreateForm({ ...createForm, pickupStartTime: e.target.value })
                            }
                            placeholder="17:00"
                            className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-stone-700 mb-1.5">
                            Pickup deadline
                          </label>
                          <input
                            type="text"
                            value={createForm.pickupEndTime}
                            onChange={(e) =>
                              setCreateForm({ ...createForm, pickupEndTime: e.target.value })
                            }
                            placeholder="20:00"
                            className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1.5">
                          Pickup location address
                        </label>
                        <input
                          type="text"
                          value={createForm.pickupAddress}
                          onChange={(e) =>
                            setCreateForm({ ...createForm, pickupAddress: e.target.value })
                          }
                          className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1.5">
                          Special instructions for volunteer
                        </label>
                        <input
                          type="text"
                          value={createForm.pickupInstructions}
                          onChange={(e) =>
                            setCreateForm({ ...createForm, pickupInstructions: e.target.value })
                          }
                          placeholder="e.g. Come to side kitchen entrance on Jalan Dago"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-lg"
                        />
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={createSubmitting}
                          className="px-6 py-2.5 bg-[#234D36] hover:bg-[#1B3E2B] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                        >
                          {createSubmitting ? 'Publishing...' : 'Publish Food Listing'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Right Side Info Cards (4 cols) matching TakeScreenshot.com.png */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Card 1: Thoughtful checks */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E8EAE6] shadow-2xs space-y-4">
                    <div className="w-8 h-8 rounded-lg bg-[#EBF3EE] text-[#234D36] flex items-center justify-center">
                      <Shield className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="text-[10px] font-mono tracking-wider text-stone-400 uppercase">
                        A few thoughtful checks
                      </div>
                      <h3 className="text-base font-bold font-serif text-stone-900 mt-0.5">
                        Good food, handled with care.
                      </h3>
                    </div>

                    <ul className="space-y-2.5 text-xs text-stone-600 leading-relaxed">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#234D36] mt-1.5 shrink-0"></span>
                        <span>Only list food that's safe to eat and well stored.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#234D36] mt-1.5 shrink-0"></span>
                        <span>Set an accurate pickup window and use-by time.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#234D36] mt-1.5 shrink-0"></span>
                        <span>Note all known allergens and storage needs.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#234D36] mt-1.5 shrink-0"></span>
                        <span>Keep food separate and labelled for collection.</span>
                      </li>
                    </ul>

                    <div className="pt-4 border-t border-stone-100 flex items-center gap-2 text-xs text-[#234D36] font-medium">
                      <CheckCircle2 className="w-4 h-4 text-[#234D36] shrink-0" />
                      <span>Your listing is visible to verified organizations.</span>
                    </div>
                  </div>

                  {/* Card 2: YOUR LISTING skeleton placeholder matching screenshot */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E8EAE6] shadow-2xs space-y-3">
                    <div className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">
                      Your listing
                    </div>

                    {/* 3 clean placeholder blocks matching screenshot */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-12 rounded-lg bg-stone-100 border border-stone-200/60"></div>
                      <div className="h-12 rounded-lg bg-stone-100 border border-stone-200/60"></div>
                      <div className="h-12 rounded-lg bg-stone-100 border border-stone-200/60"></div>
                    </div>

                    <p className="text-[11px] text-stone-500 leading-relaxed">
                      Pickup details are shared only after a verified organization claims your listing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* PAGE 3: OVERVIEW                                                */}
          {/* =============================================================== */}
          {currentPage === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-stone-500 lowercase tracking-wide mb-1">
                    Good food. Second chances.
                  </div>
                  <h1 className="text-4xl font-bold font-serif text-stone-900 tracking-tight">
                    Welcome back, {currentUser?.name.split(' ')[0]}
                  </h1>
                  <p className="text-xs text-stone-600 mt-1">
                    Logged in as <span className="font-semibold">{currentUser?.role}</span> ({activePartnerLabel})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage('create-listing')}
                    className="px-4 py-2 bg-[#234D36] hover:bg-[#1B3E2B] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create listing</span>
                  </button>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E8EAE6] shadow-2xs">
                  <span className="text-xs text-stone-500 font-medium">Active surplus listings</span>
                  <div className="text-3xl font-bold font-serif text-stone-900 mt-1">
                    {listings.filter((l) => l.status === 'available').length}
                  </div>
                  <span className="text-[11px] text-stone-400">Ready for claim</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8EAE6] shadow-2xs">
                  <span className="text-xs text-stone-500 font-medium">Pending pickups</span>
                  <div className="text-3xl font-bold font-serif text-stone-900 mt-1">
                    {requests.filter((r) => r.status === 'pending' || r.status === 'ready_for_pickup').length}
                  </div>
                  <span className="text-[11px] text-stone-400">Awaiting collection</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E8EAE6] shadow-2xs">
                  <span className="text-xs text-stone-500 font-medium">Verified completed rescues</span>
                  <div className="text-3xl font-bold font-serif text-[#234D36] mt-1">
                    {requests.filter((r) => r.status === 'completed').length}
                  </div>
                  <span className="text-[11px] text-stone-400">Handovers recorded</span>
                </div>
              </div>

              {/* Active Listings Grid (Clean Designed Placeholders, NO photos as requested) */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8EAE6] shadow-2xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold font-serif text-stone-900">
                    Current Food Listings
                  </h3>
                  <button
                    onClick={() => setCurrentPage('browse')}
                    className="text-xs text-[#234D36] font-semibold hover:underline"
                  >
                    View all ({listings.length})
                  </button>
                </div>

                {listings.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400 bg-[#FBFBFA] rounded-xl border border-dashed border-stone-200">
                    No food listings published yet. Click "Create listing" to share surplus food.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl border border-stone-200/90 bg-[#FBFBFA] flex flex-col justify-between space-y-3"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                            <span className="font-mono text-[#234D36] font-semibold">
                              {item.category}
                            </span>
                            <span className="font-mono capitalize text-stone-600">
                              {item.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-stone-900">{item.title}</h4>
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-stone-200/60 space-y-2 text-xs">
                          <div className="flex justify-between text-stone-600">
                            <span>Available:</span>
                            <span className="font-bold font-mono text-stone-900">
                              {item.availableQuantity} of {item.originalQuantity} {item.unit}
                            </span>
                          </div>
                          <div className="flex justify-between text-stone-500 text-[11px]">
                            <span>Window:</span>
                            <span className="font-mono">
                              {item.pickupStartTime} - {item.pickupEndTime}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedListing(item);
                              setReservationQty(1);
                              setReservationFeedback(null);
                            }}
                            className="w-full mt-1 py-1.5 bg-[#234D36] hover:bg-[#1B3E2B] text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            View & Claim
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* PAGE 4: BROWSE SURPLUS FOOD                                     */}
          {/* =============================================================== */}
          {currentPage === 'browse' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div>
                <div className="text-xs font-mono text-stone-500 lowercase tracking-wide mb-1">
                  Food discovery in Bandung
                </div>
                <h1 className="text-4xl font-bold font-serif text-stone-900 tracking-tight">
                  Browse surplus food
                </h1>
                <p className="text-xs text-stone-600 mt-1">
                  Available batches from partner restaurants and bakeries in Bandung.
                </p>
              </div>

              {/* Search & Categories Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full sm:w-auto">
                  {[
                    'All',
                    'Bakery & Pastries',
                    'Prepared Meals',
                    'Fresh Produce',
                    'Pantry & Dairy',
                    'Beverages',
                  ].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setBrowseCategory(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                        browseCategory === cat
                          ? 'bg-[#234D36] text-white'
                          : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    value={browseSearch}
                    onChange={(e) => setBrowseSearch(e.target.value)}
                    placeholder="Search by title or kitchen..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
                  />
                </div>
              </div>

              {/* Listings Grid (Clean Placeholders, NO photos as requested) */}
              {filteredListings.length === 0 ? (
                <div className="p-12 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
                  No surplus food matches your criteria right now.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredListings.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-5 rounded-2xl border border-[#E8EAE6] shadow-2xs flex flex-col justify-between space-y-4 hover:border-stone-300 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-stone-500">
                          <span className="font-mono text-[#234D36] font-semibold text-[11px]">
                            {item.category}
                          </span>
                          <span className="text-[11px] font-mono text-stone-400">
                            {item.restaurantName}
                          </span>
                        </div>

                        <h3 className="text-base font-bold font-serif text-stone-900 leading-snug">
                          {item.title}
                        </h3>

                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
                        <div className="flex justify-between text-stone-600">
                          <span>Remaining Portions:</span>
                          <span className="font-mono font-bold text-stone-900">
                            {item.availableQuantity} of {item.originalQuantity} {item.unit}
                          </span>
                        </div>

                        <div className="flex justify-between text-stone-500 text-[11px]">
                          <span>Pickup Location:</span>
                          <span className="truncate max-w-[170px] text-right">{item.pickupAddress}</span>
                        </div>

                        <div className="flex justify-between text-stone-500 text-[11px]">
                          <span>Pickup Window:</span>
                          <span className="font-mono">
                            {item.pickupStartTime} - {item.pickupEndTime}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedListing(item);
                            setReservationQty(1);
                            setReservationFeedback(null);
                          }}
                          className="w-full mt-2 py-2 bg-[#234D36] hover:bg-[#1B3E2B] text-white text-xs font-semibold rounded-xl transition-colors"
                        >
                          Claim for Rescue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* PAGE 5: REQUESTS & PICKUPS                                      */}
          {/* =============================================================== */}
          {currentPage === 'requests' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-mono text-stone-500 lowercase tracking-wide mb-1">
                    Safe handovers
                  </div>
                  <h1 className="text-4xl font-bold font-serif text-stone-900 tracking-tight">
                    Requests & Pickups
                  </h1>
                  <p className="text-xs text-stone-600 mt-1">
                    Review reservations and verify 6-character collection codes.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setVerifyFeedback(null);
                    setVerifyCodeModalOpen(true);
                  }}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Verify Pickup Code</span>
                </button>
              </div>

              {/* Requests Table */}
              <div className="bg-white rounded-2xl border border-[#E8EAE6] overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-stone-100 flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-900">All Reservations</span>
                  <span className="font-mono text-stone-400">{requests.length} total entries</span>
                </div>
                {requests.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-400">
                    No active reservations or pickup requests yet.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {requests.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-stone-900">{r.foodTitle}</div>
                          <div className="text-stone-500">
                            {r.restaurantName} · Recipient: {r.requesterOrg || r.requesterName}
                          </div>
                          <div className="text-stone-400 text-[11px] font-mono">
                            Quantity: {r.requestedQuantity} {r.unit} · Window: {r.pickupWindow}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-stone-900">
                              Code: {r.pickupCode}
                            </div>
                            <div className="text-[11px] font-semibold capitalize text-stone-600">
                              {r.status.replace('_', ' ')}
                            </div>
                          </div>

                          {r.status !== 'completed' && (
                            <button
                              onClick={async () => {
                                await api.updateRequestStatus(r.id, 'completed');
                                await refreshData();
                              }}
                              className="px-3 py-1.5 bg-[#234D36] hover:bg-[#1B3E2B] text-white text-xs font-medium rounded-lg"
                            >
                              Mark Picked Up
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: ABOUT SECONDSERVE (Bina Bangsa Bandung details & Team)   */}
      {/* ================================================================= */}
      {aboutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white max-w-lg w-full rounded-2xl p-7 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-mono text-[#234D36] uppercase tracking-wider font-semibold">
                  About the initiative
                </div>
                <h3 className="text-2xl font-bold font-serif text-stone-900 mt-1">
                  Second Serve
                </h3>
                <p className="text-xs text-stone-500 italic">"Good Food. Second Chances."</p>
              </div>
              <button
                onClick={() => setAboutModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
              <p>
                Second Serve is a student-led food-rescue initiative from{' '}
                <strong className="text-stone-900 font-semibold">
                  Bina Bangsa School Bandung, Indonesia
                </strong>
                .
              </p>
              <p>
                Our core mission is to eliminate edible food waste by connecting restaurants and
                culinary kitchens that have surplus safe food directly to verified local NGOs,
                charities, and community kitchens who can redistribute it to neighbors in need.
              </p>
            </div>

            {/* Team Members */}
            <div className="pt-2 border-t border-stone-100">
              <h4 className="text-xs font-mono text-stone-400 uppercase tracking-wider mb-3">
                Core Initiative Team
              </h4>
              <div className="space-y-2.5">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-stone-900">Nicholas Richard Lidrapraja</div>
                    <div className="text-[11px] text-stone-500">Bina Bangsa School Bandung</div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#234D36]">
                    Team Representative
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-stone-900">Nathan Sabastian</div>
                    <div className="text-[11px] text-stone-500">Bina Bangsa School Bandung</div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#234D36]">
                    Creative Director
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-stone-900">Rylion Athaelnes Theardy</div>
                    <div className="text-[11px] text-stone-500">Bina Bangsa School Bandung</div>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#234D36]">
                    Team Member
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setAboutModalOpen(false)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: CLAIM / RESERVE FOOD MODAL                               */}
      {/* ================================================================= */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-mono text-[#234D36] font-semibold">
                  {selectedListing.category}
                </span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-0.5">
                  {selectedListing.title}
                </h3>
                <p className="text-xs text-stone-500">{selectedListing.restaurantName}</p>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {selectedListing.description}
            </p>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Available portions:</span>
                <span className="font-mono font-bold text-stone-900">
                  {selectedListing.availableQuantity} {selectedListing.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Pickup window:</span>
                <span className="font-mono">
                  {selectedListing.pickupStartTime} - {selectedListing.pickupEndTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Pickup address:</span>
                <span className="text-right truncate max-w-[200px]">
                  {selectedListing.pickupAddress}
                </span>
              </div>
            </div>

            {reservationFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  reservationFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{reservationFeedback.msg}</span>
              </div>
            )}

            <form onSubmit={handleReserveSubmit} className="space-y-4 pt-1">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-stone-700">Portions to reserve:</label>
                <input
                  type="number"
                  min="1"
                  max={selectedListing.availableQuantity}
                  value={reservationQty}
                  onChange={(e) => setReservationQty(parseInt(e.target.value, 10) || 1)}
                  className="w-20 px-3 py-1.5 border border-stone-200 rounded-lg text-sm text-center font-mono"
                />
                <span className="text-xs text-stone-500">{selectedListing.unit}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reservationSubmitting || selectedListing.availableQuantity === 0}
                  className="px-4 py-2 bg-[#234D36] hover:bg-[#1B3E2B] text-white text-xs font-semibold rounded-lg shadow-xs"
                >
                  {reservationSubmitting ? 'Confirming...' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: VERIFY PICKUP CODE MODAL                                 */}
      {/* ================================================================= */}
      {verifyCodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold font-serif text-stone-900">Verify Pickup Code</h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enter 6-character code presented by volunteer (e.g. SS-8921).
                </p>
              </div>
              <button
                onClick={() => setVerifyCodeModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {verifyFeedback && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  verifyFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{verifyFeedback.msg}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCodeSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={verifyCodeInput}
                onChange={(e) => setVerifyCodeInput(e.target.value)}
                placeholder="SS-XXXX"
                className="w-full px-3 py-2 text-center text-lg font-mono font-bold uppercase tracking-widest bg-stone-50 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#234D36]"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#234D36] hover:bg-[#1B3E2B] text-white font-semibold text-xs rounded-lg transition-colors"
              >
                Verify & Confirm Handover
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
