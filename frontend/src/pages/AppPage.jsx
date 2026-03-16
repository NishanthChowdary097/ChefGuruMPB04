import { useAppState } from '../hooks/useAppState';
import { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import IngredientsSection from '../components/IngredientsSection';
import FiltersSection from '../components/FiltersSection';
import RecipesSection from '../components/RecipesSection';
import RecipeModal from '../components/RecipeModal';
import AIRecipePanel from '../components/AIRecipePanel';
import RecipeHistory from '../components/RecipeHistory';
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

      {/* 1 — Hero search bar */}
      <Hero addIngredient={state.addIngredient} />

      {/* 2 — AI Recipe Generator at the top */}
      <section style={{
        padding: 'var(--sp-7) 0',
        background: 'var(--clr-bg)',
        borderTop: '1px solid var(--clr-border)'
      }}>
        <div className="container">
          <AIRecipePanel />
        </div>
      </section>

      {/* 3 — Ingredients section below AI panel */}
      <IngredientsSection
        selectedIngredients={state.selectedIngredients}
        addIngredient={state.addIngredient}
        removeIngredient={state.removeIngredient}
        clearIngredients={state.clearIngredients}
      />

      {/* 4 — Filters + recipe browser */}
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

      {/* 5 — History above footer */}
      <RecipeHistory />

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