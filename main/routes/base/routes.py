from flask_restx import Resource

from main.routes.base import base_ns, base_bp
from main.extensions import limiter

@base_ns.route("/")
class VerifyByToken(Resource):
    @limiter.limit("10 per minute")
    @base_ns.response(200, "Server live")
    def get(self):
        return "OK"

@base_bp.route('/')
@limiter.limit("10 per minute")
def index():
    return {
        "status":"alive",
        "server":__name__
    }, 200