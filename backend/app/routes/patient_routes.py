from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models.db_models import db, Patient, MedicalRecord, Prediction
from data.dataset_config import IMMUTABLE_DATE_FIELDS, STATIC_RECORD_DATE

patient_bp = Blueprint('patients', __name__, url_prefix='/api/patients')

def generate_unique_patient_id():
    count = Patient.query.count() + 1001
    return f"PAT-{count}"

@patient_bp.route('', methods=['GET'])
def get_patients():
    search = request.args.get('search', '').strip()
    gender = request.args.get('gender', '').strip()
    risk = request.args.get('risk', '').strip()

    query = Patient.query

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Patient.name.ilike(search_filter)) |
            (Patient.patient_id.ilike(search_filter)) |
            (Patient.phone.ilike(search_filter))
        )

    if gender:
        if gender.lower() == 'male':
            query = query.filter(Patient.sex == 1)
        elif gender.lower() == 'female':
            query = query.filter(Patient.sex == 0)

    patients = query.order_by(Patient.created_at.desc()).all()
    patient_dicts = [p.to_dict() for p in patients]

    if risk:
        patient_dicts = [
            p for p in patient_dicts
            if p.get("last_prediction") and p["last_prediction"].get("risk_level", "").lower() == risk.lower()
        ]

    return jsonify({"patients": patient_dicts, "total": len(patient_dicts)})

@patient_bp.route('/<int:patient_id>', methods=['GET'])
def get_patient_detail(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    history = Prediction.query.filter_by(patient_id=patient.id).order_by(Prediction.created_at.desc()).all()
    records = MedicalRecord.query.filter_by(patient_id=patient.id).order_by(MedicalRecord.created_at.desc()).all()

    data = patient.to_dict()
    data["prediction_history"] = [p.to_dict() for p in history]
    data["medical_records"] = [m.to_dict() for m in records]

    return jsonify({"patient": data})

@patient_bp.route('', methods=['POST'])
def add_patient():
    data = request.get_json() or {}

    name = data.get('name', '').strip()
    age = data.get('age')
    sex = data.get('sex') # 1 = Male, 0 = Female
    phone = data.get('phone', '').strip()
    email = data.get('email', '').strip()
    address = data.get('address', '').strip()

    if not name or age is None or sex is None:
        return jsonify({"error": "Patient Name, Age, and Sex are required"}), 400

    try:
        age = int(age)
        sex = int(sex)
        if age <= 0 or age > 120:
            return jsonify({"error": "Invalid age value (1-120)"}), 400
    except ValueError:
        return jsonify({"error": "Age and Sex must be numeric"}), 400

    patient_code = data.get('patient_id') or generate_unique_patient_id()

    new_patient = Patient(
        patient_id=patient_code,
        name=name,
        age=age,
        sex=sex,
        phone=phone,
        email=email,
        address=address,
        created_at=STATIC_RECORD_DATE,
    )
    db.session.add(new_patient)
    db.session.flush() # assign new_patient.id

    # Add Medical Record parameters
    try:
        med_record = MedicalRecord(
            patient_id=new_patient.id,
            cp=int(data.get('cp', 0)),
            trestbps=float(data.get('trestbps', 120)),
            chol=float(data.get('chol', 200)),
            fbs=int(data.get('fbs', 0)),
            restecg=int(data.get('restecg', 0)),
            thalach=float(data.get('thalach', 150)),
            exang=int(data.get('exang', 0)),
            oldpeak=float(data.get('oldpeak', 0.0)),
            slope=int(data.get('slope', 1)),
            ca=int(data.get('ca', 0)),
            thal=int(data.get('thal', 2)),
            created_at=STATIC_RECORD_DATE,
        )
        db.session.add(med_record)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to save medical parameters: {str(e)}"}), 400

    return jsonify({
        "message": "Patient added successfully",
        "patient": new_patient.to_dict()
    }), 201

@patient_bp.route('/<int:patient_id>', methods=['PUT'])
def update_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    data = request.get_json() or {}

    # GUARANTEE: created_at / registration_date remains STATIC & IMMUTABLE.
    # Incoming date keys are discarded. The stored date cannot be changed.
    for locked_key in IMMUTABLE_DATE_FIELDS:
        data.pop(locked_key, None)

    fixed_created_at = patient.created_at

    # Dynamic Field Updates (Name, Age, Sex, Contact, Address)
    if 'name' in data and data['name']:
        patient.name = data['name'].strip()
    if 'age' in data and data['age'] is not None:
        patient.age = int(data['age'])
    if 'sex' in data and data['sex'] is not None:
        patient.sex = int(data['sex'])
    if 'phone' in data:
        patient.phone = data['phone'].strip()
    if 'email' in data:
        patient.email = data['email'].strip()
    if 'address' in data:
        patient.address = data['address'].strip()

    patient.updated_at = datetime.utcnow()
    # Explicitly ensure created_at is preserved
    patient.created_at = fixed_created_at

    # Update latest medical record or create new
    med_record = MedicalRecord.query.filter_by(patient_id=patient.id).order_by(MedicalRecord.created_at.desc()).first()
    if not med_record:
        med_record = MedicalRecord(patient_id=patient.id, created_at=fixed_created_at)
        db.session.add(med_record)
    else:
        med_record.created_at = med_record.created_at or fixed_created_at

    # Dynamic Medical Parameters Updates
    if 'cp' in data: med_record.cp = int(data['cp'])
    if 'trestbps' in data: med_record.trestbps = float(data['trestbps'])
    if 'chol' in data: med_record.chol = float(data['chol'])
    if 'fbs' in data: med_record.fbs = int(data['fbs'])
    if 'restecg' in data: med_record.restecg = int(data['restecg'])
    if 'thalach' in data: med_record.thalach = float(data['thalach'])
    if 'exang' in data: med_record.exang = int(data['exang'])
    if 'oldpeak' in data: med_record.oldpeak = float(data['oldpeak'])
    if 'slope' in data: med_record.slope = int(data['slope'])
    if 'ca' in data: med_record.ca = int(data['ca'])
    if 'thal' in data: med_record.thal = int(data['thal'])

    db.session.commit()

    res_dict = patient.to_dict()
    res_dict["static_date_status"] = "Date field is fixed and unchangeable"
    res_dict["record_date"] = fixed_created_at.strftime("%Y-%m-%d %H:%M:%S") if fixed_created_at else None

    return jsonify({
        "message": "Patient dynamic parameters updated successfully. Registration date remains fixed.",
        "patient": res_dict
    })

@patient_bp.route('/<int:patient_id>', methods=['DELETE'])
def delete_patient(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    db.session.delete(patient)
    db.session.commit()
    return jsonify({"message": "Patient deleted successfully"})