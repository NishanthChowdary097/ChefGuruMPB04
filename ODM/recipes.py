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
    quantity = StringField(required=True)

    def to_dict(self):
        return {
            "ingredient": self.ingredient.to_dict(),
            "quantity": self.quantity
        }

class RecipeStep(EmbeddedDocument):
    step_number = IntField()
    step = StringField()
    timing = StringField()
    description = StringField()
    explanation = DictField()

    def to_dict(self):
        return {
            "step_number": self.step_number,
            "step": self.step,
            "timing": self.timing,
            "description": self.description,
            "explanation": self.explanation or {}
        }
    
class Recipe(Document):

    user = ReferenceField("User", required=True)

    title = StringField(required=True)
    description = StringField()

    public = BooleanField(default=False)

    ingredients = ListField(
        EmbeddedDocumentField(RecipeIngredient)
    )

    instructions = ListField(
        EmbeddedDocumentField(RecipeStep)
    )

    prep_time = IntField()
    cook_time = IntField()
    servings = IntField()

    generation_prompt = StringField()

    created_at = DateTimeField(default=datetime.utcnow)
    language = StringField(default="english")

    meta = {
        "collection": "recipes",
        "indexes": ["user", "-created_at"]
    }

    def to_dict(self):
        return {
            "id": str(self.id),
            "user": str(self.user.id),
            "title": self.title,
            "description": self.description,
            "ingredients": [i.to_dict() for i in self.ingredients],
            "instructions": [s.to_dict() for s in self.instructions],
            "prep_time": self.prep_time,
            "cook_time": self.cook_time,
            "servings": self.servings,
            "public": self.public,
            "created_at": self.created_at.isoformat(),
            "language": self.language
        }


# class SavedRecipe(Document):
#     user = ReferenceField("User", required=True)
#     recipe = ReferenceField(Recipe, required=True)

#     created_at = DateTimeField(default=datetime.utcnow)

#     meta = {
#         "collection": "saved_recipes",
#         "indexes": ["user", "recipe"]
#     }
    
#     def to_dict(self):
#         return {
#             "id": str(self.id),
#             "user": str(self.user.id),
#             "recipe": str(self.recipe.id),
#             "created_at": self.created_at.isoformat()
#         }
