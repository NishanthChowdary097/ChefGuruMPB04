

from datetime import timedelta
from flask_mail import Message
from flask import render_template, current_app
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import datetime

from auth.extensions import mail

def generate_tokens(user_id, remember_me=False):
    refresh_expires = timedelta(
        days=30 if remember_me else 7
    )

    access_token = create_access_token(
        identity=str(user_id)
    )

    refresh_token = create_refresh_token(
        identity=str(user_id),
        expires_delta=refresh_expires
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }

def send_mail(mailObj,userObj):
    if mailObj.type == "verification":
        html_body = render_template(
            "verification.html",
            USERNAME=userObj.username,
            # CODE=mailObj.code,
            VERIFY_LINK=current_app.config.get('FRONTEND_BASE_URL')+'/api/auth/mail/verify/'+str(userObj.id)+'/'+str(mailObj.token),
            CURRENT_YEAR=datetime.utcnow().year
        )
    else:
        html_body = render_template(
            "password_reset.html",
            USERNAME=userObj.username,
            # CODE=mailObj.code,
            RESET_LINK=current_app.config.get('FRONTEND_BASE_URL')+'/api/auth/user/reset-pwd/'+str(mailObj.token),
            CURRENT_YEAR=datetime.utcnow().year
        )

    msg = Message(
        subject="Reset Your Password" if mailObj.type!='verification' else 'Verify Your Email',
        recipients=[userObj.email],
        html=html_body
    )
    mail.send(msg)
