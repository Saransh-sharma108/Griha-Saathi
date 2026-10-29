import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  Building, 
  Sparkles, 
  MapPin, 
  Layers, 
  Home, 
  ArrowDown,
  Bed
} from 'lucide-react';
import { NavSection } from './Header';
import { SupportedLanguage } from '@shared/types';
import { translations } from '@shared/i18n';

interface CinematicArchitecturalHeroProps {
  onNavigate: (section: NavSection) => void;
  onBuildDnaClick?: () => void;
  onSearch?: (params: { 
    state: string; 
    propertyType: string; 
    maxRent: string; 
    city?: string; 
    locality?: string;
    bedrooms?: string;
  }) => void;
  language?: SupportedLanguage;
}

export const CinematicArchitecturalHero: React.FC<CinematicArchitecturalHeroProps> = ({
  onNavigate,
  onBuildDnaClick,
  onSearch,
  language = 'en',
}) => {
  const t = translations[language].home;

  // Search Console State
  const [selectedState, setSelectedState] = useState<string>('all');
  const [locationQuery, setLocationQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [selectedBedrooms, setSelectedBedrooms] = useState<string>('all');

  const handleBuildDna = () => {
    if (onBuildDnaClick) {
      onBuildDnaClick();
    } else {
      const el = document.getElementById('home-dna-studio');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        const firstControl = document.getElementById('dna-budget-flex');
        if (firstControl) firstControl.focus();
      }
    }
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        state: selectedState,
        propertyType: selectedCategory,
        maxRent: selectedBudget,
        city: locationQuery.trim() || undefined,
        locality: locationQuery.trim() || undefined,
        bedrooms: selectedBedrooms !== 'all' ? selectedBedrooms : undefined,
      });
    } else {
      onNavigate('find-property');
    }
  };

  const handleRegionPillClick = (stateName: string) => {
    if (onSearch) {
      onSearch({
        state: stateName,
        propertyType: 'all',
        maxRent: '',
      });
    } else {
      onNavigate('find-property');
    }
  };

  const targetRegions = [
    { name: 'Delhi', authority: 'DDA & DORIS', label: 'Delhi NCR' },
    { name: 'Haryana', authority: 'Jamabandi HALRIS', label: 'Haryana' },
    { name: 'Punjab', authority: 'PLRS Fard Kendra', label: 'Punjab' },
    { name: 'Himachal Pradesh', authority: 'Himbhoomi Portal', label: 'Himachal' },
    { name: 'Jammu & Kashmir', authority: 'Aapki Zameen', label: 'Jammu & Kashmir' },
  ];

  return (
    <section className="gs-cinematic-stage" aria-label="Griha Saathi Architectural Editorial Hero">
      <div className="gs-hero-editorial-container">
        
        {/* =====================================================================
            A. EYEBROW LABEL
            ===================================================================== */}
        <div className="gs-hero-kicker-wrapper">
          <div className="gs-hero-kicker" role="doc-subtitle">
            <Sparkles size={14} className="gs-hero-kicker-icon" />
            <span>{t.eyebrow || "A Better Way to Find Home."}</span>
          </div>
        </div>

        {/* =====================================================================
            B. MAIN HEADLINE — “Your Peace Deserves an Address.”
            ===================================================================== */}
        <h1 className="gs-hero-headline">
          Your Peace Deserves <br className="gs-hero-br" />
          <span className="gs-hero-headline-accent">an Address.</span>
        </h1>

        {/* =====================================================================
            C. SUPPORTING HEADLINE
            ===================================================================== */}
        <p className="gs-hero-supporting-headline">
          {t.supportingHeadline || "Find a place that feels right, fits your life, and makes coming home the best part of your day."}
        </p>

        {/* =====================================================================
            D. DESCRIPTIVE PARAGRAPH
            ===================================================================== */}
        <p className="gs-hero-sublead">
          {t.description || "Discover rental homes across Northern India. Compare property details, understand the costs, and know what has—and hasn't—been verified before making your move."}
        </p>

        {/* =====================================================================
            E, F, G. PRIMARY ACTIONS DOCK (Explore Homes, Find My Home DNA, List)
            ===================================================================== */}
        <div className="gs-stage-action-dock" role="group" aria-label="Primary Discovery Actions">
          <div className="gs-stage-dock-inner">
            {/* Primary Action E: Explore Homes → */}
            <button
              type="button"
              onClick={() => onNavigate('find-property')}
              className="gs-stage-btn-primary"
              id="stage-explore-homes-btn"
              title="Browse verified rental homes across Northern India"
            >
              <Search size={16} strokeWidth={2.5} />
              <span>{t.ctaFind || "Explore Homes →"}</span>
              <ArrowRight size={14} className="gs-stage-arrow" />
            </button>

            {/* Secondary Action F: Find My Home DNA */}
            <button
              type="button"
              onClick={handleBuildDna}
              className="gs-stage-btn-dna"
              id="stage-build-dna-btn"
              title="Calibrate your living preferences in Home DNA Studio"
            >
              <Sparkles size={15} color="#45D6A0" />
              <span>Find My Home DNA</span>
            </button>

            {/* Property Owner Action G: List Your Property */}
            <button
              type="button"
              onClick={() => onNavigate('listing-property')}
              className="gs-stage-btn-secondary"
              id="stage-list-property-btn"
              title="List your residential property for verification"
            >
              <Building size={15} color="#A3B8AC" />
              <span>{t.ctaList || "List Your Property"}</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            PHASE 4: INTEGRATED SEARCH CONSOLE
            Microcopy: "Let's find your place."
            ===================================================================== */}
        <div className="gs-hero-search-wrapper">
          <form 
            onSubmit={handleQuickSearchSubmit} 
            className="gs-hero-search-console" 
            role="search" 
            aria-label="Rental Property Search Console"
          >
            {/* Search Console Header */}
            <div className="gs-search-console-header">
              <div className="gs-search-console-title-group">
                <Home size={15} color="#45D6A0" />
                <span className="gs-search-console-title">
                  {t.searchHeading || "Let's find your place."}
                </span>
              </div>
              <span className="gs-search-console-badge">
                5 Northern Regions Active
              </span>
            </div>

            {/* Search Inputs Grid */}
            <div className="gs-hero-search-grid">
              
              {/* Field 1: Location (City, locality, or landmark) */}
              <div className="gs-hero-search-field gs-field-location">
                <label htmlFor="hero-location-input" className="gs-hero-field-label">
                  <MapPin size={13} color="#45D6A0" />
                  <span>Location</span>
                </label>
                <div className="gs-location-input-wrapper">
                  <input
                    id="hero-location-input"
                    type="text"
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    placeholder={t.locationPlaceholder || "City, locality, or landmark"}
                    className="gs-hero-input"
                    autoComplete="off"
                  />
                  <select
                    id="hero-region-select"
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="gs-hero-region-quick-select"
                    aria-label="Filter by state or region"
                    title="Select Northern India state"
                  >
                    <option value="all">All Regions</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jammu & Kashmir">Jammu & Kashmir</option>
                  </select>
                </div>
              </div>

              {/* Field 2: Property Type / Configuration */}
              <div className="gs-hero-search-field">
                <label htmlFor="hero-category-select" className="gs-hero-field-label">
                  <Layers size={13} color="#45D6A0" />
                  <span>Property Type</span>
                </label>
                <select
                  id="hero-category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="gs-hero-select"
                >
                  <option value="all">Any Configuration</option>
                  <option value="1bhk">1 BHK Apartment</option>
                  <option value="2bhk">2 BHK Apartment</option>
                  <option value="3bhk">3 BHK Apartment</option>
                  <option value="4bhk_plus">4+ BHK Residence</option>
                  <option value="villa">Villa / Kothi</option>
                  <option value="independent_house">Independent House</option>
                </select>
              </div>

              {/* Field 3: Monthly Budget */}
              <div className="gs-hero-search-field">
                <label htmlFor="hero-budget-select" className="gs-hero-field-label">
                  <span style={{ color: '#E5A955', fontWeight: 800 }}>₹</span>
                  <span>{t.budgetLabel || "Monthly budget"}</span>
                </label>
                <select
                  id="hero-budget-select"
                  value={selectedBudget}
                  onChange={(e) => setSelectedBudget(e.target.value)}
                  className="gs-hero-select"
                >
                  <option value="">Any Monthly Budget</option>
                  <option value="20000">Up to ₹20,000 / mo</option>
                  <option value="35000">Up to ₹35,000 / mo</option>
                  <option value="50000">Up to ₹50,000 / mo</option>
                  <option value="80000">Up to ₹80,000 / mo</option>
                  <option value="150000">Up to ₹1,50,000 / mo</option>
                </select>
              </div>

              {/* Field 4: Bedrooms */}
              <div className="gs-hero-search-field gs-field-bedrooms">
                <label htmlFor="hero-bedrooms-select" className="gs-hero-field-label">
                  <Bed size={13} color="#45D6A0" />
                  <span>Bedrooms</span>
                </label>
                <select
                  id="hero-bedrooms-select"
                  value={selectedBedrooms}
                  onChange={(e) => setSelectedBedrooms(e.target.value)}
                  className="gs-hero-select"
                >
                  <option value="all">Any Bedrooms</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4+ BHK</option>
                </select>
              </div>

              {/* Field 5: Search Action */}
              <div className="gs-hero-search-action">
                <button
                  type="submit"
                  className="gs-hero-submit-btn"
                  id="hero-submit-search-btn"
                >
                  <Search size={16} strokeWidth={2.5} />
                  <span>{t.searchButton || "Explore Homes"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 6. Five-Region Authority Pill Bar */}
        <div className="gs-hero-region-bar" role="navigation" aria-label="Regional Revenue Registry Feeds">
          <span className="gs-hero-region-bar-title">Covered Northern Regions:</span>
          <div className="gs-hero-region-pills">
            {targetRegions.map((r) => (
              <button
                key={r.name}
                type="button"
                onClick={() => handleRegionPillClick(r.name)}
                className="gs-hero-region-pill"
                title={`Search verified rental properties in ${r.name} (${r.authority})`}
              >
                <span className="gs-hero-pill-dot" />
                <strong className="gs-hero-pill-name">{r.label}</strong>
                <span className="gs-hero-pill-auth">({r.authority})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 7. Subtle Cue to Home DNA Studio */}
        <div className="gs-hero-scroll-cue-wrapper">
          <button
            type="button"
            onClick={handleBuildDna}
            className="gs-hero-scroll-cue"
            aria-label="Scroll down to Home DNA Studio"
          >
            <span>{t.homeDnaTagline || "Your life. Your vibe. Your kind of home."}</span>
            <ArrowDown size={14} className="gs-hero-bounce-arrow" />
          </button>
        </div>

      </div>
    </section>
  );
};
