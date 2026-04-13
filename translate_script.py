import os
import json
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# ── Configure Gemini ───────────────────────────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "your_api_key_here")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

# ── Supported languages ────────────────────────────────────────────────────
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "mr": "Marathi",
    "bn": "Bengali",
    "gu": "Gujarati",
    "pa": "Punjabi",
    "fr": "French",
    "es": "Spanish",
    "de": "German",
    "it": "Italian",
    "pt": "Portuguese",
    "ar": "Arabic",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "ru": "Russian",
}


def clean_json(text):
    """Strip markdown code fences and extract JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text, flags=re.MULTILINE)
    text = re.sub(r"```$", "", text, flags=re.MULTILINE)
    return text.strip()


# ── /translate/recipe ──────────────────────────────────────────────────────
@app.route("/translate/recipe", methods=["POST"])
def translate_recipe():
    """
    Translate a full recipe object to the requested language.

    Body:
    {
        "recipe": { ...recipe object... },
        "language": "hi"   // language code from SUPPORTED_LANGUAGES
    }

    Returns the same recipe structure with all text fields translated.
    """
    data = request.get_json()
    recipe = data.get("recipe")
    lang_code = data.get("language", "en")

    if not recipe:
        return jsonify({"message": "recipe is required"}), 400

    lang_name = SUPPORTED_LANGUAGES.get(lang_code)
    if not lang_name:
        return jsonify({
            "message": f"Unsupported language code: {lang_code}",
            "supported": SUPPORTED_LANGUAGES
        }), 400

    if lang_code == "en":
        return jsonify(recipe)

    prompt = f"""
You are a professional culinary translator. Translate the following recipe JSON into {lang_name}.

Rules:
- Translate ALL text values: title, description, ingredients, step, timing, description inside instructions.
- Keep the EXACT same JSON structure and all keys in English.
- Do NOT translate keys, only values.
- Keep numbers, units, and measurements as-is (e.g. "2 tbsp", "180°C").
- Return ONLY valid JSON, no markdown, no explanation.

Recipe JSON:
{json.dumps(recipe, ensure_ascii=False, indent=2)}
"""

    try:
        response = model.generate_content(prompt)
        cleaned = clean_json(response.text)
        translated = json.loads(cleaned)
        return jsonify(translated)
    except json.JSONDecodeError as e:
        return jsonify({
            "message": "Failed to parse Gemini response as JSON",
            "error": str(e),
            "raw": response.text[:500]
        }), 500
    except Exception as e:
        return jsonify({
            "message": "Translation failed",
            "error": str(e)
        }), 500


# ── /translate/explanation ─────────────────────────────────────────────────
@app.route("/translate/explanation", methods=["POST"])
def translate_explanation():
    """
    Translate a step explanation object to the requested language.

    Body:
    {
        "explanation": { ...explanation object... },
        "language": "ta"
    }

    Returns the same explanation structure with all text fields translated.
    """
    data = request.get_json()
    explanation = data.get("explanation")
    lang_code = data.get("language", "en")

    if not explanation:
        return jsonify({"message": "explanation is required"}), 400

    lang_name = SUPPORTED_LANGUAGES.get(lang_code)
    if not lang_name:
        return jsonify({
            "message": f"Unsupported language code: {lang_code}",
            "supported": SUPPORTED_LANGUAGES
        }), 400

    if lang_code == "en":
        return jsonify(explanation)

    prompt = f"""
You are a professional culinary science translator. Translate the following cooking step explanation JSON into {lang_name}.

Rules:
- Translate ALL text values including arrays (common_errors, how_to_fix_errors).
- Keep the EXACT same JSON structure and all keys in English.
- Do NOT translate keys, only values.
- Keep temperatures, units, and measurements as-is.
- Return ONLY valid JSON, no markdown, no explanation.

Explanation JSON:
{json.dumps(explanation, ensure_ascii=False, indent=2)}
"""

    try:
        response = model.generate_content(prompt)
        cleaned = clean_json(response.text)
        translated = json.loads(cleaned)
        return jsonify(translated)
    except json.JSONDecodeError as e:
        return jsonify({
            "message": "Failed to parse Gemini response as JSON",
            "error": str(e),
            "raw": response.text[:500]
        }), 500
    except Exception as e:
        return jsonify({
            "message": "Translation failed",
            "error": str(e)
        }), 500


# ── /translate/generate ────────────────────────────────────────────────────
@app.route("/translate/generate", methods=["POST"])
def generate_and_translate():
    """
    Generate a recipe from ingredients AND translate directly to requested language.
    Calls your Chef Guru AI backend first, then translates the result.

    Body:
    {
        "ingredients": ["chicken", "onion", "tomato"],
        "language": "hi",
        "chef_guru_url": "http://localhost:5001/api/app/recipe/generate",
        "token": "your_jwt_token"
    }
    """
    import requests as req

    data = request.get_json()
    ingredients = data.get("ingredients", [])
    lang_code = data.get("language", "en")
    chef_guru_url = data.get("chef_guru_url", "http://localhost:5001/api/app/recipe/generate")
    token = data.get("token", "")

    if not ingredients:
        return jsonify({"message": "ingredients is required"}), 400

    # Step 1 — call Chef Guru AI
    try:
        chef_res = req.post(
            chef_guru_url,
            json={"ingredients": ingredients},
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            },
            timeout=60
        )
        chef_res.raise_for_status()
        recipe = chef_res.json()
    except Exception as e:
        return jsonify({
            "message": "Failed to reach Chef Guru AI",
            "error": str(e)
        }), 502

    # Step 2 — translate if not English
    if lang_code == "en":
        return jsonify(recipe)

    lang_name = SUPPORTED_LANGUAGES.get(lang_code)
    if not lang_name:
        return jsonify({
            "message": f"Unsupported language: {lang_code}",
            "recipe_english": recipe
        }), 400

    prompt = f"""
You are a professional culinary translator. Translate the following recipe JSON into {lang_name}.

Rules:
- Translate ALL text values: title, description, ingredients, step, timing, description inside instructions.
- Keep the EXACT same JSON structure and all keys in English.
- Do NOT translate keys, only values.
- Keep numbers, units, and measurements as-is.
- Return ONLY valid JSON, no markdown, no explanation.

Recipe JSON:
{json.dumps(recipe, ensure_ascii=False, indent=2)}
"""

    try:
        response = model.generate_content(prompt)
        cleaned = clean_json(response.text)
        translated = json.loads(cleaned)
        # preserve temp_key and id from original
        translated["id"] = recipe.get("id")
        translated["temp_key"] = recipe.get("temp_key")
        return jsonify(translated)
    except json.JSONDecodeError as e:
        # return English version if translation fails
        recipe["translation_error"] = f"Translation failed, returning English: {str(e)}"
        return jsonify(recipe)
    except Exception as e:
        recipe["translation_error"] = str(e)
        return jsonify(recipe)


# ── /languages ─────────────────────────────────────────────────────────────
@app.route("/languages", methods=["GET"])
def get_languages():
    """Returns list of supported languages."""
    return jsonify({
        "languages": [
            {"code": code, "name": name}
            for code, name in SUPPORTED_LANGUAGES.items()
        ]
    })


# ── /health ────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "active", "model": "gemini-2.0-flash"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)