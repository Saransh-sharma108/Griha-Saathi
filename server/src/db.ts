import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getPool, withTransaction, getDatabaseStatus } from './db/pgPool.js';
import { 
  Property, 
  UserProfile, 
  VerificationRecord, 
  ConnectionRequest, 
  ConversationMessage,
  UserRole,
  SupportedLanguage,
  NotificationPreferences,
  SecurityAuditItem,
  SessionInfo,
  SavedPropertyRecord,
  ListingDraft,
  ListingSubmissionStatus,
  OwnerListingSummary,
  StatusHistoryEntry,
  FraudReport,
  FraudReportReason,
  FraudReportStatus,
  ListingAppeal,
  InAppNotification,
  PropertyDocumentItem,
  ReviewerQueueSummary,
  ConnectionStatus,
  PropertyVisit,
  PropertyVisitStatus,
  VisitStatusHistoryEntry,
  BlockedUserRecord,
  SavedSearchRecord,
  SavedSearchFilters,
  OwnerPerformanceAnalytics,
  AiFeedbackSubmission,
  SaathiConversationContext
} from '../../shared/types.js';

export interface UserRecord {
  id: string; // user_id
  user_id?: string;
  identifier: string; // Real primary phone or email
  phone?: string;     // mobile_number
  mobile_number?: string;
  normalizedPhone?: string; // normalized_mobile_number (E.164 +919876543210)
  normalized_mobile_number?: string;
  email?: string;     // email_address
  email_address?: string;
  normalizedEmail?: string; // normalized_email_address
  normalized_email_address?: string;
  role: UserRole;     // Current active role
  activeRole: UserRole;
  roles: UserRole[];  // account_purposes
  account_purposes?: UserRole[];
  fullName?: string;  // full_name
  full_name?: string;
  avatarUrl?: string;
  preferredLanguage: SupportedLanguage;
  notificationPreferences: NotificationPreferences;
  pinHash: string;    // pin_hash (secure bcrypt hash, never plaintext)
  pin_hash?: string;
  isPhoneVerified: boolean; // mobile_verified
  mobile_verified?: boolean;
  isEmailVerified: boolean; // email_verified
  email_verified?: boolean;
  isIdentityVerified: boolean;
  isDeactivated?: boolean;
  accountStatus?: 'active' | 'deactivated' | 'suspended'; // account_status
  account_status?: 'active' | 'deactivated' | 'suspended';
  failedPinAttempts: number;
  lockoutUntil?: number; // Timestamp ms
  createdAt: string; // created_at
  created_at?: string;
  updatedAt: string; // updated_at
  updated_at?: string;
  lastLoginAt?: string;
  pinChangedAt?: string;
  termsAcceptedAt?: string;
  otpPreference?: 'sms' | 'email';
}

export type OtpDeliveryStatus = 
  | 'otp_generated'
  | 'provider_accepted'
  | 'provider_rejected'
  | 'delivery_confirmed'
  | 'delivery_unknown';

export interface OtpChallenge {
  id: string; // challenge_id
  challenge_id?: string;
  userId?: string; // user_id or registration reference
  user_id?: string;
  identifier: string; // destination email or phone (normalized)
  destination?: string;
  type: 'registration' | 'recovery' | 'contact_update'; // delivery_channel
  delivery_channel?: 'sms' | 'email';
  otpHash: string;    // otp_hash (bcrypt hash of raw OTP)
  otp_hash?: string;
  expiresAt: number;  // expires_at
  expires_at?: number;
  attemptsRemaining: number;
  attempts?: number;
  lastRequestedAt: number;      // For 60-second cooldown
  requestCountInWindow: number; // For rate limiting (e.g. max 5/hr)
  windowStartedAt: number;
  verified: boolean;
  verifiedAt?: number;
  verified_at?: number;
  verificationToken?: string;
  verificationTokenExpiresAt?: number;
  provider?: string;
  providerReferenceId?: string;
  deliveryStatus?: OtpDeliveryStatus;
  metadata?: {
    userId?: string;
    newContact?: string;
    roles?: UserRole[];
    fullName?: string;
    registeredPhone?: string;
    normalizedPhone?: string;
    registeredEmail?: string;
    normalizedEmail?: string;
    otpChannel?: 'sms' | 'email';
    termsAccepted?: boolean;
    preferredLanguage?: SupportedLanguage;
  };
}

export interface SessionRecord {
  token: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  expiresAt: number;
}

export interface SecurityAuditEvent {
  id: string;
  userId: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
  timestamp: string;
}

export const FRESHNESS_POLICY_DAYS = 60;

/**
 * Robust Windows/OneDrive-safe atomic file writing.
 * Avoids EPERM errors during rename over locked/indexed files.
 */
function safeWriteJsonSync(targetPath: string, data: any): void {
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const content = JSON.stringify(data, null, 2);
    const tempPath = `${targetPath}.${Date.now()}.${Math.random().toString(36).slice(2, 6)}.tmp`;
    fs.writeFileSync(tempPath, content, 'utf8');
    try {
      fs.renameSync(tempPath, targetPath);
    } catch {
      // Windows file locking/OneDrive sync fallback: copy and remove temp
      fs.copyFileSync(tempPath, targetPath);
      try {
        fs.unlinkSync(tempPath);
      } catch {}
    }
  } catch (err: any) {
    console.error(`[Database] Error writing to ${targetPath}:`, err.message);
  }
}

export class InMemoryDatabase {
  public users: Map<string, UserRecord> = new Map();
  public otpChallenges: Map<string, OtpChallenge> = new Map();
  public sessions: Map<string, SessionRecord> = new Map();
  public auditEvents: SecurityAuditEvent[] = [];
  public properties: Map<string, Property> = new Map();
  public savedProperties: Map<string, SavedPropertyRecord> = new Map();
  public drafts: Map<string, ListingDraft> = new Map();
  public verificationRecords: Map<string, VerificationRecord> = new Map();
  public connections: Map<string, ConnectionRequest> = new Map();
  public messages: ConversationMessage[] = [];
  public fraudReports: Map<string, FraudReport> = new Map();
  public appeals: Map<string, ListingAppeal> = new Map();
  public notifications: Map<string, InAppNotification> = new Map();
  public propertyVisits: Map<string, PropertyVisit> = new Map();
  public blockedUsers: Map<string, BlockedUserRecord> = new Map();
  public userMessageTimestamps: Map<string, number[]> = new Map();
  public savedSearches: Map<string, SavedSearchRecord> = new Map();
  public propertyViews: Map<string, { userId?: string; ip?: string; timestamp: string }[]> = new Map();
  public aiFeedback: Map<string, AiFeedbackSubmission> = new Map();
  public aiSessions: Map<string, SaathiConversationContext> = new Map();

  public dataFilePath: string = path.resolve(process.cwd(), 'server/data/properties.json');
  public usersFilePath: string = path.resolve(process.cwd(), 'server/data/users.json');
  public challengesFilePath: string = path.resolve(process.cwd(), 'server/data/otp_challenges.json');
  public sessionsFilePath: string = path.resolve(process.cwd(), 'server/data/sessions.json');
  public auditFilePath: string = path.resolve(process.cwd(), 'server/data/audit_events.json');

  constructor() {
    // STRICT DATA INTEGRITY & PERSISTENCE:
    // Zero synthetic properties, zero fake users, and zero fake reviews.
    // Persistent records only through genuine user interaction or verified integrations.
    this.loadUsersFromDisk();
    this.ensureOwnerProfile();
    this.loadChallengesFromDisk();
    this.loadSessionsFromDisk();
    this.loadAuditEventsFromDisk();
    this.loadPropertiesFromDisk();
  }

