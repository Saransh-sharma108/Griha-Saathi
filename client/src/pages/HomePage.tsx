import React, { useState } from 'react';
import { NavSection } from '../components/Header';
import { SupportedLanguage, Property, PropertyComparisonItem } from '@shared/types';
import { CinematicArchitecturalHero } from '../components/CinematicArchitecturalHero';
import { TrustValueSection } from '../components/TrustValueSection';
import { HomeDNAStudio } from '../components/homeDna/HomeDNAStudio';
import { PropertyComparisonModal } from '../components/PropertyComparisonModal';
import { Scale, X, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

interface HomePageProps {
  onNavigate?: (section: NavSection) => void;
  language?: SupportedLanguage;
  onSearch?: (params: { 
    state: string; 
    propertyType: string; 
    maxRent: string; 
    city?: string; 
    locality?: string;
  }) => void;
}

/**
 * HomePage Component — Griha Saathi
 * 
 * Features a stationary full-page viewport-fixed background layer
 * rendering the cinematic twilight landscape image (natural_horizon_bg.jpg)
 * behind all homepage content.
 * 
 * Foreground content (Cinematic Architectural Hero & Home DNA Studio)
 * scrolls normally while the background remains visually fixed and continuous.
 */
export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  language = 'en',
  onSearch,
}) => {
  // Live comparison state across verified properties
  const [compareList, setCompareList] = useState<Property[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [scheduledNotice, setScheduledNotice] = useState<string | null>(null);

  // Smooth scroll to Home DNA Studio when triggered from hero or actions
  const handleScrollToDna = () => {
    const el = document.getElementById('home-dna-studio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const firstControl = document.getElementById('dna-budget-flex');
      if (firstControl) firstControl.focus();
    }
  };

  // Toggle compare selection (up to 4 properties)
  const handleToggleCompare = (property: Property) => {
    setCompareList((prev) => {
      const exists = prev.some((p) => p.id === property.id);
      if (exists) {
        return prev.filter((p) => p.id !== property.id);
      }
      if (prev.length >= 4) {
        alert('You can compare a maximum of 4 properties side-by-side.');
        return prev;
      }
      return [...prev, property];
    });
  };

  // Schedule visit action handler with user confirmation
  const handleScheduleVisit = (property: Property) => {
    setScheduledNotice(`Direct visit request recorded for ${property.title} in ${property.locality || property.city}. State Registry & Landlord verified.`);
    setTimeout(() => {
      setScheduledNotice(null);
    }, 6000);
  };

  // Format properties into PropertyComparisonItem format for the side-by-side comparison modal
  const comparisonItems: PropertyComparisonItem[] = compareList.map((p) => ({
    propertyId: p.id,
    title: p.title,
    rentOrPrice: `₹${p.rentPerMonth?.toLocaleString('en-IN') || 0}/mo`,
    propertyType: p.propertyType,
    area: `${p.areaSqFt || 0} sq.ft`,
    bedrooms: `${p.bedrooms || 0} BHK`,
    bathrooms: `${p.bathrooms || 0}`,
    furnishing: p.furnishing || 'Unspecified',
    amenities: p.amenities || [],
    location: `${p.locality ? p.locality + ', ' : ''}${p.city}, ${p.state}`,
    availability: p.availableFrom || 'Immediate',
    verificationStatus: p.verificationStatus,
    lastUpdated: p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : 'Audited',
  }));

  return (
    <div className="gs-homepage-root" id="homepage-root">
      {/* =====================================================================
          SCROLLING FOREGROUND CONTENT LAYER
          Inherits the single authoritative global stationary background
          mounted at the root in App.tsx.
          ===================================================================== */}
      <div className="gs-homepage-foreground" id="homepage-foreground">
        {/* 1. Cinematic Architectural Stage Hero — “Your Peace Deserves an Address.” */}
        <CinematicArchitecturalHero
          onNavigate={onNavigate || (() => {})}
          onBuildDnaClick={handleScrollToDna}
          onSearch={onSearch}
          language={language}
        />

        {/* 2. Trust-First Value Proposition Section */}
        <TrustValueSection
          onNavigate={onNavigate || (() => {})}
          onScrollToDna={handleScrollToDna}
          language={language}
        />

        {/* 3. Signature Home DNA Studio Section */}
        <HomeDNAStudio
          onNavigate={onNavigate || (() => {})}
          language={language}
          onScheduleVisit={handleScheduleVisit}
          onToggleCompare={handleToggleCompare}
          compareList={compareList}
        />

        {/* 3. Bottom Signature Strip (Brand & Legal Integrity) */}
        <div 
          className="gs-homepage-bottom-strip"
          id="homepage-bottom-strip"
        >
          <div className="gs-bottom-strip-container">
            <div className="gs-bottom-strip-badge">
              <ShieldCheck size={16} color="#52B788" />
              <span>GRIHA SAATHI • STRICT ZERO-SYNTHETIC PROPERTY POLICY</span>
            </div>
            <p className="gs-bottom-strip-text">
              All candidate residences evaluated by Home DNA Studio are audited against state revenue registries:
              Delhi (DORIS) • Haryana (Jamabandi/HALRIS) • Punjab (PLRS Fard Kendra) • Himachal Pradesh (Himbhoomi) • J&amp;K (Aapki Zameen).
            </p>
            <div className="gs-bottom-strip-legal">
              &copy; 2026 Griha Saathi. Governed by Model Tenancy Act 2021, RERA 2016 &amp; DPDP Act 2023.
            </div>
          </div>
        </div>
      </div>

      {/* 4. Visit Scheduled Toast Notification */}
      {scheduledNotice && (
        <div
          role="status"
          aria-live="polite"
          className="gs-visit-toast"
        >
          <CheckCircle2 size={20} color="#52B788" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1, fontSize: '0.88rem', lineHeight: 1.45 }}>
            <strong style={{ display: 'block', color: '#DCFCE7', marginBottom: '2px' }}>Visit Request Submitted</strong>
            {scheduledNotice}
          </div>
          <button
            type="button"
            onClick={() => setScheduledNotice(null)}
            style={{ background: 'none', border: 'none', color: '#A3B8AC', cursor: 'pointer', padding: 0 }}
            aria-label="Dismiss notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 5. Floating Property Comparison Dock */}
      {compareList.length > 0 && (
        <div
          className="gs-floating-compare-dock"
          id="home-floating-compare-dock"
          role="region"
          aria-label="Property comparison dock"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FFFFFF', fontSize: '0.88rem', fontWeight: 700 }}>
              <Scale size={16} color="#52B788" />
              <span>Comparing <strong style={{ color: '#DCFCE7' }}>{compareList.length}</strong> / 4</span>
            </div>
            <span className="gs-compare-tagline" style={{ fontSize: '0.76rem', color: '#A3B8AC', fontStyle: 'italic' }}>
              Good homes deserve good comparisons.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {compareList.map((p) => (
              <span
                key={p.id}
                className="gs-compare-pill"
                title={p.title}
              >
                {p.title.split(' ')[0]}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCompareModalOpen(true)}
            className="gs-btn gs-btn-primary"
            id="home-compare-now-btn"
            style={{
              background: '#1D4A36',
              color: '#FFFFFF',
              border: '1px solid #52B788',
              borderRadius: '9999px',
              padding: '0.45rem 1.15rem',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>Compare Now</span>
            <ArrowRight size={13} />
          </button>

          <button
            type="button"
            onClick={() => setCompareList([])}
            className="gs-compare-clear-btn"
            title="Clear comparison list"
            aria-label="Clear all compared properties"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 6. Side-by-Side Property Comparison Modal */}
      <PropertyComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        items={comparisonItems}
        language={language}
      />
    </div>
  );
};
