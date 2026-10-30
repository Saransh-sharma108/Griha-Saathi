import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Smartphone, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Globe, 
  Bell, 
  Database,
  Lock,
  Sparkles
} from 'lucide-react';
import { SupportedLanguage, UserProfile } from '@shared/types';
import { translations } from '@shared/i18n';

export interface OwnerProfileData {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  initials: string;
  accountType: string;
  role: string;
  activeRole: string;
  roles: string[];
  preferredLanguage: SupportedLanguage;
  notificationPreferences: {
    emailAlerts: boolean;
    smsAlerts: boolean;
    propertyInquiries: boolean;
    securityAlerts: boolean;
    savedSearchAlerts?: boolean;
  };
  accountStatus: string;
  isIdentityVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface OwnerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  onProfileUpdated?: (updated: UserProfile) => void;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const OwnerProfileModal: React.FC<OwnerProfileModalProps> = ({
  isOpen,
  onClose,
  language,
  onProfileUpdated,
  onLanguageChange,
}) => {
  const [profile, setProfile] = useState<OwnerProfileData | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLang, setPreferredLang] = useState<SupportedLanguage>(language);
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: true,
    propertyInquiries: true,
    securityAlerts: true,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch current owner profile on modal open
  useEffect(() => {
    if (!isOpen) {
      setSuccessMessage(null);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    fetch('/api/owner/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          setProfile(data.profile);
          setFullName(data.profile.fullName || '');
          setEmail(data.profile.email || '');
          setPhone(data.profile.phone || '');
          if (data.profile.preferredLanguage) {
            setPreferredLang(data.profile.preferredLanguage);
          }
          if (data.profile.notificationPreferences) {
            setNotifications({
              emailAlerts: Boolean(data.profile.notificationPreferences.emailAlerts),
              smsAlerts: Boolean(data.profile.notificationPreferences.smsAlerts),
              propertyInquiries: Boolean(data.profile.notificationPreferences.propertyInquiries),
              securityAlerts: Boolean(data.profile.notificationPreferences.securityAlerts),
            });
          }
        }
      })
      .catch((err) => {
        setErrorMessage('Unable to load profile from database. Please retry.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/owner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          preferredLanguage: preferredLang,
          notificationPreferences: notifications,
        }),
      });

      const data = await response.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setSuccessMessage('Profile settings saved and persisted to database successfully.');
        
        if (onLanguageChange && preferredLang !== language) {
          onLanguageChange(preferredLang);
        }

        if (onProfileUpdated) {
          onProfileUpdated({
            id: data.profile.id,
            identifier: data.profile.email,
            email: data.profile.email,
            phone: data.profile.phone,
            fullName: data.profile.fullName,
            role: (data.profile.role as any) || 'owner',
            activeRole: (data.profile.activeRole as any) || 'owner',
            roles: data.profile.roles || ['owner', 'admin'],
            preferredLanguage: data.profile.preferredLanguage,
            notificationPreferences: data.profile.notificationPreferences,
            isPhoneVerified: Boolean(data.profile.phone),
            isEmailVerified: true,
            isIdentityVerified: true,
            accountStatus: 'active',
            accountType: data.profile.accountType,
            createdAt: data.profile.createdAt,
            updatedAt: data.profile.updatedAt,
          });
        }

        setTimeout(() => {
          setSuccessMessage(null);
        }, 3500);
      } else {
        setErrorMessage(data.error || 'Failed to save changes.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const initials = profile?.initials || (fullName ? fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'SS');

  return (
    <div 
      className="gs-modal-backdrop" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="owner-profile-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 23, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div 
        className="gs-modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: '#0F291E',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#F1F5F9',
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            padding: '1.5rem 1.75rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div 
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.25)',
              }}
            >
              {initials}
            </div>
            <div>
              <h2 
                id="owner-profile-title"
                style={{ 
                  margin: 0, 
                  fontSize: '1.25rem', 
                  fontWeight: 800, 
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {fullName || 'Personal Profile'}
                <span 
                  style={{
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.55rem',
                    borderRadius: 9999,
                    backgroundColor: 'rgba(52, 211, 153, 0.2)',
                    color: '#6EE7B7',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                  }}
                >
                  Owner
                </span>
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#94A3B8' }}>
                Website Owner / Administrator
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '1.5rem 1.75rem', flex: 1 }}>
          {successMessage && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#6EE7B7',
                fontSize: '0.86rem',
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle2 size={18} color="#34D399" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#FCA5A5',
                fontSize: '0.86rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} color="#F87171" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Account Status Badge Box */}
          <div 
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <ShieldCheck size={20} color="#34D399" />
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Website Owner Account
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  Persistent database storage • Full administrative access
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#6EE7B7', fontSize: '0.76rem', fontWeight: 700 }}>
              <Database size={14} />
              <span>Database Active</span>
            </div>
          </div>

          {/* Contact & Personal Information Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Personal Details
            </h3>

            {/* Full Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.35rem' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Website Owner Name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.35rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.35rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.35rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.35rem' }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <Smartphone size={16} color="#64748B" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 (Enter Indian mobile number)"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.35rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.25rem', display: 'block' }}>
                Direct contact line for platform management and emergency notifications.
              </span>
            </div>
          </div>

          {/* Platform Settings Section */}
          <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform Preferences
            </h3>

            {/* Language Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.45rem' }}>
                Display Language
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  { code: 'en' as SupportedLanguage, label: 'English' },
                  { code: 'hi' as SupportedLanguage, label: 'हिन्दी' },
                  { code: 'hi-en' as SupportedLanguage, label: 'Hinglish' },
                ].map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setPreferredLang(item.code)}
                    style={{
                      padding: '0.55rem 0.5rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: preferredLang === item.code ? 700 : 500,
                      backgroundColor: preferredLang === item.code ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: preferredLang === item.code ? '#6EE7B7' : '#94A3B8',
                      border: preferredLang === item.code ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Toggles */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#94A3B8', marginBottom: '0.5rem' }}>
                Notification Alerts
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem', color: '#E2E8F0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifications.emailAlerts}
                    onChange={(e) => setNotifications({ ...notifications, emailAlerts: e.target.checked })}
                    style={{ accentColor: '#10B981', width: 16, height: 16 }}
                  />
                  <span>Email security alerts & listing audit notifications</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem', color: '#E2E8F0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifications.propertyInquiries}
                    onChange={(e) => setNotifications({ ...notifications, propertyInquiries: e.target.checked })}
                    style={{ accentColor: '#10B981', width: 16, height: 16 }}
                  />
                  <span>Direct property connection and visit requests</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem', color: '#E2E8F0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifications.securityAlerts}
                    onChange={(e) => setNotifications({ ...notifications, securityAlerts: e.target.checked })}
                    style={{ accentColor: '#10B981', width: 16, height: 16 }}
                  />
                  <span>Security audit logs and account protection alerts</span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div 
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#E2E8F0',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.45rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.75 : 1,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

