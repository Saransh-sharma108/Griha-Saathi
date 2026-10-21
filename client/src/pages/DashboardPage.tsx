import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Building, 
  ShieldCheck, 
  Users, 
  AlertCircle, 
  Server, 
  Key, 
  CheckCircle2, 
  Clock,
  Layers,
  Lock,
  Smartphone,
  Mail,
  Shield,
  Bell,
  Globe,
  Settings,
  History,
  Laptop,
  Check,
  Plus,
  RefreshCw,
  X,
  Bookmark,
  MapPin,
  Trash2,
  ShieldAlert,
  FileText,
  Search,
  BarChart3,
  Eye,
  MessageSquare,
  Calendar,
  Camera,
  Upload,
  Scale,
  Sparkles
} from 'lucide-react';
import { 
  ProviderIntegrationStatus, 
  SupportedLanguage, 
  UserProfile, 
  UserRole,
  SecurityAuditItem,
  SessionInfo,
  SavedPropertyRecord,
  Property,
  OwnerListingSummary,
  ListingDraft,
  VerificationChecklist,
  SavedSearchRecord,
  OwnerPerformanceAnalytics,
  SavedSearchFilters
} from '@shared/types';
import { translations } from '@shared/i18n';
import { NavSection } from '../components/Header';
import { ReviewerWorkspace } from '../components/ReviewerWorkspace';
import { NotificationsPanel } from '../components/NotificationsPanel';

interface DashboardPageProps {
  user: UserProfile | null;
  token: string | null;
  onOpenAuth: () => void;
  language: SupportedLanguage;
  onUserUpdate?: (updatedUser: UserProfile) => void;
  onNavigate?: (section: NavSection) => void;
}

