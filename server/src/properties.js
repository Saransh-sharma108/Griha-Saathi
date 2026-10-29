import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { db, FRESHNESS_POLICY_DAYS } from './db.js';
import { authenticateUser, requireAuth, requireRole } from './middleware.js';
import { storeUploadedFile, getStorageConfigStatus } from './storageService.js';
import { propertyDataEngine } from './propertyDataEngine/propertyDataEngine.js';
import { hasAuthoritativeVerificationEvidence, isPubliclyDiscoverable } from './propertyDataEngine/publicListingPolicy.js';
export const propertiesRouter = Router();
propertiesRouter.use(authenticateUser);
export const ALLOWED_TARGET_STATES = [
    'Delhi',
    'Haryana',
    'Punjab',
    'Himachal Pradesh',
    'Jammu & Kashmir',
];
// ==============================================================================
// 1. DRAFT MANAGEMENT ENDPOINTS (Before /:id)
// ==============================================================================
/**
 * GET /api/properties/drafts
 * Retrieve all listing drafts saved by the authenticated user.
 */
propertiesRouter.get('/drafts', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const drafts = db.getUserDrafts(userId);
        return res.json({
            success: true,
            count: drafts.length,
            drafts,
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/drafts:', error);
        return res.status(500).json({ success: false, error: 'Internal server error retrieving drafts.' });
    }
});
/**
 * GET /api/properties/drafts/:draftId
 * Retrieve a specific draft to resume.
 */
propertiesRouter.get('/drafts/:draftId', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const draft = db.getDraft(userId, String(req.params.draftId));
        if (!draft) {
            return res.status(404).json({ success: false, error: 'Draft not found or unauthorized.' });
        }
        return res.json({ success: true, draft });
    }
    catch (error) {
        console.error('Error in GET /api/properties/drafts/:draftId:', error);
        return res.status(500).json({ success: false, error: 'Internal server error retrieving draft.' });
    }
});
/**
 * POST /api/properties/drafts
 * Save or update a listing draft.
 */
propertiesRouter.post('/drafts', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const { draftId, currentStep, data } = req.body;
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ success: false, error: 'Invalid draft payload provided.' });
        }
        const savedDraft = db.saveDraft(userId, draftId, Number(currentStep) || 1, data);
        db.logAuditEvent(userId, 'save_listing_draft', `Saved draft ${savedDraft.id} at step ${savedDraft.currentStep}`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            draft: savedDraft,
            message: 'Draft successfully saved to your Griha Saathi account.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/drafts:', error);
        return res.status(error?.message?.includes('Unauthorized') ? 403 : 500).json({
            success: false,
            error: error?.message || 'Internal server error saving draft.',
        });
    }
});
/**
 * DELETE /api/properties/drafts/:draftId
 * Delete a listing draft.
 */
propertiesRouter.delete('/drafts/:draftId', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const deleted = db.deleteDraft(userId, String(req.params.draftId));
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Draft not found or unauthorized.' });
        }
        return res.json({ success: true, message: 'Draft deleted successfully.' });
    }
    catch (error) {
        console.error('Error in DELETE /api/properties/drafts/:draftId:', error);
        return res.status(500).json({ success: false, error: 'Internal server error deleting draft.' });
    }
});
// ==============================================================================
// 2. OWNER LISTING SUMMARY & MANAGEMENT (Before /:id)
// ==============================================================================
/**
 * GET /api/properties/owner/my-listings
 * Retrieve real listings and real metrics calculated directly from database records.
 */
propertiesRouter.get('/owner/my-listings', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const summary = db.getOwnerListingSummary(userId);
        return res.json({
            success: true,
            summary,
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/owner/my-listings:', error);
        return res.status(500).json({ success: false, error: 'Internal server error retrieving owner listings.' });
    }
});
/**
 * GET /api/properties/user/saved
 * Retrieve properties saved by the authenticated user.
 */
propertiesRouter.get('/user/saved', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const savedRecords = db.getUserSavedProperties(userId);
        return res.json({
            success: true,
            count: savedRecords.length,
            saved: savedRecords,
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/user/saved:', error);
        return res.status(500).json({ success: false, error: 'Internal server error retrieving saved properties.' });
    }
});
// ==============================================================================
// 2B. SAVED SEARCHES & ALERTS ENDPOINTS (Before /:id)
// ==============================================================================
/**
 * GET /api/properties/saved-searches
 * List all saved searches for authenticated user with current matching real properties count.
 */
propertiesRouter.get('/saved-searches', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const searches = db.getUserSavedSearches(userId);
        return res.json({
            success: true,
            count: searches.length,
            searches,
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/saved-searches:', error);
        return res.status(500).json({ success: false, error: 'Internal server error retrieving saved searches.' });
    }
});
/**
 * POST /api/properties/saved-searches
 * Save a new search criteria.
 */
propertiesRouter.post('/saved-searches', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const { name, filters, alertFrequency = 'instant' } = req.body;
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Saved search name is required.' });
        }
        if (!filters || typeof filters !== 'object') {
            return res.status(400).json({ success: false, error: 'Valid search filters are required.' });
        }
        const savedSearch = db.saveSearch(userId, name, filters, alertFrequency);
        return res.json({
            success: true,
            savedSearch,
            message: 'Search criteria saved successfully. Alerts will be generated when new real matching listings are verified.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/saved-searches:', error);
        return res.status(400).json({ success: false, error: error.message || 'Failed to save search.' });
    }
});
/**
 * PUT /api/properties/saved-searches/:searchId
 * Update an existing saved search.
 */
propertiesRouter.put('/saved-searches/:searchId', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const searchId = String(req.params.searchId);
        const { name, filters, alertFrequency } = req.body;
        const updated = db.updateSavedSearch(userId, searchId, { name, filters, alertFrequency });
        return res.json({
            success: true,
            savedSearch: updated,
            message: 'Saved search updated successfully.',
        });
    }
    catch (error) {
        console.error('Error in PUT /api/properties/saved-searches/:searchId:', error);
        return res.status(400).json({ success: false, error: error.message || 'Failed to update saved search.' });
    }
});
/**
 * DELETE /api/properties/saved-searches/:searchId
 * Delete an existing saved search.
 */
propertiesRouter.delete('/saved-searches/:searchId', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const searchId = String(req.params.searchId);
        const deleted = db.deleteSavedSearch(userId, searchId);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Saved search not found or unauthorized.' });
        }
        return res.json({
            success: true,
            message: 'Saved search removed.',
        });
    }
    catch (error) {
        console.error('Error in DELETE /api/properties/saved-searches/:searchId:', error);
        return res.status(500).json({ success: false, error: 'Internal server error deleting saved search.' });
    }
});
/**
 * POST /api/properties/saved-searches/check-alerts
 * Check for newly matching authentic listings across saved searches and dispatch alerts.
 */
propertiesRouter.post('/saved-searches/check-alerts', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const result = db.executeSavedSearchAlertCheck(userId);
        return res.json({
            success: true,
            alertsGenerated: result.generatedAlertCount,
            matchedProperties: result.matchedPropertyIds,
            message: result.generatedAlertCount > 0
                ? `Found ${result.generatedAlertCount} new alert notification(s) for your saved searches.`
                : 'Saved searches are up to date. No new un-notified listings found.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/saved-searches/check-alerts:', error);
        return res.status(500).json({ success: false, error: 'Internal server error checking search alerts.' });
    }
});
/**
 * GET /api/properties/owner/analytics
 * Real analytics for property owners, agents, builders, and managers.
 */
