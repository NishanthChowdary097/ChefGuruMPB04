import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Show message if redirected from password reset or expired link
  const urlError = searchParams.get('error');
  const urlMessages = {
    invalid:  'That reset link is invalid.',
    used:     'That reset link has already been used.',
    expired:  'That reset link has expired. Please request a new one.',
    server:   'Something went wrong. Please try again.',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim())  { setError('Please enter your email address.'); return; }
    if (!password)      { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-visual">
        <div className="auth-visual-orb auth-visual-orb1" />
        <div className="auth-visual-orb auth-visual-orb2" />
        <div className="auth-visual-content">
          <Link to="/" className="auth-visual-logo">
            <span style={{ color: 'var(--clr-primary-light)' }}>✦</span> ChefGuru
          </Link>
          <h2 className="auth-visual-tagline">Cook magic with<br /><em>what you have.</em></h2>
          <p className="auth-visual-sub">
            AI-powered recipes from your fridge ingredients. Zero waste. Maximum flavour.
          </p>
          <div className="auth-visual-features">
            {[
              { icon: '🧠', text: 'GPU-accelerated recipe AI' },
              { icon: '🔬', text: 'Step-by-step culinary science' },
              { icon: '⚡', text: 'Instant results from any ingredients' },
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
            <span style={{ color: 'var(--clr-primary)' }}>✦</span> ChefGuru
          </Link>

          <div className="auth-form-header">
            <h1>Welcome back</h1>
            <p>No account? <Link to="/signup">Sign up free</Link></p>
          </div>

          {/* URL-based error from password reset redirect */}
          {urlError && !error && (
            <div className="auth-error" role="alert">
              <span>⚠</span> {urlMessages[urlError] || 'Something went wrong.'}
            </div>
          )}

          {error && (
            <div className="auth-error" role="alert">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-field-label" htmlFor="email">Email address</label>
              <input
                id="email" type="email"
                className={`auth-field-input${error ? ' error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required autoComplete="email" autoCapitalize="none"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field-label" htmlFor="password" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                <Link to="/forgot-password" style={{ fontWeight: 400, fontSize: 'var(--fs-xs)', color: 'var(--clr-primary)', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </label>
              <input
                id="password" type="password"
                className={`auth-field-input${error ? ' error' : ''}`}
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-auth-submit" disabled={loading}>
              {loading
                ? <><div className="spinner" /> Signing in…</>
                : <>Sign in</>}
            </button>
          </form>

          <p className="auth-terms" style={{ marginTop: 'var(--sp-4)' }}>
            By continuing you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
