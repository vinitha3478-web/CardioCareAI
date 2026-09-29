from flask import Blueprint, request, jsonify
from app.models.db_models import db, Patient, MedicalRecord, Prediction, Doctor
from ml.predict import predict_heart_disease

prediction_bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')

@prediction_bp.route('/patients/<int:patient_id>/predict', methods=['POST'])
def run_patient_prediction(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    # Fetch latest medical record for patient
    med_record = MedicalRecord.query.filter_by(patient_id=patient.id).order_by(MedicalRecord.created_at.desc()).first()
    if not med_record:
        return jsonify({"error": "No medical record found for patient"}), 400

    # Build input parameters dictionary from DB record
    medical_dict = {
        'age': patient.age,
        'sex': patient.sex,
        'cp': med_record.cp,
        'trestbps': med_record.trestbps,
        'chol': med_record.chol,
        'fbs': med_record.fbs,
        'restecg': med_record.restecg,
        'thalach': med_record.thalach,
        'exang': med_record.exang,
        'oldpeak': med_record.oldpeak,
        'slope': med_record.slope,
        'ca': med_record.ca,
        'thal': med_record.thal
    }

    # Run ML Logistic Regression inference engine
    try:
        ml_result = predict_heart_disease(medical_dict)
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

    # Get doctor ID from session/body or default
    doctor_id = request.json.get('doctor_id') if request.json else None
    if not doctor_id:
        default_doc = Doctor.query.first()
        doctor_id = default_doc.id if default_doc else None

    # Save prediction result into database
    new_prediction = Prediction(
        patient_id=patient.id,
        doctor_id=doctor_id,
        prediction=ml_result["prediction"],
        probability=ml_result["probability"],
        risk_level=ml_result["risk_level"],
        model_version=ml_result["model_version"]
    )

    db.session.add(new_prediction)
    db.session.commit()

    # Combine prediction model output with DB metadata
    response_payload = new_prediction.to_dict()
    response_payload["prediction_details"] = ml_result

    return jsonify({
        "message": "Heart disease prediction completed successfully",
        "result": response_payload
    }), 201

@prediction_bp.route('', methods=['GET'])
def get_all_predictions():
    risk = request.args.get('risk', '').strip()
    search = request.args.get('search', '').strip()

    query = Prediction.query.join(Patient)

    if risk:
        query = query.filter(Prediction.risk_level.ilike(f"%{risk}%"))

    if search:
        query = query.filter(
            (Patient.name.ilike(f"%{search}%")) |
            (Patient.patient_id.ilike(f"%{search}%"))
        )

    predictions = query.order_by(Prediction.created_at.desc()).all()
    results = []
    for p in predictions:
        p_dict = p.to_dict()
        results.append(p_dict)

    return jsonify({"predictions": results, "total": len(results)})

@prediction_bp.route('/<int:prediction_id>', methods=['GET'])
def get_prediction_detail(prediction_id):
    pred = Prediction.query.get(prediction_id)
    if not pred:
        return jsonify({"error": "Prediction record not found"}), 404

    patient = Patient.query.get(pred.patient_id)
    med_record = MedicalRecord.query.filter_by(patient_id=pred.patient_id).order_by(MedicalRecord.created_at.desc()).first()

    medical_dict = {
        'age': patient.age if patient else 50,
        'sex': patient.sex if patient else 1,
        'cp': med_record.cp if med_record else 0,
        'trestbps': med_record.trestbps if med_record else 120,
        'chol': med_record.chol if med_record else 200,
        'fbs': med_record.fbs if med_record else 0,
        'restecg': med_record.restecg if med_record else 0,
        'thalach': med_record.thalach if med_record else 150,
        'exang': med_record.exang if med_record else 0,
        'oldpeak': med_record.oldpeak if med_record else 0.0,
        'slope': med_record.slope if med_record else 1,
        'ca': med_record.ca if med_record else 0,
        'thal': med_record.thal if med_record else 2
    }

    ml_result = predict_heart_disease(medical_dict)

    result_dict = pred.to_dict()
    result_dict["prediction_details"] = ml_result
    result_dict["medical_record"] = med_record.to_dict() if med_record else None

    return jsonify({"prediction": result_dict})

@prediction_bp.route('/patients/<int:patient_id>/history', methods=['GET'])
def get_patient_history(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    predictions = Prediction.query.filter_by(patient_id=patient.id).order_by(Prediction.created_at.desc()).all()
    return jsonify({
        "patient": patient.to_dict(),
        "predictions": [p.to_dict() for p in predictions]
    })
