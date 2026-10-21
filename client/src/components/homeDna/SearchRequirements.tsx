import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Coins, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal, 
  Bed, 
  Home as HomeIcon, 
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import { HomeDnaRequirements, TargetState, PropertyType, FurnishingStatus } from '@shared/types';

interface SearchRequirementsProps {
  requirements: HomeDnaRequirements;
  onChange: (updated: Partial<HomeDnaRequirements>) => void;
  onResetRequirements: () => void;
  totalCandidateCount?: number;
  onDiscoverMatches?: () => void;
  hasSearched?: boolean;
  isSearching?: boolean;
  validationWarning?: string | null;
}

export const SearchRequirements: React.FC<SearchRequirementsProps> = ({
  requirements,
  onChange,
  onResetRequirements,
  totalCandidateCount,
  onDiscoverMatches,
  hasSearched = false,
  isSearching = false,
  validationWarning = null,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const handleBudgetChange = (val: string) => {
    if (!val || val.trim() === '') {
      setBudgetError(null);
      onChange({ maxBudget: undefined });
      return;
    }
    const num = Number(val);
    if (isNaN(num) || num < 0) {
      setBudgetError('Please enter a valid positive number');
      return;
    }
    if (num > 0 && num < 2000 && requirements.intent === 'rent') {
      setBudgetError('Monthly rental budget should be at least ₹2,000');
    } else {
      setBudgetError(null);
    }
    onChange({ maxBudget: num });
  };

  return (
    <div className="gs-dna-requirements-card" id="dna-requirements-section">
      <div className="gs-dna-requirements-header">
        <div>
          <div className="gs-dna-requirements-kicker">
            <ShieldCheck size={14} color="#1B4332" />
            <span>REAL SEARCH CONSTRAINTS</span>
          </div>
          <h3 className="gs-dna-requirements-title">Define Your Search Boundaries</h3>
          <p className="gs-dna-requirements-subtitle">
            Preferences guide the ranking, while hard constraints ensure results strictly match your non-negotiables.
          </p>
        </div>

        {/* Intent Switcher: Rent vs Buy */}
        <div className="gs-dna-intent-pills" role="radiogroup" aria-label="Transaction Type">
          <button
            type="button"
            role="radio"
            aria-checked={requirements.intent === 'rent'}
            onClick={() => onChange({ intent: 'rent' })}
            className={`gs-dna-intent-btn ${requirements.intent === 'rent' ? 'active' : ''}`}
            id="dna-intent-rent"
          >
            🏠 Rent
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={requirements.intent === 'buy'}
            onClick={() => onChange({ intent: 'buy' })}
            className={`gs-dna-intent-btn ${requirements.intent === 'buy' ? 'active' : ''}`}
            id="dna-intent-buy"
          >
            🔑 Buy
          </button>
        </div>
      </div>

      {/* Main 4 Primary Search Constraints Grid */}
      <div className="gs-dna-requirements-grid">
        {/* 1. Target Region (State Authority) */}
        <div className="gs-dna-field">
          <label htmlFor="dna-req-state" className="gs-dna-label">
            <MapPin size={14} color="var(--gs-forest-primary)" />
            <span>State / Jurisdiction</span>
          </label>
          <select
            id="dna-req-state"
            className="gs-dna-select"
            value={requirements.state}
            onChange={(e) => onChange({ state: e.target.value as TargetState | 'all' })}
          >
            <option value="all">All 5 Northern States</option>
            <option value="Delhi">Delhi (NCT • DORIS)</option>
            <option value="Haryana">Haryana (Jamabandi & HALRIS)</option>
            <option value="Punjab">Punjab (PLRS Fard Kendra)</option>
            <option value="Himachal Pradesh">Himachal Pradesh (Himbhoomi)</option>
            <option value="Jammu & Kashmir">Jammu & Kashmir (JaKeGA)</option>
          </select>
        </div>

        {/* 2. Specific Locality / Sub-Market */}
        <div className="gs-dna-field">
          <label htmlFor="dna-req-locality" className="gs-dna-label">
            <HomeIcon size={14} color="var(--gs-forest-primary)" />
            <span>Locality / Hub (Optional)</span>
          </label>
          <input
            id="dna-req-locality"
            type="text"
            className="gs-dna-input"
            placeholder="e.g. Saket, Sector 70, Cyber City"
            value={requirements.locality || ''}
            onChange={(e) => onChange({ locality: e.target.value })}
          />
        </div>

        {/* 3. Configuration */}
        <div className="gs-dna-field">
          <label htmlFor="dna-req-type" className="gs-dna-label">
            <Building size={14} color="var(--gs-forest-primary)" />
            <span>Configuration</span>
          </label>
          <select
            id="dna-req-type"
            className="gs-dna-select"
            value={requirements.propertyType}
            onChange={(e) => onChange({ propertyType: e.target.value as PropertyType | 'all' })}
          >
            <option value="all">All Configurations</option>
            <option value="1bhk">1 BHK Apartment</option>
            <option value="2bhk">2 BHK Apartment</option>
            <option value="3bhk">3 BHK Apartment</option>
            <option value="independent_house">Independent Floor / Villa</option>
            <option value="studio">Studio Apartment</option>
            <option value="pg_coliving">PG / Co-Living</option>
          </select>
        </div>

        {/* 4. Maximum Monthly Budget Hard Ceiling */}
        <div className="gs-dna-field">
          <label htmlFor="dna-req-budget" className="gs-dna-label">
            <Coins size={14} color="var(--gs-forest-primary)" />
            <span>Maximum Budget (₹{requirements.intent === 'rent' ? '/mo' : ''})</span>
          </label>
          <input
            id="dna-req-budget"
            type="number"
            className={`gs-dna-input ${budgetError ? 'input-error' : ''}`}
            placeholder={requirements.intent === 'rent' ? 'e.g. 35000' : 'e.g. 8500000'}
            value={requirements.maxBudget || ''}
            onChange={(e) => handleBudgetChange(e.target.value)}
            min={1000}
            step={1000}
          />
          {budgetError && <span className="gs-dna-field-error">{budgetError}</span>}
        </div>
      </div>

      {/* Progressive Disclosure Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gs-dna-advanced-toggle"
          aria-expanded={showAdvanced}
        >
          <SlidersHorizontal size={14} />
          <span>{showAdvanced ? 'Hide Additional Requirements' : 'Add Bedroom & Furnishing Requirements'}</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {totalCandidateCount !== undefined && (
          <div className="gs-dna-candidate-count">
            <span>Available Verified Homes: <strong>{totalCandidateCount}</strong></span>
          </div>
        )}
      </div>

      {/* Advanced Drawer */}
      {showAdvanced && (
        <div className="gs-dna-advanced-drawer">
          <div className="gs-dna-requirements-grid" style={{ marginTop: '0.5rem' }}>
            {/* Minimum Bedrooms */}
            <div className="gs-dna-field">
              <label htmlFor="dna-req-beds" className="gs-dna-label">
                <Bed size={14} color="var(--gs-forest-primary)" />
                <span>Minimum Bedrooms</span>
              </label>
              <select
                id="dna-req-beds"
                className="gs-dna-select"
                value={requirements.minBedrooms || ''}
                onChange={(e) => onChange({ minBedrooms: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">Any Bedrooms</option>
                <option value="1">At least 1 BHK</option>
                <option value="2">At least 2 BHK</option>
                <option value="3">At least 3 BHK</option>
                <option value="4">At least 4 BHK</option>
              </select>
            </div>

            {/* Furnishing Preference */}
            <div className="gs-dna-field">
              <label htmlFor="dna-req-furnishing" className="gs-dna-label">
                <Building size={14} color="var(--gs-forest-primary)" />
                <span>Furnishing Status</span>
              </label>
              <select
                id="dna-req-furnishing"
                className="gs-dna-select"
                value={requirements.furnishing || 'any'}
                onChange={(e) => onChange({ furnishing: e.target.value as FurnishingStatus | 'any' })}
              >
                <option value="any">Any Furnishing</option>
                <option value="fully_furnished">Fully Furnished</option>
                <option value="semi_furnished">Semi-Furnished</option>
                <option value="unfurnished">Unfurnished</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Validation Warning Alert if Any */}
      {validationWarning && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B91C1C', fontSize: '0.85rem', fontWeight: 600 }}>
          <AlertCircle size={16} color="#DC2626" />
          <span>{validationWarning}</span>
        </div>
      )}

      {/* Discovery Action Bar (Section 4.D) */}
      <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--gs-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>
            Step 2: Hard Non-Negotiable Boundaries
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-secondary)', marginTop: '0.15rem' }}>
            Hard constraints determine eligibility; preference weights determine relative ranking.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onResetRequirements}
            className="gs-btn gs-btn-secondary"
            style={{ borderRadius: '9999px', padding: '0.65rem 1.15rem', fontSize: '0.85rem' }}
            id="dna-reset-requirements-btn"
          >
            <RotateCcw size={14} />
            <span>Reset Boundaries</span>
          </button>

          {onDiscoverMatches && (
            <button
              type="button"
              onClick={onDiscoverMatches}
              disabled={isSearching}
              className="gs-btn gs-btn-primary gs-btn-lg"
              style={{
                background: 'linear-gradient(135deg, #1D4A36 0%, #11261B 100%)',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '0.7rem 1.75rem',
                fontSize: '0.94rem',
                fontWeight: 800,
                boxShadow: '0 4px 18px rgba(29, 74, 54, 0.35)',
                border: '1px solid rgba(165, 216, 165, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                cursor: 'pointer'
              }}
              id="dna-discover-matches-btn"
            >
              <Sparkles size={16} color="#A5D8A5" />
              <span>{isSearching ? 'Evaluating Properties...' : hasSearched ? 'Re-Evaluate Matches' : 'Discover My Matches'}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

