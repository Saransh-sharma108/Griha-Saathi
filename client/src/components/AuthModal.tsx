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
  ShieldAlert,
  Eye,
  EyeOff,
  Radio,
  FileCheck2
} from 'lucide-react';
import { SupportedLanguage, UserProfile, UserRole } from '@shared/types';
import { translations } from '@shared/i18n';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, token: string) => void;
  language: SupportedLanguage;
}

export type AuthMode = 
  | 'login_pin' 
  | 'register' 
  | 'register_verify_otp' 
  | 'register_create_pin'
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
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  
  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpChannel, setOtpChannel] = useState<'sms' | 'email'>('sms');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['tenant']);
  
  // OTP Verification State
  const [otp, setOtp] = useState('');
  const [activeDestination, setActiveDestination] = useState('');
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  
  // PIN State
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  // Forgot PIN State
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  // UI Feedback States
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

  // Live Gateway Diagnostic Status
  const [gatewayStatus, setGatewayStatus] = useState<{
    smsConfigured: boolean;
    emailConfigured: boolean;
    loaded: boolean;
  }>({ smsConfigured: false, emailConfigured: false, loaded: false });

  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;
    fetch('/api/auth/diagnostic/providers')
      .then((res) => res.json())
      .then((data) => {
        if (!isSubscribed) return;
        if (data && data.success) {
          const smsReady = Boolean(data.smsGateway?.configured);
          const emailReady = Boolean(data.emailGateway?.configured);
          setGatewayStatus({ smsConfigured: smsReady, emailConfigured: emailReady, loaded: true });
          if (emailReady && !smsReady) {
            setOtpChannel('email');
          } else if (smsReady && !emailReady) {
            setOtpChannel('sms');
          }
        }
      })
      .catch(() => {});
    return () => { isSubscribed = false; };
  }, [isOpen]);

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
    setShowPin(false);
    setShowConfirmPin(false);
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

  // 1. Submit Registration Form -> Dispatches Real OTP
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusNotice(null);
    setUnconfiguredDetails(null);

    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms of Service and Privacy Policy to register.');
      return;
    }

    const cleanPhone = registeredPhone.replace(/\D/g, '');
    const cleanEmail = registeredEmail.trim();

    if (!cleanPhone && !cleanEmail) {
      setErrorMessage('Please enter at least one contact method: Indian mobile number or email address.');
      return;
    }

    if (otpChannel === 'sms' && cleanPhone.length < 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number for SMS OTP delivery.');
      return;
    }

    if (otpChannel === 'email' && (!cleanEmail || !cleanEmail.includes('@'))) {
      setErrorMessage('A valid email address is required when selecting Email as your OTP delivery channel.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: cleanPhone || undefined,
          email: cleanEmail || undefined,
          otpChannel,
          termsAccepted: true,
          roles: selectedRoles,
          preferredLanguage: language,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.providerAccepted) {
        if (data.providerStatus === 'unconfigured') {
          setUnconfiguredDetails({
            warning: data.warning || 'External carrier/email gateway credentials not configured.',
            instructions: data.instructions || 'Set provider credentials in server .env to enable real delivery.',
            requiredCredentials: data.requiredCredentials || [],
          });
          setErrorMessage(data.error);
        } else {
          setErrorMessage(data.error || 'Failed to dispatch registration verification code.');
        }
        return;
      }

      setActiveDestination(data.destinationContact || (otpChannel === 'email' ? registeredEmail : registeredPhone));
      setStatusNotice(data.message || `Verification code request accepted by upstream gateway.`);
      setCooldownSeconds(data.cooldownSeconds || 60);
      setMode('register_verify_otp');
    } catch (err) {
      setErrorMessage('Could not connect to authentication server. Please check backend status.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Resend Registration OTP
  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || !activeDestination) return;
    setErrorMessage(null);
    setStatusNotice(null);
    setUnconfiguredDetails(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: activeDestination,
          type: mode.startsWith('forgot') ? 'recovery' : 'registration',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.providerAccepted) {
        if (data.providerStatus === 'unconfigured') {
          setUnconfiguredDetails({
            warning: data.warning || 'Provider unconfigured.',
            instructions: data.instructions || 'Set provider credentials in server .env.',
            requiredCredentials: data.requiredCredentials || [],
          });
        }
        setErrorMessage(data.error || 'Failed to resend code.');
        return;
      }

      setStatusNotice(data.message || `New verification code request accepted by upstream gateway.`);
      setCooldownSeconds(data.cooldownSeconds || 60);
    } catch (err) {
      setErrorMessage('Connection error while requesting resend.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Registration OTP
  const handleVerifyRegistrationOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: activeDestination,
          otp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid OTP code.');
        return;
      }

      setVerificationToken(data.verificationToken);
      setMode('register_create_pin');
      setStatusNotice('Contact verified! Now create your 4-digit security PIN to finish account registration.');
    } catch (err) {
      setErrorMessage('Connection error during OTP verification.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Create 4-Digit Security PIN & Complete Account Setup
  const handleCreatePin = async (e: React.FormEvent) => {
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

    if (!verificationToken) {
      setErrorMessage('Verification token missing. Please verify your contact again.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/create-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: activeDestination,
          verificationToken,
          pin,
          confirmPin,
          fullName: fullName.trim() || undefined,
          roles: selectedRoles,
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
      setErrorMessage('Connection error setting security PIN.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Authenticate with 4-Digit PIN
  const handleLoginPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier.trim(),
          pin,
        }),
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

  // 6. Forgot PIN: Request Recovery OTP
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
        body: JSON.stringify({ identifier: forgotIdentifier.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.providerAccepted) {
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

      setActiveDestination(data.destinationContact || forgotIdentifier.trim());
      setStatusNotice(data.message || `Recovery verification code request accepted by upstream gateway.`);
      setCooldownSeconds(data.cooldownSeconds || 60);
      setMode('forgot_pin_verify');
    } catch (err) {
      setErrorMessage('Connection error requesting recovery code.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Verify Forgot PIN OTP
  const handleForgotPinVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: activeDestination,
          otp,
        }),
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

  // 8. Reset PIN & Authenticate
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
          identifier: activeDestination,
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
      <div 
        className="gs-modal-content" 
        style={{ 
          maxWidth: mode === 'register' ? 520 : 460,
          background: 'linear-gradient(180deg, #071912 0%, #04100B 100%)',
          border: '1px solid rgba(52, 211, 153, 0.22)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.75), 0 0 35px rgba(16, 185, 129, 0.12)',
          borderRadius: 18,
          padding: '2rem 1.75rem',
          color: '#E6EFE9',
        }}
      >
        <button 
          onClick={onClose} 
          className="gs-modal-close" 
          aria-label="Close dialog"
          style={{
            color: '#9CA3AF',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          <div
            style={{
              width: 50,
              height: 50,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              color: '#34D399',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              boxShadow: '0 0 20px rgba(52, 211, 153, 0.2)',
            }}
          >
            {mode.startsWith('forgot') ? (
              <KeyRound size={26} />
            ) : mode.startsWith('register') ? (
              <UserCheck size={26} />
            ) : (
              <ShieldCheck size={26} />
            )}
          </div>
          <h2 id="auth-modal-title" style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
            {mode === 'login_pin' && t.modalTitleLogin}
            {mode === 'register' && t.modalTitleRegister}
            {mode === 'register_verify_otp' && 'Verify 6-Digit Code'}
            {mode === 'register_create_pin' && 'Create Security PIN'}
            {mode === 'forgot_pin_request' && t.resetPinTitle}
            {mode === 'forgot_pin_verify' && 'Verify Recovery Code'}
            {mode === 'forgot_pin_reset' && 'Reset 4-Digit PIN'}
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#9CA3AF', marginTop: '0.35rem', lineHeight: 1.4 }}>
            {mode === 'login_pin' && 'Sign in using your registered mobile or email and 4-digit PIN.'}
            {mode === 'register' && 'Enter your details below to receive a genuine verification code.'}
            {mode === 'register_verify_otp' && `Enter the 6-digit code sent to ${activeDestination}.`}
            {mode === 'register_create_pin' && 'Establish your personal 4-digit PIN for future quick sign-ins.'}
            {mode === 'forgot_pin_request' && 'Enter your registered mobile or email to receive a recovery code.'}
            {mode === 'forgot_pin_verify' && `Enter the recovery code sent to ${activeDestination}.`}
            {mode === 'forgot_pin_reset' && 'Set a new 4-digit PIN. All previous sessions will be invalidated.'}
          </p>
        </div>

        {/* Status Notice */}
        {statusNotice && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              borderRadius: 10,
              fontSize: '0.82rem',
              color: '#A7F3D0',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
            }}
          >
            <CheckCircle2 size={18} color="#34D399" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 10,
              fontSize: '0.82rem',
              color: '#FCA5A5',
              marginBottom: '1.25rem',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#F87171' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{errorMessage}</div>
              {unconfiguredDetails && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.76rem', color: '#E2E8F0', lineHeight: 1.45 }}>
                  <p>{unconfiguredDetails.instructions}</p>
                  <p style={{ marginTop: '0.25rem', fontFamily: 'monospace', color: '#6EE7B7' }}>
                    Required in .env: {unconfiguredDetails.requiredCredentials.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 1: LOGIN WITH 4-DIGIT PIN
            ========================================================================= */}
        {mode === 'login_pin' && (
          <form onSubmit={handleLoginPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600 }}>
                {t.identifierLabel}
              </label>
              <input
                type="text"
                placeholder={t.identifierPlaceholder}
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
                autoFocus
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  color: '#FFFFFF',
                  padding: '0.7rem 0.9rem',
                  fontSize: '0.92rem',
                }}
              />
            </div>

            <div className="gs-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600, margin: 0 }}>
                  {t.pinLabel}
                </label>
                <button
                  type="button"
                  onClick={() => { resetForm(); setMode('forgot_pin_request'); }}
                  style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Forgot PIN? Recover via OTP
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{
                    letterSpacing: '0.4em',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    color: '#FFFFFF',
                    padding: '0.65rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || pin.length !== 4} 
              className="gs-btn gs-btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontWeight: 700, 
                borderRadius: 10, 
                fontSize: '0.94rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {loading ? 'Authenticating...' : 'Authenticate with PIN'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.84rem' }}>
              <span style={{ color: '#9CA3AF' }}>New to Griha Saathi? </span>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('register'); }}
                style={{ color: '#34D399', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Register with Real OTP
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            SCREEN 2: COMPLETE REGISTRATION FORM
            ========================================================================= */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Full Name */}
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.82rem', fontWeight: 600 }}>
                Full Name <span style={{ color: '#34D399' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoFocus
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  color: '#FFFFFF',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Registered Mobile Number */}
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.82rem', fontWeight: 600 }}>
                Registered Mobile Number {otpChannel === 'sms' ? <span style={{ color: '#34D399' }}>*</span> : <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(Optional)</span>}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{
                  padding: '0.65rem 0.8rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  fontWeight: 700,
                  color: '#34D399',
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  +91
                </div>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={registeredPhone}
                  onChange={(e) => setRegisteredPhone(e.target.value.replace(/\D/g, ''))}
                  required={otpChannel === 'sms'}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    color: '#FFFFFF',
                    padding: '0.65rem 0.85rem',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Email Address (Optional, but recommended) */}
            <div className="gs-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.82rem', fontWeight: 600 }}>
                  Email Address {otpChannel === 'email' ? <span style={{ color: '#34D399' }}>*</span> : <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(Optional)</span>}
                </label>
              </div>
              <input
                type="email"
                placeholder="e.g. name@example.com"
                value={registeredEmail}
                onChange={(e) => setRegisteredEmail(e.target.value)}
                required={otpChannel === 'email'}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  color: '#FFFFFF',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* OTP Delivery Preference Selector */}
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.82rem', fontWeight: 600 }}>
                Deliver Verification OTP via:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.2rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setOtpChannel('sms');
                    setErrorMessage(null);
                    setUnconfiguredDetails(null);
                  }}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 10,
                    border: `1px solid ${otpChannel === 'sms' ? '#34D399' : 'rgba(255, 255, 255, 0.12)'}`,
                    backgroundColor: otpChannel === 'sms' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(0, 0, 0, 0.25)',
                    color: otpChannel === 'sms' ? '#FFFFFF' : '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: otpChannel === 'sms' ? 700 : 500,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Smartphone size={15} color={otpChannel === 'sms' ? '#34D399' : '#9CA3AF'} />
                    <span>Mobile SMS (+91)</span>
                  </span>
                  {gatewayStatus.loaded && (
                    <span style={{
                      fontSize: '0.66rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: 6,
                      backgroundColor: gatewayStatus.smsConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                      color: gatewayStatus.smsConfigured ? '#34D399' : '#FCA5A5',
                      fontWeight: 600,
                    }}>
                      {gatewayStatus.smsConfigured ? 'Ready' : 'Unconfigured'}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpChannel('email');
                    setErrorMessage(null);
                    setUnconfiguredDetails(null);
                  }}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: 10,
                    border: `1px solid ${otpChannel === 'email' ? '#34D399' : 'rgba(255, 255, 255, 0.12)'}`,
                    backgroundColor: otpChannel === 'email' ? 'rgba(16, 185, 129, 0.18)' : 'rgba(0, 0, 0, 0.25)',
                    color: otpChannel === 'email' ? '#FFFFFF' : '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: otpChannel === 'email' ? 700 : 500,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Mail size={15} color={otpChannel === 'email' ? '#34D399' : '#9CA3AF'} />
                    <span>Email Address</span>
                  </span>
                  {gatewayStatus.loaded && (
                    <span style={{
                      fontSize: '0.66rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: 6,
                      backgroundColor: gatewayStatus.emailConfigured ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                      color: gatewayStatus.emailConfigured ? '#34D399' : '#FCA5A5',
                      fontWeight: 600,
                    }}>
                      {gatewayStatus.emailConfigured ? 'Ready' : 'Unconfigured'}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Account Role Selection */}
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.82rem', fontWeight: 600 }}>
                Primary Account Purpose:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.2rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.7rem',
                  borderRadius: 10,
                  backgroundColor: selectedRoles.includes('tenant') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                  border: `1px solid ${selectedRoles.includes('tenant') ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  fontSize: '0.8rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes('tenant')}
                    onChange={() => handleRoleToggle('tenant')}
                  />
                  <span>Tenant / Seeker</span>
                </label>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.7rem',
                  borderRadius: 10,
                  backgroundColor: selectedRoles.includes('owner') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 0, 0, 0.25)',
                  border: `1px solid ${selectedRoles.includes('owner') ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                  fontSize: '0.8rem',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}>
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes('owner')}
                    onChange={() => handleRoleToggle('owner')}
                  />
                  <span>Property Owner</span>
                </label>
              </div>
            </div>

            {/* Terms and Privacy Policy Acceptance */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              fontSize: '0.78rem',
              color: '#D1D5DB',
              cursor: 'pointer',
              lineHeight: 1.45,
              marginTop: '0.2rem',
            }}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                required
                style={{ marginTop: 2 }}
              />
              <span>
                I accept the Griha Saathi <strong style={{ color: '#34D399' }}>Terms of Service</strong> and <strong style={{ color: '#34D399' }}>Privacy Policy</strong>, including the Digital Personal Data Protection (DPDP) Act compliance guidelines.
              </span>
            </label>

            <button 
              type="submit" 
              disabled={loading || !termsAccepted || fullName.trim().length === 0 || (otpChannel === 'sms' ? registeredPhone.length < 10 : (!registeredEmail || !registeredEmail.includes('@')))} 
              className="gs-btn gs-btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontWeight: 700, 
                borderRadius: 10, 
                fontSize: '0.94rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {loading ? 'Dispatching Live OTP...' : 'Send Verification OTP'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.3rem', fontSize: '0.84rem' }}>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('login_pin'); }}
                style={{ color: '#34D399', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Already have an account? Sign In with PIN
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            SCREEN 3: VERIFY REGISTRATION OTP
            ========================================================================= */}
        {mode === 'register_verify_otp' && (
          <form onSubmit={handleVerifyRegistrationOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600, margin: 0 }}>
                  Enter 6-Digit OTP
                </label>
                <span style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                  Valid for 5 mins
                </span>
              </div>
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{
                  letterSpacing: '0.45em',
                  textAlign: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  color: '#FFFFFF',
                  padding: '0.65rem',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.length !== 6} 
              className="gs-btn gs-btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontWeight: 700, 
                borderRadius: 10, 
                fontSize: '0.94rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {loading ? 'Verifying OTP...' : 'Verify OTP & Continue'}
            </button>

            {/* Resend Cooldown Counter */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginTop: '0.2rem' }}>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('register'); }}
                style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Edit Information
              </button>

              {cooldownSeconds > 0 ? (
                <span style={{ color: '#9CA3AF' }}>
                  Resend code in {cooldownSeconds}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  style={{ color: '#34D399', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Resend Verification Code
                </button>
              )}
            </div>
          </form>
        )}

        {/* =========================================================================
            SCREEN 4: CREATE 4-DIGIT SECURITY PIN
            ========================================================================= */}
        {mode === 'register_create_pin' && (
          <form onSubmit={handleCreatePin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600 }}>
                Create Your 4-Digit Security PIN <span style={{ color: '#34D399' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  style={{
                    letterSpacing: '0.4em',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    color: '#FFFFFF',
                    padding: '0.65rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '0.25rem', display: 'block' }}>
                Must be exactly 4 numeric digits. Hashed with bcrypt; never stored in plaintext.
              </span>
            </div>

            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600 }}>
                Confirm Your 4-Digit Security PIN <span style={{ color: '#34D399' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPin ? 'text' : 'password'}
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{
                    letterSpacing: '0.4em',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    color: '#FFFFFF',
                    padding: '0.65rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  title={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showConfirmPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || pin.length !== 4 || confirmPin.length !== 4} 
              className="gs-btn gs-btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontWeight: 700, 
                borderRadius: 10, 
                fontSize: '0.94rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {loading ? 'Creating Verified Account...' : 'Complete Registration & Sign In'}
            </button>
          </form>
        )}

        {/* =========================================================================
            SCREEN 5: FORGOT PIN - REQUEST RECOVERY OTP
            ========================================================================= */}
        {mode === 'forgot_pin_request' && (
          <form onSubmit={handleForgotPinRequest} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600 }}>
                Registered Mobile Number or Email Address
              </label>
              <input
                type="text"
                placeholder="e.g. 9876543210 or yourname@example.com"
                value={forgotIdentifier}
                onChange={(e) => setForgotIdentifier(e.target.value)}
                required
                autoFocus
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  color: '#FFFFFF',
                  padding: '0.7rem 0.9rem',
                  fontSize: '0.92rem',
                }}
              />
              <span style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '0.25rem', display: 'block' }}>
                We will dispatch a secure single-use recovery code to your registered contact.
              </span>
            </div>

            <button 
              type="submit" 
              disabled={loading || !forgotIdentifier.trim()} 
              className="gs-btn gs-btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontWeight: 700, 
                borderRadius: 10, 
                fontSize: '0.94rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {loading ? 'Sending Recovery Code...' : 'Send Recovery OTP'}
            </button>

            <button
              type="button"
              onClick={() => { resetForm(); setMode('login_pin'); }}
              style={{ fontSize: '0.84rem', color: '#34D399', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}
            >
              Remember your PIN? Sign In
            </button>
          </form>
        )}

        {/* =========================================================================
            SCREEN 6: FORGOT PIN - VERIFY RECOVERY OTP
            ========================================================================= */}
        {mode === 'forgot_pin_verify' && (
          <form onSubmit={handleForgotPinVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600 }}>
                Enter 6-Digit Recovery Code
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
                style={{
                  letterSpacing: '0.45em',
                  textAlign: 'center',
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: 10,
                  color: '#FFFFFF',
                  padding: '0.65rem',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || otp.length !== 6} 
              className="gs-btn gs-btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontWeight: 700, 
                borderRadius: 10, 
                fontSize: '0.94rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {loading ? 'Verifying Code...' : 'Verify Recovery Code'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <button
                type="button"
                onClick={() => { resetForm(); setMode('forgot_pin_request'); }}
                style={{ color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Change Contact
              </button>

              {cooldownSeconds > 0 ? (
                <span style={{ color: '#9CA3AF' }}>
                  Resend in {cooldownSeconds}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPinRequest}
                  disabled={loading}
                  style={{ color: '#34D399', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Resend Recovery OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* =========================================================================
            SCREEN 7: RESET PIN & SIGN IN
            ========================================================================= */}
        {mode === 'forgot_pin_reset' && (
          <form onSubmit={handleResetPin} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600 }}>
                Create New 4-Digit Security PIN
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPin ? 'text' : 'password'}
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  style={{
                    letterSpacing: '0.4em',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    color: '#FFFFFF',
                    padding: '0.65rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  title={showPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#9CA3AF', marginTop: '0.25rem', display: 'block' }}>
                Your previous PIN will be permanently invalidated across all devices.
              </span>
            </div>

            <div className="gs-form-field">
              <label className="gs-form-label" style={{ color: '#D1D5DB', fontSize: '0.84rem', fontWeight: 600 }}>
                Confirm New 4-Digit Security PIN
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPin ? 'text' : 'password'}
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{
                    letterSpacing: '0.4em',
                    textAlign: 'center',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    color: '#FFFFFF',
                    padding: '0.65rem',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPin(!showConfirmPin)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9CA3AF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4,
                  }}
                  title={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                >
                  {showConfirmPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || pin.length !== 4 || confirmPin.length !== 4} 
              className="gs-btn gs-btn-primary" 
              style={{ 
                width: '100%', 
                padding: '0.8rem', 
                fontWeight: 700, 
                borderRadius: 10, 
                fontSize: '0.94rem',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              {loading ? 'Updating Security PIN...' : 'Reset PIN & Sign In'}
            </button>
          </form>
        )}

        {/* Security & DPDP Compliance Footer */}
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            fontSize: '0.74rem',
            color: '#9CA3AF',
            textAlign: 'center',
          }}
        >
          <Lock size={13} color="#34D399" />
          <span>Bcrypt PIN Hashing • Single-Use Cryptographic OTP • DPDP Compliant</span>
        </div>
      </div>
    </div>
  );
};
