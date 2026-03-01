from flask import jsonify, request
import structlog

logger = structlog.get_logger()

def register_error_handlers(app):

    @app.errorhandler(404)
    def not_found(e):
        logger.warning("404 Not Found", path=str(e))
        return jsonify({
            "error": "Not Found",
            "message": "The requested resource does not exist"
        }), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({
            "error": "Bad Request",
            "message": str(e)
        }), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({
            "error": "Unauthorized",
            "message": "Authentication required"
        }), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({
            "error": "Forbidden",
            "message": "You do not have access"
        }), 403

    @app.errorhandler(500)
    def internal_error(e):
        logger.exception("500 Internal Server Error")
        return jsonify({
            "error": "Internal Server Error",
            "message": "Something went wrong"
        }), 500

def register_enforsements(app):
    @app.before_request
    def enforce_json():
        if request.method in ("POST", "PUT", "PATCH"):
            if not request.is_json:
                return jsonify({
                    "error": "Unsupported Media Type",
                    "message": "Content-Type must be application/json"
                }), 415