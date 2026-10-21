import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { authRouter } from './auth.js';
import { propertiesRouter } from './properties.js';
import { verificationsRouter } from './verifications.js';
import { providersRouter } from './providers.js';
import { aiRouter } from './ai.js';
import { connectionsRouter } from './connections.js';
import { notificationsRouter } from './notifications.js';
import path from 'path';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// Security: Disable Express signature
app.disable('x-powered-by');
// Security Headers Middleware
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});
// Production-ready CORS with origin allowlisting
const configuredOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (tools, curl, mobile apps)
        if (!origin)
            return callback(null, true);
        if (process.env.NODE_ENV !== 'production' ||
            configuredOrigins.includes(origin) ||
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://192.168.') ||
            origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }
        return callback(new Error('Blocked by CORS policy: Origin not allowed.'));
    },
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
// Serve genuine property media (Public access for photos only, documents remain private)
app.use('/uploads/photos', express.static(path.resolve(process.cwd(), 'uploads/photos'), {
    maxAge: '1d',
    setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
    },
}));
// API Routes
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/verifications', verificationsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/providers', providersRouter);
app.use('/api/ai', aiRouter);
app.use('/api/saathi-ai', aiRouter);
app.use('/api/connections', connectionsRouter);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Griha Saathi Trustworthy Housing Backend',
        version: '1.0.0-phase10-final',
        timestamp: new Date().toISOString(),
        integrityPolicy: {
            syntheticDataProhibited: true,
            demoModeDefault: false,
            targetRegions: ['Jammu & Kashmir', 'Haryana', 'Himachal Pradesh', 'Delhi', 'Punjab'],
        },
    });
});
// 404 handler for unmapped API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
});
// Serve production client build if available
const clientDistPath = path.resolve(process.cwd(), 'client/dist');
app.use(express.static(clientDistPath));
// SPA fallback for non-API client GET routes
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        const indexPath = path.join(clientDistPath, 'index.html');
        return res.sendFile(indexPath, (err) => {
            if (err)
                next();
        });
    }
    next();
});
// Centralized error-handling middleware (prevents stack trace leakage)
app.use((err, req, res, next) => {
    console.error('[Griha Saathi Error]', err.message || err);
    if (res.headersSent) {
        return next(err);
    }
    return res.status(err.status || 500).json({
        success: false,
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected server error occurred. Please try again later.'
            : err.message || 'Internal server error.',
    });
});
app.listen(PORT, () => {
    console.log(`[Griha Saathi Server] running on http://localhost:${PORT}`);
    console.log(`[Data Integrity] Strict zero-synthetic policy active. Initial target regions: Delhi, Haryana, Punjab, HP, J&K.`);
});
