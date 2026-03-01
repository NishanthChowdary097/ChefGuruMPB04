from flask_restx import Namespace

mail_ns = Namespace(
    "mail",
    description="Email services"
)

from auth.routes.mail import routes