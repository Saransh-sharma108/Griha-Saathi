import React from 'react';
import { 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  SlidersHorizontal, 
  Scale, 
  Wallet, 
  Maximize2, 
  Compass, 
  Bookmark, 
  Check, 
  HelpCircle,
  Info
} from 'lucide-react';
import { HomeDnaPreferences } from '@shared/types';
import { normalizeWeights, getSummaryDescriptors } from '@shared/homeDnaEngine';

interface HomeDNASummaryProps {
  preferences: HomeDnaPreferences;
  onResetAll: () => void;
  onSavePreferences: () => void;
  isSaved?: boolean;
}

export const HomeDNASummary: React.FC<HomeDNASummaryProps> = ({
  preferences,
  onResetAll,
  onSavePreferences,
  isSaved = false,
}) => {
  const norm = normalizeWeights(preferences);
  const descriptors = getSummaryDescriptors(preferences);

  const budgetPct = Math.round(norm.budgetWeight * 100);
  const spacePct = Math.round(norm.spaceWeight * 100);
  const locationPct = Math.round(norm.locationWeight * 100);

  const isAllZero = (Number(preferences.budgetFlexibility) || 0) === 0 && 
                     (Number(preferences.livingSpacePriority) || 0) === 0 && 
                     (Number(preferences.locationPriority) || 0) === 0;

  return (
    <div className="gs-dna-summary-card" id="home-dna-summary-panel">
      {/* Summary Header */}
      <div className="gs-dna-summary-header">
        <div>
          <div className="gs-dna-summary-kicker">
            <Sparkles size={14} color="#52B788" />
            <span>LIVE PREFERENCE PROFILE</span>
          </div>
          <h3 className="gs-dna-summary-title">Your Home DNA Balance</h3>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={onSavePreferences}
            className={`gs-btn gs-btn-sm ${isSaved ? 'gs-btn-success' : 'gs-btn-secondary'}`}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            title="Save your preferences for future visits"
            id="dna-save-profile-btn"
          >
            {isSaved ? <Check size={14} /> : <Bookmark size={14} />}
            <span>{isSaved ? 'Preferences Saved' : 'Save DNA'}</span>
          </button>
          <button
            type="button"
            onClick={onResetAll}
            className="gs-btn gs-btn-sm gs-btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            title="Reset all 3 sliders to prototype values (45%, 65%, 80%)"
            id="dna-reset-all-btn"
          >
            <RotateCcw size={13} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Continuous Horizontal Stacked Priority Bar */}
      <div style={{ marginBottom: '1.5rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--gs-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--gs-text-secondary)', marginBottom: '0.5rem' }}>
          <span>Normalized Priority Distribution</span>
          <span style={{ fontSize: '0.74rem', color: isAllZero ? 'var(--gs-text-muted)' : '#2D6A4F' }}>
            {isAllZero ? 'Neutral State (Equal 33% each)' : `Active Blend: ${budgetPct}% / ${spacePct}% / ${locationPct}%`}
          </span>
        </div>

        {/* Multi-segment stacked bar */}
        <div 
          style={{ 
            display: 'flex', 
            height: '12px', 
            borderRadius: '9999px', 
            overflow: 'hidden', 
            background: 'var(--gs-bg-subtle)',
            border: '1px solid var(--gs-border)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
          }}
          role="img"
          aria-label={`Normalized weights: Budget ${budgetPct}%, Space ${spacePct}%, Location ${locationPct}%`}
        >
          <div 
            style={{ width: `${budgetPct}%`, background: '#1B4332', transition: 'width 0.3s ease' }} 
            title={`Budget Flexibility Weight: ${budgetPct}%`} 
          />
          <div 
            style={{ width: `${spacePct}%`, background: '#52B788', transition: 'width 0.3s ease' }} 
            title={`Living Space Priority Weight: ${spacePct}%`} 
          />
          <div 
            style={{ width: `${locationPct}%`, background: '#A3B18A', transition: 'width 0.3s ease' }} 
            title={`Location Priority Weight: ${locationPct}%`} 
          />
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.74rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gs-forest-deep)', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1B4332' }} />
            Budget: {budgetPct}%
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gs-forest-deep)', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#52B788' }} />
            Space: {spacePct}%
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gs-forest-deep)', fontWeight: 700 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#A3B18A' }} />
            Location: {locationPct}%
          </span>
        </div>

        {/* Clarification Callout Note (Section 4.C) */}
        <div style={{ marginTop: '0.85rem', fontSize: '0.76rem', color: 'var(--gs-text-muted)', background: 'var(--gs-bg-subtle)', padding: '0.55rem 0.8rem', borderRadius: '6px', border: '1px solid var(--gs-border)' }}>
          <Info size={13} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: '-2px', color: 'var(--gs-forest-primary)' }} />
          Normalized weights describe relative ranking influence. They are not probabilities, guarantees, or the percentage of listings that will match.
        </div>
      </div>

      {/* Primary Priority Breakdown Cards */}
      <div className="gs-dna-profile-grid">
        {/* Dimension 1: Budget */}
        <div className="gs-dna-profile-item">
          <div className="gs-dna-profile-item-header">
            <span className="gs-dna-profile-icon"><Wallet size={15} color="var(--gs-forest-primary)" /></span>
            <span className="gs-dna-profile-dim">Budget Flexibility</span>
          </div>
          <div className="gs-dna-profile-status">{descriptors.budgetDescriptor}</div>
          <div className="gs-dna-bar-track">
            <div 
              className="gs-dna-bar-fill gs-dna-bar-budget" 
              style={{ width: `${budgetPct}%` }}
              aria-label={`Budget normalized weight: ${budgetPct}%`}
            />
          </div>
          <div className="gs-dna-profile-meta">
            <span>Raw: {preferences.budgetFlexibility}%</span>
            <span className="gs-dna-weight-badge">{budgetPct}% Relative Weight</span>
          </div>
        </div>

        {/* Dimension 2: Space */}
        <div className="gs-dna-profile-item">
          <div className="gs-dna-profile-item-header">
            <span className="gs-dna-profile-icon"><Maximize2 size={15} color="var(--gs-forest-primary)" /></span>
            <span className="gs-dna-profile-dim">Living Space</span>
          </div>
          <div className="gs-dna-profile-status">{descriptors.spaceDescriptor}</div>
          <div className="gs-dna-bar-track">
            <div 
              className="gs-dna-bar-fill gs-dna-bar-space" 
              style={{ width: `${spacePct}%` }}
              aria-label={`Space normalized weight: ${spacePct}%`}
            />
          </div>
          <div className="gs-dna-profile-meta">
            <span>Raw: {preferences.livingSpacePriority}%</span>
            <span className="gs-dna-weight-badge">{spacePct}% Relative Weight</span>
          </div>
        </div>

        {/* Dimension 3: Location */}
        <div className="gs-dna-profile-item">
          <div className="gs-dna-profile-item-header">
            <span className="gs-dna-profile-icon"><Compass size={15} color="var(--gs-forest-primary)" /></span>
            <span className="gs-dna-profile-dim">Location Priority</span>
          </div>
          <div className="gs-dna-profile-status">{descriptors.locationDescriptor}</div>
          <div className="gs-dna-bar-track">
            <div 
              className="gs-dna-bar-fill gs-dna-bar-location" 
              style={{ width: `${locationPct}%` }}
              aria-label={`Location normalized weight: ${locationPct}%`}
            />
          </div>
          <div className="gs-dna-profile-meta">
            <span>Raw: {preferences.locationPriority}%</span>
            <span className="gs-dna-weight-badge">{locationPct}% Relative Weight</span>
          </div>
        </div>
      </div>

      {/* Trade-Off Insight Callout ("Your priorities, made clear.") */}
      <div className="gs-dna-tradeoff-insight-box">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div className="gs-dna-insight-icon" aria-hidden="true">
            <Scale size={18} color="#1B4332" />
          </div>
          <div>
            <div className="gs-dna-insight-title">Your priorities, made clear.</div>
            <p className="gs-dna-insight-body">{descriptors.tradeoffInsight}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

