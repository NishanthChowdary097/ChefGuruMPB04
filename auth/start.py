from auth.routes import get_app
from config import configurations
import dotenv
import os

dotenv.load_dotenv()

if __name__ =="__main__":
    app=get_app(configObject=configurations[os.getenv("ENVIRONMENT","dev")])
    app.run()