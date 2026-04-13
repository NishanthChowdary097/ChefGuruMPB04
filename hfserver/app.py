import sys
sys.stdout.reconfigure(encoding='utf-8')
from werkzeug.serving import run_simple
import os
import json
import logging
import ast
import re
import torch
from flask import Flask, render_template, request, jsonify
# IMPORTANT: Set LD_LIBRARY_PATH for CUDA before importing llama_cpp
# os.environ['LD_LIBRARY_PATH'] = '/usr/local/cuda/lib64:' + os.environ.get('LD_LIBRARY_PATH', '')
from flask_cors import CORS
from llama_cpp import Llama
from sentence_transformers import SentenceTransformer, CrossEncoder
import chromadb
from chromadb.config import Settings
import google.generativeai as genai


GEMINI_API_KEY = "AIzaSyCgkYLSqEE6TpEby4oVXBjHSJ-AJIq3a3U"
genai.configure(api_key=GEMINI_API_KEY)
gem_model = genai.GenerativeModel("gemini-3-flash-preview")
# from pyngrok import ngrok

import threading
llm_lock = threading.Lock()

# --- CONFIGURATION ---
MODEL_PATH = "./my_recipe_model.gguf"
DB_PATH = "./chroma_db_persistent"
CONTEXT_SIZE = 2048                       # Context window size
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Logging (File only)
logging.basicConfig(
    filename="app_log.txt",
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# Tell Flask to use the templates folder stored in your Google Drive
TEMPLATE_DIR = "./templates"
app = Flask(__name__, template_folder=TEMPLATE_DIR)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- GLOBAL RESOURCES ---
llm = None
embedding_model = None
cross_encoder = None
collection = None

# --- HELPER: TEXT CLEANING ---
def extract_json_block(text):
    """Extracts first valid JSON object from LLM output."""
    try:
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if not match:
            return None
        return match.group(0)
    except Exception:
        return None

def parse_llm_json(text):
    """Safely parses JSON from LLM output."""
    if not text:
        return None
    text = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        extracted = extract_json_block(text)
        return json.loads(extracted) if extracted else None

# --- HELPER: LOCAL LLM CALLER ---
def call_local_llm(prompt, max_tokens=2048, json_mode=True):
    try:
                
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": prompt}
        ]

        response_format = {"type": "json_object"} if json_mode else None

        with llm_lock:
            print("🔒 Acquired LLM lock for generation.")
            output = llm.create_chat_completion(
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.1,
                response_format=response_format
            )
        print("🔓 Released LLM lock after generation.")

        # Verify we actually got a response before reading it
        if output is None:
            logging.error("❌ Model returned None (Possible OOM or Context Limit reached)")
            return None

        if 'choices' not in output or len(output['choices']) == 0:
            logging.error("❌ Model returned empty choices list")
            return None

        return output['choices'][0]['message']['content']
    except Exception as e:
        logging.error(f"LLM Generation Error: {e}")
        return None

# --- CORE LOGIC ---
def load_resources():
    global llm, embedding_model, cross_encoder, collection

    print("⏳ Loading Resources... (This may take a minute)")

    # 1. Load Database with Strict RAM Limiter
    try:
        print(f"📂 Connecting to Database with 4GB RAM Limit...")
        client = chromadb.PersistentClient(
            path=DB_PATH,
            settings=Settings(
                anonymized_telemetry=False,
                is_persistent=True,
                chroma_segment_cache_policy="LRU",     # Lazy Loading
                chroma_memory_limit_bytes=4000000000   # 4GB Hard Limit
            )
        )
        collection = client.get_collection(name="recipes")
        print(f"✅ Database Loaded: {collection.count()} recipes.")
    except Exception as e:
        print(f"❌ Database Error: {e}")
        raise e

    # 2. Load Models
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
    print("✅ Embedding Model Loaded.")

    cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", device="cpu")
    print("✅ CrossEncoder Loaded.")

    # 3. Load Llama 3.1 (GPU)
    print(f"⏳ Loading Llama from {MODEL_PATH}...")
    llm = Llama(
        model_path=MODEL_PATH,
        n_ctx=2048,
        n_gpu_layers=20,  # Use all GPU layers
        n_threads=os.cpu_count(),
        f16_kv=True,
        verbose=False,
        n_batch=256
    )
    print(f"✅ Llama 3.1 Loaded on {DEVICE}!")

