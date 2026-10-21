import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  FileCheck, 
  Building, 
  UserCheck, 
  Scale, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Info,
  ExternalLink,
  Flag,
  HelpCircle,
  Eye,
  Check,
  XCircle,
  Layers
} from 'lucide-react';
import { SupportedLanguage, VerificationRecord, TargetState } from '@shared/types';
import { translations } from '@shared/i18n';

interface VerificationsPageProps {
  language: SupportedLanguage;
}

export const VerificationsPage: React.FC<VerificationsPageProps> = ({ language }) => {
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [auditRecord, setAuditRecord] = useState<VerificationRecord | null>(null);
  const [propertyTitle, setPropertyTitle] = useState<string | null>(null);
  const [propertyLocation, setPropertyLocation] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const t = translations[language].verifications;

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setSearchError(null);
    setAuditRecord(null);

    try {
      const res = await fetch(`/api/verifications/${encodeURIComponent(trackingId.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSearchError(data.error || 'No authoritative audit record found for this identifier.');
        return;
      }

      setAuditRecord(data.record);
      setPropertyTitle(data.propertyTitle || 'Submitted Property');
      setPropertyLocation(data.propertyLocation || null);
    } catch (err) {
      setSearchError('Connection error querying verification backend.');
    } finally {
      setLoading(false);
    }
  };

  const regionalRegistries: {
    state: TargetState;
    registry: string;
    portalName: string;
    verificationScope: string;
  }[] = [
    {
      state: 'Delhi',
      registry: 'DORIS (Delhi Online Registration Information System) & DDA',
      portalName: 'doris.delhigovt.nic.in',
      verificationScope: 'Registered Sale Deeds, Conveyance Deeds, Sub-Registrar Volume/Page Number',
    },
    {
      state: 'Haryana',
      registry: 'Jamabandi / Web-HALRIS Haryana Revenue Portal',
      portalName: 'jamabandi.nic.in',
      verificationScope: 'Nakhal Jamabandi, Khewat/Khatauni Numbers, Intiqal (Mutation) records',
    },
    {
      state: 'Punjab',
      registry: 'PLRS (Punjab Land Records Society) Fard Kendra',
      portalName: 'plrs.org.in',
      verificationScope: 'Digitally signed Fard, Jamabandi extract, Sub-Registrar deed registry',
    },
    {
      state: 'Himachal Pradesh',
      registry: 'Himbhoomi Land Records & HP Revenue Portal',
      portalName: 'lrc.hp.nic.in',
      verificationScope: 'Jamabandi Nakal, Section 118 Land Reform authorization, municipal NOC',
    },
    {
      state: 'Jammu & Kashmir',
      registry: 'Aapki Zameen Aapki Nigrani (JaKeGA & Revenue Dept)',
      portalName: 'landrecords.jk.gov.in',
      verificationScope: 'Digital Jamabandi, Girdawari verification, Khasra deed authentication',
    },
  ];

  return (
    <div className="gs-page-shell" style={{ padding: '3.5rem 0 5rem' }}>
      <div className="gs-container" style={{ maxWidth: '1120px' }}>
        
        {/* Level A: Editorial Page Header Sitting Cleanly on Canvas */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#52B788', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            <ShieldCheck size={16} />
            <span>Authoritative Verification Protocol</span>
          </div>
          <h1 className="gs-page-header-title" style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.025em' }}>
            {t.title || 'Official Property Verification Centre'}
          </h1>
          <p className="gs-page-header-subtitle" style={{ fontSize: '1.05rem', lineHeight: 1.6, margin: '0 auto' }}>
            {t.subtitle || 'Every property listed on Griha Saathi undergoes mandatory revenue title cross-checks and physical geo-tagged auditing to ensure transparent, safe tenancy.'}
          </p>
        </div>

        {/* Level C: Compact, Integrated Audit Tracking Console */}
        <div 
          className="gs-surface-interactive" 
          style={{ 
            maxWidth: '720px', 
            margin: '0 auto 3.5rem', 
            padding: '1.5rem 1.75rem',
            borderRadius: 'var(--gs-radius-lg)',
            border: '1.5px solid var(--gs-border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={18} color="var(--gs-forest-primary)" />
              <h2 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', fontWeight: 700, margin: 0 }}>
                {t.trackTitle || 'Track Listing Audit Status'}
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--gs-forest-primary)', backgroundColor: 'var(--gs-forest-soft)', padding: '0.2rem 0.55rem', borderRadius: '4px', fontWeight: 600 }}>
              Live Revenue Query
            </span>
          </div>

          <form onSubmit={handleTrackSubmit} className="gs-compact-search-bar">
            <Search size={18} color="var(--gs-text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t.trackPlaceholder || 'Enter Property ID (e.g. prop_dl_003) or land deed reference code'}
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="gs-compact-search-input"
              required
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="gs-btn gs-btn-primary gs-btn-sm"
              style={{ padding: '0.45rem 1.15rem', borderRadius: 'var(--gs-radius-sm)', whiteSpace: 'nowrap' }}
            >
              <span>{loading ? 'Auditing...' : (t.trackButton || 'Verify Status')}</span>
            </button>
          </form>

          <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-secondary)', marginTop: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>ℹ️</span>
            <span>Enter any listing ID from Find Property to verify state registry title deeds and cadastral audit stages.</span>
          </div>

          {searchError && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--gs-status-error-soft)',
                border: '1px solid #FECACA',
                borderRadius: 'var(--gs-radius-md)',
                color: 'var(--gs-status-error)',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <div><strong>Notice:</strong> {searchError}</div>
            </div>
          )}

          {auditRecord && (
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--gs-border-subtle)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', fontWeight: 700, margin: 0 }}>{propertyTitle}</h3>
                  {propertyLocation && <span style={{ fontSize: '0.84rem', color: 'var(--gs-text-secondary)' }}>{propertyLocation}</span>}
                </div>
                <span className={`gs-badge ${auditRecord.status === 'authoritative_verified' ? 'gs-badge-verified' : 'gs-badge-warning'}`}>
                  {auditRecord.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {auditRecord.stages.map((stg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem 0.95rem',
                      backgroundColor: 'rgba(235, 242, 237, 0.65)',
                      borderRadius: 'var(--gs-radius-md)',
                      fontSize: '0.85rem',
                      border: '1px solid var(--gs-border-subtle)',
                    }}
                  >
                    {stg.status === 'verified' ? (
                      <CheckCircle2 size={18} color="var(--gs-forest-mid)" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <Clock size={18} color="var(--gs-status-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ color: 'var(--gs-text-primary)' }}>
                          {stg.authorityName} ({stg.stage.replace('_', ' ')})
                        </strong>
                        <span className={`gs-badge ${stg.status === 'verified' ? 'gs-badge-emerald' : 'gs-badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                          {stg.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ color: 'var(--gs-text-secondary)', marginTop: '0.2rem' }}>
                        {stg.details}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Level B: Connected 4-Stage Verification Pipeline (One Cohesive Process Flow) */}
        <div style={{ marginBottom: '3.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#52B788', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              <Layers size={14} /> Four-Stage Process Flow
            </div>
            <h2 className="gs-page-header-title" style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
              {t.howItWorksTitle || 'The 4-Stage Authoritative Audit'}
            </h2>
            <p className="gs-page-header-subtitle" style={{ fontSize: '0.96rem', maxWidth: '640px', margin: '0 auto' }}>
              Every stage is sequenced, independently verifiable, and audited under statutory regulations.
            </p>
          </div>

          {/* Connected Process Track */}
          <div className="gs-pipeline-track">
            {/* Stage 1 */}
            <div className="gs-pipeline-step">
              <div className="gs-pipeline-step-header">
                <span className="gs-pipeline-step-badge">1</span>
                <div>
                  <h3 className="gs-pipeline-step-title">{t.stage1Title || 'Land Registry'}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gs-forest-primary)', fontWeight: 600 }}>Title Deed Authentication</span>
                </div>
              </div>
              <p className="gs-pipeline-step-desc">
                {t.stage1Desc || 'Title deed authenticated against state revenue records (Jamabandi, DORIS, PLRS, Himbhoomi). Sub-registrar volume and mutation status verified.'}
              </p>
            </div>

            {/* Stage 2 */}
            <div className="gs-pipeline-step">
              <div className="gs-pipeline-step-header">
                <span className="gs-pipeline-step-badge">2</span>
                <div>
                  <h3 className="gs-pipeline-step-title">{t.stage2Title || 'Physical Audit'}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gs-forest-primary)', fontWeight: 600 }}>On-Site Inspection</span>
                </div>
              </div>
              <p className="gs-pipeline-step-desc">
                {t.stage2Desc || 'Field inspection confirms physical existence, carpet area dimensions, structural safety, municipal water connectivity, and genuine photographs.'}
              </p>
            </div>

            {/* Stage 3 */}
            <div className="gs-pipeline-step">
              <div className="gs-pipeline-step-header">
                <span className="gs-pipeline-step-badge">3</span>
                <div>
                  <h3 className="gs-pipeline-step-title">{t.stage3Title || 'Owner Identity'}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gs-forest-primary)', fontWeight: 600 }}>Aadhaar / DigiLocker Match</span>
                </div>
              </div>
              <p className="gs-pipeline-step-desc">
                {t.stage3Desc || 'Owner or authorized representative identity verified via DigiLocker / Aadhaar OTP matching the registered title deed to prevent impersonation.'}
              </p>
            </div>

            {/* Stage 4 */}
            <div className="gs-pipeline-step">
              <div className="gs-pipeline-step-header">
                <span className="gs-pipeline-step-badge">4</span>
                <div>
                  <h3 className="gs-pipeline-step-title">{t.stage4Title || 'MTA Compliance'}</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--gs-forest-primary)', fontWeight: 600 }}>Deposit Ceiling Capped</span>
                </div>
              </div>
              <p className="gs-pipeline-step-desc">
                {t.stage4Desc || 'Standard statutory agreement format audited with security deposit strictly capped at maximum 2 months rent under Model Tenancy Act rules.'}
              </p>
            </div>
          </div>
        </div>

        {/* Level B: Unified Transparency Section (Side-by-Side Comparison Matrix) */}
        <div style={{ marginBottom: '3.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#52B788', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              <Eye size={14} /> Full Transparency
            </div>
            <h2 className="gs-page-header-title" style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
              Scope &amp; Legal Boundaries
            </h2>
            <p className="gs-page-header-subtitle" style={{ fontSize: '0.96rem', maxWidth: '640px', margin: '0 auto' }}>
              Total honesty with renters and owners. What our audit legally proves vs. what you must inspect in person.
            </p>
          </div>

          <div 
            className="gs-surface-integrated"
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: '2rem',
              padding: '2rem'
            }}
          >
            {/* Confirms Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--gs-status-success)' }}>
                <CheckCircle2 size={20} />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', fontWeight: 700, margin: 0 }}>
                  What Verification Proves
                </h3>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--gs-text-primary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Check size={16} color="var(--gs-status-success)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>The property physically exists at the recorded municipal address.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Check size={16} color="var(--gs-status-success)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>The listing owner has demonstrated title deed records matching state revenue portals.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Check size={16} color="var(--gs-status-success)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>Security deposit complies with the Model Tenancy Act maximum cap (&le; 2 months).</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Check size={16} color="var(--gs-status-success)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>Active confirmation of availability submitted within the last 60 days.</span>
                </li>
              </ul>
            </div>

            {/* Limitations Column */}
            <div style={{ borderLeft: '1px solid var(--gs-border-subtle)', paddingLeft: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--gs-status-warning)' }}>
                <HelpCircle size={20} />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', fontWeight: 700, margin: 0 }}>
                  What You Must Inspect In Person
                </h3>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--gs-text-primary)' }}>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Info size={16} color="var(--gs-status-warning)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>It does not replace an in-person physical visit by the prospective tenant.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Info size={16} color="var(--gs-status-warning)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>It does not guarantee subjective personal compatibility between tenant and landlord.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Info size={16} color="var(--gs-status-warning)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span>It is not a government title warranty or commercial title insurance policy.</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Info size={16} color="var(--gs-status-warning)" style={{ flexShrink: 0, marginTop: 3 }} />
                  <span><strong>Never transfer advance token money</strong> prior to an in-person physical inspection!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Level B: Integrated Regional Land Registries Directory */}
        <div style={{ marginBottom: '3.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#52B788', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              <FileCheck size={14} /> Official Sources
            </div>
            <h2 className="gs-page-header-title" style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem' }}>
              Authoritative Land Record Sources
            </h2>
            <p className="gs-page-header-subtitle" style={{ fontSize: '0.96rem', maxWidth: '640px', margin: '0 auto' }}>
              We cross-reference every listing against these official state revenue department registries.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {regionalRegistries.map((reg) => (
              <div 
                key={reg.state} 
                className="gs-surface-integrated"
                style={{ padding: '1.25rem 1.35rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span className="gs-badge gs-badge-forest" style={{ fontSize: '0.76rem' }}>
                      {reg.state}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--gs-forest-primary)', fontWeight: 600 }}>
                      {reg.portalName}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', color: 'var(--gs-forest-deep)', fontWeight: 700, marginBottom: '0.35rem' }}>
                    {reg.registry}
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: 'var(--gs-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    <strong>Audit Scope:</strong> {reg.verificationScope}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Level B: Streamlined Anti-Fraud Quarantine Strip */}
        <div 
          className="gs-surface-integrated" 
          style={{ 
            backgroundColor: 'rgba(235, 242, 237, 0.92)', 
            borderColor: 'var(--gs-border)', 
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <Flag size={22} color="var(--gs-forest-primary)" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: '260px' }}>
            <strong style={{ color: 'var(--gs-forest-deep)', fontSize: '0.96rem' }}>
              Suspect a Fake Listing or Inaccurate Details?
            </strong>
            <p style={{ fontSize: '0.86rem', color: 'var(--gs-forest-primary)', margin: '0.2rem 0 0', lineHeight: 1.5 }}>
              Griha Saathi maintains a strict anti-fraud policy. Any user can report a listing for discrepancies in photos, rent, or ownership. Reported listings are immediately quarantined for re-inspection by our compliance staff.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
