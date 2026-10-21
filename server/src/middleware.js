import { db } from './db.js';
/**
 * Extracts and verifies session token from Authorization header or cookie.
 */
export function authenticateUser(req, res, next) {
    let token;
    // 1. Check Authorization Bearer header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    // 2. Fallback to cookie
    if (!token && req.cookies?.gs_session_token) {
        token = req.cookies.gs_session_token;
    }
    if (!token) {
        return next();
    }
    const session = db.sessions.get(token);
    if (!session || Date.now() > session.expiresAt) {
        if (session) {
            db.sessions.delete(token);
        }
        return next();
    }
    const user = db.users.get(session.userId);
    if (!user || user.isDeactivated) {
        db.sessions.delete(token);
        return next();
    }
    req.user = user;
    req.sessionToken = token;
    return next();
}
/**
 * Middleware: Requires an authenticated user session.
 */
export function requireAuth(req, res, next) {
    if (!req.user || req.user.isDeactivated) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required. Your account is deactivated or session has expired.',
        });
    }
    return next();
}
/**
 * Middleware: Enforces that the user has the required role (either as active role or in assigned roles).
 */
export function requireRole(allowedRoles) {
    const allowedList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Authentication required.' });
        }
        const userRoles = req.user.roles || [req.user.role];
        const activeRole = req.user.activeRole || req.user.role;
        const hasRole = allowedList.some((role) => userRoles.includes(role) || activeRole === role);
        if (!hasRole) {
            return res.status(403).json({
                success: false,
                error: `Permission denied. This operation requires one of the following roles: [${allowedList.join(', ')}]. Your current active role is '${activeRole}'.`,
            });
        }
        return next();
    };
}
