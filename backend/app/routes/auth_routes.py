from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.db_models import db, Doctor
from app.utils.auth_utils import generate_jwt_token, decode_jwt_token

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register_doctor():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email', '').strip().lower()
    password = data.get('password')
    specialization = data.get('specialization', 'Cardiology')

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    if Doctor.query.filter_by(email=email).first():
        return jsonify({"error": "Doctor with this email already exists"}), 400

    hashed_pw = generate_password_hash(password)
    new_doc = Doctor(
        name=name,
        email=email,
        password_hash=hashed_pw,
        specialization=specialization
    )
    db.session.add(new_doc)
    db.session.commit()

    token = generate_jwt_token(new_doc.id, new_doc.email)

    return jsonify({
        "message": "Doctor registered successfully",
        "token": token,
        "doctor": new_doc.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login_doctor():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    doctor = Doctor.query.filter_by(email=email).first()
    if not doctor or not check_password_hash(doctor.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = generate_jwt_token(doctor.id, doctor.email)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "doctor": doctor.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
def get_current_doctor():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        # Fallback to returning default doctor if session missing for seamless trial
        doc = Doctor.query.first()
        if doc:
            return jsonify({"doctor": doc.to_dict()})
        return jsonify({"error": "Not authenticated"}), 401

    token = auth_header.split(" ")[1]
    payload = decode_jwt_token(token)
    if not payload:
        return jsonify({"error": "Invalid or expired token"}), 401

    doctor = Doctor.query.get(payload.get("doctor_id"))
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    return jsonify({"doctor": doctor.to_dict()})
