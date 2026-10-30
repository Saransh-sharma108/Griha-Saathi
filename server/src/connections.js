import { Router } from 'express';
import { db } from './db.js';
import { authenticateUser, requireAuth } from './middleware.js';
export const connectionsRouter = Router();
connectionsRouter.use(authenticateUser);
// ============================================================================
// 1. CONNECTIONS WORKFLOW ENDPOINTS
// ============================================================================
/**
 * GET /api/connections
 * Retrieves all connections for the authenticated user (incoming, sent, accepted, history).
 */
connectionsRouter.get('/', requireAuth, (req, res) => {
    const currentUser = req.user;
    const userConnections = db.getUserConnections(currentUser.id);
    return res.json({
        success: true,
        connections: userConnections,
        total: userConnections.length,
    });
});
/**
 * GET /api/connections/blocked
 * Retrieves list of users blocked by the authenticated user.
 */
connectionsRouter.get('/blocked', requireAuth, (req, res) => {
    const currentUser = req.user;
    const blocked = db.getBlockedUsers(currentUser.id);
    return res.json({
        success: true,
        blocked,
    });
});
/**
 * POST /api/connections/unblock
 * Unblocks a previously blocked user.
 */
connectionsRouter.post('/unblock', requireAuth, (req, res) => {
    const currentUser = req.user;
    const { targetUserId } = req.body;
    if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'targetUserId is required.' });
    }
    const unblocked = db.unblockUser(currentUser.id, String(targetUserId));
    return res.json({
        success: true,
        unblocked,
        message: unblocked ? 'User successfully unblocked.' : 'User was not blocked.',
    });
});
/**
 * GET /api/connections/visits/my-visits
 * Retrieves all property visits where current user is tenant or owner.
 */
connectionsRouter.get('/visits/my-visits', requireAuth, (req, res) => {
    const currentUser = req.user;
    const visits = db.getUserVisits(currentUser.id);
    return res.json({
        success: true,
        visits,
        total: visits.length,
    });
});
/**
 * GET /api/connections/:id
 * Retrieves a single connection's details.
 */
connectionsRouter.get('/:id', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    const connection = db.getConnection(connectionId, currentUser.id);
    if (!connection) {
        return res.status(404).json({ success: false, error: 'Connection not found or unauthorized.' });
    }
    return res.json({
        success: true,
        connection,
    });
});
/**
 * POST /api/connections
 * Sends a new connection request to a property owner.
 */
connectionsRouter.post('/', requireAuth, (req, res) => {
    const currentUser = req.user;
    const { propertyId, tenantNote } = req.body;
    if (!propertyId) {
        return res.status(400).json({ success: false, error: 'Property ID is required.' });
    }
    try {
        const connection = db.createConnectionRequest(currentUser.id, String(propertyId), tenantNote);
        return res.status(201).json({
            success: true,
            message: 'Connection request submitted to verified property owner.',
            connection,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to initiate connection request.',
        });
    }
});
/**
 * POST /api/connections/:id/accept
 * Recipient accepts a pending connection request.
 */
connectionsRouter.post('/:id/accept', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    try {
        const connection = db.acceptConnection(connectionId, currentUser.id);
        return res.json({
            success: true,
            message: 'Connection request accepted. Direct messaging is now enabled.',
            connection,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to accept connection request.',
        });
    }
});
/**
 * POST /api/connections/:id/decline
 * Recipient declines a pending connection request.
 */
connectionsRouter.post('/:id/decline', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    const { reason } = req.body;
    try {
        const connection = db.declineConnection(connectionId, currentUser.id, reason);
        return res.json({
            success: true,
            message: 'Connection request declined.',
            connection,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to decline connection request.',
        });
    }
});
/**
 * POST /api/connections/:id/cancel
 * Sender withdraws their own pending connection request.
 */
connectionsRouter.post('/:id/cancel', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    const { reason } = req.body;
    try {
        const connection = db.cancelConnection(connectionId, currentUser.id, reason);
        return res.json({
            success: true,
            message: 'Connection request withdrawn.',
            connection,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to withdraw connection request.',
        });
    }
});
/**
 * POST /api/connections/:id/block
 * Blocks the other participant in the connection.
 */
