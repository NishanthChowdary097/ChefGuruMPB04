from flask_restx import Resource
from flask import request, jsonify
import json
from bson import ObjectId
import requests
import structlog
import time

from flask_jwt_extended import jwt_required, get_jwt_identity

from ODM import Recipe, RecipeIngredient, User, Ingredient

from main.extensions import redis_client, limiter
from main.routes.recipe import recipe_ns
from main.routes.recipe.models import *

from config import Config

logger = structlog.get_logger()

HF_API = Config.HF_API

_15_DAYS = 15 * 24 * 60 * 60


def call_ai(endpoint, payload):
    url = f"{HF_API}/{endpoint}"

    for _ in range(3):
        try:
            resp = requests.post(url, json=payload, timeout=45)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            time.sleep(1)

    raise Exception("AI service unavailable")


@recipe_ns.route("/generate")
class GenerateRecipe(Resource):

    @limiter.limit("5/minute")
    @jwt_required()
    @recipe_ns.expect(generate_input_model)
    @recipe_ns.marshal_with(recipe_model)
    def post(self):

        user_id = get_jwt_identity()
        data = request.json
        ingredients = data.get("ingredients")

        if not ingredients or not isinstance(ingredients, list):
            return {"message": "Ingredients must be a list"}, 400

        if len(ingredients) > 15:
            return {"message": "Too many ingredients"}, 400

        try:

            recipe_data = call_ai("generate", {"ingredients": ingredients})

            recipe_id = str(ObjectId())
            recipe_data["id"] = recipe_id

            instructions = []
            for idx, s in enumerate(recipe_data.get("instructions", [])):
                instructions.append({
                    "step_number": idx + 1,
                    "step": s.get("step"),
                    "timing": s.get("timing"),
                    "description": s.get("description"),
                    "explanation": {}
                })

            recipe_data["instructions"] = instructions

            temp_key = f"recipe_temp:{user_id}:{recipe_id}"
            recipe_data["temp_key"] = temp_key

            redis_client.set(
                temp_key,
                json.dumps(recipe_data),
                ex=_15_DAYS
            )

            for ing in recipe_data.get("ingredients", []):
                ing_name = ing.split("-")[0].strip().lower()

                if not Ingredient.objects(name__iexact=ing_name).first():
                    Ingredient(name=ing_name).save()
                    redis_client.sadd("ingredients_set", ing_name)

            logger.info("Recipe generated", user_id=user_id, recipe_id=recipe_id)

            return recipe_data

        except Exception as e:

            logger.error("Generate failed", error=str(e), user_id=user_id)

            return {
                "message": "Failed to generate recipe",
                "error": str(e)
            }, 500


@recipe_ns.route("/explain_step")
class ExplainStep(Resource):

    @jwt_required()
    @recipe_ns.expect(explain_input_model)
    def post(self):

        user_id = get_jwt_identity()

        data = request.json
        step_number = data.get("step_number")
        context = data.get("context")
        recipe_id = data.get("recipe_id")

        if not step_number or not context or not recipe_id:
            return {"message": "step_number, context, recipe_id required"}, 400

        try:

            step_text = None
            recipe = Recipe.objects(id=recipe_id, user=user_id).first()

            if recipe:
                steps = recipe.instructions

                if step_number < 1 or step_number > len(steps):
                    return {"message": "Invalid step_number"}, 400

                step_text = steps[step_number - 1]["step"]

            else:
                temp_key = f"recipe_temp:{user_id}:{recipe_id}"
                recipe_json = redis_client.get(temp_key)

                if not recipe_json:
                    return {"message": "Temporary recipe not found"}, 404

                try:
                    recipe_data = json.loads(recipe_json)
                except Exception:
                    redis_client.delete(temp_key)
                    return {"message": "Corrupted cache"}, 500

                steps = recipe_data.get("instructions", [])

                if step_number < 1 or step_number > len(steps):
                    return {"message": "Invalid step_number"}, 400

                step_text = steps[step_number - 1]["step"]

            explanation = call_ai(
                "explain_step",
                {
                    "step": step_text,
                    "context": context
                }
            )

            if recipe:
                recipe.instructions[step_number - 1]["explanation"] = explanation
                recipe.save()

            else:
                recipe_data["instructions"][step_number - 1]["explanation"] = explanation

                redis_client.set(
                    temp_key,
                    json.dumps(recipe_data),
                    ex=_15_DAYS
                )

            logger.info(
                "Step explained",
                step_number=step_number,
                recipe_id=recipe_id
            )

            return explanation

        except Exception as e:

            logger.error("Explain failed", error=str(e))

            return {
                "message": "Failed to explain step",
                "error": str(e)
            }, 500

