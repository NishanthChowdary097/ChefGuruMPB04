from flask_restx import Namespace
from flask import Blueprint

user_ns = Namespace(
    "user",
    description="User authentication services"
)
user_bp = Blueprint("user_pages", __name__)

from auth.routes.user import routes