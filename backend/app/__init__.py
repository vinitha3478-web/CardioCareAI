import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

load_dotenv()

def create_app():
    app = Flask(__name__)

    # Enable CORS for React Vite frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # SQLite Database Configuration
    db_dir = os.path.join(backend_dir, "database")
    os.makedirs(db_dir, exist_ok=True)
    db_path = os.path.join(db_dir, "cardiocare.db")

    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{db_path}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get("SECRET_KEY", "cardiocare_ai_super_secret_2026")

    # Import and initialize SQLAlchemy db
    from app.models.db_models import db
    db.init_app(app)

    # Register API Blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.patient_routes import patient_bp
    from app.routes.prediction_routes import prediction_bp
    from app.routes.analytics_routes import analytics_bp
    from app.routes.model_routes import model_bp
    from app.routes.report_routes import report_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(patient_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(model_bp)
    app.register_blueprint(report_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "online",
            "system": "CardioCare AI Backend",
            "version": "1.0.0"
        })

    with app.app_context():
        db.create_all()

    return app
