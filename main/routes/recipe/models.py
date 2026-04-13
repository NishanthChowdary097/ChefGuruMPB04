from flask_restx import fields
from main.routes.recipe import recipe_ns


step_model = recipe_ns.model(
    "RecipeStep",
    {
        "step_number": fields.Integer,
        "step": fields.String,
        "timing": fields.String,
        "description": fields.String,
        "explanation": fields.Raw(required=False)
    }
)


recipe_model = recipe_ns.model(
    "Recipe",
    {
        "id": fields.String,
        "temp_key": fields.String,
        "title": fields.String,
        "description": fields.String,
        "ingredients": fields.List(fields.String),
        "instructions": fields.Raw,
        "language": fields.String
    }
)


generate_input_model = recipe_ns.model(
    "GenerateInput",
    {
        "ingredients": fields.List(fields.String, required=True),
        "language": fields.String(required=True, default="English")
    }
)


explain_input_model = recipe_ns.model(
    "ExplainStepInput",
    {
        "step_number": fields.Integer(required=True),
        "context": fields.String(required=True),
        "recipe_id": fields.String(required=True)
    }
)


save_input_model = recipe_ns.model(
    "SaveRecipeInput",
    {
        "temp_key": fields.String(required=True)
    }
)