type DashboardTab = 
  | 'overview' 
  | 'properties' 
  | 'analytics' 
  | 'searches' 
  | 'saved' 
  | 'reviewer' 
  | 'notifications' 
  | 'profile' 
  | 'roles' 
  | 'security' 
  | 'integrations';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  token,
  onOpenAuth,
  language,
  onUserUpdate,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedRoleView, setSelectedRoleView] = useState<UserRole>(user?.activeRole || user?.role || 'tenant');
  const [providers, setProviders] = useState<ProviderIntegrationStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditItem[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [savedProperties, setSavedProperties] = useState<{ record: SavedPropertyRecord; property?: Property }[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Owner Workflow State (Phase 5 & 6)
  const [ownerSummary, setOwnerSummary] = useState<OwnerListingSummary | null>(null);
  const [ownerListings, setOwnerListings] = useState<Property[]>([]);
  const [ownerDrafts, setOwnerDrafts] = useState<ListingDraft[]>([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState<'all' | 'approved' | 'review' | 'correction' | 'drafts' | 'withdrawn' | 'suspended'>('all');

  // Correction Response State
  const [correctionTarget, setCorrectionTarget] = useState<Property | null>(null);
  const [correctionResponseNotes, setCorrectionResponseNotes] = useState('');

  // Appeal State (Phase 6)
  const [appealTarget, setAppealTarget] = useState<Property | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  // Verification Checklist Modal State (Phase 6)
  const [checklistModalProperty, setChecklistModalProperty] = useState<Property | null>(null);
  const [checklistData, setChecklistData] = useState<VerificationChecklist | null>(null);
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Notifications State (Phase 6)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Phase 9: Saved Searches & Search Alerts
  const [savedSearches, setSavedSearches] = useState<SavedSearchRecord[]>([]);
  const [searchesLoading, setSearchesLoading] = useState(false);

  // Phase 9: Real Performance Analytics
  const [analyticsData, setAnalyticsData] = useState<OwnerPerformanceAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Phase 9: Property Comparison
  const [selectedSavedPropertyIds, setSelectedSavedPropertyIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Phase 9: Profile Photo & Account Safeguards
  const [photoUploading, setPhotoUploading] = useState(false);
  const [savedSearchAlerts, setSavedSearchAlerts] = useState(user?.notificationPreferences?.savedSearchAlerts ?? true);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivateAction, setDeactivateAction] = useState<'deactivate' | 'delete'>('deactivate');
  const [deactivatePin, setDeactivatePin] = useState('');
  const [deactivateReason, setDeactivateReason] = useState('');
  const [deactivateSubmitting, setDeactivateSubmitting] = useState(false);

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [preferredLang, setPreferredLang] = useState<SupportedLanguage>(user?.preferredLanguage || language);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [emailAlerts, setEmailAlerts] = useState(user?.notificationPreferences?.emailAlerts ?? true);
  const [smsAlerts, setSmsAlerts] = useState(user?.notificationPreferences?.smsAlerts ?? true);
  const [propertyInquiries, setPropertyInquiries] = useState(user?.notificationPreferences?.propertyInquiries ?? true);
  const [securityAlerts, setSecurityAlerts] = useState(user?.notificationPreferences?.securityAlerts ?? true);

  // Change PIN State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  // Contact Re-verification State
  const [showContactModal, setShowContactModal] = useState(false);
  const [newContactValue, setNewContactValue] = useState('');
  const [contactOtp, setContactOtp] = useState('');
  const [contactStep, setContactStep] = useState<'input' | 'verify'>('input');

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = translations[language].dashboard;

  useEffect(() => {
    fetchProviderStatus();
    if (user && token) {
      fetchAuditLogs();
      fetchSessions();
      fetchSavedProperties();
      fetchOwnerListings();
      fetchUnreadNotifCount();
      fetchSavedSearches();
      fetchAnalytics();
      setFullName(user.fullName || '');
      setPreferredLang(user.preferredLanguage || language);
      setAvatarUrl(user.avatarUrl || '');
      setSavedSearchAlerts(user.notificationPreferences?.savedSearchAlerts ?? true);
      setSelectedRoleView(user.activeRole || user.role);
    }
  }, [user, token]);

  const fetchOwnerListings = async () => {
    if (!token) return;
    setOwnerLoading(true);
    try {
      const res = await fetch('/api/properties/owner/my-listings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOwnerSummary(data.summary);
        setOwnerListings(data.listings || []);
        setOwnerDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error('Failed to load owner listings:', err);
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleWithdrawProperty = async (propertyId: string) => {
    if (!token) return;
    if (!window.confirm(t.withdrawConfirm)) return;
    clearMessages();
    try {
      const res = await fetch(`/api/properties/${propertyId}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Owner voluntarily withdrew listing from publication.' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(t.withdrawSuccess);
        fetchOwnerListings();
      } else {
        setErrorMessage(data.error || 'Failed to withdraw listing.');
      }
    } catch (err) {
      setErrorMessage('Network error withdrawing listing.');
    }
  };

  const handleReconfirmAvailability = async (propertyId: string) => {
    if (!token) return;
    clearMessages();
    try {
      const res = await fetch(`/api/properties/${propertyId}/reconfirm-availability`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage('Property availability successfully reconfirmed for 60 days.');
        fetchOwnerListings();
      } else {
        setErrorMessage(data.error || 'Failed to reconfirm availability.');
      }
    } catch (err) {
      setErrorMessage('Network error reconfirming availability.');
    }
  };

  const handleSubmitCorrectionResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !correctionTarget) return;
    if (!correctionResponseNotes.trim()) {
      setErrorMessage('Please provide clarification notes regarding the requested corrections.');
      return;
    }
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch(`/api/properties/${correctionTarget.id}/respond-correction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ responseNotes: correctionResponseNotes.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage('Correction response submitted for re-audit.');
        setCorrectionTarget(null);
        setCorrectionResponseNotes('');
        fetchOwnerListings();
      } else {
        setErrorMessage(data.error || 'Failed to submit correction response.');
      }
    } catch (err) {
      setErrorMessage('Network error submitting correction response.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadNotifCount = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.notifications)) {
        setUnreadNotifCount(data.notifications.filter((n: any) => !n.isRead).length);
      }
    } catch (err) {
      // ignore
    }
  };

  const handleFileAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !appealTarget) return;
    if (!appealReason.trim()) {
      setErrorMessage('Please provide a detailed justification for your appeal.');
      return;
    }
    clearMessages();
    setAppealSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${appealTarget.id}/appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: appealReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage('Appeal successfully lodged and escalated for authoritative reviewer audit.');
        setAppealTarget(null);
        setAppealReason('');
        fetchOwnerListings();
        fetchUnreadNotifCount();
      } else {
        setErrorMessage(data.error || 'Failed to file appeal.');
      }
    } catch (err) {
      setErrorMessage('Network error lodging appeal.');
    } finally {
      setAppealSubmitting(false);
    }
  };

  const handleOpenChecklistModal = async (property: Property) => {
    setChecklistModalProperty(property);
    setChecklistLoading(true);
    try {
      const res = await fetch(`/api/verifications/checklist/${property.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success && data.checklist) {
        setChecklistData(data.checklist);
      } else {
        setChecklistData(null);
      }
    } catch (err) {
      console.error('Failed to load checklist:', err);
      setChecklistData(null);
    } finally {
      setChecklistLoading(false);
    }
  };

  const handleDeleteOwnerDraft = async (draftId: string) => {
    if (!token) return;
    clearMessages();
    try {
      const res = await fetch(`/api/properties/drafts/${draftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOwnerDrafts((prev) => prev.filter((d) => d.id !== draftId));
        fetchOwnerListings();
        setStatusMessage('Draft deleted successfully.');
      }
    } catch (err) {
      setErrorMessage('Failed to delete draft.');
    }
  };

  const fetchSavedProperties = async () => {
    if (!token) return;
    setSavedLoading(true);
    try {
      const res = await fetch('/api/properties/user/saved', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.saved)) {
        setSavedProperties(data.saved);
      }
    } catch (err) {
      console.error('Failed to load saved properties:', err);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleUnsaveProperty = async (propertyId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/properties/${propertyId}/save`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedProperties((prev) => prev.filter((item) => item.record?.propertyId !== propertyId));
        setStatusMessage('Property removed from your saved collection.');
      } else {
        setErrorMessage(data.error || 'Failed to remove saved property.');
      }
    } catch (err) {
      setErrorMessage('Network error removing saved property.');
    }
  };

  const fetchProviderStatus = async () => {
    try {
      const res = await fetch('/api/providers');
      const data = await res.json();
      if (data.success && Array.isArray(data.integrations)) {
        setProviders(data.integrations);
      }
    } catch (err) {
      console.error('Error fetching providers:', err);
    }
  };

  const fetchAuditLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    }
  };

  const fetchSessions = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

  const clearMessages = () => {
    setStatusMessage(null);
    setErrorMessage(null);
  };

  // 1. Save Profile Changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim() || undefined,
          preferredLanguage: preferredLang,
          avatarUrl: avatarUrl.trim() || undefined,
          notificationPreferences: {
            emailAlerts,
            smsAlerts,
            propertyInquiries,
            securityAlerts,
            savedSearchAlerts,
          },
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to update profile.');
        return;
      }

      setStatusMessage('Profile and preferences updated successfully.');
      if (onUserUpdate) onUserUpdate(data.user);
      fetchAuditLogs();
    } catch (err) {
      setErrorMessage('Network error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  // Phase 9: Saved Searches & Search Alerts
  const fetchSavedSearches = async () => {
    if (!token) return;
    setSearchesLoading(true);
    try {
      const res = await fetch('/api/properties/saved-searches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedSearches(data.searches || []);
      }
    } catch (err) {
      console.error('Failed to load saved searches:', err);
    } finally {
      setSearchesLoading(false);
    }
  };

  const handleCheckSavedSearchAlerts = async () => {
    if (!token) return;
    clearMessages();
    setSearchesLoading(true);
    try {
      const res = await fetch('/api/properties/saved-searches/check-alerts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage(data.message || `Alert check completed. ${data.notificationsCreated || 0} alerts dispatched.`);
        fetchSavedSearches();
        fetchUnreadNotifCount();
      } else {
        setErrorMessage(data.error || 'Failed to check search alerts.');
      }
    } catch (err) {
      setErrorMessage('Network error checking search alerts.');
    } finally {
      setSearchesLoading(false);
    }
  };

  const handleDeleteSavedSearch = async (searchId: string) => {
    if (!token) return;
    if (!window.confirm(t.deleteSearchConfirm || 'Delete this saved search?')) return;
    clearMessages();
    try {
      const res = await fetch(`/api/properties/saved-searches/${searchId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
        setStatusMessage('Saved search removed.');
      } else {
        setErrorMessage(data.error || 'Failed to delete search.');
      }
    } catch (err) {
      setErrorMessage('Network error deleting search.');
    }
  };

  const handleUpdateAlertFrequency = async (searchId: string, frequency: 'instant' | 'daily' | 'weekly' | 'none') => {
    if (!token) return;
    clearMessages();
    try {
      const res = await fetch(`/api/properties/saved-searches/${searchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ alertFrequency: frequency }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSavedSearches((prev) => prev.map((s) => s.id === searchId ? { ...s, alertFrequency: frequency } : s));
        setStatusMessage('Alert frequency updated successfully.');
      }
    } catch (err) {
      setErrorMessage('Failed to update alert frequency.');
    }
  };

  // Phase 9: Real Performance Analytics
  const fetchAnalytics = async () => {
    if (!token) return;
    setAnalyticsLoading(true);
    try {
      const res = await fetch('/api/properties/owner/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAnalyticsData(data.analytics);
      }
    } catch (err) {
      console.error('Failed to load performance analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Phase 9: Profile Photo Upload
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMessage('Profile photo must be JPEG, PNG, or WebP format.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Profile photo size must be under 5MB.');
      return;
    }

    clearMessages();
    setPhotoUploading(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const res = await fetch('/api/auth/profile-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            base64Data,
            filename: file.name,
            mimeType: file.type,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAvatarUrl(data.avatarUrl);
          if (onUserUpdate && data.user) {
            onUserUpdate(data.user);
          }
          setStatusMessage(t.photoUploadSuccess || 'Profile photo uploaded successfully.');
        } else {
          setErrorMessage(data.error || 'Failed to upload profile photo.');
        }
      } catch (err) {
        setErrorMessage('Network error uploading profile photo.');
      } finally {
        setPhotoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Phase 9: Account Deactivation / Deletion
  const handleConfirmDeactivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!deactivatePin || deactivatePin.length !== 4) {
      setErrorMessage('Please enter your 4-digit security PIN to confirm.');
      return;
    }

    clearMessages();
    setDeactivateSubmitting(true);
    try {
      const res = await fetch('/api/auth/deactivate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: deactivateAction,
          reason: deactivateReason,
          pin: deactivatePin,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowDeactivateModal(false);
        alert(data.message || 'Account processed.');
        window.location.reload();
      } else {
        setErrorMessage(data.error || 'Action failed.');
      }
    } catch (err) {
      setErrorMessage('Network error processing deactivation.');
    } finally {
      setDeactivateSubmitting(false);
    }
  };

  // 2. Change 4-Digit Security PIN
  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    clearMessages();

    if (!/^\d{4}$/.test(newPin)) {
      setErrorMessage('New PIN must be exactly 4 numeric digits.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setErrorMessage('New PIN and confirmation PIN do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPin,
          newPin,
          confirmPin: confirmNewPin,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to update security PIN.');
        return;
      }

      setStatusMessage('Your 4-digit security PIN has been updated successfully.');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      fetchAuditLogs();
    } catch (err) {
      setErrorMessage('Network error changing PIN.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Switch Active Role
  const handleSwitchActiveRole = async (roleToActivate: UserRole) => {
    if (!token) return;
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: roleToActivate }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to switch role.');
        return;
      }

      setSelectedRoleView(roleToActivate);
      setStatusMessage(`Active role switched to: ${roleToActivate.toUpperCase()}.`);
      if (onUserUpdate) onUserUpdate(data.user);
      fetchAuditLogs();
    } catch (err) {
      setErrorMessage('Network error switching role.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Add a New Role
  const handleAddRole = async (roleToAdd: UserRole) => {
    if (!token) return;
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/add-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: roleToAdd }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to add role.');
        return;
      }

      setStatusMessage(`Role '${roleToAdd}' added to your account.`);
      if (onUserUpdate) onUserUpdate(data.user);
      fetchAuditLogs();
    } catch (err) {
      setErrorMessage('Network error adding role.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Revoke Sessions
  const handleRevokeSessions = async () => {
    if (!token) return;
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/sessions/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ revokeAllOther: true }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to revoke sessions.');
        return;
      }

      setStatusMessage('All other active sessions have been terminated.');
      fetchSessions();
      fetchAuditLogs();
    } catch (err) {
      setErrorMessage('Network error revoking sessions.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Request Contact Update (OTP)
  const handleRequestContactChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-contact-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newContact: newContactValue }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to request contact verification code.');
        return;
      }

      setStatusMessage(data.message || 'Verification code dispatched to your new contact.');
      setContactStep('verify');
    } catch (err) {
      setErrorMessage('Network error requesting verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Verify Contact Update
  const handleVerifyContactChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    clearMessages();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-contact-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newContact: newContactValue,
          otp: contactOtp,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid OTP code.');
        return;
      }

      setStatusMessage('Contact verified and updated successfully.');
      setShowContactModal(false);
      setContactStep('input');
      setNewContactValue('');
      setContactOtp('');
      if (onUserUpdate) onUserUpdate(data.user);
      fetchAuditLogs();
    } catch (err) {
      setErrorMessage('Network error verifying contact update.');
    } finally {
      setLoading(false);
    }
  };

  const userRoles = user?.roles || (user?.role ? [user.role] : ['tenant']);
  const availableRolesToAdd: UserRole[] = (['tenant', 'owner', 'agent', 'builder', 'property_manager'] as UserRole[])
    .filter((r) => !userRoles.includes(r));

  const renderSubmissionBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-status-success-soft)', color: 'var(--gs-status-success)' }}>
            <CheckCircle2 size={12} /> {t.statusBadgeApproved}
          </span>
        );
      case 'correction_requested':
      case 'additional_information_required':
        return (
          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-status-error-soft)', color: 'var(--gs-status-error)' }}>
            <AlertCircle size={12} /> {status === 'additional_information_required' ? 'Info Required' : t.statusBadgeCorrection}
          </span>
        );
      case 'rejected':
        return (
          <span className="gs-badge" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
            <AlertCircle size={12} /> Rejected
          </span>
        );
      case 'suspended':
        return (
          <span className="gs-badge" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            <ShieldAlert size={12} /> Suspended
          </span>
        );
      case 'expired':
        return (
          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-bg-subtle)', color: 'var(--gs-text-muted)' }}>
            <Clock size={12} /> Expired
          </span>
        );
      case 'under_review':
      case 'pending_verification':
        return (
          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-status-warning-soft)', color: 'var(--gs-status-warning)' }}>
            <Clock size={12} /> {t.statusBadgeUnderReview}
          </span>
        );
      case 'submitted':
      case 'resubmitted':
        return (
          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-status-info-soft)', color: 'var(--gs-status-info)' }}>
            <Clock size={12} /> {t.statusBadgeSubmitted}
          </span>
        );
      case 'withdrawn':
        return (
          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-bg-subtle)', color: 'var(--gs-text-muted)' }}>
            {t.statusBadgeWithdrawn}
          </span>
        );
      case 'draft':
        return (
          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-bg-subtle)', color: 'var(--gs-text-secondary)' }}>
            {t.statusBadgeDraft}
          </span>
        );
      default:
        return (
          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-bg-subtle)', color: 'var(--gs-text-muted)' }}>
            {status || 'Unknown'}
          </span>
        );
    }
  };

  return (
    <div className="gs-page-shell" style={{ padding: '2.5rem 0 5rem' }}>
      <div className="gs-container">
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="gs-page-header-title" style={{ fontSize: '2.2rem', marginBottom: '0.3rem' }}>
              {t.title}
            </h1>
            <p className="gs-page-header-subtitle" style={{ fontSize: '1rem' }}>
              {t.subtitle}
            </p>
          </div>

          {/* Quick Active Role Indicator */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--gs-bg-card)', padding: '0.4rem 0.85rem', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>{t.activeRole}:</span>
              <span className="gs-badge gs-badge-forest" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                {user.activeRole || user.role}
              </span>
            </div>
          )}
        </div>

        {/* User Session Banner or Guest Notice */}
        {user ? (
          <div className="gs-surface-integrated" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: 'var(--gs-forest-soft)',
                  color: 'var(--gs-forest-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.3rem',
                  border: '1.5px solid var(--gs-forest-muted)',
                }}
              >
                {user.fullName ? user.fullName[0].toUpperCase() : <User size={26} />}
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gs-forest-deep)' }}>
                  {user.fullName || 'Verified Griha Saathi Member'}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)', marginTop: '0.15rem' }}>
                  Registered Contact: <strong>{user.identifier}</strong> &bull; Member since {new Date(user.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {user.isPhoneVerified && <span className="gs-badge gs-badge-verified">Phone Verified</span>}
              {user.isEmailVerified && <span className="gs-badge gs-badge-verified">Email Verified</span>}
              <span className="gs-badge gs-badge-neutral">{user.roles.length} Roles Assigned</span>
            </div>
          </div>
        ) : (
          <div className="gs-compact-safety-strip" style={{ marginBottom: '2rem', justifyContent: 'space-between', flexWrap: 'wrap', padding: '0.85rem 1.25rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#78350F', fontSize: '0.92rem', marginBottom: '0.15rem' }}>
                Guest Explorer Mode Active
              </div>
              <div style={{ fontSize: '0.82rem', color: '#92400E' }}>
                You are previewing role-based layouts. Authenticate to manage your verified properties, active roles, and account security.
              </div>
            </div>
            <button onClick={onOpenAuth} className="gs-btn gs-btn-primary gs-btn-sm" style={{ padding: '0.45rem 0.95rem' }}>
              <Lock size={14} />
              <span>Sign In with PIN / Register</span>
            </button>
          </div>
        )}

        {/* Global Alert Messages */}
        {statusMessage && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--gs-forest-soft)',
              border: '1px solid var(--gs-forest-light)',
              borderRadius: 'var(--gs-radius-md)',
              fontSize: '0.88rem',
              color: 'var(--gs-forest-deep)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <CheckCircle2 size={18} color="var(--gs-status-success)" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--gs-status-error-soft)',
              border: '1px solid #FECACA',
              borderRadius: 'var(--gs-radius-md)',
              fontSize: '0.88rem',
              color: 'var(--gs-status-error)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '2px solid var(--gs-border)',
            marginBottom: '2rem',
            overflowX: 'auto',
            paddingBottom: '0.2rem',
          }}
        >
          {[
            { id: 'overview', label: 'Workspace Overview', icon: <LayoutDashboard size={16} /> },
            { id: 'properties', label: `My Properties (${(ownerSummary?.total || 0) + (ownerSummary?.drafts || 0)})`, icon: <Building size={16} />, visible: ['owner', 'agent', 'builder', 'property_manager'].includes(user?.activeRole || user?.role || selectedRoleView) },
            { id: 'analytics', label: t.analyticsTitle || 'Performance Analytics', icon: <BarChart3 size={16} />, visible: ['owner', 'agent', 'builder', 'property_manager'].includes(user?.activeRole || user?.role || selectedRoleView) },
            { id: 'searches', label: `Saved Searches (${savedSearches.length})`, icon: <Search size={16} /> },
            { id: 'saved', label: `${t.savedPropertiesTitle || 'Saved Properties'} (${savedProperties.length})`, icon: <Bookmark size={16} /> },
            { id: 'notifications', label: unreadNotifCount > 0 ? `Notifications (${unreadNotifCount})` : 'Notifications', icon: <Bell size={16} /> },
            { id: 'reviewer', label: 'Reviewer Workspace', icon: <ShieldCheck size={16} />, visible: ['verifier', 'field_verifier', 'admin'].includes(user?.activeRole || user?.role || '') },
            { id: 'profile', label: t.profileSettings, icon: <User size={16} /> },
            { id: 'roles', label: t.activeRolesTitle, icon: <Layers size={16} /> },
            { id: 'security', label: t.securityCenterTitle, icon: <Shield size={16} /> },
            { id: 'integrations', label: t.liveIntegrationsTitle, icon: <Server size={16} /> },
          ].filter((tab) => tab.visible === undefined || tab.visible).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { clearMessages(); setActiveTab(tab.id as DashboardTab); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: `3px solid ${isActive ? 'var(--gs-forest-primary)' : 'transparent'}`,
                  color: isActive ? 'var(--gs-forest-primary)' : 'var(--gs-text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  marginBottom: -2,
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: WORKSPACE OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* Role Workspace Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>
                Viewing Role: <span style={{ textTransform: 'capitalize' }}>{selectedRoleView.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'var(--gs-bg-card)', padding: '0.35rem', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                {(['tenant', 'owner', 'agent', 'builder', 'property_manager'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRoleView(r)}
                    className={`gs-btn gs-btn-sm ${selectedRoleView === r ? 'gs-btn-primary' : 'gs-btn-outline'}`}
                    style={{ border: 'none', textTransform: 'capitalize', padding: '0.35rem 0.75rem' }}
                  >
                    {r.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Grid */}
            {selectedRoleView === 'tenant' ? (
              <div className="gs-metrics-track" style={{ marginBottom: '2.5rem' }}>
                <div className="gs-metric-cell">
                  <div>
                    <span className="gs-metric-label">Saved Verified Homes</span>
                    <div className="gs-metric-value">{savedProperties.length}</div>
                    <div className="gs-metric-desc">Bookmarked authentic properties.</div>
                  </div>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                    style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                  >
                    View Saved Homes
                  </button>
                </div>

                <div className="gs-metric-cell">
                  <div>
                    <span className="gs-metric-label">Saved Searches & Alerts</span>
                    <div className="gs-metric-value">{savedSearches.length}</div>
                    <div className="gs-metric-desc">Automated match criteria.</div>
                  </div>
                  <button
                    onClick={() => setActiveTab('searches')}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                    style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                  >
                    Manage Searches & Alerts
                  </button>
                </div>

                <div className="gs-metric-cell">
                  <div>
                    <span className="gs-metric-label">Connections & Visits</span>
                    <div className="gs-metric-value" style={{ fontSize: '1.75rem' }}>Active</div>
                    <div className="gs-metric-desc">Direct messaging and inspection visits.</div>
                  </div>
                  <button
                    onClick={() => onNavigate?.('connections')}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                    style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                  >
                    Open Connections
                  </button>
                </div>

                <div className="gs-metric-cell" style={{ backgroundColor: 'rgba(235, 243, 238, 0.92)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gs-forest-primary)', marginBottom: '0.25rem' }}>
                      <Sparkles size={15} />
                      <span className="gs-metric-label" style={{ color: 'var(--gs-forest-primary)', marginBottom: 0 }}>Saathi AI Assistant</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gs-forest-deep)', margin: '0.35rem 0' }}>
                      Property Intelligence
                    </div>
                    <div className="gs-metric-desc" style={{ color: 'var(--gs-text-secondary)' }}>
                      Compare homes, understand rental laws, and verify documentation.
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate?.('saathi-ai')}
                    className="gs-btn gs-btn-primary gs-btn-sm"
                    style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                  >
                    Open Saathi AI
                  </button>
                </div>
              </div>
            ) : (
              /* REAL OWNER METRICS (Phase 5) */
              <div>
                <div className="gs-metrics-track">
                  <div className="gs-metric-cell">
                    <span className="gs-metric-label">{t.metricTotal}</span>
                    <div className="gs-metric-value">{ownerSummary?.total || 0}</div>
                    <div className="gs-metric-desc">Submitted authentic listings.</div>
                  </div>

                  <div className="gs-metric-cell">
                    <span className="gs-metric-label">{t.metricApproved}</span>
                    <div className="gs-metric-value" style={{ color: 'var(--gs-status-success)' }}>{ownerSummary?.approved || 0}</div>
                    <div className="gs-metric-desc">Verified & live on search.</div>
                  </div>

                  <div className="gs-metric-cell">
                    <span className="gs-metric-label">{t.metricUnderReview}</span>
                    <div className="gs-metric-value" style={{ color: 'var(--gs-status-warning)' }}>
                      {(ownerSummary?.underReview || 0) + (ownerSummary?.submitted || 0)}
                    </div>
                    <div className="gs-metric-desc">Pending field/registry audit.</div>
                  </div>

                  <div className="gs-metric-cell">
                    <span className="gs-metric-label">{t.metricCorrectionRequested}</span>
                    <div className="gs-metric-value" style={{ color: (ownerSummary?.correctionRequested || 0) > 0 ? 'var(--gs-status-error)' : 'var(--gs-forest-deep)' }}>
                      {ownerSummary?.correctionRequested || 0}
                    </div>
                    <div className="gs-metric-desc">Action required by submitter.</div>
                  </div>

                  <div className="gs-metric-cell">
                    <span className="gs-metric-label">{t.metricDrafts}</span>
                    <div className="gs-metric-value" style={{ color: 'var(--gs-text-muted)' }}>{ownerSummary?.drafts || 0}</div>
                    <div className="gs-metric-desc">Saved incomplete submissions.</div>
                  </div>
                </div>

                {/* Quick Action Bar for Owners */}
                <div
                  style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: 'var(--gs-forest-soft)',
                    borderRadius: 'var(--gs-radius-lg)',
                    border: '1px solid var(--gs-forest-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    marginBottom: '2.5rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--gs-forest-deep)', fontSize: '1rem', marginBottom: '0.2rem' }}>
                      Authoritative Property Management
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--gs-forest-primary)' }}>
                      Submit genuine rental homes, respond to verification audits, and manage your property portfolio.
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button onClick={() => onNavigate?.('listing-property')} className="gs-btn gs-btn-primary gs-btn-sm">
                      <Plus size={15} />
                      <span>{t.startListingButton}</span>
                    </button>
                    <button onClick={() => setActiveTab('properties')} className="gs-btn gs-btn-outline gs-btn-sm">
                      <Building size={15} />
                      <span>Manage All Listings ({ownerListings.length + ownerDrafts.length})</span>
                    </button>
                  </div>
                </div>

                {/* Recent Status Updates */}
                {ownerListings.length > 0 && (
                  <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', marginBottom: '1rem' }}>
                      Recent Listing Status Updates
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {ownerListings.slice(0, 3).map((prop) => (
                        <div
                          key={prop.id}
                          style={{
                            padding: '1rem 1.25rem',
                            backgroundColor: 'var(--gs-bg-card)',
                            border: '1px solid var(--gs-border)',
                            borderRadius: 'var(--gs-radius-md)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gs-text-primary)' }}>
                              {prop.title}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>
                              {prop.locality}, {prop.city}, {prop.state} • ₹{prop.rentPerMonth?.toLocaleString('en-IN')}/mo
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {renderSubmissionBadge(prop.submissionStatus)}
                            {prop.submissionStatus === 'correction_requested' && (
                              <button
                                onClick={() => setCorrectionTarget(prop)}
                                className="gs-btn gs-btn-primary gs-btn-sm"
                                style={{ backgroundColor: 'var(--gs-status-error)', borderColor: 'var(--gs-status-error)' }}
                              >
                                {t.actionRespondCorrection}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: MY PROPERTIES & DRAFTS (Phase 5) */}
        {activeTab === 'properties' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.ownerWorkspaceTitle}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)' }}>
                  {t.ownerWorkspaceSubtitle}
                </p>
              </div>
              <button onClick={() => onNavigate?.('listing-property')} className="gs-btn gs-btn-primary gs-btn-sm">
                <Plus size={15} />
                <span>{t.startListingButton}</span>
              </button>
            </div>

            {/* Filter Chips */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
              {[
                { id: 'all', label: `All (${ownerListings.length + ownerDrafts.length})` },
                { id: 'approved', label: `Live & Verified (${ownerSummary?.approved || 0})` },
                { id: 'review', label: `Under Review (${(ownerSummary?.underReview || 0) + (ownerSummary?.submitted || 0)})` },
                { id: 'correction', label: `Action Required (${ownerSummary?.correctionRequested || 0})` },
                { id: 'suspended', label: `Suspended (${ownerSummary?.suspended || 0})` },
                { id: 'drafts', label: `Drafts (${ownerSummary?.drafts || 0})` },
                { id: 'withdrawn', label: `Withdrawn (${ownerSummary?.withdrawn || 0})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPropertyFilter(f.id as any)}
                  className={`gs-btn gs-btn-sm ${propertyFilter === f.id ? 'gs-btn-primary' : 'gs-btn-outline'}`}
                  style={{ borderRadius: 'var(--gs-radius-full)', padding: '0.35rem 0.85rem' }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {ownerLoading ? (
              <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--gs-text-muted)' }}>Loading real listing records...</p>
              </div>
            ) : ownerListings.length === 0 && ownerDrafts.length === 0 ? (
              /* Useful Empty State */
              <div className="gs-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: 'var(--gs-forest-soft)',
                    color: 'var(--gs-forest-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}
                >
                  <Building size={28} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                  {t.emptyOwnerTitle}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--gs-text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                  {t.emptyOwnerDesc}
                </p>
                <button onClick={() => onNavigate?.('listing-property')} className="gs-btn gs-btn-primary">
                  <Plus size={16} />
                  <span>{t.startListingButton}</span>
                </button>
              </div>
            ) : (
              /* Real Listings & Drafts List */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* 1. DRAFTS */}
                {(propertyFilter === 'all' || propertyFilter === 'drafts') &&
                  ownerDrafts.map((draft) => (
                    <div
                      key={draft.id}
                      className="gs-card"
                      style={{
                        padding: '1.25rem 1.5rem',
                        borderLeft: '4px solid var(--gs-text-muted)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                          <span className="gs-badge" style={{ backgroundColor: 'var(--gs-bg-subtle)', color: 'var(--gs-text-muted)' }}>
                            Draft (Step {draft.currentStep} of 7)
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-light)' }}>
                            Saved on {new Date(draft.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', color: 'var(--gs-forest-deep)', marginBottom: '0.2rem' }}>
                          {draft.data?.title || `${draft.data?.propertyType?.toUpperCase() || 'Property'} in ${draft.data?.locality || draft.data?.city || 'Draft'}`}
                        </h4>
                        <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>
                          {draft.data?.city || 'Location pending'} • Rent: {draft.data?.rentPerMonth ? `₹${draft.data.rentPerMonth}` : 'Not set'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button
                          onClick={() => onNavigate?.('listing-property')}
                          className="gs-btn gs-btn-primary gs-btn-sm"
                        >
                          {t.actionResumeDraft}
                        </button>
                        <button
                          onClick={() => handleDeleteOwnerDraft(draft.id)}
                          className="gs-btn gs-btn-outline gs-btn-sm"
                          style={{ color: 'var(--gs-status-error)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}

                {/* 2. SUBMITTED LISTINGS */}
                {ownerListings
                  .filter((p) => {
                    if (propertyFilter === 'approved') return p.submissionStatus === 'approved';
                    if (propertyFilter === 'review') return p.submissionStatus === 'under_review' || p.submissionStatus === 'submitted' || p.submissionStatus === 'resubmitted';
                    if (propertyFilter === 'correction') return p.submissionStatus === 'correction_requested' || p.submissionStatus === 'additional_information_required';
                    if (propertyFilter === 'suspended') return p.submissionStatus === 'suspended' || p.submissionStatus === 'rejected';
                    if (propertyFilter === 'withdrawn') return p.submissionStatus === 'withdrawn';
                    if (propertyFilter === 'drafts') return false;
                    return true;
                  })
                  .map((prop) => (
                    <div
                      key={prop.id}
                      className="gs-card"
                      style={{
                        padding: '1.5rem',
                        borderLeft: `4px solid ${
                          prop.submissionStatus === 'approved'
                            ? 'var(--gs-status-success)'
                            : prop.submissionStatus === 'correction_requested' || prop.submissionStatus === 'additional_information_required'
                            ? 'var(--gs-status-warning)'
                            : prop.submissionStatus === 'suspended' || prop.submissionStatus === 'rejected'
                            ? 'var(--gs-status-error)'
                            : prop.submissionStatus === 'withdrawn'
                            ? 'var(--gs-border)'
                            : 'var(--gs-status-warning)'
                        }`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                            {renderSubmissionBadge(prop.submissionStatus)}
                            <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-light)' }}>
                              ID: {prop.id} • Updated {new Date(prop.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', marginBottom: '0.25rem' }}>
                            {prop.title}
                          </h4>
                          <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-secondary)' }}>
                            <MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                            {prop.addressDetails ? `${prop.addressDetails}, ` : ''}{prop.locality}, {prop.city}, {prop.state} - {prop.pincode}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--gs-forest-primary)' }}>
                            ₹{prop.rentPerMonth?.toLocaleString('en-IN')}<span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--gs-text-muted)' }}>/mo</span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                            Deposit: ₹{prop.securityDeposit?.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      {/* Specs Row */}
                      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--gs-text-muted)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gs-border)' }}>
                        <div><strong>Type:</strong> {prop.propertyType?.toUpperCase()}</div>
                        <div><strong>Bedrooms:</strong> {prop.bedrooms || 1}</div>
                        <div><strong>Bathrooms:</strong> {prop.bathrooms || 1}</div>
                        <div><strong>Area:</strong> {prop.areaSqFt} sq ft</div>
                        <div><strong>Available From:</strong> {prop.availableFrom}</div>
                        <div><strong>Freshness:</strong> {prop.isAvailabilityConfirmed ? 'Confirmed Fresh' : 'Reconfirmation Due'}</div>
                      </div>

                      {/* Correction Notes Alert Box if Action Required */}
                      {(prop.submissionStatus === 'correction_requested' || prop.submissionStatus === 'additional_information_required') && (
                        <div
                          style={{
                            padding: '0.85rem 1.15rem',
                            backgroundColor: 'var(--gs-status-error-soft)',
                            border: '1px solid #FECACA',
                            borderRadius: 'var(--gs-radius-md)',
                            marginBottom: '1rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--gs-status-error)', marginBottom: '0.2rem' }}>
                            Verifier Correction Request:
                          </div>
                          <div style={{ fontSize: '0.86rem', color: 'var(--gs-text-primary)', marginBottom: '0.6rem' }}>
                            {prop.correctionNotes || 'Please provide updated document details.'}
                          </div>
                          <button
                            onClick={() => { setCorrectionTarget(prop); setCorrectionResponseNotes(''); }}
                            className="gs-btn gs-btn-primary gs-btn-sm"
                            style={{ backgroundColor: 'var(--gs-status-error)', borderColor: 'var(--gs-status-error)' }}
                          >
                            {t.actionRespondCorrection}
                          </button>
                        </div>
                      )}

                      {/* Rejection / Suspension Notice Box */}
                      {(prop.submissionStatus === 'rejected' || prop.submissionStatus === 'suspended') && (
                        <div
                          style={{
                            padding: '0.85rem 1.15rem',
                            backgroundColor: '#FEE2E2',
                            border: '1px solid #FCA5A5',
                            borderRadius: 'var(--gs-radius-md)',
                            marginBottom: '1rem',
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#991B1B', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ShieldAlert size={16} />
                            <span>{prop.submissionStatus === 'suspended' ? 'Listing Suspended from Public Search' : 'Verification Rejected'}</span>
                          </div>
                          <div style={{ fontSize: '0.86rem', color: '#7F1D1D', marginBottom: '0.6rem' }}>
                            {prop.correctionNotes || 'This listing failed verification requirements or safety checks. You may lodge an appeal with supporting proof.'}
                          </div>
                          <button
                            onClick={() => { setAppealTarget(prop); setAppealReason(''); }}
                            className="gs-btn gs-btn-primary gs-btn-sm"
                            style={{ backgroundColor: '#991B1B', borderColor: '#991B1B' }}
                          >
                            <FileText size={13} />
                            <span>Appeal Decision</span>
                          </button>
                        </div>
                      )}

                      {/* Action Controls */}
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          onClick={() => handleOpenChecklistModal(prop)}
                          className="gs-btn gs-btn-outline gs-btn-sm"
                          title="View Verification Checklist & Trust Audit"
                        >
                          <ShieldCheck size={14} />
                          <span>Trust Checklist</span>
                        </button>

                        {prop.submissionStatus === 'approved' && (
                          <>
                            <button
                              onClick={() => handleReconfirmAvailability(prop.id)}
                              className="gs-btn gs-btn-outline gs-btn-sm"
                              title="Reconfirm that property remains available"
                            >
                              <RefreshCw size={14} />
                              <span>{t.actionReconfirm}</span>
                            </button>
                            <button
                              onClick={() => handleWithdrawProperty(prop.id)}
                              className="gs-btn gs-btn-outline gs-btn-sm"
                              style={{ color: 'var(--gs-status-warning)' }}
                              title="Remove from public search"
                            >
                              <span>{t.actionWithdraw}</span>
                            </button>
                          </>
                        )}

                        {prop.submissionStatus === 'withdrawn' && (
                          <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)', display: 'flex', alignItems: 'center' }}>
                            Withdrawn from public discovery.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: IN-APP NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <NotificationsPanel
            token={token}
            language={language}
            onNavigateToProperty={(_propId) => {
              setActiveTab('properties');
            }}
            onNavigateToConnections={(_connId) => {
              onNavigate?.('connections');
            }}
            onNavigateToVisits={() => {
              onNavigate?.('connections');
            }}
            onNavigateToSearches={() => {
              setActiveTab('searches');
            }}
          />
        )}

        {/* TAB: REVIEWER WORKSPACE (Phase 6) */}
        {activeTab === 'reviewer' && (
          <ReviewerWorkspace
            user={user}
            token={token}
            language={language}
          />
        )}

        {/* TAB: SAVED SEARCHES & SEARCH ALERTS (Phase 9) */}
        {activeTab === 'searches' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Search size={22} color="var(--gs-forest-primary)" />
                  <span>{t.savedSearchesTitle || 'Saved Searches & Real-Time Alerts'}</span>
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', maxWidth: 680 }}>
                  {t.savedSearchesSubtitle || 'Your authentic criteria for genuine rental properties. Alerts are dispatched only when fresh, verified listings match your parameters.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleCheckSavedSearchAlerts}
                  disabled={searchesLoading || savedSearches.length === 0}
                  className="gs-btn gs-btn-primary gs-btn-sm"
                  title="Check verified listings against your saved searches"
                >
                  <RefreshCw size={14} className={searchesLoading ? 'animate-spin' : ''} />
                  <span>{t.checkNewMatchesButton || 'Check for New Matches'}</span>
                </button>
                <button
                  onClick={() => onNavigate?.('find-property')}
                  className="gs-btn gs-btn-outline gs-btn-sm"
                >
                  <Plus size={14} />
                  <span>Find & Save New Search</span>
                </button>
              </div>
            </div>

            {searchesLoading && savedSearches.length === 0 ? (
              <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--gs-text-muted)' }}>Retrieving your saved searches...</p>
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="gs-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'var(--gs-forest-soft)', color: 'var(--gs-forest-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Search size={26} />
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--gs-forest-deep)', marginBottom: '0.4rem' }}>
                  {t.noSavedSearchesTitle || 'No Saved Searches Configured'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-muted)', maxWidth: 480, margin: '0 auto 1.5rem' }}>
                  {t.noSavedSearchesDesc || 'Save your property search criteria from the Find Property page to receive instant alerts when verified properties become available.'}
                </p>
                <button
                  onClick={() => onNavigate?.('find-property')}
                  className="gs-btn gs-btn-primary gs-btn-sm"
                >
                  Browse Verified Listings
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {savedSearches.map((s) => (
                  <div key={s.id} className="gs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', color: 'var(--gs-forest-deep)', marginBottom: '0.2rem' }}>
                            {s.name}
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>
                            Saved on {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="gs-badge gs-badge-forest" style={{ fontSize: '0.74rem' }}>
                          {s.matchedCount ?? 0} Real Matches
                        </span>
                      </div>

                      {/* Filter badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                        {s.filters.state && s.filters.state !== 'all' && (
                          <span className="gs-badge gs-badge-neutral">{s.filters.state}</span>
                        )}
                        {s.filters.city && (
                          <span className="gs-badge gs-badge-neutral">{s.filters.city}</span>
                        )}
                        {s.filters.locality && (
                          <span className="gs-badge gs-badge-neutral">{s.filters.locality}</span>
                        )}
                        {s.filters.propertyType && s.filters.propertyType !== 'all' && (
                          <span className="gs-badge gs-badge-neutral">{s.filters.propertyType.toUpperCase()}</span>
                        )}
                        {s.filters.bedrooms && (
                          <span className="gs-badge gs-badge-neutral">{s.filters.bedrooms} BHK</span>
                        )}
                        {(s.filters.minRent !== undefined || s.filters.maxRent !== undefined) && (
                          <span className="gs-badge gs-badge-neutral">
                            ₹{s.filters.minRent?.toLocaleString('en-IN') || '0'} - ₹{s.filters.maxRent?.toLocaleString('en-IN') || 'Any'}
                          </span>
                        )}
                        {s.filters.furnishing && s.filters.furnishing !== 'any' && (
                          <span className="gs-badge gs-badge-neutral">{s.filters.furnishing.replace('_', ' ')}</span>
                        )}
                        {s.filters.onlyVerified && (
                          <span className="gs-badge gs-badge-verified">Verified Only</span>
                        )}
                      </div>

                      {/* Alert Frequency Selector */}
                      <div style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', backgroundColor: 'var(--gs-bg-subtle)', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                            {t.alertFrequencyLabel || 'Alert Frequency'}:
                          </span>
                          <select
                            value={s.alertFrequency}
                            onChange={(e) => handleUpdateAlertFrequency(s.id, e.target.value as any)}
                            style={{ fontSize: '0.78rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)' }}
                          >
                            <option value="instant">Instant Real-Time</option>
                            <option value="daily">Daily Digest</option>
                            <option value="weekly">Weekly Digest</option>
                            <option value="none">Disabled (No Alerts)</option>
                          </select>
                        </div>
                        {s.lastAlertSentAt && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginTop: '0.35rem' }}>
                            Last alert: {new Date(s.lastAlertSentAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--gs-border-subtle)' }}>
                      <button
                        onClick={() => onNavigate?.('find-property')}
                        className="gs-btn gs-btn-outline gs-btn-sm"
                      >
                        <Search size={13} />
                        <span>Search Listings</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSavedSearch(s.id)}
                        className="gs-btn gs-btn-sm"
                        style={{ color: 'var(--gs-status-error)', fontSize: '0.82rem', padding: '0.3rem 0.6rem' }}
                        title="Delete saved search"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: REAL PERFORMANCE ANALYTICS (Phase 9) */}
        {activeTab === 'analytics' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={22} color="var(--gs-forest-primary)" />
                  <span>{t.analyticsTitle || 'Listing Performance & Genuine Engagement'}</span>
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', maxWidth: 680 }}>
                  {t.analyticsSubtitle || 'Direct database analytics computed from authentic tenant views, verified connection inquiries, and completed property visits. No synthetic traffic.'}
                </p>
              </div>

              <button
                onClick={fetchAnalytics}
                disabled={analyticsLoading}
                className="gs-btn gs-btn-outline gs-btn-sm"
                title="Refresh analytics data"
              >
                <RefreshCw size={14} className={analyticsLoading ? 'animate-spin' : ''} />
                <span>Refresh Metrics</span>
              </button>
            </div>

            {/* Core Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="gs-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--gs-text-muted)' }}>
                  <Eye size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t.metricGenuineViews || 'Genuine Views'}
                  </span>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--gs-forest-deep)', margin: '0.25rem 0' }}>
                  {analyticsData?.totalGenuineViews ?? 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                  Authentic views tracked via unique sessions. Bot hits excluded.
                </div>
              </div>

              <div className="gs-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--gs-text-muted)' }}>
                  <MessageSquare size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t.metricInquiries || 'Direct Inquiries'}
                  </span>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--gs-forest-deep)', margin: '0.25rem 0' }}>
                  {analyticsData?.totalInquiries ?? 0}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                  Real connection requests from verified property seekers.
                </div>
              </div>

              <div className="gs-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--gs-text-muted)' }}>
                  <Calendar size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    {t.metricConfirmedVisits || 'Confirmed Visits'}
                  </span>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--gs-status-success)', margin: '0.25rem 0' }}>
                  {analyticsData?.confirmedVisitsCount ?? 0}
                  <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--gs-text-muted)', marginLeft: '0.35rem' }}>
                    / {analyticsData?.totalVisitRequests ?? 0} requests
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                  Physical inspection appointments confirmed with seekers.
                </div>
              </div>

              <div className="gs-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: 'var(--gs-text-muted)' }}>
                  <Building size={16} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Live Approved Listings
                  </span>
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--gs-forest-deep)', margin: '0.25rem 0' }}>
                  {analyticsData?.activeApprovedListings ?? 0}
                  <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--gs-text-muted)', marginLeft: '0.35rem' }}>
                    / {analyticsData?.totalListings ?? 0} total
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                  Approved properties currently discoverable on platform.
                </div>
              </div>
            </div>

            {/* Verification Status Breakdown Card */}
            {analyticsData && (
              <div className="gs-card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--gs-forest-deep)', marginBottom: '1rem' }}>
                  Authoritative Verification Breakdown
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--gs-forest-soft)', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-forest-muted)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>Authoritative Verified</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gs-forest-primary)', margin: '0.2rem 0' }}>
                      {analyticsData.verificationStatusBreakdown.authoritative_verified}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>Dual Registry & Field Verified</div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>Physical Inspected</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gs-forest-deep)', margin: '0.2rem 0' }}>
                      {analyticsData.verificationStatusBreakdown.physically_inspected}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>On-site Inspection Completed</div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>Document Verified</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gs-forest-deep)', margin: '0.2rem 0' }}>
                      {analyticsData.verificationStatusBreakdown.document_verified}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>Title & Revenue Deeds Reviewed</div>
                  </div>

                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>Unverified / Pending</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gs-text-muted)', margin: '0.2rem 0' }}>
                      {analyticsData.verificationStatusBreakdown.unverified}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>Awaiting verification protocol</div>
                  </div>
                </div>
              </div>
            )}

            {/* Honest Data Disclaimer Callout */}
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--gs-forest-soft)', border: '1px solid var(--gs-forest-muted)', borderRadius: 'var(--gs-radius-md)', display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
              <ShieldCheck size={24} color="var(--gs-forest-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: '0.92rem', color: 'var(--gs-forest-deep)' }}>
                  {t.analyticsDisclaimerTitle || 'Auditable Data Integrity'}
                </strong>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--gs-text-secondary)', lineHeight: 1.45 }}>
                  {analyticsData?.metricsDisclaimer || t.analyticsDisclaimerNote || 'Griha Saathi never fabricates page impressions, visitor trends, or conversion scores. Metrics strictly reflect genuine recorded database events.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SAVED PROPERTIES */}
        {activeTab === 'saved' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.savedPropertiesTitle}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)' }}>
                  {t.savedPropertiesSubtitle}
                </p>
              </div>

              {selectedSavedPropertyIds.length > 0 && (
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="gs-btn gs-btn-primary gs-btn-sm"
                >
                  <Scale size={14} />
                  <span>{t.compareSelectedButton || 'Compare Selected Properties'} ({selectedSavedPropertyIds.length})</span>
                </button>
              )}
            </div>

            {!user ? (
              <div className="gs-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <Lock size={36} color="var(--gs-forest-mid)" style={{ margin: '0 auto 0.75rem' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Sign In Required</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--gs-text-muted)', marginBottom: '1.25rem' }}>
                  Please authenticate with your PIN to view your saved property listings.
                </p>
                <button onClick={onOpenAuth} className="gs-btn gs-btn-primary gs-btn-sm">
                  Sign In / Register
                </button>
              </div>
            ) : savedLoading ? (
              <div style={{ padding: '3rem 0', textAlign: 'center' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: '3px solid var(--gs-forest-soft)',
                    borderTopColor: 'var(--gs-forest-primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    margin: '0 auto 1rem',
                  }}
                />
                <p style={{ fontSize: '0.9rem', color: 'var(--gs-text-muted)' }}>Loading saved properties...</p>
              </div>
            ) : savedProperties.length === 0 ? (
              <div className="gs-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    backgroundColor: 'var(--gs-forest-soft)',
                    color: 'var(--gs-forest-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                  }}
                >
                  <Bookmark size={24} />
                </div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                  {t.noSavedPropertiesTitle}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--gs-text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                  {t.noSavedPropertiesDesc}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {savedProperties.map((item) => {
                  const prop = item.property;
                  const isDeletedOrUnavailable = !prop;

                  return (
                    <div key={item.record.id} className="gs-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      {isDeletedOrUnavailable ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gs-status-warning)', marginBottom: '0.5rem' }}>
                            <AlertCircle size={16} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Listing Unavailable</span>
                          </div>
                          <h4 style={{ fontSize: '1.05rem', color: 'var(--gs-text-muted)', marginBottom: '0.5rem' }}>
                            Property Record (ID: {item.record.propertyId})
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)', marginBottom: '1rem' }}>
                            This listing is no longer active in authoritative discovery or has been unlisted by the verified owner. Retained transparently.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', cursor: 'pointer', marginBottom: '0.4rem', color: 'var(--gs-forest-deep)', fontWeight: 600 }}>
                            <input
                              type="checkbox"
                              checked={selectedSavedPropertyIds.includes(prop.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (selectedSavedPropertyIds.length >= 3) {
                                    alert('You can compare up to 3 properties at a time.');
                                    return;
                                  }
                                  setSelectedSavedPropertyIds([...selectedSavedPropertyIds, prop.id]);
                                } else {
                                  setSelectedSavedPropertyIds(selectedSavedPropertyIds.filter(id => id !== prop.id));
                                }
                              }}
                            />
                            <span>Select for Comparison</span>
                          </label>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <span className={`gs-badge ${prop.verificationStatus === 'authoritative_verified' ? 'gs-badge-verified' : 'gs-badge-warning'}`}>
                                <ShieldCheck size={13} />
                                <span>{prop.verificationStatus.replace('_', ' ').toUpperCase()}</span>
                              </span>
                              {prop.isAvailabilityConfirmed !== false ? (
                                <span className="gs-badge gs-badge-emerald">
                                  <CheckCircle2 size={12} />
                                  <span>Confirmed Live</span>
                                </span>
                              ) : (
                                <span className="gs-badge gs-badge-warning">
                                  <Clock size={12} />
                                  <span>Reconfirmation Due</span>
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--gs-forest-deep)' }}>
                              ₹{prop.rentPerMonth.toLocaleString('en-IN')}<span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--gs-text-muted)' }}>/mo</span>
                            </span>
                          </div>

                          <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>{prop.title}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gs-text-muted)', fontSize: '0.85rem', marginBottom: '0.85rem' }}>
                            <MapPin size={15} color="var(--gs-forest-mid)" />
                            <span>{prop.locality}, {prop.city}, {prop.state}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.85rem', fontSize: '0.78rem' }}>
                            <span className="gs-badge gs-badge-neutral">{prop.propertyType.toUpperCase()}</span>
                            {prop.bedrooms && <span className="gs-badge gs-badge-neutral">{prop.bedrooms} BHK</span>}
                            <span className="gs-badge gs-badge-neutral">{prop.furnishing.replace('_', ' ')}</span>
                          </div>
                        </div>
                      )}

                      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--gs-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)' }}>
                          {t.savedOn} {new Date(item.record.savedAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleUnsaveProperty(item.record.propertyId)}
                          className="gs-btn gs-btn-sm"
                          style={{ color: 'var(--gs-status-error)', fontSize: '0.82rem', padding: '0.3rem 0.6rem' }}
                        >
                          <Trash2 size={13} />
                          <span>{t.unsaveButton}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROFILE & PREFERENCES */}
        {activeTab === 'profile' && (
          <div style={{ maxWidth: 680 }}>
            <div className="gs-card">
              <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                {t.profileSettings}
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--gs-text-muted)', marginBottom: '1.5rem' }}>
                Update your personal information, preferred language, and notification settings.
              </p>

              {!user ? (
                <p style={{ color: 'var(--gs-text-muted)' }}>Please sign in to update your profile.</p>
              ) : (
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Profile Photo Widget */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem', backgroundColor: 'var(--gs-forest-soft)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-forest-muted)' }}>
                    <div style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--gs-forest-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, overflow: 'hidden' }}>
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName || 'User Avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        user.fullName ? user.fullName[0].toUpperCase() : <User size={30} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--gs-forest-deep)', marginBottom: '0.2rem' }}>
                        {t.uploadProfilePhoto || 'Profile Photo'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)', marginBottom: '0.5rem' }}>
                        Upload an authentic JPEG, PNG, or WebP photograph (max 5MB).
                      </div>
                      <label className="gs-btn gs-btn-outline gs-btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Camera size={14} />
                        <span>{photoUploading ? 'Uploading...' : (user.avatarUrl ? t.changeProfilePhoto || 'Change Photo' : t.uploadProfilePhoto || 'Upload Photo')}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProfilePhotoUpload}
                          disabled={photoUploading}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="gs-form-field">
                    <label className="gs-form-label">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>
                      Displayed only on authorized interactions (connection requests and verified lease agreements).
                    </span>
                  </div>

                  <div className="gs-form-field">
                    <label className="gs-form-label">Preferred Platform Language</label>
                    <select
                      value={preferredLang}
                      onChange={(e) => setPreferredLang(e.target.value as SupportedLanguage)}
                    >
                      <option value="en">English (Standard)</option>
                      <option value="hi">हिंदी (Hindi)</option>
                      <option value="hi-en">Hinglish (Conversational)</option>
                    </select>
                  </div>

                  {/* Notification Toggles */}
                  <div className="gs-form-field">
                    <label className="gs-form-label">{t.notificationSettingsTitle}</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.35rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={emailAlerts}
                          onChange={(e) => setEmailAlerts(e.target.checked)}
                        />
                        <span>Transactional Email Notifications (Verifications & Inquiries)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={smsAlerts}
                          onChange={(e) => setSmsAlerts(e.target.checked)}
                        />
                        <span>SMS Security Alerts (Login notices & sensitive actions)</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={propertyInquiries}
                          onChange={(e) => setPropertyInquiries(e.target.checked)}
                        />
                        <span>Property Connection & Inspection Requests</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={securityAlerts}
                          onChange={(e) => setSecurityAlerts(e.target.checked)}
                        />
                        <span>Security & Account Audit Notifications</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={savedSearchAlerts}
                          onChange={(e) => setSavedSearchAlerts(e.target.checked)}
                        />
                        <span>Saved Search Match Alerts (Instant notification when newly verified listings match your criteria)</span>
                      </label>
                    </div>
                  </div>

                  {/* Contact Info & Re-verify Trigger */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--gs-bg-subtle)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gs-forest-deep)', marginBottom: '0.4rem' }}>
                      {t.contactVerificationTitle}
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-secondary)', marginBottom: '0.5rem' }}>
                      Primary Identifier: <strong>{user.identifier}</strong> (Protected by DPDP-compliant masking).
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <span className={`gs-badge ${user.isPhoneVerified ? 'gs-badge-verified' : 'gs-badge-warning'}`}>
                        {user.isPhoneVerified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        <span>Phone: {user.isPhoneVerified ? 'Verified' : 'Unverified'}</span>
                      </span>
                      <span className={`gs-badge ${user.isEmailVerified ? 'gs-badge-verified' : 'gs-badge-warning'}`}>
                        {user.isEmailVerified ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        <span>Email: {user.isEmailVerified ? 'Verified' : 'Unverified'}</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowContactModal(true); setContactStep('input'); }}
                      className="gs-btn gs-btn-outline gs-btn-sm"
                    >
                      {t.updateContactButton}
                    </button>
                  </div>

                  <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ alignSelf: 'flex-start' }}>
                    {loading ? 'Saving Changes...' : t.saveChangesButton}
                  </button>

                  {/* Account Safeguards & Deactivation */}
                  <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #FCA5A5' }}>
                    <div style={{ padding: '1.25rem', backgroundColor: '#FEF2F2', borderRadius: 'var(--gs-radius-md)', border: '1px solid #FECACA' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <ShieldAlert size={18} color="var(--gs-status-error)" />
                        <h3 style={{ fontSize: '1rem', color: '#991B1B', margin: 0 }}>
                          {t.deactivateAccountTitle || 'Account Safeguards & Deactivation'}
                        </h3>
                      </div>
                      <p style={{ fontSize: '0.84rem', color: '#7F1D1D', marginBottom: '1rem', lineHeight: 1.45 }}>
                        {t.deactivateAccountDesc || 'Temporarily deactivate your account or permanently delete your records. All active listings are immediately withdrawn from discovery, and all sessions revoked.'}
                      </p>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => { setDeactivateAction('deactivate'); setShowDeactivateModal(true); }}
                          className="gs-btn gs-btn-sm"
                          style={{ backgroundColor: '#EF4444', color: '#FFFFFF', border: 'none' }}
                        >
                          {t.deactivateButton || 'Deactivate Account'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setDeactivateAction('delete'); setShowDeactivateModal(true); }}
                          className="gs-btn gs-btn-sm"
                          style={{ backgroundColor: '#7F1D1D', color: '#FFFFFF', border: 'none' }}
                        >
                          {t.deleteAccountButton || 'Delete Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MULTI-ROLE MANAGEMENT */}
        {activeTab === 'roles' && (
          <div style={{ maxWidth: 720 }}>
            <div className="gs-card">
              <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                {t.activeRolesTitle}
              </h2>
              <p style={{ fontSize: '0.86rem', color: 'var(--gs-text-muted)', marginBottom: '1.5rem' }}>
                One Griha Saathi account supports multiple roles. Seamlessly switch your active role or attach new roles below.
              </p>

              {!user ? (
                <p style={{ color: 'var(--gs-text-muted)' }}>Please sign in to view and manage account roles.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Currently Held Roles */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--gs-forest-deep)', marginBottom: '0.75rem' }}>
                      Roles Held by Your Account:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {userRoles.map((role) => {
                        const isActive = user.activeRole === role || user.role === role;
                        return (
                          <div
                            key={role}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.85rem 1.25rem',
                              borderRadius: 'var(--gs-radius-md)',
                              backgroundColor: isActive ? 'var(--gs-forest-soft)' : 'var(--gs-bg-card)',
                              border: `1px solid ${isActive ? 'var(--gs-forest-light)' : 'var(--gs-border)'}`,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <Layers size={18} color="var(--gs-forest-mid)" />
                              <div>
                                <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--gs-forest-deep)' }}>
                                  {role.replace('_', ' ')}
                                </span>
                                {isActive && (
                                  <span className="gs-badge gs-badge-forest" style={{ marginLeft: '0.6rem', fontSize: '0.7rem' }}>
                                    Active Now
                                  </span>
                                )}
                              </div>
                            </div>

                            {!isActive && (
                              <button
                                onClick={() => handleSwitchActiveRole(role)}
                                disabled={loading}
                                className="gs-btn gs-btn-outline gs-btn-sm"
                              >
                                {t.switchRoleButton}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add New Role */}
                  {availableRolesToAdd.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--gs-border)' }}>
                      <h3 style={{ fontSize: '1rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                        Add Additional Role to Account:
                      </h3>
                      <p style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)', marginBottom: '1rem' }}>
                        Self-assignable roles for landlords, agents, builders, and property managers.
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {availableRolesToAdd.map((r) => (
                          <button
                            key={r}
                            onClick={() => handleAddRole(r)}
                            disabled={loading}
                            className="gs-btn gs-btn-outline gs-btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', textTransform: 'capitalize' }}
                          >
                            <Plus size={14} />
                            <span>Add {r.replace('_', ' ')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY CENTER & PIN */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 760 }}>
            {/* Change 4-Digit Security PIN */}
            <div className="gs-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: 'var(--gs-forest-deep)' }}>
                <Key size={20} />
                <h2 style={{ fontSize: '1.35rem' }}>{t.changePinTitle}</h2>
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--gs-text-muted)', marginBottom: '1.25rem' }}>
                Update your secret 4-digit security PIN. Never share this PIN with anyone.
              </p>

              {!user ? (
                <p style={{ color: 'var(--gs-text-muted)' }}>Please sign in to manage security settings.</p>
              ) : (
                <form onSubmit={handleChangePin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 360 }}>
                  <div className="gs-form-field">
                    <label className="gs-form-label">{t.currentPinLabel}</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                      required
                      style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.2rem' }}
                    />
                  </div>

                  <div className="gs-form-field">
                    <label className="gs-form-label">{t.newPinLabel}</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      required
                      style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.2rem' }}
                    />
                  </div>

                  <div className="gs-form-field">
                    <label className="gs-form-label">Confirm New PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                      required
                      style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.2rem' }}
                    />
                  </div>

                  <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ marginTop: '0.5rem' }}>
                    {loading ? 'Updating PIN...' : t.changePinButton}
                  </button>
                </form>
              )}
            </div>

            {/* Active Device Sessions */}
            {user && (
              <div className="gs-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--gs-forest-deep)' }}>
                    <Laptop size={20} />
                    <h2 style={{ fontSize: '1.25rem' }}>{t.activeSessionsTitle}</h2>
                  </div>
                  <button
                    onClick={handleRevokeSessions}
                    disabled={loading}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                  >
                    {t.revokeAllSessions}
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {sessions.map((sess, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: sess.isCurrent ? 'var(--gs-forest-soft)' : 'var(--gs-bg-subtle)',
                        borderRadius: 'var(--gs-radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div>
                        <strong>Token: {sess.tokenPreview}</strong>
                        {sess.isCurrent && (
                          <span className="gs-badge gs-badge-forest" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                            Current Device
                          </span>
                        )}
                        <div style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)', marginTop: '0.15rem' }}>
                          Created: {new Date(sess.createdAt).toLocaleString()} &bull; Expires: {new Date(sess.expiresAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tamper-Resistant Security Audit Trail */}
            {user && (
              <div className="gs-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', color: 'var(--gs-forest-deep)' }}>
                  <History size={20} />
                  <h2 style={{ fontSize: '1.25rem' }}>{t.auditLogsTitle}</h2>
                </div>

                {auditLogs.length === 0 ? (
                  <p style={{ fontSize: '0.86rem', color: 'var(--gs-text-muted)' }}>No audit events recorded yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--gs-border)', color: 'var(--gs-forest-deep)' }}>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Event Action</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Details</th>
                          <th style={{ padding: '0.5rem 0.75rem' }}>Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--gs-border-subtle)' }}>
                            <td style={{ padding: '0.65rem 0.75rem', fontWeight: 600, color: 'var(--gs-forest-deep)' }}>
                              {log.action}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: 'var(--gs-text-secondary)' }}>
                              {log.details}
                            </td>
                            <td style={{ padding: '0.65rem 0.75rem', color: 'var(--gs-text-muted)', fontSize: '0.78rem' }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: SYSTEM INTEGRATIONS */}
        {activeTab === 'integrations' && (
          <div className="gs-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: 'var(--gs-forest-deep)' }}>
              <Server size={20} />
              <h2 style={{ fontSize: '1.3rem' }}>{t.liveIntegrationsTitle}</h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-muted)', marginBottom: '1.5rem' }}>
              {t.unconfiguredNotice}
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gs-border)', color: 'var(--gs-forest-deep)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Provider / Authority</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Jurisdiction</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Required Credentials (.env)</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((prov) => (
                    <tr key={prov.id} style={{ borderBottom: '1px solid var(--gs-border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{prov.name}</td>
                      <td style={{ padding: '0.85rem 1rem', textTransform: 'capitalize', color: 'var(--gs-text-secondary)' }}>
                        {prov.category.replace('_', ' ')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--gs-text-secondary)' }}>
                        {prov.targetRegions.join(', ')}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`gs-badge ${prov.configured ? 'gs-badge-verified' : 'gs-badge-neutral'}`}>
                          {prov.configured ? 'Configured' : 'Awaiting Production Keys'}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--gs-font-mono)', fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                        {prov.requiredCredentials.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Contact Re-Verification */}
        {showContactModal && (
          <div className="gs-modal-backdrop" role="dialog" aria-modal="true">
            <div className="gs-modal-content" style={{ maxWidth: 440 }}>
              <button onClick={() => setShowContactModal(false)} className="gs-modal-close">
                <X size={20} />
              </button>

              <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                {contactStep === 'input' ? 'Update & Verify Contact' : 'Enter Verification OTP'}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--gs-text-muted)', marginBottom: '1.25rem' }}>
                {contactStep === 'input'
                  ? 'A real OTP will be dispatched to verify your new phone number or email address.'
                  : `Enter the 6-digit OTP code sent to your new contact.`}
              </p>

              {contactStep === 'input' ? (
                <form onSubmit={handleRequestContactChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="gs-form-field">
                    <label className="gs-form-label">New Mobile Number or Email</label>
                    <input
                      type="text"
                      placeholder="e.g., 9876543210 or newemail@example.com"
                      value={newContactValue}
                      onChange={(e) => setNewContactValue(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <button type="submit" disabled={loading} className="gs-btn gs-btn-primary">
                    {loading ? 'Dispatching OTP...' : 'Send Verification OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyContactChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="gs-form-field">
                    <label className="gs-form-label">6-Digit Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="••••••"
                      value={contactOtp}
                      onChange={(e) => setContactOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                      style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.3rem' }}
                    />
                  </div>
                  <button type="submit" disabled={loading} className="gs-btn gs-btn-primary">
                    {loading ? 'Verifying...' : 'Confirm & Update Contact'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Correction Response Modal (Phase 5) */}
        {correctionTarget && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(16, 38, 26, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div className="gs-card" style={{ width: '100%', maxWidth: '540px', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)' }}>
                  {t.correctionModalTitle}
                </h2>
                <button
                  onClick={() => setCorrectionTarget(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--gs-status-error-soft)',
                  border: '1px solid #FECACA',
                  borderRadius: 'var(--gs-radius-md)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--gs-status-error)', marginBottom: '0.25rem' }}>
                  {t.correctionModalDesc}
                </div>
                <div style={{ fontSize: '0.88rem', color: 'var(--gs-text-primary)' }}>
                  {correctionTarget.correctionNotes || 'Please provide updated document details.'}
                </div>
              </div>

              <form onSubmit={handleSubmitCorrectionResponse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="gs-form-label">{t.correctionResponseLabel} *</label>
                  <textarea
                    rows={4}
                    className="gs-form-input"
                    value={correctionResponseNotes}
                    onChange={(e) => setCorrectionResponseNotes(e.target.value)}
                    placeholder="Describe the corrections made or explain document details for re-audit..."
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setCorrectionTarget(null)}
                    className="gs-btn gs-btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="gs-btn gs-btn-primary"
                  >
                    {loading ? 'Submitting...' : t.correctionResponseSubmit}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Appeal Modal (Phase 6) */}
        {appealTarget && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(16, 38, 26, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div className="gs-card" style={{ width: '100%', maxWidth: '540px', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldAlert size={20} color="var(--gs-status-error)" />
                  <span>Appeal Verification Decision</span>
                </h2>
                <button
                  onClick={() => setAppealTarget(null)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'var(--gs-forest-soft)',
                  border: '1px solid var(--gs-forest-light)',
                  borderRadius: 'var(--gs-radius-md)',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.84rem', color: 'var(--gs-forest-deep)', marginBottom: '0.25rem' }}>
                  Property: {appealTarget.title} (ID: {appealTarget.id})
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-secondary)' }}>
                  Current Status: <strong style={{ textTransform: 'uppercase' }}>{appealTarget.submissionStatus}</strong>
                  {appealTarget.correctionNotes && (
                    <div style={{ marginTop: '0.35rem', color: 'var(--gs-status-error)' }}>
                      Reviewer note: {appealTarget.correctionNotes}
                    </div>
                  )}
                </div>
              </div>

              <form onSubmit={handleFileAppeal} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="gs-form-label">Appeal Justification & Clarification *</label>
                  <textarea
                    rows={5}
                    className="gs-form-input"
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Provide a detailed explanation justifying why this decision should be reviewed. Address any inconsistencies or document deficiencies noted by the verifier..."
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setAppealTarget(null)}
                    className="gs-btn gs-btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={appealSubmitting || !appealReason.trim()}
                    className="gs-btn gs-btn-primary"
                  >
                    {appealSubmitting ? 'Filing Appeal...' : 'Submit Official Appeal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Verification Checklist Modal (Phase 6) */}
        {checklistModalProperty && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(16, 38, 26, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div className="gs-card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldCheck size={22} color="var(--gs-forest-primary)" />
                    <span>Verification Checklist & Trust Audit</span>
                  </h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>
                    Property ID: {checklistModalProperty.id} &bull; {checklistModalProperty.title}
                  </div>
                </div>
                <button
                  onClick={() => { setChecklistModalProperty(null); setChecklistData(null); }}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>

              {checklistLoading ? (
                <div style={{ padding: '2.5rem 0', textAlign: 'center' }}>
                  <p style={{ color: 'var(--gs-text-muted)' }}>Loading verification records...</p>
                </div>
              ) : checklistData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {checklistData.items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--gs-radius-md)',
                        border: '1px solid var(--gs-border)',
                        backgroundColor: item.status === 'passed' ? 'var(--gs-forest-soft)' : 'var(--gs-bg-card)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gs-forest-deep)' }}>
                          {item.title}
                        </span>
                        <span className={`gs-badge ${item.status === 'passed' ? 'gs-badge-verified' : 'gs-badge-neutral'}`}>
                          {item.status === 'passed' ? 'Verified' : 'Pending / Action Required'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--gs-text-secondary)', margin: 0, lineHeight: 1.4 }}>
                        {item.description}
                      </p>
                      {item.checkedAt && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)', marginTop: '0.35rem' }}>
                          Audited at: {new Date(item.checkedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Statutory Disclosure */}
                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--gs-bg-subtle)', borderRadius: 'var(--gs-radius-sm)', fontSize: '0.76rem', color: 'var(--gs-text-muted)', lineHeight: 1.45 }}>
                    <strong>Statutory Transparency Notice:</strong> Verification badges signify procedural review of submitted documentation and verified contact channels. In compliance with the Transfer of Property Act 1882, they do not constitute a state-guaranteed certificate of absolute ownership title or legal warranty.
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--gs-text-muted)' }}>No checklist data available for this listing.</p>
              )}
            </div>
          </div>
        )}
        {/* Phase 9: Side-by-Side Property Comparison Modal */}
        {showComparisonModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(16, 38, 26, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div className="gs-card" style={{ width: '100%', maxWidth: '960px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Scale size={24} color="var(--gs-forest-primary)" />
                    <span>Real-Data Property Comparison</span>
                  </h2>
                  <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)' }}>
                    Comparing {selectedSavedPropertyIds.length} verified properties based directly on recorded attributes.
                  </div>
                </div>
                <button
                  onClick={() => setShowComparisonModal(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.3rem' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedSavedPropertyIds.length}, 1fr)`, gap: '1.25rem', overflowX: 'auto' }}>
                {savedProperties
                  .filter((item) => item.property && selectedSavedPropertyIds.includes(item.property.id))
                  .map(({ property }) => {
                    const p = property!;
                    return (
                      <div
                        key={p.id}
                        style={{
                          padding: '1.25rem',
                          backgroundColor: 'var(--gs-bg-canvas)',
                          borderRadius: 'var(--gs-radius-md)',
                          border: '1px solid var(--gs-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.85rem',
                        }}
                      >
                        <div>
                          <span className={`gs-badge ${p.verificationStatus === 'authoritative_verified' ? 'gs-badge-verified' : 'gs-badge-warning'}`}>
                            {p.verificationStatus.replace('_', ' ').toUpperCase()}
                          </span>
                          <h4 style={{ fontSize: '1.05rem', color: 'var(--gs-forest-deep)', margin: '0.4rem 0 0.2rem' }}>
                            {p.title}
                          </h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                            {p.locality}, {p.city}, {p.state}
                          </div>
                        </div>

                        <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--gs-forest-soft)', borderRadius: 'var(--gs-radius-sm)' }}>
                          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--gs-text-muted)', fontWeight: 700 }}>Monthly Rent</span>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gs-forest-deep)' }}>
                            ₹{p.rentPerMonth.toLocaleString('en-IN')}<span style={{ fontSize: '0.78rem', fontWeight: 500 }}>/mo</span>
                          </div>
                          {p.securityDeposit && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)' }}>
                              Deposit: ₹{p.securityDeposit.toLocaleString('en-IN')}
                            </div>
                          )}
                        </div>

                        <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <div><strong>Type:</strong> {p.propertyType.toUpperCase()}</div>
                          <div><strong>Bedrooms:</strong> {p.bedrooms ? `${p.bedrooms} BHK` : 'N/A'}</div>
                          <div><strong>Bathrooms:</strong> {p.bathrooms || 'N/A'}</div>
                          <div><strong>Carpet Area:</strong> {p.areaSqFt ? `${p.areaSqFt} sq ft` : 'N/A'}</div>
                          <div><strong>Furnishing:</strong> {p.furnishing.replace('_', ' ')}</div>
                          <div><strong>Preference:</strong> {p.tenantPreference.replace('_', ' ')}</div>
                          <div><strong>Freshness:</strong> {p.isAvailabilityConfirmed !== false ? 'Confirmed Live' : 'Reconfirmation Due'}</div>
                        </div>

                        {p.amenities && p.amenities.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>Amenities:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                              {p.amenities.slice(0, 5).map((a) => (
                                <span key={a} className="gs-badge gs-badge-neutral" style={{ fontSize: '0.72rem' }}>
                                  {a}
                                </span>
                              ))}
                              {p.amenities.length > 5 && (
                                <span className="gs-badge gs-badge-neutral" style={{ fontSize: '0.72rem' }}>
                                  +{p.amenities.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setShowComparisonModal(false);
                            onNavigate?.('find-property');
                          }}
                          className="gs-btn gs-btn-outline gs-btn-sm"
                          style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }}
                        >
                          View in Find Property
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Phase 9: Account Deactivation or Deletion Confirmation Modal */}
        {showDeactivateModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(16, 38, 26, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div className="gs-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <ShieldAlert size={28} color="var(--gs-status-error)" />
                <h2 style={{ fontSize: '1.25rem', color: '#991B1B', margin: 0 }}>
                  {deactivateAction === 'delete' ? 'Confirm Permanent Account Deletion' : 'Confirm Account Deactivation'}
                </h2>
              </div>

              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--gs-radius-md)', color: '#7F1D1D', fontSize: '0.84rem', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                <strong>Important Safeguard Notice:</strong>
                <ul style={{ margin: '0.35rem 0 0', paddingLeft: '1.2rem' }}>
                  <li>All active property listings submitted by your account will be immediately withdrawn from public discovery.</li>
                  <li>All active sessions on all browsers and devices will be terminated immediately.</li>
                  {deactivateAction === 'delete' && (
                    <li>In compliance with DPDP Act, private data will be queued for permanent purging.</li>
                  )}
                </ul>
              </div>

              <form onSubmit={handleConfirmDeactivation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="gs-form-field">
                  <label className="gs-form-label">Reason for {deactivateAction} (Optional)</label>
                  <input
                    type="text"
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    placeholder="e.g. Found rental home, moving out of region, etc."
                  />
                </div>

                <div className="gs-form-field">
                  <label className="gs-form-label">
                    4-Digit Security PIN <span style={{ color: 'var(--gs-status-error)' }}>*</span>
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={deactivatePin}
                    onChange={(e) => setDeactivatePin(e.target.value)}
                    placeholder="••••"
                    required
                    autoFocus
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>
                    Your PIN is required to verify identity before modifying account status.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setShowDeactivateModal(false); setDeactivatePin(''); }}
                    className="gs-btn gs-btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deactivateSubmitting || deactivatePin.length !== 4}
                    className="gs-btn"
                    style={{ backgroundColor: '#DC2626', color: '#FFFFFF', border: 'none' }}
                  >
                    {deactivateSubmitting ? 'Processing...' : (deactivateAction === 'delete' ? 'Permanently Delete' : 'Deactivate Account')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
