from flask_restx import fields

def mail_models(ns):
    signup_model = ns.model("UserSignup", {
        "email": fields.String(
            required=True,
            description="User email address",
            example="user@example.com"
        ),
        "password": fields.String(
            required=True,
            description="User password",
            min_length=8
        ),
        "username": fields.String(
            required=True,
            description="Full name of the user"
        )
    })

    login_model = ns.model("UserLogin", {
        "email": fields.String(
            required=True,
            description="User email address"
        ),
        "password": fields.String(
            required=True,
            description="User password"
        )
    })

    user_response = ns.model("UserResponse", {
        "id": fields.String(description="User ID"),
        "email": fields.String,
        "username": fields.String,
        "created_at":fields.DateTime
    })

    token_response = ns.model("TokenResponse", {
        "access_token": fields.String,
        "refresh_token": fields.String
    })

    error_response = ns.model("ErrorResponse", {
        "error": fields.String,
        "message": fields.String
    })

    return {
        "request":{
            "signup": signup_model,
            "login": login_model
        },
        "response":{
            "user": user_response,
            "token": token_response,
            "error": error_response
        }
    }