connectionsRouter.post('/:id/block', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    const { reason } = req.body;
    const conn = db.connections.get(connectionId);
    if (!conn) {
        return res.status(404).json({ success: false, error: 'Connection not found.' });
    }
    const isParty = conn.senderId === currentUser.id ||
        conn.recipientId === currentUser.id ||
        conn.tenantId === currentUser.id ||
        conn.ownerId === currentUser.id;
    if (!isParty) {
        return res.status(403).json({ success: false, error: 'Unauthorized to perform this action.' });
    }
    const targetUserId = conn.senderId === currentUser.id || conn.tenantId === currentUser.id
        ? conn.recipientId || conn.ownerId
        : conn.senderId || conn.tenantId;
    try {
        const record = db.blockUser(currentUser.id, targetUserId, reason);
        return res.json({
            success: true,
            message: 'User blocked and connection terminated.',
            record,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to block user.',
        });
    }
});
// ============================================================================
// 2. SECURE IN-APP MESSAGING ENDPOINTS
// ============================================================================
/**
 * GET /api/connections/:id/messages
 * Retrieves conversation messages for an authorized connection.
 */
connectionsRouter.get('/:id/messages', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    try {
        const threadMessages = db.getMessages(connectionId, currentUser.id);
        const connection = db.getConnection(connectionId, currentUser.id);
        return res.json({
            success: true,
            connection,
            messages: threadMessages,
            total: threadMessages.length,
        });
    }
    catch (err) {
        return res.status(403).json({
            success: false,
            error: err.message || 'Unauthorized to access this conversation.',
        });
    }
});
/**
 * POST /api/connections/:id/messages
 * Sends a message within an accepted connection.
 */
connectionsRouter.post('/:id/messages', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    const { content } = req.body;
    try {
        const message = db.sendMessage(connectionId, currentUser.id, String(content || ''));
        const thread = db.getMessages(connectionId, currentUser.id);
        const lastMsg = thread[thread.length - 1];
        const replyMessage = lastMsg && lastMsg.id !== message.id && (lastMsg.isDemo || lastMsg.senderId !== currentUser.id)
            ? lastMsg
            : undefined;
        return res.status(201).json({
            success: true,
            message,
            replyMessage,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to send message.',
        });
    }
});
/**
 * POST /api/connections/:id/read
 * Marks all incoming messages in the thread as read.
 */
connectionsRouter.post('/:id/read', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    const markedCount = db.markMessagesAsRead(connectionId, currentUser.id);
    return res.json({
        success: true,
        markedCount,
    });
});
/**
 * POST /api/connections/:id/messages/:messageId/report
 * Reports an abusive, fraudulent, or harassing message.
 */
connectionsRouter.post('/:id/messages/:messageId/report', requireAuth, (req, res) => {
    const currentUser = req.user;
    const messageId = String(req.params.messageId);
    const { reason } = req.body;
    if (!reason || String(reason).trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Report reason is required.' });
    }
    try {
        db.reportMessage(messageId, currentUser.id, String(reason).trim());
        return res.json({
            success: true,
            message: 'Message reported to trust & safety moderators.',
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to report message.',
        });
    }
});
/**
 * GET /api/connections/:id/stream
 * Server-Sent Events (SSE) real-time stream for instant message delivery.
 */
connectionsRouter.get('/:id/stream', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    const conn = db.getConnection(connectionId, currentUser.id);
    if (!conn) {
        return res.status(403).json({ success: false, error: 'Unauthorized stream request.' });
    }
    // Set SSE HTTP headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    // Send initial connected event
    res.write(`data: ${JSON.stringify({ type: 'connected', connectionId, timestamp: new Date().toISOString() })}\n\n`);
    let lastKnownCount = db.getMessages(connectionId, currentUser.id).length;
    // Poll in-memory messages every 2.5 seconds as a lightweight SSE broadcast loop
    const intervalId = setInterval(() => {
        const currentMessages = db.getMessages(connectionId, currentUser.id);
        if (currentMessages.length > lastKnownCount) {
            const newBatch = currentMessages.slice(lastKnownCount);
            lastKnownCount = currentMessages.length;
            res.write(`data: ${JSON.stringify({ type: 'new_messages', messages: newBatch })}\n\n`);
        }
    }, 2500);
    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
});
// ============================================================================
// 3. PROPERTY VISIT SCHEDULING ENDPOINTS
// ============================================================================
/**
 * POST /api/connections/:id/visits
 * Schedules a property inspection visit.
 */
