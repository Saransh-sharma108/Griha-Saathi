import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Potential paths for .env in order of priority:
// 1. Current working directory .env (process.cwd()/.env)
// 2. Server directory .env (process.cwd()/server/.env)
// 3. Project root relative to this file (__dirname/../../.env)
// 4. Server directory relative to this file (__dirname/../.env)
const projectRoot = path.resolve(__dirname, '..', '..');
const serverDir = path.resolve(__dirname, '..');

const candidateEnvFiles = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
  path.resolve(projectRoot, '.env'),
  path.resolve(serverDir, '.env'),
];

// Deduplicate candidate files preserving order
const uniqueCandidateEnvFiles = Array.from(new Set(candidateEnvFiles));

export interface LoadedEnvInfo {
  isLoaded: boolean;
  activePath: string | null;
  scannedPaths: string[];
  loadedPaths: string[];
}

const loadedPaths: string[] = [];
export const variableSourceMap: Record<string, string> = {};

// SMART LOADER:
// Read candidate files. Never allow empty strings ("") from one file to shadow
// populated non-empty values from another file.
for (const envPath of uniqueCandidateEnvFiles) {
  if (fs.existsSync(envPath) && fs.statSync(envPath).isFile()) {
    try {
      const fileContent = fs.readFileSync(envPath, 'utf8');
      const parsed = dotenv.parse(fileContent);
      loadedPaths.push(envPath);

      for (const [key, rawVal] of Object.entries(parsed)) {
        const val = rawVal ? rawVal.trim() : '';
        const currentVal = process.env[key] ? process.env[key]!.trim() : '';

        // If the file supplies a non-empty value, apply it and record source
        if (val.length > 0) {
          if (!currentVal || currentVal.length === 0 || !variableSourceMap[key]) {
            process.env[key] = val;
            variableSourceMap[key] = envPath;
          }
        } else {
          // Key is defined as empty string in this file.
          // Only set it in process.env if not already set by an earlier non-empty definition.
          if (process.env[key] === undefined) {
            process.env[key] = '';
            variableSourceMap[key] = envPath;
          }
        }
      }
    } catch (err: any) {
      console.warn(`[loadEnv] Warning reading env file at ${envPath}:`, err.message);
    }
  }
}

export function getLoadedEnvInfo(): LoadedEnvInfo {
  return {
    isLoaded: loadedPaths.length > 0,
    activePath: loadedPaths[0] || null,
    scannedPaths: uniqueCandidateEnvFiles,
    loadedPaths,
  };
}

/**
 * Diagnostic helper that checks if a credential is non-empty and not a placeholder.
 * Strictly returns boolean — NEVER leaks actual credential values.
 */
export function isCredentialSet(value: string | undefined, placeholders: string[] = []): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  const commonPlaceholders = [
    'YOUR_MSG91_AUTH_KEY',
    'YOUR_MSG91_DLT_TEMPLATE_ID',
    'YOUR_MSG91_TEMPLATE_ID',
    'YOUR_SMS_API_KEY',
    'YOUR_RESEND_API_KEY',
    'YOUR_TWILIO_ACCOUNT_SID',
    'YOUR_TWILIO_AUTH_TOKEN',
    'YOUR_SMTP_PASSWORD',
    'YOUR_SMTP_USERNAME',
    'PLACEHOLDER',
    ...placeholders,
  ];
  return !commonPlaceholders.includes(trimmed);
}

/**
 * Specific server-side diagnostic reporting exclusively MSG91 configuration state,
 * loaded environment path, and working directory.
 * Strictly boolean statuses — Never leaks secret tokens.
 */
export function getMsg91Diagnostic() {
  const hasAuthKey = isCredentialSet(
    process.env.MSG91_AUTH_KEY || process.env.SMS_GATEWAY_API_KEY,
    ['YOUR_MSG91_AUTH_KEY', 'YOUR_SMS_API_KEY']
  );
  const hasTemplateId = isCredentialSet(
    process.env.MSG91_TEMPLATE_ID || process.env.SMS_DLT_TEMPLATE_ID,
    ['YOUR_MSG91_TEMPLATE_ID', 'YOUR_MSG91_DLT_TEMPLATE_ID']
  );
  const envInfo = getLoadedEnvInfo();

  // If credentials came from a specific file, report that source; otherwise default to primary loaded path
  const authKeySource = variableSourceMap['MSG91_AUTH_KEY'] || variableSourceMap['SMS_GATEWAY_API_KEY'] || null;
  const templateIdSource = variableSourceMap['MSG91_TEMPLATE_ID'] || variableSourceMap['SMS_DLT_TEMPLATE_ID'] || null;
  const loadedEnvPath = authKeySource || templateIdSource || envInfo.activePath || path.resolve(process.cwd(), '.env');

  return {
    MSG91_AUTH_KEY_configured: hasAuthKey,
    MSG91_TEMPLATE_ID_configured: hasTemplateId,
    loaded_environment_file_path: loadedEnvPath,
    backend_working_directory: process.cwd(),
  };
}

/**
 * Produces safe gateway diagnostic information (booleans only, never secrets).
 */
