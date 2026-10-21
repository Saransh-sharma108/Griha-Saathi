import { Router, Response } from 'express';
import { db } from './db.js';
import { authenticateUser, requireAuth, AuthenticatedRequest } from './middleware.js';

export const notificationsRouter = Router();
notificationsRouter.use(authenticateUser);

/**
 * GET /api/notifications
 * Fetch in-app notifications for authenticated user with pagination and unread filtering.
 */
notificationsRouter.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const filter = req.query.filter === 'unread' ? 'unread' : 'all';

    const allList = db.getUserNotifications(req.user!.id);
    const unreadCount = allList.filter((n) => !n.isRead).length;
    const filtered = filter === 'unread' ? allList.filter((n) => !n.isRead) : allList;
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return res.json({
      success: true,
      notifications: paginated,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/notifications:', error);
    return res.status(500).json({ success: false, error: 'Internal server error retrieving notifications.' });
  }
});

/**
 * GET /api/notifications/delivery-status
 * Transparently reports external provider configurations.
 */
notificationsRouter.get('/delivery-status', requireAuth, (_req: AuthenticatedRequest, res: Response) => {
  try {
    const hasSmsConfig = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
    const hasEmailConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    return res.json({
      success: true,
      channels: {
        inApp: {
          active: true,
          status: 'operational',
          description: 'Real-time in-app notification engine active. All platform updates, alerts, and connection requests are delivered directly to your Griha Saathi notification centre.',
        },
        sms: {
          active: hasSmsConfig,
          provider: hasSmsConfig ? 'Twilio SMS Gateway' : 'Not configured in server environment',
          description: hasSmsConfig
            ? 'SMS notification carrier dispatch operational.'
            : 'SMS provider credentials (TWILIO_ACCOUNT_SID) not supplied in server environment. Alerts are delivered exclusively via in-app notification.',
        },
        email: {
          active: hasEmailConfig,
          provider: hasEmailConfig ? `SMTP (${process.env.SMTP_HOST})` : 'Not configured in server environment',
          description: hasEmailConfig
            ? 'SMTP email dispatcher operational.'
            : 'SMTP host credentials not configured. Email notifications disabled; alerts delivered reliably via in-app notification centre.',
        },
        push: {
          active: false,
          provider: 'Web Push Notification API',
          description: 'Web push is available when user explicitly grants browser notification permissions.',
        },
      },
      disclaimer: 'Griha Saathi never fabricates SMS or email delivery confirmations. In the absence of third-party telecom or email gateway credentials, notifications are delivered securely through the authenticated in-app centre.',
    });
  } catch (error) {
    console.error('Error in GET /api/notifications/delivery-status:', error);
    return res.status(500).json({ success: false, error: 'Internal server error retrieving delivery status.' });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for current user.
 */
notificationsRouter.post('/read-all', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const markedCount = db.markAllNotificationsRead(req.user!.id);
    return res.json({
      success: true,
      markedCount,
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/read-all:', error);
    return res.status(500).json({ success: false, error: 'Internal server error marking all notifications read.' });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark single notification as read.
 */
notificationsRouter.post('/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const marked = db.markNotificationRead(String(req.params.id), req.user!.id);
    return res.json({
      success: true,
      marked,
    });
  } catch (error) {
    console.error('Error in POST /api/notifications/:id/read:', error);
    return res.status(500).json({ success: false, error: 'Internal server error updating notification.' });
  }
});

