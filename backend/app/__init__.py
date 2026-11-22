from datetime import timedelta
import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

load_dotenv()

jwt = JWTManager()


def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'

    jwt.init_app(app)

    # FRONTEND_URL can hold several origins separated by commas
    allowed_origins = ['http://localhost:5173', 'http://127.0.0.1:5173']
    extra = os.getenv('FRONTEND_URL', '')
    allowed_origins += [o.strip().rstrip('/') for o in extra.split(',') if o.strip()]

    CORS(app,
         origins=allowed_origins,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         supports_credentials=True)

    from app.routes.auth import auth_bp
    from app.routes.chat import chat_bp
    from app.routes.faq import faq_bp
    from app.routes.admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(chat_bp, url_prefix='/api/chat')
    app.register_blueprint(faq_bp, url_prefix='/api/faq')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.route('/api/health')
    def health():
        return {'status': 'ShopNest API is running!', 'version': '2.0.0'}

    return app