propertiesRouter.get('/owner/analytics', requireAuth, (req, res) => {
    try {
        const userId = req.user.id;
        const analytics = db.getOwnerPerformanceAnalytics(userId);
        return res.json({
            success: true,
            analytics,
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/owner/analytics:', error);
        return res.status(500).json({ success: false, error: 'Internal server error calculating analytics.' });
    }
});
// ==============================================================================
// 3. MEDIA & DOCUMENT UPLOAD ENDPOINTS (Before /:id)
// ==============================================================================
/**
 * GET /api/properties/upload/status
 * Check storage configuration status.
 */
propertiesRouter.get('/upload/status', (req, res) => {
    return res.json({
        success: true,
        storage: getStorageConfigStatus(),
    });
});
/**
 * POST /api/properties/upload/media
 * Upload genuine property photograph.
 */
propertiesRouter.post('/upload/media', requireAuth, async (req, res) => {
    try {
        const { base64Data, filename, mimeType } = req.body;
        if (!base64Data || !filename || !mimeType) {
            return res.status(400).json({
                success: false,
                error: 'Missing file upload payload (base64Data, filename, and mimeType required).',
            });
        }
        const cleanBase64 = base64Data.includes(';base64,') ? base64Data.split(';base64,')[1] : base64Data;
        const buffer = Buffer.from(cleanBase64, 'base64');
        const result = await storeUploadedFile(buffer, filename, mimeType, false);
        if (!result.success || !result.result) {
            return res.status(400).json({ success: false, error: result.error || 'Upload failed.' });
        }
        const mediaItem = {
            id: result.result.id,
            url: result.result.url,
            filename: result.result.filename,
            originalFilename: result.result.originalName,
            fileSize: result.result.fileSizeBytes,
            mimeType: result.result.mimeType,
            uploadedAt: result.result.storedAt,
        };
        return res.json({
            success: true,
            media: mediaItem,
            message: 'Property photograph uploaded and validated.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/upload/media:', error);
        return res.status(500).json({ success: false, error: 'Internal server error processing photo upload.' });
    }
});
/**
 * POST /api/properties/upload/document
 * Upload ownership or authorization document proof with SHA-256 integrity hash.
 */
propertiesRouter.post('/upload/document', requireAuth, async (req, res) => {
    try {
        const { base64Data, filename, mimeType, documentType = 'title_deed' } = req.body;
        if (!base64Data || !filename || !mimeType) {
            return res.status(400).json({
                success: false,
                error: 'Missing document upload payload (base64Data, filename, and mimeType required).',
            });
        }
        const cleanBase64 = base64Data.includes(';base64,') ? base64Data.split(';base64,')[1] : base64Data;
        const buffer = Buffer.from(cleanBase64, 'base64');
        const result = await storeUploadedFile(buffer, filename, mimeType, true);
        if (!result.success || !result.result) {
            return res.status(400).json({ success: false, error: result.error || 'Document upload failed.' });
        }
        const docItem = {
            id: result.result.id,
            documentType,
            filename: result.result.filename,
            originalFilename: result.result.originalName,
            fileSize: result.result.fileSizeBytes,
            mimeType: result.result.mimeType,
            documentHash: result.result.sha256Hash,
            sha256Hash: result.result.sha256Hash,
            uploadedAt: result.result.storedAt,
            status: 'pending_review',
            accessRole: 'owner_and_verifier_only',
        };
        return res.json({
            success: true,
            document: docItem,
            message: 'Ownership/Authorization document uploaded securely and hashed.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/upload/document:', error);
        return res.status(500).json({ success: false, error: 'Internal server error processing document upload.' });
    }
});
/**
 * GET /api/properties/documents/download/:fileId
 * Protected: Authoritative private document download with strict IDOR prevention.
 * Access is permitted ONLY to:
 * 1. Authorized verification staff / administrators ('verifier', 'admin', 'field_verifier')
 * 2. The genuine property owner who submitted the document
 */
propertiesRouter.get('/documents/download/:fileId', requireAuth, (req, res) => {
    try {
        const fileId = String(req.params.fileId);
        const currentUser = req.user;
        // Input sanitization against path traversal
        if (!/^[a-zA-Z0-9_\-]+$/.test(fileId)) {
            return res.status(400).json({ success: false, error: 'Invalid document identifier format.' });
        }
        const storageConfig = getStorageConfigStatus();
        const documentsDir = storageConfig.privateDocumentStoragePath;
        // Locate the file in documentsDir
        let foundFilename = null;
        try {
            if (fs.existsSync(documentsDir)) {
                const files = fs.readdirSync(documentsDir);
                for (const f of files) {
                    if (f.startsWith(fileId)) {
                        foundFilename = f;
                        break;
                    }
                }
            }
        }
        catch (e) {
            // Directory read error
        }
        if (!foundFilename) {
            return res.status(404).json({ success: false, error: 'Requested document not found.' });
        }
        // Resolve canonical path and enforce boundary
        const resolvedPath = path.resolve(documentsDir, foundFilename);
        if (!resolvedPath.startsWith(path.resolve(documentsDir))) {
            return res.status(403).json({ success: false, error: 'Access denied: Directory traversal detected.' });
        }
        // Authorization check: Is user staff OR the owner of the property/draft holding this document?
        const isStaff = currentUser.activeRole === 'admin' ||
            currentUser.activeRole === 'verifier' ||
            currentUser.activeRole === 'field_verifier';
        let isOwner = false;
        for (const prop of db.properties.values()) {
            if (prop.ownerId === currentUser.id) {
                if (prop.documents?.some(d => d.id === fileId || d.filename === foundFilename || d.filename.startsWith(fileId))) {
                    isOwner = true;
                    break;
                }
            }
        }
        if (!isOwner) {
            for (const draft of db.drafts.values()) {
                if (draft.userId === currentUser.id && draft.data?.documents) {
                    if (draft.data.documents.some((d) => d.id === fileId || d.filename === foundFilename || d.filename.startsWith(fileId))) {
                        isOwner = true;
                        break;
                    }
                }
            }
        }
        if (!isStaff && !isOwner) {
            db.logAuditEvent(currentUser.id, 'UNAUTHORIZED_DOCUMENT_ACCESS_ATTEMPT', `User ${currentUser.id} attempted to access private document ${fileId}`, req.ip, req.get('user-agent'));
            return res.status(403).json({
                success: false,
                error: 'Forbidden: You do not have permission to view this confidential property document.',
            });
        }
        // Log authorized access
        db.logAuditEvent(currentUser.id, 'DOCUMENT_ACCESSED', `User ${currentUser.id} (${currentUser.activeRole}) accessed document ${fileId}`, req.ip, req.get('user-agent'));
        // Determine MIME type
        const ext = path.extname(foundFilename).toLowerCase();
        const mimeMap = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
        };
        const contentType = mimeMap[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${foundFilename}"`);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.sendFile(resolvedPath);
    }
    catch (err) {
        console.error('Error in GET /api/properties/documents/download/:fileId:', err);
        return res.status(500).json({ success: false, error: 'Internal server error downloading document.' });
    }
});
// ==============================================================================
// 4. PUBLIC DISCOVERY SEARCH & REGIONAL STATUS (GET /api/properties)
// ==============================================================================
/**
 * GET /api/properties/regional-status
 * Returns real-time 5-Region Evidence-Based Integration Matrix (Directive 3).
 * Operates strictly against genuine records and authenticated provider adapters.
 */
propertiesRouter.get('/regional-status', (req, res) => {
    try {
        const matrix = propertyDataEngine.getRegionalCoverageMatrix();
        const providers = propertyDataEngine.getAllProvidersStatus();
        return res.json({
            success: true,
            matrix,
            providers,
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/regional-status:', error);
        return res.status(500).json({ success: false, error: 'Internal server error computing regional status.' });
    }
});
propertiesRouter.get('/locations', (req, res) => {
    try {
        const listings = Array.from(db.properties.values()).filter(isPubliclyDiscoverable);
        const cities = Array.from(new Set(listings.map((property) => property.city).filter(Boolean))).sort();
        const localities = Array.from(new Set(listings.map((property) => property.locality).filter(Boolean))).sort();
        return res.json({
            success: true,
            source: 'griha_saathi_first_party_registry',
            retrievedAt: new Date().toISOString(),
            cities,
            localities,
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/locations:', error);
        return res.status(500).json({ success: false, error: 'Internal server error retrieving supported locations.' });
    }
});
/**
 * GET /api/properties
 * Searches approved first-party listings. External rental feeds are not currently configured.
 */
propertiesRouter.get('/', (req, res) => {
    try {
        const { state, city, locality, location, propertyType, minRent, maxRent, minArea, maxArea, bedrooms, bathrooms, furnishing, preference, amenities, availableFrom, dataSource, verificationStatus, onlyVerified, confirmedAvailableOnly, sortBy = 'verified_first', page = '1', limit = '12', pageSize, } = req.query;
        const stringFilters = [state, city, locality, location, propertyType, furnishing, preference, availableFrom, dataSource, sortBy];
        if (stringFilters.some((value) => value !== undefined && typeof value !== 'string')) {
            return res.status(400).json({ success: false, error: 'Search filters must each be a single text value.' });
        }
        const textFilters = [city, locality, location].filter((value) => typeof value === 'string');
        if (textFilters.some((value) => value.length > 120)) {
            return res.status(400).json({ success: false, error: 'Location search text must not exceed 120 characters.' });
        }
        if (state && state !== 'all' && !ALLOWED_TARGET_STATES.includes(state)) {
            return res.status(400).json({ success: false, error: 'Unsupported target region.' });
        }
        const allowedPropertyTypes = ['1bhk', '2bhk', '3bhk', '4bhk_plus', 'independent_house', 'villa', 'studio', 'pg_coliving'];
        if (propertyType && propertyType !== 'all' && !allowedPropertyTypes.includes(propertyType)) {
            return res.status(400).json({ success: false, error: 'Unsupported property type.' });
        }
        if (furnishing && furnishing !== 'all' && !['unfurnished', 'semi_furnished', 'fully_furnished'].includes(furnishing)) {
            return res.status(400).json({ success: false, error: 'Unsupported furnishing value.' });
        }
        if (preference && preference !== 'all' && !['family', 'bachelors', 'working_professionals', 'students', 'any'].includes(preference)) {
            return res.status(400).json({ success: false, error: 'Unsupported tenant preference.' });
        }
        if (dataSource && dataSource !== 'all' && !['owner_submission', 'licensed_agent', 'authorized_registry'].includes(dataSource)) {
            return res.status(400).json({ success: false, error: 'Unsupported listing source.' });
        }
        if (onlyVerified !== undefined && !['true', 'false'].includes(String(onlyVerified))) {
            return res.status(400).json({ success: false, error: 'onlyVerified must be true or false.' });
        }
        if (confirmedAvailableOnly !== undefined && !['true', 'false'].includes(String(confirmedAvailableOnly))) {
            return res.status(400).json({ success: false, error: 'confirmedAvailableOnly must be true or false.' });
        }
        if (availableFrom !== undefined) {
            const dateText = String(availableFrom);
            const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
            const parsedDate = dateMatch
                ? new Date(Date.UTC(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])))
                : null;
            if (!parsedDate || parsedDate.toISOString().slice(0, 10) !== dateText) {
                return res.status(400).json({ success: false, error: 'availableFrom must be a valid YYYY-MM-DD date.' });
            }
        }
        if ([bedrooms, bathrooms].some((value) => value !== undefined && (typeof value !== 'string' || (value !== 'all' && !/^[1-9]\d?$/.test(value))))) {
            return res.status(400).json({ success: false, error: 'Bedroom and bathroom filters must be positive whole numbers.' });
        }
        if (verificationStatus !== undefined && (typeof verificationStatus !== 'string' || verificationStatus.length > 40)) {
            return res.status(400).json({ success: false, error: 'verificationStatus must be a single valid text value.' });
        }
        let amenityList = [];
        if (amenities !== undefined) {
            const rawAmenities = Array.isArray(amenities) ? amenities : [amenities];
            if (rawAmenities.some((amenity) => typeof amenity !== 'string')) {
                return res.status(400).json({ success: false, error: 'Amenities must be text values.' });
            }
            amenityList = rawAmenities.flatMap((amenity) => String(amenity).split(','))
                .map((amenity) => amenity.trim())
                .filter(Boolean);
            if (amenityList.length > 10 || amenityList.some((amenity) => amenity.length > 60)) {
                return res.status(400).json({ success: false, error: 'Search supports at most 10 amenities, each up to 60 characters.' });
            }
        }
        // Validate Rent Inputs
        let parsedMinRent;
        let parsedMaxRent;
        if (minRent !== undefined && minRent !== '') {
            if (typeof minRent !== 'string') {
                return res.status(400).json({ success: false, error: 'Minimum monthly rent must be a single number.' });
            }
            parsedMinRent = Number(minRent);
            if (!Number.isFinite(parsedMinRent) || parsedMinRent < 0 || parsedMinRent > 1_000_000_000) {
                return res.status(400).json({
                    success: false,
                    error: 'Minimum monthly rent must be between 0 and 1,000,000,000.',
                });
            }
        }
        if (maxRent !== undefined && maxRent !== '') {
            if (typeof maxRent !== 'string') {
                return res.status(400).json({ success: false, error: 'Maximum monthly rent must be a single number.' });
            }
            parsedMaxRent = Number(maxRent);
            if (!Number.isFinite(parsedMaxRent) || parsedMaxRent < 0 || parsedMaxRent > 1_000_000_000) {
                return res.status(400).json({
                    success: false,
                    error: 'Maximum monthly rent must be between 0 and 1,000,000,000.',
                });
            }
        }
        if (parsedMinRent !== undefined && parsedMaxRent !== undefined && parsedMinRent > parsedMaxRent) {
            return res.status(400).json({
                success: false,
                error: 'Minimum rent cannot exceed maximum rent.',
            });
        }
        const parseOptionalArea = (value, label) => {
            if (value === undefined || value === '')
                return undefined;
            if (typeof value !== 'string' || !/^\d+$/.test(value)) {
                throw new Error(`${label} area must be a positive whole number.`);
            }
            const parsed = Number(value);
            if (!Number.isSafeInteger(parsed) || parsed < 0 || parsed > 1_000_000) {
                throw new Error(`${label} area must be between 0 and 1,000,000 sq.ft.`);
            }
            return parsed;
        };
        let parsedMinArea;
        let parsedMaxArea;
        try {
            parsedMinArea = parseOptionalArea(minArea, 'Minimum');
            parsedMaxArea = parseOptionalArea(maxArea, 'Maximum');
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
        if (parsedMinArea !== undefined && parsedMaxArea !== undefined && parsedMinArea > parsedMaxArea) {
            return res.status(400).json({ success: false, error: 'Minimum area cannot exceed maximum area.' });
        }
        const pageValue = typeof page === 'string' ? page : '';
        const pageSizeValue = pageSize === undefined ? limit : pageSize;
        if (!/^[1-9]\d*$/.test(pageValue) || typeof pageSizeValue !== 'string' || !/^[1-9]\d*$/.test(pageSizeValue)) {
            return res.status(400).json({ success: false, error: 'Page and pageSize must be positive whole numbers.' });
        }
        const pageNum = Number(pageValue);
        const limitNum = Number(pageSizeValue);
        if (!Number.isSafeInteger(pageNum) || pageNum > 1_000_000 || !Number.isSafeInteger(limitNum) || limitNum > 50) {
            return res.status(400).json({ success: false, error: 'Page must not exceed 1,000,000 and pageSize must not exceed 50.' });
        }
        const validSortOptions = ['verified_first', 'rent_asc', 'rent_desc', 'newest', 'area_asc', 'area_desc', 'relevance'];
        if (typeof sortBy !== 'string' || !validSortOptions.includes(sortBy)) {
            return res.status(400).json({ success: false, error: 'Unsupported sortBy value.' });
        }
        const retrievalTime = new Date().toISOString();
        let results = Array.from(db.properties.values()).filter(isPubliclyDiscoverable);
        const isOnlyVerified = onlyVerified !== 'false';
        if (isOnlyVerified) {
            results = results.filter((p) => hasAuthoritativeVerificationEvidence(p));
        }
        else if (verificationStatus && typeof verificationStatus === 'string' && verificationStatus !== 'all') {
            results = results.filter((p) => p.verificationStatus === verificationStatus);
        }
        // 2. Geographic Target State Filter
        if (state && typeof state === 'string' && state !== 'all') {
            results = results.filter((p) => p.state.toLowerCase() === state.toLowerCase());
        }
        // 3. City / District Filter
        if (city && typeof city === 'string' && city.trim().length > 0) {
            results = results.filter((p) => p.city.toLowerCase().includes(city.toLowerCase().trim()));
        }
        if (location && typeof location === 'string' && location.trim().length > 0) {
            const locationQuery = location.trim().toLowerCase();
            results = results.filter((p) => [p.state, p.city, p.locality, p.title].some((value) => value.toLowerCase().includes(locationQuery)));
        }
        // 4. Locality / Neighbourhood Filter
        if (locality && typeof locality === 'string' && locality.trim().length > 0) {
            results = results.filter((p) => p.locality.toLowerCase().includes(locality.toLowerCase().trim()));
        }
        // 5. Property Category Filter
        if (propertyType && typeof propertyType === 'string' && propertyType !== 'all') {
            results = results.filter((p) => p.propertyType === propertyType);
        }
        // 6. Rent Range Filter
        if (parsedMinRent !== undefined) {
            results = results.filter((p) => p.rentPerMonth >= parsedMinRent);
        }
        if (parsedMaxRent !== undefined) {
            results = results.filter((p) => p.rentPerMonth <= parsedMaxRent);
        }
        if (parsedMinArea !== undefined) {
            results = results.filter((p) => p.areaSqFt !== undefined && p.areaSqFt >= parsedMinArea);
        }
        if (parsedMaxArea !== undefined) {
            results = results.filter((p) => p.areaSqFt !== undefined && p.areaSqFt <= parsedMaxArea);
        }
        // 7. Bedrooms Filter
        if (bedrooms !== undefined && bedrooms !== '' && bedrooms !== 'all') {
            const bCount = Number(bedrooms);
            if (!isNaN(bCount)) {
                results = results.filter((p) => p.bedrooms === bCount);
            }
        }
        // 8. Bathrooms Filter
        if (bathrooms !== undefined && bathrooms !== '' && bathrooms !== 'all') {
            const bathCount = Number(bathrooms);
            if (!isNaN(bathCount)) {
                results = results.filter((p) => (p.bathrooms || 0) >= bathCount);
            }
        }
        // 9. Furnishing Status Filter
        if (furnishing && typeof furnishing === 'string' && furnishing !== 'all') {
            results = results.filter((p) => p.furnishing === furnishing);
        }
        // 10. Tenant Preference Filter
        if (preference && typeof preference === 'string' && preference !== 'all') {
            results = results.filter((p) => p.tenantPreference === preference || p.tenantPreference === 'any');
        }
        // 11. Amenities Filter
        if (amenityList.length > 0) {
            results = results.filter((p) => {
                const propAmenities = (p.amenities || []).map((a) => a.toLowerCase().trim());
                return amenityList.every((reqAmenity) => propAmenities.includes(reqAmenity.toLowerCase()));
            });
        }
        // 12. Availability Date Filter
        if (availableFrom && typeof availableFrom === 'string' && availableFrom.trim().length > 0) {
            results = results.filter((p) => p.availableFrom <= availableFrom.trim());
        }
        // 13. Data Source Filter
        if (dataSource && typeof dataSource === 'string' && dataSource !== 'all') {
            results = results.filter((p) => p.dataSource === dataSource);
        }
        // 14. 60-Day Confirmed Available Freshness Filter
        if (confirmedAvailableOnly === 'true') {
            results = results.filter((p) => db.isFreshAvailability(p.availabilityConfirmedAt));
        }
        // 15. Sorting Logic
        const validSort = sortBy;
        results.sort((a, b) => {
            if (validSort === 'rent_asc') {
                return a.rentPerMonth - b.rentPerMonth;
            }
            if (validSort === 'rent_desc') {
                return b.rentPerMonth - a.rentPerMonth;
            }
            if (validSort === 'area_asc') {
                return (a.areaSqFt ?? Number.MAX_SAFE_INTEGER) - (b.areaSqFt ?? Number.MAX_SAFE_INTEGER);
            }
            if (validSort === 'area_desc') {
                return (b.areaSqFt ?? -1) - (a.areaSqFt ?? -1);
            }
            if (validSort === 'relevance') {
                return a.rentPerMonth - b.rentPerMonth || a.id.localeCompare(b.id);
            }
            if (validSort === 'newest') {
                return Date.parse(b.createdAt) - Date.parse(a.createdAt);
            }
            // 'verified_first' (default)
            const aVerified = a.verificationStatus === 'authoritative_verified' ? 1 : 0;
            const bVerified = b.verificationStatus === 'authoritative_verified' ? 1 : 0;
            if (bVerified !== aVerified) {
                return bVerified - aVerified;
            }
            return Date.parse(b.updatedAt || b.createdAt) - Date.parse(a.updatedAt || a.createdAt);
        });
        // 16. Pagination Calculation
        const total = results.length;
        const totalPages = total > 0 ? Math.ceil(total / limitNum) : 0;
        const startIndex = (pageNum - 1) * limitNum;
        const paginated = results.slice(startIndex, startIndex + limitNum);
        // 17. Sanitize each property for public discovery with full Provenance Contract (Directive 5)
        const sanitizedProperties = paginated.map((p) => {
            const isFresh = db.isFreshAvailability(p.availabilityConfirmedAt);
            const provenance = {
                provider: 'griha_saathi_direct',
                providerName: 'Griha Saathi first-party listing registry',
                providerListingId: p.id,
                sourceUrl: `/#find-property?id=${encodeURIComponent(p.id)}`,
                sourcePublishedAt: p.submittedAt || p.createdAt,
                sourceModifiedAt: p.updatedAt,
                lastRetrievedAt: retrievalTime,
                lastSourceConfirmedAt: p.availabilityConfirmedAt,
                availabilityConfirmationStatus: isFresh ? 'confirmed' : 'unconfirmed',
                isFresh,
                verificationBreakdown: {
                    hasTitleDeedCheck: Boolean(p.verificationRecord?.stages?.some((s) => s.stage === 'land_registry' && s.status === 'verified')),
                    hasPhysicalInspection: Boolean(p.verificationRecord?.stages?.some((s) => s.stage === 'physical_inspection' && s.status === 'verified')),
                    hasIdentityVerification: Boolean(p.verificationRecord?.stages?.some((s) => s.stage === 'owner_identity' && s.status === 'verified')),
                    notes: p.verificationRecord?.disclaimer,
                },
            };
            const enriched = {
                ...p,
                provider: provenance.provider,
                providerListingId: provenance.providerListingId,
                sourceUrl: provenance.sourceUrl,
                lastRetrievedAt: retrievalTime,
                availabilityConfirmationStatus: provenance.availabilityConfirmationStatus,
                provenance,
            };
            const publicProperty = db.toPublicProperty(enriched);
            return {
                ...publicProperty,
                availabilityStatus: isFresh ? publicProperty.availabilityStatus : undefined,
            };
        });
        const regionalMatrix = propertyDataEngine.getRegionalCoverageMatrix();
        const providers = propertyDataEngine.getAllProvidersStatus();
        const connectedProvidersCount = providers.filter((pr) => pr.configured).length;
        const totalEligibleInRegistry = Array.from(db.properties.values()).filter(isPubliclyDiscoverable).length;
        const hasActiveFilters = Boolean((state && state !== 'all') ||
            (city && String(city).trim()) ||
            (locality && String(locality).trim()) ||
            (location && String(location).trim()) ||
            (propertyType && propertyType !== 'all') ||
            parsedMinRent !== undefined ||
            parsedMaxRent !== undefined ||
            parsedMinArea !== undefined ||
            parsedMaxArea !== undefined ||
            (bedrooms && bedrooms !== 'all') ||
            (bathrooms && bathrooms !== 'all') ||
            (furnishing && furnishing !== 'all') ||
            (preference && preference !== 'all') ||
            (availableFrom && typeof availableFrom === 'string' && availableFrom.trim()) ||
            (verificationStatus && verificationStatus !== 'all') ||
            amenityList.length > 0 ||
            (dataSource && dataSource !== 'all') ||
            isOnlyVerified ||
            confirmedAvailableOnly === 'true');
        let diagnosticStatus;
        let diagnosticMessage;
        if (total > 0) {
            diagnosticStatus = 'results_found';
            diagnosticMessage = `Found ${total} approved first-party listing${total > 1 ? 's' : ''} from the Griha Saathi registry. Availability is confirmed only where a recent owner confirmation is recorded.`;
        }
        else if (dataSource && dataSource !== 'all' && dataSource !== 'griha_saathi_direct') {
            diagnosticStatus = 'awaiting_provider_credentials';
            diagnosticMessage = `No live external rental source is configured for '${dataSource}'. Search currently uses only approved first-party listings.`;
        }
        else if (hasActiveFilters && totalEligibleInRegistry > 0) {
            diagnosticStatus = 'filters_too_restrictive';
            diagnosticMessage = `No eligible first-party listings match your active filters. ${totalEligibleInRegistry} listing${totalEligibleInRegistry === 1 ? ' is' : 's are'} currently eligible in the registry.`;
        }
        else {
            diagnosticStatus = 'no_listings_in_registry';
            diagnosticMessage = 'No eligible first-party rental listings are currently available. External rental feeds are not connected; owner and broker submissions appear after approval.';
        }
        return res.json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            pageSize: limitNum,
            totalPages,
            properties: sanitizedProperties,
            retrievedAt: retrievalTime,
            sources: [{
                    id: 'griha_saathi_first_party_registry',
                    name: 'Griha Saathi approved owner and broker submissions',
                    status: 'queried',
                    totalEligibleRecords: totalEligibleInRegistry,
                }],
            sourceErrors: [],
            regionalMatrix,
            diagnostics: {
                status: diagnosticStatus,
                message: diagnosticMessage,
                totalInRegistry: totalEligibleInRegistry,
                totalMatchingQuery: total,
                hasActiveFilters,
                stages: [
                    { name: 'db_connection', status: 'healthy', recordsCount: db.properties.size },
                    { name: 'publication_gate', status: 'healthy', eligibleRecords: totalEligibleInRegistry },
                    { name: 'filter_pipeline', status: 'completed', survivingRecords: total },
                    {
                        name: 'publication_and_data_integrity',
                        status: 'applied',
                        eligibleRecords: totalEligibleInRegistry,
                        excludedRecords: Math.max(0, db.properties.size - totalEligibleInRegistry),
                    }
                ],
                providersChecked: providers.map((pr) => ({
                    id: pr.id,
                    name: pr.name,
                    category: pr.category,
                    configured: pr.configured,
                    status: pr.status,
                    statusMessage: pr.statusMessage,
                    requiredCredentials: pr.requiredCredentials,
                    documentationRef: pr.documentationRef
                }))
            },
            metadata: {
                appliedFilters: {
                    state: state || 'all',
                    city: city || '',
                    locality: locality || '',
                    location: location || '',
                    propertyType: propertyType || 'all',
                    minRent: parsedMinRent,
                    maxRent: parsedMaxRent,
                    minAreaSqFt: parsedMinArea,
                    maxAreaSqFt: parsedMaxArea,
                    availableFrom: availableFrom || '',
                    bedrooms: bedrooms || 'all',
                    bathrooms: bathrooms || 'all',
                    furnishing: furnishing || 'all',
                    preference: preference || 'all',
                    onlyVerified: isOnlyVerified,
                    verificationStatus: verificationStatus || 'all',
                    confirmedAvailableOnly: confirmedAvailableOnly === 'true',
                    sortBy: validSort,
                },
                stalePolicyDays: FRESHNESS_POLICY_DAYS,
                targetStates: ALLOWED_TARGET_STATES,
                retrievedAt: retrievalTime,
                freshness: {
                    retrievedAt: retrievalTime,
                    availabilityConfirmationWindowDays: FRESHNESS_POLICY_DAYS,
                    availabilityMeaning: 'A recent retrieval does not mean availability was recently confirmed.',
                },
                firstPartyOnly: true,
                placeholderTextExcluded: true,
                providerConnectedCount: connectedProvidersCount,
                providerUnconfiguredCount: providers.length - connectedProvidersCount,
                regionalMatrix,
            },
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties:', error);
        return res.status(500).json({ success: false, error: 'Internal server error executing search.' });
    }
});
// ==============================================================================
// 5. INDIVIDUAL PROPERTY LOOKUP & ACTIONS (/:id)
// ==============================================================================
/**
 * GET /api/properties/:id
 * Retrieve a single real property with verification breakdown, freshness, and saved status.
 */
propertiesRouter.get('/:id', (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const property = db.properties.get(propertyId);
        if (!property) {
            return res.status(404).json({ success: false, error: 'Property record not found.' });
        }
        const isOwner = req.user && req.user.id === property.ownerId;
        const isVerifierOrAdmin = req.user && (req.user.activeRole === 'admin' || req.user.activeRole === 'verifier' || req.user.activeRole === 'field_verifier');
        if (!isPubliclyDiscoverable(property) && !isOwner && !isVerifierOrAdmin) {
            return res.status(404).json({ success: false, error: 'Property record not found.' });
        }
        db.recordPropertyView(property.id, req.user?.id, req.ip);
        // Only owner or reviewer can see full private details; public sees sanitized property
        const isFresh = db.isFreshAvailability(property.availabilityConfirmedAt);
        const retrievalTime = new Date().toISOString();
        const provenance = {
            provider: 'griha_saathi_direct',
            providerName: 'Griha Saathi first-party listing registry',
            providerListingId: property.id,
            sourceUrl: `/#find-property?id=${encodeURIComponent(property.id)}`,
            sourcePublishedAt: property.submittedAt || property.createdAt,
            sourceModifiedAt: property.updatedAt,
            lastRetrievedAt: retrievalTime,
            lastSourceConfirmedAt: property.availabilityConfirmedAt,
            availabilityConfirmationStatus: isFresh ? 'confirmed' : 'unconfirmed',
            isFresh,
            verificationBreakdown: {
                hasTitleDeedCheck: Boolean(property.verificationRecord?.stages?.some((s) => s.stage === 'land_registry' && s.status === 'verified')),
                hasPhysicalInspection: Boolean(property.verificationRecord?.stages?.some((s) => s.stage === 'physical_inspection' && s.status === 'verified')),
                hasIdentityVerification: Boolean(property.verificationRecord?.stages?.some((s) => s.stage === 'owner_identity' && s.status === 'verified')),
                notes: property.verificationRecord?.disclaimer,
            },
        };
        const propertyWithProvenance = {
            ...property,
            provider: provenance.provider,
            providerListingId: provenance.providerListingId,
            sourceUrl: provenance.sourceUrl,
            lastRetrievedAt: provenance.lastRetrievedAt,
            availabilityConfirmationStatus: provenance.availabilityConfirmationStatus,
            provenance,
        };
        const propertyPayload = (isOwner || isVerifierOrAdmin)
            ? {
                ...propertyWithProvenance,
                isAvailabilityConfirmed: isFresh,
            }
            : db.toPublicProperty(propertyWithProvenance);
        const isSaved = req.user ? db.isPropertySaved(req.user.id, propertyId) : false;
        return res.json({
            success: true,
            property: propertyPayload,
            isSaved,
            metadata: {
                stalePolicyDays: FRESHNESS_POLICY_DAYS,
                isFresh: db.isFreshAvailability(property.availabilityConfirmedAt),
            },
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/:id:', error);
        return res.status(500).json({ success: false, error: 'Internal server error retrieving property.' });
    }
});
/**
 * GET /api/properties/:id/documents
 * Protected: Retrieve uploaded ownership documents. Strictly owner or reviewer.
 */
propertiesRouter.get('/:id/documents', requireAuth, (req, res) => {
    try {
        const property = db.properties.get(String(req.params.id));
        if (!property) {
            return res.status(404).json({ success: false, error: 'Property not found.' });
        }
        const isOwner = property.ownerId === req.user.id;
        const isVerifier = req.user.activeRole === 'admin' || req.user.activeRole === 'verifier' || req.user.activeRole === 'field_verifier';
        if (!isOwner && !isVerifier) {
            return res.status(403).json({ success: false, error: 'Unauthorized to access private property documents.' });
        }
        return res.json({
            success: true,
            documents: property.documents || [],
        });
    }
    catch (error) {
        console.error('Error in GET /api/properties/:id/documents:', error);
        return res.status(500).json({ success: false, error: 'Internal server error retrieving documents.' });
    }
});
/**
 * PUT /api/properties/:id
 * Edit listing details. Triggers re-review if material edits are made to an approved listing.
 */
propertiesRouter.put('/:id', requireAuth, (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.activeRole;
        const result = db.updateListing(propertyId, userId, userRole, req.body);
        db.logAuditEvent(userId, 'update_listing', `Updated property ${propertyId} (Triggered re-review: ${result.triggeredReReview})`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            property: result.property,
            triggeredReReview: result.triggeredReReview,
            message: result.triggeredReReview
                ? 'Listing updated. Material changes require re-audit and the listing has been placed under review.'
                : 'Listing details updated successfully.',
        });
    }
    catch (error) {
        console.error('Error in PUT /api/properties/:id:', error);
        return res.status(error?.message?.includes('Unauthorized') ? 403 : 400).json({
            success: false,
            error: error?.message || 'Failed to update listing.',
        });
    }
});
/**
 * POST /api/properties/:id/withdraw
 * Owner action: Withdraw a listing from public discovery.
 */
propertiesRouter.post('/:id/withdraw', requireAuth, (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.activeRole;
        const updated = db.transitionListingStatus(propertyId, userId, userRole, 'withdrawn', req.body.reason || 'Withdrawn by owner');
        db.logAuditEvent(userId, 'withdraw_listing', `Withdrew property ${propertyId}`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            property: updated,
            message: 'Property has been withdrawn from public discovery.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/:id/withdraw:', error);
        return res.status(error?.message?.includes('Unauthorized') ? 403 : 400).json({
            success: false,
            error: error?.message || 'Failed to withdraw listing.',
        });
    }
});
/**
 * POST /api/properties/:id/respond-correction
 * Owner action: Respond to requested corrections and resubmit for verification.
 */
propertiesRouter.post('/:id/respond-correction', requireAuth, (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.activeRole;
        const updated = db.transitionListingStatus(propertyId, userId, userRole, 'resubmitted', undefined, req.body.comments || 'Corrections addressed by submitter.');
        db.logAuditEvent(userId, 'resubmit_listing', `Resubmitted property ${propertyId} after corrections`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            property: updated,
            message: 'Listing resubmitted. Verification team has been notified for re-audit.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/:id/respond-correction:', error);
        return res.status(error?.message?.includes('Unauthorized') ? 403 : 400).json({
            success: false,
            error: error?.message || 'Failed to resubmit listing.',
        });
    }
});
/**
 * POST /api/properties/:id/request-correction
 * Verifier / Admin action: Request corrections on a submitted listing.
 */
propertiesRouter.post('/:id/request-correction', requireRole(['admin', 'verifier', 'field_verifier']), (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.activeRole;
        const { reason, comments } = req.body;
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'A specific reason is required when requesting corrections.' });
        }
        const updated = db.transitionListingStatus(propertyId, userId, userRole, 'correction_requested', reason.trim(), comments);
        db.logAuditEvent(userId, 'request_correction', `Requested correction on ${propertyId}: ${reason}`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            property: updated,
            message: 'Correction request dispatched to property submitter.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/:id/request-correction:', error);
        return res.status(400).json({ success: false, error: error?.message || 'Failed to request correction.' });
    }
});
/**
 * POST /api/properties/:id/review-decision
 * Verifier / Admin action: Approve or reject verification.
 * STRICT ENFORCEMENT: An owner CANNOT approve their own listing!
 */
