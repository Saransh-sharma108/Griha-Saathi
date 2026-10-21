import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  FileCheck,
  FileText,
  AlertTriangle,
  UserCheck,
  Flag,
  RotateCcw,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronRight,
  X,
  MapPin,
  Building,
} from 'lucide-react';
import {
  Property,
  UserProfile,
  SupportedLanguage,
  ReviewerQueueSummary,
  FraudReport,
  PropertyDocumentItem,
  RiskIndicator,
  DuplicateListingWarning,
} from '@shared/types';
import { translations } from '@shared/i18n';

interface ReviewerWorkspaceProps {
  user: UserProfile | null;
  token: string | null;
  language: SupportedLanguage;
}

export const ReviewerWorkspace: React.FC<ReviewerWorkspaceProps> = ({
  user,
  token,
  language,
}) => {
  const [queue, setQueue] = useState<ReviewerQueueSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'listings' | 'reports'>('listings');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'under_review' | 'needs_info' | 'resubmitted' | 'suspended'>('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approve' | 'reject' | 'request_info' | 'suspend' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Document rejection modal state
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState('');

  const t = translations[language].verifications;

  const isAuthorizedReviewer =
    user &&
    (user.activeRole === 'verifier' ||
      user.activeRole === 'field_verifier' ||
      user.activeRole === 'admin' ||
      (user.roles || []).includes('verifier') ||
      (user.roles || []).includes('field_verifier') ||
      (user.roles || []).includes('admin'));

  useEffect(() => {
    if (isAuthorizedReviewer && token) {
      fetchQueue();
    }
  }, [isAuthorizedReviewer, token]);

  const fetchQueue = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/verifications/reviewer/queue', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.summary) {
        setQueue(data.summary);
      }
    } catch (err) {
      console.error('Failed to load reviewer queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !decisionAction || !token) return;

    if ((decisionAction === 'reject' || decisionAction === 'request_info' || decisionAction === 'suspend') && !decisionReason.trim()) {
      setFeedback({ message: 'A specific reason is mandatory for this decision.', type: 'error' });
      return;
    }

    setDecisionSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/verifications/reviewer/decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          decision: decisionAction,
          reason: decisionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFeedback({ message: data.error || 'Failed to record decision.', type: 'error' });
        return;
      }

      setFeedback({ message: `Decision recorded: Property updated to ${data.property?.submissionStatus}.`, type: 'success' });
      setDecisionAction(null);
      setDecisionReason('');
      setSelectedProperty(null);
      fetchQueue();
    } catch (err) {
      setFeedback({ message: 'Connection error submitting decision.', type: 'error' });
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleReviewDocument = async (documentId: string, status: 'verified' | 'rejected', rejectionReason?: string) => {
    if (!selectedProperty || !token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/verifications/reviewer/document-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          documentId,
          status,
          rejectionReason,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update local property documents
        const updatedDocs = (selectedProperty.documents || []).map((d) =>
          d.id === documentId ? data.document : d
        );
        setSelectedProperty({ ...selectedProperty, documents: updatedDocs });
        setRejectingDocId(null);
        setDocRejectReason('');
      } else {
        alert(data.error || 'Failed to review document.');
      }
    } catch (err) {
      alert('Error updating document review status.');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (reportId: string, action: 'listing_suspended' | 'none') => {
    if (!token) return;
    const notes = prompt(
      action === 'listing_suspended'
        ? 'Enter reason for suspending this property due to fraud report:'
        : 'Enter dismissal or investigation notes:'
    );
    if (notes === null) return;

    try {
      const res = await fetch(`/api/verifications/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchQueue();
      } else {
        alert(data.error || 'Failed to resolve report.');
      }
    } catch (err) {
      alert('Error resolving fraud report.');
    }
  };

  if (!isAuthorizedReviewer) {
    return (
      <div className="gs-surface-interactive" style={{ padding: '2.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: 'var(--gs-forest-soft)', color: 'var(--gs-forest-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <ShieldAlert size={32} />
        </div>
        <h3 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.75rem' }}>
          Authoritative Reviewer Access Restricted
        </h3>
        <p style={{ color: 'var(--gs-text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          The Verification & Fraud Moderation Workspace is restricted to certified field verifiers, land registry auditors, and platform administrators. In compliance with data integrity policies, ordinary user accounts cannot inspect private deeds or issue verification decisions.
        </p>
        <div style={{ padding: '1rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)', fontSize: '0.85rem', color: 'var(--gs-text-muted)', textAlign: 'left' }}>
          <strong>Setup Guidance:</strong> To test or inspect reviewer workflows in development, log in or switch your account to an authorized role holding <code>verifier</code>, <code>field_verifier</code>, or <code>admin</code> privileges.
        </div>
      </div>
    );
  }

  const filteredProperties = (queue?.items || []).filter((p) => {
    if (statusFilter === 'submitted') return p.submissionStatus === 'submitted';
    if (statusFilter === 'under_review') return p.submissionStatus === 'under_review' || p.submissionStatus === 'pending_verification';
    if (statusFilter === 'needs_info') return p.submissionStatus === 'correction_requested' || p.submissionStatus === 'additional_information_required';
    if (statusFilter === 'resubmitted') return p.submissionStatus === 'resubmitted';
    if (statusFilter === 'suspended') return p.submissionStatus === 'suspended';
    return true;
  });

  return (
    <div>
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--gs-forest-deep)', marginBottom: '0.25rem' }}>
            {t.reviewerWorkspaceTitle}
          </h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--gs-text-secondary)' }}>
            Authoritative verification queue, document inspection, duplicate collision screening, and fraud moderation.
          </p>
        </div>

        <button onClick={fetchQueue} disabled={loading} className="gs-btn gs-btn-outline gs-btn-sm">
          <RotateCcw size={14} />
          <span>{loading ? 'Refreshing...' : 'Refresh Queue'}</span>
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--gs-radius-md)',
            marginBottom: '1.25rem',
            backgroundColor: feedback.type === 'success' ? 'rgba(72, 201, 149, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--gs-border)' : 'rgba(239, 68, 68, 0.35)'}`,
            color: feedback.type === 'success' ? 'var(--gs-accent-bright)' : '#FCA5A5',
            fontSize: '0.88rem',
          }}
        >
          {feedback.message}
        </div>
      )}

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div className="gs-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gs-text-muted)' }}>PENDING REVIEW</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gs-forest-deep)' }}>
            {queue?.totalPending || 0}
          </div>
        </div>
        <div className="gs-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gs-text-muted)' }}>UNDER REVIEW</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#D97706' }}>
            {queue?.underReview || 0}
          </div>
        </div>
        <div className="gs-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gs-text-muted)' }}>NEEDS INFO</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gs-status-error)' }}>
            {queue?.needsInfo || 0}
          </div>
        </div>
        <div className="gs-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gs-text-muted)' }}>RESUBMITTED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gs-forest-primary)' }}>
            {queue?.resubmitted || 0}
          </div>
        </div>
        <div className="gs-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gs-text-muted)' }}>SUSPENDED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626' }}>
            {queue?.suspended || 0}
          </div>
        </div>
        <div className="gs-card" style={{ padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gs-text-muted)' }}>FRAUD REPORTS</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#DC2626' }}>
            {queue?.pendingReports || 0}
          </div>
        </div>
      </div>

      {/* Main Tab Toggle: Listings Queue vs Fraud Reports */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gs-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => { setActiveTab('listings'); setSelectedProperty(null); }}
          className={`gs-btn gs-btn-sm ${activeTab === 'listings' ? 'gs-btn-primary' : 'gs-btn-outline'}`}
        >
          <Building size={14} />
          <span>Listing Verification Queue ({queue?.items?.length || 0})</span>
        </button>
        <button
          onClick={() => { setActiveTab('reports'); setSelectedProperty(null); }}
          className={`gs-btn gs-btn-sm ${activeTab === 'reports' ? 'gs-btn-primary' : 'gs-btn-outline'}`}
        >
          <Flag size={14} />
          <span>Fraud Reports Moderation ({queue?.reports?.length || 0})</span>
        </button>
      </div>

      {/* VIEW 1: LISTING VERIFICATION QUEUE */}
      {activeTab === 'listings' && (
        <div>
          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {[
              { id: 'all', label: 'All Submissions' },
              { id: 'submitted', label: 'New Submissions' },
              { id: 'under_review', label: 'Under Review' },
              { id: 'needs_info', label: 'Needs Info' },
              { id: 'resubmitted', label: 'Resubmitted' },
              { id: 'suspended', label: 'Suspended' },
            ].map((chip) => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id as any)}
                className={`gs-filter-chip ${statusFilter === chip.id ? 'active' : ''}`}
                style={{ fontSize: '0.82rem' }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {filteredProperties.length === 0 ? (
            <div className="gs-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <CheckCircle2 size={36} color="var(--gs-forest-primary)" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>
                Verification Queue Clear
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-muted)', marginTop: '0.25rem' }}>
                No listing submissions currently match this filter.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: selectedProperty ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
              {/* Queue List Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredProperties.map((prop) => {
                  const isSelected = selectedProperty?.id === prop.id;
                  const isOwner = user?.id === prop.ownerId;

                  return (
                    <div
                      key={prop.id}
                      className="gs-card"
                      onClick={() => setSelectedProperty(prop)}
                      style={{
                        padding: '1.25rem',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--gs-forest-primary)' : '1px solid var(--gs-border)',
                        backgroundColor: isSelected ? 'var(--gs-forest-soft)' : 'var(--gs-bg-surface-primary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span className="gs-badge gs-badge-neutral" style={{ fontSize: '0.72rem', textTransform: 'uppercase' }}>
                              {prop.submissionStatus?.replace(/_/g, ' ')}
                            </span>
                            {isOwner && (
                              <span className="gs-badge gs-badge-warning" style={{ fontSize: '0.7rem' }}>
                                Owned by You (Self-approval Prohibited)
                              </span>
                            )}
                          </div>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gs-forest-deep)' }}>
                            {prop.title}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>
                            <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                            {prop.locality}, {prop.city}, {prop.state}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--gs-forest-primary)', fontSize: '1.1rem' }}>
                            ₹{prop.rentPerMonth?.toLocaleString('en-IN')}<span style={{ fontSize: '0.75rem', fontWeight: 500 }}>/mo</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>
                            {prop.documents?.length || 0} Doc(s) Attached
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--gs-text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--gs-border-subtle)' }}>
                        <span>Authority: <strong>{prop.declaredAuthority || 'sole_owner'}</strong></span>
                        <span>Updated: {new Date(prop.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* INSPECTOR DETAILS DRAWER */}
              {selectedProperty && (
                <div className="gs-card" style={{ padding: '1.75rem', position: 'sticky', top: '1rem', maxHeight: '85vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div>
                      <span className="gs-badge gs-badge-forest" style={{ textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                        Inspection Workspace
                      </span>
                      <h3 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', margin: '0.2rem 0' }}>
                        {selectedProperty.title}
                      </h3>
                      <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>
                        Listing ID: <code>{selectedProperty.id}</code> &bull; Owner: <code>{selectedProperty.ownerId}</code>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedProperty(null)}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Self-Approval Invariant Warning */}
                  {user?.id === selectedProperty.ownerId && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-md)', backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                      <strong>Integrity Enforcement:</strong> You are the registered owner of this property. Even as an authorized reviewer, you are strictly prohibited from approving your own listing verification.
                    </div>
                  )}

                  {/* Submitter & Authority Summary */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gs-forest-deep)', marginBottom: '0.4rem' }}>
                      Submitter Identity & Authority
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                      <div>Contact: <strong>{selectedProperty.ownerMaskedContact || 'Unverified'}</strong></div>
                      <div>Declared Role: <strong>{selectedProperty.declaredAuthority || 'sole_owner'}</strong></div>
                      <div>Rent: <strong>₹{selectedProperty.rentPerMonth?.toLocaleString('en-IN')}/mo</strong></div>
                      <div>Security Deposit: <strong>₹{selectedProperty.securityDeposit?.toLocaleString('en-IN')}</strong></div>
                    </div>
                  </div>

                  {/* Submitted Documents Inspection */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gs-text-primary)', marginBottom: '0.6rem' }}>
                      Submitted Ownership Evidence ({selectedProperty.documents?.length || 0})
                    </div>
                    {(!selectedProperty.documents || selectedProperty.documents.length === 0) ? (
                      <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)', fontStyle: 'italic' }}>
                        No confidential documents submitted with this listing.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        {selectedProperty.documents.map((doc) => (
                          <div
                            key={doc.id}
                            style={{
                              padding: '0.75rem 1rem',
                              borderRadius: 'var(--gs-radius-md)',
                              backgroundColor: doc.status === 'verified' ? 'rgba(72, 201, 149, 0.12)' : doc.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'var(--gs-surface-secondary)',
                              border: `1px solid ${doc.status === 'verified' ? 'var(--gs-border)' : doc.status === 'rejected' ? 'rgba(239, 68, 68, 0.35)' : 'var(--gs-border)'}`,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>
                                {doc.documentType.replace(/_/g, ' ').toUpperCase()}
                              </div>
                              <span className={`gs-badge ${doc.status === 'verified' ? 'gs-badge-verified' : doc.status === 'rejected' ? 'gs-badge-warning' : 'gs-badge-neutral'}`} style={{ fontSize: '0.72rem' }}>
                                {doc.status.toUpperCase()}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)', fontFamily: 'var(--gs-font-mono)', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                              SHA-256: {doc.sha256Hash || doc.documentHash}
                            </div>

                            {/* Document Review Actions */}
                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                              {doc.status !== 'verified' && (
                                <button
                                  type="button"
                                  onClick={() => handleReviewDocument(doc.id, 'verified')}
                                  disabled={loading || user?.id === selectedProperty.ownerId}
                                  className="gs-btn gs-btn-sm"
                                  style={{ backgroundColor: 'var(--gs-forest-primary)', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                >
                                  Mark Verified
                                </button>
                              )}
                              {doc.status !== 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const reason = prompt('Reason for rejecting document (e.g. illegible scan, name mismatch):');
                                    if (reason) handleReviewDocument(doc.id, 'rejected', reason);
                                  }}
                                  disabled={loading || user?.id === selectedProperty.ownerId}
                                  className="gs-btn gs-btn-sm"
                                  style={{ backgroundColor: 'var(--gs-status-error)', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                                >
                                  Reject Doc
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Decision Controls */}
                  <div style={{ paddingTop: '1.25rem', borderTop: '2px solid var(--gs-border)' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--gs-forest-deep)', marginBottom: '0.6rem' }}>
                      Record Reviewer Decision
                    </div>

                    {decisionAction ? (
                      <form onSubmit={handleDecisionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--gs-forest-deep)' }}>
                          Selected Action: <span style={{ textTransform: 'uppercase', color: decisionAction === 'approve' ? 'var(--gs-forest-primary)' : '#DC2626' }}>{decisionAction.replace('_', ' ')}</span>
                        </div>

                        <div>
                          <label className="gs-form-label" style={{ fontSize: '0.8rem' }}>
                            Decision Rationale / Feedback to Owner {decisionAction !== 'approve' ? '*' : '(Optional)'}
                          </label>
                          <textarea
                            rows={3}
                            placeholder={
                              decisionAction === 'approve'
                                ? 'Notes on land registry cross-check or physical inspection certificate...'
                                : 'Explain what documentation is missing or reason for rejection/suspension...'
                            }
                            value={decisionReason}
                            onChange={(e) => setDecisionReason(e.target.value)}
                            required={decisionAction !== 'approve'}
                            style={{ width: '100%', fontSize: '0.85rem' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => { setDecisionAction(null); setDecisionReason(''); }}
                            className="gs-btn gs-btn-outline gs-btn-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={decisionSubmitting || (decisionAction === 'approve' && user?.id === selectedProperty.ownerId)}
                            className="gs-btn gs-btn-primary gs-btn-sm"
                            style={{
                              backgroundColor: decisionAction === 'approve' ? 'var(--gs-forest-primary)' : '#DC2626',
                              borderColor: decisionAction === 'approve' ? 'var(--gs-forest-primary)' : '#DC2626',
                            }}
                          >
                            {decisionSubmitting ? 'Recording...' : `Confirm ${decisionAction.replace('_', ' ')}`}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setDecisionAction('approve')}
                          disabled={user?.id === selectedProperty.ownerId}
                          className="gs-btn gs-btn-primary gs-btn-sm"
                          title={user?.id === selectedProperty.ownerId ? 'Self-approval prohibited' : undefined}
                        >
                          <CheckCircle2 size={14} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionAction('request_info')}
                          className="gs-btn gs-btn-outline gs-btn-sm"
                          style={{ borderColor: 'var(--gs-status-warning)', color: '#B45309' }}
                        >
                          <Clock size={14} />
                          <span>Request Info</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionAction('reject')}
                          className="gs-btn gs-btn-outline gs-btn-sm"
                          style={{ borderColor: '#FCA5A5', color: '#DC2626' }}
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionAction('suspend')}
                          className="gs-btn gs-btn-outline gs-btn-sm"
                          style={{ borderColor: '#DC2626', color: '#DC2626' }}
                        >
                          <AlertTriangle size={14} />
                          <span>Suspend</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FRAUD REPORTS MODERATION */}
      {activeTab === 'reports' && (
        <div>
          {(!queue?.reports || queue.reports.length === 0) ? (
            <div className="gs-card" style={{ padding: '3rem', textAlign: 'center' }}>
              <CheckCircle2 size={36} color="var(--gs-forest-primary)" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>
                No Active Fraud Reports
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-muted)', marginTop: '0.25rem' }}>
                All user concerns have been investigated and resolved.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {queue.reports.map((report) => (
                <div
                  key={report.id}
                  className="gs-card"
                  style={{
                    padding: '1.25rem',
                    borderLeft: `4px solid ${report.status === 'pending' ? '#DC2626' : 'var(--gs-border)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span className={`gs-badge ${report.status === 'pending' ? 'gs-badge-warning' : 'gs-badge-neutral'}`} style={{ textTransform: 'uppercase' }}>
                          {report.status}
                        </span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                          ID: <code>{report.id}</code> &bull; Reported {new Date(report.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--gs-forest-deep)' }}>
                        Concern: {report.reason.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>
                        Target Property ID: <code>{report.propertyId}</code> &bull; Reporter: <code>{report.reporterMaskedContact || 'Masked Tenant'}</code>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem 1rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', fontSize: '0.86rem', color: 'var(--gs-text-primary)', marginBottom: '0.85rem' }}>
                    <strong>Reporter Description:</strong> {report.description}
                  </div>

                  {report.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleResolveReport(report.id, 'none')}
                        className="gs-btn gs-btn-outline gs-btn-sm"
                      >
                        Dismiss Report
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'listing_suspended')}
                        className="gs-btn gs-btn-primary gs-btn-sm"
                        style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                      >
                        Suspend Reported Property
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
