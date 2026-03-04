from mongoengine import (
    Document,
    StringField,
    IntField,
    UUIDField,
    DateTimeField,
    BooleanField,
    ReferenceField)
from datetime import datetime
import uuid
import random
import string

from ODM.users import User


def generate_code(length=6)->str:
     return ''.join(random.choices(string.digits, k=length))

def generate_uuid():
    return uuid.uuid4()

class Mail(Document):
    user_id = ReferenceField(User,required=True)
    type = StringField(required=True,choices=["verification","reset"], default="verification")
    code = StringField(required=True,default=generate_code)
    token = UUIDField(required=True,default=generate_uuid)
    is_used = BooleanField(required=True,default=False)
    created_at = DateTimeField(default=datetime.utcnow)

    def __str__(self):
        return f"<Mail {self.id}>"
    
    def json(self):
        return {
            "user_id":self.user_id,
            "type":self.type,
            "code":self.code,
            "token":str(self.token),
            "is_used":self.is_used,
            "created_at":self.created_at
        }