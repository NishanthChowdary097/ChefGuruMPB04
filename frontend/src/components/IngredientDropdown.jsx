import { useState, useRef, useEffect } from 'react';

export const ALL_INGREDIENTS = [
  'Salt', 'Sugar', 'Pepper', 'Olive Oil', 'Vegetable Oil', 'Butter', 'Milk', 'Eggs',
  'Flour', 'Rice', 'Pasta', 'Chicken', 'Beef', 'Fish', 'Garlic', 'Onion', 'Tomato',
  'Potato', 'Carrot', 'Celery', 'Basil', 'Parsley', 'Cilantro', 'Cinnamon', 'Cumin',
  'Chili Powder', 'Vinegar', 'Soy Sauce', 'Honey', 'Lemon', 'Lime', 'Apple', 'Banana',
  'Yeast', 'Baking Powder', 'Baking Soda', 'Cheese', 'Corn', 'Spinach', 'Zucchini',
  'Eggplant', 'Bell Pepper', 'Mushrooms', 'Ginger', 'Turmeric', 'Chives', 'Thyme',
  'Oregano', 'Rosemary', 'Dill', 'Mint', 'Kale', 'Broccoli', 'Cauliflower', 'Cabbage',
  'Green Beans', 'Asparagus', 'Leeks', 'Beets', 'Peas', 'Avocado', 'Peanut Butter',
  'Coconut Oil', 'Lettuce', 'Cucumber', 'Pickles', 'Chickpeas', 'Lentils', 'Black Beans',
  'Kidney Beans', 'Tofu', 'Tempeh', 'Soy Milk', 'Almond Milk', 'Coconut Milk',
  'Sesame Oil', 'Saffron', 'Nutmeg', 'Paprika', 'Mustard', 'Ketchup', 'Mayonnaise',
  'Hot Sauce', 'BBQ Sauce', 'Maple Syrup', 'Granola', 'Oats', 'Quinoa', 'Couscous',
  'Barley', 'Breadcrumbs', 'Panko', 'Crackers', 'Worcestershire Sauce', 'Capers', 'Anchovies',
];

export default function IngredientDropdown({ selected, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const filtered = ALL_INGREDIENTS.filter(
    ing => ing.toLowerCase().includes(query.toLowerCase()) && !selected.includes(ing)
  );

  const add = (ing) => {
    onChange([...selected, ing]);
    setQuery('');
    setOpen(false);
  };

  const remove = (ing) => onChange(selected.filter(s => s !== ing));

  return (
    <div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="ing-selected-chips" style={{ marginBottom: 'var(--sp-2)' }}>
          {selected.map(ing => (
            <span key={ing} className="ing-chip-ai">
              {ing}
              <button onClick={() => remove(ing)} aria-label={`Remove ${ing}`}>✕</button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      <div className="ing-dropdown-wrap" ref={ref}>
        <input
          type="text"
          className="ing-dropdown-input"
          placeholder="Search & add ingredients…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {open && filtered.length > 0 && (
          <div className="ing-dropdown-list">
            {filtered.map(ing => (
              <div
                key={ing}
                className="ing-dropdown-item"
                onMouseDown={() => add(ing)}
              >
                <span style={{ color: 'var(--clr-primary-light)', fontSize: '11px' }}>+</span>
                {ing}
              </div>
            ))}
          </div>
        )}
        {open && query && filtered.length === 0 && (
          <div className="ing-dropdown-list">
            <div
              className="ing-dropdown-item"
              onMouseDown={() => { add(query.trim()); }}
            >
              <span style={{ color: 'var(--clr-primary-light)', fontSize: '11px' }}>+</span>
              Add "{query.trim()}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
