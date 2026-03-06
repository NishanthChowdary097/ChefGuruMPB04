import RecipeCard from './RecipeCard';

export default function RecipesSection({
  selectedIngredients,
  favorites,
  toggleFavorite,
  filter,
  setFilter,
  sort,
  setSort,
  resetFilters,
  getFilteredSorted,
  setModalRecipeId,
  clearIngredients,
}) {
  const list = getFilteredSorted();

  const showAll = () => {
    resetFilters();
    clearIngredients();
  };

  return (
    <main className="recipes-section" id="recipes-section" aria-labelledby="recipes-heading">
      <div className="container">

        <div className="recipes-header">
          <h2 id="recipes-heading">
            <span>{selectedIngredients.size > 0 ? 'Recipes You Can Make' : 'All Recipes'}</span>
            {list.length > 0 && (
              <span className="result-count" aria-live="polite">({list.length})</span>
            )}
          </h2>

          <div className="sort-row">
            <label className="filter-label" htmlFor="sort-select">Sort by</label>
            <select
              id="sort-select"
              className="filter-select"
              value={sort}
              onChange={e => setSort(e.target.value)}
            >
              <option value="match">Best Match</option>
              <option value="time">Quickest</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="no-results" aria-live="polite">
            <span className="no-results-icon" aria-hidden="true">🥦</span>
            <p>No recipes found for your current filters.</p>
            <button className="btn-ghost" onClick={showAll}>Show all recipes</button>
          </div>
        ) : (
          <div className="recipe-grid" role="list" aria-label="Recipe results">
            {list.map((recipe, i) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                selectedIngredients={selectedIngredients}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                onOpen={() => setModalRecipeId(recipe.id)}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
