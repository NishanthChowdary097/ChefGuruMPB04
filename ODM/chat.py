from mongoengine import (
    Document,
    StringField,
    DateTimeField, ReferenceField,
)
from datetime import datetime

from ODM.users import User
from ODM.recipes import Recipe

class ChatSession(Document):
    user = ReferenceField(User, required=True)
    recipe = ReferenceField(Recipe, required=True)

    created_at = DateTimeField(default=datetime.utcnow)
    last_message_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "chat_sessions",
        "indexes": ["user", "recipe"]
    }

class ChatMessage(Document):
    chat_session = ReferenceField(ChatSession, required=True)

    sender_type = StringField(
        choices=["user", "assistant"],
        required=True
    )

    message = StringField(required=True)
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        "collection": "chat_messages",
        "indexes": ["chat_session", "created_at"]
    }