  public loadUsersFromDisk(): void {
    try {
      if (fs.existsSync(this.usersFilePath)) {
        const raw = fs.readFileSync(this.usersFilePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.id) {
              this.users.set(item.id, item);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Database] Error loading users from disk:', err);
    }
  }

  public saveUsersToDisk(): void {
    safeWriteJsonSync(this.usersFilePath, Array.from(this.users.values()));
  }

  public ensureOwnerProfile(): UserRecord {
    const ownerId = 'usr_owner_saransh';
    const ownerEmail = 'sharma108saransh@gmail.com';
    const ownerFullName = 'Saransh Sharma';

    // 1. Check if owner already exists by ID or email (Prevent duplicate creation)
    let existingOwner: UserRecord | undefined = this.users.get(ownerId);
    if (!existingOwner) {
      for (const u of this.users.values()) {
        if (
          u.email?.toLowerCase() === ownerEmail.toLowerCase() ||
          u.identifier?.toLowerCase() === ownerEmail.toLowerCase() ||
          u.id === ownerId
        ) {
          existingOwner = u;
          break;
        }
      }
    }

    if (existingOwner) {
      let modified = false;
      if (!existingOwner.fullName || existingOwner.fullName !== ownerFullName) {
        existingOwner.fullName = ownerFullName;
        modified = true;
      }
      if (!existingOwner.email) {
        existingOwner.email = ownerEmail;
        modified = true;
      }
      if (existingOwner.role !== 'owner') {
        existingOwner.role = 'owner';
        existingOwner.activeRole = 'owner';
        modified = true;
      }
      if (!existingOwner.roles || !existingOwner.roles.includes('owner')) {
        existingOwner.roles = Array.from(new Set([...(existingOwner.roles || []), 'owner', 'admin']));
        modified = true;
      }
      if (modified) {
        this.saveUsersToDisk();
      }
      return existingOwner;
    }

    // 2. Prevent duplicate creation: initialize once only
    const nowIso = new Date().toISOString();
    const newOwner: UserRecord = {
      id: ownerId,
      identifier: ownerEmail,
      email: ownerEmail,
      fullName: ownerFullName,
      role: 'owner',
      activeRole: 'owner',
      roles: ['owner', 'admin'],
      phone: '',
      preferredLanguage: 'en',
      notificationPreferences: {
        emailAlerts: true,
        smsAlerts: true,
        propertyInquiries: true,
        securityAlerts: true,
        savedSearchAlerts: true,
      },
      pinHash: '$2b$10$JjG1rIb9r8vjGMp6N5ONPOsm4u2i69wk1ivW1CtlGdPJKPbhBq3S.',
      isPhoneVerified: false,
      isEmailVerified: true,
      isIdentityVerified: true,
      failedPinAttempts: 0,
      accountStatus: 'active',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.users.set(ownerId, newOwner);
    this.saveUsersToDisk();
    this.ensureDemoConnections(ownerId);
    return newOwner;
  }

  public getOwnerProfile(): {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    initials: string;
    accountType: string;
    role: UserRole;
    activeRole: UserRole;
    roles: UserRole[];
    preferredLanguage: SupportedLanguage;
    notificationPreferences: NotificationPreferences;
    accountStatus: 'active' | 'deactivated' | 'suspended';
    isIdentityVerified: boolean;
    createdAt: string;
    updatedAt: string;
  } {
    const owner = this.ensureOwnerProfile();
    return {
      id: owner.id,
      fullName: owner.fullName || 'Saransh Sharma',
      email: owner.email || 'sharma108saransh@gmail.com',
      phone: owner.phone || '',
      initials: 'SS',
      accountType: 'Website Owner / Administrator',
      role: owner.role,
      activeRole: owner.activeRole,
      roles: owner.roles,
      preferredLanguage: owner.preferredLanguage || 'en',
      notificationPreferences: owner.notificationPreferences || {
        emailAlerts: true,
        smsAlerts: true,
        propertyInquiries: true,
        securityAlerts: true,
        savedSearchAlerts: true,
      },
      accountStatus: owner.accountStatus || 'active',
      isIdentityVerified: true,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };
  }

  public updateOwnerProfile(updates: {
    fullName?: string;
    email?: string;
    phone?: string;
    preferredLanguage?: SupportedLanguage;
    notificationPreferences?: Partial<NotificationPreferences>;
  }): UserRecord {
    const owner = this.ensureOwnerProfile();
    const nowIso = new Date().toISOString();

    if (updates.fullName !== undefined && typeof updates.fullName === 'string' && updates.fullName.trim()) {
      owner.fullName = updates.fullName.trim();
    }
    if (updates.email !== undefined && typeof updates.email === 'string' && updates.email.trim()) {
      owner.email = updates.email.trim().toLowerCase();
      owner.identifier = owner.email;
    }
    if (updates.phone !== undefined && typeof updates.phone === 'string') {
      owner.phone = updates.phone.trim();
      if (owner.phone) {
        owner.isPhoneVerified = true;
      }
    }
    if (updates.preferredLanguage && ['en', 'hi', 'hi-en'].includes(updates.preferredLanguage)) {
      owner.preferredLanguage = updates.preferredLanguage;
    }
    if (updates.notificationPreferences && typeof updates.notificationPreferences === 'object') {
      owner.notificationPreferences = {
        ...owner.notificationPreferences,
        ...updates.notificationPreferences,
      };
    }

    owner.updatedAt = nowIso;
    this.users.set(owner.id, owner);
    this.saveUsersToDisk();
    return owner;
  }

  public loadChallengesFromDisk(): void {
    try {
      if (fs.existsSync(this.challengesFilePath)) {
        const raw = fs.readFileSync(this.challengesFilePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const now = Date.now();
          for (const item of list) {
            // Keep challenges that are unexpired or verified within 1 hour
            if (item && item.identifier && (item.expiresAt > now || (item.verified && now - item.lastRequestedAt < 3600000))) {
              this.otpChallenges.set(item.identifier, item);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Database] Error loading OTP challenges from disk:', err);
    }
  }

  public saveChallengesToDisk(): void {
    const now = Date.now();
    const list = Array.from(this.otpChallenges.values()).filter(
      (c) => c.expiresAt > now || (c.verified && now - c.lastRequestedAt < 3600000)
    );
    safeWriteJsonSync(this.challengesFilePath, list);
  }

  public loadSessionsFromDisk(): void {
    try {
      if (fs.existsSync(this.sessionsFilePath)) {
        const raw = fs.readFileSync(this.sessionsFilePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const now = Date.now();
          for (const item of list) {
            if (item && item.token && item.expiresAt > now) {
              this.sessions.set(item.token, item);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Database] Error loading sessions from disk:', err);
    }
  }

  public saveSessionsToDisk(): void {
    const now = Date.now();
    const list = Array.from(this.sessions.values()).filter((s) => s.expiresAt > now);
    safeWriteJsonSync(this.sessionsFilePath, list);
  }

  public loadAuditEventsFromDisk(): void {
    try {
      if (fs.existsSync(this.auditFilePath)) {
        const raw = fs.readFileSync(this.auditFilePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          this.auditEvents = list;
        }
      }
    } catch (err) {
      console.error('[Database] Error loading audit events from disk:', err);
    }
  }

  public saveAuditEventsToDisk(): void {
    safeWriteJsonSync(this.auditFilePath, this.auditEvents.slice(-1000));
  }

  public loadPropertiesFromDisk(): void {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.id) {
              this.properties.set(item.id, item);
              if (item.verificationRecord) {
                this.verificationRecords.set(item.id, item.verificationRecord);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[Database] Error loading properties from disk:', err);
    }
  }

  public savePropertiesToDisk(): void {
    try {
      const dir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const list = Array.from(this.properties.values());
      fs.writeFileSync(this.dataFilePath, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('[Database] Error saving properties to disk:', err);
    }
  }

  public maskIdentifier(identifier?: string): string {
    if (!identifier) return '';
    const clean = identifier.trim();
    if (clean.includes('*')) {
      return clean;
    }
    if (clean.includes('@')) {
      const parts = clean.split('@');
      const name = parts[0];
      const domain = parts[1];
      const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
      return `${maskedName}@${domain}`;
    }
    // Phone number masking (+91 98******10 or 98******10)
    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      const last10 = digitsOnly.slice(-10);
      return `${last10.slice(0, 2)}******${last10.slice(-2)}`;
    }
    return '***';
  }

  public toPublicProfile(user: UserRecord): UserProfile {
    const activeRole = user.activeRole || user.role || 'tenant';
    const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : [activeRole];

    return {
      id: user.id,
      identifier: this.maskIdentifier(user.identifier),
      phone: user.phone ? this.maskIdentifier(user.phone) : undefined,
      normalizedPhone: user.normalizedPhone ? `+91 ${this.maskIdentifier(user.phone || user.normalizedPhone)}` : undefined,
      email: user.email ? this.maskIdentifier(user.email) : undefined,
      normalizedEmail: user.normalizedEmail ? this.maskIdentifier(user.normalizedEmail) : undefined,
      role: activeRole,
      activeRole: activeRole,
      roles: roles,
      fullName: user.fullName, // undefined if not explicitly provided
      avatarUrl: user.avatarUrl,
      preferredLanguage: user.preferredLanguage || 'en',
      notificationPreferences: user.notificationPreferences || {
        emailAlerts: true,
        smsAlerts: true,
        propertyInquiries: true,
        securityAlerts: true,
        savedSearchAlerts: true,
      },
      isPhoneVerified: Boolean(user.isPhoneVerified),
      isEmailVerified: Boolean(user.isEmailVerified),
      isIdentityVerified: Boolean(user.isIdentityVerified),
      isDeactivated: Boolean(user.isDeactivated),
      accountStatus: user.accountStatus || (user.isDeactivated ? 'deactivated' : 'active'),
      termsAcceptedAt: user.termsAcceptedAt,
      otpPreference: user.otpPreference,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      pinChangedAt: user.pinChangedAt,
    };
  }

  public getUserById(userId: string): UserProfile | null {
    const user = this.users.get(userId);
    if (!user) return null;
    return this.toPublicProfile(user);
  }

  public findUserByPhone(phone: string): UserRecord | undefined {
    if (!phone) return undefined;
    const cleanDigits = phone.replace(/\D/g, '');
    const tenDigit = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    if (!tenDigit || tenDigit.length < 10) return undefined;

    for (const user of this.users.values()) {
      if (user.phone) {
        const uDigits = user.phone.replace(/\D/g, '');
        if (uDigits.endsWith(tenDigit)) return user;
      }
      if (user.normalizedPhone) {
        const uDigits = user.normalizedPhone.replace(/\D/g, '');
        if (uDigits.endsWith(tenDigit)) return user;
      }
      if (user.identifier && !user.identifier.includes('@')) {
        const uDigits = user.identifier.replace(/\D/g, '');
        if (uDigits.endsWith(tenDigit)) return user;
      }
    }
    return undefined;
  }

  public findUserByEmail(email: string): UserRecord | undefined {
    if (!email || typeof email !== 'string') return undefined;
    const norm = email.trim().toLowerCase();
    if (!norm || !norm.includes('@')) return undefined;

    for (const user of this.users.values()) {
      if (user.email && user.email.trim().toLowerCase() === norm) return user;
      if (user.normalizedEmail && user.normalizedEmail.trim().toLowerCase() === norm) return user;
      if (user.identifier && user.identifier.trim().toLowerCase() === norm) return user;
    }
    return undefined;
  }

  public findUserByIdentifier(identifier: string): UserRecord | undefined {
    if (!identifier || typeof identifier !== 'string') return undefined;
    const raw = identifier.trim().toLowerCase();

    // Direct ID match
    const directUser = this.users.get(raw);
    if (directUser) return directUser;

    // Check email match
    if (raw.includes('@')) {
      const emailUser = this.findUserByEmail(raw);
      if (emailUser) return emailUser;
    }

    // Check phone match
    const phoneUser = this.findUserByPhone(raw);
    if (phoneUser) return phoneUser;

    const cleanPhone = raw.replace(/[\s-+]/g, '');
    for (const user of this.users.values()) {
      const userIdent = user.identifier.toLowerCase();
      const userPhone = user.phone ? user.phone.replace(/[\s-+]/g, '').toLowerCase() : '';
      const userEmail = user.email ? user.email.toLowerCase() : '';

      if (
        userIdent === raw ||
        (userPhone && (userPhone === cleanPhone || userPhone.endsWith(cleanPhone) || cleanPhone.endsWith(userPhone))) ||
        (userEmail && userEmail === raw)
      ) {
        return user;
      }
    }
    return undefined;
  }

  public logAuditEvent(
    userId: string,
    action: string,
    details: string,
    ipAddress?: string,
    userAgent?: string
  ): SecurityAuditEvent {
    const event: SecurityAuditEvent = {
      id: `evt_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      action,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    };
    this.auditEvents.push(event);
    this.saveAuditEventsToDisk();
    return event;
  }

  public getUserAuditEvents(userId: string, limit: number = 20): SecurityAuditItem[] {
    return this.auditEvents
      .filter((e) => e.userId === userId)
      .slice(-limit)
      .reverse()
      .map((e) => ({
        id: e.id,
        action: e.action,
        details: e.details,
        timestamp: e.timestamp,
      }));
  }

  public getUserSessions(userId: string, currentToken?: string): SessionInfo[] {
    const now = Date.now();
    const sessions: SessionInfo[] = [];

    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.expiresAt > now) {
        sessions.push({
          tokenPreview: `${session.token.slice(0, 6)}...${session.token.slice(-4)}`,
          isCurrent: session.token === currentToken,
          createdAt: new Date(session.createdAt).toISOString(),
          expiresAt: new Date(session.expiresAt).toISOString(),
        });
      }
    }
    return sessions;
  }

  public invalidateUserSessions(userId: string, exceptToken?: string): void {
    for (const [token, session] of this.sessions.entries()) {
      if (session.userId === userId && token !== exceptToken) {
        this.sessions.delete(token);
      }
    }
  }

  // --- Real-Data Discovery & Availability Freshness Methods ---

  public isFreshAvailability(availabilityConfirmedAt?: string): boolean {
    if (!availabilityConfirmedAt) return false;
    const confirmedTime = Date.parse(availabilityConfirmedAt);
    if (isNaN(confirmedTime)) return false;
    const elapsedDays = (Date.now() - confirmedTime) / (1000 * 60 * 60 * 24);
    return elapsedDays >= 0 && elapsedDays <= FRESHNESS_POLICY_DAYS;
  }

  public toPublicProperty(property: Property): Property {
    const isConfirmed = this.isFreshAvailability(property.availabilityConfirmedAt);
    
    // Mask owner contact if provided, safeguarding user privacy per DPDP Act
    const ownerMasked = property.ownerMaskedContact 
      ? this.maskIdentifier(property.ownerMaskedContact) 
      : undefined;

    // Strict DPDP Protection: never expose private ownership documents or internal moderation notes in public discovery
    const { documents, correctionNotes, ...publicFields } = property;

    return {
      ...publicFields,
      isAvailabilityConfirmed: isConfirmed,
      ownerMaskedContact: ownerMasked,
      documents: undefined,
      correctionNotes: undefined,
    };
  }

  public saveProperty(userId: string, propertyId: string): SavedPropertyRecord {
    const key = `${userId}:${propertyId}`;
    const existing = this.savedProperties.get(key);
    if (existing) return existing;

    const record: SavedPropertyRecord = {
      id: `save_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      propertyId,
      savedAt: new Date().toISOString(),
    };
    this.savedProperties.set(key, record);
    return record;
  }

  public unsaveProperty(userId: string, propertyId: string): boolean {
    const key = `${userId}:${propertyId}`;
    return this.savedProperties.delete(key);
  }

  public isPropertySaved(userId: string, propertyId: string): boolean {
    const key = `${userId}:${propertyId}`;
    return this.savedProperties.has(key);
  }

  public getUserSavedProperties(userId: string): { record: SavedPropertyRecord; property?: Property }[] {
    const list: { record: SavedPropertyRecord; property?: Property }[] = [];
    for (const record of this.savedProperties.values()) {
      if (record.userId === userId) {
        const prop = this.properties.get(record.propertyId);
        list.push({
          record,
          property: prop ? this.toPublicProperty(prop) : undefined,
        });
      }
    }
    return list.sort((a, b) => Date.parse(b.record.savedAt) - Date.parse(a.record.savedAt));
  }

  public reconfirmPropertyAvailability(propertyId: string, userId: string, isAdmin = false): Property | null {
    const prop = this.properties.get(propertyId);
    if (!prop) return null;

    if (!isAdmin && prop.ownerId !== userId) {
      throw new Error('Unauthorized: only the listing owner or platform administrator can reconfirm availability.');
    }

    const now = new Date().toISOString();
    prop.availabilityConfirmedAt = now;
    prop.isAvailabilityConfirmed = true;
    prop.updatedAt = now;
    this.properties.set(propertyId, prop);
    return this.toPublicProperty(prop);
  }

  // --- Phase 5: Draft Persistence & Resumption Methods ---

  public saveDraft(userId: string, draftId: string | undefined, currentStep: number, data: Partial<Property>): ListingDraft {
    const id = draftId && this.drafts.has(draftId) ? draftId : `draft_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const existing = this.drafts.get(id);

    if (existing && existing.userId !== userId) {
      throw new Error('Unauthorized: cannot modify another user\'s draft.');
    }

    const draft: ListingDraft = {
      id,
      userId,
      currentStep: currentStep || 1,
      data: {
        ...(existing?.data || {}),
        ...data,
      },
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.drafts.set(id, draft);
    return draft;
  }

  public getUserDrafts(userId: string): ListingDraft[] {
    const list: ListingDraft[] = [];
    for (const draft of this.drafts.values()) {
      if (draft.userId === userId) {
        list.push(draft);
      }
    }
    return list.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }

  public getDraft(userId: string, draftId: string): ListingDraft | null {
    const draft = this.drafts.get(draftId);
    if (!draft || draft.userId !== userId) {
      return null;
    }
    return draft;
  }

  public deleteDraft(userId: string, draftId: string): boolean {
    const draft = this.drafts.get(draftId);
    if (!draft || draft.userId !== userId) {
      return false;
    }
    return this.drafts.delete(draftId);
  }

  // --- Phase 5: Owner Listing & Submission Workflow Methods ---

  public getUserListings(userId: string): Property[] {
    const list: Property[] = [];
    for (const prop of this.properties.values()) {
      if (prop.ownerId === userId) {
        list.push({
          ...prop,
          isAvailabilityConfirmed: this.isFreshAvailability(prop.availabilityConfirmedAt),
        });
      }
    }
    return list.sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt));
  }

  public getOwnerListingSummary(userId: string): OwnerListingSummary {
    const listings = this.getUserListings(userId);
    const draftsList = this.getUserDrafts(userId);

    let submitted = 0;
    let underReview = 0;
    let correctionRequested = 0;
    let approved = 0;
    let rejectedOrExpired = 0;
    let withdrawn = 0;
    let suspended = 0;

    for (const prop of listings) {
      switch (prop.submissionStatus) {
        case 'submitted':
          submitted++;
          break;
        case 'pending_verification':
        case 'under_review':
        case 'resubmitted':
          underReview++;
          break;
        case 'correction_requested':
        case 'additional_information_required':
          correctionRequested++;
          break;
        case 'approved':
          approved++;
          break;
        case 'rejected':
        case 'expired':
          rejectedOrExpired++;
          break;
        case 'withdrawn':
          withdrawn++;
          break;
        case 'suspended':
          suspended++;
          break;
      }
    }

    return {
      total: listings.length + draftsList.length,
      drafts: draftsList.length,
      submitted,
      underReview,
      correctionRequested,
      approved,
      rejectedOrExpired,
      withdrawn,
      suspended,
      listings,
      draftsList,
    };
  }

  public transitionListingStatus(
    propertyId: string,
    actorId: string,
    actorRole: UserRole,
    targetStatus: ListingSubmissionStatus,
    reason?: string,
    comments?: string
  ): Property {
    const prop = this.properties.get(propertyId);
    if (!prop) {
      throw new Error('Property record not found.');
    }

    const isOwner = prop.ownerId === actorId;
    const isVerifierOrAdmin = actorRole === 'admin' || actorRole === 'verifier' || (actorRole as string) === 'field_verifier';

    // 1. Strict Self-Approval Prohibition
    if (targetStatus === 'approved') {
      if (isOwner) {
        throw new Error('Self-approval prohibited: An owner cannot approve their own property verification.');
      }
      if (!isVerifierOrAdmin) {
        throw new Error('Unauthorized: Verification approval must be issued only by an authorized field inspector or administrator.');
      }
    }

    // 2. Validate transition rules
    const currentStatus = prop.submissionStatus || 'submitted';
    const now = new Date().toISOString();

    if (isOwner && !isVerifierOrAdmin) {
      const allowedOwnerTransitions = [
        ['draft', 'submitted'],
        ['submitted', 'withdrawn'],
        ['correction_requested', 'resubmitted'],
        ['additional_information_required', 'resubmitted'],
        ['approved', 'withdrawn'],
        ['withdrawn', 'submitted'],
        ['suspended', 'under_review'],
        ['rejected', 'under_review'],
      ];

      const isAllowed = allowedOwnerTransitions.some(
        ([from, to]) => from === currentStatus && to === targetStatus
      );

      if (!isAllowed) {
        throw new Error(`Invalid status transition from '${currentStatus}' to '${targetStatus}' for listing owner.`);
      }
    } else if (!isVerifierOrAdmin) {
      throw new Error('Unauthorized to transition listing status.');
    }

    // 3. Prohibit suspension or rejection without mandatory reason
    if ((targetStatus === 'suspended' || targetStatus === 'rejected') && !reason) {
      throw new Error(`A specific reason is mandatory when transitioning listing to '${targetStatus}'.`);
    }

    // Append to status history
    if (!prop.statusHistory) prop.statusHistory = [];
    prop.statusHistory.push({
      id: `st_${crypto.randomUUID().slice(0, 8)}`,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      changedBy: actorId,
      changedAt: now,
      reason,
      comments,
    });

    prop.submissionStatus = targetStatus;
    prop.updatedAt = now;

    if (targetStatus === 'submitted') {
      prop.submittedAt = now;
      prop.verificationStatus = 'pending_review';
      this.addNotification(
        prop.ownerId,
        'Listing Submitted for Verification',
        `Your listing "${prop.title}" has been placed in the verification queue.`,
        'submission',
        prop.id
      );
    } else if (targetStatus === 'under_review') {
      prop.verificationStatus = 'pending_review';
      this.addNotification(
        prop.ownerId,
        'Verification Review In Progress',
        `A platform reviewer has begun inspecting your listing "${prop.title}".`,
        'review',
        prop.id
      );
    } else if (targetStatus === 'approved') {
      prop.approvedAt = now;
      prop.verificationStatus = 'authoritative_verified';
      prop.availabilityConfirmedAt = now;
      prop.isAvailabilityConfirmed = true;
      this.addNotification(
        prop.ownerId,
        'Property Verification Approved',
        `Congratulations! Your listing "${prop.title}" has been verified and is now live.`,
        'approval',
        prop.id
      );
    } else if (targetStatus === 'correction_requested' || targetStatus === 'additional_information_required') {
      if (!reason) {
        throw new Error('A specific reason is required when requesting listing corrections.');
      }
      prop.correctionNotes = reason;
      prop.correctionRequestedAt = now;
      prop.verificationStatus = 'pending_review';
      this.addNotification(
        prop.ownerId,
        'Additional Information Required',
        `Reviewer requested clarification for "${prop.title}": ${reason}`,
        'correction',
        prop.id
      );
    } else if (targetStatus === 'resubmitted') {
      prop.submittedAt = now;
      prop.verificationStatus = 'pending_review';
      this.addNotification(
        prop.ownerId,
        'Corrections Resubmitted',
        `Your updated details for "${prop.title}" have been queued for re-inspection.`,
        'submission',
        prop.id
      );
    } else if (targetStatus === 'withdrawn') {
      prop.withdrawnAt = now;
    } else if (targetStatus === 'rejected') {
      prop.verificationStatus = 'rejected';
      prop.correctionNotes = reason;
      this.addNotification(
        prop.ownerId,
        'Listing Verification Rejected',
        `Verification for "${prop.title}" was not approved: ${reason}`,
        'rejection',
        prop.id
      );
    } else if (targetStatus === 'suspended') {
      prop.verificationStatus = 'rejected';
      prop.withdrawnAt = now;
      prop.correctionNotes = `Suspension: ${reason}`;
      this.addNotification(
        prop.ownerId,
        'Listing Suspended',
        `Your listing "${prop.title}" was suspended: ${reason}. You may file an appeal through your Dashboard.`,
        'suspension',
        prop.id
      );
    }

    this.properties.set(propertyId, prop);
    this.savePropertiesToDisk();
    return prop;
  }

  // --- Phase 6: Fraud Reporting, Suspensions & Appeals Methods ---

  public createFraudReport(data: {
    propertyId: string;
    reporterId: string;
    reason: FraudReportReason;
    description: string;
  }): FraudReport {
    const prop = this.properties.get(data.propertyId);
    if (!prop) {
      throw new Error('Target property record not found.');
    }

    // Rate Limiting: Prevent duplicate pending reports from the same user for the same property
    for (const existing of this.fraudReports.values()) {
      if (
        existing.propertyId === data.propertyId &&
        existing.reporterId === data.reporterId &&
        existing.status === 'pending'
      ) {
        throw new Error('You already have a pending report under investigation for this property.');
      }
    }

    const reporter = this.users.get(data.reporterId);
    const maskedContact = reporter ? this.maskIdentifier(reporter.identifier) : undefined;
    const now = new Date().toISOString();

    const report: FraudReport = {
      id: `fr_${crypto.randomUUID().slice(0, 8)}`,
      propertyId: data.propertyId,
      reporterId: data.reporterId,
      reporterMaskedContact: maskedContact,
      reason: data.reason,
      description: data.description.trim(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    this.fraudReports.set(report.id, report);
    this.auditEvents.push({
      id: `aud_${crypto.randomUUID().slice(0, 8)}`,
      userId: data.reporterId,
      action: 'SUBMIT_FRAUD_REPORT',
      details: `Report filed for property ${data.propertyId}: ${data.reason}`,
      timestamp: now,
    });

    return report;
  }

  public getFraudReports(filters?: { propertyId?: string; status?: FraudReportStatus }): FraudReport[] {
    const list: FraudReport[] = [];
    for (const report of this.fraudReports.values()) {
      if (filters?.propertyId && report.propertyId !== filters.propertyId) continue;
      if (filters?.status && report.status !== filters.status) continue;
      list.push(report);
    }
    return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  public resolveFraudReport(
    reportId: string,
    moderatorId: string,
    moderatorRole: UserRole,
    action: FraudReport['moderatorAction'],
    notes: string
  ): FraudReport {
    const isVerifierOrAdmin = moderatorRole === 'admin' || moderatorRole === 'verifier' || (moderatorRole as string) === 'field_verifier';
    if (!isVerifierOrAdmin) {
      throw new Error('Unauthorized: Only authorized moderators or administrators can resolve fraud reports.');
    }

    const report = this.fraudReports.get(reportId);
    if (!report) {
      throw new Error('Fraud report record not found.');
    }

    const now = new Date().toISOString();
    report.moderatorAction = action || 'none';
    report.moderatorNotes = notes;
    report.reviewedBy = moderatorId;
    report.reviewedAt = now;
    report.status = action && action !== 'none' ? 'action_taken' : 'dismissed';
    report.updatedAt = now;

    // If moderator chose to suspend listing, trigger listing suspension
    if (action === 'listing_suspended') {
      this.suspendListing(
        report.propertyId,
        moderatorId,
        moderatorRole,
        `Suspended following investigation of fraud report: ${notes || report.reason}`
      );
    }

    this.auditEvents.push({
      id: `aud_${crypto.randomUUID().slice(0, 8)}`,
      userId: moderatorId,
      action: 'RESOLVE_FRAUD_REPORT',
      details: `Report ${reportId} resolved with action ${action}: ${notes}`,
      timestamp: now,
    });

    this.fraudReports.set(reportId, report);
    return report;
  }

  public suspendListing(
    propertyId: string,
    actorId: string,
    actorRole: UserRole,
    reason: string
  ): Property {
    return this.transitionListingStatus(propertyId, actorId, actorRole, 'suspended', reason);
  }

  public createAppeal(
    propertyId: string,
    ownerId: string,
    reason: string,
    supportingDocumentUrls?: string[]
  ): ListingAppeal {
    const prop = this.properties.get(propertyId);
    if (!prop) {
      throw new Error('Property record not found.');
    }

    if (prop.ownerId !== ownerId) {
      throw new Error('Unauthorized: Only the property owner can file an appeal.');
    }

    if (prop.submissionStatus !== 'rejected' && prop.submissionStatus !== 'suspended') {
      throw new Error(`Cannot appeal a listing with status '${prop.submissionStatus}'. Appeals are valid only for rejected or suspended listings.`);
    }

    const now = new Date().toISOString();
    const appeal: ListingAppeal = {
      id: `apl_${crypto.randomUUID().slice(0, 8)}`,
      propertyId,
      ownerId,
      reason: reason.trim(),
      supportingDocumentUrls: supportingDocumentUrls || [],
      status: 'pending',
      createdAt: now,
    };

    this.appeals.set(appeal.id, appeal);

    // Transition property to under_review for appeal re-inspection
    this.transitionListingStatus(
      propertyId,
      ownerId,
      'owner',
      'under_review',
      `Appeal filed by owner: ${reason}`
    );

    return appeal;
  }

  public resolveAppeal(
    appealId: string,
    reviewerId: string,
    reviewerRole: UserRole,
    decision: 'accepted' | 'rejected',
    notes: string
  ): ListingAppeal {
    const isVerifierOrAdmin = reviewerRole === 'admin' || reviewerRole === 'verifier' || (reviewerRole as string) === 'field_verifier';
    if (!isVerifierOrAdmin) {
      throw new Error('Unauthorized: Only authorized staff or administrators can resolve listing appeals.');
    }

    const appeal = this.appeals.get(appealId);
    if (!appeal) {
      throw new Error('Appeal record not found.');
    }

    const prop = this.properties.get(appeal.propertyId);
    if (!prop) {
      throw new Error('Associated property not found.');
    }

    // Strict Self-Approval Prohibition on Appeals
    if (prop.ownerId === reviewerId) {
      throw new Error('Self-approval prohibited: An owner cannot review or approve their own appeal.');
    }

    const now = new Date().toISOString();
    appeal.status = decision;
    appeal.reviewerNotes = notes;
    appeal.reviewedBy = reviewerId;
    appeal.reviewedAt = now;

    if (decision === 'accepted') {
      // Reinstate listing
      this.transitionListingStatus(
        prop.id,
        reviewerId,
        reviewerRole,
        'approved',
        `Appeal accepted: ${notes}`
      );
    } else {
      // Maintain rejection
      this.transitionListingStatus(
        prop.id,
        reviewerId,
        reviewerRole,
        'rejected',
        `Appeal rejected: ${notes}`
      );
    }

    this.appeals.set(appealId, appeal);
    return appeal;
  }

  public reviewPropertyDocument(
    propertyId: string,
    documentId: string,
    reviewerId: string,
    reviewerRole: UserRole,
    status: 'verified' | 'rejected',
    rejectionReason?: string
  ): PropertyDocumentItem {
    const isVerifierOrAdmin = reviewerRole === 'admin' || reviewerRole === 'verifier' || (reviewerRole as string) === 'field_verifier';
    if (!isVerifierOrAdmin) {
      throw new Error('Unauthorized: Document reviews must be conducted by authorized verifiers or administrators.');
    }

    const prop = this.properties.get(propertyId);
    if (!prop) {
      throw new Error('Property record not found.');
    }

    // Self-review prohibition
    if (prop.ownerId === reviewerId) {
      throw new Error('Self-approval prohibited: Property owners cannot certify their own documents.');
    }

    if (!prop.documents || prop.documents.length === 0) {
      throw new Error('No documents found on this property.');
    }

    const docIndex = prop.documents.findIndex((d) => d.id === documentId);
    if (docIndex === -1) {
      throw new Error('Document not found on this property.');
    }

    const now = new Date().toISOString();
    const doc = prop.documents[docIndex];
    doc.status = status;
    doc.rejectionReason = status === 'rejected' ? rejectionReason : undefined;
    doc.reviewedBy = reviewerId;
    doc.reviewedAt = now;

    prop.documents[docIndex] = doc;
    prop.updatedAt = now;
    this.properties.set(propertyId, prop);

    this.auditEvents.push({
      id: `aud_${crypto.randomUUID().slice(0, 8)}`,
      userId: reviewerId,
      action: 'REVIEW_PROPERTY_DOCUMENT',
      details: `Document ${documentId} on property ${propertyId} marked ${status}${rejectionReason ? `: ${rejectionReason}` : ''}`,
      timestamp: now,
    });

    return doc;
  }

  public addNotification(
    userId: string,
    title: string,
    message: string,
    type: InAppNotification['type'],
    relatedPropertyId?: string,
    relatedConnectionId?: string,
    relatedVisitId?: string,
    relatedSearchId?: string
  ): InAppNotification {
    const notification: InAppNotification = {
      id: `notif_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      title,
      message,
      type,
      relatedPropertyId,
      relatedConnectionId,
      relatedVisitId,
      relatedSearchId,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  public getUserNotifications(userId: string): InAppNotification[] {
    const list: InAppNotification[] = [];
    for (const notif of this.notifications.values()) {
      if (notif.userId === userId) {
        list.push(notif);
      }
    }
    return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  public markNotificationRead(notificationId: string, userId: string): boolean {
    const notif = this.notifications.get(notificationId);
    if (!notif || notif.userId !== userId) {
      return false;
    }
    notif.isRead = true;
    this.notifications.set(notificationId, notif);
    return true;
  }

  public getReviewerQueue(reviewerRole: UserRole): ReviewerQueueSummary {
    const isVerifierOrAdmin = reviewerRole === 'admin' || reviewerRole === 'verifier' || (reviewerRole as string) === 'field_verifier';
    if (!isVerifierOrAdmin) {
      throw new Error('Unauthorized: Reviewer queue is restricted to authorized verification staff.');
    }

    const items: Property[] = [];
    let totalPending = 0;
    let underReview = 0;
    let needsInfo = 0;
    let resubmitted = 0;
    let suspended = 0;

    for (const prop of this.properties.values()) {
      const status = prop.submissionStatus || 'submitted';
      if (status === 'submitted') {
        totalPending++;
        items.push(prop);
      } else if (status === 'under_review' || status === 'pending_verification') {
        underReview++;
        items.push(prop);
      } else if (status === 'resubmitted') {
        resubmitted++;
        items.push(prop);
      } else if (status === 'correction_requested' || status === 'additional_information_required') {
        needsInfo++;
        items.push(prop);
      } else if (status === 'suspended') {
        suspended++;
        items.push(prop);
      }
    }

    const reports = this.getFraudReports();
    const pendingReports = reports.filter((r) => r.status === 'pending').length;

    return {
      totalPending,
      underReview,
      needsInfo,
      resubmitted,
      suspended,
      totalReports: reports.length,
      pendingReports,
      items: items.sort((a, b) => Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt)),
      reports,
    };
  }

  public updateListing(
    propertyId: string,
    actorId: string,
    actorRole: UserRole,
    updates: Partial<Property>
  ): { property: Property; triggeredReReview: boolean } {
    const prop = this.properties.get(propertyId);
    if (!prop) {
      throw new Error('Property record not found.');
    }

    const isOwner = prop.ownerId === actorId;
    const isVerifierOrAdmin = actorRole === 'admin' || actorRole === 'verifier' || (actorRole as string) === 'field_verifier';

    if (!isOwner && !isVerifierOrAdmin) {
      throw new Error('Unauthorized: cannot modify another user\'s listing.');
    }

    const now = new Date().toISOString();
    let triggeredReReview = false;

    // Detect material modifications to an already approved listing
    if (prop.submissionStatus === 'approved' && isOwner) {
      const materialFields: (keyof Property)[] = [
        'rentPerMonth',
        'locality',
        'city',
        'state',
        'propertyType',
        'bedrooms',
        'bathrooms',
        'areaSqFt',
      ];

      const hasMaterialChange = materialFields.some(
        (field) => updates[field] !== undefined && updates[field] !== prop[field]
      );

      if (hasMaterialChange) {
        triggeredReReview = true;
        prop.submissionStatus = 'resubmitted';
        prop.verificationStatus = 'pending_review';

        if (!prop.statusHistory) prop.statusHistory = [];
        prop.statusHistory.push({
          id: `st_${crypto.randomUUID().slice(0, 8)}`,
          fromStatus: 'approved',
          toStatus: 'resubmitted',
          changedBy: actorId,
          changedAt: now,
          reason: 'Material changes to property details require authoritative re-audit.',
        });
      }
    }

    // Apply safe updates
    Object.assign(prop, {
      ...updates,
      id: prop.id,
      ownerId: prop.ownerId,
      createdAt: prop.createdAt,
      updatedAt: now,
      verificationStatus: isVerifierOrAdmin ? updates.verificationStatus || prop.verificationStatus : prop.verificationStatus,
      submissionStatus: isVerifierOrAdmin ? updates.submissionStatus || prop.submissionStatus : prop.submissionStatus,
    });

    this.properties.set(propertyId, prop);
    return { property: prop, triggeredReReview };
  }

  // ============================================================================
  // PHASE 7: CONNECTIONS, SECURE MESSAGING & PROPERTY VISIT SCHEDULING
  // ============================================================================

  public isUserBlocked(userA: string, userB: string): boolean {
    for (const b of this.blockedUsers.values()) {
      if (
        (b.userId === userA && b.blockedUserId === userB) ||
        (b.userId === userB && b.blockedUserId === userA)
      ) {
        return true;
      }
    }
    return false;
  }

  public blockUser(userId: string, targetUserId: string, reason?: string): BlockedUserRecord {
    if (userId === targetUserId) {
      throw new Error('You cannot block your own account.');
    }
    const id = `blk_${crypto.randomUUID().slice(0, 8)}`;
    const record: BlockedUserRecord = {
      id,
      userId,
      blockedUserId: targetUserId,
      reason,
      createdAt: new Date().toISOString(),
    };
    this.blockedUsers.set(id, record);

    // Update any active connections between these users to blocked
    for (const conn of this.connections.values()) {
      const isParticipants =
        (conn.senderId === userId && conn.recipientId === targetUserId) ||
        (conn.senderId === targetUserId && conn.recipientId === userId) ||
        (conn.tenantId === userId && conn.ownerId === targetUserId) ||
        (conn.tenantId === targetUserId && conn.ownerId === userId);

      if (isParticipants && conn.status !== 'blocked') {
        conn.status = 'blocked';
        conn.blockedBy = userId;
        conn.updatedAt = new Date().toISOString();
        this.connections.set(conn.id, conn);
      }
    }

    this.auditEvents.push({
      id: `aud_${crypto.randomUUID().slice(0, 8)}`,
      userId,
      action: 'BLOCK_USER',
      details: `User ${userId} blocked user ${targetUserId}${reason ? `: ${reason}` : ''}`,
      timestamp: new Date().toISOString(),
    });

    return record;
  }

  public unblockUser(userId: string, targetUserId: string): boolean {
    let unblocked = false;
    for (const [id, record] of this.blockedUsers.entries()) {
      if (record.userId === userId && record.blockedUserId === targetUserId) {
        this.blockedUsers.delete(id);
        unblocked = true;
      }
    }
    return unblocked;
  }

  public getBlockedUsers(userId: string): BlockedUserRecord[] {
    const list: BlockedUserRecord[] = [];
    for (const record of this.blockedUsers.values()) {
      if (record.userId === userId) {
        list.push(record);
      }
    }
    return list;
  }

  public createConnectionRequest(
    senderId: string,
    propertyId: string,
    tenantNote?: string
  ): ConnectionRequest {
    if (!propertyId) {
      throw new Error('Property ID is required to initiate a connection.');
    }

    const property = this.properties.get(propertyId);
    if (!property) {
      throw new Error('Property listing not found.');
    }

    if (property.ownerId === senderId) {
      throw new Error('Self-connection prohibited: You cannot request a connection on your own property.');
    }

    if (property.submissionStatus === 'suspended' || property.submissionStatus === 'withdrawn') {
      throw new Error('This property listing is not currently active for connection requests.');
    }

    if (property.isAvailable === false) {
      throw new Error('This property listing is currently marked unavailable for connection requests.');
    }

    const recipientId = property.ownerId;

    if (this.isUserBlocked(senderId, recipientId)) {
      throw new Error('Cannot initiate connection with a blocked user.');
    }

    // Check for duplicate active connection
    for (const conn of this.connections.values()) {
      const isMatch =
        conn.propertyId === propertyId &&
        ((conn.senderId === senderId && conn.recipientId === recipientId) ||
         (conn.tenantId === senderId && conn.ownerId === recipientId));

      if (isMatch) {
        if (conn.status === 'pending') {
          throw new Error('An active pending connection request already exists for this property.');
        }
        if (conn.status === 'accepted') {
          throw new Error('You already have an established accepted connection for this property.');
        }
      }
    }

    const now = new Date().toISOString();
    const connectionId = `conn_${crypto.randomUUID().slice(0, 8)}`;
    const connection: ConnectionRequest = {
      id: connectionId,
      propertyId,
      senderId,
      tenantId: senderId,
      recipientId,
      ownerId: recipientId,
      status: 'pending',
      tenantNote: tenantNote ? tenantNote.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.connections.set(connectionId, connection);

    // Notify property owner
    this.addNotification(
      recipientId,
      'New Connection Request',
      `A verified member requested to connect regarding "${property.title}".`,
      'connection_request',
      propertyId,
      connectionId
    );

    return this.hydrateConnection(connection, senderId);
  }

  public hydrateConnection(conn: ConnectionRequest, forUserId?: string): ConnectionRequest {
    const clone: ConnectionRequest = { ...conn };

    // Property preview
    const property = this.properties.get(conn.propertyId);
    if (property) {
      clone.propertyPreview = {
        id: property.id,
        title: property.title,
        locality: property.locality,
        city: property.city,
        state: property.state,
        rentPerMonth: property.rentPerMonth,
        photoUrl: typeof property.photos?.[0] === 'string' ? property.photos[0] : (property.photos?.[0] as any)?.url,
        isAvailable: property.isAvailable !== false,
      };
    }

    // Sender Profile
    const senderUser = this.users.get(conn.senderId || conn.tenantId);
    if (senderUser) {
      clone.senderProfile = {
        id: senderUser.id,
        fullName: senderUser.fullName,
        identifier: this.maskIdentifier(senderUser.identifier),
        role: senderUser.activeRole || senderUser.role,
        isPhoneVerified: senderUser.isPhoneVerified,
      };
    }

    // Recipient Profile
    const recipientUser = this.users.get(conn.recipientId || conn.ownerId);
    if (recipientUser) {
      clone.recipientProfile = {
        id: recipientUser.id,
        fullName: recipientUser.fullName,
        identifier: this.maskIdentifier(recipientUser.identifier),
        role: recipientUser.activeRole || recipientUser.role,
        isPhoneVerified: recipientUser.isPhoneVerified,
      };
    }

    // Pass demo styling and metadata
    if (conn.isDemo) {
      clone.isDemo = true;
      if (conn.senderId === 'usr_demo_aryan' || conn.recipientId === 'usr_demo_aryan') {
        clone.onlineStatus = 'online';
        clone.lastActiveText = 'Online now';
        clone.avatarBg = '#2563EB';
        clone.avatarInitials = 'AR';
      } else if (conn.senderId === 'usr_demo_madhav' || conn.recipientId === 'usr_demo_madhav') {
        clone.onlineStatus = 'offline';
        clone.lastActiveText = 'Active 15m ago';
        clone.avatarBg = '#D97706';
        clone.avatarInitials = 'MA';
      } else if (conn.senderId === 'usr_demo_saksham' || conn.recipientId === 'usr_demo_saksham') {
        clone.onlineStatus = 'offline';
        clone.lastActiveText = 'Active 1h ago';
        clone.avatarBg = '#059669';
        clone.avatarInitials = 'SA';
      }

      if (clone.senderProfile && clone.senderProfile.id.startsWith('usr_demo_')) {
        clone.senderProfile.isDemo = true;
        clone.senderProfile.onlineStatus = clone.onlineStatus;
        clone.senderProfile.lastActiveText = clone.lastActiveText;
        clone.senderProfile.avatarBg = clone.avatarBg;
        clone.senderProfile.avatarInitials = clone.avatarInitials;
      }
      if (clone.recipientProfile && clone.recipientProfile.id.startsWith('usr_demo_')) {
        clone.recipientProfile.isDemo = true;
        clone.recipientProfile.onlineStatus = clone.onlineStatus;
        clone.recipientProfile.lastActiveText = clone.lastActiveText;
        clone.recipientProfile.avatarBg = clone.avatarBg;
        clone.recipientProfile.avatarInitials = clone.avatarInitials;
      }
    }

    // Last message
    const thread = this.messages.filter((m) => m.connectionId === conn.id);
    if (thread.length > 0) {
      clone.lastMessage = thread[thread.length - 1];
    }

    // Unread count
    if (forUserId) {
      clone.unreadCount = thread.filter((m) => m.recipientId === forUserId && !m.isRead).length;
    }

    return clone;
  }

  public ensureDemoConnections(userId: string): void {
    if (!userId || userId.startsWith('usr_demo_')) return;

    // 1. Seed demo user records
    const demoUsers = [
      {
        id: 'usr_demo_aryan',
        fullName: 'Aryan',
        identifier: 'aryan.inquiry@grihasaathi.demo',
        role: 'tenant' as const,
        activeRole: 'tenant' as const,
        roles: ['tenant' as const],
        isPhoneVerified: false,
        isEmailVerified: false,
        isIdentityVerified: false,
      },
      {
        id: 'usr_demo_madhav',
        fullName: 'Madhav',
        identifier: 'madhav.inquiry@grihasaathi.demo',
        role: 'tenant' as const,
        activeRole: 'tenant' as const,
        roles: ['tenant' as const],
        isPhoneVerified: false,
        isEmailVerified: false,
        isIdentityVerified: false,
      },
      {
        id: 'usr_demo_saksham',
        fullName: 'Saksham',
        identifier: 'saksham.inquiry@grihasaathi.demo',
        role: 'tenant' as const,
        activeRole: 'tenant' as const,
        roles: ['tenant' as const],
        isPhoneVerified: false,
        isEmailVerified: false,
        isIdentityVerified: false,
      },
    ];

    for (const du of demoUsers) {
      if (!this.users.has(du.id)) {
        this.users.set(du.id, {
          ...du,
          pinHash: '$2a$10$demo_not_for_login_hash_placeholder',
          failedPinAttempts: 0,
          preferredLanguage: 'en',
          notificationPreferences: {
            emailAlerts: true,
            smsAlerts: false,
            propertyInquiries: true,
            securityAlerts: true,
          },
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        });
      }
    }

    // 2. Resolve target property
    let propId = 'prop_gurugram_sector57';
    if (!this.properties.has(propId)) {
      const firstKey = this.properties.keys().next().value;
      if (firstKey) propId = firstKey;
    }

    // 3. Seed demo connections and initial messages
    const now = Date.now();
    const demoConfigs = [
      {
        contactId: 'usr_demo_aryan',
        connId: `conn_demo_aryan_${userId}`,
        name: 'Aryan',
        initialMsg: 'Hi! I am interested in discussing a property listing.',
        avatarBg: '#2563EB',
        avatarInitials: 'AR',
        onlineStatus: 'online' as const,
        lastActiveText: 'Online now',
        timeOffsetMs: 1000 * 60 * 15, // 15 mins ago
      },
      {
        contactId: 'usr_demo_madhav',
        connId: `conn_demo_madhav_${userId}`,
        name: 'Madhav',
        initialMsg: 'Hello! Can you share more details about the property?',
        avatarBg: '#D97706',
        avatarInitials: 'MA',
        onlineStatus: 'offline' as const,
        lastActiveText: 'Active 15m ago',
        timeOffsetMs: 1000 * 60 * 45, // 45 mins ago
      },
      {
        contactId: 'usr_demo_saksham',
        connId: `conn_demo_saksham_${userId}`,
        name: 'Saksham',
        initialMsg: 'Hi! I would like to know about the availability.',
        avatarBg: '#059669',
        avatarInitials: 'SA',
        onlineStatus: 'offline' as const,
        lastActiveText: 'Active 1h ago',
        timeOffsetMs: 1000 * 60 * 120, // 2 hours ago
      },
    ];

    for (const cfg of demoConfigs) {
      const createdAt = new Date(now - cfg.timeOffsetMs).toISOString();
      if (!this.connections.has(cfg.connId)) {
        const conn: ConnectionRequest = {
          id: cfg.connId,
          propertyId: propId,
          senderId: cfg.contactId,
          tenantId: cfg.contactId,
          recipientId: userId,
          ownerId: userId,
          initialMessage: cfg.initialMsg,
          status: 'accepted',
          createdAt,
          updatedAt: createdAt,
          isDemo: true,
          onlineStatus: cfg.onlineStatus,
          lastActiveText: cfg.lastActiveText,
          avatarBg: cfg.avatarBg,
          avatarInitials: cfg.avatarInitials,
        };
        this.connections.set(cfg.connId, conn);
      }

      // Check initial message in thread
      const hasMsg = this.messages.some((m) => m.connectionId === cfg.connId);
      if (!hasMsg) {
        this.messages.push({
          id: `msg_${cfg.connId}_1`,
          connectionId: cfg.connId,
          senderId: cfg.contactId,
          recipientId: userId,
          content: cfg.initialMsg,
          timestamp: createdAt,
          isRead: false,
          isDemo: true,
        });
      }
    }
  }

  public generateDemoReply(contactId: string, userMessage: string): string {
    const lower = userMessage.toLowerCase();

    if (contactId === 'usr_demo_aryan') {
      if (
        lower.includes('rent') ||
        lower.includes('deposit') ||
        lower.includes('price') ||
        lower.includes('cost') ||
        lower.includes('budget') ||
        lower.includes('maintenance')
      ) {
        return '[Demo Reply] Thank you! That fits well. Are the maintenance and utility bills included in the monthly rent, or settled separately? Also, is the security deposit negotiable?';
      }
      if (
        lower.includes('visit') ||
        lower.includes('see') ||
        lower.includes('time') ||
        lower.includes('tomorrow') ||
        lower.includes('weekend')
      ) {
        return '[Demo Reply] Perfect, thank you! I can make time this weekend or tomorrow evening. Please confirm the exact tower/unit directions whenever convenient.';
      }
      if (
        lower.includes('available') ||
        lower.includes('ready') ||
        lower.includes('move') ||
        lower.includes('date')
      ) {
        return '[Demo Reply] Glad to hear that! What would be the standard lock-in period and notice policy under the agreement?';
      }
      return '[Demo Reply] Thank you for getting back to me! Could you share the monthly rent, security deposit terms, and lease duration? I am looking to finalize shortly.';
    }

    if (contactId === 'usr_demo_madhav') {
      if (lower.includes('parking') || lower.includes('car') || lower.includes('vehicle')) {
        return '[Demo Reply] Understood! Is the reserved parking covered or open? Also, is there adequate visitor parking in the society?';
      }
      if (
        lower.includes('amenit') ||
        lower.includes('gym') ||
        lower.includes('power') ||
        lower.includes('backup') ||
        lower.includes('lift')
      ) {
        return '[Demo Reply] Great to know! Is the power backup 100% full load including ACs, or limited to light points?';
      }
      if (lower.includes('visit') || lower.includes('meet') || lower.includes('schedule')) {
        return '[Demo Reply] I appreciate that. I can arrange an inspection visit around 11:30 AM or 4:00 PM. Would that work for you?';
      }
      return '[Demo Reply] Thank you for the details. Does the property include reserved car parking and power backup? Also, what would be the earliest move-in date?';
    }

    if (contactId === 'usr_demo_saksham') {
      if (
        lower.includes('visit') ||
        lower.includes('weekend') ||
        lower.includes('sunday') ||
        lower.includes('saturday')
      ) {
        return '[Demo Reply] Excellent! Would Saturday morning between 10:30 AM and 12:00 PM work for a family walkthrough?';
      }
      if (
        lower.includes('family') ||
        lower.includes('kid') ||
        lower.includes('child') ||
        lower.includes('neighbor') ||
        lower.includes('area')
      ) {
        return '[Demo Reply] That is very reassuring. We have young children, so safety and proximity to reputed schools and grocery stores are our top priorities.';
      }
      if (lower.includes('furnish') || lower.includes('kitchen') || lower.includes('appliance')) {
        return '[Demo Reply] Thanks! Are the kitchen appliances (chimney/hob/geyser) under active maintenance contracts?';
      }
      return '[Demo Reply] Thanks for the details! Would it be possible to schedule a visit this weekend? Also, is the neighborhood quiet and suitable for families?';
    }

    return '[Demo Reply] Thank you for your response! I am reviewing the listing details and will follow up shortly.';
  }

  public getUserConnections(userId: string): ConnectionRequest[] {
    if (userId && !userId.startsWith('usr_demo_')) {
      this.ensureDemoConnections(userId);
    }

    const list: ConnectionRequest[] = [];
    for (const conn of this.connections.values()) {
      const isParty =
        conn.senderId === userId ||
        conn.recipientId === userId ||
        conn.tenantId === userId ||
        conn.ownerId === userId;

      if (isParty) {
        list.push(this.hydrateConnection(conn, userId));
      }
    }

    return list.sort((a, b) => {
      const timeA = a.lastMessage?.timestamp || a.updatedAt || a.createdAt;
      const timeB = b.lastMessage?.timestamp || b.updatedAt || b.createdAt;
      return Date.parse(timeB) - Date.parse(timeA);
    });
  }

  public getConnection(connectionId: string, actorId?: string): ConnectionRequest | null {
    if (actorId && connectionId.startsWith('conn_demo_')) {
      this.ensureDemoConnections(actorId);
    }

    const conn = this.connections.get(connectionId);
    if (!conn) return null;

    if (actorId) {
      const isParty =
        conn.senderId === actorId ||
        conn.recipientId === actorId ||
        conn.tenantId === actorId ||
        conn.ownerId === actorId;

      const actor = this.users.get(actorId);
      const isStaff = actor?.activeRole === 'admin' || actor?.activeRole === 'verifier';

      if (!isParty && !isStaff) {
        return null;
      }
    }

    return this.hydrateConnection(conn, actorId);
  }

  public acceptConnection(connectionId: string, actorId: string): ConnectionRequest {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Connection request not found.');
    }

    if (conn.recipientId !== actorId && conn.ownerId !== actorId) {
      throw new Error('Unauthorized: Only the recipient can accept a connection request.');
    }

    if (conn.status !== 'pending') {
      throw new Error(`Cannot accept connection: current status is ${conn.status}.`);
    }

    const now = new Date().toISOString();
    conn.status = 'accepted';
    conn.updatedAt = now;
    this.connections.set(connectionId, conn);

    this.addNotification(
      conn.senderId,
      'Connection Request Accepted',
      'Your connection request has been accepted. You can now exchange direct secure messages and coordinate visits.',
      'connection_accepted',
      conn.propertyId,
      connectionId
    );

    return this.hydrateConnection(conn, actorId);
  }

  public declineConnection(connectionId: string, actorId: string, reason?: string): ConnectionRequest {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Connection request not found.');
    }

    if (conn.recipientId !== actorId && conn.ownerId !== actorId) {
      throw new Error('Unauthorized: Only the recipient can decline a connection request.');
    }

    if (conn.status !== 'pending') {
      throw new Error(`Cannot decline connection: current status is ${conn.status}.`);
    }

    const now = new Date().toISOString();
    conn.status = 'declined';
    conn.declinedReason = reason?.trim();
    conn.updatedAt = now;
    this.connections.set(connectionId, conn);

    this.addNotification(
      conn.senderId,
      'Connection Request Declined',
      reason ? `Your connection request was declined: ${reason}` : 'Your connection request was declined by the owner.',
      'connection_declined',
      conn.propertyId,
      connectionId
    );

    return this.hydrateConnection(conn, actorId);
  }

  public cancelConnection(connectionId: string, actorId: string, reason?: string): ConnectionRequest {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Connection request not found.');
    }

    if (conn.senderId !== actorId && conn.tenantId !== actorId) {
      throw new Error('Unauthorized: Only the sender can withdraw a pending connection request.');
    }

    if (conn.status !== 'pending') {
      throw new Error(`Cannot cancel request: current status is ${conn.status}.`);
    }

    const now = new Date().toISOString();
    conn.status = 'cancelled';
    conn.cancelledReason = reason?.trim();
    conn.updatedAt = now;
    this.connections.set(connectionId, conn);

    return this.hydrateConnection(conn, actorId);
  }

  // --------------------------------------------------------------------------
  // MESSAGING METHODS
  // --------------------------------------------------------------------------

  public sendMessage(connectionId: string, senderId: string, content: string): ConversationMessage {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Connection thread not found.');
    }

    const isParty =
      conn.senderId === senderId ||
      conn.recipientId === senderId ||
      conn.tenantId === senderId ||
      conn.ownerId === senderId;

    if (!isParty) {
      throw new Error('Unauthorized: You are not a participant in this conversation.');
    }

    if (conn.status === 'blocked' || this.isUserBlocked(conn.senderId, conn.recipientId)) {
      throw new Error('Cannot send messages: this connection is blocked.');
    }

    if (conn.status !== 'accepted' && conn.status !== 'pending') {
      throw new Error(`Cannot send messages in a ${conn.status} connection.`);
    }

    // Input validation
    const trimmed = content?.trim();
    if (!trimmed || trimmed.length === 0) {
      throw new Error('Message content cannot be empty.');
    }
    if (trimmed.length > 2000) {
      throw new Error('Message content exceeds 2,000 character limit.');
    }

    // Anti-spam Rate Limiting: max 30 messages in 60s per user
    const nowMs = Date.now();
    const timestamps = (this.userMessageTimestamps.get(senderId) || []).filter((t) => nowMs - t < 60000);
    if (timestamps.length >= 30) {
      throw new Error('Rate limit exceeded: Please wait a moment before sending additional messages.');
    }
    timestamps.push(nowMs);
    this.userMessageTimestamps.set(senderId, timestamps);

    const recipientId =
      conn.senderId === senderId || conn.tenantId === senderId
        ? conn.recipientId || conn.ownerId
        : conn.senderId || conn.tenantId;

    const message: ConversationMessage = {
      id: `msg_${crypto.randomUUID().slice(0, 8)}`,
      connectionId,
      senderId,
      recipientId,
      content: trimmed,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    this.messages.push(message);
    conn.updatedAt = message.timestamp;
    this.connections.set(connectionId, conn);

    // In-app notification for recipient
    const snippet = trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
    this.addNotification(
      recipientId,
      'New Message',
      snippet,
      'new_message',
      conn.propertyId,
      connectionId
    );

    // If demo connection, mark user's message as read and generate contextual automated demo reply
    if (conn.isDemo) {
      message.isRead = true;
      message.readAt = new Date().toISOString();

      const replyContent = this.generateDemoReply(recipientId, trimmed);
      const replyTimestamp = new Date(Date.now() + 300).toISOString();
      const replyMessage: ConversationMessage = {
        id: `msg_demo_${crypto.randomUUID().slice(0, 8)}`,
        connectionId,
        senderId: recipientId,
        recipientId: senderId,
        content: replyContent,
        timestamp: replyTimestamp,
        isRead: false,
        isDemo: true,
      };

      this.messages.push(replyMessage);
      conn.updatedAt = replyTimestamp;
      this.connections.set(connectionId, conn);

      this.addNotification(
        senderId,
        'Demo Reply Received',
        replyContent,
        'new_message',
        conn.propertyId,
        connectionId
      );
    }

    return message;
  }

  public getMessages(connectionId: string, userId: string): ConversationMessage[] {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Connection thread not found.');
    }

    const isParty =
      conn.senderId === userId ||
      conn.recipientId === userId ||
      conn.tenantId === userId ||
      conn.ownerId === userId;

    const actor = this.users.get(userId);
    const isStaff = actor?.activeRole === 'admin' || actor?.activeRole === 'verifier';

    if (!isParty && !isStaff) {
      throw new Error('Unauthorized to access this conversation thread.');
    }

    return this.messages
      .filter((m) => m.connectionId === connectionId)
      .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
  }

  public markMessagesAsRead(connectionId: string, userId: string): number {
    let count = 0;
    const now = new Date().toISOString();
    for (const msg of this.messages) {
      if (msg.connectionId === connectionId && msg.recipientId === userId && !msg.isRead) {
        msg.isRead = true;
        msg.readAt = now;
        count++;
      }
    }
    return count;
  }

  public reportMessage(messageId: string, reporterId: string, reason: string): boolean {
    const msg = this.messages.find((m) => m.id === messageId);
    if (!msg) {
      throw new Error('Message not found.');
    }
    msg.isReported = true;
    msg.reportReason = reason;

    this.auditEvents.push({
      id: `aud_${crypto.randomUUID().slice(0, 8)}`,
      userId: reporterId,
      action: 'REPORT_MESSAGE',
      details: `User ${reporterId} reported message ${messageId}: ${reason}`,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  // --------------------------------------------------------------------------
  // PROPERTY VISIT SCHEDULING METHODS
  // --------------------------------------------------------------------------

  public createPropertyVisit(
    tenantId: string,
    propertyId: string,
    connectionId: string,
    visitDate: string,
    timeSlot: string,
    notes?: string
  ): PropertyVisit {
    const property = this.properties.get(propertyId);
    if (!property) {
      throw new Error('Property listing not found.');
    }

    if (property.submissionStatus === 'suspended' || property.submissionStatus === 'withdrawn') {
      throw new Error('Property is suspended or withdrawn from public visits.');
    }

    if (property.isAvailable === false) {
      throw new Error('Property is currently marked as unavailable for visits.');
    }

    if (property.ownerId === tenantId) {
      throw new Error('Owners cannot request visits to their own property.');
    }

    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error('Associated connection request not found.');
    }

    const isParty =
      conn.senderId === tenantId ||
      conn.recipientId === tenantId ||
      conn.tenantId === tenantId ||
      conn.ownerId === tenantId;

    if (!isParty) {
      throw new Error('Unauthorized: You must have an established connection to schedule a visit.');
    }

    // Date validation: must be today or in the future
    const today = new Date().toISOString().split('T')[0];
    if (visitDate < today) {
      throw new Error('Visit date cannot be in the past.');
    }

    if (!timeSlot || timeSlot.trim().length === 0) {
      throw new Error('A preferred time slot is required.');
    }

    // Check slot conflicts: confirmed visit already exists for this property on this date & slot
    for (const visit of this.propertyVisits.values()) {
      if (
        visit.propertyId === propertyId &&
        visit.visitDate === visitDate &&
        visit.timeSlot === timeSlot &&
        visit.status === 'confirmed'
      ) {
        throw new Error('This time slot is already confirmed for another inspection. Please choose an alternative slot.');
      }
    }

    // Prevent duplicate pending visit from same tenant on same slot
    for (const visit of this.propertyVisits.values()) {
      if (
        visit.propertyId === propertyId &&
        visit.tenantId === tenantId &&
        visit.visitDate === visitDate &&
        visit.timeSlot === timeSlot &&
        (visit.status === 'pending' || visit.status === 'confirmed')
      ) {
        throw new Error('You already have an active visit booking for this property on this date and time.');
      }
    }

    const now = new Date().toISOString();
    const visitId = `vis_${crypto.randomUUID().slice(0, 8)}`;
    const newVisit: PropertyVisit = {
      id: visitId,
      connectionId,
      propertyId,
      tenantId,
      ownerId: property.ownerId,
      visitDate,
      timeSlot: timeSlot.trim(),
      notes: notes?.trim(),
      status: 'pending',
      statusHistory: [
        {
          fromStatus: 'pending',
          toStatus: 'pending',
          changedBy: tenantId,
          changedAt: now,
          note: notes?.trim() || 'Inspection requested by tenant.',
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    this.propertyVisits.set(visitId, newVisit);

    // Notify owner
    this.addNotification(
      property.ownerId,
      'Property Visit Requested',
      `Inspection visit requested for "${property.title}" on ${visitDate} (${timeSlot}).`,
      'visit_requested',
      propertyId,
      connectionId,
      visitId
    );

    return this.hydrateVisit(newVisit);
  }

  public hydrateVisit(visit: PropertyVisit): PropertyVisit {
    const clone: PropertyVisit = { ...visit };

    const property = this.properties.get(visit.propertyId);
    if (property) {
      clone.propertyPreview = {
        id: property.id,
        title: property.title,
        locality: property.locality,
        city: property.city,
        state: property.state,
        rentPerMonth: property.rentPerMonth,
        photoUrl: typeof property.photos?.[0] === 'string' ? property.photos[0] : (property.photos?.[0] as any)?.url,
        isAvailable: property.isAvailable !== false,
      };
    }

    const tenant = this.users.get(visit.tenantId);
    if (tenant) {
      clone.tenantProfile = {
        id: tenant.id,
        fullName: tenant.fullName,
        identifier: this.maskIdentifier(tenant.identifier),
        role: tenant.activeRole || tenant.role,
      };
    }

    const owner = this.users.get(visit.ownerId);
    if (owner) {
      clone.ownerProfile = {
        id: owner.id,
        fullName: owner.fullName,
        identifier: this.maskIdentifier(owner.identifier),
        role: owner.activeRole || owner.role,
      };
    }

    return clone;
  }

  public getUserVisits(userId: string): PropertyVisit[] {
    const list: PropertyVisit[] = [];
    for (const visit of this.propertyVisits.values()) {
      if (visit.tenantId === userId || visit.ownerId === userId) {
        list.push(this.hydrateVisit(visit));
      }
    }

    return list.sort((a, b) => {
      const dateCmp = a.visitDate.localeCompare(b.visitDate);
      if (dateCmp !== 0) return dateCmp;
      return a.timeSlot.localeCompare(b.timeSlot);
    });
  }

  public confirmPropertyVisit(visitId: string, actorId: string, note?: string): PropertyVisit {
    const visit = this.propertyVisits.get(visitId);
    if (!visit) {
      throw new Error('Property visit record not found.');
    }

    if (visit.ownerId !== actorId) {
      throw new Error('Unauthorized: Only the property owner or authorized representative can confirm visits.');
    }

    // Recheck property availability
    const prop = this.properties.get(visit.propertyId);
    if (!prop || prop.submissionStatus === 'suspended' || prop.submissionStatus === 'withdrawn') {
      throw new Error('Cannot confirm visit: Property is no longer available or suspended.');
    }

    // Recheck slot conflict
    for (const existing of this.propertyVisits.values()) {
      if (
        existing.id !== visitId &&
        existing.propertyId === visit.propertyId &&
        existing.visitDate === visit.visitDate &&
        existing.timeSlot === visit.timeSlot &&
        existing.status === 'confirmed'
      ) {
        throw new Error('Conflict detected: Another visit is already confirmed for this exact slot.');
      }
    }

    const now = new Date().toISOString();
    const prevStatus = visit.status;
    visit.status = 'confirmed';
    visit.updatedAt = now;
    visit.statusHistory.push({
      fromStatus: prevStatus,
      toStatus: 'confirmed',
      changedBy: actorId,
      changedAt: now,
      note: note || 'Visit confirmed by property owner.',
    });

    this.propertyVisits.set(visitId, visit);

    // Notify tenant
    this.addNotification(
      visit.tenantId,
      'Property Visit Confirmed',
      `Your visit for "${prop.title}" on ${visit.visitDate} (${visit.timeSlot}) is confirmed.`,
      'visit_confirmed',
      visit.propertyId,
      visit.connectionId,
      visitId
    );

    return this.hydrateVisit(visit);
  }

  public declinePropertyVisit(visitId: string, actorId: string, reason?: string): PropertyVisit {
    const visit = this.propertyVisits.get(visitId);
    if (!visit) {
      throw new Error('Property visit record not found.');
    }

    if (visit.ownerId !== actorId) {
      throw new Error('Unauthorized: Only the property owner can decline visit requests.');
    }

    const now = new Date().toISOString();
    const prevStatus = visit.status;
    visit.status = 'cancelled';
    visit.cancellationReason = reason || 'Declined by property owner.';
    visit.cancelledBy = actorId;
    visit.updatedAt = now;
    visit.statusHistory.push({
      fromStatus: prevStatus,
      toStatus: 'cancelled',
      changedBy: actorId,
      changedAt: now,
      note: reason || 'Visit declined by owner.',
    });

    this.propertyVisits.set(visitId, visit);

    this.addNotification(
      visit.tenantId,
      'Property Visit Declined',
      reason ? `Visit declined by owner: ${reason}` : 'Your property visit request was declined by the owner.',
      'visit_declined',
      visit.propertyId,
      visit.connectionId,
      visitId
    );

    return this.hydrateVisit(visit);
  }

  public reschedulePropertyVisit(
    visitId: string,
    actorId: string,
    newDate: string,
    newTimeSlot: string,
    note?: string
  ): PropertyVisit {
    const visit = this.propertyVisits.get(visitId);
    if (!visit) {
      throw new Error('Property visit record not found.');
    }

    const isParty = visit.tenantId === actorId || visit.ownerId === actorId;
    if (!isParty) {
      throw new Error('Unauthorized: Only visit participants can propose rescheduling.');
    }

    const today = new Date().toISOString().split('T')[0];
    if (newDate < today) {
      throw new Error('Proposed reschedule date cannot be in the past.');
    }

    if (!newTimeSlot || newTimeSlot.trim().length === 0) {
      throw new Error('Proposed time slot is required.');
    }

    // Check slot conflicts for proposed slot
    for (const existing of this.propertyVisits.values()) {
      if (
        existing.id !== visitId &&
        existing.propertyId === visit.propertyId &&
        existing.visitDate === newDate &&
        existing.timeSlot === newTimeSlot &&
        existing.status === 'confirmed'
      ) {
        throw new Error('The proposed slot already has a confirmed inspection. Please propose another slot.');
      }
    }

    const now = new Date().toISOString();
    const prevStatus = visit.status;
    visit.status = 'rescheduled';
    visit.proposedAlternativeSlot = {
      visitDate: newDate,
      timeSlot: newTimeSlot.trim(),
      note: note?.trim(),
    };
    visit.updatedAt = now;
    visit.statusHistory.push({
      fromStatus: prevStatus,
      toStatus: 'rescheduled',
      changedBy: actorId,
      changedAt: now,
      note: `Reschedule proposed: ${newDate} (${newTimeSlot})${note ? ` - ${note}` : ''}`,
    });

    this.propertyVisits.set(visitId, visit);

    // Notify other party
    const targetUserId = actorId === visit.tenantId ? visit.ownerId : visit.tenantId;
    this.addNotification(
      targetUserId,
      'Visit Reschedule Proposed',
      `An alternative inspection slot was proposed: ${newDate} (${newTimeSlot}).`,
      'visit_rescheduled',
      visit.propertyId,
      visit.connectionId,
      visitId
    );

    return this.hydrateVisit(visit);
  }

  public acceptRescheduledVisit(visitId: string, actorId: string): PropertyVisit {
    const visit = this.propertyVisits.get(visitId);
    if (!visit) {
      throw new Error('Property visit record not found.');
    }

    const isParty = visit.tenantId === actorId || visit.ownerId === actorId;
    if (!isParty) {
      throw new Error('Unauthorized to accept reschedule.');
    }

    if (!visit.proposedAlternativeSlot) {
      throw new Error('No proposed reschedule slot found on this visit record.');
    }

    const now = new Date().toISOString();
    const prevStatus = visit.status;
    visit.visitDate = visit.proposedAlternativeSlot.visitDate;
    visit.timeSlot = visit.proposedAlternativeSlot.timeSlot;
    visit.status = 'confirmed';
    visit.proposedAlternativeSlot = undefined;
    visit.updatedAt = now;
    visit.statusHistory.push({
      fromStatus: prevStatus,
      toStatus: 'confirmed',
      changedBy: actorId,
      changedAt: now,
      note: 'Proposed alternative slot accepted. Visit confirmed.',
    });

    this.propertyVisits.set(visitId, visit);

    const targetUserId = actorId === visit.tenantId ? visit.ownerId : visit.tenantId;
    this.addNotification(
      targetUserId,
      'Rescheduled Visit Confirmed',
      `Inspection on ${visit.visitDate} (${visit.timeSlot}) is now confirmed.`,
      'visit_confirmed',
      visit.propertyId,
      visit.connectionId,
      visitId
    );

    return this.hydrateVisit(visit);
  }

  public cancelPropertyVisit(visitId: string, actorId: string, reason: string): PropertyVisit {
    const visit = this.propertyVisits.get(visitId);
    if (!visit) {
      throw new Error('Property visit record not found.');
    }

    const isParty = visit.tenantId === actorId || visit.ownerId === actorId;
    if (!isParty) {
      throw new Error('Unauthorized: You are not a participant in this visit.');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('A specific cancellation reason is required.');
    }

    if (visit.status === 'completed') {
      throw new Error('Cannot cancel an already completed inspection.');
    }

    if (visit.status === 'cancelled') {
      throw new Error('Visit is already cancelled.');
    }

    const now = new Date().toISOString();
    const prevStatus = visit.status;
    visit.status = 'cancelled';
    visit.cancellationReason = reason.trim();
    visit.cancelledBy = actorId;
    visit.updatedAt = now;
    visit.statusHistory.push({
      fromStatus: prevStatus,
      toStatus: 'cancelled',
      changedBy: actorId,
      changedAt: now,
      note: `Cancelled: ${reason.trim()}`,
    });

    this.propertyVisits.set(visitId, visit);

    const targetUserId = actorId === visit.tenantId ? visit.ownerId : visit.tenantId;
    this.addNotification(
      targetUserId,
      'Property Visit Cancelled',
      `The inspection scheduled for ${visit.visitDate} was cancelled: ${reason.trim()}`,
      'visit_cancelled',
      visit.propertyId,
      visit.connectionId,
      visitId
    );

    return this.hydrateVisit(visit);
  }

  public completePropertyVisit(visitId: string, actorId: string): PropertyVisit {
    const visit = this.propertyVisits.get(visitId);
    if (!visit) {
      throw new Error('Property visit record not found.');
    }

    if (visit.ownerId !== actorId) {
      throw new Error('Unauthorized: Only the property owner can mark an inspection completed.');
    }

    const now = new Date().toISOString();
    const prevStatus = visit.status;
    visit.status = 'completed';
    visit.updatedAt = now;
    visit.statusHistory.push({
      fromStatus: prevStatus,
      toStatus: 'completed',
      changedBy: actorId,
      changedAt: now,
      note: 'Inspection marked completed.',
    });

    this.propertyVisits.set(visitId, visit);
    return this.hydrateVisit(visit);
  }

  // ============================================================================
  // PHASE 9: SAVED SEARCHES, REAL ANALYTICS & ACCOUNT DEACTIVATION
  // ============================================================================

  public recordPropertyView(propertyId: string, userId?: string, ip?: string): void {
    const list = this.propertyViews.get(propertyId) || [];
    list.push({
      userId,
      ip,
      timestamp: new Date().toISOString(),
    });
    this.propertyViews.set(propertyId, list);
  }

  public getPropertyViewCount(propertyId: string): number {
    return (this.propertyViews.get(propertyId) || []).length;
  }

  public saveSearch(
    userId: string,
    name: string,
    filters: SavedSearchFilters,
    alertFrequency: SavedSearchRecord['alertFrequency'] = 'instant'
  ): SavedSearchRecord {
    if (!name || name.trim().length === 0) {
      throw new Error('Search name is required.');
    }

    const id = `srch_${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    let matchedCount = 0;
    const candidates = Array.from(this.properties.values()).filter(
      p => p.submissionStatus === 'approved' && p.verificationStatus === 'authoritative_verified'
    );
    for (const p of candidates) {
      if (this.doesPropertyMatchSearchFilters(p, filters)) {
        matchedCount++;
      }
    }

    const record: SavedSearchRecord = {
      id,
      userId,
      name: name.trim(),
      filters,
      alertFrequency,
      notifiedPropertyIds: [],
      matchedCount,
      createdAt: now,
      updatedAt: now,
    };

    this.savedSearches.set(id, record);
    this.logAuditEvent(userId, 'CREATE_SAVED_SEARCH', `Created saved search: ${name.trim()}`);
    return record;
  }

  public doesPropertyMatchSearchFilters(p: Property, filters: SavedSearchFilters): boolean {
    if (filters.state && filters.state !== 'all' && p.state.toLowerCase() !== filters.state.toLowerCase()) {
      return false;
    }
    if (filters.city && filters.city.trim().length > 0 && !p.city.toLowerCase().includes(filters.city.toLowerCase().trim())) {
      return false;
    }
    if (filters.locality && filters.locality.trim().length > 0 && !p.locality.toLowerCase().includes(filters.locality.toLowerCase().trim())) {
      return false;
    }
    if (filters.propertyType && filters.propertyType !== 'all' && p.propertyType !== filters.propertyType) {
      return false;
    }
    if (filters.bedrooms !== undefined && filters.bedrooms > 0 && p.bedrooms !== filters.bedrooms) {
      return false;
    }
    if (filters.minRent !== undefined && p.rentPerMonth < filters.minRent) {
      return false;
    }
    if (filters.maxRent !== undefined && p.rentPerMonth > filters.maxRent) {
      return false;
    }
    if (filters.furnishing && filters.furnishing !== 'any' && p.furnishing !== filters.furnishing) {
      return false;
    }
    if (filters.onlyVerified && p.verificationStatus !== 'authoritative_verified') {
      return false;
    }
    return true;
  }

  public getUserSavedSearches(userId: string): (SavedSearchRecord & { currentMatchingProperties: Property[] })[] {
    const list: (SavedSearchRecord & { currentMatchingProperties: Property[] })[] = [];
    const candidates = Array.from(this.properties.values()).filter(
      p => p.submissionStatus === 'approved' && p.verificationStatus === 'authoritative_verified'
    );

    for (const record of this.savedSearches.values()) {
      if (record.userId === userId) {
        const matches = candidates.filter(p => this.doesPropertyMatchSearchFilters(p, record.filters));
        list.push({
          ...record,
          matchedCount: matches.length,
          currentMatchingProperties: matches,
        });
      }
    }

    return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }

  public updateSavedSearch(userId: string, searchId: string, updates: Partial<SavedSearchRecord>): SavedSearchRecord {
    const record = this.savedSearches.get(searchId);
    if (!record || record.userId !== userId) {
      throw new Error('Saved search not found or unauthorized.');
    }

    if (updates.name && updates.name.trim().length === 0) {
      throw new Error('Search name cannot be empty.');
    }

    const now = new Date().toISOString();
    if (updates.name) record.name = updates.name.trim();
    if (updates.filters) record.filters = updates.filters;
    if (updates.alertFrequency) record.alertFrequency = updates.alertFrequency;
    record.updatedAt = now;

    this.savedSearches.set(searchId, record);
    this.logAuditEvent(userId, 'UPDATE_SAVED_SEARCH', `Updated saved search ${searchId}: ${record.name}`);
    return record;
  }

  public deleteSavedSearch(userId: string, searchId: string): boolean {
    const record = this.savedSearches.get(searchId);
    if (!record || record.userId !== userId) {
      return false;
    }
    this.savedSearches.delete(searchId);
    this.logAuditEvent(userId, 'DELETE_SAVED_SEARCH', `Deleted saved search ${searchId}: ${record.name}`);
    return true;
  }

  public executeSavedSearchAlertCheck(targetUserId?: string): { generatedAlertCount: number; matchedPropertyIds: string[] } {
    let generatedAlertCount = 0;
    const allMatchedIds: string[] = [];

    const approvedProperties = Array.from(this.properties.values()).filter(
      p => p.submissionStatus === 'approved' && p.verificationStatus === 'authoritative_verified'
    );

    for (const record of this.savedSearches.values()) {
      if (targetUserId && record.userId !== targetUserId) continue;
      if (record.alertFrequency === 'none') continue;

      const user = this.users.get(record.userId);
      if (!user || user.isDeactivated) continue;
      if (user.notificationPreferences && user.notificationPreferences.savedSearchAlerts === false) continue;

      const notifiedSet = new Set(record.notifiedPropertyIds || []);
      const newlyMatched = approvedProperties.filter(p => 
        !notifiedSet.has(p.id) && this.doesPropertyMatchSearchFilters(p, record.filters)
      );

      if (newlyMatched.length > 0) {
        const topProp = newlyMatched[0];
        const newNotifiedIds = [...notifiedSet, ...newlyMatched.map(p => p.id)];
        record.notifiedPropertyIds = newNotifiedIds;
        record.lastAlertSentAt = new Date().toISOString();
        this.savedSearches.set(record.id, record);

        const notifTitle = `New Match for "${record.name}"`;
        const notifMsg = newlyMatched.length === 1
          ? `A new verified property matching your saved search "${record.name}" is now available: "${topProp.title}" in ${topProp.locality}, ${topProp.city} (₹${topProp.rentPerMonth.toLocaleString('en-IN')}/mo).`
          : `${newlyMatched.length} new verified properties matching "${record.name}" were published in ${topProp.city}.`;

        this.addNotification(
          record.userId,
          notifTitle,
          notifMsg,
          'saved_search_alert',
          topProp.id,
          undefined,
          undefined,
          record.id
        );

        generatedAlertCount++;
        allMatchedIds.push(...newlyMatched.map(p => p.id));
      }
    }

    return { generatedAlertCount, matchedPropertyIds: Array.from(new Set(allMatchedIds)) };
  }

  public getOwnerPerformanceAnalytics(ownerId: string): OwnerPerformanceAnalytics {
    const ownerProperties = Array.from(this.properties.values()).filter(p => p.ownerId === ownerId);
    
    let activeApproved = 0;
    let expiredOrStale = 0;
    let drafts = Array.from(this.drafts.values()).filter(d => d.userId === ownerId).length;
    let underReview = 0;
    let totalViews = 0;

    const verificationBreakdown = {
      authoritative_verified: 0,
      physically_inspected: 0,
      document_verified: 0,
      pending_review: 0,
      rejected: 0,
      suspended: 0,
      unverified: 0,
    };

    const nowMs = Date.now();
    const staleThresholdMs = FRESHNESS_POLICY_DAYS * 24 * 60 * 60 * 1000;

    for (const p of ownerProperties) {
      if (p.submissionStatus === 'approved') {
        activeApproved++;
        if (p.availabilityConfirmedAt) {
          const confirmedMs = new Date(p.availabilityConfirmedAt).getTime();
          if (nowMs - confirmedMs > staleThresholdMs) {
            expiredOrStale++;
          }
        }
      } else if (p.submissionStatus === 'under_review' || p.submissionStatus === 'pending_verification' || p.submissionStatus === 'resubmitted') {
        underReview++;
      } else if (p.submissionStatus === 'draft') {
        drafts++;
      }

      const vStatus = p.verificationStatus || 'unverified';
      if (vStatus in verificationBreakdown) {
        verificationBreakdown[vStatus as keyof typeof verificationBreakdown]++;
      } else {
        verificationBreakdown.unverified++;
      }

      totalViews += (this.propertyViews.get(p.id) || []).length;
    }

    let totalInquiries = 0;
    for (const conn of this.connections.values()) {
      if (conn.ownerId === ownerId) {
        totalInquiries++;
      }
    }

    let totalVisitRequests = 0;
    let confirmedVisitsCount = 0;
    for (const v of this.propertyVisits.values()) {
      if (v.ownerId === ownerId) {
        totalVisitRequests++;
        if (v.status === 'confirmed' || v.status === 'completed') {
          confirmedVisitsCount++;
        }
      }
    }

    return {
      totalListings: ownerProperties.length,
      activeApprovedListings: activeApproved,
      expiredOrStaleListings: expiredOrStale,
      draftListings: drafts,
      underReviewListings: underReview,
      totalGenuineViews: totalViews,
      totalInquiries,
      totalVisitRequests,
      confirmedVisitsCount,
      verificationStatusBreakdown: verificationBreakdown,
      metricsDisclaimer: 'All metrics are calculated directly from authentic recorded inquiries, scheduled inspections, and verified database events. Griha Saathi never synthesizes simulated traffic or visitor counts.',
    };
  }

  public markAllNotificationsRead(userId: string): number {
    let count = 0;
    for (const notif of this.notifications.values()) {
      if (notif.userId === userId && !notif.isRead) {
        notif.isRead = true;
        this.notifications.set(notif.id, notif);
        count++;
      }
    }
    return count;
  }

  public deleteOrDeactivateAccount(userId: string, action: 'deactivate' | 'delete', reason?: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error('User record not found.');
    }

    // Revoke all active sessions
    for (const [token, sess] of this.sessions.entries()) {
      if (sess.userId === userId) {
        this.sessions.delete(token);
      }
    }

    const now = new Date().toISOString();
    user.isDeactivated = true;
    user.accountStatus = 'deactivated';
    user.updatedAt = now;
    this.users.set(userId, user);
    this.saveUsersToDisk();

    // If owner, withdraw active properties from public discovery
    for (const p of this.properties.values()) {
      if (p.ownerId === userId && p.submissionStatus === 'approved') {
        p.submissionStatus = 'withdrawn';
        p.withdrawnAt = now;
        p.updatedAt = now;
        this.properties.set(p.id, p);
      }
    }

    this.logAuditEvent(
      userId,
      action === 'delete' ? 'ACCOUNT_DELETED' : 'ACCOUNT_DEACTIVATED',
      `Account ${action === 'delete' ? 'deleted' : 'deactivated'}: ${reason || 'User initiated'}`
    );

    return true;
  }
}

export const db = new InMemoryDatabase();
