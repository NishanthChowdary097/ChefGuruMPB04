from main.routes import get_app
from config import configurations
import dotenv
import os


dotenv.load_dotenv()
app=get_app(configObject=configurations[os.getenv("ENVIRONMENT","dev")])

if __name__ =="__main__":
    app.run(port=os.getenv("MAIN_SERVER_PORT"))