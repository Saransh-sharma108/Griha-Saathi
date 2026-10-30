import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Info, 
  HelpCircle, 
  User, 
  CornerDownRight,
  BookOpen,
  MapPin,
  Bed,
  Bath,
  Maximize,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Columns,
  ExternalLink,
  MessageSquare,
  Calendar,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { 
  AiChatMessage, 
  SupportedLanguage, 
  UserProfile, 
  SaathiPropertyCard, 
  PropertyComparisonItem, 
  SaathiProviderStatus, 
  SaathiActionSuggestion 
} from '@shared/types';
import { translations } from '@shared/i18n';
import { NavSection } from '../components/Header';
import { PropertyComparisonModal } from '../components/PropertyComparisonModal';

interface SaathiAiPageProps {
  language: SupportedLanguage;
  onNavigate?: (section: NavSection) => void;
  onSearchWithFilters?: (filters: { state: string; propertyType: string; maxRent: string; city?: string; locality?: string }) => void;
  onOpenAuth?: () => void;
  user?: UserProfile | null;
  token?: string | null;
}

export const SaathiAiPage: React.FC<SaathiAiPageProps> = ({ 
  language,
  onNavigate,
  onSearchWithFilters,
  onOpenAuth,
  user,
  token
}) => {
  const t = translations[language].saathiAi;

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [providerStatus, setProviderStatus] = useState<SaathiProviderStatus | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>(() => {
    const saved = sessionStorage.getItem('gs_saathi_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to welcome message
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'assistant',
        text: t.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        disclaimerNote: t.disclaimer,
      },
    ];
  });

  // Comparison Modal state
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<PropertyComparisonItem[]>([]);

  // Consequential Action Confirmation Modal state
  const [pendingAction, setPendingAction] = useState<SaathiActionSuggestion | null>(null);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatStreamRef = useRef<HTMLDivElement>(null);

  // Auto-scroll inside chat container without moving window scroll
  useEffect(() => {
    if (chatStreamRef.current) {
      chatStreamRef.current.scrollTop = chatStreamRef.current.scrollHeight;
    }
    try {
      sessionStorage.setItem('gs_saathi_chat_history', JSON.stringify(messages));
    } catch (e) {
      // Ignore quota errors
    }
  }, [messages]);

  // Fetch honest provider status on mount
  useEffect(() => {
    fetch('/api/ai/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.status) {
          setProviderStatus(data.status);
        }
      })
      .catch(() => {
        setProviderStatus({
          provider: 'deterministic_rules',
          configured: false,
          apiKeyPresent: false,
          statusMessage: 'Local Deterministic Parser Active',
          notice: 'Offline retrieval active',
        });
      });

    // Check for prefill query from Home / Help pages
    const prefill = sessionStorage.getItem('gs_saathi_prefill_query');
    if (prefill) {
      sessionStorage.removeItem('gs_saathi_prefill_query');
      setTimeout(() => {
        handleSend(prefill);
      }, 100);
    }
  }, []);

  const [sessionId] = useState<string>(() => {
    const existing = sessionStorage.getItem('gs_saathi_session_id');
    if (existing) return existing;
    const newId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem('gs_saathi_session_id', newId);
    return newId;
  });

  const handleFeedback = async (messageId: string, rating: 'helpful' | 'not_relevant' | 'incorrect_information' | 'outdated_information' | 'missing_information') => {
    try {
      await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messageId, rating }),
      });
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedbackSubmitted: true } : m));
    } catch (e) {
      console.error('Feedback submission failed:', e);
    }
  };

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
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: textToSend, language, sessionId }),
      });
      const data = await res.json();

      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          text: err?.message || 'Unable to communicate with Saathi AI service. Please ensure the backend is active.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          disclaimerNote: 'Saathi AI adheres strictly to data availability. If service is interrupted, no unverified facts are delivered.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    sessionStorage.removeItem('gs_saathi_chat_history');
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        text: t.welcomeMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        disclaimerNote: t.disclaimer,
      },
    ]);
  };

  const handleOpenComparison = async (propertyIds: string[]) => {
    try {
      const res = await fetch('/api/ai/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyIds }),
      });
      const data = await res.json();
      if (data.success && data.comparison) {
        setComparisonItems(data.comparison);
        setComparisonModalOpen(true);
      }
    } catch (e) {
      console.error('Failed to load comparison:', e);
    }
  };

  const handleTriggerAction = (action: SaathiActionSuggestion) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: SaathiActionSuggestion) => {
    setPendingAction(null);

    if (action.type === 'apply_search_filters') {
      const payload = action.payload || {};
      if (onSearchWithFilters) {
        onSearchWithFilters({
          state: payload.state || 'all',
          propertyType: payload.propertyType || 'all',
          maxRent: payload.maxRent ? String(payload.maxRent) : '',
          city: payload.city,
          locality: payload.locality,
        });
      } else if (onNavigate) {
        onNavigate('find-property');
      }
    } else if (action.type === 'compare_properties') {
      const propIds = action.payload?.propertyIds || [];
      if (propIds.length > 0) {
        await handleOpenComparison(propIds);
      }
    } else if (action.type === 'request_connection') {
      if (!user) {
        onOpenAuth?.();
        return;
      }
      if (onNavigate) {
        onNavigate('connections');
      }
    } else if (action.type === 'schedule_visit') {
      if (!user) {
        onOpenAuth?.();
        return;
      }
      if (onNavigate) {
        onNavigate('connections');
      }
    } else if (action.type === 'view_details') {
      if (onNavigate) {
        onNavigate('find-property');
      }
    }
  };

  return (
    <div className="gs-page-shell" style={{ padding: '2.5rem 0 4rem', minHeight: '85vh' }}>
      <div className="gs-container" style={{ maxWidth: '1040px' }}>
        
        {/* Workspace Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--gs-radius-lg)',
              backgroundColor: 'var(--gs-forest-soft)',
              color: 'var(--gs-forest-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              boxShadow: 'var(--gs-shadow-sm)',
            }}
          >
            <Bot size={30} />
          </div>
          <h1 className="gs-page-header-title" style={{ fontSize: '2.25rem', marginBottom: '0.4rem', fontWeight: 800 }}>
            {t.title}
          </h1>
          <p className="gs-page-header-subtitle" style={{ fontSize: '0.98rem', maxWidth: '720px', margin: '0 auto 1rem' }}>
            {t.subtitle}
          </p>

          {/* Honest Provider Status Pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: 'var(--gs-radius-full)', backgroundColor: 'var(--gs-surface-secondary)', border: '1px solid var(--gs-border)', fontSize: '0.82rem', boxShadow: 'var(--gs-shadow-xs)' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: providerStatus?.configured ? '#10B981' : '#3B82F6',
                display: 'inline-block',
              }}
            />
            <span style={{ fontWeight: 600, color: 'var(--gs-text-primary)' }}>
              {providerStatus?.configured ? t.statusGeminiConnected : t.statusActiveRuleBased}
            </span>
            <span style={{ color: 'var(--gs-text-secondary)', borderLeft: '1px solid var(--gs-border)', paddingLeft: '0.5rem' }}>
              Zero-Synthetic Policy Active
            </span>
          </div>
        </div>

        {/* Main Assistant Card */}
        <div 
          className="gs-card" 
          style={{ 
            padding: '0', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '720px', 
            overflow: 'hidden',
            boxShadow: 'var(--gs-shadow-lg)',
            border: '1px solid var(--gs-border)',
            backgroundColor: 'var(--gs-bg-surface-primary)',
          }}
        >
          {/* Top Bar with Clear History & Integrity Disclaimer */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--gs-surface-elevated)',
              borderBottom: '1px solid var(--gs-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              color: 'var(--gs-text-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="var(--gs-accent-bright)" />
              <span>{t.disclaimer}</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleClearHistory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gs-accent-bright)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--gs-radius-sm)',
                }}
                title="DPDP Privacy Control: Clear local conversation history"
              >
                <Trash2 size={13} />
                <span>{t.clearChat}</span>
              </button>
              <span style={{ fontWeight: 700, fontSize: '0.76rem', textTransform: 'uppercase', backgroundColor: 'rgba(72, 201, 149, 0.15)', color: 'var(--gs-accent-bright)', border: '1px solid var(--gs-border)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                {language.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Chat Stream */}
          <div
            ref={chatStreamRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              backgroundColor: 'var(--gs-surface)',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  {/* Sender Avatar */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: isUser ? 'var(--gs-forest-deep)' : 'var(--gs-surface-elevated)',
                      color: isUser ? '#FFFFFF' : 'var(--gs-accent-bright)',
                      border: isUser ? '1px solid var(--gs-accent)' : '1px solid var(--gs-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: 'var(--gs-shadow-xs)',
                    }}
                  >
                    {isUser ? <User size={18} /> : <Bot size={18} />}
                  </div>

                  {/* Message Bubble Content */}
                  <div style={{ maxWidth: '85%' }}>
                    <div
                      className={isUser ? 'gs-chat-bubble-sent' : 'gs-chat-bubble-received'}
                      style={{
                        padding: '1.1rem 1.35rem',
                        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        backgroundColor: isUser ? '#064E3B' : '#10291F',
                        color: isUser ? '#F4FFF9' : '#E8F2EC',
                        boxShadow: 'var(--gs-shadow-xs)',
                        border: isUser ? '1px solid #168A65' : '1px solid #24513D',
                        lineHeight: 1.6,
                        fontSize: '0.94rem',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.text}
                    </div>

                    {/* Statutory Citation Badge */}
                    {msg.relatedEntities?.legalReference && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginTop: '0.45rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: 'var(--gs-radius-sm)',
                          backgroundColor: 'rgba(72, 201, 149, 0.15)',
                          color: 'var(--gs-accent-bright)',
                          border: '1px solid var(--gs-border)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                        }}
                      >
                        <BookOpen size={13} />
                        <span>Statutory Citation: {msg.relatedEntities.legalReference}</span>
                      </div>
                    )}

                    {/* Property Cards Carousel / Grid */}
                    {msg.properties && msg.properties.length > 0 && (
                      <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gs-text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ShieldCheck size={16} color="var(--gs-accent-bright)" />
                          <span>Matching Verified Properties ({msg.properties.length})</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
                          {msg.properties.map((card) => (
                            <div
                              key={card.id}
                              style={{
                                backgroundColor: 'var(--gs-surface-elevated)',
                                border: '1px solid var(--gs-border)',
                                borderRadius: 'var(--gs-radius-md)',
                                padding: '1rem',
                                boxShadow: 'var(--gs-shadow-xs)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.65rem',
                              }}
                            >
                              {/* Title & Location */}
                              <div>
                                {card.recommendationScore && (
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#10B981', border: '1px solid rgba(52, 211, 153, 0.35)', borderRadius: '9999px', padding: '0.15rem 0.5rem', fontSize: '0.72rem', fontWeight: 800, alignSelf: 'flex-start', marginBottom: '0.35rem' }}>
                                    <Sparkles size={11} />
                                    <span>{card.recommendationScore.overallScore}% Recommendation Match</span>
                                  </div>
                                )}
                                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--gs-text-primary)', marginBottom: '0.2rem' }}>
                                  {card.title}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--gs-text-secondary)' }}>
                                  <MapPin size={13} />
                                  <span>{card.locality}, {card.city}, {card.state}</span>
                                </div>
                              </div>

                              {/* Price & Configuration */}
                              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid var(--gs-border-subtle)', borderBottom: '1px solid var(--gs-border-subtle)' }}>
                                <div>
                                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--gs-accent-bright)' }}>
                                    ₹{card.rentPerMonth.toLocaleString('en-IN')}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--gs-text-secondary)' }}> /month</span>
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gs-text-primary)' }}>
                                  {card.bedrooms} BHK • {card.furnishing.replace('_', ' ')}
                                </span>
                              </div>

                              {/* Match Rationale */}
                              <div style={{ backgroundColor: 'rgba(72, 201, 149, 0.12)', padding: '0.5rem 0.65rem', borderRadius: 'var(--gs-radius-sm)', fontSize: '0.78rem', color: 'var(--gs-text-primary)', border: '1px solid var(--gs-border)', lineHeight: 1.4 }}>
                                <div style={{ fontWeight: 700, marginBottom: '0.15rem', color: 'var(--gs-accent-bright)' }}>{t.matchRationaleTitle}:</div>
                                <div>{card.matchRationale}</div>
                              </div>

                              {/* Objective Facts Checklist */}
                              <div style={{ fontSize: '0.74rem', color: 'var(--gs-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div style={{ fontWeight: 700, color: 'var(--gs-text-primary)' }}>{t.objectiveFactsTitle}:</div>
                                {card.objectiveFacts.map((fact, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                                    <CheckCircle2 size={12} color="var(--gs-accent-bright)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <span>{fact}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Actions on this card */}
                              <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.25rem' }}>
                                <button
                                  onClick={() => handleTriggerAction({
                                    id: `view_${card.id}`,
                                    type: 'view_details',
                                    label: t.viewDetails,
                                    payload: { propertyId: card.id },
                                    requiresConfirmation: false,
                                  })}
                                  className="gs-btn gs-btn-primary gs-btn-sm"
                                  style={{ flex: 1, fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                                >
                                  {t.viewDetails}
                                </button>
                                <button
                                  onClick={() => handleOpenComparison([card.id])}
                                  className="gs-btn gs-btn-outline gs-btn-sm"
                                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                                  title="Add to Side-by-Side Comparison"
                                >
                                  <Columns size={13} />
                                </button>
                                <button
                                  onClick={() => handleTriggerAction({
                                    id: `conn_${card.id}`,
                                    type: 'request_connection',
                                    label: t.requestConnection,
                                    payload: { propertyId: card.id, title: card.title },
                                    requiresConfirmation: true,
                                  })}
                                  className="gs-btn gs-btn-outline gs-btn-sm"
                                  style={{ fontSize: '0.78rem', padding: '0.35rem 0.5rem' }}
                                  title="Connect with Verified Owner"
                                >
                                  <MessageSquare size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inline Comparison Matrix if generated */}
                    {msg.comparisonTable && msg.comparisonTable.length > 0 && (
                      <div style={{ marginTop: '0.85rem' }}>
                        <button
                          onClick={() => {
                            setComparisonItems(msg.comparisonTable!);
                            setComparisonModalOpen(true);
                          }}
                          className="gs-btn gs-btn-outline gs-btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                        >
                          <Columns size={14} />
                          <span>{t.compareTitle} ({msg.comparisonTable.length} Properties)</span>
                        </button>
                      </div>
                    )}

                    {/* Action Suggestion Buttons */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.65rem' }}>
                        {msg.actions.map((act) => (
                          <button
                            key={act.id}
                            onClick={() => handleTriggerAction(act)}
                            className="gs-btn gs-btn-outline gs-btn-sm"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.35rem 0.75rem',
                              backgroundColor: 'var(--gs-surface-elevated)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <span>{act.label}</span>
                            <ArrowRight size={12} />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* User Quality Feedback (for assistant messages) */}
                    {!isUser && msg.id !== 'welcome' && (
                      <div style={{ marginTop: '0.65rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)' }}>Was this recommendation accurate?</span>
                        {msg.feedbackSubmitted ? (
                          <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>✓ Feedback recorded. Thank you!</span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'helpful')}
                              style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid var(--gs-border)', backgroundColor: 'transparent', color: 'var(--gs-text-primary)', cursor: 'pointer' }}
                            >
                              👍 Helpful
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(msg.id, 'incorrect_information')}
                              style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem', borderRadius: '4px', border: '1px solid var(--gs-border)', backgroundColor: 'transparent', color: 'var(--gs-text-muted)', cursor: 'pointer' }}
                            >
                              ⚠️ Report Issue
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--gs-text-light)',
                        marginTop: '0.35rem',
                        textAlign: isUser ? 'right' : 'left',
                      }}
                    >
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--gs-forest-primary)', fontSize: '0.88rem', padding: '0.5rem 0' }}>
                <Bot size={20} className="gs-spin" />
                <span>Saathi AI is retrieving authoritative database records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div 
            style={{ 
              padding: '0.65rem 1.25rem', 
              backgroundColor: 'var(--gs-bg-card)', 
              borderTop: '1px solid var(--gs-border-subtle)', 
              display: 'flex', 
              gap: '0.5rem', 
              overflowX: 'auto', 
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gs-text-muted)', whiteSpace: 'nowrap' }}>
              {t.quickPromptsTitle}
            </span>
            <button
              onClick={() => handleSend(t.quickPrompt1)}
              className="gs-btn gs-btn-outline gs-btn-sm"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
            >
              {t.quickPrompt1}
            </button>
            <button
              onClick={() => handleSend(t.quickPrompt2)}
              className="gs-btn gs-btn-outline gs-btn-sm"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
            >
              {t.quickPrompt2}
            </button>
            <button
              onClick={() => handleSend(t.quickPrompt4)}
              className="gs-btn gs-btn-outline gs-btn-sm"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
            >
              {t.quickPrompt4}
            </button>
            <button
              onClick={() => handleSend(t.quickPrompt3)}
              className="gs-btn gs-btn-outline gs-btn-sm"
              style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem', whiteSpace: 'nowrap' }}
            >
              {t.quickPrompt3}
            </button>
          </div>

          {/* User Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
            style={{ 
              padding: '1rem 1.25rem', 
              backgroundColor: 'var(--gs-bg-card)', 
              borderTop: '1px solid var(--gs-border)', 
              display: 'flex', 
              gap: '0.75rem',
            }}
          >
            <input
              type="text"
              placeholder={t.inputPlaceholder}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={loading}
              style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}
            />
            <button 
              type="submit" 
              disabled={loading || !inputQuery.trim()} 
              className="gs-btn gs-btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0 1.25rem' }}
            >
              <Send size={16} />
              <span>{t.sendButton}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Side-by-Side Property Comparison Modal */}
      <PropertyComparisonModal
        isOpen={comparisonModalOpen}
        onClose={() => setComparisonModalOpen(false)}
        items={comparisonItems}
        language={language}
        onSelectProperty={(propId) => {
          if (onNavigate) onNavigate('find-property');
        }}
      />

      {/* Explicit Consequential Action Confirmation Dialog */}
      {pendingAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(19, 42, 34, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem',
          }}
        >
          <div
            className="gs-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '1.75rem',
              backgroundColor: 'var(--gs-bg-surface-primary)',
              borderRadius: 'var(--gs-radius-lg)',
              boxShadow: 'var(--gs-shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--gs-text-primary)' }}>
                  {t.confirmActionTitle}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-secondary)' }}>
                  User Confirmation Required
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--gs-text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              {t.confirmActionPrompt} <strong>"{pendingAction.label}"</strong> ({pendingAction.payload?.title || pendingAction.payload?.propertyId || 'selected listing'}).
              Saathi AI never performs silent account bookings or communication requests.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setPendingAction(null)}
                className="gs-btn gs-btn-outline"
                style={{ fontSize: '0.88rem' }}
              >
                {t.confirmCancel}
              </button>
              <button
                onClick={() => executeAction(pendingAction)}
                className="gs-btn gs-btn-primary"
                style={{ fontSize: '0.88rem' }}
              >
                {t.confirmProceed}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