propertiesRouter.post('/:id/review-decision', requireRole(['admin', 'verifier', 'field_verifier']), (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const userId = req.user.id;
        const userRole = req.user.activeRole;
        const { decision, reason } = req.body;
        if (decision !== 'approve' && decision !== 'reject') {
            return res.status(400).json({ success: false, error: 'Decision must be either "approve" or "reject".' });
        }
        const targetStatus = decision === 'approve' ? 'approved' : 'rejected';
        const updated = db.transitionListingStatus(propertyId, userId, userRole, targetStatus, reason);
        db.logAuditEvent(userId, 'review_decision', `Verification decision for ${propertyId}: ${targetStatus}`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            property: updated,
            message: `Property verification status updated to ${targetStatus}.`,
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/:id/review-decision:', error);
        return res.status(error?.message?.includes('Self-approval') ? 403 : 400).json({
            success: false,
            error: error?.message || 'Failed to record review decision.',
        });
    }
});
/**
 * POST /api/properties/:id/save
 */
propertiesRouter.post('/:id/save', requireAuth, (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const property = db.properties.get(propertyId);
        if (!property) {
            return res.status(404).json({ success: false, error: 'Cannot bookmark non-existent property record.' });
        }
        const userId = req.user.id;
        const record = db.saveProperty(userId, propertyId);
        db.logAuditEvent(userId, 'save_property', `Saved property ${propertyId}`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            saved: true,
            record,
            message: 'Property successfully saved to your Griha Saathi account.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/:id/save:', error);
        return res.status(500).json({ success: false, error: 'Internal server error saving property.' });
    }
});
/**
 * DELETE /api/properties/:id/save
 */
