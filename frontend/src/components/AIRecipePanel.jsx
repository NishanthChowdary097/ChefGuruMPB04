import { useState, useCallback } from 'react';
import IngredientDropdown from './IngredientDropdown';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_MAIN_BASE_URL + '/api/app';

const LANGUAGES = [
  { code: 'English', name: 'English' },
  { code: 'Hindi', name: 'Hindi' },
  { code: 'Tamil', name: 'Tamil' },
  { code: 'Telugu', name: 'Telugu' },
  { code: 'Kannada', name: 'Kannada' },
  { code: 'Malayalam', name: 'Malayalam' },
  { code: 'Marathi', name: 'Marathi' },
  { code: 'Bengali', name: 'Bengali' },
  { code: 'Gujarati', name: 'Gujarati' },
  { code: 'Punjabi', name: 'Punjabi' },
  { code: 'French', name: 'French' },
  { code: 'Spanish', name: 'Spanish' },
  { code: 'German', name: 'German' },
  { code: 'Italian', name: 'Italian' },
  { code: 'Portuguese', name: 'Portuguese' },
  { code: 'Arabic', name: 'Arabic' },
  { code: 'Chinese', name: 'Chinese' },
  { code: 'Japanese', name: 'Japanese' },
  { code: 'Korean', name: 'Korean' },
  { code: 'Russian', name: 'Russian' },
];

async function authFetch(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || data.msg || `Request failed (${res.status})`);
  return data;
}

function normalizeIngredient(ing) {
  if (typeof ing === 'string') return ing;
  if (ing && typeof ing === 'object') {
    const name = ing.ingredient?.name || '';
    const qty  = ing.quantity || '';
    return qty ? `${name} - ${qty}` : name;
  }
  return String(ing);
}

function normalizeRecipe(r) {
  return {
    ...r,
    ingredients: (r.ingredients || []).map(normalizeIngredient),
    instructions: (r.instructions || []).map((s, i) => ({
      ...s,
      step_number: s.step_number ?? i + 1,
      explanation: s.explanation && Object.keys(s.explanation).length > 0
        ? s.explanation : null,
    })),
  };
}