connectionsRouter.post('/:id/visits', requireAuth, (req, res) => {
    const currentUser = req.user;
    const connectionId = String(req.params.id);
    const { visitDate, timeSlot, notes } = req.body;
    const conn = db.getConnection(connectionId, currentUser.id);
    if (!conn) {
        return res.status(404).json({ success: false, error: 'Connection record not found.' });
    }
    try {
        const visit = db.createPropertyVisit(currentUser.id, conn.propertyId, connectionId, String(visitDate || ''), String(timeSlot || ''), notes ? String(notes) : undefined);
        return res.status(201).json({
            success: true,
            message: 'Property visit requested successfully. Waiting for owner confirmation.',
            visit,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to schedule property visit.',
        });
    }
});
/**
 * POST /api/connections/visits/:visitId/confirm
 * Property owner confirms a requested visit.
 */
connectionsRouter.post('/visits/:visitId/confirm', requireAuth, (req, res) => {
    const currentUser = req.user;
    const visitId = String(req.params.visitId);
    const { note } = req.body;
    try {
        const visit = db.confirmPropertyVisit(visitId, currentUser.id, note ? String(note) : undefined);
        return res.json({
            success: true,
            message: 'Property visit confirmed.',
            visit,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to confirm property visit.',
        });
    }
});
/**
 * POST /api/connections/visits/:visitId/decline
 * Property owner declines a requested visit.
 */
connectionsRouter.post('/visits/:visitId/decline', requireAuth, (req, res) => {
    const currentUser = req.user;
    const visitId = String(req.params.visitId);
    const { reason } = req.body;
    try {
        const visit = db.declinePropertyVisit(visitId, currentUser.id, reason ? String(reason) : undefined);
        return res.json({
            success: true,
            message: 'Property visit declined.',
            visit,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to decline property visit.',
        });
    }
});
/**
 * POST /api/connections/visits/:visitId/reschedule
 * Proposes an alternative date and time slot for the inspection.
 */
connectionsRouter.post('/visits/:visitId/reschedule', requireAuth, (req, res) => {
    const currentUser = req.user;
    const visitId = String(req.params.visitId);
    const { newDate, newTimeSlot, note } = req.body;
    if (!newDate || !newTimeSlot) {
        return res.status(400).json({ success: false, error: 'newDate and newTimeSlot are required.' });
    }
    try {
        const visit = db.reschedulePropertyVisit(visitId, currentUser.id, String(newDate), String(newTimeSlot), note ? String(note) : undefined);
        return res.json({
            success: true,
            message: 'Alternative inspection slot proposed.',
            visit,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to reschedule property visit.',
        });
    }
});
/**
 * POST /api/connections/visits/:visitId/accept-reschedule
 * Accepts proposed alternative slot.
 */
connectionsRouter.post('/visits/:visitId/accept-reschedule', requireAuth, (req, res) => {
    const currentUser = req.user;
    const visitId = String(req.params.visitId);
    try {
        const visit = db.acceptRescheduledVisit(visitId, currentUser.id);
        return res.json({
            success: true,
            message: 'Rescheduled inspection slot confirmed.',
            visit,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to accept rescheduled slot.',
        });
    }
});
/**
 * POST /api/connections/visits/:visitId/cancel
 * Cancels a property visit with a mandatory reason.
 */
connectionsRouter.post('/visits/:visitId/cancel', requireAuth, (req, res) => {
    const currentUser = req.user;
    const visitId = String(req.params.visitId);
    const { reason } = req.body;
    if (!reason || String(reason).trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Cancellation reason is required.' });
    }
    try {
        const visit = db.cancelPropertyVisit(visitId, currentUser.id, String(reason));
        return res.json({
            success: true,
            message: 'Property visit cancelled.',
            visit,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to cancel property visit.',
        });
    }
});
/**
 * POST /api/connections/visits/:visitId/complete
 * Property owner marks an inspection completed.
 */
connectionsRouter.post('/visits/:visitId/complete', requireAuth, (req, res) => {
    const currentUser = req.user;
    const visitId = String(req.params.visitId);
    try {
        const visit = db.completePropertyVisit(visitId, currentUser.id);
        return res.json({
            success: true,
            message: 'Property inspection marked as completed.',
            visit,
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            error: err.message || 'Failed to complete property visit.',
        });
    }
});
