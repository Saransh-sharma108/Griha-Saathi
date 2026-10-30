import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Maximize2, 
  ShieldCheck, 
  Sparkles, 
  MapPin, 
  ArrowRight,
  ExternalLink 
} from 'lucide-react';
import { AiChatMessage, SupportedLanguage } from '@shared/types';
import { translations } from '@shared/i18n';
import { NavSection } from './Header';

interface FloatingSaathiWidgetProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  language: SupportedLanguage;
}

export const FloatingSaathiWidget: React.FC<FloatingSaathiWidgetProps> = ({
  currentSection,
  onNavigate,
  language,
}) => {
  const t = translations[language].saathiAi;
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'mini_welcome',
      sender: 'assistant',
      text: t.welcomeMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // If the user is on the dedicated saathi-ai workspace or on home during zero-state reset, hide floating widget
  if (currentSection === 'saathi-ai' || currentSection === 'home') {
    return null;
  }

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    const userMsg: AiChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend, language }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: 'Unable to reach Saathi AI. Please open the full workspace.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gs-floating-widget-container">
      {/* Expanded Mini Assistant Drawer */}
      {isOpen && (
        <div className="gs-floating-widget-window">
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: 'var(--gs-forest-deep)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700 }}>{t.floatingWidgetHeading}</div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.75)' }}>
                  Authoritative Housing Assistant
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('saathi-ai');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                }}
                title="Expand to Full Saathi AI Workspace"
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              backgroundColor: 'var(--gs-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <div
                    className={isUser ? 'gs-chat-bubble-sent' : 'gs-chat-bubble-received'}
                    style={{
                      maxWidth: '85%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                      backgroundColor: isUser ? '#064E3B' : '#10291F',
                      color: isUser ? '#F4FFF9' : '#E8F2EC',
                      fontSize: '0.84rem',
                      lineHeight: 1.45,
                      boxShadow: 'var(--gs-shadow-xs)',
                      border: isUser ? '1px solid #168A65' : '1px solid #24513D',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.text}

                    {/* Matching Properties Preview */}
                    {m.properties && m.properties.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--gs-border-subtle)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gs-accent-bright)', marginBottom: '0.35rem' }}>
                          Matching Verified Properties ({m.properties.length}):
                        </div>
                        {m.properties.slice(0, 2).map((p) => (
                          <div
                            key={p.id}
                            style={{
                              backgroundColor: 'var(--gs-surface-elevated)',
                              border: '1px solid var(--gs-border)',
                              borderRadius: '4px',
                              padding: '0.4rem',
                              marginBottom: '0.35rem',
                              fontSize: '0.75rem',
                            }}
                          >
                            <div style={{ fontWeight: 700, color: 'var(--gs-text-primary)' }}>{p.title}</div>
                            <div style={{ color: 'var(--gs-accent-bright)', fontWeight: 600 }}>
                              ₹{p.rentPerMonth.toLocaleString('en-IN')}/mo • {p.bedrooms} BHK in {p.city}
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setIsOpen(false);
                            onNavigate('saathi-ai');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--gs-accent-bright)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            padding: '0.2rem 0',
                          }}
                        >
                          <span>View full cards in Workspace</span>
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gs-text-muted)', fontSize: '0.78rem' }}>
                <Bot size={14} className="gs-spin" />
                <span>Searching genuine database records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: 'var(--gs-bg-surface-primary)',
              borderTop: '1px solid var(--gs-border-subtle)',
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
            }}
          >
            <button
              onClick={() => handleSend(t.quickPrompt1)}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--gs-radius-sm)',
                border: '1px solid var(--gs-border)',
                backgroundColor: 'var(--gs-bg-surface-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Jammu 2 BHK
            </button>
            <button
              onClick={() => handleSend(t.quickPrompt2)}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--gs-radius-sm)',
                border: '1px solid var(--gs-border)',
                backgroundColor: 'var(--gs-bg-surface-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Deposit Limit
            </button>
            <button
              onClick={() => handleSend(t.quickPrompt4)}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--gs-radius-sm)',
                border: '1px solid var(--gs-border)',
                backgroundColor: 'var(--gs-bg-surface-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Fraud Signs
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '0.65rem 0.75rem',
              backgroundColor: 'var(--gs-bg-surface-primary)',
              borderTop: '1px solid var(--gs-border)',
              display: 'flex',
              gap: '0.5rem',
            }}
          >
            <input
              type="text"
              placeholder="Ask Saathi AI..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                fontSize: '0.82rem',
                padding: '0.45rem 0.65rem',
                borderRadius: 'var(--gs-radius-sm)',
                border: '1px solid var(--gs-border)',
              }}
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="gs-btn gs-btn-primary gs-btn-sm"
              style={{ padding: '0.45rem 0.75rem' }}
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="gs-floating-widget-btn"
        aria-label={t.floatingWidgetTooltip}
        title={t.floatingWidgetTooltip}
      >
        {isOpen ? <X size={24} /> : <Bot size={24} />}
      </button>
    </div>
  );
};
