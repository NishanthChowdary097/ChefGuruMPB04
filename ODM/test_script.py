from mongoengine import connect
from mongoengine.base.common import _document_registry
from faker import Faker
<<<<<<< HEAD
import os
from dotenv import load_dotenv
=======
>>>>>>> 8868936da80f3e0a9ed71cb858338daf5318005c

from ODM import *
# ----------------------------
# Database Connection
# ----------------------------
<<<<<<< HEAD
load_dotenv()
connect(
    db="chefguru",
    host=os.getenv("MONGO_URI")
)
=======
connect(
    db="chefguru",
    host="mongodb+srv://amethyst88:Nigger123@cluster0.43osksu.mongodb.net/"
)

>>>>>>> 8868936da80f3e0a9ed71cb858338daf5318005c
f = Faker()

def initialize_all_collections():
    """
    Ensure indexes for all MongoEngine Documents.
    Collections will be created automatically on first insert.
    """
    for cls in _document_registry.values():
        if cls._meta.get("abstract"):
            continue
        # cls.ensure_indexes()
        print(f"Ensured indexes for: {cls._get_collection_name()}")

def clear_all_collections(confirm: bool = False):
    """
    Drop all non-abstract MongoEngine collections.
    WARNING: This permanently deletes all data.
    """
    if not confirm:
        raise RuntimeError(
            "Refusing to clear database. "
            "Call clear_all_collections(confirm=True) to proceed."
        )

    for cls in _document_registry.values():
        if cls._meta.get("abstract"):
            continue

        collection = cls._get_collection()
        collection.drop()
        print(f"Dropped collection: {cls._get_collection_name()}")

# ----------------------------
# Example Usage
# ----------------------------
if __name__ == "__main__":
    clear_all_collections(confirm=True)
    # initialize_all_collections()

    # user = User(username=f.user_name(),password=f.password(),email=f.email()).save()
    # print(user.id)

    # mail = Mail(user_id=user).save()
    # print(mail.code,mail.uuid)
