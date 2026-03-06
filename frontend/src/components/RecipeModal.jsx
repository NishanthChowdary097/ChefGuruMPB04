import { RECIPES } from '../data/recipes';
import { normalise, matchCount, matchPercent } from '../hooks/useAppState';

export default function RecipeModal({
  recipeId,
  onClose,
  favorites,
  toggleFavorite,
  selectedIngredients,
}) {
  const recipe = RECIPES.find(r => r.id === recipeId);
  if (!recipe) return null;

  const isFav = favorites.has(recipe.id);
  const pct = matchPercent(recipe, selectedIngredients);
  const cnt = matchCount(recipe, selectedIngredients);

  const stats = [
    { label: 'Cook Time', val: `${recipe.cookTime} min` },
    { label: 'Rating',    val: `★ ${recipe.rating}` },
    { label: 'Cuisine',   val: recipe.cuisine, capitalize: true },
    { label: 'Ingredients', val: recipe.ingredients.length },
  ];

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        {/* Close button */}
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close recipe modal"
        >
          ✕
        </button>

        {/* Image */}
        <div className="modal-img-wrap">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="modal-img"
            onError={e => {
              e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80';
            }}
          />
          <div className="modal-badges">
            <span
              className="card-tag"
              style={{ background: 'rgba(0,0,0,.55)', color: '#fff', backdropFilter: 'blur(6px)' }}
            >
              {recipe.diet === 'vegetarian' ? '🌱 Vegetarian' : '🍖 Non-Veg'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="modal-meta-row">
            <span className="modal-cuisine">✦ {recipe.cuisine}</span>
            {selectedIngredients.size > 0 && (
              <span className="modal-match">
                {pct === 100
                  ? '✓ All ingredients matched'
                  : `${cnt} of ${recipe.ingredients.length} matched`}
              </span>
            )}
          </div>

          <h2 id="modal-title" className="modal-title">{recipe.title}</h2>
          <p className="modal-desc">{recipe.description}</p>

          {/* Stats */}
          <div className="modal-stats">
            {stats.map(s => (
              <div key={s.label} className="modal-stat">
                <span className="modal-stat-label">{s.label}</span>
                <span
                  className="modal-stat-val"
                  style={s.capitalize ? { textTransform: 'capitalize' } : {}}
                >
                  {s.val}
                </span>
              </div>
            ))}
          </div>

          {/* Ingredients */}
          <div className="modal-section">
            <h3>Ingredients</h3>
            <ul className="modal-ingredient-list">
              {recipe.ingredients.map(ing => {
                const have = [...selectedIngredients].some(sel =>
                  normalise(ing).includes(sel) || sel.includes(normalise(ing))
                );
                return (
                  <li key={ing} className={have ? 'have' : ''}>
                    <span className="ing-dot" />
                    {ing}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Steps */}
          <div className="modal-section">
            <h3>Instructions</h3>
            <ol className="modal-steps">
              {recipe.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              className={`btn-fav-modal${isFav ? ' favorited' : ''}`}
              onClick={() => toggleFavorite(recipe.id)}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <span className="fav-icon">{isFav ? '♥' : '♡'}</span>
              {isFav ? 'Saved!' : 'Save Recipe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
