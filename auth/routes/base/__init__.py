from flask_restx import Namespace
from flask import Blueprint

base_ns = Namespace(
    "Base",
    description="Base services"
)

base_bp =Blueprint("base_resps", __name__)

from auth.routes.base import routes