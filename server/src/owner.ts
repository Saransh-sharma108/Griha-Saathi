import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from './db.js';

export const ownerRouter = Router();

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * 1. Get Owner Profile & Active Session
 * Reads directly from persistent database (server/data/users.json).
 * Automatically issues/maintains active session token and cookie so all
 * backend actions (listing, dashboard, AI) work seamlessly without OTP.
 */
ownerRouter.get('/profile', (req: Request, res: Response) => {
  try {
    const profile = db.getOwnerProfile();

    // Ensure an active session exists for the owner
    let sessionToken: string | undefined;
    for (const [token, sess] of db.sessions.entries()) {
      if (sess.userId === profile.id && sess.expiresAt > Date.now()) {
        sessionToken = token;
        break;
      }
    }

    if (!sessionToken) {
      sessionToken = 'gs_sess_owner_' + crypto.randomBytes(24).toString('hex');
      db.sessions.set(sessionToken, {
        token: sessionToken,
        userId: profile.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_TTL_MS,
      });
      db.saveSessionsToDisk();
    }

    // Set secure HTTP-only cookie
    res.cookie('gs_session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: SESSION_TTL_MS,
      path: '/',
    });

    return res.status(200).json({
      success: true,
      profile,
      sessionToken,
    });
  } catch (error: any) {
    console.error('[OwnerRouter] Error fetching owner profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve owner profile from persistent storage.',
    });
  }
});

// Alias for root of owner router
ownerRouter.get('/', (req: Request, res: Response) => {
  res.redirect('/api/owner/profile');
});

/**
 * 2. Update Owner Profile & Settings
 * Updates full name, email, phone, preferred language, and notification preferences.
 * Persists immediately to server/data/users.json with zero OTP requirement.
 */
ownerRouter.put('/profile', (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, preferredLanguage, notificationPreferences } = req.body;

    const updated = db.updateOwnerProfile({
      fullName,
      email,
      phone,
      preferredLanguage,
      notificationPreferences,
    });

    const publicProfile = db.getOwnerProfile();

    return res.status(200).json({
      success: true,
      profile: publicProfile,
      message: 'Owner profile updated and persisted successfully in database.',
    });
  } catch (error: any) {
    console.error('[OwnerRouter] Error updating owner profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update owner profile in database.',
    });
  }
});

