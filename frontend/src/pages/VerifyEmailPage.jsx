import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE } from '../context/AuthContext';

// Handles: GET /api/auth/mail/verify/:userId/:token
export default function VerifyEmailPage() {
  const { userId, token } = useParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId || !token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    fetch(`${API_BASE}/mail/verify/${userId}/${token}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || data.error || 'Verification failed. The link may have expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not reach the server. Please try again.');
      });
  }, [userId, token]);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--clr-bg)', padding: '24px'
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--clr-surface)', borderRadius: 'var(--r-xl)',
        border: '1px solid var(--clr-border)', boxShadow: 'var(--shadow-lg)',
        padding: '48px 40px', textAlign: 'center'
      }}>

        {/* Logo */}
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.1rem',
          color: 'var(--clr-dark)', textDecoration: 'none', marginBottom: '32px'
        }}>
          <span style={{ color: 'var(--clr-primary)' }}>✦</span> ChefGuru
        </Link>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem',
          background: isLoading
            ? 'linear-gradient(135deg, #EAD9C9, #D4BFA8)'
            : isSuccess
              ? 'linear-gradient(135deg,var(--clr-primary),var(--clr-primary-dark))'
              : 'linear-gradient(135deg,#E0243D,#C0153A)',
          boxShadow: isLoading ? 'none'
            : isSuccess ? 'var(--shadow-accent)'
            : '0 8px 24px rgba(224,36,61,.35)',
          transition: 'all 0.4s ease',
        }}>
          {isLoading ? (
            <div className="spinner" style={{ borderColor: 'rgba(255,255,255,.3)', borderTopColor: '#fff' }} />
          ) : isSuccess ? '✓' : '✕'}
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.7rem',
          fontWeight: 700, color: 'var(--clr-dark)',
          letterSpacing: '-0.03em', marginBottom: '12px'
        }}>
          {isLoading ? 'Verifying your email…'
            : isSuccess ? 'Email verified!'
            : 'Verification failed'}
        </h1>

        {/* Message */}
        <p style={{
          fontSize: 'var(--fs-sm)', color: 'var(--clr-mid)',
          lineHeight: 1.7, marginBottom: '32px'
        }}>
          {isLoading
            ? 'Please wait while we confirm your email address.'
            : message}
        </p>

        {/* Actions */}
        {!isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isSuccess ? (
              <Link to="/login" className="btn-auth-submit" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                Sign in to your account →
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-auth-submit" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                  Try signing up again
                </Link>
                <Link to="/" style={{
                  fontSize: 'var(--fs-sm)', color: 'var(--clr-mid)',
                  textDecoration: 'none', textAlign: 'center'
                }}>
                  ← Back to home
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