def expand_query(ingredients):
    """
    Step 1: Validate ingredients and generate a search query.
    Returns: (status_code, query_string)
    """
    ingredients_str = ", ".join(ingredients)
    print(f"🔍 [Query Expansion] Analyzing: {ingredients_str}")

    prompt = f"""
You are a STRICT ingredient compatibility validator and neutral search query generator.

Your task is NOT to be creative.
Your task is NOT to invent specific dishes.

You must FIRST decide if the given ingredients can realistically form a COMMON, PRACTICAL, and TRADITIONAL dish that people normally cook.

DO NOT invent fusion dishes.
DO NOT combine unrelated cuisines.
DO NOT be experimental.
DO NOT force a recipe when it is unnatural.
DO NOT assume specific cuisines, dish names, or cooking styles.

---

### VALIDATION RULES

Return 422 if ANY of the following are true:

1. Ingredients belong to incompatible cuisines or food traditions.
2. The combination is not commonly used in real-world cooking.
3. The dish would be considered unusual, forced, or novelty.
4. The recipe would require heavy imagination to justify.
5. The combination is rarely or never seen in standard cookbooks.

Examples that MUST return 422:
- chicken + idli
- pasta + chocolate
- sushi + paneer
- burger + rasgulla
- ice cream + curry

Only return 201 if the ingredients naturally fit into a known, commonly cooked type of dish.

---

### QUERY GENERATION RULES

If status_code = 201:

Generate a GENERIC, DESCRIPTIVE cooking query.

The query MUST:
- Be neutral and non-specific
- Not mention any dish name (no pasta, curry, pizza, etc.)
- Not assume cuisine
- Describe taste and usefulness
- Focus on "making a dish with these ingredients"

Use patterns like:
- "a savory homemade dish with ..."
- "a simple and tasty recipe using ..."
- "how to cook a delicious meal with ..."
- "easy traditional recipe with ..."

DO NOT include:
- Dish names
- Country names
- Restaurant-style terms
- Trendy/fusion words

If status_code = 422:
query_string must be exactly: "unprocessable"

---

### OUTPUT FORMAT (MANDATORY)

Return ONLY a valid Python list with exactly two elements:

[status_code, query_string]

No explanations.
No markdown.
No extra text.

---

### INPUT
Ingredients: {ingredients_str}
"""

    response = call_local_llm(prompt, max_tokens=100, json_mode=False)
    print(f"   ↳ LLM Expansion Output: {response}") # <--- LOGGING ADDED

    try:
        result = ast.literal_eval(response)
        if isinstance(result, list) and len(result) == 2:
            return result[0], result[1]
    except:
        pass

    return 201, f"Recipe with {ingredients_str}"

def get_rag_context(query):
    """
    Step 2: Search DB -> Re-rank results -> Return top matches.
    """
    print(f"🔎 [RAG Search] Looking for: '{query}'")

    # Embed & Search
    query_emb = embedding_model.encode(query).tolist()
    results = collection.query(query_embeddings=[query_emb], n_results=10)

    if not results['documents']:
        print("   ⚠️ No documents found in DB.")
        return []

    # Re-ranking
    candidates = []
    for i, meta in enumerate(results['metadatas'][0]):
        candidates.append(meta)

    # Create pairs for CrossEncoder
    pairs = [[query, f"{c.get('title')} {c.get('ingredients')}"] for c in candidates]

    scores = cross_encoder.predict(pairs)

    # Sort by score
    scored_recipes = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)

    top_3 = [r for score, r in scored_recipes[:3]]
    print(f"   ✅ found {len(top_3)} relevant recipes.")
    return top_3

