from flask import request, redirect, render_template, jsonify
from flask_restx import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from datetime import timedelta, datetime

from auth.routes.user import user_ns, user_bp
from auth.routes.user.models import user_models
from auth.routes.helpes import generate_tokens, send_mail
from auth.extensions import limiter

from ODM import User, Mail

models = user_models(user_ns)


@user_ns.route("/login")
class Login(Resource):

    @limiter.limit("5 per minute")
    @user_ns.expect(models["request"]["login"], validate=True)
    @user_ns.response(200, "Login successful", models["response"]["user"])
    @user_ns.response(400, "Invalid input", models["response"]["error"])
    def post(self):

        try:
            data = request.get_json()

            email = data.get("email")
            password = data.get("password")

            if not email or not password:
                return {"message": "Email and password required"}, 400

            user = User.objects(email=email).first()

            if not user:
                return {"message": "Invalid credentials"}, 400

            if user.password != password:
                return {"message": "Invalid credentials"}, 400

            if not user.is_verified:
                return {"message": "Please verify your email"}, 401

            return generate_tokens(user.id)

        except Exception as e:
            return {"message": "Login failed", "error": str(e)}, 500


@user_ns.route("/signup")
class Signup(Resource):
    @limiter.limit("3 per minute")
    @user_ns.expect(models["request"]["signup"], validate=True)
    @user_ns.marshal_with(models["response"]["user"], code=201)
    @user_ns.response(400, "User already exists")
    def post(self):

        try:
            data = request.get_json()

            email = data.get("email")

            existing_user = User.objects(email=email).first()
            if existing_user:
                return {"message": "Email already registered"}, 400

            user = User(
                username=data["username"],
                password=data["password"],
                email=email
            ).save()

            mail = Mail(user_id=user).save()
            send_mail(mail, user)

            return user, 201

        except Exception as e:
            return {"message": "Signup failed", "error": str(e)}, 500


@user_ns.route("/reset-pwd")
class ResetPassword(Resource):

    @limiter.limit("3 per minute")
    @user_ns.expect(models["request"]["reset_request"], validate=True)
    def post(self):

        try:
            data = request.get_json()
            email = data.get("email")

            user = User.objects(email=email).first()

            if user:
                mail = Mail(user_id=user, type="reset").save()
                send_mail(mail, user)

            return {"message": "If the email exists, a reset link was sent."}, 200

        except Exception as e:
            return {"message": "Reset request failed", "error": str(e)}, 500


    
    @user_ns.expect(models["request"]["reset_confirm"], validate=True)
    def put(self):

        try:
            data = request.get_json()

            user_id = data.get("user_id")
            token = data.get("token")
            new_password = data.get("password")

            if not user_id or not token or not new_password:
                return {"message": "Missing fields"}, 400

            mail = Mail.objects(
                user_id=user_id,
                token=token,
                type="reset"
            ).first()

            if not mail:
                return {"message": "Invalid reset link"}, 400

            if mail.is_used:
                return {"message": "Token already used"}, 400

            if mail.created_at < datetime.utcnow() - timedelta(minutes=15):
                return {"message": "Token expired"}, 400

            user = mail.user_id
            user.password = new_password
            user.save()

            mail.is_used = True
            mail.save()

            return {"message": "Password reset successful"}, 200

        except Exception as e:
            return {"message": "Password reset failed", "error": str(e)}, 500


@limiter.limit("10 per minute")
@user_bp.route("/reset-pwd/<uuid:token>")
def reset_password_page(token):

    try:
        mail = Mail.objects(token=token, type="reset").first()

        if not mail:
            return redirect("/login?error=invalid")

        if mail.is_used:
            return redirect("/login?error=used")

        if mail.created_at < datetime.utcnow() - timedelta(minutes=15):
            return redirect("/login?error=expired")

        user = mail.user_id

        return render_template(
            "password_reset_page.html",
            token=str(token),
            user_id=str(user.id),
            current_year=datetime.utcnow().year
        )

    except Exception:
        return redirect("/login?error=server")


@user_bp.route("/thankyou")
def thank_you_page():
    return render_template("thankyou_for_signup.html")


@user_ns.route("/logout")
class Logout(Resource):

    @jwt_required()
    def post(self):

        try:
            # Normally you would blacklist the JWT here
            return {"message": "Logout successful"}, 200

        except Exception as e:
            return {"message": "Logout failed", "error": str(e)}, 500


@user_ns.route("/refresh")
class Refresh(Resource):
        
    @limiter.limit("10 per minute")
    @jwt_required(refresh=True)
    def post(self):

        try:
            identity = get_jwt_identity()
            access_token = create_access_token(identity=identity)

            return {
                "access_token": access_token
            }, 200

        except Exception as e:
            return {"message": "Token refresh failed", "error": str(e)}, 500