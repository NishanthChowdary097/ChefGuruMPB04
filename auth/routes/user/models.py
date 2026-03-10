from flask_restx import fields


def user_models(ns):
    signup_model = ns.model("UserSignup", {
        "email": fields.String(
            required=True,
            description="User email address",
            example="user@example.com"
        ),
        "password": fields.String(
            required=True,
            description="User password",
            min_length=8,
            example="StrongPassword123"
        ),
        "username": fields.String(
            required=True,
            description="Full name of the user",
            example="John Doe"
        )
    })

    login_model = ns.model("UserLogin", {
        "email": fields.String(
            required=True,
            description="User email address",
            example="user@example.com"
        ),
        "password": fields.String(
            required=True,
            description="User password",
            example="StrongPassword123"
        )
    })

    user_response = ns.model("UserResponse", {
        "id": fields.String(
            description="User ID",
            example="64fa9a0a12b9c23c9c0e01a1"
        ),
        "email": fields.String(
            description="User email",
            example="user@example.com"
        ),
        "username": fields.String(
            description="User name",
            example="John Doe"
        ),
        "created_at": fields.DateTime(
            description="Account creation timestamp",
            example="2025-01-01T10:00:00"
        )
    })

    token_response = ns.model("TokenResponse", {
        "access_token": fields.String(
            description="JWT access token"
        ),
        "refresh_token": fields.String(
            description="JWT refresh token"
        )
    })

    error_response = ns.model("ErrorResponse", {
        "error": fields.String(
            description="Error type",
            example="ValidationError"
        ),
        "message": fields.String(
            description="Error message",
            example="Invalid credentials"
        )
    })

    reset_request_model = ns.model("ResetPasswordRequest", {
        "email": fields.String(
            required=True,
            description="User email address",
            example="user@example.com"
        )
    })

    reset_confirm_model = ns.model("ResetPasswordConfirm", {
        "user_id": fields.String(
            required=True,
            description="User ID",
            example="64fa9a0a12b9c23c9c0e01a1"
        ),
        "token": fields.String(
            required=True,
            description="Reset token (UUID)",
            example="c2c7f6de-4f3a-4b71-9c0a-4f8d2a3a7c12"
        ),
        "password": fields.String(
            required=True,
            description="New password",
            min_length=8,
            example="NewStrongPassword123"
        )
    })

    return {
        "request": {
            "signup": signup_model,
            "login": login_model,
            "reset_request": reset_request_model,
            "reset_confirm": reset_confirm_model
        },
        "response": {
            "user": user_response,
            "token": token_response,
            "error": error_response
        }
    }