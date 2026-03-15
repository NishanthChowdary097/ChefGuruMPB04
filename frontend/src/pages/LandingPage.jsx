import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PREVIEW_RECIPES = [
  { title: 'Shakshuka', img: 'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=400&q=80' },
  { title: 'Miso Salmon', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80' },
  { title: 'Risotto', img: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80' },
];

const FEATURES = [
  { icon: '🧠', title: 'AI-Powered Recipes', desc: "Our GPU-accelerated culinary AI generates complete, chef-quality recipes from whatever you have on hand." },
  { icon: '🔬', title: 'Science of Cooking', desc: "Deep explanations for every step — what's happening chemically, why it matters, and how to fix mistakes." },
  { icon: '⚡', title: 'Zero Waste', desc: "Type your ingredients, get matched recipes instantly. No grocery trips, no wasted food." },
  { icon: '🎯', title: 'Smart Matching', desc: "RAG-powered contextual grounding ensures recipes that actually work with your exact ingredients." },
  { icon: '🍳', title: 'Sensory Cues', desc: "Know exactly what to smell, see, and hear at every stage of cooking. Never undercook again." },
  { icon: '♥️', title: 'Save Favourites', desc: "Build your personal cookbook. Every recipe you love, one click to save and revisit anytime." },
];

const STEPS = [
  { num: '01', title: 'Add Ingredients', desc: "Type what's in your fridge or pantry — fresh, frozen, or dry. Anything goes." },
  { num: '02', title: 'Generate Recipe', desc: "Our AI creates a complete, detailed recipe tailored to your exact ingredients." },
  { num: '03', title: 'Cook with Confidence', desc: "Follow step-by-step instructions with sensory cues and science-backed explanations." },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div className="landing-page">

      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="nav-logo">
          <span className="logo-icon">✦</span>
          <span>ChefGuru</span>
        </Link>
        <div className="landing-nav-actions">
          <Link to="/login" className="btn-nav-login">Log in</Link>
          <Link to="/signup" className="btn-nav-signup">Get Started</Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-bg">
          <div className="orb orb1" />
          <div className="orb orb2" />
          <div className="orb orb3" />
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%' }}>
          <div className="landing-hero-content" style={{ margin: '0 auto' }}>
            <div className="landing-badge">
              <span className="landing-badge-dot" />
              Chef Guru AI · GPU Accelerated
            </div>
            <h1 className="landing-title">
              Turn your fridge into<br />
              <span className="gradient-text">culinary magic.</span>
            </h1>
            <p className="landing-subtitle">
              Type any ingredients you have. Our AI generates a complete,
              restaurant-quality recipe with step-by-step science in seconds.
            </p>
            <div className="landing-cta-row">
              <Link to="/signup" className="btn-cta-primary">Start Cooking Free</Link>
              <Link to="/login" className="btn-cta-secondary">I have an account</Link>
            </div>
          </div>

          <div className="landing-hero-visual" style={{ margin: 'var(--sp-7) auto 0' }}>
            {PREVIEW_RECIPES.map((r) => (
              <div key={r.title} className="hero-food-card">
                <img src={r.img} alt={r.title} className="hero-food-img" loading="lazy" />
                <div className="hero-food-label">{r.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="container">
          <div className="stats-row">
            {[
              { n: '100+', l: 'Recipes Generated' },
              { n: 'GPU',  l: 'Accelerated AI'   },
              { n: 'RAG',  l: 'Powered Context'   },
              { n: '∞',   l: 'Ingredients'        },
            ].map(s => (
              <div key={s.l} className="stat-item">
                <div className="stat-number">{s.n}</div>
                <div className="stat-label">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="landing-features">
        <div className="container">
          <p className="landing-section-label">Why ChefGuru</p>
          <h2 className="landing-section-title">Everything a curious cook needs</h2>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-how">
        <div className="container">
          <p className="landing-section-label">How It Works</p>
          <h2 className="landing-section-title">Three steps to a perfect meal</h2>
          <div className="steps-grid">
            {STEPS.map(s => (
              <div key={s.num} className="how-step">
                <div className="how-step-num">{s.num}</div>
                <h3 className="how-step-title">{s.title}</h3>
                <p className="how-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta-banner">
        <div className="container">
          <h2>Ready to cook something extraordinary?</h2>
          <p>Join thousands of home cooks turning everyday ingredients into amazing meals.</p>
          <Link to="/signup" className="btn-cta-primary">Get Started — It is Free</Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p className="footer-logo">✦ ChefGuru</p>
          <p className="footer-copy">Designed with the Golden Ratio. Powered by Chef Guru AI.</p>
        </div>
      </footer>

    </div>
  );
}
