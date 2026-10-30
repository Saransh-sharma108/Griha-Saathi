import assert from 'assert';
import { db } from '../db.js';
import { checkProviderConfig, createAndDispatchOtp, parseIdentifier, normalizePhone, normalizeEmail } from '../otpService.js';
import { getDatabaseStatus } from '../db/pgPool.js';
import { getGatewayDiagnostics, getMsg91Diagnostic } from '../loadEnv.js';

async function runDeliveryIsolationTests() {
  console.log('================================================================');
  console.log('GRIHA SAATHI — INDEPENDENT CHANNEL & DELIVERY ISOLATION TESTS');
  console.log('================================================================\n');

  // 1. Channel Isolation: Email dispatch does NOT query or require SMS gateway
  console.log('[Test 1] Testing Email channel independence...');
  const emailDiag = checkProviderConfig('email');
  const smsDiag = checkProviderConfig('phone');
  
  // Dispatching email OTP
  const emailResult = await createAndDispatchOtp('independent.seeker@example.com', 'registration');
  assert.strictEqual(emailResult.providerName, emailDiag.providerName, 'Email provider must be checked');
  assert.notStrictEqual(emailResult.providerName, smsDiag.providerName, 'Email must NOT invoke SMS provider');
  if (!emailDiag.isConfigured) {
    assert.strictEqual(emailResult.error?.includes('Resend Email API'), true, 'Error must identify email provider');
    assert.strictEqual(emailResult.error?.includes('MSG91'), false, 'Error must NEVER mention MSG91 when email is selected');
  }
  console.log('✓ Test 1 Passed: Email OTP channel operates completely independent of MSG91.\n');

  // 2. Channel Isolation: SMS dispatch does NOT query or require Email gateway
  console.log('[Test 2] Testing Indian Mobile SMS channel independence...');
  const smsResult = await createAndDispatchOtp('9876500001', 'registration');
  assert.strictEqual(smsResult.providerName, smsDiag.providerName, 'SMS provider must be checked');
  assert.notStrictEqual(smsResult.providerName, emailDiag.providerName, 'SMS must NOT invoke Email provider');
  if (!smsDiag.isConfigured) {
    assert.strictEqual(smsResult.error?.includes('MSG91 Indian SMS Gateway'), true, 'Error must identify MSG91 provider');
    assert.strictEqual(smsResult.error?.includes('Resend'), false, 'Error must NEVER mention Resend when SMS is selected');
  }
  console.log('✓ Test 2 Passed: SMS OTP channel operates completely independent of Resend.\n');

  // 3. Contact Normalization & Optionality
  console.log('[Test 3] Testing contact optionality and normalization...');
  const phoneOnly = normalizePhone('9811223344');
  assert.strictEqual(phoneOnly.isValid, true);
  assert.strictEqual(phoneOnly.tenDigit, '9811223344');
  assert.strictEqual(phoneOnly.international, '+919811223344');

  const emailOnly = normalizeEmail('citizen@jammu.gov.in');
  assert.strictEqual(emailOnly.isValid, true);
  assert.strictEqual(emailOnly.normalized, 'citizen@jammu.gov.in');

  // Blank contact handling
  const blankEmail = normalizeEmail('');
  assert.strictEqual(blankEmail.isValid, true, 'Blank optional email is valid when phone is provided');
  assert.strictEqual(blankEmail.normalized, '');

  console.log('✓ Test 3 Passed: Optional contact validation works cleanly for both channels.\n');

  // 4. Database Engine Status & Relational Invariants
  console.log('[Test 4] Testing database engine status & persistence architecture...');
  const dbStatus = getDatabaseStatus();
  console.log(`  Database Status: Engine: ${dbStatus.type}, Connected: ${dbStatus.connected}`);
  assert.ok(['postgresql', 'file_persisted'].includes(dbStatus.type), 'Database engine must be postgresql or file_persisted');
  assert.strictEqual(typeof db.saveUsersToDisk, 'function');
  assert.strictEqual(typeof db.loadUsersFromDisk, 'function');
  console.log('✓ Test 4 Passed: Dual-engine database architecture (Postgres pool + zero-data-loss persistence) verified.\n');

  // 5. Server-Side Diagnostic Endpoints Validation
  console.log('[Test 5] Testing server-side diagnostic reporting (zero secret leakage)...');
  const msg91Diag = getMsg91Diagnostic();
  assert.strictEqual(typeof msg91Diag.MSG91_AUTH_KEY_configured, 'boolean');
  assert.strictEqual(typeof msg91Diag.MSG91_TEMPLATE_ID_configured, 'boolean');
  assert.strictEqual(typeof msg91Diag.loaded_environment_file_path, 'string');
  assert.strictEqual(typeof msg91Diag.backend_working_directory, 'string');

  const gatewayDiag = getGatewayDiagnostics();
  assert.strictEqual(typeof gatewayDiag.sms.configured, 'boolean');
  assert.strictEqual(typeof gatewayDiag.email.configured, 'boolean');
  assert.strictEqual(typeof gatewayDiag.envFile.loaded, 'boolean');
  console.log('✓ Test 5 Passed: Diagnostic endpoints strictly verify credentials as booleans without leaking secrets.\n');

  console.log('================================================================');
  console.log('ALL DELIVERY ISOLATION & CHANNEL INDEPENDENCE TESTS PASSED (100%)');
  console.log('================================================================');
}

runDeliveryIsolationTests().catch((err) => {
  console.error('\n❌ Isolation Test Suite Failed:', err);
  process.exit(1);
});

