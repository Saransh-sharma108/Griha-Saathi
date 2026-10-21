import React, { useState, useEffect } from 'react';
import { Header, NavSection } from './components/Header';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  // Verify existing session on load if session token is in sessionStorage
  useEffect(() => {
    const savedToken = sessionStorage.getItem('gs_session_token');
    if (savedToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            setToken(savedToken);
          } else {
            sessionStorage.removeItem('gs_session_token');
          }
        })
        .catch(() => {
          sessionStorage.removeItem('gs_session_token');
        });
    }
  }, []);

  const handleAuthSuccess = (authenticatedUser: UserProfile, sessionToken: string) => {
    setUser(authenticatedUser);
    setToken(sessionToken);
    sessionStorage.setItem('gs_session_token', sessionToken);
  };

  const handleSignOut = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // Ignore network errors on signout
      }
    }
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('gs_session_token');
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
        onOpenAuth={() => setIsAuthModalOpen(true)}
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
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {currentSection === 'verifications' && (
          <VerificationsPage language={language} />
        )}

        {currentSection === 'connections' && (
          <ConnectionsPage
            user={user}
            token={token}
            onOpenAuth={() => setIsAuthModalOpen(true)}
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
            onOpenAuth={() => setIsAuthModalOpen(true)}
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
            onOpenAuth={() => setIsAuthModalOpen(true)}
            language={language}
            onUserUpdate={setUser}
            onNavigate={handleNavigate}
          />
        )}

        {currentSection === 'listing-property' && (
          <ListingPropertyPage
            user={user}
            token={token}
            onOpenAuth={() => setIsAuthModalOpen(true)}
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

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        language={language}
      />
    </div>
  );
};
