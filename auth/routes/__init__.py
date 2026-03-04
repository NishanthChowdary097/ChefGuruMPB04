from flask import Flask
from flask_restx import Api
import structlog
from werkzeug.middleware.proxy_fix import ProxyFix

from auth.extensions import jwt, setup_logging, init_db, mail, init_ratelimiter, init_redis
from auth.errors import register_error_handlers, register_enforsements

def get_app(configObject):
    
    app = Flask(__name__)

    app.config.from_object(configObject)
    
    if app.config.get("USE_PROXY",False):
        app.wsgi_app = ProxyFix(
            app.wsgi_app,
            x_for=app.config.get("PROXY_FIX_X_FOR", 1),
            x_proto=1,
            x_host=1,
            x_port=1,
        )

    
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

    init_redis(app)
    logger.info('Connected to Redis')

    init_ratelimiter(app)
    logger.info('Initialized Rate Limiting')
    
    api = Api(
        app,
        title="Auth Service",
        doc=False if configObject.LOG_MODE == "production" else "/docs",
        version="1.0",
        description="Authentication Server APIs",
        prefix=f"{configObject.API_PREFIX}/auth"
    )
    from auth.routes.base import base_bp as base_blueprint
    app.register_blueprint(base_blueprint, url_prefix=f"{configObject.API_PREFIX}/auth")

    from auth.routes.base import base_ns as base_endpoints
    api.add_namespace(base_endpoints, path="/auth")

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

