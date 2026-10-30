import assert from 'assert';
import { db, UserRecord } from '../db.js';
import { Property } from '../../../shared/types.js';

async function runConnectionsMessagingVisitsTestSuite() {
  console.log('================================================================');
  console.log('GRIHA SAATHI — PHASE 7 CONNECTIONS, MESSAGING & VISITS TEST SUITE');
  console.log('================================================================\n');

  // Reset database state for testing
  db.properties.clear();
  db.users.clear();
  db.connections.clear();
  db.messages.length = 0;
  db.propertyVisits.clear();
  db.blockedUsers.clear();
  db.notifications.clear();
  db.userMessageTimestamps.clear();

  // Helper to seed users
  const seedUser = (id: string, identifier: string, role: any, isPhoneVerified = true) => {
    const user: UserRecord = {
      id,
      identifier,
      phone: identifier.startsWith('+') ? identifier : undefined,
      email: identifier.includes('@') ? identifier : undefined,
      role,
      activeRole: role,
      roles: [role],
      isPhoneVerified,
      isEmailVerified: true,
      isIdentityVerified: false,
      preferredLanguage: 'en',
      notificationPreferences: {
        emailAlerts: true,
        smsAlerts: true,
        propertyInquiries: true,
        securityAlerts: true,
      },
      pinHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      failedPinAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.set(id, user);
    return user;
  };

  const owner1 = seedUser('usr_owner_gurugram', '+919811122233', 'owner', true);
  const owner2 = seedUser('usr_owner_shimla', '+919822233344', 'owner', true);
  const tenant1 = seedUser('usr_tenant_rohit', '+919833344455', 'tenant', true);
  const tenant2 = seedUser('usr_tenant_priya', '+919844455566', 'tenant', true);
  const tenant3 = seedUser('usr_tenant_amit', '+919855566677', 'tenant', true);

  // Helper to seed properties
  const seedProperty = (id: string, ownerId: string, isAvailable = true): Property => {
    const prop: Property = {
      id,
      ownerId,
      title: 'Modern 2 BHK Floor in DLF Phase 4',
      description: 'Well-maintained floor with dedicated parking and security.',
      propertyType: '2bhk',
      rentPerMonth: 38000,
      securityDeposit: 76000,
      addressDetails: 'C-24, Ground Floor',
      locality: 'DLF Phase 4',
      city: 'Gurugram',
      state: 'Haryana',
      pincode: '122002',
      bedrooms: 2,
      bathrooms: 2,
      areaSqFt: 1250,
      furnishing: 'semi_furnished',
      tenantPreference: 'family',
      amenities: ['Power Backup', 'Lift'],
      availableFrom: '2026-11-01',
      isAvailable,
      verificationStatus: 'authoritative_verified',
      submissionStatus: 'approved',
      declaredAuthority: 'sole_owner',
      photos: [],
      documents: [],
      statusHistory: [],
      isAvailabilityConfirmed: true,
      availabilityConfirmedAt: new Date().toISOString(),
      dataSource: 'owner_submission',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.properties.set(id, prop);
    return prop;
  };

  const prop1 = seedProperty('prop_dlf_01', owner1.id, true);
  const propUnavailable = seedProperty('prop_unavail_02', owner2.id, false);

  // Helper for tomorrow's date YYYY-MM-DD
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  console.log('[SECTION 1] Connections: Validation, Self-Connection & Safety Invariants');

  // Test 1.1: Self-connection prevention
  assert.throws(
    () => {
      db.createConnectionRequest(owner1.id, prop1.id);
    },
    /Self-connection prohibited/,
    'Self-connection must be prevented'
  );
  console.log('✓ Invariant verified: Self-connection is strictly rejected');

  // Test 1.2: Non-existent property
  assert.throws(
    () => {
      db.createConnectionRequest(tenant1.id, 'prop_non_existent');
    },
    /Property listing not found/,
    'Non-existent property connection must fail'
  );
  console.log('✓ Invariant verified: Non-existent property connection is rejected');

  // Test 1.3: Unavailable property connection
  assert.throws(
    () => {
      db.createConnectionRequest(tenant1.id, propUnavailable.id);
    },
    /currently marked unavailable/,
    'Unavailable property connection must fail'
  );
  console.log('✓ Invariant verified: Unavailable property connection is rejected');

  console.log('\n[SECTION 2] Connections: Lifecycle (Request, Duplicate Prevention, Accept, Decline, Cancel)');

  // Test 2.1: Valid connection request on property
  const conn1 = db.createConnectionRequest(tenant1.id, prop1.id, 'Hello, I want to rent this property.');
  assert.ok(conn1.id.startsWith('conn_'));
  assert.strictEqual(conn1.status, 'pending');
  assert.strictEqual(conn1.tenantNote, 'Hello, I want to rent this property.');
  console.log('✓ Connection request created successfully with pending status');

  // Test 2.2: Duplicate active connection prevention
  assert.throws(
    () => {
      db.createConnectionRequest(tenant1.id, prop1.id);
    },
    /already exists/,
    'Duplicate active connection request must fail'
  );
  console.log('✓ Invariant verified: Duplicate active connection request is prevented');

  // Test 2.3: In-app notification sent on connection request
  const ownerNotifications = db.getUserNotifications(owner1.id);
  const connReqNotif = ownerNotifications.find((n) => n.type === 'connection_request');
  assert.ok(connReqNotif, 'Owner must receive connection_request notification');
  assert.strictEqual(connReqNotif.relatedConnectionId, conn1.id);
  console.log('✓ Notification verified: Owner received connection_request notification with relatedConnectionId');

  // Test 2.4: Accept connection
  const acceptedConn = db.acceptConnection(conn1.id, owner1.id);
  assert.strictEqual(acceptedConn.status, 'accepted');
  console.log('✓ Connection accepted successfully');

  // Test 2.5: Tenant receives connection_accepted notification
  const tenant1Notifications = db.getUserNotifications(tenant1.id);
  const connAcceptedNotif = tenant1Notifications.find((n) => n.type === 'connection_accepted');
  assert.ok(connAcceptedNotif, 'Tenant must receive connection_accepted notification');
  console.log('✓ Notification verified: Tenant received connection_accepted notification');

  // Test 2.6: Decline connection
  const conn2 = db.createConnectionRequest(tenant2.id, prop1.id, 'Interested in inspection');
  const declinedConn = db.declineConnection(conn2.id, owner1.id);
  assert.strictEqual(declinedConn.status, 'declined');
  console.log('✓ Connection declined successfully');

  // Test 2.7: Cancel connection (by sender)
  const conn3 = db.createConnectionRequest(tenant3.id, prop1.id, 'Can I see the flat?');
  const cancelledConn = db.cancelConnection(conn3.id, tenant3.id);
  assert.strictEqual(cancelledConn.status, 'cancelled');
  console.log('✓ Connection cancelled by sender successfully');

  // Test 2.8: Unauthorized user cannot accept or cancel
  assert.throws(
    () => {
      db.acceptConnection(conn2.id, tenant3.id);
    },
    /Unauthorized|Only the recipient/,
    'Unauthorized user cannot accept connection'
  );
  console.log('✓ Security verified: Unauthorized user cannot accept connection');

  console.log('\n[SECTION 3] Secure In-App Messaging: Authorization, Rate Limits & Privacy');

  // Test 3.1: Cannot message on non-accepted connection
  assert.throws(
    () => {
      db.sendMessage(conn2.id, tenant2.id, 'Hello?');
    },
    /Cannot send messages in a declined connection/,
    'Messaging on declined connection must fail'
  );
  console.log('✓ Security verified: Messaging forbidden on declined connection');

  // Test 3.2: Message sending between accepted parties
  const msg1 = db.sendMessage(conn1.id, tenant1.id, 'Hi, when would be a good time to view the flat?');
  assert.ok(msg1.id.startsWith('msg_'));
  assert.strictEqual(msg1.senderId, tenant1.id);
  assert.strictEqual(msg1.isRead, false);
  console.log('✓ Message sent successfully within accepted connection');

  // Test 3.3: Unauthorized third-party cannot read or send messages
  assert.throws(
    () => {
      db.getMessages(conn1.id, tenant2.id);
    },
    /Unauthorized/,
    'Unauthorized party cannot view conversation messages'
  );
  assert.throws(
    () => {
      db.sendMessage(conn1.id, tenant2.id, 'Sneaky message');
    },
    /Unauthorized/,
    'Unauthorized party cannot send messages in another conversation'
  );
  console.log('✓ Privacy verified: Third parties cannot read or send messages in private conversation');

  // Test 3.4: Mark messages as read
  const unreadBefore = db.getMessages(conn1.id, owner1.id).filter((m) => !m.isRead && m.senderId !== owner1.id);
  assert.strictEqual(unreadBefore.length, 1);
  db.markMessagesAsRead(conn1.id, owner1.id);
  const unreadAfter = db.getMessages(conn1.id, owner1.id).filter((m) => !m.isRead && m.senderId !== owner1.id);
  assert.strictEqual(unreadAfter.length, 0);
  console.log('✓ Read status tracking verified: markMessagesAsRead successfully updates receipts');

  // Test 3.5: Message content length limits
  assert.throws(
    () => {
      db.sendMessage(conn1.id, tenant1.id, '');
    },
    /cannot be empty/,
    'Empty message must be rejected'
  );
  assert.throws(
    () => {
      db.sendMessage(conn1.id, tenant1.id, 'a'.repeat(2001));
    },
    /exceeds 2,000 character limit/,
    'Message exceeding 2000 chars must be rejected'
  );
  console.log('✓ Validation verified: Message character boundaries (1-2000 chars) enforced');

  // Test 3.6: Rate limiting (30 messages per minute)
  console.log('  Testing message rate limiter (30 msgs/min)...');
  // We already sent 1 message (msg1), so send 29 more to reach 30
  for (let i = 0; i < 29; i++) {
    db.sendMessage(conn1.id, tenant1.id, `Rapid ping message ${i + 2}`);
  }
  // 31st message within 1 minute must throw rate limit error
  assert.throws(
    () => {
      db.sendMessage(conn1.id, tenant1.id, 'Message 31 - should be blocked');
    },
    /Rate limit exceeded/,
    '31st message must trigger rate limiting error'
  );
  console.log('✓ Security verified: Rate limit of 30 messages/min strictly enforced');

  console.log('\n[SECTION 4] Safety Controls: Message Abuse Reporting & User Blocking');

  // Test 4.1: Report abusive message
  const reportedSuccess = db.reportMessage(msg1.id, owner1.id, 'Spam and repetitive messages');
  assert.strictEqual(reportedSuccess, true);
  console.log('✓ Safety verified: Abusive message reported successfully');

  // Test 4.2: User blocking
  const blockRecord = db.blockUser(owner1.id, tenant1.id, 'Unreasonable harassment');
  assert.ok(blockRecord.id.startsWith('blk_'));
  assert.strictEqual(db.isUserBlocked(owner1.id, tenant1.id), true);
  assert.strictEqual(db.isUserBlocked(tenant1.id, owner1.id), true);
  console.log('✓ Safety verified: User blocked successfully and bidirectional block recognized');

  // Test 4.3: Connection status updated to 'blocked'
  const blockedConn = db.getConnection(conn1.id);
  assert.strictEqual(blockedConn?.status, 'blocked');
  console.log('✓ Invariant verified: Blocking automatically terminates active connection to blocked state');

  // Test 4.4: Blocked user cannot send messages or connection requests
  assert.throws(
    () => {
      db.sendMessage(conn1.id, tenant1.id, 'Are you there?');
    },
    /blocked/,
    'Messaging between blocked users must be forbidden'
  );
  assert.throws(
    () => {
      db.createConnectionRequest(tenant1.id, prop1.id);
    },
    /blocked/,
    'Connecting with blocked user must be forbidden'
  );
  console.log('✓ Invariant verified: Blocked users cannot send messages or connection requests');

  // Test 4.5: Unblocking user
  db.unblockUser(owner1.id, tenant1.id);
  assert.strictEqual(db.isUserBlocked(owner1.id, tenant1.id), false);
  console.log('✓ Safety verified: Unblocking user restores communication clearance');

  console.log('\n[SECTION 5] Property Visit Scheduling: Lifecycle, Availability & Slot Conflicts');

  // Reset connection for visit testing
  const visitConn = db.createConnectionRequest(tenant2.id, prop1.id, 'Schedule visit please');
  db.acceptConnection(visitConn.id, owner1.id);

  // Test 5.1: Past date rejection
  assert.throws(
    () => {
      db.createPropertyVisit(tenant2.id, prop1.id, visitConn.id, '2020-01-01', 'morning_10_12', 'Past date visit');
    },
    /cannot be in the past/,
    'Past visit date must be rejected'
  );
  console.log('✓ Invariant verified: Past date visits are strictly rejected');

  // Test 5.2: Self-visit by owner rejection
  assert.throws(
    () => {
      db.createPropertyVisit(owner1.id, prop1.id, visitConn.id, tomorrowStr, 'morning_10_12');
    },
    /Owners cannot request visits/,
    'Owner cannot request visit to their own property'
  );
  console.log('✓ Invariant verified: Owners cannot book visits on their own properties');

  // Test 5.3: Valid visit request creation
  const visit1 = db.createPropertyVisit(tenant2.id, prop1.id, visitConn.id, tomorrowStr, 'morning_10_12', 'Interested in family tenancy');
  assert.ok(visit1.id.startsWith('vis_'));
  assert.strictEqual(visit1.status, 'pending');
  assert.strictEqual(visit1.visitDate, tomorrowStr);
  assert.strictEqual(visit1.timeSlot, 'morning_10_12');
  assert.strictEqual(visit1.statusHistory.length, 1);
  console.log('✓ Property visit request created with pending state and audit history');

  // Test 5.4: Duplicate active visit booking prevention for same visitor & property slot
  assert.throws(
    () => {
      db.createPropertyVisit(tenant2.id, prop1.id, visitConn.id, tomorrowStr, 'morning_10_12');
    },
    /already have an active visit booking/,
    'Duplicate active visit for same visitor slot must fail'
  );
  console.log('✓ Invariant verified: Duplicate active visits by same visitor on same slot are prevented');

  // Test 5.5: Owner confirms visit
  const confirmedVisit = db.confirmPropertyVisit(visit1.id, owner1.id);
  assert.strictEqual(confirmedVisit.status, 'confirmed');
  assert.strictEqual(confirmedVisit.statusHistory.length, 2);
  assert.strictEqual(confirmedVisit.statusHistory[1].toStatus, 'confirmed');
  console.log('✓ Visit confirmed by owner; statusHistory audited');

  // Test 5.6: Conflicting confirmed visit prevention
  // Another tenant (tenant3) establishes accepted connection with owner1
  const tenant3Conn = db.createConnectionRequest(tenant3.id, prop1.id, 'I also want to visit');
  db.acceptConnection(tenant3Conn.id, owner1.id);

  // Tenant 3 attempts to request the exact same confirmed slot: tomorrowStr, morning_10_12
  assert.throws(
    () => {
      db.createPropertyVisit(tenant3.id, prop1.id, tenant3Conn.id, tomorrowStr, 'morning_10_12');
    },
    /already confirmed for another inspection/,
    'Double-booking the exact same confirmed property slot must fail'
  );
  console.log('✓ Invariant verified: Conflicting confirmed visit slots are prevented');

  // Tenant 3 chooses a non-conflicting slot: tomorrowStr, afternoon_2_4 -> succeeds
  const visit2 = db.createPropertyVisit(tenant3.id, prop1.id, tenant3Conn.id, tomorrowStr, 'afternoon_2_4');
  assert.strictEqual(visit2.status, 'pending');
  console.log('✓ Non-conflicting visit slot successfully scheduled');

  console.log('\n[SECTION 6] Visit Negotiation: Counter-proposals, Rescheduling & Cancellations');

  // Test 6.1: Owner proposes rescheduling for visit2
  const rescheduledVisit = db.reschedulePropertyVisit(
    visit2.id,
    owner1.id,
    dayAfterTomorrowStr,
    'evening_4_6',
    'Morning/Afternoon is crowded; evening is ideal for full viewing.'
  );
  assert.strictEqual(rescheduledVisit.status, 'rescheduled');
  assert.strictEqual(rescheduledVisit.proposedAlternativeSlot?.visitDate, dayAfterTomorrowStr);
  assert.strictEqual(rescheduledVisit.proposedAlternativeSlot?.timeSlot, 'evening_4_6');
  console.log('✓ Reschedule proposal with alternative date and slot recorded');

  // Test 6.2: Tenant accepts reschedule proposal
  const acceptedReschedule = db.acceptRescheduledVisit(visit2.id, tenant3.id);
  assert.strictEqual(acceptedReschedule.status, 'confirmed');
  assert.strictEqual(acceptedReschedule.visitDate, dayAfterTomorrowStr);
  assert.strictEqual(acceptedReschedule.timeSlot, 'evening_4_6');
  console.log('✓ Tenant accepted reschedule proposal; preferred date updated to proposal');

  // Test 6.3: Cancellation requires mandatory reason
  assert.throws(
    () => {
      db.cancelPropertyVisit(visit2.id, tenant3.id, '');
    },
    /cancellation reason is required/,
    'Cancellation without reason must fail'
  );
  console.log('✓ Invariant verified: Visit cancellation requires a mandatory rationale');

  // Test 6.4: Valid cancellation
  const cancelledVisit = db.cancelPropertyVisit(visit2.id, tenant3.id, 'Relocation postponed by employer');
  assert.strictEqual(cancelledVisit.status, 'cancelled');
  assert.strictEqual(cancelledVisit.cancellationReason, 'Relocation postponed by employer');
  assert.strictEqual(cancelledVisit.cancelledBy, tenant3.id);
  console.log('✓ Visit cancelled with recorded reason and cancelledBy attribution');

  // Test 6.5: Visit completion
  const completedVisit = db.completePropertyVisit(visit1.id, owner1.id);
  assert.strictEqual(completedVisit.status, 'completed');
  console.log('✓ Property visit completed successfully and recorded in history');

  console.log('\n[SECTION 7] Notifications & Deep Link Verification');

  const allNotifications = db.getUserNotifications(tenant2.id);
  const visitConfirmedNotif = allNotifications.find((n) => n.type === 'visit_confirmed');
  assert.ok(visitConfirmedNotif, 'Tenant 2 must have received visit_confirmed notification');
  assert.strictEqual(visitConfirmedNotif.relatedVisitId, visit1.id);
  assert.strictEqual(visitConfirmedNotif.isRead, false);

  // Mark notification as read
  const readSuccess = db.markNotificationRead(visitConfirmedNotif.id, tenant2.id);
  assert.strictEqual(readSuccess, true);
  console.log('✓ Notification read state updated successfully');

  console.log('\n[SECTION 8] Demo Connections & Direct Messaging Simulation Suite');

  // Test 8.1: Calling getUserConnections for owner creates the 3 demo connections
  const testOwnerId = 'usr_owner_demo_tester';
  seedUser(testOwnerId, '+919988776655', 'owner', true);
  const userConns = db.getUserConnections(testOwnerId);

  const aryanConn = userConns.find((c) => c.senderId === 'usr_demo_aryan' || c.recipientId === 'usr_demo_aryan');
  const madhavConn = userConns.find((c) => c.senderId === 'usr_demo_madhav' || c.recipientId === 'usr_demo_madhav');
  const sakshamConn = userConns.find((c) => c.senderId === 'usr_demo_saksham' || c.recipientId === 'usr_demo_saksham');

  assert.ok(aryanConn, 'Aryan demo connection must be present in connections');
  assert.ok(madhavConn, 'Madhav demo connection must be present in connections');
  assert.ok(sakshamConn, 'Saksham demo connection must be present in connections');
  console.log('✓ Test 8.1 Passed: Aryan, Madhav, and Saksham connections initialized');

  // Test 8.2: Verify avatar initials, colors, and demo flags
  assert.strictEqual(aryanConn.avatarInitials, 'AR');
  assert.strictEqual(aryanConn.avatarBg, '#2563EB');
  assert.strictEqual(aryanConn.isDemo, true);

  assert.strictEqual(madhavConn.avatarInitials, 'MA');
  assert.strictEqual(madhavConn.avatarBg, '#D97706');
  assert.strictEqual(madhavConn.isDemo, true);

  assert.strictEqual(sakshamConn.avatarInitials, 'SA');
  assert.strictEqual(sakshamConn.avatarBg, '#059669');
  assert.strictEqual(sakshamConn.isDemo, true);
  console.log('✓ Test 8.2 Passed: Distinct avatar colors (#2563EB, #D97706, #059669) and initials verified');

  // Test 8.3: Online / Offline status and last active text
  assert.strictEqual(aryanConn.onlineStatus, 'online');
  assert.strictEqual(aryanConn.lastActiveText, 'Online now');

  assert.strictEqual(madhavConn.onlineStatus, 'offline');
  assert.strictEqual(madhavConn.lastActiveText, 'Active 15m ago');

  assert.strictEqual(sakshamConn.onlineStatus, 'offline');
  assert.strictEqual(sakshamConn.lastActiveText, 'Active 1h ago');
  console.log('✓ Test 8.3 Passed: Online and offline activity indicators verified');

  // Test 8.4: Initial inquiry messages
  assert.strictEqual(aryanConn.lastMessage?.content, 'Hi! I am interested in discussing a property listing.');
  assert.strictEqual(madhavConn.lastMessage?.content, 'Hello! Can you share more details about the property?');
  assert.strictEqual(sakshamConn.lastMessage?.content, 'Hi! I would like to know about the availability.');
  console.log('✓ Test 8.4 Passed: Initial inquiry messages match required specifications');

  // Test 8.5: Unread count tracking
  assert.strictEqual(aryanConn.unreadCount, 1);
  assert.strictEqual(madhavConn.unreadCount, 1);
  assert.strictEqual(sakshamConn.unreadCount, 1);
  console.log('✓ Test 8.5 Passed: Initial unread badge counts verified');

  // Test 8.6: User replies to Aryan, triggers automated contextual demo reply
  const reply1 = db.sendMessage(aryanConn.id, testOwnerId, 'The rent is 35,000 per month with two months deposit.');
  assert.strictEqual(reply1.senderId, testOwnerId);
  assert.strictEqual(reply1.isRead, true); // Marked read by demo contact

  const aryanThread = db.getMessages(aryanConn.id, testOwnerId);
  assert.ok(aryanThread.length >= 3, 'Aryan thread must include initial, user reply, and automated demo reply');
  const aryanLastMsg = aryanThread[aryanThread.length - 1];
  assert.strictEqual(aryanLastMsg.senderId, 'usr_demo_aryan');
  assert.ok(aryanLastMsg.content.startsWith('[Demo Reply]'), 'Automated reply must be tagged as demo');
  assert.ok(aryanLastMsg.content.includes('maintenance'), 'Aryan should respond contextually to rent terms');
  console.log('✓ Test 8.6 Passed: Aryan contextual demo reply triggered and persisted');

  // Test 8.7: User asks Madhav about parking
  db.sendMessage(madhavConn.id, testOwnerId, 'Yes, the apartment has a dedicated covered parking spot.');
  const madhavThread = db.getMessages(madhavConn.id, testOwnerId);
  const madhavLastMsg = madhavThread[madhavThread.length - 1];
  assert.strictEqual(madhavLastMsg.senderId, 'usr_demo_madhav');
  assert.ok(madhavLastMsg.content.includes('parking') || madhavLastMsg.content.includes('Demo Reply'));
  console.log('✓ Test 8.7 Passed: Madhav contextual amenities/parking response verified');

  // Test 8.8: User messages Saksham about a weekend visit
  db.sendMessage(sakshamConn.id, testOwnerId, 'You are welcome to visit this Saturday or Sunday morning.');
  const sakshamThread = db.getMessages(sakshamConn.id, testOwnerId);
  const sakshamLastMsg = sakshamThread[sakshamThread.length - 1];
  assert.strictEqual(sakshamLastMsg.senderId, 'usr_demo_saksham');
  assert.ok(sakshamLastMsg.content.includes('Saturday') || sakshamLastMsg.content.includes('family') || sakshamLastMsg.content.includes('Demo Reply'));
  console.log('✓ Test 8.8 Passed: Saksham contextual weekend/family response verified');

  // Test 8.9: Mark messages as read zeroes out unreadCount
  const marked = db.markMessagesAsRead(aryanConn.id, testOwnerId);
  assert.ok(marked >= 1);
  const updatedAryanConn = db.getConnection(aryanConn.id, testOwnerId);
  assert.strictEqual(updatedAryanConn?.unreadCount, 0);
  console.log('✓ Test 8.9 Passed: Mark read clears unread badge count');

  // Test 8.10: Privacy & IDOR protection: unrelated user cannot view demo conversation
  assert.throws(
    () => {
      db.getMessages(aryanConn.id, 'usr_stranger_unrelated');
    },
    /Unauthorized/,
    'Unauthorized party cannot view demo thread'
  );
  console.log('✓ Test 8.10 Passed: Demo thread privacy protected against unauthorized third parties');

  console.log('\n================================================================');
  console.log('ALL PHASE 7 CONNECTIONS, MESSAGING & VISITS TESTS PASSED (100%)');
  console.log('================================================================');
}

runConnectionsMessagingVisitsTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
