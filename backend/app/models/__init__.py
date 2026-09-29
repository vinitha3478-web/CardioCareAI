import os
import sys
from flask import Flask, jsonify
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
load_dotenv()
def create_app():
    app = Flask(__name__)
    frontend_dist = os.path.abspath(os.path.join(backend_dir, "..", "frontend", "dist"))
    app = Flask(__name__, static_folder=frontend_dist)
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
    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            "system": "CardioCare AI Backend API Server",
            "status": "online",
            "version": "1.0.0",
            "frontend_ui": "http://localhost:3000",
            "api_health": "http://localhost:5000/api/health",
            "message": "CardioCare AI APIs are live under /api/*"
        })
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "online",
            "system": "CardioCare AI Backend",
            "version": "1.0.0"
        })
    # Catch-all SPA router: Serves React GUI dist/index.html or static assets
    # Eliminates 404 errors regardless of which URL or port (3000 or 5000) is accessed.
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend_or_fallback(path):
        if path.startswith('api/'):
            return jsonify({"error": "API route not found"}), 404
        file_path = os.path.join(frontend_dist, path)
        if path != "" and os.path.exists(file_path):
            return send_from_directory(frontend_dist, path)
        index_file = os.path.join(frontend_dist, 'index.html')
        if os.path.exists(index_file):
            return send_from_directory(frontend_dist, 'index.html')
        return jsonify({
            "system": "CardioCare AI Server",
            "status": "online",
            "frontend_ui": "http://localhost:3000",
            "message": "CardioCare AI REST APIs are live under /api/*. Run 'npm run build' inside /frontend to serve GUI directly on port 5000."
        })
    with app.app_context():
        db.create_all()
    return app
