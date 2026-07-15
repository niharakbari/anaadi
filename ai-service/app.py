# pyrefly: ignore [missing-import]
import logging
from flask import Flask
from config import Config
from routes.health import health_bp
from routes.search import search_bp

# Configure standard logger to output formatted info/error lines
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)

def create_app():

    app = Flask(__name__)
    app.config.from_object(Config)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(search_bp)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )

    