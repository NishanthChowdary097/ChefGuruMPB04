import { useState } from 'react';
import IngredientDropdown from './IngredientDropdown';

export const API_BASE =
  import.meta.env.VITE_BASE_URL
    ? `${import.meta.env.VITE_BASE_URL}/api/auth`
    : "http://localhost:5000/api/auth"; // Change to your backend URL

export default function AIRecipePanel() {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (selectedIngredients.length === 0) {
      setError('Please add at least one ingredient.');
      return;
    }
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: selectedIngredients }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err.message.includes('Failed to fetch')
          ? 'Cannot reach the Chef Guru AI backend. Make sure your API server is running.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-panel-header">
        <div className="ai-panel-badge">
          <span style={{ fontSize: '10px' }}>⚡</span> Chef Guru AI
        </div>
      </div>
      <h2 className="ai-panel-title">Generate a Recipe</h2>
      <p className="ai-panel-sub">
        Add your ingredients below and our GPU-accelerated AI will craft a complete recipe just for you.
      </p>

      {/* Ingredient Dropdown */}
      <IngredientDropdown
        selected={selectedIngredients}
        onChange={setSelectedIngredients}
      />

      {/* Generate button */}
      <button
        className="btn-ai-generate"
        style={{ marginTop: 'var(--sp-4)' }}
        onClick={generate}
        disabled={loading || selectedIngredients.length === 0}
      >
        {loading ? (
          <>
            <div className="spinner" />
            Generating with AI…
          </>
        ) : (
          <>✦ Generate Recipe</>
        )}
      </button>

      {/* Error */}
      {error && <div className="ai-error">⚠ {error}</div>}

      {/* Result */}
      {result && <AIResult result={result} ingredients={selectedIngredients} />}
    </div>
  );
}

function AIResult({ result, ingredients }) {
  return (
    <div className="ai-result">
      <h3 className="ai-result-title">{result.title}</h3>
      <p className="ai-result-desc">{result.description}</p>

      {/* Ingredients */}
      {result.ingredients && result.ingredients.length > 0 && (
        <div className="ai-result-section">
          <div className="ai-result-section-title">Ingredients</div>
          <ul className="ai-ing-list">
            {result.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions */}
      {result.instructions && result.instructions.length > 0 && (
        <div className="ai-result-section">
          <div className="ai-result-section-title">Instructions</div>
          <ol className="ai-step-list">
            {result.instructions.map((step, i) => (
              <li key={i} className="ai-step-item">
                <div className="ai-step-content">
                  <div className="ai-step-action">{step.step}</div>
                  {step.description && (
                    <div className="ai-step-desc">{step.description}</div>
                  )}
                  {step.timing && (
                    <div className="ai-step-timing">⏱ {step.timing}</div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
