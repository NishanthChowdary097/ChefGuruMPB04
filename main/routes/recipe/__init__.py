from flask_restx import Namespace

recipe_ns = Namespace(
    "recipe",
    description="Recipe services"
)

from main.routes.recipe import routes