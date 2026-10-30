import React, { useState, useEffect } from 'react';
import { Header, NavSection } from './components/Header';
import { Footer } from './components/Footer';
import { OwnerProfileModal } from './components/OwnerProfileModal';
import { HomePage } from './pages/HomePage';
import { FindPropertyPage } from './pages/FindPropertyPage';
import { VerificationsPage } from './pages/VerificationsPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { SaathiAiPage } from './pages/SaathiAiPage';
import { HelpPage } from './pages/HelpPage';
import { DashboardPage } from './pages/DashboardPage';
import { ListingPropertyPage } from './pages/ListingPropertyPage';
import { FloatingSaathiWidget } from './components/FloatingSaathiWidget';
import { SupportedLanguage, UserProfile } from '@shared/types';
import naturalHorizonBg from './assets/natural_horizon_bg.jpg';

export const App: React.FC = () => {
  const getInitialSection = (): NavSection => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace(/^#/, '');
      const validSections: NavSection[] = [
        'home', 'find-property', 'verifications', 'connections', 
        'saathi-ai', 'help', 'dashboard', 'listing-property'
      ];
      if (validSections.includes(hash as NavSection)) {
        return hash as NavSection;
      }
    }
    return 'home';
  };

  const getInitialLanguage = (): SupportedLanguage => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('gs_preferred_language');
      if (savedLang === 'en' || savedLang === 'hi' || savedLang === 'hi-en') {
        return savedLang;
      }
    }
    return 'en';
  };

  const [currentSection, setCurrentSection] = useState<NavSection>(getInitialSection);
  const [language, setLanguage] = useState<SupportedLanguage>(getInitialLanguage);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isOwnerProfileModalOpen, setIsOwnerProfileModalOpen] = useState(false);

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('gs_preferred_language', newLang);
    }
  };

  // Synchronize browser history and direct URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      const validSections: NavSection[] = [
        'home', 'find-property', 'verifications', 'connections', 
        'saathi-ai', 'help', 'dashboard', 'listing-property'
      ];
      if (validSections.includes(hash as NavSection)) {
        setCurrentSection(hash as NavSection);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Guarantee instant scroll reset to top on any section change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [currentSection]);

  // Search parameters passed from Home or Saathi AI to Find Property
  const [searchParams, setSearchParams] = useState<{
    state: string;
    propertyType: string;
    maxRent: string;
    city?: string;
    locality?: string;
  }>({
    state: 'all',
    propertyType: 'all',
    maxRent: '',
  });

  // Initialize Website Owner Profile and active session from persistent database
  useEffect(() => {
    const savedToken = localStorage.getItem('gs_session_token') || sessionStorage.getItem('gs_session_token');
    fetch('/api/owner/profile', {
      credentials: 'include',
      headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : undefined,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.profile) {
          const ownerUser: UserProfile = {
            id: data.profile.id,
            identifier: data.profile.email,
            email: data.profile.email,
            phone: data.profile.phone,
            fullName: data.profile.fullName,
            role: data.profile.role || 'owner',
            activeRole: data.profile.activeRole || 'owner',
            roles: data.profile.roles || ['owner', 'admin'],
            preferredLanguage: data.profile.preferredLanguage || 'en',
            notificationPreferences: data.profile.notificationPreferences,
            isPhoneVerified: Boolean(data.profile.phone),
            isEmailVerified: true,
            isIdentityVerified: true,
            accountStatus: 'active',
            accountType: data.profile.accountType,
            createdAt: data.profile.createdAt,
            updatedAt: data.profile.updatedAt,
          };
          setUser(ownerUser);
          const activeTok = data.sessionToken || savedToken;
          if (activeTok) {
            setToken(activeTok);
            localStorage.setItem('gs_session_token', activeTok);
            sessionStorage.setItem('gs_session_token', activeTok);
          }
        }
      })
      .catch((err) => {
        console.warn('[App] Owner profile load error:', err);
      });
  }, []);

  const handleProfileUpdated = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } catch (e) {
      // Ignore network errors on signout
    }
    // Re-synchronize clean owner profile from database
    fetch('/api/owner/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.profile) {
          setUser({
            id: d.profile.id,
            identifier: d.profile.email,
            email: d.profile.email,
            phone: d.profile.phone,
            fullName: d.profile.fullName,
            role: d.profile.role || 'owner',
            activeRole: d.profile.activeRole || 'owner',
            roles: d.profile.roles || ['owner', 'admin'],
            preferredLanguage: d.profile.preferredLanguage || 'en',
            notificationPreferences: d.profile.notificationPreferences,
            isPhoneVerified: Boolean(d.profile.phone),
            isEmailVerified: true,
            isIdentityVerified: true,
            accountStatus: 'active',
            accountType: d.profile.accountType,
            createdAt: d.profile.createdAt,
            updatedAt: d.profile.updatedAt,
          });
          if (d.sessionToken) {
            setToken(d.sessionToken);
            localStorage.setItem('gs_session_token', d.sessionToken);
          }
        }
      });
  };

  const handleHomeSearch = (filters: { state: string; propertyType: string; maxRent: string; city?: string; locality?: string }) => {
    setSearchParams(filters);
    handleNavigate('find-property');
  };

  const handleNavigate = (section: NavSection) => {
    setCurrentSection(section);
    if (typeof window !== 'undefined' && window.location.hash !== `#${section}`) {
      window.location.hash = section;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="gs-app-root">
      {/* WCAG 2.2 AA Skip Link for Keyboard Navigation */}
      <a href="#main-content" className="gs-skip-to-content">
        Skip to main content
      </a>

      {/* =====================================================================
          AUTHORITATIVE GLOBAL STATIONARY PHOTOGRAPHIC BACKGROUND LAYER
          Mounted once at the application root behind ALL routes and pages.
          Remains stationary during page scrolling.
          Zero route-transition flicker, zero repetition, zero seams.
          ===================================================================== */}
      <div className="gs-global-stationary-bg-layer" aria-hidden="true">
        <div 
          className="gs-global-stationary-bg-image" 
          style={{ backgroundImage: `url(${naturalHorizonBg})` }}
        />
        <div className="gs-global-stationary-bg-overlay" />
      </div>

      {/* Consistent Main Navigation Header */}
      <Header
        currentSection={currentSection}
        onNavigate={handleNavigate}
        language={language}
        onLanguageChange={handleLanguageChange}
        user={user}
        token={token}
        onOpenProfile={() => setIsOwnerProfileModalOpen(true)}
        onOpenAuth={() => setIsOwnerProfileModalOpen(true)}
        onSignOut={handleSignOut}
        onUserUpdate={setUser}
      />

      {/* Main Content Area: 8 Dedicated Sections */}
      <main id="main-content" className="gs-app-main-content">
        {currentSection === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            language={language}
            onSearch={handleHomeSearch}
          />
        )}

        {currentSection === 'find-property' && (
          <FindPropertyPage
            initialFilters={searchParams}
            language={language}
            onNavigate={handleNavigate}
            user={user}
            token={token}
            onOpenAuth={() => setIsOwnerProfileModalOpen(true)}
          />
        )}

        {currentSection === 'verifications' && (
          <VerificationsPage language={language} />
        )}

        {currentSection === 'connections' && (
          <ConnectionsPage
            user={user}
            token={token}
            onOpenAuth={() => setIsOwnerProfileModalOpen(true)}
            language={language}
          />
        )}

        {currentSection === 'saathi-ai' && (
          <SaathiAiPage
            language={language}
            onNavigate={handleNavigate}
            onSearchWithFilters={(filters) => {
              setSearchParams(filters);
              setCurrentSection('find-property');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAuth={() => setIsOwnerProfileModalOpen(true)}
            user={user}
            token={token}
          />
        )}

        {currentSection === 'help' && (
          <HelpPage language={language} />
        )}

        {currentSection === 'dashboard' && (
          <DashboardPage
            user={user}
            token={token}
            onOpenAuth={() => setIsOwnerProfileModalOpen(true)}
            language={language}
            onUserUpdate={setUser}
            onNavigate={handleNavigate}
          />
        )}

        {currentSection === 'listing-property' && (
          <ListingPropertyPage
            user={user}
            token={token}
            onOpenAuth={() => setIsOwnerProfileModalOpen(true)}
            onNavigate={handleNavigate}
            language={language}
          />
        )}
      </main>

      {/* Global Brand Footer */}
      <Footer onNavigate={handleNavigate} language={language} />

      {/* Persistent Floating Saathi Assistant Widget */}
      <FloatingSaathiWidget
        currentSection={currentSection}
        onNavigate={handleNavigate}
        language={language}
      />

      {/* Website Owner Personal Profile & Settings Modal */}
      <OwnerProfileModal
        isOpen={isOwnerProfileModalOpen}
        onClose={() => setIsOwnerProfileModalOpen(false)}
        language={language}
        onProfileUpdated={handleProfileUpdated}
        onLanguageChange={handleLanguageChange}
      />
    </div>
  );
};
