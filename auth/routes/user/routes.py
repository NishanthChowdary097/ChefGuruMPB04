from flask import request, redirect, render_template
from flask_restx import Resource
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import timedelta, datetime

from auth.routes.user import user_ns, user_bp
from auth.routes.user.models import user_models
from auth.routes.helpes import generate_tokens, send_mail

from ODM import User, Mail

models = user_models(user_ns)

@user_ns.route("/login")
class Login(Resource):
    @user_ns.expect(models["request"]["login"], validate=True)
    @user_ns.response(200, "Login successful", models["response"]["user"])
    @user_ns.response(400, "Invalid input", models["response"]["error"])
    def post(self):
        data = request.get_json()
        user = User.objects(email=data['email']).first()
        if user.password != data['password']:
            return "invalid Credentials", 400
        
        if user.is_verified:
            return generate_tokens(user.id)
        else:
            return {"message":"Please verify the given email"}, 401

@user_ns.route("/signup")
class Signup(Resource):
    @user_ns.expect(models["request"]["signup"], validate=True)
    @user_ns.marshal_with(models["response"]["user"], code=201)
    @user_ns.response(401, "Unauthorized", models["response"]["error"])
    def post(self):
        data = request.get_json()
        user =  User(username=data['username'],password=data['password'],email=data['email']).save()
        mail = Mail(user_id=user).save()
        send_mail(mail,user)
        return user, 201

@user_ns.route("/reset-pwd")
class ResetPassword(Resource):

    @user_ns.expect(models["request"]["reset_request"], validate=True)
    @user_ns.response(200, "Reset mail sent")
    def post(self):
        data = request.get_json()
        email = data.get("email")
        user = User.objects(email=email).first()
        if user:
            mail = Mail(user_id=user, type="reset").save()
            send_mail(mail, user)

        return {"message": "If the email exists, a reset link was sent."}, 200
    
    @user_ns.expect(models["request"]["reset_confirm"], validate=True)
    @user_ns.response(200, "Password reset successful")
    @user_ns.response(400, "Invalid or expired token")
    def put(self):

        data = request.get_json()

        user_id = data.get("user_id")
        token = data.get("token")
        new_password = data.get("password")

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

# html page
@user_bp.route("/reset-pwd/<uuid:token>")
def reset_password_page(token):
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

@user_bp.route("/thankyou")
def thank_you_page():
    return render_template("thankyou_for_signup.html")

@user_ns.route("/logout")
class Logout(Resource):
    @jwt_required()
    def post(self):
        return {"message": "Logout successful"}, 200


@user_ns.route("/refresh")
class Refresh(Resource):
    @jwt_required(refresh=True)
    def post(self):
        return {"message": "Token refreshed"}, 200