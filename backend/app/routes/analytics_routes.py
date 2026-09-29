from flask import Blueprint, jsonify
from sqlalchemy import func
from app.models.db_models import db, Patient, MedicalRecord, Prediction
from ml.predict import get_loaded_metrics

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/dashboard', methods=['GET'])
def get_dashboard_summary():
    total_patients = Patient.query.count()
    predictions_completed = Prediction.query.count()
    high_risk_cases = Prediction.query.filter_by(risk_level="High Risk").count()
    moderate_risk_cases = Prediction.query.filter_by(risk_level="Moderate Risk").count()
    low_risk_cases = Prediction.query.filter_by(risk_level="Low Risk").count()

    recent_patients = Patient.query.order_by(Patient.created_at.desc()).limit(5).all()
    recent_preds = Prediction.query.order_by(Prediction.created_at.desc()).limit(5).all()

    # Load actual model metrics
    metrics = get_loaded_metrics()
    model_accuracy = metrics.get("accuracy", 0.85)

    return jsonify({
        "summary": {
            "total_patients": total_patients,
            "predictions_completed": predictions_completed,
            "high_risk_cases": high_risk_cases,
            "moderate_risk_cases": moderate_risk_cases,
            "low_risk_cases": low_risk_cases,
            "model_accuracy": round(model_accuracy * 100, 1) # percentage e.g. 85.2%
        },
        "recent_patients": [p.to_dict() for p in recent_patients],
        "recent_predictions": [p.to_dict() for p in recent_preds]
    })

@analytics_bp.route('/patients', methods=['GET'])
def get_patient_analytics():
    patients = Patient.query.all()

    # Age Distribution Bins (<30, 30-40, 41-50, 51-60, 61-70, 70+)
    age_bins = {"<30": 0, "30-40": 0, "41-50": 0, "51-60": 0, "61-70": 0, ">70": 0}
    males = 0
    females = 0

    for p in patients:
        if p.sex == 1:
            males += 1
        else:
            females += 1

        age = p.age
        if age < 30:
            age_bins["<30"] += 1
        elif age <= 40:
            age_bins["30-40"] += 1
        elif age <= 50:
            age_bins["41-50"] += 1
        elif age <= 60:
            age_bins["51-60"] += 1
        elif age <= 70:
            age_bins["61-70"] += 1
        else:
            age_bins[">70"] += 1

    age_data = [{"range": k, "count": v} for k, v in age_bins.items()]
    gender_data = [
        {"gender": "Male", "count": males, "percentage": round((males / max(1, len(patients))) * 100, 1)},
        {"gender": "Female", "count": females, "percentage": round((females / max(1, len(patients))) * 100, 1)}
    ]

    return jsonify({
        "age_distribution": age_data,
        "gender_distribution": gender_data,
        "total_patients": len(patients)
    })

@analytics_bp.route('/predictions', methods=['GET'])
def get_prediction_analytics():
    preds = Prediction.query.all()
    total = len(preds)

    risk_counts = {"Low Risk": 0, "Moderate Risk": 0, "High Risk": 0}
    for p in preds:
        if p.risk_level in risk_counts:
            risk_counts[p.risk_level] += 1
        else:
            risk_counts["Moderate Risk"] += 1

    risk_data = [
        {"risk_level": k, "count": v, "percentage": round((v / max(1, total)) * 100, 1)}
        for k, v in risk_counts.items()
    ]

    return jsonify({
        "risk_distribution": risk_data,
        "total_predictions": total
    })