def clean_json(text):
    """Strip markdown code fences and extract JSON."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?", "", text, flags=re.MULTILINE)
    text = re.sub(r"```$", "", text, flags=re.MULTILINE)
    return text.strip()

# --- FLASK ROUTES ---
@app.route('/')
def home():
    return render_template('ui.html')

@app.route('/health')
def health():
    try:
        gpu = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    except:
        gpu = "Unavailable"

    return jsonify({"status": "active", "gpu": gpu})

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        ingredients = data.get('ingredients', [])
        language = data.get('language', 'English')

        # --- 1. STRICT INPUT VALIDATION ---
        # Must be a list
        if not ingredients or not isinstance(ingredients, list):
            print("❌ Input Error: Not a list")
            return jsonify({"error": "Invalid input format. Expected a list of ingredients."}), 400

        # Must contain ONLY strings
        if not all(isinstance(i, str) for i in ingredients):
            print("❌ Input Error: List contains non-string items")
            return jsonify({"error": "Invalid ingredient format. All items must be strings."}), 400
        
        # Must be valid language
        if not isinstance(language, str) or not language.strip():
            return jsonify({"error": "Invalid language"}), 400
        
        language = language.strip()

        # Clean whitespace
        ingredients = [i.strip() for i in ingredients if i.strip()]

        if not ingredients:
             return jsonify({"error": "List cannot be empty."}), 400

        logging.info(f"Request: {ingredients}")

        # --- 2. Query Expansion ---
        status, query = expand_query(ingredients)
        if status == 422:
            print("⛔ Compatibility Check Failed.")
            return jsonify({
                "error": "These ingredients don't seem compatible for a standard dish.",
                "reason": "Compatibility Check Failed"
            }), 422

        # --- 3. RAG Context Retrieval ---
        context_recipes = get_rag_context(query)

        context_str = "\n".join([
            f"Reference: {r.get('title')}\nIngredients: {r.get('ingredients')}\nMethod: {r.get('instructions')[:500]}..."
            for r in context_recipes
        ])

        # --- 4. Final Generation ---
        prompt = f"""
### CRITICAL INSTRUCTION ###
YOU MUST RETURN ONLY VALID JSON.
NO MARKDOWN.
NO EXTRA TEXT.
NO EXPLANATIONS.
NO COMMENTS.

IF YOU OUTPUT ANYTHING OUTSIDE JSON, THE RESPONSE IS INVALID.

---

### ROLE ###
You are a STRICT recipe generator.

Your task is to generate ONE complete recipe using ONLY:
1. The user-provided ingredients
2. The allowed kitchen essentials

---

### USER INGREDIENTS (ONLY ALLOWED MAIN INGREDIENTS)
{ingredients}

---

### ALWAYS AVAILABLE (ALLOWED ESSENTIALS)

• Salt, sugar, black/white pepper  
• Turmeric, red chili powder/flakes, cumin powder, coriander powder  
• Whole spices: cumin, mustard, coriander seeds, peppercorns, bay leaf, cloves, cardamom, cinnamon, fenugreek  
• Cooking mediums: vegetable oil, mustard oil, ghee, butter  
• Water  
• Aromatics: garlic, ginger, green chilies  
• Herbs & enhancers: curry leaves, kasuri methi, hing  
• Condiments: vinegar, lemon juice, tamarind, soy sauce  
• Basic staples: rice, wheat flour, maida, besan, common lentils  
• Common masalas: garam masala, sambar powder, rasam powder  
• Misc: baking soda/powder, cornstarch, tea, coffee  

NO OTHER ingredients are allowed.

---

### CONTEXT (REFERENCE ONLY)
{context_str}

DO NOT copy ingredients from context.
DO NOT introduce new items from context.

---

### STRICT RULES (MANDATORY)

1. ONLY use:
   - USER INGREDIENTS
   - ALLOWED ESSENTIALS

2. DO NOT add any new food items.

3. DO NOT infer hidden ingredients.

4. ALL ingredients must include exact quantities.

5. Instructions MUST include clear steps

---

