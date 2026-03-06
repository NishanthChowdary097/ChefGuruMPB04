import { RECIPES } from '../data/recipes';
import RecipeCard from './RecipeCard';

export default function FavoritesSection({
  favorites,
  toggleFavorite,
  selectedIngredients,
  setModalRecipeId,
}) {
  const favRecipes = RECIPES.filter(r => favorites.has(r.id));

  return (
    <section
      className="favorites-section"
      id="favorites-section"
      aria-labelledby="fav-heading"
    >
      <div className="container">
        <h2 id="fav-heading">Saved Favorites</h2>

        {favRecipes.length === 0 ? (
          <p className="chips-empty">Heart a recipe to save it here ♡</p>
        ) : (
          <div className="recipe-grid" role="list" aria-label="Favorite recipes">
            {favRecipes.map(recipe => (
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
    </section>
  );
}
