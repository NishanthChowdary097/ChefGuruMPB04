import { matchCount, matchPercent } from '../hooks/useAppState';

export default function RecipeCard({
  recipe,
  selectedIngredients,
  favorites,
  toggleFavorite,
  onOpen,
}) {
  const pct = matchPercent(recipe, selectedIngredients);
  const cnt = matchCount(recipe, selectedIngredients);
  const isFav = favorites.has(recipe.id);
  const haveSome = selectedIngredients.size > 0;
  const matchLabel = haveSome
    ? pct === 100
      ? '✓ All ingredients'
      : `${cnt}/${recipe.ingredients.length} match`
    : '';

  return (
    <article
      className="recipe-card"
      role="listitem"
      tabIndex={0}
      aria-label={`${recipe.title} – ${recipe.cuisine}, ${recipe.cookTime} minutes`}
      onClick={onOpen}
      onKeyDown={e => { if (e.key === 'Enter') onOpen(); }}
    >
      <div className="card-img-wrap">
        <img
          className="card-img"
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          onError={e => {
            e.target.src = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=600&q=80';
          }}
        />
        <button
          className={`card-fav${isFav ? ' favorited' : ''}`}
          aria-label={`${isFav ? 'Remove from' : 'Add to'} favorites: ${recipe.title}`}
          onClick={e => { e.stopPropagation(); toggleFavorite(recipe.id); }}
        >
          <span className="fav-heart" aria-hidden="true">{isFav ? '♥' : '♡'}</span>
        </button>
        {matchLabel && (
          <span className={`card-match-badge${pct === 100 ? ' full' : ''}`}>
            {matchLabel}
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="card-tags">
          <span className={`card-tag ${recipe.diet === 'vegetarian' ? 'diet-veg' : 'diet-nonveg'}`}>
            {recipe.diet === 'vegetarian' ? '🌱 Veg' : '🍖 Non-Veg'}
          </span>
          <span className="card-tag cuisine">{recipe.cuisine}</span>
        </div>

        <h3 className="card-title">{recipe.title}</h3>
        <p className="card-desc">{recipe.description}</p>

        <div className="card-footer">
          <span className="card-stat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            {recipe.cookTime} min
          </span>
          <span className="card-stat">
            <span className="card-rating" aria-label={`Rating: ${recipe.rating}`}>★ {recipe.rating}</span>
          </span>
          <span className="card-stat">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M11 21H5a2 2 0 0 1-2-2V7l4-4h12a2 2 0 0 1 2 2v4" /><polyline points="11 3 11 9 3 9" />
            </svg>
            {recipe.ingredients.length} ingredients
          </span>
        </div>
      </div>
    </article>
  );
}
