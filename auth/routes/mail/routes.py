from flask_restx import Resource
from flask import redirect

from auth.routes.mail import mail_ns
from auth.routes.mail.models import mail_models
from auth.routes.helpes import generate_tokens
from auth.extensions import limiter

from ODM import Mail

models = mail_models(mail_ns)

@mail_ns.route("/verify/<user_id>/<uuid:token>")
class VerifyByToken(Resource):

    @limiter.limit("10 per minute")
    @mail_ns.response(200, "User verified successfully", models["response"]["user"])
    @mail_ns.response(400, "Invalid or expired token", models["response"]["error"])
    @mail_ns.response(404, "Mail not found", models["response"]["error"])
    def get(self, user_id, token):
        mail = Mail.objects(user_id=user_id, token=token).first()

        if not mail:
            return {"message": "Invalid verification link"}, 404

        if mail.is_used:
            return {"message": "Token already used"}, 400

        from datetime import datetime, timedelta
        if mail.created_at < datetime.utcnow() - timedelta(minutes=15):
            return {"message": "Token expired"}, 400

        mail.is_used = True
        mail.save()

        user = mail.user_id
        user.is_verified = True
        user.save()

        return redirect("/login")