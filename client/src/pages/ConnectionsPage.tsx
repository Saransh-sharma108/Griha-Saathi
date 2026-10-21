import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  MessageSquare, 
  Lock, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Calendar,
  Shield,
  ShieldAlert,
  Ban,
  Check,
  X,
  RefreshCw,
  MapPin,
  ChevronRight,
  ExternalLink,
  Flag,
  UserCheck,
  CalendarCheck,
  CalendarX,
  CalendarClock
} from 'lucide-react';
import { 
  ConnectionRequest, 
  ConversationMessage, 
  PropertyVisit, 
  BlockedUserRecord, 
  SupportedLanguage, 
  UserProfile 
} from '@shared/types';
import { translations } from '@shared/i18n';

interface ConnectionsPageProps {
  user: UserProfile | null;
  token: string | null;
  onOpenAuth: () => void;
  language: SupportedLanguage;
  initialPropertyId?: string;
}

type ActiveTab = 'conversations' | 'requests' | 'visits' | 'blocked';

const TIME_SLOTS = [
  '09:00 AM - 10:00 AM',
  '10:30 AM - 11:30 AM',
  '12:00 PM - 01:00 PM',
  '02:30 PM - 03:30 PM',
  '04:00 PM - 05:00 PM',
  '05:30 PM - 06:30 PM',
];

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({
  user,
  token,
  onOpenAuth,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('conversations');
  const [connections, setConnections] = useState<ConnectionRequest[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<ConnectionRequest | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [visits, setVisits] = useState<PropertyVisit[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTimeSlot, setScheduleTimeSlot] = useState(TIME_SLOTS[0]);
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);

  const [rescheduleTarget, setRescheduleTarget] = useState<PropertyVisit | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState(TIME_SLOTS[0]);
  const [rescheduleNote, setRescheduleNote] = useState('');

  const [cancelVisitTarget, setCancelVisitTarget] = useState<PropertyVisit | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const [reportingMessage, setReportingMessage] = useState<ConversationMessage | null>(null);
  const [reportReason, setReportReason] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<number | null>(null);

  const t = translations[language].connections;

  // Auto-scroll to latest message without scrolling parent window
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  useEffect(() => {
    if (user && token) {
      fetchConnections();
      fetchVisits();
      fetchBlockedUsers();
    }
  }, [user, token]);

  // Message polling / refresh when selectedConnection changes
  useEffect(() => {
    if (selectedConnection && token) {
      fetchMessages(selectedConnection.id);
      markRead(selectedConnection.id);

      // Lightweight polling interval every 3.5s for real-time messages
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = window.setInterval(() => {
        fetchMessagesSilent(selectedConnection.id);
      }, 3500);

      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [selectedConnection, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 5000);
  };

  // 1. Data Fetchers
  const fetchConnections = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/connections', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.connections)) {
        setConnections(data.connections);
        if (!selectedConnection && data.connections.length > 0) {
          const firstAccepted = data.connections.find((c: ConnectionRequest) => c.status === 'accepted') || data.connections[0];
          setSelectedConnection(firstAccepted);
        }
      }
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/connections/visits/my-visits', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.visits)) {
        setVisits(data.visits);
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/connections/blocked', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.blocked)) {
        setBlockedUsers(data.blocked);
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  };

  const fetchMessages = async (connectionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/${connectionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchMessagesSilent = async (connectionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/${connectionId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.messages)) {
        setMessages((prev) => {
          if (data.messages.length !== prev.length) {
            return data.messages;
          }
          return prev;
        });
      }
    } catch (err) {
      // silent
    }
  };

  const markRead = async (connectionId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/connections/${connectionId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      // silent
    }
  };

  // 2. Messaging Actions
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConnection || !token) return;

    const content = newMessage.trim();
    try {
      const res = await fetch(`/api/connections/${selectedConnection.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage('');
        fetchConnections();
      } else {
        showFeedback(data.error || 'Failed to send message.', 'error');
      }
    } catch (err) {
      showFeedback('Network error sending message.', 'error');
    }
  };

  const handleReportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection || !reportingMessage || !reportReason.trim() || !token) return;

    try {
      const res = await fetch(`/api/connections/${selectedConnection.id}/messages/${reportingMessage.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reportReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Message reported to trust & safety moderators.', 'success');
        setReportingMessage(null);
        setReportReason('');
      } else {
        showFeedback(data.error || 'Failed to report message.', 'error');
      }
    } catch (err) {
      showFeedback('Network error submitting report.', 'error');
    }
  };

  // 3. Connection Request Actions
  const handleAcceptConnection = async (connectionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/${connectionId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Connection accepted. Messaging enabled.', 'success');
        fetchConnections();
      } else {
        showFeedback(data.error || 'Failed to accept connection.', 'error');
      }
    } catch (err) {
      showFeedback('Network error accepting connection.', 'error');
    }
  };

  const handleDeclineConnection = async (connectionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/${connectionId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Connection request declined.', 'info');
        fetchConnections();
      } else {
        showFeedback(data.error || 'Failed to decline connection.', 'error');
      }
    } catch (err) {
      showFeedback('Network error declining connection.', 'error');
    }
  };

  const handleCancelConnection = async (connectionId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/${connectionId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Connection request withdrawn.', 'info');
        fetchConnections();
      } else {
        showFeedback(data.error || 'Failed to withdraw connection.', 'error');
      }
    } catch (err) {
      showFeedback('Network error withdrawing connection.', 'error');
    }
  };

  const handleBlockConnection = async (connectionId: string) => {
    if (!token) return;
    if (!window.confirm('Are you sure you want to block this user? This will end communication.')) return;

    try {
      const res = await fetch(`/api/connections/${connectionId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'Blocked by user from chat thread.' }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('User blocked and connection terminated.', 'info');
        fetchConnections();
        fetchBlockedUsers();
        if (selectedConnection?.id === connectionId) {
          setSelectedConnection(null);
        }
      } else {
        showFeedback(data.error || 'Failed to block user.', 'error');
      }
    } catch (err) {
      showFeedback('Network error blocking user.', 'error');
    }
  };

  const handleUnblockUser = async (targetUserId: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/connections/unblock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('User unblocked successfully.', 'success');
        fetchBlockedUsers();
        fetchConnections();
      } else {
        showFeedback(data.error || 'Failed to unblock user.', 'error');
      }
    } catch (err) {
      showFeedback('Network error unblocking user.', 'error');
    }
  };

  // 4. Visit Scheduling Actions
  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection || !scheduleDate || !scheduleTimeSlot || !token) return;

    setScheduleSubmitting(true);
    try {
      const res = await fetch(`/api/connections/${selectedConnection.id}/visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          visitDate: scheduleDate,
          timeSlot: scheduleTimeSlot,
          notes: scheduleNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Property inspection visit requested successfully.', 'success');
        setShowScheduleModal(false);
        setScheduleDate('');
        setScheduleNotes('');
        fetchVisits();
        setActiveTab('visits');
      } else {
        showFeedback(data.error || 'Failed to schedule visit.', 'error');
      }
    } catch (err) {
      showFeedback('Network error scheduling visit.', 'error');
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleConfirmVisit = async (visitId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/visits/${visitId}/confirm`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Visit confirmed.', 'success');
        fetchVisits();
      } else {
        showFeedback(data.error || 'Failed to confirm visit.', 'error');
      }
    } catch (err) {
      showFeedback('Network error confirming visit.', 'error');
    }
  };

  const handleDeclineVisit = async (visitId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/visits/${visitId}/decline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Visit declined.', 'info');
        fetchVisits();
      } else {
        showFeedback(data.error || 'Failed to decline visit.', 'error');
      }
    } catch (err) {
      showFeedback('Network error declining visit.', 'error');
    }
  };

  const handleProposeReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget || !rescheduleDate || !rescheduleTimeSlot || !token) return;

    try {
      const res = await fetch(`/api/connections/visits/${rescheduleTarget.id}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          newDate: rescheduleDate,
          newTimeSlot: rescheduleTimeSlot,
          note: rescheduleNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Alternative inspection slot proposed.', 'success');
        setRescheduleTarget(null);
        setRescheduleDate('');
        setRescheduleNote('');
        fetchVisits();
      } else {
        showFeedback(data.error || 'Failed to reschedule visit.', 'error');
      }
    } catch (err) {
      showFeedback('Network error proposing reschedule.', 'error');
    }
  };

  const handleAcceptReschedule = async (visitId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/visits/${visitId}/accept-reschedule`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Rescheduled inspection confirmed.', 'success');
        fetchVisits();
      } else {
        showFeedback(data.error || 'Failed to accept reschedule.', 'error');
      }
    } catch (err) {
      showFeedback('Network error accepting reschedule.', 'error');
    }
  };

  const handleCancelVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelVisitTarget || !cancelReason.trim() || !token) return;

    try {
      const res = await fetch(`/api/connections/visits/${cancelVisitTarget.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Visit cancelled.', 'info');
        setCancelVisitTarget(null);
        setCancelReason('');
        fetchVisits();
      } else {
        showFeedback(data.error || 'Failed to cancel visit.', 'error');
      }
    } catch (err) {
      showFeedback('Network error cancelling visit.', 'error');
    }
  };

  const handleCompleteVisit = async (visitId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/connections/visits/${visitId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Inspection marked completed.', 'success');
        fetchVisits();
      } else {
        showFeedback(data.error || 'Failed to complete visit.', 'error');
      }
    } catch (err) {
      showFeedback('Network error completing visit.', 'error');
    }
  };

  // Filtered lists
  const incomingRequests = connections.filter(
    (c) => c.status === 'pending' && (c.recipientId === user?.id || c.ownerId === user?.id)
  );
  const sentRequests = connections.filter(
    (c) => c.status === 'pending' && (c.senderId === user?.id || c.tenantId === user?.id)
  );
  const acceptedConnections = connections.filter((c) => c.status === 'accepted');

  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingVisits = visits.filter(
    (v) => (v.status === 'confirmed' || v.status === 'pending' || v.status === 'rescheduled') && v.visitDate >= todayStr
  );
  const pastVisits = visits.filter(
    (v) => v.status === 'completed' || v.status === 'cancelled' || v.visitDate < todayStr
  );

  return (
    <div className="gs-page-shell" style={{ padding: '2.5rem 0 5rem', minHeight: '85vh' }}>
      <div className="gs-container">
        {/* Page Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 className="gs-page-header-title" style={{ fontSize: '2.2rem', marginBottom: '0.35rem' }}>
                {t.title}
              </h1>
              <p className="gs-page-header-subtitle" style={{ fontSize: '1rem' }}>
                {t.subtitle}
              </p>
            </div>

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--gs-bg-card)', padding: '0.4rem 0.85rem', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                <UserCheck size={16} color="var(--gs-forest-primary)" />
                <span style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)' }}>Verified Contact:</span>
                <strong style={{ fontSize: '0.88rem', color: 'var(--gs-forest-deep)' }}>{user.identifier}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              borderRadius: 'var(--gs-radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.9rem',
              backgroundColor: feedback.type === 'success' ? 'rgba(72, 201, 149, 0.15)' : feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              border: `1px solid ${feedback.type === 'success' ? 'var(--gs-border)' : feedback.type === 'error' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(59, 130, 246, 0.35)'}`,
              color: feedback.type === 'success' ? 'var(--gs-accent-bright)' : feedback.type === 'error' ? '#FCA5A5' : '#93C5FD',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Streamlined Compact Safety Notice */}
        <div className="gs-compact-safety-strip">
          <ShieldAlert size={18} color="#B45309" style={{ flexShrink: 0 }} />
          <div>
            <strong>{t.securityWarningTitle}:</strong> {t.securityWarningText}
          </div>
        </div>

        {/* Authenticated State vs Guarded State */}
        {!user ? (
          <div 
            className="gs-surface-interactive" 
            style={{ 
              textAlign: 'center', 
              padding: '2.5rem 2rem', 
              maxWidth: '520px', 
              margin: '2rem auto 3rem',
              borderRadius: 'var(--gs-radius-lg)',
              border: '1.5px solid var(--gs-border)',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: 'var(--gs-forest-soft)',
                color: 'var(--gs-forest-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                border: '1.5px solid var(--gs-forest-sage)'
              }}
            >
              <Lock size={22} />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Authenticated Access Protected
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--gs-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {t.authRequiredNotice}
            </p>
            <button 
              onClick={onOpenAuth} 
              className="gs-btn gs-btn-primary"
              style={{ padding: '0.65rem 1.75rem', fontSize: '0.92rem', borderRadius: 'var(--gs-radius-sm)' }}
            >
              <Lock size={15} />
              <span>{t.loginToAccess}</span>
            </button>
          </div>
        ) : (
          <div>
            {/* Navigation Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '2px solid var(--gs-border)',
                marginBottom: '2rem',
                overflowX: 'auto',
                paddingBottom: '0.2rem',
              }}
            >
              {[
                { id: 'conversations', label: `${t.tabConversations} (${acceptedConnections.length})`, icon: <MessageSquare size={16} /> },
                { id: 'requests', label: `${t.tabRequests} (${incomingRequests.length + sentRequests.length})`, icon: <Users size={16} /> },
                { id: 'visits', label: `${t.tabVisits} (${visits.length})`, icon: <Calendar size={16} /> },
                { id: 'blocked', label: `${t.tabBlocked} (${blockedUsers.length})`, icon: <Ban size={16} /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1.25rem',
                      border: 'none',
                      backgroundColor: 'transparent',
                      borderBottom: `3px solid ${isActive ? 'var(--gs-forest-primary)' : 'transparent'}`,
                      color: isActive ? 'var(--gs-forest-primary)' : 'var(--gs-text-muted)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.92rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      marginBottom: -2,
                    }}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: ACTIVE CHATS & MESSAGING */}
            {activeTab === 'conversations' && (
              <div>
                {acceptedConnections.length === 0 ? (
                  <div className="gs-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--gs-forest-soft)', color: 'var(--gs-forest-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <MessageSquare size={28} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--gs-forest-deep)', marginBottom: '0.4rem' }}>
                      {t.noActiveConnectionsTitle}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--gs-text-muted)', maxWidth: 480, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                      {t.noActiveConnectionsDesc}
                    </p>
                    <button onClick={() => setActiveTab('requests')} className="gs-btn gs-btn-primary gs-btn-sm">
                      <Users size={15} />
                      <span>View Pending Requests</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '1.5rem', minHeight: '620px' }}>
                    {/* Conversations List Panel */}
                    <div className="gs-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: 'fit-content', maxHeight: '720px', overflowY: 'auto' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gs-text-muted)' }}>
                          Established Threads
                        </span>
                        <button onClick={fetchConnections} className="gs-btn gs-btn-outline gs-btn-sm" style={{ padding: '0.25rem 0.5rem' }} title="Refresh">
                          <RefreshCw size={13} />
                        </button>
                      </div>

                      {acceptedConnections.map((conn) => {
                        const isSelected = selectedConnection?.id === conn.id;
                        const otherParty = conn.senderId === user.id ? conn.recipientProfile : conn.senderProfile;
                        const title = conn.propertyPreview?.title || `Property ID ${conn.propertyId}`;

                        return (
                          <div
                            key={conn.id}
                            onClick={() => setSelectedConnection(conn)}
                            style={{
                              padding: '0.85rem 1rem',
                              borderRadius: 'var(--gs-radius-md)',
                              backgroundColor: isSelected ? 'var(--gs-forest-soft)' : 'var(--gs-bg-card)',
                              border: `1px solid ${isSelected ? 'var(--gs-forest-primary)' : 'var(--gs-border)'}`,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                              <strong style={{ fontSize: '0.92rem', color: 'var(--gs-forest-deep)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>
                                {otherParty?.fullName || otherParty?.identifier || 'Verified Member'}
                              </strong>
                              {(conn.unreadCount || 0) > 0 && (
                                <span className="gs-badge" style={{ backgroundColor: 'var(--gs-status-error)', color: '#FFFFFF', fontSize: '0.7rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
                                  {conn.unreadCount} new
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', marginBottom: '0.4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                              {title}
                            </div>

                            {conn.lastMessage ? (
                              <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {conn.lastMessage.senderId === user.id ? 'You: ' : ''}{conn.lastMessage.content}
                              </div>
                            ) : (
                              <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-light)', fontStyle: 'italic' }}>
                                Direct connection active. Say hello.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Chat Window Panel */}
                    {selectedConnection ? (
                      <div className="gs-card" style={{ display: 'flex', flexDirection: 'column', height: '640px', padding: 0, overflow: 'hidden' }}>
                        {/* Chat Header */}
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--gs-border)', backgroundColor: 'var(--gs-forest-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong style={{ fontSize: '1.05rem', color: 'var(--gs-forest-deep)' }}>
                                {selectedConnection.senderId === user.id
                                  ? selectedConnection.recipientProfile?.fullName || selectedConnection.recipientProfile?.identifier
                                  : selectedConnection.senderProfile?.fullName || selectedConnection.senderProfile?.identifier}
                              </strong>
                              <span className="gs-badge gs-badge-verified" style={{ fontSize: '0.72rem' }}>
                                <CheckCircle2 size={11} /> Verified Contact
                              </span>
                            </div>
                            {selectedConnection.propertyPreview && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)', marginTop: '0.15rem' }}>
                                Ref: <strong>{selectedConnection.propertyPreview.title}</strong> &bull; ₹{selectedConnection.propertyPreview.rentPerMonth?.toLocaleString('en-IN')}/mo &bull; {selectedConnection.propertyPreview.city}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              onClick={() => {
                                setScheduleDate(todayStr);
                                setShowScheduleModal(true);
                              }}
                              className="gs-btn gs-btn-primary gs-btn-sm"
                              title="Request an in-person property visit"
                            >
                              <Calendar size={14} />
                              <span>{t.scheduleVisit}</span>
                            </button>
                            <button
                              onClick={() => handleBlockConnection(selectedConnection.id)}
                              className="gs-btn gs-btn-outline gs-btn-sm"
                              style={{ color: 'var(--gs-status-error)' }}
                              title="Block user from further communication"
                            >
                              <Ban size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Messages Stream */}
                        <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--gs-text-muted)', margin: 'auto', maxWidth: 360, fontSize: '0.88rem', lineHeight: 1.5 }}>
                              <MessageSquare size={32} style={{ margin: '0 auto 0.75rem', color: 'var(--gs-forest-primary)' }} />
                              No messages exchanged yet. Send a note to discuss lease terms, check move-in readiness, or schedule an inspection.
                            </div>
                          ) : (
                            messages.map((msg) => {
                              const isMe = msg.senderId === user.id;
                              return (
                                <div
                                  key={msg.id}
                                  style={{
                                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                                    maxWidth: '75%',
                                    position: 'relative',
                                  }}
                                >
                                  <div
                                    style={{
                                      backgroundColor: isMe ? 'var(--gs-forest-deep)' : 'var(--gs-forest-soft)',
                                      color: isMe ? '#FFFFFF' : 'var(--gs-text-primary)',
                                      padding: '0.75rem 1rem',
                                      borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                                      fontSize: '0.9rem',
                                      lineHeight: 1.45,
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    {msg.content}
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.4rem',
                                      fontSize: '0.72rem',
                                      color: 'var(--gs-text-light)',
                                      marginTop: '0.2rem',
                                      justifyContent: isMe ? 'flex-end' : 'flex-start',
                                    }}
                                  >
                                    <span>
                                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    {isMe && (
                                      <span>
                                        {msg.isRead ? <span style={{ color: 'var(--gs-status-success)' }}>&bull; Read</span> : '&bull; Sent'}
                                      </span>
                                    )}
                                    {!isMe && (
                                      <button
                                        onClick={() => setReportingMessage(msg)}
                                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gs-text-light)', padding: 0 }}
                                        title="Report abusive message"
                                      >
                                        <Flag size={11} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input Form */}
                        <form
                          onSubmit={handleSendMessage}
                          style={{
                            padding: '0.85rem 1rem',
                            borderTop: '1px solid var(--gs-border)',
                            backgroundColor: 'var(--gs-bg-card)',
                            display: 'flex',
                            gap: '0.6rem',
                          }}
                        >
                          <input
                            type="text"
                            placeholder={t.typeMessagePlaceholder}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            maxLength={2000}
                            style={{
                              flex: 1,
                              padding: '0.75rem 1rem',
                              border: '1px solid var(--gs-border)',
                              borderRadius: 'var(--gs-radius-md)',
                              fontSize: '0.92rem',
                            }}
                          />
                          <button type="submit" disabled={!newMessage.trim()} className="gs-btn gs-btn-primary">
                            <Send size={16} />
                            <span>{t.sendMessage}</span>
                          </button>
                        </form>
                      </div>
                    ) : (
                      <div className="gs-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '640px', color: 'var(--gs-text-muted)' }}>
                        Select a conversation from the left to view messages.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CONNECTION REQUESTS WORKFLOW */}
            {activeTab === 'requests' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Incoming Requests */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={20} />
                    <span>{t.pendingIncoming} ({incomingRequests.length})</span>
                  </h3>

                  {incomingRequests.length === 0 ? (
                    <div className="gs-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--gs-text-muted)', fontSize: '0.9rem' }}>
                      No incoming connection requests awaiting your response.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {incomingRequests.map((req) => (
                        <div key={req.id} className="gs-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                              <strong style={{ fontSize: '1rem', color: 'var(--gs-forest-deep)' }}>
                                {req.senderProfile?.fullName || req.senderProfile?.identifier || 'Prospective Tenant'}
                              </strong>
                              <span className="gs-badge gs-badge-neutral" style={{ textTransform: 'capitalize' }}>
                                {req.senderProfile?.role}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-secondary)', marginBottom: '0.4rem' }}>
                              Inquiry on: <strong>{req.propertyPreview?.title || `Property ${req.propertyId}`}</strong> &bull; {req.propertyPreview?.city}
                            </div>
                            {req.tenantNote && (
                              <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-primary)', backgroundColor: 'var(--gs-forest-soft)', padding: '0.5rem 0.75rem', borderRadius: 'var(--gs-radius-sm)', maxWidth: 520 }}>
                                "{req.tenantNote}"
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button
                              onClick={() => handleAcceptConnection(req.id)}
                              className="gs-btn gs-btn-primary gs-btn-sm"
                            >
                              <Check size={14} />
                              <span>{t.accept}</span>
                            </button>
                            <button
                              onClick={() => handleDeclineConnection(req.id)}
                              className="gs-btn gs-btn-outline gs-btn-sm"
                              style={{ color: 'var(--gs-status-error)' }}
                            >
                              <X size={14} />
                              <span>{t.decline}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent Requests */}
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={20} />
                    <span>{t.pendingSent} ({sentRequests.length})</span>
                  </h3>

                  {sentRequests.length === 0 ? (
                    <div className="gs-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--gs-text-muted)', fontSize: '0.9rem' }}>
                      No sent connection requests pending owner review.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {sentRequests.map((req) => (
                        <div key={req.id} className="gs-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--gs-forest-deep)', marginBottom: '0.2rem' }}>
                              Property: {req.propertyPreview?.title || `Property ${req.propertyId}`}
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)' }}>
                              Sent to verified landlord &bull; Submitted {new Date(req.createdAt).toLocaleDateString()}
                            </div>
                            {req.tenantNote && (
                              <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-secondary)', marginTop: '0.35rem' }}>
                                Your note: "{req.tenantNote}"
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => handleCancelConnection(req.id)}
                            className="gs-btn gs-btn-outline gs-btn-sm"
                          >
                            <span>{t.cancel}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: PROPERTY VISITS & SCHEDULING */}
            {activeTab === 'visits' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.25rem' }}>
                      {t.tabVisits}
                    </h2>
                    <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)' }}>
                      Coordinated in-person property inspections with real status tracking and conflict prevention.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (acceptedConnections.length === 0) {
                        showFeedback('Please establish an accepted connection before booking an inspection visit.', 'info');
                        setActiveTab('requests');
                        return;
                      }
                      setScheduleDate(todayStr);
                      setShowScheduleModal(true);
                    }}
                    className="gs-btn gs-btn-primary gs-btn-sm"
                  >
                    <Calendar size={15} />
                    <span>{t.scheduleVisit}</span>
                  </button>
                </div>

                {visits.length === 0 ? (
                  <div className="gs-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'var(--gs-forest-soft)', color: 'var(--gs-forest-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                      <Calendar size={28} />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--gs-forest-deep)', marginBottom: '0.4rem' }}>
                      {t.noVisitsTitle}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--gs-text-muted)', maxWidth: 480, margin: '0 auto 1.5rem' }}>
                      {t.noVisitsDesc}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Upcoming Visits */}
                    <div>
                      <h3 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarCheck size={18} color="var(--gs-status-success)" />
                        <span>{t.upcomingVisits} ({upcomingVisits.length})</span>
                      </h3>

                      {upcomingVisits.length === 0 ? (
                        <div className="gs-card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--gs-text-muted)', fontSize: '0.88rem' }}>
                          No upcoming inspection visits scheduled.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {upcomingVisits.map((visit) => {
                            const isOwner = visit.ownerId === user.id;

                            return (
                              <div
                                key={visit.id}
                                className="gs-card"
                                style={{
                                  padding: '1.5rem',
                                  borderLeft: `4px solid ${
                                    visit.status === 'confirmed'
                                      ? 'var(--gs-status-success)'
                                      : visit.status === 'rescheduled'
                                      ? 'var(--gs-status-warning)'
                                      : 'var(--gs-status-info)'
                                  }`,
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                      <span className={`gs-badge ${visit.status === 'confirmed' ? 'gs-badge-verified' : 'gs-badge-warning'}`} style={{ textTransform: 'uppercase' }}>
                                        {visit.status}
                                      </span>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                                        Ref: {visit.id}
                                      </span>
                                    </div>
                                    <h4 style={{ fontSize: '1.1rem', color: 'var(--gs-forest-deep)', marginBottom: '0.2rem' }}>
                                      {visit.propertyPreview?.title || `Property ${visit.propertyId}`}
                                    </h4>
                                    <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-secondary)' }}>
                                      <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                                      {visit.propertyPreview?.locality}, {visit.propertyPreview?.city} &bull; ₹{visit.propertyPreview?.rentPerMonth?.toLocaleString('en-IN')}/mo
                                    </div>
                                  </div>

                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gs-forest-primary)' }}>
                                      {new Date(visit.visitDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gs-text-primary)', marginTop: '0.15rem' }}>
                                      {visit.timeSlot}
                                    </div>
                                  </div>
                                </div>

                                {/* Proposed Alternative Slot Banner if rescheduled */}
                                {visit.status === 'rescheduled' && visit.proposedAlternativeSlot && (
                                  <div style={{ padding: '0.85rem 1rem', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--gs-radius-md)', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--gs-text-primary)' }}>
                                    <strong style={{ color: '#FBBF24' }}>Proposed New Inspection Slot:</strong>{' '}
                                    {visit.proposedAlternativeSlot.visitDate} ({visit.proposedAlternativeSlot.timeSlot})
                                    {visit.proposedAlternativeSlot.note && (
                                      <div style={{ color: 'var(--gs-text-secondary)', marginTop: '0.25rem' }}>
                                        Note: "{visit.proposedAlternativeSlot.note}"
                                      </div>
                                    )}
                                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                      <button
                                        onClick={() => handleAcceptReschedule(visit.id)}
                                        className="gs-btn gs-btn-primary gs-btn-sm"
                                      >
                                        <Check size={13} />
                                        <span>Accept New Slot</span>
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {visit.notes && (
                                  <div style={{ fontSize: '0.84rem', color: 'var(--gs-text-secondary)', marginBottom: '1rem', backgroundColor: 'var(--gs-bg-canvas)', padding: '0.5rem 0.75rem', borderRadius: 'var(--gs-radius-sm)' }}>
                                    <strong>Inspection Notes:</strong> {visit.notes}
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', borderTop: '1px solid var(--gs-border)', paddingTop: '0.75rem' }}>
                                  {isOwner && visit.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => handleConfirmVisit(visit.id)}
                                        className="gs-btn gs-btn-primary gs-btn-sm"
                                      >
                                        <Check size={14} />
                                        <span>{t.confirmVisit}</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeclineVisit(visit.id)}
                                        className="gs-btn gs-btn-outline gs-btn-sm"
                                        style={{ color: 'var(--gs-status-error)' }}
                                      >
                                        <X size={14} />
                                        <span>{t.declineVisit}</span>
                                      </button>
                                    </>
                                  )}

                                  {isOwner && visit.status === 'confirmed' && (
                                    <button
                                      onClick={() => handleCompleteVisit(visit.id)}
                                      className="gs-btn gs-btn-primary gs-btn-sm"
                                    >
                                      <CheckCircle2 size={14} />
                                      <span>{t.completeVisit}</span>
                                    </button>
                                  )}

                                  {(visit.status === 'confirmed' || visit.status === 'pending') && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setRescheduleTarget(visit);
                                          setRescheduleDate(visit.visitDate);
                                          setRescheduleTimeSlot(visit.timeSlot);
                                        }}
                                        className="gs-btn gs-btn-outline gs-btn-sm"
                                      >
                                        <CalendarClock size={14} />
                                        <span>{t.rescheduleVisit}</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setCancelVisitTarget(visit);
                                          setCancelReason('');
                                        }}
                                        className="gs-btn gs-btn-outline gs-btn-sm"
                                        style={{ color: 'var(--gs-status-error)' }}
                                      >
                                        <CalendarX size={14} />
                                        <span>{t.cancelVisit}</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Past & Completed Visits */}
                    {pastVisits.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Clock size={18} />
                          <span>{t.pastVisits} ({pastVisits.length})</span>
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {pastVisits.map((visit) => (
                            <div key={visit.id} className="gs-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--gs-text-primary)' }}>
                                  {visit.propertyPreview?.title || `Property ${visit.propertyId}`}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                                  {visit.visitDate} ({visit.timeSlot}) &bull; Status: <strong style={{ textTransform: 'uppercase' }}>{visit.status}</strong>
                                  {visit.cancellationReason && ` &bull; Reason: ${visit.cancellationReason}`}
                                </div>
                              </div>
                              <span className={`gs-badge ${visit.status === 'completed' ? 'gs-badge-verified' : 'gs-badge-neutral'}`}>
                                {visit.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: BLOCKED USERS */}
            {activeTab === 'blocked' && (
              <div>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Ban size={20} />
                  <span>{t.tabBlocked} ({blockedUsers.length})</span>
                </h3>

                {blockedUsers.length === 0 ? (
                  <div className="gs-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--gs-text-muted)', fontSize: '0.9rem' }}>
                    You have not blocked any accounts. Blocked accounts are prevented from initiating connections or sending messages.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {blockedUsers.map((item) => (
                      <div key={item.id} className="gs-card" style={{ padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '0.95rem', color: 'var(--gs-forest-deep)' }}>
                            User Account: {item.blockedUserId}
                          </strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                            Blocked on {new Date(item.createdAt).toLocaleDateString()}{item.reason ? ` &bull; Reason: ${item.reason}` : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblockUser(item.blockedUserId)}
                          className="gs-btn gs-btn-outline gs-btn-sm"
                        >
                          <span>{t.unblock}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: SCHEDULE PROPERTY VISIT */}
        {showScheduleModal && selectedConnection && (
          <div className="gs-modal-backdrop" onClick={() => setShowScheduleModal(false)}>
            <div className="gs-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
              <button className="gs-modal-close" onClick={() => setShowScheduleModal(false)}>
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Calendar size={20} color="var(--gs-forest-primary)" />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', margin: 0 }}>
                  {t.scheduleVisit}
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--gs-text-muted)', marginBottom: '1.25rem' }}>
                Property: <strong>{selectedConnection.propertyPreview?.title || selectedConnection.propertyId}</strong>
              </p>

              <form onSubmit={handleScheduleVisit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="gs-form-label">{t.visitDate} *</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gs-border)',
                      borderRadius: 'var(--gs-radius-md)',
                    }}
                  />
                </div>

                <div>
                  <label className="gs-form-label">{t.timeSlot} *</label>
                  <select
                    value={scheduleTimeSlot}
                    onChange={(e) => setScheduleTimeSlot(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gs-border)',
                      borderRadius: 'var(--gs-radius-md)',
                      backgroundColor: 'var(--gs-bg-card)',
                    }}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="gs-form-label">{t.visitNotes}</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Will be visiting with family, request daytime slot..."
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--gs-border)',
                      borderRadius: 'var(--gs-radius-md)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setShowScheduleModal(false)} className="gs-btn gs-btn-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={scheduleSubmitting || !scheduleDate} className="gs-btn gs-btn-primary">
                    {scheduleSubmitting ? 'Requesting...' : 'Request Inspection Visit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: PROPOSE RESCHEDULE */}
        {rescheduleTarget && (
          <div className="gs-modal-backdrop" onClick={() => setRescheduleTarget(null)}>
            <div className="gs-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <button className="gs-modal-close" onClick={() => setRescheduleTarget(null)}>
                <X size={20} />
              </button>

              <h3 style={{ fontSize: '1.2rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                {t.rescheduleVisit}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)', marginBottom: '1.25rem' }}>
                Propose an alternative inspection date and time.
              </p>

              <form onSubmit={handleProposeReschedule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="gs-form-label">New Inspection Date *</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-md)' }}
                  />
                </div>

                <div>
                  <label className="gs-form-label">New Time Slot *</label>
                  <select
                    value={rescheduleTimeSlot}
                    onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-md)', backgroundColor: 'var(--gs-bg-card)' }}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="gs-form-label">Explanation Note</label>
                  <input
                    type="text"
                    placeholder="Reason for proposing new slot..."
                    value={rescheduleNote}
                    onChange={(e) => setRescheduleNote(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-md)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button type="button" onClick={() => setRescheduleTarget(null)} className="gs-btn gs-btn-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={!rescheduleDate} className="gs-btn gs-btn-primary">
                    Send Reschedule Proposal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: CANCEL VISIT */}
        {cancelVisitTarget && (
          <div className="gs-modal-backdrop" onClick={() => setCancelVisitTarget(null)}>
            <div className="gs-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <button className="gs-modal-close" onClick={() => setCancelVisitTarget(null)}>
                <X size={20} />
              </button>

              <h3 style={{ fontSize: '1.2rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                {t.cancelVisit}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)', marginBottom: '1.25rem' }}>
                Please specify a reason for cancelling this inspection.
              </p>

              <form onSubmit={handleCancelVisit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="gs-form-label">Cancellation Reason *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Schedule conflict, property already leased, personal emergency..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-md)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setCancelVisitTarget(null)} className="gs-btn gs-btn-outline">
                    Back
                  </button>
                  <button type="submit" disabled={!cancelReason.trim()} className="gs-btn gs-btn-primary" style={{ backgroundColor: 'var(--gs-status-error)', borderColor: 'var(--gs-status-error)' }}>
                    Confirm Cancellation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: REPORT ABUSIVE MESSAGE */}
        {reportingMessage && (
          <div className="gs-modal-backdrop" onClick={() => setReportingMessage(null)}>
            <div className="gs-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
              <button className="gs-modal-close" onClick={() => setReportingMessage(null)}>
                <X size={20} />
              </button>

              <h3 style={{ fontSize: '1.2rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                {t.report}
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)', marginBottom: '1rem' }}>
                Message: "{reportingMessage.content}"
              </p>

              <form onSubmit={handleReportMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="gs-form-label">Violation Reason *</label>
                  <textarea
                    rows={3}
                    placeholder="Describe how this message violates trust & safety policies (harassment, off-platform payment demand, abusive language)..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-md)' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setReportingMessage(null)} className="gs-btn gs-btn-outline">
                    Cancel
                  </button>
                  <button type="submit" disabled={!reportReason.trim()} className="gs-btn gs-btn-primary" style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}>
                    Submit Report
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
