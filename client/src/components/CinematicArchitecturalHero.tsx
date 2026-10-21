import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  Building, 
  Sparkles, 
  ShieldCheck, 
  MapPin, 
  ChevronDown,
  Layers,
  ArrowDown
} from 'lucide-react';
import { NavSection } from './Header';
import { SupportedLanguage } from '@shared/types';

interface CinematicArchitecturalHeroProps {
  onNavigate: (section: NavSection) => void;
  onBuildDnaClick?: () => void;
  onSearch?: (params: { 
    state: string; 
    propertyType: string; 
    maxRent: string; 
    city?: string; 
    locality?: string;
  }) => void;
  language?: SupportedLanguage;
}

export const CinematicArchitecturalHero: React.FC<CinematicArchitecturalHeroProps> = ({
  onNavigate,
  onBuildDnaClick,
  onSearch,
  language = 'en',
}) => {
  // Quick Search Console State
  const [selectedState, setSelectedState] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBudget, setSelectedBudget] = useState<string>('');

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
        
        {/* 1. Official Editorial Eyebrow */}
        <div className="gs-hero-kicker-wrapper">
          <div className="gs-hero-kicker">
            <ShieldCheck size={14} className="gs-hero-kicker-icon" />
            <span>GRIHA SAATHI &bull; FIVE-REGION AUDITED PROPTECH</span>
          </div>
        </div>

        {/* 2. Headline & Hindi Tag */}
        <h1 className="gs-hero-headline">
          Direct, Audited Residences <br className="gs-hero-br" />
          <span className="gs-hero-headline-accent">Across Northern India.</span>
        </h1>

        <div className="gs-hero-devanagari-tag">
          गृह साथी &bull; आवास जो प्रमाणित है &bull; शून्य कृत्रिम डेटा नीति
        </div>

        {/* 3. Subtitle / Mission Statement */}
        <p className="gs-hero-sublead">
          Verified residential rentals across Delhi, Haryana, Punjab, Himachal Pradesh, and Jammu &amp; Kashmir.
          Every listing is cross-checked against official state revenue registries with guaranteed 60-day freshness and zero synthetic listings.
        </p>

        {/* 4. The 3 Established Primary Actions (Preserved & Recognizable) */}
        <div className="gs-stage-action-dock" role="group" aria-label="Primary Discovery Actions">
          <div className="gs-stage-dock-inner">
            {/* Action 1: Explore Homes */}
            <button
              type="button"
              onClick={() => onNavigate('find-property')}
              className="gs-stage-btn-primary"
              id="stage-explore-homes-btn"
            >
              <Search size={16} strokeWidth={2.5} />
              <span>Explore Homes</span>
              <ArrowRight size={14} />
            </button>

            {/* Action 2: Build My Home DNA */}
            <button
              type="button"
              onClick={handleBuildDna}
              className="gs-stage-btn-dna"
              id="stage-build-dna-btn"
            >
              <Sparkles size={15} color="#DCFCE7" />
              <span>Build My Home DNA</span>
            </button>

            {/* Action 3: List Your Property */}
            <button
              type="button"
              onClick={() => onNavigate('listing-property')}
              className="gs-stage-btn-secondary"
              id="stage-list-property-btn"
            >
              <Building size={15} color="#111310" />
              <span>List Your Property</span>
            </button>
          </div>
        </div>

        {/* 5. Precision Hero Quick-Search Console */}
        <form onSubmit={handleQuickSearchSubmit} className="gs-hero-search-console" role="search" aria-label="Quick Property Search">
          <div className="gs-hero-search-grid">
            {/* Region Field */}
            <div className="gs-hero-search-field">
              <label htmlFor="hero-region-select" className="gs-hero-field-label">
                <MapPin size={13} color="#52B788" />
                <span>Region / State</span>
              </label>
              <select
                id="hero-region-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="gs-hero-select"
              >
                <option value="all">All 5 Northern Regions</option>
                <option value="Delhi">Delhi NCR (DDA & DORIS)</option>
                <option value="Haryana">Haryana (Jamabandi)</option>
                <option value="Punjab">Punjab (PLRS Fard Kendra)</option>
                <option value="Himachal Pradesh">Himachal Pradesh (Himbhoomi)</option>
                <option value="Jammu & Kashmir">Jammu & Kashmir (Aapki Zameen)</option>
              </select>
            </div>

            {/* Property Category Field */}
            <div className="gs-hero-search-field">
              <label htmlFor="hero-category-select" className="gs-hero-field-label">
                <Layers size={13} color="#52B788" />
                <span>Configuration</span>
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

            {/* Maximum Budget Field */}
            <div className="gs-hero-search-field">
              <label htmlFor="hero-budget-select" className="gs-hero-field-label">
                <span style={{ color: '#E5A955', fontWeight: 800 }}>₹</span>
                <span>Max Monthly Rent</span>
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

            {/* Search Submit Action */}
            <div className="gs-hero-search-action">
              <button
                type="submit"
                className="gs-hero-submit-btn"
                id="hero-submit-search-btn"
              >
                <Search size={16} strokeWidth={2.5} />
                <span>Search Audited Homes</span>
              </button>
            </div>
          </div>
        </form>

        {/* 6. Five-Region Authority Pill Bar */}
        <div className="gs-hero-region-bar" role="navigation" aria-label="Regional Revenue Registry Feeds">
          <span className="gs-hero-region-bar-title">Authoritative Feeds:</span>
          <div className="gs-hero-region-pills">
            {targetRegions.map((r) => (
              <button
                key={r.name}
                type="button"
                onClick={() => handleRegionPillClick(r.name)}
                className="gs-hero-region-pill"
                title={`Search verified properties in ${r.name} (${r.authority})`}
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
            <span>Calibrate your residence preferences in Home DNA Studio</span>
            <ArrowDown size={14} className="gs-hero-bounce-arrow" />
          </button>
        </div>

      </div>
    </section>
  );
};
