import React from 'react';
import { Home, ShieldCheck, MapPin, Scale } from 'lucide-react';
import { NavSection } from './Header';
import { SupportedLanguage } from '@shared/types';
import { translations } from '@shared/i18n';

interface FooterProps {
  onNavigate: (section: NavSection) => void;
  language: SupportedLanguage;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, language }) => {
  const t = translations[language];

  return (
    <footer className="gs-footer" role="contentinfo">
      <div className="gs-container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>
          {/* Brand & Mission Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: 'var(--gs-forest-mid)',
                  borderRadius: 'var(--gs-radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <Home size={18} />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                गृह साथी <span style={{ fontSize: '0.9rem', fontWeight: 500, color: '#A3B5AA' }}>| Griha Saathi</span>
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: '#B3C4B9', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {t.brand.subtagline}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#E2ECE5' }}>
              <ShieldCheck size={16} color="#52B788" />
              <span>Strict Zero-Synthetic Listing Policy</span>
            </div>
          </div>

          {/* Initial Target Regions */}
          <div>
            <h4 className="gs-footer-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="#52B788" />
              <span>Target Regions</span>
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.86rem' }}>
              <li style={{ color: '#D3E0D8' }}>• <strong>Delhi (NCT)</strong>: DDA & Revenue DORIS</li>
              <li style={{ color: '#D3E0D8' }}>• <strong>Haryana</strong>: Jamabandi & Web-HALRIS</li>
              <li style={{ color: '#D3E0D8' }}>• <strong>Punjab</strong>: PLRS Fard Kendra</li>
              <li style={{ color: '#D3E0D8' }}>• <strong>Himachal Pradesh</strong>: Himbhoomi Portal</li>
              <li style={{ color: '#D3E0D8' }}>• <strong>Jammu & Kashmir</strong>: Aapki Zameen Aapki Nigrani</li>
            </ul>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="gs-footer-title">Platform Sections</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button onClick={() => onNavigate('home')} className="gs-footer-link" style={{ textAlign: 'left' }}>
                1. {t.nav.home}
              </button>
              <button onClick={() => onNavigate('find-property')} className="gs-footer-link" style={{ textAlign: 'left' }}>
                2. {t.nav.findProperty}
              </button>
              <button onClick={() => onNavigate('verifications')} className="gs-footer-link" style={{ textAlign: 'left' }}>
                3. {t.nav.verifications}
              </button>
              <button onClick={() => onNavigate('connections')} className="gs-footer-link" style={{ textAlign: 'left' }}>
                4. {t.nav.connections}
              </button>
              <button onClick={() => onNavigate('saathi-ai')} className="gs-footer-link" style={{ textAlign: 'left' }}>
                5. {t.nav.saathiAi}
              </button>
              <button onClick={() => onNavigate('help')} className="gs-footer-link" style={{ textAlign: 'left' }}>
                6. {t.nav.help}
              </button>
              <button onClick={() => onNavigate('dashboard')} className="gs-footer-link" style={{ textAlign: 'left' }}>
                7. {t.nav.dashboard}
              </button>
              <button onClick={() => onNavigate('listing-property')} className="gs-footer-link" style={{ textAlign: 'left' }}>
                8. {t.nav.listingProperty}
              </button>
            </div>
          </div>

          {/* Statutory Compliance */}
          <div>
            <h4 className="gs-footer-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Scale size={16} color="#52B788" />
              <span>Legal Integrity</span>
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#9DB3A6', lineHeight: 1.5, marginBottom: '0.75rem' }}>
              Griha Saathi is architected in accordance with the <strong>Model Tenancy Act 2021</strong>, <strong>Real Estate (Regulation and Development) Act 2016</strong>, and the <strong>Digital Personal Data Protection (DPDP) Act 2023</strong>.
            </p>
            <p style={{ fontSize: '0.78rem', color: '#7E9688' }}>
              No synthetic profiles, invented reviews, or unverified listings are permitted on this platform.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid #1C3627',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8rem',
            color: '#7E9688',
          }}
        >
          <div>
            &copy; 2026 Griha Saathi. All rights reserved. Designed &amp; built for Bharat.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#A3B5AA' }}>
            <ShieldCheck size={14} color="#52B788" />
            <span>Authoritative Indian Housing Platform &bull; Backed by Official State Revenue Registries</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
