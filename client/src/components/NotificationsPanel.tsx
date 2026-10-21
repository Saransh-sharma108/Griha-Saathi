import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  FileText, 
  ShieldAlert, 
  Check, 
  ExternalLink,
  Search,
  MessageSquare,
  Users,
  Calendar,
  Info,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';
import { InAppNotification, SupportedLanguage } from '@shared/types';

interface DeliveryChannelStatus {
  active: boolean;
  provider?: string;
  description: string;
}

interface DeliveryStatusResponse {
  channels: {
    inApp: DeliveryChannelStatus;
    sms: DeliveryChannelStatus;
    email: DeliveryChannelStatus;
    push: DeliveryChannelStatus;
  };
  disclaimer: string;
}

interface NotificationsPanelProps {
  token: string | null;
  onNavigateToProperty?: (propertyId: string) => void;
  onNavigateToConnections?: (connectionId?: string) => void;
  onNavigateToVisits?: () => void;
  onNavigateToSearches?: () => void;
  language?: SupportedLanguage;
}

export const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  token,
  onNavigateToProperty,
  onNavigateToConnections,
  onNavigateToVisits,
  onNavigateToSearches,
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatusResponse | null>(null);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);

  useEffect(() => {
    if (token) {
      fetchNotifications(1, filter);
      fetchDeliveryStatus();
    }
  }, [token, filter]);

  const fetchNotifications = async (targetPage = page, activeFilter = filter) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications?page=${targetPage}&limit=12&filter=${activeFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
        }
      } else {
        setError(data.error || 'Failed to retrieve notifications.');
      }
    } catch (err) {
      setError('Network error loading notifications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/delivery-status', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.channels) {
        setDeliveryStatus(data);
      }
    } catch (err) {
      // ignore
    }
  };

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const getNotificationIcon = (type: InAppNotification['type']) => {
    switch (type) {
      case 'saved_search_alert':
        return <Search size={18} color="var(--gs-forest-primary)" />;
      case 'connection_request':
      case 'connection_accepted':
        return <Users size={18} color="var(--gs-forest-primary)" />;
      case 'new_message':
        return <MessageSquare size={18} color="var(--gs-status-info)" />;
      case 'visit_requested':
      case 'visit_confirmed':
      case 'visit_rescheduled':
      case 'visit_cancelled':
      case 'visit_declined':
        return <Calendar size={18} color="var(--gs-status-info)" />;
      case 'approval':
        return <CheckCircle2 size={18} color="var(--gs-status-success)" />;
      case 'rejection':
      case 'suspension':
      case 'security_alert':
        return <ShieldAlert size={18} color="var(--gs-status-error)" />;
      case 'correction':
        return <AlertCircle size={18} color="var(--gs-status-warning)" />;
      case 'freshness':
      case 'availability_reminder':
      case 'expiry':
        return <RefreshCw size={18} color="var(--gs-status-info)" />;
      case 'appeal':
        return <FileText size={18} color="var(--gs-forest-primary)" />;
      case 'review':
      case 'submission':
      default:
        return <Clock size={18} color="var(--gs-status-info)" />;
    }
  };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Bell size={22} />
            <span>Unified Notification Centre</span>
            {unreadCount > 0 && (
              <span className="gs-badge" style={{ backgroundColor: 'var(--gs-status-error)', color: '#FFFFFF', fontSize: '0.75rem', fontWeight: 800 }}>
                {unreadCount} Unread
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)' }}>
            Real-time auditable alerts for listing reviews, connection requests, inspection visits, and search match alerts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const next = filter === 'all' ? 'unread' : 'all';
              setFilter(next);
              fetchNotifications(1, next);
            }}
            className={`gs-btn gs-btn-sm ${filter === 'unread' ? 'gs-btn-primary' : 'gs-btn-outline'}`}
          >
            {filter === 'unread' ? 'Filtered: Unread Only' : 'Filter: All'}
          </button>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="gs-btn gs-btn-outline gs-btn-sm"
              title="Mark all notifications as read"
            >
              <Check size={14} />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            onClick={() => setShowDeliveryInfo(!showDeliveryInfo)}
            className="gs-btn gs-btn-outline gs-btn-sm"
            title="Channel delivery status"
          >
            <Radio size={14} />
            <span>Channels</span>
          </button>

          <button
            onClick={() => fetchNotifications(page, filter)}
            className="gs-btn gs-btn-outline gs-btn-sm"
            title="Refresh notifications"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Delivery Channels Transparency Card */}
      {showDeliveryInfo && deliveryStatus && (
        <div className="gs-card" style={{ marginBottom: '1.5rem', backgroundColor: 'var(--gs-forest-soft)', border: '1px solid var(--gs-forest-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Info size={18} color="var(--gs-forest-primary)" />
            <h4 style={{ margin: 0, fontSize: '0.96rem', color: 'var(--gs-forest-deep)' }}>
              Delivery Channels & Verification Status
            </h4>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ backgroundColor: 'var(--gs-bg-surface-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>In-App Centre</strong>
                <span className="gs-badge gs-badge-verified">Active</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                {deliveryStatus.channels.inApp.description}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--gs-bg-surface-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>SMS Alerts</strong>
                <span className={`gs-badge ${deliveryStatus.channels.sms.active ? 'gs-badge-verified' : 'gs-badge-neutral'}`}>
                  {deliveryStatus.channels.sms.active ? 'Operational' : 'In-App Fallback'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                {deliveryStatus.channels.sms.description}
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--gs-bg-surface-primary)', padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <strong style={{ fontSize: '0.85rem' }}>Email Notifications</strong>
                <span className={`gs-badge ${deliveryStatus.channels.email.active ? 'gs-badge-verified' : 'gs-badge-neutral'}`}>
                  {deliveryStatus.channels.email.active ? 'Operational' : 'In-App Fallback'}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                {deliveryStatus.channels.email.description}
              </div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--gs-text-muted)', fontStyle: 'italic' }}>
            {deliveryStatus.disclaimer}
          </p>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: 'var(--gs-status-error-soft)', border: '1px solid #FECACA', borderRadius: 'var(--gs-radius-md)', color: 'var(--gs-status-error)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--gs-text-muted)' }}>Retrieving in-app notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="gs-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--gs-forest-soft)', color: 'var(--gs-forest-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Bell size={24} />
          </div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
            {filter === 'unread' ? 'No Unread Notifications' : 'No Notifications Yet'}
          </h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--gs-text-muted)', maxWidth: 440, margin: '0 auto' }}>
            You will receive authentic alerts whenever verification reviews progress, connection requests arrive, property visits are scheduled, or saved searches find new matching properties.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="gs-card"
              style={{
                padding: '1.1rem 1.35rem',
                backgroundColor: notif.isRead ? 'var(--gs-bg-card)' : 'var(--gs-forest-soft)',
                borderLeft: `4px solid ${
                  notif.isRead ? 'var(--gs-border)' : 'var(--gs-forest-primary)'
                }`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', gap: '0.85rem', flex: 1, minWidth: 260 }}>
                <div style={{ marginTop: 2 }}>{getNotificationIcon(notif.type)}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: notif.isRead ? 600 : 700, fontSize: '0.95rem', color: 'var(--gs-forest-deep)' }}>
                      {notif.title}
                    </span>
                    <span className="gs-badge" style={{ backgroundColor: 'var(--gs-bg-canvas)', border: '1px solid var(--gs-border)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      {notif.type.replace(/_/g, ' ')}
                    </span>
                    {!notif.isRead && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--gs-forest-primary)' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', marginBottom: '0.4rem', lineHeight: 1.45 }}>
                    {notif.message}
                  </p>
                  <div style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)' }}>
                    {new Date(notif.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {/* Deep Links */}
                {notif.relatedPropertyId && onNavigateToProperty && (
                  <button
                    onClick={() => onNavigateToProperty(notif.relatedPropertyId!)}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                    title="View property details"
                  >
                    <ExternalLink size={13} />
                    <span>Property</span>
                  </button>
                )}

                {notif.relatedConnectionId && onNavigateToConnections && (
                  <button
                    onClick={() => onNavigateToConnections(notif.relatedConnectionId)}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                    title="Open conversation"
                  >
                    <MessageSquare size={13} />
                    <span>Message</span>
                  </button>
                )}

                {notif.relatedVisitId && onNavigateToVisits && (
                  <button
                    onClick={() => onNavigateToVisits()}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                    title="View inspection visit"
                  >
                    <Calendar size={13} />
                    <span>Visit</span>
                  </button>
                )}

                {notif.relatedSearchId && onNavigateToSearches && (
                  <button
                    onClick={() => onNavigateToSearches()}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                    title="View saved search"
                  >
                    <Search size={13} />
                    <span>Search</span>
                  </button>
                )}

                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="gs-btn gs-btn-outline gs-btn-sm"
                    title="Mark as read"
                  >
                    <Check size={13} />
                    <span>Done</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', padding: '0.5rem 0' }}>
              <button
                disabled={page <= 1}
                onClick={() => fetchNotifications(page - 1, filter)}
                className="gs-btn gs-btn-outline gs-btn-sm"
                style={{ opacity: page <= 1 ? 0.5 : 1 }}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <span style={{ fontSize: '0.85rem', color: 'var(--gs-text-muted)' }}>
                Page {page} of {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => fetchNotifications(page + 1, filter)}
                className="gs-btn gs-btn-outline gs-btn-sm"
                style={{ opacity: page >= totalPages ? 0.5 : 1 }}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
