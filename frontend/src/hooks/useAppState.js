import { useState, useCallback } from 'react';
import { RECIPES } from '../data/recipes';

export function normalise(str) {
  return str.toLowerCase().trim();
}

export function matchCount(recipe, selectedIngredients) {
  if (!selectedIngredients.size) return 0;
  const recipeIngs = recipe.ingredients.map(normalise);
  let count = 0;
  selectedIngredients.forEach(sel => {
    if (recipeIngs.some(ing => ing.includes(normalise(sel)) || normalise(sel).includes(ing))) count++;
  });
  return count;
}

export function matchPercent(recipe, selectedIngredients) {
  if (!selectedIngredients.size) return 100;
  return Math.round((matchCount(recipe, selectedIngredients) / recipe.ingredients.length) * 100);
}

export function useAppState() {
  const [selectedIngredients, setSelectedIngredients] = useState(new Set());
  const [favorites, setFavorites] = useState(new Set());
  const [filter, setFilter] = useState({ diet: 'all', cuisine: 'all', time: 'all' });
  const [sort, setSort] = useState('match');
  const [modalRecipeId, setModalRecipeId] = useState(null);

  const addIngredient = useCallback((raw) => {
    const name = raw.trim();
    if (!name) return;
    const key = normalise(name);
    setSelectedIngredients(prev => {
      if (prev.has(key)) return prev;
      return new Set([...prev, key]);
    });
  }, []);

  const removeIngredient = useCallback((key) => {
    setSelectedIngredients(prev => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const clearIngredients = useCallback(() => {
    setSelectedIngredients(new Set());
  }, []);

  const toggleFavorite = useCallback((id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilter({ diet: 'all', cuisine: 'all', time: 'all' });
    setSort('match');
  }, []);

  const getFilteredSorted = useCallback(() => {
    let list = [...RECIPES];

    if (selectedIngredients.size > 0) {
      list = list.filter(r => matchCount(r, selectedIngredients) > 0);
    }
    if (filter.diet !== 'all') {
      list = list.filter(r => r.diet === filter.diet);
    }
    if (filter.cuisine !== 'all') {
      list = list.filter(r => r.cuisine === filter.cuisine);
    }
    if (filter.time !== 'all') {
      const maxTime = parseInt(filter.time);
      list = list.filter(r => r.cookTime <= maxTime);
    }

    if (sort === 'match') {
      list.sort((a, b) => matchPercent(b, selectedIngredients) - matchPercent(a, selectedIngredients));
    } else if (sort === 'time') {
      list.sort((a, b) => a.cookTime - b.cookTime);
    } else if (sort === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [selectedIngredients, filter, sort]);

  return {
    selectedIngredients,
    addIngredient,
    removeIngredient,
    clearIngredients,
    favorites,
    toggleFavorite,
    filter,
    setFilter,
    sort,
    setSort,
    resetFilters,
    modalRecipeId,
    setModalRecipeId,
    getFilteredSorted,
  };
}
