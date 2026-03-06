import { useState } from 'react';

export default function Hero({ addIngredient }) {
  const [value, setValue] = useState('');

  const handleAdd = () => {
    addIngredient(value);
    setValue('');
  };

  return (
    <section className="hero" aria-label="Hero Section">
      <div className="hero-bg" aria-hidden="true">
        <div className="orb orb1" />
        <div className="orb orb2" />
        <div className="orb orb3" />
      </div>

      <div className="hero-content">
        <p className="hero-eyebrow">✦ Zero Waste Cooking</p>
        <h1 className="hero-title">
          Cook magic with<br />
          <em>what you have.</em>
        </h1>
        <p className="hero-sub">
          Type what's in your fridge. We'll find recipes that actually work.
        </p>

        <div className="hero-search-wrap">
          <div className="search-box" role="search">
            <span className="search-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              type="text"
              className="search-input"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="e.g. eggs, tomatoes, garlic…"
              aria-label="Type an ingredient and press Enter"
              autoComplete="off"
            />
            <button className="btn-add" onClick={handleAdd}>Add</button>
          </div>
          <p className="search-hint">
            Press <kbd>Enter</kbd> or click <strong>Add</strong>
          </p>
        </div>
      </div>

      <div className="hero-scroll-cue" aria-hidden="true">
        <span className="scroll-arrow">↓</span>
      </div>
    </section>
  );
}
