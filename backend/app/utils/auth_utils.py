import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "cardiocare_ai_secret_key_2026")

def generate_jwt_token(doctor_id, email):
    payload = {
        "doctor_id": doctor_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def decode_jwt_token(token):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def doctor_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            # Fallback for dev ease if no token passed, allow optional execution or return error
            return jsonify({"error": "Authorization token required"}), 401
        
        token = auth_header.split(" ")[1]
        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        request.current_doctor_id = payload.get("doctor_id")
        return f(*args, **kwargs)
    return decorated
