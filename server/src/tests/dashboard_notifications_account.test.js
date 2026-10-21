import assert from 'assert';
import { db } from '../db.js';
import { storeUploadedFile } from '../storageService.js';
async function runDashboardNotificationsAccountTestSuite() {
    console.log('================================================================================');
    console.log('GRIHA SAATHI — PHASE 9: DASHBOARD, NOTIFICATIONS & ACCOUNT MANAGEMENT TEST SUITE');
    console.log('================================================================================\n');
    // Reset database state for clean test isolation
    db.properties.clear();
    db.users.clear();
    db.sessions.clear();
    db.savedProperties.clear();
    db.savedSearches.clear();
    db.propertyViews.clear();
    db.connections.clear();
    db.propertyVisits.clear();
    db.notifications.clear();
    db.auditEvents.length = 0;
    // Helper to seed users
    const seedUser = (id, identifier, role, isPhoneVerified = true, isEmailVerified = true) => {
        const user = {
            id,
            identifier,
            phone: identifier.startsWith('+') ? identifier : undefined,
            email: identifier.includes('@') ? identifier : undefined,
            role,
            activeRole: role,
            roles: [role],
            isPhoneVerified,
            isEmailVerified,
            isIdentityVerified: false,
            isDeactivated: false,
            preferredLanguage: 'en',
            notificationPreferences: {
                emailAlerts: true,
                smsAlerts: true,
                propertyInquiries: true,
                securityAlerts: true,
                savedSearchAlerts: true,
            },
            pinHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
            failedPinAttempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        db.users.set(id, user);
        return user;
    };
    // Helper to seed properties
    const seedProperty = (id, ownerId, state, city, rent, bedrooms, propertyType = '2bhk', submissionStatus = 'approved', verificationStatus = 'authoritative_verified') => {
        const prop = {
            id,
            ownerId,
            title: `Verified Rental at ${city}`,
            description: 'Authentic tested property record.',
            state,
            city,
            locality: 'Sector 14',
            pincode: '122001',
            propertyType,
            bedrooms,
            bathrooms: 2,
            areaSqFt: 1100,
            rentPerMonth: rent,
            securityDeposit: rent * 2,
            maintenanceCharges: 0,
            leaseTerms: '11 months standard lease.',
            availableFrom: '2026-11-01',
            furnishing: 'semi_furnished',
            tenantPreference: 'family',
            amenities: ['Power Backup', 'Lift', 'Security'],
            photos: [],
            documents: [],
            declaredAuthority: 'sole_owner',
            submissionStatus,
            verificationStatus,
            isAvailable: true,
            isAvailabilityConfirmed: true,
            statusHistory: [],
            dataSource: 'owner_submission',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            availabilityConfirmedAt: new Date().toISOString(),
        };
        db.properties.set(id, prop);
        return prop;
    };
    // ==============================================================================
    // TEST 1: Role-Aware Dashboard & Multi-Role Permissions
    // ==============================================================================
    console.log('--- TEST 1: Role-Aware Dashboard & Multi-Role Permissions ---');
    const tenantUser = seedUser('usr_tenant_vikram', '+919811001122', 'tenant', true, true);
    const ownerUser = seedUser('usr_owner_suresh', '+919822002233', 'owner', true, true);
    const agentUser = seedUser('usr_agent_karan', '+919833003344', 'agent', true, true);
    // Multi-role addition: Owner adds 'agent' role
    ownerUser.roles.push('agent');
    ownerUser.activeRole = 'agent';
    ownerUser.role = 'agent';
    db.users.set(ownerUser.id, ownerUser);
    const publicOwner = db.toPublicProfile(ownerUser);
    assert.strictEqual(publicOwner.activeRole, 'agent', 'Active role should switch to agent');
    assert.ok(publicOwner.roles.includes('owner') && publicOwner.roles.includes('agent'), 'Should hold both owner and agent roles');
    assert.strictEqual(publicOwner.isPhoneVerified, true, 'Phone verification status must be honest');
    assert.strictEqual(publicOwner.isEmailVerified, true, 'Email verification status must be honest');
    console.log('✓ Multi-role switching and public profile mapping verified.');
    // ==============================================================================
    // TEST 2: Saved Searches & Search Alerts
    // ==============================================================================
    console.log('\n--- TEST 2: Saved Searches & Duplicate-Free Search Alerts ---');
    const searchFilters = {
        state: 'Haryana',
        city: 'Gurugram',
        locality: 'Sector 14',
        propertyType: '2bhk',
        minRent: 20000,
        maxRent: 35000,
        bedrooms: 2,
        onlyVerified: true,
    };
    const savedSearch = db.saveSearch(tenantUser.id, 'Gurugram 2BHK Under 35k', searchFilters, 'instant');
    assert.ok(savedSearch.id, 'Saved search must be assigned an ID');
    assert.strictEqual(savedSearch.userId, tenantUser.id, 'Search must belong to tenant');
    assert.strictEqual(savedSearch.alertFrequency, 'instant', 'Alert frequency must be instant');
    // Verify retrieval
    const userSearches = db.getUserSavedSearches(tenantUser.id);
    assert.strictEqual(userSearches.length, 1, 'Tenant should have exactly 1 saved search');
    assert.strictEqual(userSearches[0].name, 'Gurugram 2BHK Under 35k');
    // Update alert frequency
    const updatedSearch = db.updateSavedSearch(tenantUser.id, savedSearch.id, { alertFrequency: 'daily' });
    assert.strictEqual(updatedSearch.alertFrequency, 'daily', 'Search alert frequency should update to daily');
    // Seed matching property in Gurugram
    const propMatch = seedProperty('prop_gurugram_match', ownerUser.id, 'Haryana', 'Gurugram', 28000, 2, '2bhk', 'approved', 'authoritative_verified');
    // Seed non-matching property (higher rent)
    const propExpensive = seedProperty('prop_gurugram_expensive', ownerUser.id, 'Haryana', 'Gurugram', 55000, 2, '2bhk', 'approved', 'authoritative_verified');
    // Seed non-matching property (unapproved draft)
    const propDraft = seedProperty('prop_gurugram_draft', ownerUser.id, 'Haryana', 'Gurugram', 25000, 2, '2bhk', 'draft', 'unverified');
    // Test filter matching function directly
    assert.strictEqual(db.doesPropertyMatchSearchFilters(propMatch, searchFilters), true, 'Matching property must evaluate to true');
    assert.strictEqual(db.doesPropertyMatchSearchFilters(propExpensive, searchFilters), false, 'Expensive property must evaluate to false');
    assert.strictEqual(db.doesPropertyMatchSearchFilters(propDraft, searchFilters), false, 'Draft property must not match live search');
    // Execute alert check: 1 notification should be created
    const alertResult1 = db.executeSavedSearchAlertCheck(tenantUser.id);
    assert.strictEqual(alertResult1.generatedAlertCount, 1, 'Should create exactly 1 alert for matching verified property');
    // Verify notification details
    const tenantNotifs = db.getUserNotifications(tenantUser.id);
    assert.strictEqual(tenantNotifs.length, 1, 'Tenant should have 1 in-app notification');
    assert.strictEqual(tenantNotifs[0].type, 'saved_search_alert', 'Notification type must be saved_search_alert');
    assert.strictEqual(tenantNotifs[0].relatedPropertyId, propMatch.id, 'Related property ID must match');
    assert.strictEqual(tenantNotifs[0].relatedSearchId, savedSearch.id, 'Related search ID must match');
    assert.strictEqual(tenantNotifs[0].isRead, false, 'Notification must be unread initially');
    // Duplicate-Free Invariant: Re-running alert check should NOT send duplicate notification!
    const alertResult2 = db.executeSavedSearchAlertCheck(tenantUser.id);
    assert.strictEqual(alertResult2.generatedAlertCount, 0, 'Re-running alert check must not dispatch duplicate alerts');
    const tenantNotifsAfter = db.getUserNotifications(tenantUser.id);
    assert.strictEqual(tenantNotifsAfter.length, 1, 'Notification count must remain 1 (no spam duplicates)');
    // Test delete saved search
    const deleted = db.deleteSavedSearch(tenantUser.id, savedSearch.id);
    assert.strictEqual(deleted, true, 'Saved search should be deleted');
    assert.strictEqual(db.getUserSavedSearches(tenantUser.id).length, 0, 'Saved searches should now be empty');
    console.log('✓ Saved search creation, matching, duplicate-prevention, and deletion verified.');
    // ==============================================================================
    // TEST 3: Real Performance Analytics Engine
    // ==============================================================================
    console.log('\n--- TEST 3: Real Performance Analytics Engine ---');
    // Seed authentic property views for propMatch
    db.recordPropertyView(propMatch.id, tenantUser.id, '192.168.1.100');
    db.recordPropertyView(propMatch.id, tenantUser.id, '192.168.1.100');
    db.recordPropertyView(propMatch.id, agentUser.id, '192.168.1.101');
    // Verify view count
    assert.strictEqual(db.getPropertyViewCount(propMatch.id), 3, 'Genuine view count should be 3');
    // Seed authentic connection inquiry
    db.connections.set('conn_test_1', {
        id: 'conn_test_1',
        propertyId: propMatch.id,
        senderId: tenantUser.id,
        tenantId: tenantUser.id,
        recipientId: ownerUser.id,
        ownerId: ownerUser.id,
        status: 'accepted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    // Seed authentic confirmed visit
    db.propertyVisits.set('visit_test_1', {
        id: 'visit_test_1',
        propertyId: propMatch.id,
        connectionId: 'conn_test_1',
        tenantId: tenantUser.id,
        ownerId: ownerUser.id,
        visitDate: '2026-10-25',
        timeSlot: '11:00 AM - 12:00 PM',
        status: 'confirmed',
        notes: 'In-person inspection visit.',
        statusHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });
    // Compute analytics for ownerUser
    const ownerAnalytics = db.getOwnerPerformanceAnalytics(ownerUser.id);
    assert.strictEqual(ownerAnalytics.totalGenuineViews, 3, 'Total genuine views must equal recorded views');
    assert.strictEqual(ownerAnalytics.totalInquiries, 1, 'Total inquiries must equal authentic connection inquiries');
    assert.strictEqual(ownerAnalytics.totalVisitRequests, 1, 'Total visit requests must be 1');
    assert.strictEqual(ownerAnalytics.confirmedVisitsCount, 1, 'Confirmed visits count must be 1');
    assert.strictEqual(ownerAnalytics.activeApprovedListings, 2, 'Should have 2 approved listings (propMatch and propExpensive)');
    assert.strictEqual(ownerAnalytics.draftListings, 1, 'Should have 1 draft listing');
    assert.strictEqual(ownerAnalytics.verificationStatusBreakdown.authoritative_verified, 2, 'Authoritative verified breakdown must be 2');
    assert.ok(ownerAnalytics.metricsDisclaimer.includes('Griha Saathi never synthesizes simulated traffic'), 'Disclaimer must accompany metrics');
    console.log('✓ Real performance analytics computed strictly from genuine database events.');
    // ==============================================================================
    // TEST 4: Unified Notification Centre
    // ==============================================================================
    console.log('\n--- TEST 4: Unified Notification Centre & Read States ---');
    // Add 2 more notifications for tenant
    db.addNotification(tenantUser.id, 'Visit Confirmed', 'Your property visit is confirmed for Sunday.', 'visit_confirmed', propMatch.id, undefined, 'visit_test_1');
    db.addNotification(tenantUser.id, 'Security Alert', 'New session started from Chrome on Windows.', 'security_alert');
    const allTenantNotifs = db.getUserNotifications(tenantUser.id);
    assert.strictEqual(allTenantNotifs.length, 3, 'Tenant should have 3 notifications in total');
    assert.strictEqual(allTenantNotifs.filter(n => !n.isRead).length, 3, 'All 3 should be unread');
    // Mark single notification read
    const firstNotif = allTenantNotifs[0];
    const markSingle = db.markNotificationRead(firstNotif.id, tenantUser.id);
    assert.strictEqual(markSingle, true, 'Marking single notification read should succeed');
    assert.strictEqual(db.getUserNotifications(tenantUser.id).filter(n => !n.isRead).length, 2, 'Unread count should be 2');
    // Mark all read
    const markedAllCount = db.markAllNotificationsRead(tenantUser.id);
    assert.strictEqual(markedAllCount, 2, 'Mark all should mark remaining 2 as read');
    assert.strictEqual(db.getUserNotifications(tenantUser.id).filter(n => !n.isRead).length, 0, 'Unread count should be 0');
    console.log('✓ In-app notification creation, unread counting, and atomic mark-all-read verified.');
    // ==============================================================================
    // TEST 5: Profile Photo Upload & Storage Integration
    // ==============================================================================
    console.log('\n--- TEST 5: Profile Photo Upload & Integrity ---');
    // Valid 1x1 GIF / JPEG buffer
    const samplePhotoBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    const uploadResult = await storeUploadedFile(samplePhotoBuffer, 'avatar_vikram.png', 'image/png', false);
    assert.strictEqual(uploadResult.success, true, 'Photo storage should succeed');
    assert.ok(uploadResult.result?.url, 'Stored photo must have a public URL');
    tenantUser.avatarUrl = uploadResult.result.url;
    db.users.set(tenantUser.id, tenantUser);
    const updatedTenantProfile = db.toPublicProfile(tenantUser);
    assert.strictEqual(updatedTenantProfile.avatarUrl, uploadResult.result.url, 'User public profile must reflect avatar URL');
    console.log('✓ Profile photo validated, stored, and attached to user record.');
    // ==============================================================================
    // TEST 6: Account Deactivation & Deletion Safeguards
    // ==============================================================================
    console.log('\n--- TEST 6: Account Deactivation Safeguards ---');
    // Seed active session token for ownerUser
    const sessionToken = 'gs_sess_test_token_123';
    db.sessions.set(sessionToken, {
        token: sessionToken,
        userId: ownerUser.id,
        createdAt: Date.now(),
        expiresAt: Date.now() + 86400000,
    });
    assert.strictEqual(db.sessions.has(sessionToken), true, 'Session should exist before deactivation');
    // Execute account deactivation
    const deactSuccess = db.deleteOrDeactivateAccount(ownerUser.id, 'deactivate', 'Owner requested temporary hiatus');
    assert.strictEqual(deactSuccess, true, 'Deactivation call should return true');
    // Verify user is deactivated
    const deactivatedUser = db.users.get(ownerUser.id);
    assert.strictEqual(deactivatedUser?.isDeactivated, true, 'User record must have isDeactivated: true');
    // Verify all active sessions were revoked
    assert.strictEqual(db.sessions.has(sessionToken), false, 'All active sessions must be terminated upon deactivation');
    // Verify active approved listings were withdrawn from public marketplace
    const ownerProp1 = db.properties.get(propMatch.id);
    const ownerProp2 = db.properties.get(propExpensive.id);
    assert.strictEqual(ownerProp1?.submissionStatus, 'withdrawn', 'Active approved listing must be automatically withdrawn');
    assert.strictEqual(ownerProp2?.submissionStatus, 'withdrawn', 'Second approved listing must also be withdrawn');
    // Verify audit event was logged
    const auditLogs = db.getUserAuditEvents(ownerUser.id);
    const deactLog = auditLogs.find(a => a.action === 'ACCOUNT_DEACTIVATED');
    assert.ok(deactLog, 'Audit event ACCOUNT_DEACTIVATED must be recorded in security log');
    console.log('✓ Account deactivation safeguards (session revocation, listing withdrawal, audit logging) fully verified.');
    console.log('\n================================================================================');
    console.log('ALL PHASE 9 DASHBOARD, NOTIFICATIONS & ACCOUNT TESTS PASSED (6/6)');
    console.log('================================================================================\n');
}
runDashboardNotificationsAccountTestSuite().catch((err) => {
    console.error('\n❌ Phase 9 Test Suite Failed:\n', err);
    process.exit(1);
});
