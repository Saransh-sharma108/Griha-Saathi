import React from 'react';
import { ShieldCheck, Calculator, Home, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { NavSection } from './Header';
import { SupportedLanguage } from '@shared/types';
import { translations } from '@shared/i18n';

interface TrustValueSectionProps {
  onNavigate: (section: NavSection) => void;
  onScrollToDna: () => void;
  language: SupportedLanguage;
}

export const TrustValueSection: React.FC<TrustValueSectionProps> = ({
  onNavigate,
  onScrollToDna,
  language,
}) => {
  const t = translations[language].home;

  const cards = [
    {
      id: 'card-verification',
      title: t.valueCard1Title || "Know What You're Looking At",
      desc: t.valueCard1Desc || "Explore the available property information and see which details have been checked.",
      badge: "Verified Evidence",
      badgeType: "emerald",
      icon: <ShieldCheck size={22} className="gs-trust-card-icon" />,
      actionText: "Check Verification Protocol",
      onClick: () => onNavigate('verifications'),
      featurePoint: "Land registry cross-checks & physical inspection audits",
    },
    {
      id: 'card-costs',
      title: t.valueCard2Title || "Understand the Real Cost",
      desc: t.valueCard2Desc || "Compare rent, deposits, maintenance, and other applicable charges before committing.",
      badge: "Deposit Transparency",
      badgeType: "gold",
      icon: <Calculator size={22} className="gs-trust-card-icon" />,
      actionText: "Explore Cost Breakdown",
      onClick: () => onNavigate('verifications'),
      featurePoint: "Model Tenancy Act (MTA 2021) 2-month security cap guidelines",
    },
    {
      id: 'card-vibe',
      title: t.valueCard3Title || "Find Your Kind of Home",
      desc: t.valueCard3Desc || "Explore properties according to your budget, preferred location, and lifestyle needs.",
      badge: "Home DNA Studio",
      badgeType: "mint",
      icon: <Home size={22} className="gs-trust-card-icon" />,
      actionText: "Calibrate Home DNA",
      onClick: onScrollToDna,
      featurePoint: "Multi-parameter living space & budget flexibility balancing",
    },
  ];

  return (
    <section 
      className="gs-trust-value-section" 
      id="trust-value-section"
      aria-labelledby="trust-value-heading"
    >
      <div className="gs-trust-container">
        
        {/* Section Header */}
        <div className="gs-trust-header">
          <div className="gs-trust-eyebrow">
            <Sparkles size={13} color="#45D6A0" />
            <span>THE GRIHA SAATHI PROMISE</span>
          </div>

          <h2 className="gs-trust-headline" id="trust-value-heading">
            {t.valueSectionTitle || "A home should feel right. The details should, too."}
          </h2>

          <p className="gs-trust-sublead">
            {t.valueSectionSubtitle || "Honest property intelligence, transparent rental terms, and verified evidence before you make a move."}
          </p>
        </div>

        {/* 3 Value Proposition Cards */}
        <div className="gs-trust-cards-grid" role="list">
          {cards.map((card) => (
            <div 
              key={card.id}
              className="gs-trust-card"
              role="listitem"
            >
              <div className="gs-trust-card-top">
                <div className={`gs-trust-icon-box gs-trust-icon-${card.badgeType}`}>
                  {card.icon}
                </div>
                <span className={`gs-badge gs-badge-${card.badgeType === 'gold' ? 'amber' : 'emerald'} gs-trust-card-tag`}>
                  {card.badge}
                </span>
              </div>

              <h3 className="gs-trust-card-title">{card.title}</h3>
              <p className="gs-trust-card-desc">{card.desc}</p>

              <div className="gs-trust-card-feature">
                <CheckCircle2 size={13} color="#45D6A0" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{card.featurePoint}</span>
              </div>

              <button
                type="button"
                onClick={card.onClick}
                className="gs-trust-card-btn"
                aria-label={`${card.actionText} for ${card.title}`}
              >
                <span>{card.actionText}</span>
                <ArrowRight size={13} className="gs-trust-btn-arrow" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