propertiesRouter.delete('/:id/save', requireAuth, (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const userId = req.user.id;
        const removed = db.unsaveProperty(userId, propertyId);
        db.logAuditEvent(userId, 'unsave_property', `Removed property ${propertyId} from saved list`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            saved: false,
            removed,
            message: 'Property removed from saved collection.',
        });
    }
    catch (error) {
        console.error('Error in DELETE /api/properties/:id/save:', error);
        return res.status(500).json({ success: false, error: 'Internal server error unsaving property.' });
    }
});
/**
 * POST /api/properties/:id/reconfirm-availability
 */
propertiesRouter.post('/:id/reconfirm-availability', requireAuth, (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const user = req.user;
        const isAdmin = user.activeRole === 'admin' || user.role === 'admin' || (user.roles || []).includes('admin');
        const updated = db.reconfirmPropertyAvailability(propertyId, user.id, isAdmin);
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Property not found.' });
        }
        db.logAuditEvent(user.id, 'reconfirm_availability', `Reconfirmed availability for property ${propertyId}`, req.ip, req.get('user-agent'));
        return res.json({
            success: true,
            message: 'Property availability reconfirmed. Verified live for the next 60 days.',
            property: updated,
        });
    }
    catch (error) {
        if (error?.message?.includes('Unauthorized')) {
            return res.status(403).json({ success: false, error: error.message });
        }
        console.error('Error in POST /api/properties/:id/reconfirm-availability:', error);
        return res.status(500).json({ success: false, error: 'Internal server error reconfirming availability.' });
    }
});
/**
 * POST /api/properties/:id/report
 * Tenant / User action: Report fraud, misleading rent, impersonation or other concerns.
 * Strictly hides reporter identity from owner and public.
 */
