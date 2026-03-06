export default function FiltersSection({ filter, setFilter, sort, setSort, resetFilters }) {
  return (
    <section
      className="filters-section"
      id="discover"
      aria-labelledby="filters-heading"
    >
      <div className="container">
        <h2 id="filters-heading" className="sr-only">Filter Recipes</h2>
        <div className="filters-row" role="group" aria-label="Recipe filters">

          <div className="filter-group">
            <label className="filter-label" htmlFor="diet-filter">Diet</label>
            <select
              id="diet-filter"
              className="filter-select"
              value={filter.diet}
              onChange={e => setFilter(f => ({ ...f, diet: e.target.value }))}
            >
              <option value="all">All Diets</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="non-vegetarian">Non-Veg</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="cuisine-filter">Cuisine</label>
            <select
              id="cuisine-filter"
              className="filter-select"
              value={filter.cuisine}
              onChange={e => setFilter(f => ({ ...f, cuisine: e.target.value }))}
            >
              <option value="all">All Cuisines</option>
              <option value="italian">Italian</option>
              <option value="indian">Indian</option>
              <option value="mexican">Mexican</option>
              <option value="asian">Asian</option>
              <option value="american">American</option>
              <option value="mediterranean">Mediterranean</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label" htmlFor="time-filter">Cook Time</label>
            <select
              id="time-filter"
              className="filter-select"
              value={filter.time}
              onChange={e => setFilter(f => ({ ...f, time: e.target.value }))}
            >
              <option value="all">Any Time</option>
              <option value="15">Under 15 min</option>
              <option value="30">Under 30 min</option>
              <option value="60">Under 60 min</option>
            </select>
          </div>

          <button
            className="btn-reset-filters"
            onClick={resetFilters}
            aria-label="Reset all filters"
          >
            Reset
          </button>

        </div>
      </div>
    </section>
  );
}
