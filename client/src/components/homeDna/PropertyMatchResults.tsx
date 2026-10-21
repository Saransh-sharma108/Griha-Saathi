import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Coins, 
  CheckCircle2, 
  ArrowRight, 
  BadgeCheck, 
  ShieldCheck, 
  Scale, 
  Sparkles, 
  AlertCircle, 
  Calendar, 
  Maximize2, 
  Layers, 
  Info, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Property, HomeDnaMatchResult, HomeDnaRequirements } from '@shared/types';

interface PropertyMatchResultsProps {
  results: HomeDnaMatchResult[];
  loading: boolean;
  error: string | null;
  requirements: HomeDnaRequirements;
  onRetry: () => void;
  onSelectProperty: (property: Property) => void;
  onScheduleVisit: (property: Property) => void;
  onToggleCompare: (property: Property) => void;
  onResetFilters: () => void;
  compareList?: Property[];
}

export const PropertyMatchResults: React.FC<PropertyMatchResultsProps> = ({
  results,
  loading,
  error,
  requirements,
  onRetry,
  onSelectProperty,
  onScheduleVisit,
  onToggleCompare,
  onResetFilters,
  compareList = [],
}) => {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  const toggleDetails = (id: string) => {
    setExpandedMatchId((prev) => (prev === id ? null : id));
  };

  const formatPrice = (amount: number) => {
    if (!amount || isNaN(amount)) return 'Price on request';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // 1. LOADING SKELETON STATE
  if (loading) {
    return (
      <div className="gs-dna-results-wrapper" aria-busy="true" aria-label="Loading verified recommendations">
        <div className="gs-dna-results-header">
          <div className="gs-dna-skeleton" style={{ width: '220px', height: '24px' }}></div>
          <div className="gs-dna-skeleton" style={{ width: '120px', height: '18px' }}></div>
        </div>
        <div className="gs-dna-cards-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="gs-dna-match-card gs-dna-card-skeleton">
              <div className="gs-dna-skeleton" style={{ height: '210px', width: '100%' }}></div>
              <div style={{ padding: '1.4rem' }}>
                <div className="gs-dna-skeleton" style={{ width: '40%', height: '18px', marginBottom: '0.8rem' }}></div>
                <div className="gs-dna-skeleton" style={{ width: '85%', height: '24px', marginBottom: '0.6rem' }}></div>
                <div className="gs-dna-skeleton" style={{ width: '65%', height: '16px', marginBottom: '1.2rem' }}></div>
                <div className="gs-dna-skeleton" style={{ width: '100%', height: '80px', borderRadius: '8px' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. API ERROR STATE
  if (error) {
    return (
      <div className="gs-dna-error-state" role="alert">
        <div className="gs-dna-error-icon">
          <AlertCircle size={32} color="#DC2626" />
        </div>
        <h4 className="gs-dna-error-title">Unable to Retrieve Property Records</h4>
        <p className="gs-dna-error-desc">
          {error}. Griha Saathi never displays unverified synthetic fallbacks when live records are temporarily inaccessible.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="gs-btn gs-btn-primary"
          style={{ marginTop: '1rem' }}
          id="dna-retry-btn"
        >
          <RotateCcw size={15} />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  // 3. HONEST EMPTY STATE (No matching homes found)
  if (results.length === 0) {
    return (
      <div className="gs-dna-empty-state" id="dna-empty-state">
        <div className="gs-dna-empty-icon">
          <Building size={36} color="var(--gs-forest-mid)" />
        </div>
        <h4 className="gs-dna-empty-title">We couldn't find homes matching every selected requirement right now.</h4>
        <p className="gs-dna-empty-desc">
          Because Griha Saathi enforces strict zero-synthetic property data and audits all titles through state revenue portals, we present only real, approved residences.
        </p>

        <div className="gs-dna-empty-actions">
          {requirements.locality && (
            <button
              type="button"
              onClick={() => requirements.locality = ''}
              className="gs-btn gs-btn-secondary gs-btn-sm"
              title="Broaden search beyond specific locality"
            >
              <span>Expand Locality to All {requirements.state === 'all' ? 'Regions' : requirements.state}</span>
            </button>
          )}

          {requirements.maxBudget && (
            <button
              type="button"
              onClick={() => onResetFilters()}
              className="gs-btn gs-btn-secondary gs-btn-sm"
            >
              <span>Adjust Budget Ceiling</span>
            </button>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="gs-btn gs-btn-primary gs-btn-sm"
            id="dna-empty-reset-btn"
          >
            <RotateCcw size={14} />
            <span>Reset Search Requirements</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. VERIFIED MATCHES GRID
  return (
    <div className="gs-dna-results-wrapper" id="dna-results-container">
      {/* Results Header */}
      <div className="gs-dna-results-header">
        <div>
          <div className="gs-dna-results-kicker">
            <Sparkles size={14} color="#52B788" />
            <span>DISCOVERY INTELLIGENCE</span>
          </div>
          <h3 className="gs-dna-results-title">
            Recommended Verified Homes ({results.length})
          </h3>
          <p className="gs-dna-results-subtitle">
            Ranked deterministically by your Home DNA priority balance. Hard constraints are strictly preserved.
          </p>
        </div>

        <div className="gs-dna-sort-status">
          <Scale size={14} color="var(--gs-forest-primary)" />
          <span>Priority Ordered</span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="gs-dna-cards-grid">
        {results.map((item, idx) => {
          const { property, matchScore, ratingLabel, dimensionScores, evidenceReasons, tradeOffs } = item;
          const isExpanded = expandedMatchId === property.id;
          const isCompared = compareList.some((p) => p.id === property.id);

          return (
            <div 
              key={property.id} 
              className={`gs-dna-match-card ${idx === 0 ? 'top-match' : ''}`}
              id={`dna-card-${property.id}`}
            >
              {/* Card Image Frame */}
              <div className="gs-dna-card-image-wrap">
                {property.photos && property.photos.length > 0 ? (
                  <img
                    src={property.photos[0].replace(/^\.\//, '/')}
                    alt={property.title}
                    className="gs-dna-card-img"
                    loading="lazy"
                  />
                ) : (
                  <div className="gs-dna-img-fallback" aria-label="No photograph submitted">
                    <Building size={32} color="#52B788" />
                    <span>Verified Cadastral Record</span>
                  </div>
                )}

                {/* Match Score Badge (Top Right) */}
                <div 
                  className={`gs-dna-match-score-badge ${
                    matchScore >= 85 ? 'score-high' : matchScore >= 72 ? 'score-mid' : 'score-base'
                  }`}
                  title={`Composite Home DNA fit: ${matchScore}/100 (${ratingLabel})`}
                >
                  <span className="gs-dna-score-num">{matchScore}%</span>
                  <span className="gs-dna-score-tag">{ratingLabel}</span>
                </div>

                {/* Verification Authority Seal (Top Left) */}
                <div className="gs-dna-seal-tag">
                  <BadgeCheck size={13} color="#DCFCE7" />
                  <span>{property.state} • Audited Title</span>
                </div>

                {/* Price Overlay Bar */}
                <div className="gs-dna-price-bar">
                  <div className="gs-dna-price-value">
                    {formatPrice(property.rentPerMonth)} <span className="gs-dna-price-unit">/ mo</span>
                  </div>
                  <div className="gs-dna-deposit-note">
                    MTA Deposit: {formatPrice(property.securityDeposit)}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="gs-dna-card-body">
                {/* Title & Location */}
                <h4 className="gs-dna-property-title">{property.title}</h4>
                <div className="gs-dna-property-location">
                  <MapPin size={13} color="var(--gs-forest-primary)" style={{ flexShrink: 0 }} />
                  <span>{property.locality ? `${property.locality}, ` : ''}{property.city}, {property.state}</span>
                </div>

                {/* Property Spec Pills */}
                <div className="gs-dna-spec-strip">
                  <span className="gs-dna-spec-pill">
                    {property.bedrooms ? `${property.bedrooms} BHK` : property.propertyType.toUpperCase()}
                  </span>
                  <span className="gs-dna-spec-pill">
                    {property.areaSqFt ? `${property.areaSqFt.toLocaleString('en-IN')} sq.ft` : 'Area not declared'}
                  </span>
                  <span className="gs-dna-spec-pill">
                    {property.furnishing ? property.furnishing.replace('_', ' ') : 'Semi-furnished'}
                  </span>
                </div>

                {/* Dimensional Fit Breakdown Visualizer */}
                <div className="gs-dna-dimensions-bar" aria-label="Dimension fit breakdown">
                  <div className="gs-dna-dim-item">
                    <span className="gs-dna-dim-label">Budget Fit</span>
                    <div className="gs-dna-dim-track">
                      <div className="gs-dna-dim-fill gs-fill-budget" style={{ width: `${dimensionScores.budgetFit}%` }} />
                    </div>
                    <span className="gs-dna-dim-val">{dimensionScores.budgetFit}%</span>
                  </div>

                  <div className="gs-dna-dim-item">
                    <span className="gs-dna-dim-label">Space Fit</span>
                    <div className="gs-dna-dim-track">
                      <div className="gs-dna-dim-fill gs-fill-space" style={{ width: `${dimensionScores.spaceFit}%` }} />
                    </div>
                    <span className="gs-dna-dim-val">{dimensionScores.spaceFit}%</span>
                  </div>

                  <div className="gs-dna-dim-item">
                    <span className="gs-dna-dim-label">Location Fit</span>
                    <div className="gs-dna-dim-track">
                      <div className="gs-dna-dim-fill gs-fill-location" style={{ width: `${dimensionScores.locationFit}%` }} />
                    </div>
                    <span className="gs-dna-dim-val">{dimensionScores.locationFit}%</span>
                  </div>
                </div>

                {/* "Why this home matches" Evidence Section (Directive 09) */}
                <div className="gs-dna-evidence-section">
                  <div className="gs-dna-evidence-header">
                    <CheckCircle2 size={13} color="#15803D" />
                    <span>Why this home matches</span>
                  </div>
                  <ul className="gs-dna-evidence-list">
                    {evidenceReasons.slice(0, 3).map((reason, rIdx) => (
                      <li key={rIdx}>{reason}</li>
                    ))}
                  </ul>
                </div>

                {/* Trade-Offs Section (Directive 10) */}
                {tradeOffs.length > 0 && (
                  <div className="gs-dna-tradeoff-section">
                    <div className="gs-dna-tradeoff-header">
                      <Info size={12} color="#B45309" />
                      <span>Transparent Trade-Offs</span>
                    </div>
                    <ul className="gs-dna-tradeoff-list">
                      {tradeOffs.slice(0, 2).map((trade, tIdx) => (
                        <li key={tIdx}>{trade}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Card Action Buttons */}
                <div className="gs-dna-card-actions">
                  <button
                    type="button"
                    onClick={() => onSelectProperty(property)}
                    className="gs-btn gs-btn-primary gs-btn-sm"
                    style={{ flex: 1 }}
                    id={`dna-view-btn-${property.id}`}
                  >
                    <span>Inspect Dossier</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onScheduleVisit(property)}
                    className="gs-btn gs-btn-secondary gs-btn-sm"
                    title="Schedule a physical walkthrough visit"
                    id={`dna-visit-btn-${property.id}`}
                  >
                    <Calendar size={13} />
                    <span>Visit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleCompare(property)}
                    className={`gs-btn gs-btn-sm ${isCompared ? 'gs-btn-success' : 'gs-btn-secondary'}`}
                    title={isCompared ? 'Remove from comparison' : 'Add to side-by-side comparison dock'}
                    id={`dna-compare-btn-${property.id}`}
                  >
                    <Scale size={13} />
                    <span>{isCompared ? 'In Dock' : 'Compare'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
