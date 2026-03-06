from mongoengine import (
    Document, EmbeddedDocument,
    StringField, IntField, FloatField,
    DateTimeField, ReferenceField, ListField,
    EmbeddedDocumentField, DictField, BooleanField
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
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "unit": self.unit,
            "calories_per_unit": self.calories_per_unit
        }

class RecipeIngredient(EmbeddedDocument):
    ingredient = ReferenceField(Ingredient, required=True)
    quantity = FloatField(required=True)
    
    def to_dict(self):
        return {
            "ingredient": self.ingredient.to_dict() if self.ingredient else None,
            "quantity": self.quantity
        }

class Recipe(Document):
    user = ReferenceField("User", required=True)

    title = StringField(required=True)
    description = StringField()
    public = BooleanField(default=False)

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

    def to_dict(self):
        return {
            "id": str(self.id),
            "user": str(self.user.id) if self.user else None,
            "title": self.title,
            "description": self.description,
            "ingredients": [ri.to_dict() for ri in self.ingredients],
            "instructions": self.instructions,
            "public": self.public,
            "prep_time": self.prep_time,
            "cook_time": self.cook_time,
            "servings": self.servings,
            "nutrition_info": self.nutrition_info,
            "generation_prompt": self.generation_prompt,
            "created_at": self.created_at.isoformat() if self.created_at else None
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

    def to_dict(self):
        return {
            "id": str(self.id),
            "user": str(self.user.id),
            "recipe": str(self.recipe.id),
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat()
        }

class SavedRecipe(Document):
    user = ReferenceField("User", required=True)
    recipe = ReferenceField(Recipe, required=True)

    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "saved_recipes",
        "indexes": ["user", "recipe"]
    }
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "user": str(self.user.id),
            "recipe": str(self.recipe.id),
            "created_at": self.created_at.isoformat()
        }
