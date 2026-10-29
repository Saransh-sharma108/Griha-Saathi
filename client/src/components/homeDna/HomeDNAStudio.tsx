import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  Search, 
  Info,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { 
  Property, 
  HomeDnaPreferences, 
  HomeDnaRequirements, 
  HomeDnaMatchResult, 
  SupportedLanguage 
} from '@shared/types';
import { 
  DEFAULT_HOME_DNA_PREFERENCES, 
  DEFAULT_HOME_DNA_REQUIREMENTS, 
  rankPropertiesWithHomeDna, 
  getSummaryDescriptors 
} from '@shared/homeDnaEngine';
import { PreferenceControl } from './PreferenceControl';
import { HomeDNASummary } from './HomeDNASummary';
import { SearchRequirements } from './SearchRequirements';
import { PropertyMatchResults } from './PropertyMatchResults';

interface HomeDNAStudioProps {
  onNavigate: (section: any) => void;
  language: SupportedLanguage;
  onScheduleVisit: (property: Property) => void;
  onToggleCompare: (property: Property) => void;
  compareList: Property[];
  onOpenPropertyDossier?: (property: Property) => void;
}

export const HomeDNAStudio: React.FC<HomeDNAStudioProps> = ({
  onNavigate,
  language,
  onScheduleVisit,
  onToggleCompare,
  compareList,
  onOpenPropertyDossier,
}) => {
  // 1. User Preference State (Initial Prototype Values: 45%, 65%, 80%)
  const [preferences, setPreferences] = useState<HomeDnaPreferences>(() => {
    try {
      const stored = localStorage.getItem('gs_home_dna_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          typeof parsed.budgetFlexibility === 'number' &&
          typeof parsed.livingSpacePriority === 'number' &&
          typeof parsed.locationPriority === 'number'
        ) {
          return parsed;
        }
      }
    } catch {}
    return { ...DEFAULT_HOME_DNA_PREFERENCES };
  });

  // 2. Real Search Requirements State (Hard constraints)
  const [requirements, setRequirements] = useState<HomeDnaRequirements>({
    ...DEFAULT_HOME_DNA_REQUIREMENTS,
  });

  // 3. Search Lifecycle & Live Real Properties from Backend
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Fetch genuine properties from backend API
  const loadProperties = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/properties?limit=50&onlyVerified=false');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to reach property registry.`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.properties)) {
        setAllProperties(data.properties);
      } else {
        setAllProperties([]);
      }
    } catch (err: any) {
      console.error('Home DNA Studio API Error:', err);
      setFetchError(err?.message || 'Failed to load verified property database');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle individual preference changes (Immediate recalculation)
  const handlePreferenceChange = (key: keyof HomeDnaPreferences, value: number) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reset to exact prototype defaults: 45%, 65%, 80%
  const handleResetPreferences = () => {
    setPreferences({ ...DEFAULT_HOME_DNA_PREFERENCES });
    try {
      localStorage.removeItem('gs_home_dna_preferences');
    } catch {}
  };

  // Reset search requirements
  const handleResetRequirements = () => {
    setRequirements({ ...DEFAULT_HOME_DNA_REQUIREMENTS });
    setValidationWarning(null);
  };

  // Save preferences to local storage
  const handleSavePreferences = () => {
    try {
      localStorage.setItem('gs_home_dna_preferences', JSON.stringify(preferences));
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2400);
    } catch {}
  };

  // Primary Discovery Action handler: Discover My Matches
  const handleDiscoverMatches = () => {
    // Validate requirements
    if (requirements.maxBudget !== undefined && requirements.maxBudget <= 0) {
      setValidationWarning('Please enter a valid positive budget or clear the input to search all tiers.');
      return;
    }
    setValidationWarning(null);
    setHasSearched(true);

    if (allProperties.length === 0) {
      loadProperties();
    }

    // Scroll smoothly to results
    setTimeout(() => {
      const el = document.getElementById('dna-results-anchor');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Run deterministic ranking computation whenever preferences, requirements, or properties change
  const { rankedResults, excludedCount } = useMemo(() => {
    if (!hasSearched || allProperties.length === 0) {
      return { rankedResults: [], excludedCount: 0 };
    }
    return rankPropertiesWithHomeDna(allProperties, preferences, requirements);
  }, [hasSearched, allProperties, preferences, requirements]);

  const descriptors = useMemo(() => getSummaryDescriptors(preferences), [preferences]);

  return (
    <section 
      className="gs-dna-studio-section" 
      id="home-dna-studio" 
      aria-labelledby="home-dna-studio-heading"
    >
      {/* Content wrapper rendered directly over continuous homepage Natural Horizon background */}

      <div className="gs-container gs-dna-content-wrapper">
        {/* =====================================================================
            A. COMPACT IDENTITY HEADER (Section 4.A)
            ===================================================================== */}
        <div className="gs-dna-studio-hero" style={{ marginBottom: '2.25rem', textAlign: 'center' }}>
          <div className="gs-dna-badge-pill" style={{ marginBottom: '0.85rem' }}>
            <Sparkles size={14} color="#45D6A0" />
            <span>HOME DNA STUDIO &bull; YOUR LIFE. YOUR VIBE. YOUR KIND OF HOME.</span>
          </div>

          <h1 
            className="gs-dna-headline" 
            id="home-dna-studio-heading"
            style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', letterSpacing: '-0.025em', marginBottom: '0.65rem' }}
          >
            Discover what makes a home right for you.
          </h1>

          <p 
            className="gs-dna-lead-copy"
            style={{ fontSize: '1.05rem', color: 'var(--gs-text-secondary)', maxWidth: '680px', margin: '0 auto 1.25rem auto', lineHeight: 1.55 }}
          >
            Your life. Your vibe. Your kind of home. Set your priorities, understand the trade-offs, and explore homes using genuine property records.
          </p>

          {/* Clarity Guarantee Callout */}
          <div className="gs-dna-clarity-strip" role="note" style={{ maxWidth: '780px', margin: '0 auto' }}>
            <Info size={14} color="var(--gs-forest-primary)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Hard Constraints vs Preference Weights:</strong> Hard constraints define which properties are eligible. Preference weights determine how eligible properties are compared and ranked.
            </span>
          </div>
        </div>

        {/* =====================================================================
            B. THREE PRIMARY PREFERENCE CONTROLS & C. LIVE PREFERENCE PROFILE
            ===================================================================== */}
        <div className="gs-dna-studio-main-grid">
          {/* Left Column: 3 Accessible Sliders */}
          <div className="gs-dna-controls-col">
            <div className="gs-dna-controls-title-row">
              <h2 className="gs-dna-subheading" style={{ fontSize: '1.18rem', margin: 0 }}>
                1. Calibrate Your Priorities
              </h2>
              <span className="gs-dna-subheading-note">Immediate live recalculation</span>
            </div>

            {/* Slider 1: Budget Flexibility — 45% */}
            <PreferenceControl
              id="dna-budget-flex"
              label="Budget Flexibility"
              question="How flexible is your budget?"
              value={preferences.budgetFlexibility}
              defaultValue={DEFAULT_HOME_DNA_PREFERENCES.budgetFlexibility}
              iconType="budget"
              descriptor={descriptors.budgetDescriptor}
              explanation="Controls your willingness to consider different price points within your actual budget constraints. A higher preference weight does not authorize the system to exceed a hard budget limit."
              tradeoffNote="Relative preference strength only — hard ceiling budget is strictly enforced."
              onChange={(val) => handlePreferenceChange('budgetFlexibility', val)}
              onReset={() => handlePreferenceChange('budgetFlexibility', DEFAULT_HOME_DNA_PREFERENCES.budgetFlexibility)}
            />

            {/* Slider 2: Living Space Priority — 65% */}
            <PreferenceControl
              id="dna-living-space"
              label="Living Space Priority"
              question="How much does extra space matter?"
              value={preferences.livingSpacePriority}
              defaultValue={DEFAULT_HOME_DNA_PREFERENCES.livingSpacePriority}
              iconType="space"
              descriptor={descriptors.spaceDescriptor}
              explanation="Represents the importance of space, layout, and area when comparing suitable properties."
              tradeoffNote="Evaluates genuine reported area and configuration; never converts into a fabricated sq.ft threshold."
              onChange={(val) => handlePreferenceChange('livingSpacePriority', val)}
              onReset={() => handlePreferenceChange('livingSpacePriority', DEFAULT_HOME_DNA_PREFERENCES.livingSpacePriority)}
            />

            {/* Slider 3: Location Priority — 80% */}
            <PreferenceControl
              id="dna-location-priority"
              label="Location Priority"
              question="How strongly should location influence ranking?"
              value={preferences.locationPriority}
              defaultValue={DEFAULT_HOME_DNA_PREFERENCES.locationPriority}
              iconType="location"
              descriptor={descriptors.locationDescriptor}
              explanation="Represents how strongly location fit should influence the ranking of otherwise eligible properties."
              tradeoffNote="Grounded in actual geographic records; does not fabricate commute times or synthetic distance scores."
              onChange={(val) => handlePreferenceChange('locationPriority', val)}
              onReset={() => handlePreferenceChange('locationPriority', DEFAULT_HOME_DNA_PREFERENCES.locationPriority)}
            />
          </div>

          {/* Right Column: Live Personalized Summary & Priorities Made Clear */}
          <div className="gs-dna-summary-col">
            <div className="gs-dna-controls-title-row">
              <h2 className="gs-dna-subheading" style={{ fontSize: '1.18rem', margin: 0 }}>
                2. Live Preference Profile
              </h2>
              <span className="gs-dna-subheading-note">Normalized priority balance</span>
            </div>

            <HomeDNASummary
              preferences={preferences}
              onResetAll={handleResetPreferences}
              onSavePreferences={handleSavePreferences}
              isSaved={isSavedNotice}
            />
          </div>
        </div>

        {/* =====================================================================
            D. REAL-WORLD REQUIREMENTS (HARD CONSTRAINTS) & DISCOVERY ACTION
            ===================================================================== */}
        <div style={{ marginTop: '2.5rem' }}>
          <SearchRequirements
            requirements={requirements}
            onChange={(updated) => setRequirements((prev) => ({ ...prev, ...updated }))}
            onResetRequirements={handleResetRequirements}
            totalCandidateCount={allProperties.length > 0 ? allProperties.length : undefined}
            onDiscoverMatches={handleDiscoverMatches}
            hasSearched={hasSearched}
            isSearching={loading}
            validationWarning={validationWarning}
          />
        </div>

        {/* =====================================================================
            E. EXPLAINABLE TRADE-OFFS & F. REAL PROPERTY RESULTS
            ===================================================================== */}
        <div id="dna-results-anchor" style={{ marginTop: '2.5rem' }}>
          {!hasSearched ? (
            /* Initial State: Prompt card inviting the user to trigger discovery */
            <div 
              className="gs-dna-initial-card"
              id="dna-initial-state-card"
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(72, 201, 149, 0.15)', border: '1px solid var(--gs-border)', color: 'var(--gs-accent-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Sparkles size={24} color="var(--gs-accent-bright)" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gs-text-primary)', marginBottom: '0.45rem' }}>
                Ready to find homes tailored to your priorities?
              </h3>
              <p style={{ fontSize: '0.92rem', color: 'var(--gs-text-secondary)', maxWidth: '620px', margin: '0 auto 1.5rem auto', lineHeight: 1.6 }}>
                Set your 3 living priorities above and define your non-negotiable boundaries. Select <strong>Discover My Matches</strong> to cross-reference verified properties against your Home DNA.
              </p>
              <button
                type="button"
                onClick={handleDiscoverMatches}
                className="gs-btn gs-btn-primary gs-btn-lg"
                style={{
                  background: 'linear-gradient(135deg, #1D4A36 0%, #11261B 100%)',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  padding: '0.75rem 2.25rem',
                  fontSize: '0.96rem',
                  fontWeight: 800,
                  boxShadow: '0 6px 22px rgba(29, 74, 54, 0.35)',
                  border: '1px solid rgba(165, 216, 165, 0.45)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  cursor: 'pointer'
                }}
                id="dna-initial-discover-btn"
              >
                <Sparkles size={16} color="#A5D8A5" />
                <span>Discover My Matches</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* Results State: Real verified property results or honest empty/error feedback */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.92rem', fontWeight: 700, color: 'var(--gs-text-primary)' }}>
                  <CheckCircle2 size={16} color="#52B788" />
                  <span>
                    {loading 
                      ? 'Querying revenue-audited registry records...' 
                      : rankedResults.length > 0 
                        ? `Showing ${rankedResults.length} verified residences ranked by your Home DNA`
                        : 'Evaluation completed'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('home-dna-studio');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="gs-btn gs-btn-secondary gs-btn-sm"
                  style={{ borderRadius: '9999px', fontSize: '0.8rem' }}
                >
                  <span>Adjust Priorities / Boundaries</span>
                </button>
              </div>

              <PropertyMatchResults
                results={rankedResults}
                loading={loading}
                error={fetchError}
                requirements={requirements}
                onRetry={loadProperties}
                onSelectProperty={(prop) => {
                  if (onOpenPropertyDossier) {
                    onOpenPropertyDossier(prop);
                  } else {
                    onNavigate('find-property');
                  }
                }}
                onScheduleVisit={onScheduleVisit}
                onToggleCompare={onToggleCompare}
                onResetFilters={handleResetRequirements}
                compareList={compareList}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