export function getGatewayDiagnostics() {
  const envInfo = getLoadedEnvInfo();

  // MSG91 Checks
  const hasMsg91AuthKey = isCredentialSet(
    process.env.MSG91_AUTH_KEY || process.env.SMS_GATEWAY_API_KEY,
    ['YOUR_MSG91_AUTH_KEY', 'YOUR_SMS_API_KEY']
  );
  const hasMsg91TemplateId = isCredentialSet(
    process.env.MSG91_TEMPLATE_ID || process.env.SMS_DLT_TEMPLATE_ID,
    ['YOUR_MSG91_TEMPLATE_ID', 'YOUR_MSG91_DLT_TEMPLATE_ID']
  );
  const msg91SenderId = (process.env.MSG91_SENDER_ID || process.env.SMS_GATEWAY_SENDER_ID || 'GRHSAT').trim();
  const hasMsg91 = hasMsg91AuthKey && hasMsg91TemplateId;

  // Twilio Checks
  const hasTwilioSid = isCredentialSet(process.env.TWILIO_ACCOUNT_SID);
  const hasTwilioToken = isCredentialSet(process.env.TWILIO_AUTH_TOKEN);
  const hasTwilioPhone = isCredentialSet(process.env.TWILIO_PHONE_NUMBER);
  const hasTwilio = hasTwilioSid && hasTwilioToken && hasTwilioPhone;

  // Resend Checks
  const hasResendKey = isCredentialSet(process.env.RESEND_API_KEY);
  const hasEmailFrom = isCredentialSet(process.env.EMAIL_FROM);
  const hasResend = hasResendKey;

  // SMTP Checks
  const hasSmtpHost = isCredentialSet(process.env.SMTP_HOST);
  const hasSmtpUser = isCredentialSet(process.env.SMTP_USER);
  const hasSmtpPass = isCredentialSet(process.env.SMTP_PASS);
  const hasSmtp = hasSmtpHost && hasSmtpUser && hasSmtpPass;

  const smsProvider = (process.env.SMS_PROVIDER || 'msg91').toLowerCase();
  const emailProvider = (process.env.EMAIL_PROVIDER || 'resend').toLowerCase();

  const missingSmsCredentials: string[] = [];
  if (smsProvider === 'msg91' || !hasTwilio) {
    if (!hasMsg91AuthKey) missingSmsCredentials.push('MSG91_AUTH_KEY');
    if (!hasMsg91TemplateId) missingSmsCredentials.push('MSG91_TEMPLATE_ID');
  }

  const missingEmailCredentials: string[] = [];
  if (emailProvider === 'resend' || !hasSmtp) {
    if (!hasResendKey) missingEmailCredentials.push('RESEND_API_KEY');
  }

  return {
    envFile: {
      loaded: envInfo.isLoaded,
      activePath: envInfo.activePath,
      loadedFiles: envInfo.loadedPaths,
    },
    sms: {
      configured: smsProvider === 'twilio' ? hasTwilio : hasMsg91,
      activeProvider: smsProvider === 'twilio' && hasTwilio ? 'twilio' : 'msg91',
      providerName: smsProvider === 'twilio' ? 'Twilio Carrier SMS' : 'MSG91 Indian SMS Gateway',
      variables: {
        MSG91_AUTH_KEY: hasMsg91AuthKey,
        MSG91_TEMPLATE_ID: hasMsg91TemplateId,
        MSG91_SENDER_ID: Boolean(msg91SenderId),
        TWILIO_ACCOUNT_SID: hasTwilioSid,
        TWILIO_AUTH_TOKEN: hasTwilioToken,
        TWILIO_PHONE_NUMBER: hasTwilioPhone,
      },
      missingCredentials: missingSmsCredentials,
    },
    email: {
      configured: emailProvider === 'smtp' ? hasSmtp : hasResend,
      activeProvider: emailProvider === 'smtp' && hasSmtp ? 'smtp' : 'resend',
      providerName: emailProvider === 'smtp' ? 'SMTP Gateway' : 'Resend Email API',
      variables: {
        RESEND_API_KEY: hasResendKey,
        EMAIL_FROM: hasEmailFrom,
        SMTP_HOST: hasSmtpHost,
        SMTP_USER: hasSmtpUser,
        SMTP_PASS: hasSmtpPass,
      },
      missingCredentials: missingEmailCredentials,
    },
  };
}

/**
 * Pretty-prints startup diagnostic information to server console.
 * Strictly redacts any sensitive tokens.
 */
export function printStartupGatewayDiagnostic(): void {
  const msg91Diag = getMsg91Diagnostic();
  const diag = getGatewayDiagnostics();
  console.log('================================================================================');
  console.log('GRIHA SAATHI — SERVER-SIDE MSG91 & GATEWAY DIAGNOSTIC');
  console.log('================================================================================');
  console.log(`Backend working directory     : ${msg91Diag.backend_working_directory}`);
  console.log(`Loaded environment file path  : ${msg91Diag.loaded_environment_file_path}`);
  console.log(`MSG91_AUTH_KEY configured     : ${msg91Diag.MSG91_AUTH_KEY_configured}`);
  console.log(`MSG91_TEMPLATE_ID configured  : ${msg91Diag.MSG91_TEMPLATE_ID_configured}`);
  if (diag.envFile.loadedFiles.length > 1) {
    console.log(`Scanned .env files            : ${diag.envFile.loadedFiles.join(', ')}`);
  }
  console.log('--------------------------------------------------------------------------------');
  console.log(`SMS Gateway Status            : ${diag.sms.configured ? 'CONFIGURED & READY' : 'UNCONFIGURED (SMS OTP disabled)'}`);
  if (!diag.sms.configured && diag.sms.missingCredentials.length > 0) {
    console.log(`Action Required               : Set ${diag.sms.missingCredentials.join(' and ')} in ${msg91Diag.loaded_environment_file_path}`);
  }
  console.log('--------------------------------------------------------------------------------');
  console.log(`Email Gateway Status          : ${diag.email.configured ? 'CONFIGURED & READY' : 'UNCONFIGURED (Email OTP disabled)'}`);
  console.log('================================================================================');
}