### OUTPUT FORMAT (STRICT JSON ONLY)

Return EXACTLY this structure:

{{
  "title": "string",
  "description": "... (very detailed overview of taste, texture, method, and outcome)",
  "ingredients": [
    "Ingredient 1 with quantity",
    "Ingredient 2 with quantity"
  ],
  "instructions": [
    {{
      "step": "string describing the step in detail"
    }}
  ]
}}

---

### HARD CONSTRAINTS

- DO NOT include "description" at root level
- DO NOT include any extra keys
- DO NOT include markdown
- DO NOT include explanations
- OUTPUT MUST START WITH {{ AND END WITH }}

If any rule is violated, regenerate internally and correct it.

ONLY OUTPUT JSON.
"""


        print("🍳 Cooking recipe... (Generating with LLM)")

        raw_response = call_local_llm(
            prompt=prompt,
            max_tokens=800,
            json_mode=True
        )
        
        if language != "English":
            print(f"🌐 Translating recipe to {language} using Gemini...")
            translation_prompt = f"""
            You MUST translate ONLY the VALUES of the JSON into {language}.

            STRICT RULES:
            - DO NOT translate JSON keys
            - DO NOT change JSON structure
            - ONLY translate string values
            - Title, description, ingredients, and instructions VALUES must be in {language}
            - DO NOT use ANY English words in the translated VALUES
            - DO NOT mix languages
            - DO NOT use transliteration
            - Use ONLY native script of the language

            Keep the output STRICTLY in valid JSON format.

            Input:
            {{"title": "recipe_title", "description":"recipe_description", "ingredients":["ing1", "ing2"], "instructions":["inst1", "inst2"]}}

            Output format (example structure ONLY, do not translate keys):
            {{
            "title": "...",
            "description": "...",
            "ingredients": ["...", "..."],
            "instructions": ["...", "..."]
            }}
            """
            translation_response = gem_model.generate_content(translation_prompt + "\n\n" + raw_response)
            cleaned_translation = clean_json(translation_response.text)
            
            print("\n===== 🧠 FINAL RECIPE =====")
            print(cleaned_translation)
            print("=============================\n")
            recipe_data = parse_llm_json(cleaned_translation)
            recipe_data["language"] = language
            if not recipe_data:
                print("❌ Failed to parse JSON after translation")
                raise ValueError("Failed to generate valid JSON after translation")
            return jsonify(recipe_data)

        # --- LOGGING RAW OUTPUT ---
        print("\n===== 🧠 FINAL RECIPE =====")
        print(raw_response)
        print("=============================\n")

        recipe_data = parse_llm_json(raw_response)
        recipe_data["language"] = language

        if not recipe_data:
            print("❌ Failed to parse JSON")
            raise ValueError("Failed to generate valid JSON")

        return jsonify(recipe_data)

    except Exception as e:
        logging.error(f"Server Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/explain_step', methods=['POST'])
def explain_step():
    try:
        data = request.json
        step_text = data.get('step')
        recipe_context = data.get('context')
        language = data.get('language', 'English')

        if not step_text:
            return jsonify({"error": "No step provided"}), 400
        
        if not isinstance(language, str) or not language.strip():
            return jsonify({"error": "Invalid language"}), 400
        language = language.strip()

        # Smart Prompting: The "Why" and "How"
        prompt = f"""
You are a master-level culinary instructor and food science expert.

Your task is to deeply explain ONE cooking step so clearly and thoroughly that even a complete beginner cannot fail.

You must explain what is happening physically, visually, aromatically, and technically.

You must return ONLY valid JSON.
No markdown.
No commentary.
No extra text.
No backticks.

If you output anything outside JSON, the response is invalid.

---

CONTEXT:
The user is preparing: {recipe_context}

CURRENT STEP TO EXPLAIN:
"{step_text}"

---

Your explanation must include:

- What physically happens during this step
- What it should look like at different stages
- What it should smell like
- What it should sound like (if applicable)
- What texture changes occur
- Why this step is important in the cooking process
- What can go wrong
- How to fix common mistakes
- How to know if heat is too high or too low
- Professional tips to improve results
- Safety advice (if relevant)

