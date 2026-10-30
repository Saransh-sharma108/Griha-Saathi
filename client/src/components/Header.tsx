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
  Menu, 
  X,
  Globe, 
  Lock, 
  User,
  Bell, 
  ChevronDown, 
  LogOut, 
  Check, 
  CheckCircle2, 
  Bookmark, 
  RotateCcw, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  ArrowRight, 
  ArrowUpRight,
  MessageSquare, 
  Activity,
  FileText,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { SupportedLanguage, UserProfile, InAppNotification, UserRole } from '@shared/types';
import { translations } from '@shared/i18n';
import grihaSaathiLogo from '../assets/branding/griha-saathi-logo.png';

export type NavSection = 
  | 'home'
  | 'find-property'
  | 'verifications'
  | 'connections'
  | 'saathi-ai'
  | 'help'
  | 'dashboard'
  | 'listing-property';

export interface HeaderProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  user: UserProfile | null;
  token?: string | null;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
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
  onOpenProfile,
  onOpenAuth,
  onSignOut,
  onUserUpdate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Real Notifications State
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // DOM Refs for Outside Click & Keyboard Accessibility
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const langTriggerRef = useRef<HTMLButtonElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);
  const notifTriggerRef = useRef<HTMLButtonElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const t = translations[language].nav;

  // Active state checker helper
  const isMoreActive = ['verifications', 'connections', 'help'].includes(currentSection);

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
      // Graceful fallback
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

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setLangDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(target)) {
        setMoreDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (moreDropdownOpen) {
          setMoreDropdownOpen(false);
          moreTriggerRef.current?.focus();
        }
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
  }, [langDropdownOpen, profileDropdownOpen, notifDropdownOpen, moreDropdownOpen, mobileMenuOpen]);

  // Viewport resize watcher
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Reactive scroll listener for elevated glass depth
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
    setMoreDropdownOpen(false);
  };

  // Role switch handler
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
    <header className={`gs-header-wrapper ${isScrolled ? 'gs-header-scrolled' : ''}`} role="banner">
      {/* =========================================================================
          EMERALD GLASSMORPHIC CENTERED FLOATING PILL NAV
          ========================================================================= */}
      <nav 
        className="gs-floating-pill-nav"
        aria-label="Main Navigation"
      >
        {/* =======================================================================
            ZONE 1: BRAND IDENTITY (OFFICIAL HERITAGE LOGO INTEGRATION)
            ======================================================================= */}
        <div className="gs-nav-pill-brand-zone">
          <a 
            href="#home" 
            onClick={(e) => { e.preventDefault(); handleNavClick('home'); }} 
            className="gs-nav-pill-logo-link"
            aria-label="Griha Saathi Home — Back to Property Discovery"
          >
            <img
              src={grihaSaathiLogo}
              alt="Griha Saathi"
              className="gs-nav-heritage-logo"
              loading="eager"
              decoding="async"
              draggable={false}
              width={65}
              height={40}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/griha-saathi-logo.png';
              }}
            />
            <span className="gs-nav-pill-brand-name">GRIHA SAATHI</span>
          </a>
        </div>

        {/* =======================================================================
            ZONE 2: CENTER PRIMARY NAVIGATION (7 DESTINATIONS + COMPACT COLLAPSING)
            1. Home
            2. Find Property
            3. Dashboard
            4. Verifications (Desktop Wide) or within "More" (Desktop Narrow)
            5. Connections (Desktop Wide) or within "More" (Desktop Narrow)
            6. Help (Desktop Wide) or within "More" (Desktop Narrow)
            7. Saathi AI (Position 7, Primary Destination)
            ======================================================================= */}
        <div className="gs-nav-pill-center-zone">
          <ul className="gs-nav-pill-links" role="menubar">
            {/* 1. Home */}
            <li role="none">
              <button
                role="menuitem"
                type="button"
                onClick={() => handleNavClick('home')}
                className={`gs-nav-pill-link ${currentSection === 'home' ? 'active' : ''}`}
                aria-current={currentSection === 'home' ? 'page' : undefined}
                title={t.home}
              >
                <Home size={14} strokeWidth={2.2} className="gs-nav-pill-icon" aria-hidden="true" />
                <span>{t.home}</span>
              </button>
            </li>

            {/* 2. Find Property */}
            <li role="none">
              <button
                role="menuitem"
                type="button"
                onClick={() => handleNavClick('find-property')}
                className={`gs-nav-pill-link ${currentSection === 'find-property' ? 'active' : ''}`}
                aria-current={currentSection === 'find-property' ? 'page' : undefined}
                title={t.findProperty}
              >
                <Search size={14} strokeWidth={2.2} className="gs-nav-pill-icon" aria-hidden="true" />
                <span>{t.findProperty}</span>
              </button>
            </li>

            {/* 3. Dashboard */}
            <li role="none">
              <button
                role="menuitem"
                type="button"
                onClick={() => handleNavClick('dashboard')}
                className={`gs-nav-pill-link ${currentSection === 'dashboard' ? 'active' : ''}`}
                aria-current={currentSection === 'dashboard' ? 'page' : undefined}
                title={t.dashboard}
              >
                <LayoutDashboard size={14} strokeWidth={2.2} className="gs-nav-pill-icon" aria-hidden="true" />
                <span>{t.dashboard}</span>
              </button>
            </li>

            {/* 4. Verifications (Wide Viewport ≥ 1280px) */}
            <li role="none" className="gs-nav-wide-item">
              <button
                role="menuitem"
                type="button"
                onClick={() => handleNavClick('verifications')}
                className={`gs-nav-pill-link ${currentSection === 'verifications' ? 'active' : ''}`}
                aria-current={currentSection === 'verifications' ? 'page' : undefined}
                title={t.verifications}
              >
                <ShieldCheck size={14} strokeWidth={2.2} className="gs-nav-pill-icon" aria-hidden="true" />
                <span>{t.verifications}</span>
              </button>
            </li>

            {/* 5. Connections (Wide Viewport ≥ 1280px) */}
            <li role="none" className="gs-nav-wide-item">
              <button
                role="menuitem"
                type="button"
                onClick={() => handleNavClick('connections')}
                className={`gs-nav-pill-link ${currentSection === 'connections' ? 'active' : ''}`}
                aria-current={currentSection === 'connections' ? 'page' : undefined}
                title={t.connections}
              >
                <Users size={14} strokeWidth={2.2} className="gs-nav-pill-icon" aria-hidden="true" />
                <span>{t.connections}</span>
              </button>
            </li>

            {/* 6. Help (Wide Viewport ≥ 1280px) */}
            <li role="none" className="gs-nav-wide-item">
              <button
                role="menuitem"
                type="button"
                onClick={() => handleNavClick('help')}
                className={`gs-nav-pill-link ${currentSection === 'help' ? 'active' : ''}`}
                aria-current={currentSection === 'help' ? 'page' : undefined}
                title={t.help}
              >
                <HelpCircle size={14} strokeWidth={2.2} className="gs-nav-pill-icon" aria-hidden="true" />
                <span>{t.help}</span>
              </button>
            </li>

            {/* Narrow Desktop "More" Dropdown (1024px - 1279px) encapsulating items 4, 5, 6 */}
            <li role="none" className="gs-nav-narrow-more-item">
              <div className="gs-nav-more-wrapper" ref={moreRef}>
                <button
                  ref={moreTriggerRef}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setMoreDropdownOpen(!moreDropdownOpen);
                    setLangDropdownOpen(false);
                    setProfileDropdownOpen(false);
                    setNotifDropdownOpen(false);
                  }}
                  className={`gs-nav-more-btn ${isMoreActive ? 'has-active' : ''}`}
                  aria-haspopup="true"
                  aria-expanded={moreDropdownOpen}
                  title="More navigation options"
                >
                  <MoreHorizontal size={14} strokeWidth={2.2} aria-hidden="true" />
                  <span>More</span>
                  <ChevronDown size={11} className={`gs-more-chevron ${moreDropdownOpen ? 'rotated' : ''}`} aria-hidden="true" />
                </button>

                {moreDropdownOpen && (
                  <div 
                    className="gs-nav-more-menu"
                    role="menu"
                    aria-label="Secondary Navigation Options"
                  >
                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => handleNavClick('verifications')}
                      className={`gs-nav-more-item ${currentSection === 'verifications' ? 'active' : ''}`}
                      aria-current={currentSection === 'verifications' ? 'page' : undefined}
                    >
                      <ShieldCheck size={14} strokeWidth={2.2} color="var(--gs-accent)" aria-hidden="true" />
                      <span>{t.verifications}</span>
                    </button>

                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => handleNavClick('connections')}
                      className={`gs-nav-more-item ${currentSection === 'connections' ? 'active' : ''}`}
                      aria-current={currentSection === 'connections' ? 'page' : undefined}
                    >
                      <Users size={14} strokeWidth={2.2} color="var(--gs-accent)" aria-hidden="true" />
                      <span>{t.connections}</span>
                    </button>

                    <button
                      role="menuitem"
                      type="button"
                      onClick={() => handleNavClick('help')}
                      className={`gs-nav-more-item ${currentSection === 'help' ? 'active' : ''}`}
                      aria-current={currentSection === 'help' ? 'page' : undefined}
                    >
                      <HelpCircle size={14} strokeWidth={2.2} color="var(--gs-accent)" aria-hidden="true" />
                      <span>{t.help}</span>
                    </button>
                  </div>
                )}
              </div>
            </li>

            {/* 7. Saathi AI (Position 7 in Primary Navigation) */}
            <li role="none">
              <button
                role="menuitem"
                type="button"
                onClick={() => handleNavClick('saathi-ai')}
                className={`gs-nav-pill-link gs-nav-pill-link-saathi ${currentSection === 'saathi-ai' ? 'active' : ''}`}
                aria-current={currentSection === 'saathi-ai' ? 'page' : undefined}
                title={t.saathiAi}
              >
                <Sparkles size={14} strokeWidth={2.2} className="gs-saathi-spark" aria-hidden="true" />
                <span>{t.saathiAi}</span>
              </button>
            </li>
          </ul>
        </div>

        {/* =======================================================================
            ZONE 3: RIGHT ACTIONS & GLOBAL CONTROLS
            - Primary Action CTA: Listing Property
            - Real Notifications Popover (When Authenticated)
            - Accessible Language Switcher
            - Authentication & Profile Controls
            - Responsive Mobile Quick List & Hamburger (< 1024px)
            ======================================================================= */}
        <div className="gs-nav-pill-right-zone">
          {/* 1. Primary Action CTA ("Listing Property") (Desktop ≥ 1024px) */}
          <button
            type="button"
            onClick={() => handleNavClick('listing-property')}
            className={`gs-nav-pill-cta ${currentSection === 'listing-property' ? 'active' : ''}`}
            aria-current={currentSection === 'listing-property' ? 'page' : undefined}
            title={t.listingProperty}
          >
            <PlusCircle size={14} strokeWidth={2.4} aria-hidden="true" />
            <span className="gs-nav-pill-cta-text">{t.listingProperty}</span>
          </button>

          {/* 3. Real Notifications Popover (When Authenticated, Desktop & Mobile) */}
          {user && (
            <div className="gs-nav-dropdown" ref={notifRef}>
              <button
                ref={notifTriggerRef}
                type="button"
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setProfileDropdownOpen(false);
                  setLangDropdownOpen(false);
                  setMoreDropdownOpen(false);
                }}
                className="gs-notif-btn"
                aria-label={`Notifications: ${unreadCount} unread`}
                aria-expanded={notifDropdownOpen}
                aria-haspopup="true"
                title="View recent notifications"
              >
                <Bell size={16} strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="gs-notif-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div 
                  className="gs-dropdown-panel gs-notif-popover" 
                  role="region" 
                  aria-label="Recent notifications"
                >
                  <div className="gs-notif-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--gs-text-primary)' }}>
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
                        style={{ fontSize: '0.78rem', color: 'var(--gs-accent-bright)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="gs-notif-list">
                    {loadingNotifs ? (
                      <div style={{ padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--gs-text-muted)', fontSize: '0.85rem' }}>
                        Loading notifications...
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
                              <ShieldAlert size={16} color="#FBBF24" />
                            ) : notif.type.includes('visit') ? (
                              <Clock size={16} color="var(--gs-accent)" />
                            ) : notif.type.includes('connection') || notif.type.includes('message') ? (
                              <MessageSquare size={16} color="var(--gs-accent)" />
                            ) : (
                              <CheckCircle2 size={16} color="#34D399" />
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
                        <Bell size={28} style={{ margin: '0 auto 0.6rem', opacity: 0.35, color: 'var(--gs-accent)' }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gs-text-primary)' }}>All caught up!</div>
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
                        color: 'var(--gs-accent-bright)', 
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

          {/* 4. Accessible Language Switcher Dropdown */}
          <div className="gs-nav-dropdown gs-nav-lang-dropdown" ref={langRef}>
            <button
              ref={langTriggerRef}
              type="button"
              onClick={() => {
                setLangDropdownOpen(!langDropdownOpen);
                setProfileDropdownOpen(false);
                setNotifDropdownOpen(false);
                setMoreDropdownOpen(false);
              }}
              className="gs-dropdown-trigger"
              aria-label={`Language selector. Current language: ${languageLabels[language].label}`}
              aria-expanded={langDropdownOpen}
              aria-haspopup="true"
              title="Select interface language"
            >
              <Globe size={14} color="var(--gs-accent-bright)" strokeWidth={2} />
              <span className="gs-lang-code">{languageLabels[language].code}</span>
              <ChevronDown size={11} color="var(--gs-text-muted)" />
            </button>

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
                      {isCurrent && <Check size={14} color="var(--gs-accent)" strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. User Authentication / Profile Dropdown */}
          {/* 5. Website Owner Profile Dropdown & Modal Access (Always Visible at Extreme Right) */}
          <div className="gs-nav-dropdown gs-nav-profile-dropdown" ref={profileRef}>
            <button
              ref={profileTriggerRef}
              type="button"
              onClick={() => {
                setProfileDropdownOpen(!profileDropdownOpen);
                setLangDropdownOpen(false);
                setNotifDropdownOpen(false);
                setMoreDropdownOpen(false);
              }}
              className="gs-profile-btn"
              aria-label={`Website Owner Profile menu for ${user?.fullName || 'Website Owner'}`}
              aria-expanded={profileDropdownOpen}
              aria-haspopup="true"
              title="Website Owner / Administrator Profile & Settings"
            >
              <div className="gs-avatar-circle">
                {getInitials(user?.fullName, user?.identifier)}
              </div>
              <span className="gs-profile-name">
                {user?.fullName || 'Website Owner'}
              </span>
              <span className="gs-profile-role-badge">
                Owner
              </span>
              <ChevronDown size={11} color="var(--gs-text-muted)" />
            </button>

            {profileDropdownOpen && (
              <div 
                className="gs-dropdown-panel" 
                style={{ width: '280px' }} 
                role="menu"
                aria-label="User Account Commands"
              >
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--gs-border)', backgroundColor: 'var(--gs-surface-elevated)' }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--gs-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.fullName || 'Website Owner'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.identifier || user?.email || 'sharma108saransh@gmail.com'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.45rem' }}>
                    <span className="gs-badge gs-badge-verified" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                      Website Owner / Administrator
                    </span>
                  </div>
                </div>

                <div style={{ padding: '0.35rem 0' }}>
                  {/* Dedicated Profile & Settings Action */}
                  <button
                    type="button"
                    role="menuitem"
                    className="gs-dropdown-item"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenProfile?.();
                    }}
                    style={{ color: '#34D399', fontWeight: 600 }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <User size={15} color="#34D399" />
                      <span>Personal Profile & Settings</span>
                    </span>
                    <ChevronRight size={13} color="var(--gs-text-muted)" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className="gs-dropdown-item"
                    onClick={() => handleNavClick('dashboard')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <LayoutDashboard size={15} color="var(--gs-accent)" />
                      <span>My Dashboard</span>
                    </span>
                    <ChevronRight size={13} color="var(--gs-text-muted)" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className="gs-dropdown-item"
                    onClick={() => handleNavClick('connections')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <Users size={15} color="var(--gs-accent)" />
                      <span>Connections & Visits</span>
                    </span>
                    <ChevronRight size={13} color="var(--gs-text-muted)" />
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    className="gs-dropdown-item"
                    onClick={() => handleNavClick('listing-property')}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <PlusCircle size={15} color="var(--gs-accent)" />
                      <span>List Verified Property</span>
                    </span>
                    <ChevronRight size={13} color="var(--gs-text-muted)" />
                  </button>
                </div>

                <div className="gs-dropdown-divider" />

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
                        {switchingRole ? 'Switching...' : `Switch to ${(user?.activeRole || user?.role) === 'owner' ? 'Tenant' : 'Owner'} Mode`}
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 6. Tablet & Mobile Quick "List" Action (< 1024px) */}
          <button
            type="button"
            onClick={() => handleNavClick('listing-property')}
            className={`gs-mobile-quick-list-btn ${currentSection === 'listing-property' ? 'active' : ''}`}
            aria-label={t.listingProperty}
            title={t.listingProperty}
          >
            <PlusCircle size={14} strokeWidth={2.4} />
            <span>List</span>
          </button>

          {/* 7. Accessible Mobile Hamburger Button (< 1024px) */}
          <button
            ref={mobileToggleRef}
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="gs-nav-pill-hamburger"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* =========================================================================
          ANIMATED SLIDE-OVER GLASS DRAWER (< 1024px)
          Organized into Discovery, Operations, and Account/Support blocks.
          Strictly ≥ 44px × 44px touch targets.
          ========================================================================= */}
      {mobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="gs-mobile-backdrop"
            aria-hidden="true"
          />
          <div
            id="mobile-nav-menu"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
            className="gs-mobile-drawer"
          >
            {/* Drawer Header */}
            <div className="gs-mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <img
                  src={grihaSaathiLogo}
                  alt="Griha Saathi"
                  className="gs-nav-heritage-logo gs-nav-heritage-logo-mobile"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  width={55}
                  height={34}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/griha-saathi-logo.png';
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'var(--gs-font-heading)', fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem', lineHeight: 1.1 }}>
                    GRIHA SAATHI
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="gs-modal-close"
                style={{ position: 'static', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Close navigation menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Website Owner Profile Banner (Mobile) */}
            <div className="gs-mobile-user-card" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div className="gs-avatar-circle" style={{ width: 40, height: 40, fontSize: '0.88rem' }}>
                    {getInitials(user?.fullName, user?.identifier)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {user?.fullName || 'Website Owner'}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6EE7B7', fontWeight: 600, textTransform: 'uppercase' }}>
                      Website Owner / Admin
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile?.();
                  }}
                  style={{
                    backgroundColor: 'rgba(52, 211, 153, 0.2)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    color: '#6EE7B7',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Profile
                </button>
              </div>
            </div>

            {/* Primary Action Mobile Banner */}
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => handleNavClick('listing-property')}
                className="gs-nav-pill-cta"
                style={{ width: '100%', minHeight: 46, justifyContent: 'center', borderRadius: 9999 }}
              >
                <PlusCircle size={16} strokeWidth={2.4} />
                <span>{t.listingProperty}</span>
                <ArrowUpRight size={14} strokeWidth={2.2} />
              </button>
            </div>

            {/* BLOCK 1: DISCOVERY */}
            <div className="gs-mobile-nav-block">
              <span className="gs-mobile-block-title">Discovery</span>
              <div className="gs-mobile-block-items">
                <button
                  type="button"
                  onClick={() => handleNavClick('home')}
                  className={`gs-mobile-nav-btn ${currentSection === 'home' ? 'active' : ''}`}
                  aria-current={currentSection === 'home' ? 'page' : undefined}
                >
                  <Home size={17} strokeWidth={2} />
                  <span>{t.home}</span>
                  {currentSection === 'home' && <span className="gs-mobile-active-dot" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('find-property')}
                  className={`gs-mobile-nav-btn ${currentSection === 'find-property' ? 'active' : ''}`}
                  aria-current={currentSection === 'find-property' ? 'page' : undefined}
                >
                  <Search size={17} strokeWidth={2} />
                  <span>{t.findProperty}</span>
                  {currentSection === 'find-property' && <span className="gs-mobile-active-dot" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('dashboard')}
                  className={`gs-mobile-nav-btn ${currentSection === 'dashboard' ? 'active' : ''}`}
                  aria-current={currentSection === 'dashboard' ? 'page' : undefined}
                >
                  <LayoutDashboard size={17} strokeWidth={2} />
                  <span>{t.dashboard}</span>
                  {currentSection === 'dashboard' && <span className="gs-mobile-active-dot" />}
                </button>
              </div>
            </div>

            {/* BLOCK 2: OPERATIONS */}
            <div className="gs-mobile-nav-block">
              <span className="gs-mobile-block-title">Operations</span>
              <div className="gs-mobile-block-items">
                <button
                  type="button"
                  onClick={() => handleNavClick('verifications')}
                  className={`gs-mobile-nav-btn ${currentSection === 'verifications' ? 'active' : ''}`}
                  aria-current={currentSection === 'verifications' ? 'page' : undefined}
                >
                  <ShieldCheck size={17} strokeWidth={2} />
                  <span>{t.verifications}</span>
                  {currentSection === 'verifications' && <span className="gs-mobile-active-dot" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('connections')}
                  className={`gs-mobile-nav-btn ${currentSection === 'connections' ? 'active' : ''}`}
                  aria-current={currentSection === 'connections' ? 'page' : undefined}
                >
                  <Users size={17} strokeWidth={2} />
                  <span>{t.connections}</span>
                  {currentSection === 'connections' && <span className="gs-mobile-active-dot" />}
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('saathi-ai')}
                  className={`gs-mobile-nav-btn ${currentSection === 'saathi-ai' ? 'active' : ''}`}
                  aria-current={currentSection === 'saathi-ai' ? 'page' : undefined}
                >
                  <Sparkles size={17} strokeWidth={2} color="#34D399" />
                  <span>{t.saathiAi}</span>
                  <span className="gs-badge gs-badge-emerald" style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>AI</span>
                  {currentSection === 'saathi-ai' && <span className="gs-mobile-active-dot" />}
                </button>
              </div>
            </div>

            {/* BLOCK 3: ACCOUNT & SUPPORT */}
            <div className="gs-mobile-nav-block">
              <span className="gs-mobile-block-title">Account & Support</span>
              <div className="gs-mobile-block-items">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile?.();
                  }}
                  className="gs-mobile-nav-btn"
                  style={{ color: '#6EE7B7' }}
                >
                  <User size={17} strokeWidth={2} />
                  <span>Personal Profile & Settings</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleNavClick('help')}
                  className={`gs-mobile-nav-btn ${currentSection === 'help' ? 'active' : ''}`}
                  aria-current={currentSection === 'help' ? 'page' : undefined}
                >
                  <HelpCircle size={17} strokeWidth={2} />
                  <span>{t.help}</span>
                  {currentSection === 'help' && <span className="gs-mobile-active-dot" />}
                </button>

                {/* Mobile Language Selector */}
                <div style={{ padding: '0.65rem 0.5rem 0.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gs-text-muted)', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                    Language / भाषा
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                    {(['en', 'hi', 'hi-en'] as SupportedLanguage[]).map((langKey) => (
                      <button
                        key={langKey}
                        type="button"
                        onClick={() => onLanguageChange(langKey)}
                        style={{
                          minHeight: 44,
                          padding: '0.45rem 0.35rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: language === langKey ? 700 : 500,
                          backgroundColor: language === langKey ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                          color: language === langKey ? '#6EE7B7' : '#E2E8F0',
                          border: language === langKey ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                          textAlign: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        {languageLabels[langKey].code}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mobile Role Switcher (If Authenticated) */}
                {user && (
                  <button
                    type="button"
                    disabled={switchingRole}
                    onClick={handleRoleSwitch}
                    className="gs-mobile-nav-btn"
                    style={{ marginTop: '0.35rem' }}
                  >
                    <RotateCcw size={17} strokeWidth={2} />
                    <span>
                      {switchingRole ? 'Switching...' : `Switch to ${(user.activeRole || user.role) === 'owner' ? 'Tenant' : 'Owner'} Mode`}
                    </span>
                  </button>
                )}

                {/* Mobile Sign Out (If Authenticated) */}
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignOut();
                    }}
                    className="gs-mobile-nav-btn"
                    style={{ color: '#F87171', marginTop: '0.35rem' }}
                  >
                    <LogOut size={17} strokeWidth={2} />
                    <span>{t.logout || 'Sign Out'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
};
