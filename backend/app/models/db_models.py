from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Doctor(db.Model):
    __tablename__ = 'doctors'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    specialization = db.Column(db.String(100), default="Cardiology")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    predictions = db.relationship('Prediction', backref='doctor', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "specialization": self.specialization,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }

class Patient(db.Model):
    __tablename__ = 'patients'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    sex = db.Column(db.Integer, nullable=False) # 1 = Male, 0 = Female
    phone = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    address = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    medical_records = db.relationship('MedicalRecord', backref='patient', lazy=True, cascade="all, delete-orphan")
    predictions = db.relationship('Prediction', backref='patient', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        latest_pred = Prediction.query.filter_by(patient_id=self.id).order_by(Prediction.created_at.desc()).first()
        latest_record = MedicalRecord.query.filter_by(patient_id=self.id).order_by(MedicalRecord.created_at.desc()).first()

        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "name": self.name,
            "age": self.age,
            "sex": self.sex,
            "gender_label": "Male" if self.sex == 1 else "Female",
            "phone": self.phone,
            "email": self.email,
            "address": self.address,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "record_date": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None,
            "record_date_locked": True,
            "dataset_source": "Kaggle All OK (target=0)",
            "updated_at": self.updated_at.strftime("%Y-%m-%d %H:%M:%S") if self.updated_at else None,
            "last_prediction": latest_pred.to_dict() if latest_pred else None,
            "latest_medical_record": latest_record.to_dict() if latest_record else None
        }

class MedicalRecord(db.Model):
    __tablename__ = 'medical_records'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    cp = db.Column(db.Integer, nullable=False)        # Chest Pain Type (0-3)
    trestbps = db.Column(db.Float, nullable=False)   # Resting BP
    chol = db.Column(db.Float, nullable=False)       # Cholesterol
    fbs = db.Column(db.Integer, nullable=False)      # Fasting Blood Sugar (0 or 1)
    restecg = db.Column(db.Integer, nullable=False)  # Resting ECG (0-2)
    thalach = db.Column(db.Float, nullable=False)    # Max Heart Rate
    exang = db.Column(db.Integer, nullable=False)    # Exercise Induced Angina (0 or 1)
    oldpeak = db.Column(db.Float, nullable=False)    # ST Depression
    slope = db.Column(db.Integer, nullable=False)    # ST Slope (0-2)
    ca = db.Column(db.Integer, nullable=False)       # Major Vessels (0-3)
    thal = db.Column(db.Integer, nullable=False)     # Thalassemia (1-3)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "cp": self.cp,
            "trestbps": self.trestbps,
            "chol": self.chol,
            "fbs": self.fbs,
            "restecg": self.restecg,
            "thalach": self.thalach,
            "exang": self.exang,
            "oldpeak": self.oldpeak,
            "slope": self.slope,
            "ca": self.ca,
            "thal": self.thal,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }

class Prediction(db.Model):
    __tablename__ = 'predictions'

    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=True)
    prediction = db.Column(db.Integer, nullable=False)     # 0 = No risk, 1 = Risk
    probability = db.Column(db.Float, nullable=False)       # e.g. 78.4
    risk_level = db.Column(db.String(50), nullable=False)   # Low Risk, Moderate Risk, High Risk
    model_version = db.Column(db.String(20), default="1.0.0")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        patient_obj = Patient.query.get(self.patient_id)
        doctor_obj = Doctor.query.get(self.doctor_id) if self.doctor_id else None

        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "patient_code": patient_obj.patient_id if patient_obj else "N/A",
            "patient_name": patient_obj.name if patient_obj else "Unknown Patient",
            "patient_age": patient_obj.age if patient_obj else None,
            "patient_sex": patient_obj.sex if patient_obj else None,
            "doctor_id": self.doctor_id,
            "doctor_name": doctor_obj.name if doctor_obj else "System Administrator",
            "prediction": self.prediction,
            "prediction_label": "Possible Heart Disease Risk" if self.prediction == 1 else "No Detected Heart Disease",
            "probability": self.probability,
            "risk_level": self.risk_level,
            "model_version": self.model_version,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else None
        }
