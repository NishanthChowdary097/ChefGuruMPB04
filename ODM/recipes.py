from mongoengine import (
    Document, EmbeddedDocument,
    StringField, IntField, FloatField,
    DateTimeField, ReferenceField, ListField,
    EmbeddedDocumentField, DictField
)
from datetime import datetime


class Ingredient(Document):
    name = StringField(required=True, unique=True)
    unit = StringField()  # grams, cups, tsp
    calories_per_unit = FloatField()

    meta = {
        "collection": "ingredients",
        "indexes": ["name"]
    }

class RecipeIngredient(EmbeddedDocument):
    ingredient = ReferenceField(Ingredient, required=True)
    quantity = FloatField(required=True)

class Recipe(Document):
    user = ReferenceField("User", required=True)

    title = StringField(required=True)
    description = StringField()

    ingredients = ListField(
        EmbeddedDocumentField(RecipeIngredient)
    )

    instructions = ListField(StringField())  # step-by-step
    prep_time = IntField()   # minutes
    cook_time = IntField()   # minutes
    servings = IntField()

    nutrition_info = DictField()  # calories, protein, fat, etc.
    generation_prompt = StringField()

    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "recipes",
        "indexes": ["user", "created_at"]
    }

class RecipeRating(Document):
    user = ReferenceField("User", required=True)
    recipe = ReferenceField(Recipe, required=True)

    rating = IntField(min_value=1, max_value=5)
    comment = StringField()

    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "recipe_ratings",
        "indexes": ["user", "recipe"]
    }

class SavedRecipe(Document):
    user = ReferenceField("User", required=True)
    recipe = ReferenceField(Recipe, required=True)

    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "saved_recipes",
        "indexes": ["user", "recipe"]
    }