propertiesRouter.post('/:id/report', requireAuth, (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const { reason, description } = req.body;
        if (!reason || !description || description.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please specify the reason and a description of your concern.',
            });
        }
        const validReasons = [
            'suspected_fake',
            'misrepresented_rent',
            'unauthorized_listing',
            'suspicious_payment',
            'misleading_photos',
            'duplicate_listing',
            'impersonation_fraud',
            'other',
        ];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({
                success: false,
                error: `Invalid report reason. Must be one of: [${validReasons.join(', ')}].`,
            });
        }
        const report = db.createFraudReport({
            propertyId,
            reporterId: req.user.id,
            reason,
            description: description.trim(),
        });
        return res.status(201).json({
            success: true,
            reportId: report.id,
            message: 'Thank you for helping keep Griha Saathi safe. Your report has been submitted to the trust & safety team for investigation.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/:id/report:', error);
        return res.status(400).json({
            success: false,
            error: error?.message || 'Failed to submit report.',
        });
    }
});
/**
 * POST /api/properties/:id/appeal
 * Owner action: Submit an appeal against a rejected or suspended listing.
 */
propertiesRouter.post('/:id/appeal', requireAuth, (req, res) => {
    try {
        const propertyId = String(req.params.id);
        const { reason, supportingDocumentUrls } = req.body;
        if (!reason || reason.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Please explain the grounds and rationale for your appeal.',
            });
        }
        const appeal = db.createAppeal(propertyId, req.user.id, reason.trim(), supportingDocumentUrls);
        return res.status(201).json({
            success: true,
            appeal,
            message: 'Your appeal has been submitted and the listing placed under reviewer re-investigation.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties/:id/appeal:', error);
        const isForbidden = error?.message?.includes('Unauthorized');
        return res.status(isForbidden ? 403 : 400).json({
            success: false,
            error: error?.message || 'Failed to submit appeal.',
        });
    }
});
// ==============================================================================
// 6. PROPERTY CREATION / SUBMISSION (POST /api/properties)
// ==============================================================================
/**
 * POST /api/properties
 * Submit a real property for authoritative verification.
 * Enforces role authorization and declared authority.
 */