export default function AIRecipePanel() {
  const { token } = useAuth();

  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [language, setLanguage]         = useState('English');
  const [langOpen, setLangOpen]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [recipe, setRecipe]             = useState(null);
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [view, setView]                 = useState('generate');
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savedError, setSavedError]     = useState('');
  const [activeRecipe, setActiveRecipe] = useState(null);

  const selectedLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  // ── Generate — passes language as a key in the request body ──────────────
  const generate = async () => {
    if (!token)                           { setError('You must be logged in to generate recipes.'); return; }
    if (selectedIngredients.length === 0) { setError('Please add at least one ingredient.'); return; }
    if (selectedIngredients.length > 15)  { setError('Maximum 15 ingredients allowed.'); return; }

    setError(''); setRecipe(null); setSaved(false); setLoading(true);
    try {
      const data = await authFetch(`${API_BASE}/recipe/generate`, token, {
        method: 'POST',
        body: JSON.stringify({
          ingredients: selectedIngredients,
          language,                          // ← language key sent to backend
          language_name: selectedLang.name,  // ← human-readable name for backend prompt
        }),
      });
      setRecipe(normalizeRecipe(data));
    } catch (err) {
      if (err.message.includes('Failed to fetch') || err.message.includes('ERR_FAILED')) {
        setError('Cannot reach Chef Guru AI. Make sure port 5001 is running and CORS is enabled.');
      } else if (err.message.includes('expired')) {
        setError('Session expired. Please log out and log in again.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const saveRecipe = async (tempKey) => {
    if (!tempKey) { setError('No temp_key found. Cannot save this recipe.'); return; }
    setSaving(true);
    try {
      await authFetch(`${API_BASE}/recipe/save_recipe`, token, {
        method: 'POST',
        body: JSON.stringify({ temp_key: tempKey }),
      });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const loadSaved = useCallback(async () => {
    setView('saved');
    setActiveRecipe(null);
    setSavedError('');
    setLoadingSaved(true);
    setSavedRecipes([]);
    try {
      const data = await authFetch(`${API_BASE}/recipe/saved`, token);
      const list = Array.isArray(data) ? data : data.recipes || [];
      setSavedRecipes(list.map(normalizeRecipe));
    } catch (err) {
      if (err.message.includes('expired')) {
        setSavedError('Session expired. Please log out and log in again.');
      } else {
        setSavedError(err.message);
      }
    } finally {
      setLoadingSaved(false);
    }
  }, [token]);

  const TABS = [
    { id: 'generate', label: '✦ Generate', onClick: () => { setView('generate'); setError(''); } },
    { id: 'saved',    label: '♥ Saved',    onClick: loadSaved },
  ];

  return (
    <div className="ai-panel">

      {/* ── Tab header ── */}
      <div className="ai-panel-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
        <div className="ai-panel-badge">
          <span style={{ fontSize: '10px' }}>⚡</span> Chef Guru AI
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={tab.onClick} style={{
              background: view === tab.id ? 'rgba(232,83,26,.25)' : 'rgba(255,255,255,.06)',
              border: `1px solid ${view === tab.id ? 'rgba(232,83,26,.4)' : 'rgba(255,255,255,.10)'}`,
              borderRadius: 'var(--r-md)', padding: '5px 12px',
              fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)', fontWeight: 600,
              color: view === tab.id ? 'var(--clr-primary-light)' : 'rgba(255,255,255,.5)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          GENERATE VIEW
      ══════════════════════════════════════ */}
      {view === 'generate' && (
        <>
          <h2 className="ai-panel-title">Generate a Recipe</h2>
          <p className="ai-panel-sub">
            Add up to 15 ingredients and our GPU-accelerated AI will craft a complete recipe just for you.
          </p>

          <IngredientDropdown selected={selectedIngredients} onChange={setSelectedIngredients} />

          {/* ── Language selector ── */}
          <div style={{ marginTop: 'var(--sp-3)', position: 'relative' }}>
            <div style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.4)',
              marginBottom: '6px',
            }}>
              🌐 Recipe Language
            </div>
            <button
              onClick={() => setLangOpen(v => !v)}
              style={{
                width: '100%', background: 'rgba(255,255,255,.07)',
                border: `1px solid ${langOpen ? 'rgba(232,83,26,.4)' : 'rgba(255,255,255,.12)'}`,
                borderRadius: 'var(--r-md)', padding: '9px 14px',
                fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', fontWeight: 500,
                color: language === 'en' ? 'rgba(255,255,255,.5)' : 'var(--clr-primary-light)',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', transition: 'all 0.2s',
              }}
            >
              <span>
                {language === 'en'
                  ? '🌐 English (default)'
                  : `🌐 ${selectedLang.name}`}
              </span>
              <span style={{ fontSize: '10px', opacity: 0.5 }}>{langOpen ? '▲' : '▼'}</span>
            </button>

            {langOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: '#1C1108', border: '1px solid rgba(232,83,26,.25)',
                borderRadius: 'var(--r-md)', maxHeight: 220, overflowY: 'auto',
                zIndex: 60, boxShadow: 'var(--shadow-xl)',
              }}>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                    style={{
                      width: '100%', background: language === lang.code
                        ? 'rgba(232,83,26,.18)' : 'transparent',
                      border: 'none', borderBottom: '1px solid rgba(255,255,255,.05)',
                      padding: '8px 14px', textAlign: 'left',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)', fontWeight: 500,
                      color: language === lang.code
                        ? 'var(--clr-primary-light)' : 'rgba(255,255,255,.6)',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (language !== lang.code) e.currentTarget.style.background = 'rgba(255,255,255,.06)'; }}
                    onMouseLeave={e => { if (language !== lang.code) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span>{lang.name}</span>
                    {language === lang.code && (
                      <span style={{ fontSize: '10px', color: 'var(--clr-primary-light)' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Generate button ── */}
          <button
            className="btn-ai-generate"
            style={{ marginTop: 'var(--sp-4)' }}
            onClick={generate}
            disabled={loading || selectedIngredients.length === 0}
          >
            {loading
              ? <><div className="spinner" /> Generating{language !== 'en' ? ` in ${selectedLang.name}` : ' with AI'}…</>
              : <>✦ Generate Recipe{language !== 'en' ? ` in ${selectedLang.name}` : ''}</>}
          </button>

          {error && <div className="ai-error">⚠ {error}</div>}

          {recipe && (
            <AIResult
              recipe={recipe}
              token={token}
              saved={saved}
              saving={saving}
              onSave={() => saveRecipe(recipe.temp_key)}
            />
          )}
        </>
      )}

      {/* ══════════════════════════════════════
          SAVED VIEW
      ══════════════════════════════════════ */}
      {view === 'saved' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
            <div>
              <h2 className="ai-panel-title" style={{ margin: 0 }}>Saved Recipes</h2>
              <p className="ai-panel-sub" style={{ margin: 0 }}>Your permanently saved recipe collection.</p>
            </div>
            <button onClick={loadSaved} disabled={loadingSaved} style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)',
              borderRadius: 'var(--r-md)', padding: '5px 12px',
              fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)', fontWeight: 600,
              color: 'rgba(255,255,255,.5)', cursor: 'pointer',
            }}>
              {loadingSaved
                ? <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
                : '↻ Refresh'}
            </button>
          </div>

          {loadingSaved && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-5)' }}>
              <div className="spinner" />
            </div>
          )}

          {savedError && (
            <div className="ai-error">
              ⚠ {savedError}
              <button onClick={loadSaved} style={{
                background: 'none', border: 'none', color: 'var(--clr-primary-light)',
                cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontSize: 'var(--fs-xs)', fontWeight: 700, marginLeft: '8px', padding: 0,
              }}>Try again</button>
            </div>
          )}

          {!loadingSaved && !savedError && savedRecipes.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--sp-5)', color: 'rgba(255,255,255,.35)', fontSize: 'var(--fs-sm)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 'var(--sp-2)' }}>🍳</div>
              No saved recipes yet. Generate one and save it!
            </div>
          )}

          {activeRecipe && (
            <div className="ai-result">
              <button onClick={() => setActiveRecipe(null)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,.45)',
                cursor: 'pointer', fontSize: 'var(--fs-xs)', fontFamily: 'var(--font-body)',
                fontWeight: 600, marginBottom: 'var(--sp-3)', padding: 0,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                ← Back to saved
              </button>
              {activeRecipe.created_at && (
                <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,.3)', marginBottom: 'var(--sp-2)' }}>
                  Saved on {new Date(activeRecipe.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              )}
              <h3 className="ai-result-title">{activeRecipe.title}</h3>
              <RecipeDetail recipe={activeRecipe} token={token} />
            </div>
          )}

          {!activeRecipe && !loadingSaved && savedRecipes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,.3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>
                {savedRecipes.length} recipe{savedRecipes.length !== 1 ? 's' : ''} saved
              </div>
              {savedRecipes.map((r, idx) => (
                <button key={r.id || idx} onClick={() => setActiveRecipe(r)} style={{
                  background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                  borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', textAlign: 'left',
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'var(--font-body)', width: '100%',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(232,83,26,.10)'; e.currentTarget.style.borderColor = 'rgba(232,83,26,.25)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.08)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-2)', marginBottom: '6px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff', fontSize: 'var(--fs-base)' }}>
                      {r.title}
                    </div>
                    <span style={{
                      fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.3)',
                      background: 'rgba(255,255,255,.06)', borderRadius: 'var(--r-sm)',
                      padding: '2px 8px', flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      {(r.instructions || []).length} steps
                    </span>
                  </div>
                  <div style={{
                    fontSize: 'var(--fs-xs)', color: 'rgba(255,255,255,.4)', lineHeight: 1.6,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '8px',
                  }}>
                    {r.description}
                  </div>
                  {r.ingredients?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {r.ingredients.slice(0, 4).map((ing, i) => (
                        <span key={i} style={{
                          fontSize: '10px', color: 'var(--clr-primary-light)',
                          background: 'rgba(232,83,26,.10)', borderRadius: 'var(--r-full)',
                          padding: '2px 8px', border: '1px solid rgba(232,83,26,.20)',
                        }}>
                          {ing.split('-')[0].trim()}
                        </span>
                      ))}
                      {r.ingredients.length > 4 && (
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.3)', padding: '2px 4px' }}>
                          +{r.ingredients.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                  {r.created_at && (
                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.2)', marginTop: '8px' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AIResult({ recipe, token, saved, saving, onSave }) {
  return (
    <div className="ai-result">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--sp-2)', flexWrap: 'wrap', marginBottom: 'var(--sp-2)' }}>
        <h3 className="ai-result-title" style={{ margin: 0 }}>{recipe.title}</h3>
        {recipe.temp_key && (
          <button onClick={onSave} disabled={saving || saved} style={{
            background: saved ? 'rgba(42,157,92,.20)' : 'rgba(232,83,26,.20)',
            border: `1px solid ${saved ? 'rgba(42,157,92,.35)' : 'rgba(232,83,26,.35)'}`,
            borderRadius: 'var(--r-md)', padding: '6px 14px',
            fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)', fontWeight: 700,
            color: saved ? '#5EE8A0' : 'var(--clr-primary-light)',
            cursor: saved ? 'default' : 'pointer', whiteSpace: 'nowrap',
            display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
            transition: 'all 0.2s',
          }}>
            {saving
              ? <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving…</>
              : saved ? <>✓ Saved</> : <>♥ Save Recipe</>}
          </button>
        )}
      </div>
      <RecipeDetail recipe={recipe} token={token} />
    </div>
  );
}

function RecipeDetail({ recipe, token }) {
  return (
    <>
      <p className="ai-result-desc">{recipe.description}</p>

      {recipe.ingredients?.length > 0 && (
        <div className="ai-result-section">
          <div className="ai-result-section-title">Ingredients</div>
          <ul className="ai-ing-list">
            {recipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </div>
      )}

      {recipe.instructions?.length > 0 && (
        <div className="ai-result-section">
          <div className="ai-result-section-title">Instructions</div>
          <ol className="ai-step-list">
            {recipe.instructions.map((step, i) => (
              <StepItem
                key={i}
                step={step}
                stepIndex={i + 1}
                recipeId={recipe.id}
                recipeTitle={recipe.title}
                token={token}
              />
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

function StepItem({ step, stepIndex, recipeId, recipeTitle, token }) {
  const [explaining, setExplaining]           = useState(false);
  const [explanation, setExplanation]         = useState(step.explanation || null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explainErr, setExplainErr]           = useState('');

  const explain = async () => {
    if (explanation) { setShowExplanation(v => !v); return; }
    setExplainErr(''); setExplaining(true);
    try {
      const data = await authFetch(`${API_BASE}/recipe/explain_step`, token, {
        method: 'POST',
        body: JSON.stringify({
          step_number: step.step_number ?? stepIndex,
          context:     recipeTitle,
          recipe_id:   recipeId,
        }),
      });
      setExplanation(data);
      setShowExplanation(true);
    } catch (err) {
      setExplainErr(err.message);
    } finally {
      setExplaining(false);
    }
  };

  return (
    <li className="ai-step-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
      <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'flex-start' }}>
        <span style={{
          minWidth: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,var(--clr-primary),var(--clr-primary-dark))',
          color: '#fff', fontSize: '11px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {stepIndex}
        </span>
        <div style={{ flex: 1 }}>
          <div className="ai-step-action">{step.step}</div>
          {step.description && <div className="ai-step-desc">{step.description}</div>}
          {step.timing && <div className="ai-step-timing">⏱ {step.timing}</div>}
        </div>
        <button onClick={explain} disabled={explaining} style={{
          background: showExplanation ? 'rgba(232,83,26,.25)' : 'rgba(255,255,255,.06)',
          border: `1px solid ${showExplanation ? 'rgba(232,83,26,.4)' : 'rgba(255,255,255,.10)'}`,
          borderRadius: 'var(--r-sm)', padding: '4px 10px', flexShrink: 0,
          fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
          color: showExplanation ? 'var(--clr-primary-light)' : 'rgba(255,255,255,.4)',
          cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {explaining
            ? <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
            : explanation ? (showExplanation ? '🔬 Hide' : '🔬 Show') : '🔬 Explain'}
        </button>
      </div>

      {explainErr && (
        <div style={{ fontSize: 'var(--fs-xs)', color: '#FF6B80', paddingLeft: '34px' }}>
          ⚠ {explainErr}
        </div>
      )}

      {showExplanation && explanation && <ExplanationPanel explanation={explanation} />}
    </li>
  );
}

function ExplanationPanel({ explanation }) {
  const fields = [
    { key: 'purpose',                label: '🎯 Purpose' },
    { key: 'what_is_happening',      label: '⚗️ What Is Happening' },
    { key: 'visual_indicators',      label: '👁 Visual Indicators' },
    { key: 'aroma_and_sound',        label: '👃 Aroma & Sound' },
    { key: 'texture_transformation', label: '🤲 Texture' },
    { key: 'heat_control',           label: '🔥 Heat Control' },
    { key: 'expert_tip',             label: '⭐ Expert Tip' },
    { key: 'safety_note',            label: '⚠️ Safety' },
  ];

  return (
    <div style={{
      marginLeft: '34px', background: 'rgba(0,0,0,.25)',
      border: '1px solid rgba(232,83,26,.15)', borderRadius: 'var(--r-md)',
      padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clr-primary-light)' }}>
        🔬 Culinary Science
      </div>
      {fields.map(({ key, label }) =>
        explanation[key] ? (
          <div key={key}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              {label}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.7)', lineHeight: 1.7 }}>
              {explanation[key]}
            </div>
          </div>
        ) : null
      )}
      {explanation.common_errors?.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            ❌ Common Errors & Fixes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {explanation.common_errors.map((err, i) => (
              <div key={i} style={{
                padding: '10px 12px', background: 'rgba(224,36,61,.08)',
                borderRadius: 'var(--r-sm)', border: '1px solid rgba(224,36,61,.15)',
              }}>
                <div style={{ fontSize: '12px', color: '#FF8090', fontWeight: 600, marginBottom: '4px' }}>✗ {err}</div>
                {explanation.how_to_fix_errors?.[i] && (
                  <div style={{ fontSize: '12px', color: 'rgba(94,232,160,.8)' }}>✓ {explanation.how_to_fix_errors[i]}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}