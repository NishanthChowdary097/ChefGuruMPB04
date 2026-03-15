import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`navbar${scrolled ? ' scrolled' : ''}`} role="banner">
      <div className="nav-inner">
        <Link to="/app" className="nav-logo" aria-label="ChefGuru Home">
          <span className="logo-icon" aria-hidden="true">✦</span>
          <span>ChefGuru</span>
        </Link>

        <nav className="nav-links" role="navigation" aria-label="Main Navigation">
          <a href="#discover" className="nav-link">Discover</a>
          <a href="#ingredients-section" className="nav-link">Ingredients</a>
          <a href="#favorites-section" className="nav-link">Favorites</a>
          {user && (
            <>
              <div className="user-avatar" title={user.email}>{user.avatar}</div>
              <button className="btn-logout" onClick={handleLogout}>Log out</button>
            </>
          )}
        </nav>

        <button
          className={`hamburger${menuOpen ? ' open' : ''}`}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(v => !v)}
        >
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu" role="navigation" aria-label="Mobile Navigation">
          <a href="#discover" className="mob-link" onClick={closeMenu}>Discover</a>
          <a href="#ingredients-section" className="mob-link" onClick={closeMenu}>Ingredients</a>
          <a href="#favorites-section" className="mob-link" onClick={closeMenu}>Favorites</a>
          {user && (
            <button
              onClick={() => { handleLogout(); closeMenu(); }}
              style={{ background:'none', border:'none', cursor:'pointer', textAlign:'left', color:'var(--clr-primary)', fontFamily:'var(--font-body)', fontSize:'var(--fs-md)', fontWeight:500, padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--r-md)', width:'100%' }}
            >
              Log out ({user.name})
            </button>
          )}
        </div>
      )}
    </header>
  );
}