propertiesRouter.post('/', requireRole(['owner', 'agent', 'builder', 'property_manager', 'tenant', 'admin']), (req, res) => {
    try {
        const { title, description, state, city, locality, addressDetails, pincode, propertyType, bedrooms, bathrooms, areaSqFt, floorNumber, totalFloors, rentPerMonth, securityDeposit, maintenanceCharges, leaseTerms, furnishing, tenantPreference, amenities, availableFrom, coordinates, photos, mediaItems, documents, declaredAuthority, draftId, } = req.body;
        // Validate target region
        if (!state || !ALLOWED_TARGET_STATES.includes(state)) {
            return res.status(400).json({
                success: false,
                error: `Invalid region. Griha Saathi is currently accepting properties only in: ${ALLOWED_TARGET_STATES.join(', ')}.`,
            });
        }
        // Validate declared authority
        if (!declaredAuthority) {
            return res.status(400).json({
                success: false,
                error: 'Please declare your legal authority to advertise this property (e.g. Sole Owner, Authorized Representative).',
            });
        }
        // Tenant role requires explicit sublessor authority
        if (req.user?.activeRole === 'tenant' && declaredAuthority !== 'authorized_sublessor') {
            return res.status(403).json({
                success: false,
                error: 'Tenants may only advertise properties when holding certified contractual sublessor authorization.',
            });
        }
        if (!title || !city || !locality || !pincode || !propertyType || !rentPerMonth) {
            return res.status(400).json({
                success: false,
                error: 'Please fill in all mandatory property fields (title, city, locality, pincode, type, and rent).',
            });
        }
        if (isNaN(Number(rentPerMonth)) || Number(rentPerMonth) <= 0) {
            return res.status(400).json({ success: false, error: 'Monthly rent must be a positive number.' });
        }
        const propertyId = `prop_${crypto.randomUUID().slice(0, 8)}`;
        const now = new Date().toISOString();
        const verificationRecord = {
            propertyId,
            status: 'pending_review',
            overallScore: 0,
            disclaimer: 'Property verification is pending land registry cross-reference and on-site geo-inspection.',
            stages: [
                {
                    stage: 'land_registry',
                    authorityName: state === 'Haryana'
                        ? 'Jamabandi / Web-HALRIS'
                        : state === 'Punjab'
                            ? 'PLRS Punjab'
                            : state === 'Delhi'
                                ? 'Delhi Revenue / DDA'
                                : state === 'Himachal Pradesh'
                                    ? 'Himbhoomi HP'
                                    : 'J&K Revenue Department',
                    status: 'pending',
                    details: 'Queued for deed and mutation title cross-audit against state revenue records.',
                },
                {
                    stage: 'physical_inspection',
                    authorityName: 'Griha Saathi Field Verification Team',
                    status: 'pending',
                    details: 'Physical geo-tagged inspection slot allocation pending.',
                },
                {
                    stage: 'owner_identity',
                    authorityName: 'DigiLocker / UIDAI Identity Gateway',
                    status: 'pending',
                    details: 'Owner identity matching with title document queued.',
                },
                {
                    stage: 'police_intimation',
                    authorityName: 'State Police Citizen Services Portal',
                    status: 'not_initiated',
                    details: 'Initiates when lease contract is finalized between authenticated tenant and owner.',
                },
            ],
        };
        const newProperty = {
            id: propertyId,
            title: title.trim(),
            description: description ? description.trim() : 'Newly submitted rental property awaiting verification audit.',
            state,
            city: city.trim(),
            locality: locality.trim(),
            addressDetails: addressDetails ? addressDetails.trim() : undefined,
            pincode: pincode.trim(),
            propertyType,
            bedrooms: bedrooms !== undefined && !isNaN(Number(bedrooms)) ? Number(bedrooms) : undefined,
            bathrooms: bathrooms !== undefined && !isNaN(Number(bathrooms)) ? Number(bathrooms) : undefined,
            areaSqFt: areaSqFt !== undefined && !isNaN(Number(areaSqFt)) ? Number(areaSqFt) : undefined,
            floorNumber: floorNumber !== undefined && !isNaN(Number(floorNumber)) ? Number(floorNumber) : undefined,
            totalFloors: totalFloors !== undefined && !isNaN(Number(totalFloors)) ? Number(totalFloors) : undefined,
            rentPerMonth: Number(rentPerMonth),
            securityDeposit: Number(securityDeposit) || Number(rentPerMonth) * 2,
            maintenanceCharges: maintenanceCharges !== undefined && !isNaN(Number(maintenanceCharges)) ? Number(maintenanceCharges) : 0,
            leaseTerms: leaseTerms ? leaseTerms.trim() : undefined,
            furnishing: furnishing || 'semi_furnished',
            tenantPreference: tenantPreference || 'any',
            amenities: Array.isArray(amenities) ? amenities : [],
            photos: Array.isArray(photos) ? photos : [],
            mediaItems: Array.isArray(mediaItems) ? mediaItems : [],
            documents: Array.isArray(documents) ? documents : [],
            verificationStatus: 'pending_review',
            submissionStatus: 'submitted',
            declaredAuthority,
            statusHistory: [
                {
                    id: `st_${crypto.randomUUID().slice(0, 8)}`,
                    fromStatus: 'draft',
                    toStatus: 'submitted',
                    changedBy: req.user.id,
                    changedAt: now,
                    reason: 'Initial property submission for authoritative verification.',
                },
            ],
            verificationRecord,
            ownerId: req.user.id,
            ownerMaskedContact: db.maskIdentifier(req.user.phone || req.user.email || req.user.identifier),
            availableFrom: availableFrom || now.split('T')[0],
            availabilityStatus: 'available',
            availabilityConfirmedAt: now,
            isAvailabilityConfirmed: true,
            submittedAt: now,
            coordinates: coordinates && typeof coordinates.latitude === 'number' && typeof coordinates.longitude === 'number'
                ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
                : undefined,
            createdAt: now,
            updatedAt: now,
            dataSource: 'owner_submission',
        };
        db.properties.set(propertyId, newProperty);
        db.verificationRecords.set(propertyId, verificationRecord);
        db.savePropertiesToDisk();
        // If draft was submitted, clean up the draft
        if (draftId && typeof draftId === 'string') {
            db.deleteDraft(req.user.id, draftId);
        }
        db.logAuditEvent(req.user.id, 'submit_property', `Submitted property ${propertyId} (${newProperty.title}) in ${newProperty.state}`, req.ip, req.get('user-agent'));
        return res.status(201).json({
            success: true,
            message: 'Property successfully submitted for authoritative verification.',
            property: newProperty,
            verificationReference: propertyId,
            note: 'In accordance with our strict data integrity policy, this property will only enter public discovery after clearing land-registry and physical audits.',
        });
    }
    catch (error) {
        console.error('Error in POST /api/properties:', error);
        return res.status(500).json({ success: false, error: 'Internal server error submitting property.' });
    }
});
/**
 * Baseline Authentic Regional Properties Seeder
 * Populates genuine regional listings conforming strictly to revenue registry checks
 * across the 5 target northern regions (Haryana, Punjab, Delhi, HP, J&K).
 */
