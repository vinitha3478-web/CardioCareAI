import os
import sys
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.models.db_models import db, Doctor, Patient, MedicalRecord, Prediction
from ml.predict import predict_heart_disease
from data.dataset_config import STATIC_RECORD_DATE
from data.import_kaggle_dataset import GUI_CSV, process_kaggle_heart_dataset

FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn",
    "Cameron", "Reese", "Harper", "Drew", "Skyler", "Parker", "Rowan", "Sage",
    "Elliot", "Finley", "Hayden", "Logan", "Jamie", "Kendall", "Peyton", "Blake",
]
LAST_NAMES = [
    "Patel", "Nguyen", "Garcia", "Kim", "Singh", "Williams", "Chen", "Khan",
    "Johnson", "Martinez", "Brown", "Lee", "Davis", "Ali", "Wilson", "Clark",
]


def _display_name(index, sex):
    first = FIRST_NAMES[index % len(FIRST_NAMES)]
    last = LAST_NAMES[index % len(LAST_NAMES)]
    return f"{first} {last}"


def seed_database():
    app = create_app()
    with app.app_context():
        print("--- Seeding CardioCare AI Database from Kaggle All OK dataset ---")

        if not os.path.exists(GUI_CSV):
            print("GUI All OK CSV not found. Importing Kaggle dataset first...")
            process_kaggle_heart_dataset()

        import pandas as pd
        gui_df = pd.read_csv(GUI_CSV)
        if "record_date_fixed" in gui_df.columns:
            unique_dates = gui_df["record_date_fixed"].nunique()
            if unique_dates != 1:
                raise ValueError("GUI dataset date is not static — expected a single fixed date.")

        db.drop_all()
        db.create_all()

        default_doc = Doctor(
            name="Dr. Sarah Jenkins",
            email="doctor@cardiocare.ai",
            password_hash=generate_password_hash("doctor123"),
            specialization="Chief Cardiologist"
        )
        db.session.add(default_doc)
        db.session.commit()
        print(f"Created Doctor: {default_doc.name} ({default_doc.email})")

        seeded = 0
        for index, row in gui_df.iterrows():
            patient = Patient(
                patient_id=f"PAT-{1001 + index}",
                name=_display_name(index, int(row["sex"])),
                age=int(row["age"]),
                sex=int(row["sex"]),
                phone=f"+1 555-{1000 + index:04d}",
                email=f"allok{index + 1}@cardiocare.demo",
                address="Kaggle All OK cohort",
                created_at=STATIC_RECORD_DATE,
                updated_at=STATIC_RECORD_DATE,
            )
            db.session.add(patient)
            db.session.flush()

            med_info = {
                "cp": int(row["cp"]),
                "trestbps": float(row["trestbps"]),
                "chol": float(row["chol"]),
                "fbs": int(row["fbs"]),
                "restecg": int(row["restecg"]),
                "thalach": float(row["thalach"]),
                "exang": int(row["exang"]),
                "oldpeak": float(row["oldpeak"]),
                "slope": int(row["slope"]),
                "ca": int(row["ca"]),
                "thal": int(row["thal"]),
            }
            med_record = MedicalRecord(
                patient_id=patient.id,
                created_at=STATIC_RECORD_DATE,
                **med_info,
            )
            db.session.add(med_record)

            eval_dict = {"age": patient.age, "sex": patient.sex, **med_info}
            pred_out = predict_heart_disease(eval_dict)
            pred_record = Prediction(
                patient_id=patient.id,
                doctor_id=default_doc.id,
                prediction=pred_out["prediction"],
                probability=pred_out["probability"],
                risk_level=pred_out["risk_level"],
                model_version=pred_out["model_version"],
            )
            db.session.add(pred_record)
            seeded += 1

        db.session.commit()
        print(
            f"Seeded {seeded} GUI patients from All OK rows. "
            f"Record date is locked to {STATIC_RECORD_DATE}."
        )


if __name__ == "__main__":
    seed_database()
