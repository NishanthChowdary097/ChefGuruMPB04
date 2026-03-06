import { useAppState } from '../hooks/useAppState';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import IngredientsSection from '../components/IngredientsSection';
import FiltersSection from '../components/FiltersSection';
import RecipesSection from '../components/RecipesSection';
import FavoritesSection from '../components/FavoritesSection';
import RecipeModal from '../components/RecipeModal';
import AIRecipePanel from '../components/AIRecipePanel';
import Footer from '../components/Footer';

export default function AppPage() {
  const state = useAppState();

  useEffect(() => {
    document.body.style.overflow = state.modalRecipeId ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [state.modalRecipeId]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && state.modalRecipeId) state.setModalRecipeId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state.modalRecipeId, state.setModalRecipeId]);

  return (
    <>
      <Navbar />
      <Hero addIngredient={state.addIngredient} />

      <IngredientsSection
        selectedIngredients={state.selectedIngredients}
        addIngredient={state.addIngredient}
        removeIngredient={state.removeIngredient}
        clearIngredients={state.clearIngredients}
      />

      {/* AI Recipe Generation panel */}
      <section style={{ padding: 'var(--sp-7) 0', background: 'var(--clr-bg)', borderTop: '1px solid var(--clr-border)' }}>
        <div className="container">
          <AIRecipePanel />
        </div>
      </section>

      <FiltersSection
        filter={state.filter}
        setFilter={state.setFilter}
        sort={state.sort}
        setSort={state.setSort}
        resetFilters={state.resetFilters}
      />

      <RecipesSection
        selectedIngredients={state.selectedIngredients}
        favorites={state.favorites}
        toggleFavorite={state.toggleFavorite}
        filter={state.filter}
        setFilter={state.setFilter}
        sort={state.sort}
        setSort={state.setSort}
        resetFilters={state.resetFilters}
        getFilteredSorted={state.getFilteredSorted}
        setModalRecipeId={state.setModalRecipeId}
        clearIngredients={state.clearIngredients}
      />

      <FavoritesSection
        favorites={state.favorites}
        toggleFavorite={state.toggleFavorite}
        selectedIngredients={state.selectedIngredients}
        setModalRecipeId={state.setModalRecipeId}
      />

      <Footer />

      {state.modalRecipeId && (
        <RecipeModal
          recipeId={state.modalRecipeId}
          onClose={() => state.setModalRecipeId(null)}
          favorites={state.favorites}
          toggleFavorite={state.toggleFavorite}
          selectedIngredients={state.selectedIngredients}
        />
      )}
    </>
  );
}
