import React from 'react';
import { X, CheckCircle, ShieldCheck, MapPin, Bed, Bath, Maximize, Calendar, AlertCircle } from 'lucide-react';
import { PropertyComparisonItem, SupportedLanguage } from '@shared/types';
import { translations } from '@shared/i18n';

interface PropertyComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PropertyComparisonItem[];
  language: SupportedLanguage;
  onSelectProperty?: (propertyId: string) => void;
}

export const PropertyComparisonModal: React.FC<PropertyComparisonModalProps> = ({
  isOpen,
  onClose,
  items,
  language,
  onSelectProperty,
}) => {
  if (!isOpen || items.length === 0) return null;

  const t = translations[language].saathiAi;

  const rows = [
    { label: 'Monthly Rent', key: 'rentOrPrice', icon: '₹' },
    { label: 'Property Type', key: 'propertyType', icon: <Bed size={14} /> },
    { label: 'Carpet Area', key: 'area', icon: <Maximize size={14} /> },
    { label: 'Bedrooms', key: 'bedrooms', icon: <Bed size={14} /> },
    { label: 'Bathrooms', key: 'bathrooms', icon: <Bath size={14} /> },
    { label: 'Furnishing Condition', key: 'furnishing', icon: '🛋️' },
    { label: 'Location', key: 'location', icon: <MapPin size={14} /> },
    { label: 'Possession / Availability', key: 'availability', icon: <Calendar size={14} /> },
    { label: 'Verification Status', key: 'verificationStatus', icon: <ShieldCheck size={14} /> },
    { label: 'Last Audited / Updated', key: 'lastUpdated', icon: <CheckCircle size={14} /> },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(19, 42, 34, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="gs-card"
        style={{
          width: '100%',
          maxWidth: '1060px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          backgroundColor: 'var(--gs-bg-surface-primary)',
          boxShadow: 'var(--gs-shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            backgroundColor: 'var(--gs-forest-deep)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--gs-gold)" />
              <span>{t.compareTitle}</span>
            </h2>
            <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0.3rem 0 0.15rem', color: '#45D6A0' }}>
              Good homes deserve good comparisons.
            </p>
            <p style={{ fontSize: '0.8rem', margin: 0, color: 'rgba(255, 255, 255, 0.75)' }}>
              Comparing {items.length} authentic database records side-by-side. Missing fields are explicitly marked as "Not provided".
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Comparison Grid Table */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: '1.5rem' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.88rem',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gs-border)' }}>
                <th
                  style={{
                    padding: '1rem',
                    width: '200px',
                    color: 'var(--gs-text-primary)',
                    fontWeight: 700,
                    backgroundColor: 'var(--gs-surface-elevated)',
                  }}
                >
                  Property Record
                </th>
                {items.map((item, idx) => (
                  <th
                    key={item.propertyId}
                    style={{
                      padding: '1rem',
                      minWidth: '220px',
                      color: 'var(--gs-text-primary)',
                      fontWeight: 700,
                      backgroundColor: idx % 2 === 0 ? 'var(--gs-surface)' : 'var(--gs-surface-secondary)',
                      borderLeft: '1px solid var(--gs-border)',
                    }}
                  >
                    <div style={{ fontSize: '0.98rem', marginBottom: '0.25rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gs-accent-bright)', fontWeight: 600 }}>
                      ID: {item.propertyId}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} style={{ borderBottom: '1px solid var(--gs-divider)' }}>
                  <td
                    style={{
                      padding: '0.85rem 1rem',
                      fontWeight: 600,
                      color: 'var(--gs-text-secondary)',
                      backgroundColor: 'var(--gs-surface-elevated)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{row.label}</span>
                    </div>
                  </td>
                  {items.map((item, idx) => {
                    const val = (item as any)[row.key];
                    const isMissing = !val || val === 'Not provided';
                    const isRent = row.key === 'rentOrPrice';

                    return (
                      <td
                        key={`${item.propertyId}_${row.key}`}
                        style={{
                          padding: '0.85rem 1rem',
                          backgroundColor: idx % 2 === 0 ? 'var(--gs-surface)' : 'var(--gs-surface-secondary)',
                          borderLeft: '1px solid var(--gs-border)',
                          color: isMissing ? 'var(--gs-text-muted)' : isRent ? 'var(--gs-accent-bright)' : 'var(--gs-text-primary)',
                          fontWeight: isRent ? 700 : 500,
                        }}
                      >
                        {isMissing ? (
                          <span style={{ fontStyle: 'italic', color: 'var(--gs-text-muted)' }}>{t.notProvided}</span>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Amenities Row */}
              <tr style={{ borderBottom: '1px solid var(--gs-divider)' }}>
                <td
                  style={{
                    padding: '0.85rem 1rem',
                    fontWeight: 600,
                    color: 'var(--gs-text-secondary)',
                    backgroundColor: 'var(--gs-surface-elevated)',
                  }}
                >
                  Amenities
                </td>
                {items.map((item, idx) => (
                  <td
                    key={`${item.propertyId}_amenities`}
                    style={{
                      padding: '0.85rem 1rem',
                      backgroundColor: idx % 2 === 0 ? 'var(--gs-surface)' : 'var(--gs-surface-secondary)',
                      borderLeft: '1px solid var(--gs-border)',
                    }}
                  >
                    {item.amenities.length > 0 && item.amenities[0] !== 'Not provided' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        {item.amenities.map((am) => (
                          <span
                            key={am}
                            style={{
                              fontSize: '0.74rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--gs-radius-sm)',
                              backgroundColor: 'rgba(72, 201, 149, 0.15)',
                              color: 'var(--gs-accent-bright)',
                              border: '1px solid var(--gs-border)',
                            }}
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontStyle: 'italic', color: 'var(--gs-text-muted)' }}>{t.notProvided}</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Action Buttons Row */}
              {onSelectProperty && (
                <tr>
                  <td
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--gs-surface-elevated)',
                    }}
                  ></td>
                  {items.map((item, idx) => (
                    <td
                      key={`${item.propertyId}_actions`}
                      style={{
                        padding: '1rem',
                        backgroundColor: idx % 2 === 0 ? 'var(--gs-surface)' : 'var(--gs-surface-secondary)',
                        borderLeft: '1px solid var(--gs-border)',
                      }}
                    >
                      <button
                        onClick={() => {
                          onClose();
                          onSelectProperty(item.propertyId);
                        }}
                        className="gs-btn gs-btn-primary gs-btn-sm"
                        style={{ width: '100%' }}
                      >
                        {t.viewDetails}
                      </button>
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer Note */}
        <div
          style={{
            padding: '0.75rem 1.75rem',
            backgroundColor: 'var(--gs-bg-canvas)',
            borderTop: '1px solid var(--gs-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.78rem',
            color: 'var(--gs-text-secondary)',
          }}
        >
          <AlertCircle size={15} color="var(--gs-forest-primary)" />
          <span>
            Data Integrity Commitment: Side-by-side comparison uses verified database records. Griha Saathi never populates missing fields with estimated or synthetic values.
          </span>
        </div>
      </div>
    </div>
  );
};
