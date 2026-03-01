from flask import Flask
from flask_restx import Api
import structlog

from auth.extensions import jwt, setup_logging, init_db, mail
from auth.errors import register_error_handlers, register_enforsements

def get_app(configObject):
    
    app = Flask(__name__)

    app.config.from_object(configObject)
    
    setup_logging(level=configObject.LOGGING_LEVEL, is_production=configObject.LOG_MODE == "production", service_name="auth")
    logger = structlog.get_logger()
    
    logger.info('Configs loaded')

    register_error_handlers(app)
    logger.info('Error Handlers Registered')

    mail.init_app(app)
    logger.info('Initialized Mail')

    jwt.init_app(app)
    logger.info('Initialized JWT')

    init_db(app)
    logger.info('Connected to MongoDB')
    
    api = Api(
        app,
        title="Auth Service",
        doc=False if configObject.LOG_MODE == "production" else "/docs",
        version="1.0",
        description="Authentication Server APIs",
        prefix=f"{configObject.API_PREFIX}/auth"
    )

    from auth.routes.user import user_ns as user_endpoints
    api.add_namespace(user_endpoints,path="/user")

    # for html pages
    from auth.routes.user import user_bp as user_blueprint
    app.register_blueprint(user_blueprint, url_prefix=f"{configObject.API_PREFIX}/auth/user")

    from auth.routes.mail import mail_ns as mail_endpoints
    api.add_namespace(mail_endpoints, path="/mail")

    logger.info('Registered blueprints')

    register_enforsements(app)
    
    logger.info('Registered Enforsements')

    logger.info('App started')

    return app