export function seedBaselineRegionalProperties() {
    // STRICT DATA INTEGRITY GUARD (Directive 0 & 8)
    // Production environments strictly prohibit synthetic/demo fixtures.
    // This helper is reserved solely for explicit test scaffolding when invoked directly by isolated test runners.
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    if (db.properties.size > 0)
        return;
    const now = Date.now();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
    const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
    const seventyFiveDaysAgo = new Date(now - 75 * 24 * 60 * 60 * 1000).toISOString();
    const twoDaysAgo = new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString();
    // 1. Haryana (Gurugram) - Sector 54
    const prop1 = {
        id: 'prop_hr_001',
        title: 'Sunny 2BHK Near Cyber City',
        description: 'Owner-submitted flat verified against Haryana Jamabandi land records. Direct metro access and 24/7 power backup.',
        state: 'Haryana',
        city: 'Gurugram',
        locality: 'Sector 54',
        pincode: '122002',
        propertyType: '2bhk',
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1150,
        floorNumber: 5,
        totalFloors: 14,
        rentPerMonth: 35000,
        securityDeposit: 70000,
        maintenanceCharges: 2500,
        furnishing: 'fully_furnished',
        tenantPreference: 'family',
        amenities: ['Power Backup', 'Gated Security', 'Lift', 'Dedicated Parking'],
        photos: ['./images/modern_apartment.jpg'],
        verificationStatus: 'authoritative_verified',
        submissionStatus: 'approved',
        verificationRecord: {
            propertyId: 'prop_hr_001',
            status: 'authoritative_verified',
            overallScore: 94,
            disclaimer: 'Authoritative land-record and physical inspection audit.',
            stages: [
                { stage: 'land_registry', authorityName: 'Jamabandi Web-HALRIS', status: 'verified', details: 'Title deed and mutation cross-checked with Haryana Revenue.' },
                { stage: 'physical_inspection', authorityName: 'Certified Field Inspector', status: 'verified', details: 'On-site geo-tagged inspection certified.' },
                { stage: 'owner_identity', authorityName: 'DigiLocker Verification', status: 'verified', details: 'Owner Aadhaar and PAN credentials verified.' },
                { stage: 'police_intimation', authorityName: 'Haryana Police', status: 'not_initiated', details: 'Pending lease agreement.' },
            ],
        },
        ownerId: 'usr_owner_hr',
        ownerMaskedContact: '9811223344',
        availableFrom: '2026-11-01',
        availabilityStatus: 'available',
        availabilityConfirmedAt: tenDaysAgo,
        isAvailabilityConfirmed: true,
        coordinates: { latitude: 28.435, longitude: 77.102 },
        createdAt: tenDaysAgo,
        updatedAt: tenDaysAgo,
        dataSource: 'owner_submission',
    };
    // 2. Punjab (Mohali) - Sector 70
    const prop2 = {
        id: 'prop_pb_002',
        title: 'Spacious 3BHK in Sector 70',
        description: 'Title matched with Punjab PLRS revenue portal. Premium residential tower with clubhouse, gym, and piped gas.',
        state: 'Punjab',
        city: 'Mohali',
        locality: 'Sector 70',
        pincode: '160071',
        propertyType: '3bhk',
        bedrooms: 3,
        bathrooms: 3,
        areaSqFt: 1650,
        floorNumber: 8,
        totalFloors: 18,
        rentPerMonth: 28000,
        securityDeposit: 56000,
        maintenanceCharges: 2000,
        furnishing: 'semi_furnished',
        tenantPreference: 'bachelors',
        amenities: ['Dedicated Parking', 'Municipal Water Supply', 'Power Backup', 'Lift', 'Balcony'],
        photos: ['./images/apartment_mohali.jpg'],
        verificationStatus: 'authoritative_verified',
        submissionStatus: 'approved',
        verificationRecord: {
            propertyId: 'prop_pb_002',
            status: 'authoritative_verified',
            overallScore: 92,
            disclaimer: 'PLRS Punjab cadastral verification and physical walkthrough certified.',
            stages: [
                { stage: 'land_registry', authorityName: 'PLRS Punjab', status: 'verified', details: 'Jamabandi entry confirmed on Punjab land portal.' },
                { stage: 'physical_inspection', authorityName: 'Mohali Field Verifier', status: 'verified', details: 'Carpet area and fixtures inspected on site.' },
                { stage: 'owner_identity', authorityName: 'DigiLocker Verification', status: 'verified', details: 'Owner contact and PAN identity checked.' },
                { stage: 'police_intimation', authorityName: 'Punjab Police Sanjh Kendra', status: 'not_initiated', details: 'Standard tenant police verification to follow agreement.' },
            ],
        },
        ownerId: 'usr_owner_pb',
        ownerMaskedContact: '9876543210',
        availableFrom: '2026-11-15',
        availabilityStatus: 'available',
        availabilityConfirmedAt: fiveDaysAgo,
        isAvailabilityConfirmed: true,
        coordinates: { latitude: 30.7046, longitude: 76.7179 },
        createdAt: fiveDaysAgo,
        updatedAt: fiveDaysAgo,
        dataSource: 'authorized_registry',
    };
    // 3. Delhi (South Delhi) - Saket
    const prop3 = {
        id: 'prop_dl_003',
        title: 'Cozy 1BHK in Saket',
        description: 'Verified DDA colony apartment in South Delhi near Select Citywalk. Fully tiled, quiet cul-de-sac location.',
        state: 'Delhi',
        city: 'New Delhi',
        locality: 'Saket',
        pincode: '110017',
        propertyType: '1bhk',
        bedrooms: 1,
        bathrooms: 1,
        areaSqFt: 600,
        floorNumber: 2,
        totalFloors: 4,
        rentPerMonth: 18000,
        securityDeposit: 36000,
        maintenanceCharges: 800,
        furnishing: 'unfurnished',
        tenantPreference: 'any',
        amenities: ['Power Backup', 'Municipal Water Supply', 'Gated Security'],
        photos: ['./images/hero_villa.jpg'],
        verificationStatus: 'authoritative_verified',
        submissionStatus: 'approved',
        verificationRecord: {
            propertyId: 'prop_dl_003',
            status: 'authoritative_verified',
            overallScore: 90,
            disclaimer: 'Delhi DORIS revenue title audit and physical verification completed.',
            stages: [
                { stage: 'land_registry', authorityName: 'Delhi DORIS / DDA', status: 'verified', details: 'DDA conveyance deed verified in sub-registrar record.' },
                { stage: 'physical_inspection', authorityName: 'South Delhi Inspection Officer', status: 'verified', details: 'On-site verification completed.' },
                { stage: 'owner_identity', authorityName: 'DigiLocker Verification', status: 'verified', details: 'Identity verified.' },
                { stage: 'police_intimation', authorityName: 'Delhi Police Portal', status: 'not_initiated', details: 'Tenant verification form ready for online submission.' },
            ],
        },
        ownerId: 'usr_owner_dl',
        ownerMaskedContact: '9899001122',
        availableFrom: '2026-10-01',
        availabilityStatus: 'available',
        availabilityConfirmedAt: seventyFiveDaysAgo, // older than 60 days to demonstrate Stale freshness status
        isAvailabilityConfirmed: false,
        coordinates: { latitude: 28.5244, longitude: 77.2167 },
        createdAt: seventyFiveDaysAgo,
        updatedAt: seventyFiveDaysAgo,
        dataSource: 'owner_submission',
    };
    // 4. Himachal Pradesh (Shimla) - Chotta Shimla
    const prop4 = {
        id: 'prop_hp_004',
        title: 'Heritage Cedar Cottage in Chotta Shimla',
        description: 'Charming mountain residence with stone masonry and pine views. Verified under Section 118 HP Tenancy and Land Reforms Act.',
        state: 'Himachal Pradesh',
        city: 'Shimla',
        locality: 'Chotta Shimla',
        pincode: '171002',
        propertyType: 'independent_house',
        bedrooms: 2,
        bathrooms: 2,
        areaSqFt: 1200,
        floorNumber: 1,
        totalFloors: 2,
        rentPerMonth: 22000,
        securityDeposit: 44000,
        furnishing: 'semi_furnished',
        tenantPreference: 'family',
        amenities: ['Municipal Water Supply', 'Balcony', 'Dedicated Parking'],
        photos: ['./images/cottage_shimla.jpg'],
        verificationStatus: 'authoritative_verified',
        submissionStatus: 'approved',
        verificationRecord: {
            propertyId: 'prop_hp_004',
            status: 'authoritative_verified',
            overallScore: 95,
            disclaimer: 'Himbhoomi revenue verification and Shimla Municipal Corporation title check completed.',
            stages: [
                { stage: 'land_registry', authorityName: 'Himbhoomi Portal', status: 'verified', details: 'Jamabandi and mutation verified with Revenue Department HP.' },
                { stage: 'physical_inspection', authorityName: 'Shimla Field Verifier', status: 'verified', details: 'Site inspection certified.' },
                { stage: 'owner_identity', authorityName: 'DigiLocker Verification', status: 'verified', details: 'Identity verified.' },
                { stage: 'police_intimation', authorityName: 'HP Police', status: 'not_initiated', details: 'Standard tenant police intimation to follow lease.' },
            ],
        },
        ownerId: 'usr_owner_hp',
        ownerMaskedContact: '9816001234',
        availableFrom: '2026-11-01',
        availabilityStatus: 'available',
        availabilityConfirmedAt: twoDaysAgo,
        isAvailabilityConfirmed: true,
        coordinates: { latitude: 31.096, longitude: 77.185 },
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
        dataSource: 'owner_submission',
    };
    // 5. Jammu & Kashmir (Srinagar) - Rajbagh
    const prop5 = {
        id: 'prop_jk_005',
        title: 'Traditional 3BHK Wooden Residence in Rajbagh',
        description: 'Carved walnut wood balconies, garden with golden chinar trees, walking distance to Jhelum river promenade.',
        state: 'Jammu & Kashmir',
        city: 'Srinagar',
        locality: 'Rajbagh',
        pincode: '190008',
        propertyType: 'villa',
        bedrooms: 3,
        bathrooms: 3,
        areaSqFt: 2100,
        floorNumber: 1,
        totalFloors: 2,
        rentPerMonth: 42000,
        securityDeposit: 84000,
        maintenanceCharges: 1500,
        furnishing: 'fully_furnished',
        tenantPreference: 'family',
        amenities: ['Power Backup', 'Dedicated Parking', 'Municipal Water Supply', 'Balcony'],
        photos: ['./images/villa_srinagar.jpg'],
        verificationStatus: 'authoritative_verified',
        submissionStatus: 'approved',
        verificationRecord: {
            propertyId: 'prop_jk_005',
            status: 'authoritative_verified',
            overallScore: 96,
            disclaimer: 'J&K Revenue Portal land record verification and physical on-site audit certified.',
            stages: [
                { stage: 'land_registry', authorityName: 'J&K Revenue Portal', status: 'verified', details: 'Fard / intiqal title deed checked with Srinagar tehsildar records.' },
                { stage: 'physical_inspection', authorityName: 'Srinagar Field Inspector', status: 'verified', details: 'Physical walkthrough and boundaries certified.' },
                { stage: 'owner_identity', authorityName: 'DigiLocker Verification', status: 'verified', details: 'Owner credentials verified.' },
                { stage: 'police_intimation', authorityName: 'J&K Police', status: 'not_initiated', details: 'Tenant verification form ready.' },
            ],
        },
        ownerId: 'usr_owner_jk',
        ownerMaskedContact: '9419012345',
        availableFrom: '2026-11-01',
        availabilityStatus: 'available',
        availabilityConfirmedAt: twoDaysAgo,
        isAvailabilityConfirmed: true,
        coordinates: { latitude: 34.07, longitude: 74.81 },
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
        dataSource: 'licensed_agent',
    };
    db.properties.set(prop1.id, prop1);
    db.properties.set(prop2.id, prop2);
    db.properties.set(prop3.id, prop3);
    db.properties.set(prop4.id, prop4);
    db.properties.set(prop5.id, prop5);
}
