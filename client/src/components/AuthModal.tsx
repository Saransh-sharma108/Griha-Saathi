import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  ArrowRight,
  KeyRound,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { SupportedLanguage, UserProfile, UserRole } from '@shared/types';
import { translations } from '@shared/i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, token: string) => void;
  language: SupportedLanguage;
}

type AuthMode = 
  | 'login_pin' 
  | 'register_request_otp' 
  | 'register_verify_otp' 
  | 'register_set_pin'
  | 'forgot_pin_request'
  | 'forgot_pin_verify'
  | 'forgot_pin_reset';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  language,
}) => {
  const [mode, setMode] = useState<AuthMode>('login_pin');
  const [identifierType, setIdentifierType] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['tenant']);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [unconfiguredDetails, setUnconfiguredDetails] = useState<{
    warning: string;
    instructions: string;
    requiredCredentials: string[];
  } | null>(null);

  // Resend Cooldown Countdown (60 seconds)
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldownSeconds > 0) {
      timer = setTimeout(() => setCooldownSeconds((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  if (!isOpen) return null;

  const t = translations[language].auth;

  const resetForm = () => {
    setErrorMessage(null);
    setStatusNotice(null);
    setUnconfiguredDetails(null);
    setOtp('');
    setPin('');
    setConfirmPin('');
  };

  const handleRoleToggle = (role: UserRole) => {
    if (selectedRoles.includes(role)) {
      if (selectedRoles.length > 1) {
        setSelectedRoles(selectedRoles.filter((r) => r !== role));
      }
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // 1. Request OTP for Registration
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);
    setUnconfiguredDetails(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, type: 'registration' }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.providerStatus === 'unconfigured') {
          setUnconfiguredDetails({
            warning: data.warning || 'External carrier/email gateway credentials not configured.',
            instructions: data.instructions || 'Set provider credentials in server .env to enable real delivery.',
            requiredCredentials: data.requiredCredentials || [],
          });
          setErrorMessage(data.error);
        } else {
          setErrorMessage(data.error || 'Failed to dispatch verification OTP.');
        }
        return;
      }

      setStatusNotice(data.message || `Verification code sent to ${data.maskedRecipient}.`);
      setCooldownSeconds(data.cooldownSeconds || 60);
      setMode('register_verify_otp');
    } catch (err) {
      setErrorMessage('Could not connect to authentication server. Please check backend status.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Registration OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid OTP code.');
        return;
      }

      setVerificationToken(data.verificationToken);
      setMode('register_set_pin');
      setStatusNotice('Contact verified! Now establish your 4-digit security PIN.');
    } catch (err) {
      setErrorMessage('Connection error during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Set 4-Digit Security PIN & Complete Account
  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('PIN must be exactly 4 numeric digits.');
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage('PIN confirmation does not match the entered PIN.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          verificationToken,
          pin,
          confirmPin,
          roles: selectedRoles,
          fullName: fullName.trim() || undefined,
          preferredLanguage: language,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to establish security PIN.');
        return;
      }

      onAuthSuccess(data.user, data.sessionToken);
      onClose();
    } catch (err) {
      setErrorMessage('Connection error setting PIN.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Authenticate with 4-Digit PIN
  const handleLoginPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, pin }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid credentials or PIN.');
        return;
      }

      onAuthSuccess(data.user, data.sessionToken);
      onClose();
    } catch (err) {
      setErrorMessage('Connection error during login.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Forgot PIN: Request Recovery OTP
  const handleForgotPinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);
    setUnconfiguredDetails(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.providerStatus === 'unconfigured') {
          setUnconfiguredDetails({
            warning: data.warning || 'External provider unconfigured in .env.',
            instructions: data.instructions || 'Set provider credentials to send real recovery OTP.',
            requiredCredentials: data.requiredCredentials || [],
          });
          setErrorMessage(data.error);
        } else {
          setErrorMessage(data.error || 'Failed to initiate PIN recovery.');
        }
        return;
      }

      setStatusNotice(data.message || `Recovery verification code sent to ${data.maskedRecipient}.`);
      setCooldownSeconds(data.cooldownSeconds || 60);
      setMode('forgot_pin_verify');
    } catch (err) {
      setErrorMessage('Connection error requesting recovery code.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Verify Forgot PIN OTP
  const handleForgotPinVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, otp }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid OTP code.');
        return;
      }

      setVerificationToken(data.verificationToken);
      setMode('forgot_pin_reset');
      setStatusNotice('Verification confirmed. Please establish your new 4-digit PIN.');
    } catch (err) {
      setErrorMessage('Connection error during recovery OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset PIN & Authenticate
  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!/^\d{4}$/.test(pin)) {
      setErrorMessage('Security PIN must be exactly 4 numeric digits.');
      return;
    }

    if (pin !== confirmPin) {
      setErrorMessage('PIN confirmation does not match the entered PIN.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          verificationToken,
          newPin: pin,
          confirmPin,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to reset PIN.');
        return;
      }

      onAuthSuccess(data.user, data.sessionToken);
      onClose();
    } catch (err) {
      setErrorMessage('Connection error resetting PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gs-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="gs-modal-content" style={{ maxWidth: 480 }}>
        <button onClick={onClose} className="gs-modal-close" aria-label="Close dialog">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: 52,
              height: 52,
              backgroundColor: 'var(--gs-forest-soft)',
              color: 'var(--gs-forest-primary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            {mode.startsWith('forgot') ? (
              <KeyRound size={28} />
            ) : mode.startsWith('register') ? (
              <UserCheck size={28} />
            ) : (
              <ShieldCheck size={28} />
            )}
          </div>
          <h2 id="auth-modal-title" style={{ fontSize: '1.45rem', color: 'var(--gs-forest-deep)' }}>
            {mode === 'login_pin' && t.modalTitleLogin}
            {mode.startsWith('register') && t.modalTitleRegister}
            {mode.startsWith('forgot') && t.resetPinTitle}
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-muted)', marginTop: '0.25rem' }}>
            {mode === 'login_pin' && 'Sign in using your verified contact & 4-digit PIN'}
            {mode === 'register_request_otp' && 'Genuine contact verification for Northern Bharat regions'}
            {mode === 'register_verify_otp' && 'Enter single-use code received on your contact'}
            {mode === 'register_set_pin' && 'Create your secret 4-digit numeric PIN'}
            {mode === 'forgot_pin_request' && 'Enter your registered contact to receive a recovery code'}
            {mode === 'forgot_pin_verify' && 'Enter recovery OTP sent to your verified contact'}
            {mode === 'forgot_pin_reset' && 'Create a new 4-digit PIN for your account'}
          </p>
        </div>

        {/* Status Alert */}
        {statusNotice && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--gs-forest-soft)',
              border: '1px solid var(--gs-forest-light)',
              borderRadius: 'var(--gs-radius-md)',
              fontSize: '0.84rem',
              color: 'var(--gs-forest-deep)',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle2 size={18} color="var(--gs-status-success)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--gs-status-error-soft)',
              border: '1px solid #FECACA',
              borderRadius: 'var(--gs-radius-md)',
              fontSize: '0.84rem',
              color: 'var(--gs-status-error)',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600 }}>{errorMessage}</div>
              {unconfiguredDetails && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--gs-text-secondary)', lineHeight: 1.4 }}>
                  <p>{unconfiguredDetails.instructions}</p>
                  <p style={{ marginTop: '0.25rem', fontFamily: 'var(--gs-font-mono)', color: 'var(--gs-forest-primary)' }}>
                    Keys: {unconfiguredDetails.requiredCredentials.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FLOW 1: Login with 4-Digit PIN */}
        {mode === 'login_pin' && (
          <form onSubmit={handleLoginPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label">{t.identifierLabel}</label>
              <input
                type="text"
                placeholder={t.identifierPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="gs-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="gs-form-label">{t.pinLabel}</label>
                <button
                  type="button"
                  onClick={() => { resetForm(); setMode('forgot_pin_request'); }}
                  style={{ fontSize: '0.78rem', color: 'var(--gs-forest-primary)', fontWeight: 600 }}
                >
                  {t.forgotPin}
                </button>
              </div>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                required
                style={{ letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
              />
            </div>

            <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Authenticating...' : t.loginWithPin}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.86rem' }}>
              <span style={{ color: 'var(--gs-text-muted)' }}>Don't have an account? </span>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('register_request_otp'); }}
                style={{ color: 'var(--gs-forest-primary)', fontWeight: 700 }}
              >
                Register with Real OTP
              </button>
            </div>
          </form>
        )}

        {/* FLOW 2: Register - Step 1: Contact Identifier & Role Selection */}
        {mode === 'register_request_otp' && (
          <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Phone or Email Switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--gs-bg-subtle)', padding: '0.25rem', borderRadius: 'var(--gs-radius-md)' }}>
              <button
                type="button"
                onClick={() => { setIdentifierType('phone'); setIdentifier(''); }}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  borderRadius: 'var(--gs-radius-sm)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: identifierType === 'phone' ? 'var(--gs-bg-card)' : 'transparent',
                  color: identifierType === 'phone' ? 'var(--gs-forest-primary)' : 'var(--gs-text-muted)',
                  boxShadow: identifierType === 'phone' ? 'var(--gs-shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Smartphone size={15} />
                <span>Mobile Phone</span>
              </button>
              <button
                type="button"
                onClick={() => { setIdentifierType('email'); setIdentifier(''); }}
                style={{
                  flex: 1,
                  padding: '0.45rem',
                  borderRadius: 'var(--gs-radius-sm)',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: identifierType === 'email' ? 'var(--gs-bg-card)' : 'transparent',
                  color: identifierType === 'email' ? 'var(--gs-forest-primary)' : 'var(--gs-text-muted)',
                  boxShadow: identifierType === 'email' ? 'var(--gs-shadow-xs)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                }}
              >
                <Mail size={15} />
                <span>Email Address</span>
              </button>
            </div>

            <div className="gs-form-field">
              <label className="gs-form-label">
                {identifierType === 'phone' ? 'Indian 10-Digit Mobile Number' : 'Email Address'}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {identifierType === 'phone' && (
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--gs-bg-subtle)', borderRadius: 'var(--gs-radius-md)', fontWeight: 600, color: 'var(--gs-forest-deep)', fontSize: '0.9rem', border: '1px solid var(--gs-border)' }}>
                    +91
                  </div>
                )}
                <input
                  type={identifierType === 'phone' ? 'tel' : 'email'}
                  placeholder={identifierType === 'phone' ? '9876543210' : 'yourname@example.com'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
                  style={{ flex: 1 }}
                />
              </div>
              <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>
                Target regions: Delhi, Haryana, Punjab, Himachal Pradesh, Jammu & Kashmir.
              </span>
            </div>

            {/* Multi-Role Account Checkboxes */}
            <div className="gs-form-field">
              <label className="gs-form-label">{t.chooseRoleTitle}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.2rem' }}>
                {[
                  { id: 'tenant', label: t.roleTenant },
                  { id: 'owner', label: t.roleOwner },
                  { id: 'agent', label: t.roleAgent },
                  { id: 'builder', label: t.roleBuilder },
                  { id: 'property_manager', label: t.roleManager },
                ].map((roleItem) => {
                  const isChecked = selectedRoles.includes(roleItem.id as UserRole);
                  return (
                    <label
                      key={roleItem.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--gs-radius-sm)',
                        backgroundColor: isChecked ? 'var(--gs-forest-soft)' : 'var(--gs-bg-card)',
                        border: `1px solid ${isChecked ? 'var(--gs-forest-light)' : 'var(--gs-border)'}`,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleRoleToggle(roleItem.id as UserRole)}
                      />
                      <span style={{ fontWeight: isChecked ? 600 : 400, color: 'var(--gs-text-primary)' }}>
                        {roleItem.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Requesting Live OTP...' : t.requestOtp}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.86rem' }}>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('login_pin'); }}
                style={{ color: 'var(--gs-forest-primary)', fontWeight: 600 }}
              >
                Already registered? Sign in with PIN
              </button>
            </div>
          </form>
        )}

        {/* FLOW 3: Register - Step 2: Verify OTP */}
        {mode === 'register_verify_otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="gs-form-label">{t.otpLabel}</label>
                <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                  Expires in 5 minutes
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                placeholder="6 digits"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{ letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
              />
            </div>

            <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Verifying OTP...' : t.verifyOtp}
            </button>

            {/* Resend Cooldown Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('register_request_otp'); }}
                style={{ color: 'var(--gs-text-muted)' }}
              >
                Edit Contact
              </button>

              {cooldownSeconds > 0 ? (
                <span style={{ color: 'var(--gs-text-muted)' }}>
                  {t.resendIn} {cooldownSeconds}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  style={{ color: 'var(--gs-forest-primary)', fontWeight: 600 }}
                >
                  {t.resendOtp}
                </button>
              )}
            </div>
          </form>
        )}

        {/* FLOW 4: Register - Step 3: Set 4-Digit Security PIN */}
        {mode === 'register_set_pin' && (
          <form onSubmit={handleSetPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label">{t.fullNameLabel}</label>
              <input
                type="text"
                placeholder={t.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>
                Per our Data Integrity rules, we never invent names. This will remain empty unless you provide it.
              </span>
            </div>

            <div className="gs-form-field">
              <label className="gs-form-label">{t.pinLabel}</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                required
                style={{ letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>
                You will use this 4-digit PIN for future quick logins. Hashed via bcrypt; never stored in plaintext.
              </span>
            </div>

            <div className="gs-form-field">
              <label className="gs-form-label">{t.confirmPinLabel}</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                required
                style={{ letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
              />
            </div>

            <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Creating Verified Account...' : 'Complete Registration & Sign In'}
            </button>
          </form>
        )}

        {/* FLOW 5: Forgot PIN - Step 1: Request Recovery OTP */}
        {mode === 'forgot_pin_request' && (
          <form onSubmit={handleForgotPinRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label">{t.identifierLabel}</label>
              <input
                type="text"
                placeholder={t.identifierPlaceholder}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>
                We will dispatch a real single-use verification code to this verified channel.
              </span>
            </div>

            <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Sending Recovery Code...' : 'Send Recovery OTP'}
            </button>

            <button
              type="button"
              onClick={() => { resetForm(); setMode('login_pin'); }}
              style={{ fontSize: '0.86rem', color: 'var(--gs-forest-primary)', textAlign: 'center' }}
            >
              Remember your PIN? Sign In
            </button>
          </form>
        )}

        {/* FLOW 6: Forgot PIN - Step 2: Verify Recovery OTP */}
        {mode === 'forgot_pin_verify' && (
          <form onSubmit={handleForgotPinVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label">{t.otpLabel}</label>
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit recovery code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{ letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
              />
            </div>

            <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Verifying Code...' : 'Verify Recovery Code'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('forgot_pin_request'); }}
                style={{ color: 'var(--gs-text-muted)' }}
              >
                Change Contact
              </button>

              {cooldownSeconds > 0 ? (
                <span style={{ color: 'var(--gs-text-muted)' }}>
                  {t.resendIn} {cooldownSeconds}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPinRequest}
                  disabled={loading}
                  style={{ color: 'var(--gs-forest-primary)', fontWeight: 600 }}
                >
                  {t.resendOtp}
                </button>
              )}
            </div>
          </form>
        )}

        {/* FLOW 7: Forgot PIN - Step 3: Establish New 4-Digit PIN */}
        {mode === 'forgot_pin_reset' && (
          <form onSubmit={handleResetPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label">Create New 4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{ letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
              />
              <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)' }}>
                Your previous PIN will be permanently invalidated across all devices.
              </span>
            </div>

            <div className="gs-form-field">
              <label className="gs-form-label">{t.confirmPinLabel}</label>
              <input
                type="password"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                required
                style={{ letterSpacing: '0.35em', textAlign: 'center', fontSize: '1.4rem', fontWeight: 700 }}
              />
            </div>

            <button type="submit" disabled={loading} className="gs-btn gs-btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Updating Security PIN...' : t.resetPinButton}
            </button>
          </form>
        )}

        {/* Security & DPDP Compliance Footer */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid var(--gs-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            fontSize: '0.76rem',
            color: 'var(--gs-text-muted)',
            textAlign: 'center',
          }}
        >
          <Lock size={13} color="var(--gs-forest-mid)" />
          <span>{t.securityBadge}</span>
        </div>
      </div>
    </div>
  );
};