@recipe_ns.route("/save_recipe")
class SaveRecipe(Resource):

    @jwt_required()
    @recipe_ns.expect(save_input_model)
    def post(self):
        user_id = get_jwt_identity()
        data = request.json
        temp_key = data.get("temp_key")

        if not temp_key:
            return {"message": "temp_key required"}, 400

        recipe_json = redis_client.get(temp_key)
        if not recipe_json:
            return {"message": "Temporary recipe not found"}, 404

        try:
            recipe_data = json.loads(recipe_json)
        except Exception:
            redis_client.delete(temp_key)
            return {"message": "Corrupted cache"}, 500

        user = User.objects(id=user_id).first()

        # Build ingredients
        ingredients_list = []
        for ing in recipe_data.get("ingredients", []):
            parts = ing.split("-")
            name = parts[0].strip().lower()
            quantity_str = parts[1].strip() if len(parts) > 1 else "0"

            ingredient = Ingredient.objects(name__iexact=name).first()
            ingredients_list.append(
                RecipeIngredient(
                    ingredient=ingredient,
                    quantity=str(quantity_str)  # store as string
                )
            )

        # Save Recipe
        recipe = Recipe(
            user=user,
            title=recipe_data.get("title"),
            description=recipe_data.get("description"),
            ingredients=ingredients_list,
            instructions=recipe_data.get("instructions")
        )
        recipe.save()
        redis_client.delete(temp_key)
        logger.info("Recipe saved", recipe_id=str(recipe.id))


        recipe_dict = recipe.to_dict()

        return jsonify(recipe_dict)

@recipe_ns.route("/saved")
class ListRecipes(Resource):

    @jwt_required()
    # @recipe_ns.marshal_list_with(recipe_model)
    def get(self):

        user_id = get_jwt_identity()

        recipes = Recipe.objects(user=user_id)

        return [r.to_dict() for r in recipes]


@recipe_ns.route("/search_ingredients")
class SearchIngredients(Resource):

    @jwt_required()
    def get(self):

        try:

            ingredients = list(redis_client.smembers("ingredients_set") or [])

            return {"ingredients": ingredients}

        except Exception as e:

            logger.error("Ingredient search failed", error=str(e))

            return {"message": "Failed to fetch ingredients"}, 500


@recipe_ns.route("/temp_recipes")
class ListTempRecipes(Resource):

    @jwt_required()
    def get(self):

        user_id = get_jwt_identity()

        try:

            pattern = f"recipe_temp:{user_id}:*"

            temp_recipes = []

            for key in redis_client.scan_iter(pattern):

                recipe_json = redis_client.get(key)

                if recipe_json:

                    recipe = json.loads(recipe_json)

                    temp_recipes.append({
                        "id": recipe.get("id"),
                        "title": recipe.get("title"),
                        "temp_key": recipe.get("temp_key")
                    })

            return {"recipes": temp_recipes}

        except Exception as e:

            logger.error("Temp recipe list failed", error=str(e))

            return {"message": "Failed"}, 500


@recipe_ns.route("/temp_recipes/<string:recipe_id>")
class GetTempRecipe(Resource):

    @jwt_required()
    def get(self, recipe_id):

        user_id = get_jwt_identity()

        try:

            key = f"recipe_temp:{user_id}:{recipe_id}"

            recipe_json = redis_client.get(key)

            if not recipe_json:
                return {"message": "Recipe not found"}, 404

            return json.loads(recipe_json)

        except Exception as e:

            logger.error("Fetch temp recipe failed", error=str(e))

            return {"message": "Failed"}, 500