import { useState } from 'react';
import { INGREDIENT_BANK } from '../data/ingredients';
import { normalise } from '../hooks/useAppState';

const CATS = ['all', 'produce', 'protein', 'dairy', 'pantry'];

export default function IngredientsSection({
  selectedIngredients,
  addIngredient,
  removeIngredient,
  clearIngredients,
}) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered =
    activeCategory === 'all'
      ? INGREDIENT_BANK
      : INGREDIENT_BANK.filter(i => i.cat === activeCategory);

  const n = selectedIngredients.size;

  const scrollToRecipes = () => {
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="ingredients-section" id="ingredients-section" aria-labelledby="ing-heading">
      <div className="container">

        {/* Header */}
        <div className="section-header">
          <h2 id="ing-heading">Your Ingredients</h2>
          <span className="chip-count" aria-live="polite">{n} added</span>
        </div>

        {/* Chips */}
        <div
          className={`chips-area${n > 0 ? ' has-chips' : ''}`}
          role="list"
          aria-label="Selected ingredients"
          aria-live="polite"
        >
          {n === 0 ? (
            <p className="chips-empty">Start adding ingredients above ↑</p>
          ) : (
            [...selectedIngredients].map(key => (
              <div key={key} className="chip" role="listitem">
                <span>{key}</span>
                <button
                  className="chip-remove"
                  aria-label={`Remove ${key}`}
                  onClick={() => removeIngredient(key)}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Quick-add header */}
        <div className="quick-add-header">
          <h3>Quick-Add Common Ingredients</h3>
          <div className="category-tabs" role="tablist" aria-label="Ingredient categories">
            {CATS.map(cat => (
              <button
                key={cat}
                className={`tab-btn${activeCategory === cat ? ' active' : ''}`}
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredient grid */}
        <div className="ingredient-grid" role="list" aria-label="Common ingredients to add">
          {filtered.map((ing, idx) => {
            const key = normalise(ing.name);
            const selected = selectedIngredients.has(key);
            return (
              <div
                key={ing.name}
                className={`ing-item${selected ? ' selected' : ''}`}
                role="listitem"
                tabIndex={0}
                aria-label={`${ing.name}${selected ? ' (selected)' : ''}`}
                style={{ animationDelay: `${idx * 30}ms` }}
                onClick={() => selected ? removeIngredient(key) : addIngredient(ing.name)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selected ? removeIngredient(key) : addIngredient(ing.name);
                  }
                }}
              >
                <span className="ing-emoji" aria-hidden="true">{ing.emoji}</span>
                <span>{ing.name}</span>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="find-cta-wrap">
          <button
            className="btn-find"
            onClick={scrollToRecipes}
            aria-label="Find recipes with selected ingredients"
          >
            <span className="btn-find-text">Find Recipes</span>
            <span className="btn-find-icon" aria-hidden="true">→</span>
          </button>
          <button
            className="btn-clear"
            onClick={clearIngredients}
            aria-label="Clear all ingredients"
          >
            Clear all
          </button>
        </div>

      </div>
    </section>
  );
}
