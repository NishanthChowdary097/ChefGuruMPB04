import logging
import structlog
from structlog.stdlib import LoggerFactory
from structlog.processors import TimeStamper, format_exc_info, StackInfoRenderer
from structlog.dev import _pad
import logging.config
from typing import Dict, Any, Type
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from mongoengine import connect
import redis

jwt = JWTManager()
mail = Mail()
limiter = None
redis_client = None

def init_redis(app):
    global redis_client
    redis_client = redis.Redis(
        host=app.config["REDIS_HOST"],
        port=app.config.get("REDIS_PORT"),
        password=app.config.get("REDIS_PASSWORD"),
        db=app.config.get("REDIS_DB"),
        decode_responses=True
    )

def init_db(app):
    connect(db=app.config["MONGO_DB"],host=app.config["MONGO_URI"])

def init_ratelimiter(app):
    global limiter
    redis_host = app.config["REDIS_HOST"]
    redis_port = app.config.get("REDIS_PORT")
    redis_db = app.config.get("REDIS_RATE_LIMIT_DB")
    redis_password = app.config.get("REDIS_PASSWORD")
    redis_uri = f"redis://:{redis_password}@{redis_host}:{redis_port}/{redis_db}"

    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        storage_uri=redis_uri,
        default_limits=["200 per minute"]
    )

# LOGGING
class StandardPythonDevRenderer:
    """Custom renderer for development environment with colored output."""
    
    def __init__(self, pad_event: int = 30):
        self._pad_event = pad_event
        
    def color_for_level(self, level: str) -> str:
        """Get ANSI color code for log level."""
        return {
            "debug": "\033[34m",    # blue
            "info": "\033[32m",     # green
            "warning": "\033[33m",  # yellow
            "error": "\033[31m",    # red
            "critical": "\033[35m", # magenta
        }.get(level.lower().strip(), "\033[37m")  # default: white/gray

    def __call__(self, logger: Any, name: str, event_dict: Dict[str, Any]) -> str:
        """Format the log event with colors and proper padding."""
        # Extract key fields
        lvl = _pad(event_dict.pop("level", "-"), 8)
        msg = event_dict.pop("event", "")
        svc = event_dict.pop("svc", "")
        mod = event_dict.pop("module", "")
        ts = event_dict.pop("ts", "")

        # Format exception if present
        exc = format_exc_info(logger, name, event_dict)

        # Apply colors
        ts_colored = f"\033[90m{ts}\033[0m"  # gray
        lvl_color = self.color_for_level(lvl)
        lvl_formatted = f"{lvl_color}[{lvl:<8}]\033[0m"
        svc_colored = f"\033[36m{svc}\033[0m"  # cyan
        mod_colored = f"\033[32m{mod}\033[0m"  # green
        msg_bold = f"\033[1m{str(msg):<{str(self._pad_event)}}\033[0m"

        # Assemble log line
        main_string = f"{ts_colored}: {lvl_formatted} - {svc_colored} - {mod_colored} - {msg_bold}"
        extras = " ".join(f"{k}={v}" for k, v in event_dict.items())
        
        return f"{main_string} {extras}".strip()
        # return f"{main_string} {extras}\n{exc}" if exc else f"{main_string} {extras}".strip()


class BaseLogProcessor:
    """Collection of log processors for structlog."""
    
    # Default name mappings that can be overridden by child classes
    name_mapping = {
        "event": "msg",
        "level": "lvl",
        "module": "mod",
        "svc": "svc",
    }
    
    service_name = "service_name"
    
    @classmethod
    def set_service_name(cls, service_name: str) -> None:
        """Set the service name for this processor class."""
        cls.service_name = service_name
    
    @classmethod
    def get_name_mapping(cls) -> Dict[str, str]:
        """Get the name mapping for this processor class."""
        return cls.name_mapping.copy()
    
    @classmethod
    def add_service_name(cls, logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Add service name to log context."""
        event_dict["svc"] = cls.service_name
        return event_dict

    @classmethod
    def rename_keys(cls, logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Rename log fields to shorter versions."""
        mapping = cls.get_name_mapping()

        for old, new in mapping.items():
            if old in event_dict:
                event_dict[new] = event_dict.pop(old)
        return event_dict

    @staticmethod
    def level_to_numeric(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
        """Convert string log levels to numeric values."""
        level_map = {
            "critical": 50,
            "error": 40,
            "warning": 30,
            "info": 20,
            "debug": 10,
            "notset": 0,
        }
        if "lvl" in event_dict:
            event_dict["lvl"] = level_map.get(event_dict["lvl"].lower(), event_dict["lvl"])
        return event_dict


def get_base_processors(LogProcessorClass: Type[BaseLogProcessor]) -> list:
    """Get the base processors for structlog configuration."""
    return [
        structlog.stdlib.add_log_level,
        structlog.processors.CallsiteParameterAdder(
            parameters=[structlog.processors.CallsiteParameter.MODULE]
        ),
        TimeStamper(fmt="iso", utc=True, key="ts"),
        format_exc_info,
        StackInfoRenderer(),
        LogProcessorClass.add_service_name,
    ]


def get_production_processors(LogProcessorClass: Type[BaseLogProcessor]) -> list:
    """Get processors for production environment."""
    return [
        LogProcessorClass.rename_keys,
        LogProcessorClass.level_to_numeric,
        structlog.processors.JSONRenderer()
    ]


def get_development_processors(DevRendererClass: Type[StandardPythonDevRenderer]) -> list:
    """Get processors for development environment."""
    return [DevRendererClass()]


def setup_logging(
    level: str = "INFO",
    is_production: bool = False,
    service_name: str = "service_name",
    LogProcessorClass: Type[BaseLogProcessor] = BaseLogProcessor,
    DevRendererClass: Type[StandardPythonDevRenderer] = StandardPythonDevRenderer,
    additional_base_processors: list = []
) -> None:
    """
    Configure logging for the application.
    
    Args:
        level: Logging level (e.g., "INFO", "DEBUG")
        is_production: Whether to use production logging format
        service_name: Name of the service for logging context
        LogProcessorClass: Class to use for log processing
        DevRendererClass: Class to use for development rendering
    """
    # Configure standard logging
    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": level,
            "handlers": ["console"],
            "propagate": True,
        },
    })
    
    # mute mongoengine logs
    for logger_name in ("pymongo", "mongoengine", "smtplib"):
        logging.getLogger(logger_name).setLevel(logging.WARNING)
    
    LogProcessorClass.set_service_name(service_name)
    
    # Build processor chain
    processors = get_base_processors(LogProcessorClass)
    processors.extend(additional_base_processors)
    
    processors.extend(
        get_production_processors(LogProcessorClass) if is_production else get_development_processors(DevRendererClass)
    )

    # Configure structlog
    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    
    # Set service name in context
    structlog.contextvars.bind_contextvars(svc=service_name)