Be specific. Avoid vague terms like "cook properly" or "until done".
Describe colors, bubbling patterns, thickness changes, aroma transitions, surface reactions, etc.

Assume the user has no intuition.

---

Return ONLY this JSON structure:

{{
  "step": "The exact step being explained",
  "purpose": "Why this step is necessary in the recipe and what it achieves structurally or chemically",
  "what_is_happening": "Detailed explanation of the physical and chemical changes occurring",
  "visual_indicators": "Detailed description of appearance from start to finish",
  "aroma_and_sound": "Expected smells and cooking sounds at different moments",
  "texture_transformation": "How texture changes during this step",
  "heat_control": "How to recognize correct heat level and how to adjust it",
  "common_errors": [
    "Mistake 1",
    "Mistake 2",
    "Mistake 3"
  ],
  "how_to_fix_errors": [
    "Fix for mistake 1",
    "Fix for mistake 2",
    "Fix for mistake 3"
  ],
  "expert_tip": "Professional-level improvement tip for best results",
  "safety_note": "Safety precautions relevant to this step"
}}

Before responding:
- Verify JSON is valid
- Ensure no markdown
- Ensure no commentary outside JSON
- Ensure all fields are filled
- Keep explanations dense but clear

### THE OUTPUT SHOULD BE STRICTLY IN JSON FORMAT. DO NOT RETURN ANYTHING ELSE. NO MARKDOWN, NO EXPLANATIONS, NO COMMENTARY. ONLY JSON.

"""
        # We use a slightly higher temperature for more descriptive/creative language
        # explanation = call_local_llm(prompt, max_tokens=900, json_mode=True)
        
        # if language != "English" and False:
        print(f"🌐 Translating explanation to {language} using Gemini...")
        translation_prompt = f"""
        You MUST translate ONLY the VALUES of the JSON into {language}.

        STRICT RULES:
        - DO NOT translate JSON keys
        - DO NOT change JSON structure
        - ONLY translate string values
        - Use ONLY native script of the language
        - DO NOT use ANY English words in the translated VALUES
        - DO NOT mix languages
        - DO NOT use transliteration

        Keep the output STRICTLY in valid JSON format.

        Input:
        {{"step": "...", "purpose": "...", "what_is_happening": "...", "visual_indicators": "...", "aroma_and_sound": "...", "texture_transformation": "...", "heat_control": "...", "common_errors": ["...", "...", "..."], "how_to_fix_errors": ["...", "...", "..."], "expert_tip": "...", "safety_note": "..." }}

        Output format (example structure ONLY, do not translate keys):
        {{
        "step": "...",
        "purpose": "...",
        "what_is_happening": "...",
        "visual_indicators": "...",
        "aroma_and_sound": "...",
        "texture_transformation": "...",
        "heat_control": "...",
        "common_errors": ["...", "...", "..."],
        "how_to_fix_errors": ["...", "...", "..."],
        "expert_tip": "...",
        "safety_note": "..."
            }}
            """
        
        explanation = gem_model.generate_content(prompt + translation_prompt + "\n\n", generation_config={"response_mime_type": "application/json"})
        cleaned_translation = clean_json(explanation.text)
        
        explained_data = parse_llm_json(cleaned_translation)
        # else:
        # explained_data = parse_llm_json(explanation)

        if not explained_data:
            print("❌ Failed to parse JSON")
            print(explanation)

        explained_data["language"] = language
        return jsonify(explained_data)

    except Exception as e:
        logging.error(f"Explanation Error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':

    load_resources()

    print("\n==================================================")
    print(f"🚀 AI Chef is running publicly at: http://localhost:5000")
    print("==================================================")
    print("⚠️  Update your frontend fetch URLs to use the link above!")

    run_simple(
        hostname="127.0.0.1",
        port=5000,
        application=app,
        use_reloader=False,
        use_debugger=False,
        threaded=True
    )


