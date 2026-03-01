from mongoengine import (
    Document,
    StringField,
    EmailField,
    DateTimeField,
    BooleanField,
    ReferenceField,
    ListField
)
from datetime import datetime


class User(Document):
    username = StringField(required=True)
    email = EmailField(required=True, unique=True)
    password = StringField(required=True, min_length=6)
    is_verified = BooleanField(default=False)
    saved_recipes = ListField(ReferenceField("SavedRecipe", required=False))
    created_at = DateTimeField(default=datetime.utcnow)

    def __str__(self):
        return f"<User {self.id}>"
    
    def json(self):
        return {
            "id": str(self.id),
            "username": self.username,
            "email": self.email,
            "is_verified": self.is_verified,
            # "saved_recipes": saved_recipes_ids,
            "created_at": self.created_at.isoformat() if self.created_at else None  # Format the date
        }