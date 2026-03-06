import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();

  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [done, setDone]         = useState(false); // show "check email" screen

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Please enter a username.'); return; }
    if (!email.trim())    { setError('Please enter your email.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      await signup(username.trim(), email.trim(), password);
      setDone(true); // signup OK — show verify-email notice
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── "Check your email" confirmation screen ──
  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-visual">
          <div className="auth-visual-orb auth-visual-orb1" />
          <div className="auth-visual-orb auth-visual-orb2" />
          <div className="auth-visual-content">
            <Link to="/" className="auth-visual-logo">
              <span style={{ color: 'var(--clr-primary-light)' }}>✦</span> Chef Guru
            </Link>
            <h2 className="auth-visual-tagline">Almost there,<br /><em>check your inbox.</em></h2>
            <p className="auth-visual-sub">
              We sent a verification link to your email. Click it to activate your account, then sign in.
            </p>
          </div>
        </div>

        <div className="auth-form-panel">
          <div className="auth-form-inner">
            <Link to="/" className="auth-mobile-logo">
              <span style={{ color: 'var(--clr-primary)' }}>✦</span> Chef Guru
            </Link>

            <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--clr-primary),var(--clr-primary-dark))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', margin: '0 auto var(--sp-4)',
                boxShadow: 'var(--shadow-accent)'
              }}>
                ✉
              </div>
              <h1 style={{
                fontFamily: 'var(--font-display)', fontSize: '1.8rem',
                fontWeight: 700, color: 'var(--clr-dark)',
                letterSpacing: '-0.03em', marginBottom: 'var(--sp-2)'
              }}>
                Verify your email
              </h1>
              <p style={{ color: 'var(--clr-mid)', fontSize: 'var(--fs-sm)', lineHeight: 1.7, marginBottom: 'var(--sp-5)' }}>
                We sent a link to <strong style={{ color: 'var(--clr-dark)' }}>{email}</strong>.
                Click the link in the email to activate your account.
              </p>

              <div style={{
                background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)',
                textAlign: 'left', marginBottom: 'var(--sp-4)'
              }}>
                {[
                  { icon: '1', text: 'Open your email inbox' },
                  { icon: '2', text: 'Find the email from Chef Guru' },
                  { icon: '3', text: 'Click the verification link' },
                  { icon: '4', text: 'Come back here and sign in' },
                ].map(s => (
                  <div key={s.icon} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
                    padding: 'var(--sp-2) 0',
                    borderBottom: s.icon !== '4' ? '1px solid var(--clr-border)' : 'none'
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'linear-gradient(135deg,var(--clr-primary),var(--clr-primary-dark))',
                      color: '#fff', fontSize: '12px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>{s.icon}</span>
                    <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-mid)' }}>{s.text}</span>
                  </div>
                ))}
              </div>

              <Link to="/login" className="btn-auth-submit" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                Go to Sign In →
              </Link>

              <p style={{ marginTop: 'var(--sp-3)', fontSize: 'var(--fs-xs)', color: 'var(--clr-light)' }}>
                Wrong email?{' '}
                <button
                  onClick={() => { setDone(false); setEmail(''); setPassword(''); setUsername(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}
                >
                  Start over
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal signup form ──
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-orb auth-visual-orb1" />
        <div className="auth-visual-orb auth-visual-orb2" />
        <div className="auth-visual-content">
          <Link to="/" className="auth-visual-logo">
            <span style={{ color: 'var(--clr-primary-light)' }}>✦</span> Chef Guru
          </Link>
          <h2 className="auth-visual-tagline">Your kitchen,<br /><em>reimagined.</em></h2>
          <p className="auth-visual-sub">
            Create your free account and start generating restaurant-quality recipes from whatever is in your fridge.
          </p>
          <div className="auth-visual-features">
            {[
              { icon: '✦', text: 'Free to use, always' },
              { icon: '🍳', text: 'Unlimited recipe generation' },
              { icon: '♥', text: 'Save and revisit your favourites' },
            ].map(f => (
              <div key={f.text} className="auth-visual-feature">
                <div className="auth-visual-feature-icon">{f.icon}</div>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <Link to="/" className="auth-mobile-logo">
            <span style={{ color: 'var(--clr-primary)' }}>✦</span> Chef Guru
          </Link>

          <div className="auth-form-header">
            <h1>Create your account</h1>
            <p>Already have an account? <Link to="/login">Sign in →</Link></p>
          </div>

          {error && (
            <div className="auth-error" role="alert"><span>⚠</span> {error}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="username">Username</label>
              <input
                id="username" type="text"
                className={`auth-field-input${error ? ' error' : ''}`}
                placeholder="gordon_ramsay"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required autoComplete="username"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="email">Email address</label>
              <input
                id="email" type="email"
                className={`auth-field-input${error ? ' error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="password">Password</label>
              <input
                id="password" type="password"
                className={`auth-field-input${error ? ' error' : ''}`}
                placeholder="Min. 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading ? <><div className="spinner" /> Creating account…</> : <>Create Account →</>}
            </button>
          </form>

          <p className="auth-terms" style={{ marginTop: 'var(--sp-4)' }}>
            By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>. No spam, ever.
          </p>
        </div>
      </div>
    </div>
  );
}
