import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Home, 
  Search, 
  ShieldCheck, 
  Users, 
  Bot, 
  HelpCircle, 
  LayoutDashboard, 
  PlusCircle, 
  User, 
  Menu, 
  X,
  Globe,
  Lock,
  Bell,
  ChevronDown,
  LogOut,
  Check,
  CheckCircle2,
  Bookmark,
  Building,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Clock,
  ShieldAlert,
  ArrowRight,
  MessageSquare,
  Shield
} from 'lucide-react';
import { SupportedLanguage, UserProfile, InAppNotification, UserRole } from '@shared/types';
import { translations } from '@shared/i18n';

export type NavSection = 
  | 'home'
  | 'find-property'
  | 'verifications'
  | 'connections'
  | 'saathi-ai'
  | 'help'
  | 'dashboard'
  | 'listing-property';

interface HeaderProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  user: UserProfile | null;
  token?: string | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onUserUpdate?: (updatedUser: UserProfile) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onNavigate,
  language,
  onLanguageChange,
  user,
  token,
  onOpenAuth,
  onSignOut,
  onUserUpdate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Real Notifications State
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // DOM Refs for Outside Click & Focus Management
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const langTriggerRef = useRef<HTMLButtonElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const notifTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const t = translations[language].nav;

  // Exact 8 Navigation Sections in Required Order
  const navItems: { id: NavSection; label: string; icon: React.ReactNode; isPrimaryAction?: boolean }[] = [
    { id: 'home', label: t.home, icon: <Home size={15} strokeWidth={2.2} /> },
    { id: 'find-property', label: t.findProperty, icon: <Search size={15} strokeWidth={2.2} /> },
    { id: 'verifications', label: t.verifications, icon: <ShieldCheck size={15} strokeWidth={2.2} /> },
    { id: 'connections', label: t.connections, icon: <Users size={15} strokeWidth={2.2} /> },
    { id: 'saathi-ai', label: t.saathiAi, icon: <Bot size={15} strokeWidth={2.2} /> },
    { id: 'help', label: t.help, icon: <HelpCircle size={15} strokeWidth={2.2} /> },
    { id: 'dashboard', label: t.dashboard, icon: <LayoutDashboard size={15} strokeWidth={2.2} /> },
    { id: 'listing-property', label: t.listingProperty, icon: <PlusCircle size={15} strokeWidth={2.4} color="#E5A955" />, isPrimaryAction: true },
  ];

  // Fetch real notifications if user is authenticated
  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user, token]);

  const fetchNotifications = async () => {
    if (!token) return;
    setLoadingNotifs(true);
    try {
      const res = await fetch('/api/notifications?page=1&limit=6&filter=all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Graceful fallback without crashing header
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (e) {
      // Ignore
    }
  };

  const handleNotificationClick = async (notif: InAppNotification) => {
    if (token && !notif.isRead) {
      fetch(`/api/notifications/${notif.id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setNotifDropdownOpen(false);

    // Route based on notification payload
    if (notif.relatedConnectionId || notif.type.includes('connection') || notif.type.includes('message')) {
      handleNavClick('connections');
    } else if (notif.relatedPropertyId) {
      handleNavClick('find-property');
    } else {
      handleNavClick('dashboard');
    }
  };

  // Close dropdowns on outside click or Escape key with accessible focus return
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (langDropdownOpen) {
          setLangDropdownOpen(false);
          langTriggerRef.current?.focus();
        }
        if (profileDropdownOpen) {
          setProfileDropdownOpen(false);
          profileTriggerRef.current?.focus();
        }
        if (notifDropdownOpen) {
          setNotifDropdownOpen(false);
          notifTriggerRef.current?.focus();
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          mobileToggleRef.current?.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [langDropdownOpen, profileDropdownOpen, notifDropdownOpen, mobileMenuOpen]);

  // Close mobile navigation drawer automatically on viewport resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1140 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Reactive scroll listener to add depth and padding compression on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (section: NavSection) => {
    onNavigate(section);
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setNotifDropdownOpen(false);
    setLangDropdownOpen(false);
  };

  // Handle switching active role if multi-role supported
  const handleRoleSwitch = async () => {
    if (!token || !user) return;
    const targetRole: UserRole = (user.activeRole || user.role) === 'owner' ? 'tenant' : 'owner';
    setSwitchingRole(true);
    try {
      const res = await fetch('/api/dashboard/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activeRole: targetRole }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user && onUserUpdate) {
        onUserUpdate(data.user);
      }
    } catch (e) {
      // Ignore
    } finally {
      setSwitchingRole(false);
      setProfileDropdownOpen(false);
    }
  };

  const getInitials = (name?: string, identifier?: string) => {
    if (name && name.trim()) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (identifier) return identifier.slice(0, 2).toUpperCase();
    return 'GS';
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const languageLabels: Record<SupportedLanguage, { label: string; code: string; native: string }> = {
    en: { label: 'English', code: 'EN', native: 'English' },
    hi: { label: 'हिंदी', code: 'हिं', native: 'हिंदी (Hindi)' },
    'hi-en': { label: 'Hinglish', code: 'Hinglish', native: 'Hinglish' },
  };

  return (
    <header className={`gs-header gs-header-wrapper ${isScrolled ? 'gs-header-scrolled' : ''}`} role="banner">
      <div className="gs-command-bar gs-nav-container">
        {/* =====================================================================
            ZONE A: BRAND IDENTITY — REFINED SQUIRCLE ICON & WORDMARK
            ===================================================================== */}
        <div className="gs-nav-left">
          <a 
            href="#home" 
            onClick={(e) => { e.preventDefault(); handleNavClick('home'); }} 
            className="gs-logo-link"
            aria-label="Griha Saathi Home — Back to Property Discovery"
          >
            <div className="gs-logo-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 10.5L12 3L21 10.5V20.2C21 20.6418 20.6418 21 20.2 21H3.8C3.35817 21 3 20.6418 3 20.2V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 21V12.5C9 10.8431 10.3431 9.5 12 9.5C13.6569 9.5 15 10.8431 15 12.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="6.2" r="1.3" fill="#E5A955"/>
              </svg>
            </div>
            <div className="gs-logo-text">
              <span className="gs-brand-title">GRIHA SAATHI</span>
              <span className="gs-brand-tag">गृह साथी • AUDITED PROPTECH</span>
            </div>
          </a>
        </div>

        {/* =====================================================================
            ZONE B: PRIMARY NAVIGATION DOCK — EXACT 8 PRESCRIBED ITEMS
            ===================================================================== */}
        <nav className="gs-nav-centre" aria-label="Main Command Navigation">
          <ul className="gs-nav-links" role="menubar">
            {navItems.map((item) => {
              const isActive = currentSection === item.id;
              const isListingAction = item.isPrimaryAction;

              return (
                <li key={item.id} className="gs-nav-item" role="none">
                  <button
                    role="menuitem"
                    onClick={() => handleNavClick(item.id)}
                    className={
                      isListingAction
                        ? `gs-nav-btn-highlight ${isActive ? 'active' : ''}`
                        : `gs-nav-btn ${isActive ? 'active' : ''}`
                    }
                    aria-current={isActive ? 'page' : undefined}
                    title={item.label}
                  >
                    <span className="gs-nav-item-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="gs-nav-item-text">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* =====================================================================
            ZONE C: GLOBAL CONTROLS — EXTREME RIGHT
            ===================================================================== */}
        <div className="gs-nav-right">
          
          {/* 1. Real-Time Notification Popover (When Authenticated) */}
          {user && (
            <div className="gs-nav-dropdown" ref={notifRef}>
              <button
                ref={notifTriggerRef}
                type="button"
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                  setLangDropdownOpen(false);
                }}
                className="gs-notif-btn"
                aria-label={`Notifications: ${unreadCount} unread`}
                aria-expanded={notifDropdownOpen}
                aria-haspopup="true"
                title="View recent notifications"
              >
                <Bell size={18} strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="gs-notif-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Accessible Notification Popover */}
              {notifDropdownOpen && (
                <div 
                  className="gs-dropdown-panel gs-notif-popover" 
                  role="region" 
                  aria-label="Recent notifications"
                >
                  <div className="gs-notif-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--gs-forest-deep)' }}>
                        Notifications
                      </strong>
                      {unreadCount > 0 ? (
                        <span className="gs-badge gs-badge-emerald" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                          {unreadCount} unread
                        </span>
                      ) : (
                        <span className="gs-badge gs-badge-neutral" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                          All caught up
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        style={{ fontSize: '0.78rem', color: 'var(--gs-forest-primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="gs-notif-list">
                    {loadingNotifs ? (
                      <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--gs-text-muted)', fontSize: '0.85rem' }}>
                        Loading real notifications...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`gs-notif-item ${!notif.isRead ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleNotificationClick(notif);
                            }
                          }}
                        >
                          <div style={{ marginTop: '0.2rem', flexShrink: 0 }}>
                            {notif.type.includes('alert') || notif.type.includes('warning') ? (
                              <ShieldAlert size={16} color="#B45309" />
                            ) : notif.type.includes('visit') ? (
                              <Clock size={16} color="var(--gs-forest-primary)" />
                            ) : notif.type.includes('connection') || notif.type.includes('message') ? (
                              <MessageSquare size={16} color="var(--gs-forest-primary)" />
                            ) : (
                              <CheckCircle2 size={16} color="#15803D" />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.15rem' }}>
                              <span style={{ fontSize: '0.86rem', fontWeight: notif.isRead ? 600 : 700, color: 'var(--gs-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {notif.title}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--gs-text-muted)', flexShrink: 0 }}>
                                {formatRelativeTime(notif.createdAt)}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-secondary)', lineHeight: 1.4 }}>
                              {notif.message}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--gs-text-muted)' }}>
                        <Bell size={28} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: 'var(--gs-forest-primary)' }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>All caught up!</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--gs-text-secondary)' }}>
                          No pending visit alerts or unread connection requests.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="gs-notif-footer">
                    <button
                      type="button"
                      onClick={() => handleNavClick('dashboard')}
                      style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: 700, 
                        color: 'var(--gs-forest-primary)', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>View All in Dashboard</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Advanced Language Selector Dropdown */}
          <div className="gs-nav-dropdown" ref={langRef}>
            <button
              ref={langTriggerRef}
              type="button"
              onClick={() => {
                setLangDropdownOpen(!langDropdownOpen);
                setProfileDropdownOpen(false);
                setNotifDropdownOpen(false);
              }}
              className="gs-dropdown-trigger"
              aria-label={`Language selector. Current language: ${languageLabels[language].label}`}
              aria-expanded={langDropdownOpen}
              aria-haspopup="true"
              title="Select interface language"
            >
              <Globe size={15} color="var(--gs-forest-primary)" strokeWidth={2} />
              <span style={{ fontWeight: 700 }}>{languageLabels[language].code}</span>
              <ChevronDown size={12} color="var(--gs-text-muted)" />
            </button>

            {/* Language Popover Menu */}
            {langDropdownOpen && (
              <div 
                className="gs-dropdown-panel" 
                style={{ width: '190px' }} 
                role="menu"
                aria-label="Supported Languages"
              >
                <div style={{ padding: '0.5rem 0.85rem', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gs-text-muted)', letterSpacing: '0.04em', borderBottom: '1px solid var(--gs-border-subtle)' }}>
                  Language / भाषा
                </div>
                {(['en', 'hi', 'hi-en'] as SupportedLanguage[]).map((langKey) => {
                  const isCurrent = language === langKey;
                  return (
                    <button
                      key={langKey}
                      role="menuitem"
                      type="button"
                      className={`gs-dropdown-item ${isCurrent ? 'active' : ''}`}
                      onClick={() => {
                        onLanguageChange(langKey);
                        setLangDropdownOpen(false);
                        langTriggerRef.current?.focus();
                      }}
                    >
                      <span>{languageLabels[langKey].native}</span>
                      {isCurrent && <Check size={14} color="var(--gs-forest-primary)" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Context-Aware Authentication & Account Command Control */}
          {user ? (
            <div className="gs-nav-dropdown" ref={profileRef}>
              <button
                ref={profileTriggerRef}
                type="button"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setLangDropdownOpen(false);
                  setNotifDropdownOpen(false);
                }}
                className="gs-profile-btn"
                aria-label={`Account menu for ${user.fullName || user.identifier}`}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                title="Account & Dashboard settings"
              >
                <div className="gs-avatar-circle">
                  {getInitials(user.fullName, user.identifier)}
                </div>
                <span className="gs-profile-name">
                  {user.fullName || user.identifier}
                </span>
                <span 
                  className="gs-badge gs-badge-forest gs-profile-role-badge"
                  style={{ fontSize: '0.65rem', padding: '0.12rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                >
                  {user.activeRole || user.role}
                </span>
                <ChevronDown size={13} color="var(--gs-text-muted)" />
              </button>

              {/* Account Command Dropdown Menu */}
              {profileDropdownOpen && (
                <div 
                  className="gs-dropdown-panel" 
                  style={{ width: '270px' }} 
                  role="menu"
                  aria-label="User Account Commands"
                >
                  {/* Account Identity Card */}
                  <div style={{ padding: '1rem', borderBottom: '1px solid var(--gs-border)', backgroundColor: 'var(--gs-surface-elevated)' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--gs-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.fullName || 'Verified Member'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.identifier}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem' }}>
                      <span className="gs-badge gs-badge-verified" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                        Active: {(user.activeRole || user.role).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Shortcuts */}
                  <div style={{ padding: '0.35rem 0' }}>
                    <button
                      type="button"
                      role="menuitem"
                      className="gs-dropdown-item"
                      onClick={() => handleNavClick('dashboard')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <LayoutDashboard size={15} color="var(--gs-forest-primary)" />
                        <span>My Dashboard</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="gs-dropdown-item"
                      onClick={() => handleNavClick('connections')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <Users size={15} color="var(--gs-forest-primary)" />
                        <span>Connections & Visits</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      className="gs-dropdown-item"
                      onClick={() => handleNavClick('listing-property')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <PlusCircle size={15} color="var(--gs-forest-primary)" />
                        <span>List Verified Property</span>
                      </span>
                    </button>
                  </div>

                  <div className="gs-dropdown-divider" />

                  {/* Multi-Role Quick Switch */}
                  <div style={{ padding: '0.35rem 0' }}>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={switchingRole}
                      className="gs-dropdown-item"
                      onClick={handleRoleSwitch}
                      title="Switch active session role"
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem' }}>
                        <RotateCcw size={14} color="var(--gs-forest-mid)" />
                        <span>
                          {switchingRole ? 'Switching...' : `Switch to ${(user.activeRole || user.role) === 'owner' ? 'Tenant' : 'Owner'} Mode`}
                        </span>
                      </span>
                    </button>
                  </div>

                  <div className="gs-dropdown-divider" />

                  {/* Sign Out Action */}
                  <div style={{ padding: '0.35rem 0' }}>
                    <button
                      type="button"
                      role="menuitem"
                      className="gs-dropdown-item"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onSignOut();
                      }}
                      style={{ color: '#DC2626' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <LogOut size={15} />
                        <span>{t.logout || 'Sign Out'}</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onOpenAuth} 
              className="gs-btn gs-btn-primary gs-btn-sm gs-nav-auth-btn"
              title="Sign in or register an account"
            >
              <Lock size={14} />
              <span className="gs-nav-auth-text">{t.login || 'Sign In'}</span>
            </button>
          )}

          {/* 4. Quick Mobile Listing Property Action (Visible on tablet & mobile) */}
          <button
            type="button"
            onClick={() => handleNavClick('listing-property')}
            className={`gs-mobile-quick-list-btn ${currentSection === 'listing-property' ? 'active' : ''}`}
            aria-label={t.listingProperty}
            title={t.listingProperty}
          >
            <PlusCircle size={15} strokeWidth={2.4} color="#E5A955" />
            <span className="gs-mobile-quick-list-text">{t.listingProperty.split(' ')[0]}</span>
          </button>

          {/* 5. Responsive Mobile Hamburger Button */}
          <button
            ref={mobileToggleRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="gs-mobile-menu-btn"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-command-drawer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          ADAPTIVE MOBILE COMMAND DRAWER & ACCESSIBLE BACKDROP
          ========================================================================= */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="gs-mobile-backdrop"
            aria-hidden="true"
          />
          <div
            id="mobile-command-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="gs-mobile-drawer"
          >
            {/* Drawer Header with Brand & Close Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gs-border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="gs-logo-icon" style={{ width: 36, height: 36 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 10.5L12 3L21 10.5V20.2C21 20.6418 20.6418 21 20.2 21H3.8C3.35817 21 3 20.6418 3 20.2V10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 21V12.5C9 10.8431 10.3431 9.5 12 9.5C13.6569 9.5 15 10.8431 15 12.5V21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="6.2" r="1.3" fill="#E5A955"/>
                  </svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--gs-font-heading)', fontWeight: 800, color: 'var(--gs-forest-deep)', fontSize: '1.1rem', lineHeight: 1.1 }}>
                    GRIHA SAATHI
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#40916C', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    गृह साथी • AUDITED PROPTECH
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="gs-modal-close"
                style={{ position: 'static' }}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Session Banner in Mobile Drawer */}
            {user ? (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem', 
                  backgroundColor: 'var(--gs-forest-soft)', 
                  borderRadius: 'var(--gs-radius-md)',
                  marginBottom: '1rem',
                  border: '1px solid var(--gs-forest-muted)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div className="gs-avatar-circle" style={{ width: 36, height: 36, fontSize: '0.82rem' }}>
                    {getInitials(user.fullName, user.identifier)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>
                      {user.fullName || user.identifier}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--gs-forest-mid)', fontWeight: 600, textTransform: 'uppercase' }}>
                      {user.activeRole || user.role} Account
                    </div>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <span className="gs-badge gs-badge-emerald" style={{ fontSize: '0.72rem' }}>
                    {unreadCount} alerts
                  </span>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="gs-btn gs-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Lock size={15} />
                  <span>{t.login || 'Sign In / Register'}</span>
                </button>
              </div>
            )}

            {/* Quick Action Discovery Shortcuts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => handleNavClick('find-property')}
                className="gs-btn gs-btn-primary gs-btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Search size={15} />
                <span>Find Property</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('saathi-ai')}
                className="gs-btn gs-btn-secondary gs-btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Bot size={15} />
                <span>Saathi AI</span>
              </button>
            </div>

            <div style={{ marginBottom: '0.4rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--gs-border-subtle)' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gs-text-muted)', letterSpacing: '0.06em' }}>
                Main Navigation ({navItems.length} destinations)
              </span>
            </div>

            {/* Exact 8 Destinations in Prescribed Order */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {navItems.map((item) => {
                const isCurrent = currentSection === item.id;
                const isListing = item.isPrimaryAction;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.7rem 0.95rem',
                      borderRadius: 'var(--gs-radius-md)',
                      backgroundColor: isCurrent ? 'var(--gs-forest-soft)' : isListing ? 'linear-gradient(135deg, rgba(27,67,50,0.08) 0%, rgba(27,67,50,0.04) 100%)' : 'transparent',
                      color: isCurrent ? 'var(--gs-forest-deep)' : isListing ? 'var(--gs-forest-primary)' : 'var(--gs-text-primary)',
                      fontWeight: isCurrent || isListing ? 700 : 500,
                      textAlign: 'left',
                      width: '100%',
                      border: isListing 
                        ? '1.5px solid rgba(200, 138, 53, 0.5)' 
                        : isCurrent 
                        ? '1px solid rgba(27, 67, 50, 0.15)' 
                        : '1px solid transparent',
                      position: 'relative',
                    }}
                  >
                    <span style={{ color: isCurrent || isListing ? 'var(--gs-forest-primary)' : 'var(--gs-text-muted)', display: 'inline-flex' }}>
                      {item.icon}
                    </span>
                    <span style={{ fontSize: '0.92rem', flex: 1 }}>{item.label}</span>
                    {isListing ? (
                      <span className="gs-badge gs-badge-emerald" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem', border: '1px solid rgba(200, 138, 53, 0.4)' }}>
                        Action
                      </span>
                    ) : isCurrent ? (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--gs-forest-primary)' }} />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Mobile Language Switcher Row */}
            <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--gs-border-subtle)' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gs-text-muted)', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                Language Preference
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                {(['en', 'hi', 'hi-en'] as SupportedLanguage[]).map((langKey) => (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() => {
                      onLanguageChange(langKey);
                    }}
                    style={{
                      padding: '0.5rem 0.25rem',
                      borderRadius: 'var(--gs-radius-sm)',
                      fontSize: '0.82rem',
                      fontWeight: language === langKey ? 700 : 500,
                      backgroundColor: language === langKey ? 'var(--gs-forest-primary)' : 'var(--gs-bg-subtle)',
                      color: language === langKey ? '#FFFFFF' : 'var(--gs-text-primary)',
                      border: '1px solid var(--gs-border)',
                      textAlign: 'center',
                    }}
                  >
                    {languageLabels[langKey].code}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Sign Out */}
            {user && (
              <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--gs-border-subtle)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onSignOut();
                  }}
                  className="gs-btn gs-btn-outline"
                  style={{ width: '100%', justifyContent: 'center', color: '#DC2626', borderColor: '#FCA5A5' }}
                >
                  <LogOut size={15} />
                  <span>{t.logout || 'Sign Out'}</span>
                </button>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </header>
  );
};
