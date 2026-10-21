import React from 'react';
import { Sliders, RotateCcw, Info, Sparkles, Compass, Maximize2, Wallet } from 'lucide-react';

interface PreferenceControlProps {
  id: string;
  label: string;
  question: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  iconType: 'budget' | 'space' | 'location';
  descriptor: string;
  explanation: string;
  tradeoffNote: string;
  onChange: (newValue: number) => void;
  onReset?: () => void;
  defaultValue?: number;
}

export const PreferenceControl: React.FC<PreferenceControlProps> = ({
  id,
  label,
  question,
  value,
  min = 0,
  max = 100,
  step = 5,
  unit = '%',
  iconType,
  descriptor,
  explanation,
  tradeoffNote,
  onChange,
  onReset,
  defaultValue,
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'budget':
        return <Wallet size={18} color="var(--gs-forest-primary)" />;
      case 'space':
        return <Maximize2 size={18} color="var(--gs-forest-primary)" />;
      case 'location':
        return <Compass size={18} color="var(--gs-forest-primary)" />;
    }
  };

  const getTrackFill = () => {
    const percentage = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, var(--gs-forest-primary) 0%, #52B788 ${percentage}%, var(--gs-border) ${percentage}%, var(--gs-border) 100%)`;
  };

  const isDefault = defaultValue !== undefined && value === defaultValue;

  return (
    <div className="gs-dna-control-card" id={`dna-control-${id}`}>
      {/* Header with Title, Icon, Value & Reset */}
      <div className="gs-dna-control-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="gs-dna-icon-bubble" aria-hidden="true">
            {getIcon()}
          </div>
          <div>
            <div className="gs-dna-control-category">{label}</div>
            <h3 className="gs-dna-control-question">{question}</h3>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="gs-dna-value-badge" aria-live="polite">
            <span className="gs-dna-value-num">{value}{unit}</span>
            <span className="gs-dna-value-tag">{descriptor}</span>
          </div>
          {onReset && defaultValue !== undefined && !isDefault && (
            <button
              type="button"
              onClick={onReset}
              className="gs-dna-reset-btn"
              title={`Reset to prototype default (${defaultValue}%)`}
              aria-label={`Reset ${label} to ${defaultValue}%`}
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Responsive Slider Input */}
      <div className="gs-dna-slider-container">
        <label htmlFor={id} className="gs-sr-only">
          {question} ({label})
        </label>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="gs-dna-range-slider"
          style={{ background: getTrackFill() }}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value}${unit} — ${descriptor}`}
          aria-describedby={`desc-${id}`}
        />

        {/* Min/Mid/Max Tick Indicators */}
        <div className="gs-dna-slider-ticks" aria-hidden="true">
          <span>Flexible ({min}%)</span>
          <span>Balanced (50%)</span>
          <span>Priority ({max}%)</span>
        </div>
      </div>

      {/* Plain Language Explanation & Trade-Off Note */}
      <div className="gs-dna-explanation-block" id={`desc-${id}`}>
        <p className="gs-dna-explanation-text">
          {explanation}
        </p>
        <div className="gs-dna-tradeoff-tag">
          <Info size={13} color="var(--gs-forest-mid)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{tradeoffNote}</span>
        </div>
      </div>
    </div>
  );
};
