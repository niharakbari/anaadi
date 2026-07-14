# pyrefly: ignore [missing-import]
from flask import Flask
from config import Config
from routes.health import health_bp
from routes.search import search_bp

def create_app():

    app = Flask(__name__)
    app.config.from_object(Config)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(search_bp)

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host=Config.HOST, port=Config.PORT)

    