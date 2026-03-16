import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';


const API_BASE = import.meta.env.VITE_MAIN_BASE_URL + '/api/app';

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

export default function RecipeHistory() {
  const { token } = useAuth();

  const [historyList, setHistoryList]       = useState([]);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [activeRecipe, setActiveRecipe]     = useState(null);
  const [loadingDetail, setLoadingDetail]   = useState(false);
  const [detailError, setDetailError]       = useState('');
  const [saving, setSaving]                 = useState(false);
  const [savedMap, setSavedMap]             = useState({});

  const load = useCallback(async () => {
    if (!token) return;
    setError(''); setLoading(true); setHistoryList([]);
    try {
      const data = await authFetch(`${API_BASE}/recipe/temp_recipes`, token);
      setHistoryList(data.recipes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // auto-load on mount
  useEffect(() => { load(); }, [load]);

  const openDetail = async (item) => {
    setDetailError(''); setLoadingDetail(true); setActiveRecipe(null);
    try {
      const data = await authFetch(`${API_BASE}/recipe/temp_recipes/${item.id}`, token);
      setActiveRecipe(normalizeRecipe(data));
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const saveRecipe = async (tempKey, recipeId) => {
    if (!tempKey || savedMap[recipeId]) return;
    setSaving(true);
    try {
      await authFetch(`${API_BASE}/recipe/save_recipe`, token, {
        method: 'POST',
        body: JSON.stringify({ temp_key: tempKey }),
      });
      setSavedMap(prev => ({ ...prev, [recipeId]: true }));
    } catch (err) {
      setDetailError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!token) return null;

  return (
    <section style={{
      padding: 'var(--sp-7) 0',
      background: 'var(--clr-surface)',
      borderTop: '1px solid var(--clr-border)',
    }}>
      <div className="container">

        {/* Section header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--sp-5)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
          <div>
            <p style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--clr-primary)', marginBottom: 'var(--sp-2)' }}>
              Recipe History
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: 'var(--clr-dark)', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              Your generated recipes
            </h2>
          </div>
          <button onClick={load} disabled={loading} style={{
            background: 'none', border: '1.5px solid var(--clr-border)',
            borderRadius: 'var(--r-lg)', padding: '9px var(--sp-4)',
            fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', fontWeight: 600,
            color: 'var(--clr-mid)', cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clr-dark)'; e.currentTarget.style.color = 'var(--clr-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.color = 'var(--clr-mid)'; }}
          >
            {loading ? <><div className="spinner-dark" /> Loading…</> : '↻ Refresh'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#FFEDED', border: '1px solid rgba(224,36,61,.20)',
            borderRadius: 'var(--r-md)', padding: 'var(--sp-3)',
            fontSize: 'var(--fs-sm)', color: '#C0153A', marginBottom: 'var(--sp-4)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>⚠ {error}</span>
            <button onClick={load} style={{ background: 'none', border: 'none', color: 'var(--clr-primary)', cursor: 'pointer', fontWeight: 700, fontSize: 'var(--fs-xs)' }}>
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-6)' }}>
            <div className="spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && historyList.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--sp-6) var(--sp-4)', color: 'var(--clr-light)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--sp-3)' }}>🕑</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--clr-mid)', marginBottom: 'var(--sp-2)' }}>No history yet</p>
            <p style={{ fontSize: 'var(--fs-sm)' }}>Generate a recipe above and it will appear here.</p>
          </div>
        )}

        {/* Detail error */}
        {detailError && (
          <div style={{
            background: '#FFEDED', border: '1px solid rgba(224,36,61,.20)',
            borderRadius: 'var(--r-md)', padding: 'var(--sp-3)',
            fontSize: 'var(--fs-sm)', color: '#C0153A', marginBottom: 'var(--sp-4)',
          }}>
            ⚠ {detailError}
          </div>
        )}

        {/* Loading detail */}
        {loadingDetail && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--sp-5)' }}>
            <div className="spinner-dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
          </div>
        )}

        {/* Recipe detail expanded */}
        {activeRecipe && !loadingDetail && (
          <div style={{
            background: 'var(--clr-bg)', border: '1px solid var(--clr-border)',
            borderRadius: 'var(--r-xl)', padding: 'var(--sp-5)',
            marginBottom: 'var(--sp-5)',
          }}>
            {/* Detail header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
              <button onClick={() => { setActiveRecipe(null); setDetailError(''); }} style={{
                background: 'none', border: '1.5px solid var(--clr-border)',
                borderRadius: 'var(--r-lg)', padding: '8px var(--sp-3)',
                fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', fontWeight: 600,
                color: 'var(--clr-mid)', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                ← Back to history
              </button>

              {/* Save button */}
              <button
                onClick={() => saveRecipe(activeRecipe.temp_key, activeRecipe.id)}
                disabled={saving || savedMap[activeRecipe.id]}
                style={{
                  background: savedMap[activeRecipe.id]
                    ? 'linear-gradient(135deg,#2A9D5C,#1e7a47)'
                    : 'linear-gradient(135deg,var(--clr-primary),var(--clr-primary-dark))',
                  border: 'none', borderRadius: 'var(--r-lg)',
                  padding: '10px var(--sp-4)',
                  fontFamily: 'var(--font-body)', fontSize: 'var(--fs-sm)', fontWeight: 700,
                  color: '#fff', cursor: savedMap[activeRecipe.id] ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: savedMap[activeRecipe.id] ? '0 4px 14px rgba(42,157,92,.4)' : 'var(--shadow-accent)',
                  transition: 'all 0.2s', opacity: saving ? 0.7 : 1,
                }}
              >
                {saving
                  ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
                  : savedMap[activeRecipe.id] ? <>✓ Saved to collection</> : <>♥ Save Recipe</>}
              </button>
            </div>

            {/* Recipe content */}
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 700, color: 'var(--clr-dark)', letterSpacing: '-0.03em', marginBottom: 'var(--sp-2)' }}>
              {activeRecipe.title}
            </h2>
            <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-mid)', lineHeight: 1.7, marginBottom: 'var(--sp-4)' }}>
              {activeRecipe.description}
            </p>

            {/* Ingredients */}
            {activeRecipe.ingredients?.length > 0 && (
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clr-primary)', marginBottom: 'var(--sp-2)' }}>
                  Ingredients
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                  {activeRecipe.ingredients.map((ing, i) => (
                    <div key={i} style={{
                      background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
                      borderRadius: 'var(--r-md)', padding: '8px 12px',
                      fontSize: 'var(--fs-sm)', color: 'var(--clr-dark)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ color: 'var(--clr-primary)', fontWeight: 700 }}>–</span>
                      {ing}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            {activeRecipe.instructions?.length > 0 && (
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clr-primary)', marginBottom: 'var(--sp-3)' }}>
                  Instructions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  {activeRecipe.instructions.map((step, i) => (
                    <HistoryStepItem
                      key={i}
                      step={step}
                      stepIndex={i + 1}
                      recipeId={activeRecipe.id}
                      recipeTitle={activeRecipe.title}
                      token={token}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* History list grid */}
        {!loading && !activeRecipe && historyList.length > 0 && (
          <>
            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--clr-light)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 'var(--sp-3)' }}>
              {historyList.length} recipe{historyList.length !== 1 ? 's' : ''} generated
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--sp-3)' }}>
              {historyList.map((item, idx) => (
                <div key={item.id || idx} style={{
                  background: 'var(--clr-bg)', border: '1px solid var(--clr-border)',
                  borderRadius: 'var(--r-lg)', padding: 'var(--sp-4)',
                  display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--fs-h3)', color: 'var(--clr-dark)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    {item.title}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: 'var(--sp-2)' }}>
                    {/* View button */}
                    <button onClick={() => openDetail(item)} style={{
                      flex: 1, background: 'var(--clr-surface)', border: '1.5px solid var(--clr-border)',
                      borderRadius: 'var(--r-md)', padding: '8px 12px',
                      fontFamily: 'var(--font-body)', fontSize: 'var(--fs-xs)', fontWeight: 600,
                      color: 'var(--clr-mid)', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--clr-dark)'; e.currentTarget.style.color = 'var(--clr-dark)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--clr-border)'; e.currentTarget.style.color = 'var(--clr-mid)'; }}
                    >
                      View Recipe →
                    </button>

                    {/* Quick save button */}
                    <button
                      onClick={() => saveRecipe(item.temp_key, item.id)}
                      disabled={saving || savedMap[item.id]}
                      title={savedMap[item.id] ? 'Saved' : 'Save to collection'}
                      style={{
                        width: 36, height: 36, flexShrink: 0,
                        background: savedMap[item.id] ? 'rgba(42,157,92,.12)' : 'rgba(232,83,26,.08)',
                        border: `1.5px solid ${savedMap[item.id] ? 'rgba(42,157,92,.30)' : 'rgba(232,83,26,.20)'}`,
                        borderRadius: 'var(--r-md)',
                        color: savedMap[item.id] ? '#2A9D5C' : 'var(--clr-primary)',
                        cursor: savedMap[item.id] ? 'default' : 'pointer',
                        fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}
                    >
                      {savedMap[item.id] ? '✓' : '♥'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ── Step item with explain ─────────────────────────────────────────────────
function HistoryStepItem({ step, stepIndex, recipeId, recipeTitle, token }) {
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
    <div style={{
      background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
      borderRadius: 'var(--r-md)', padding: 'var(--sp-3)',
    }}>
      <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
        <span style={{
          minWidth: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg,var(--clr-primary),var(--clr-primary-dark))',
          color: '#fff', fontSize: '12px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {stepIndex}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: 'var(--clr-dark)', marginBottom: '4px' }}>
            {step.step}
          </div>
          {step.description && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-mid)', lineHeight: 1.6 }}>
              {step.description}
            </div>
          )}
          {step.timing && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-amber)', fontWeight: 600, marginTop: '4px' }}>
              ⏱ {step.timing}
            </div>
          )}
        </div>
        <button onClick={explain} disabled={explaining} style={{
          background: showExplanation ? 'rgba(232,83,26,.10)' : 'var(--clr-surface2)',
          border: `1.5px solid ${showExplanation ? 'rgba(232,83,26,.25)' : 'var(--clr-border)'}`,
          borderRadius: 'var(--r-sm)', padding: '4px 10px', flexShrink: 0,
          fontFamily: 'var(--font-body)', fontSize: '10px', fontWeight: 700,
          color: showExplanation ? 'var(--clr-primary)' : 'var(--clr-light)',
          cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.04em', textTransform: 'uppercase',
        }}>
          {explaining
            ? <div className="spinner-dark" style={{ width: 10, height: 10, borderWidth: 1.5 }} />
            : explanation ? (showExplanation ? '🔬 Hide' : '🔬 Show') : '🔬 Explain'}
        </button>
      </div>

      {explainErr && (
        <div style={{ fontSize: 'var(--fs-xs)', color: '#C0153A', marginTop: '8px', paddingLeft: '40px' }}>
          ⚠ {explainErr}
        </div>
      )}

      {showExplanation && explanation && (
        <HistoryExplanationPanel explanation={explanation} />
      )}
    </div>
  );
}

// ── Explanation panel (light theme) ──────────────────────────────────────
function HistoryExplanationPanel({ explanation }) {
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
      marginTop: 'var(--sp-3)', marginLeft: '40px',
      background: 'var(--clr-surface2)', border: '1px solid var(--clr-border)',
      borderRadius: 'var(--r-md)', padding: 'var(--sp-3)',
      display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--clr-primary)' }}>
        🔬 Culinary Science
      </div>

      {fields.map(({ key, label }) =>
        explanation[key] ? (
          <div key={key}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--clr-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              {label}
            </div>
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--clr-mid)', lineHeight: 1.7 }}>
              {explanation[key]}
            </div>
          </div>
        ) : null
      )}

      {explanation.common_errors?.length > 0 && (
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--clr-light)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            ❌ Common Errors & Fixes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {explanation.common_errors.map((err, i) => (
              <div key={i} style={{
                padding: '10px 12px', background: '#FFEDED',
                borderRadius: 'var(--r-sm)', border: '1px solid rgba(224,36,61,.15)',
              }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: '#C0153A', fontWeight: 600, marginBottom: '4px' }}>
                  ✗ {err}
                </div>
                {explanation.how_to_fix_errors?.[i] && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: '#2A9D5C' }}>
                    ✓ {explanation.how_to_fix_errors[i]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}