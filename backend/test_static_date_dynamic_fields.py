import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app
from app.models.db_models import db, Patient, MedicalRecord
from data.dataset_config import STATIC_RECORD_DATE, STATIC_RECORD_DATE_STR
from data.import_kaggle_dataset import GUI_CSV
from ml.predict import predict_heart_disease


def test_static_date_and_dynamic_updates():
    app = create_app()
    client = app.test_client()

    with app.app_context():
        print("=== VALIDATION CHECK: Static Date vs Dynamic Field Updates ===")

        patient = Patient.query.first()
        if not patient:
            print("No existing patient. Seeding database first...")
            from seed import seed_database
            seed_database()
            patient = Patient.query.first()

        med_record = MedicalRecord.query.filter_by(patient_id=patient.id).first()
        original_created_at = patient.created_at
        original_age = patient.age
        original_bp = med_record.trestbps
        original_chol = med_record.chol

        print(f"\n[1] Original Fixed Registration Date: {original_created_at}")
        print(f"    Original Dynamic Age: {patient.age}, Sex: {patient.sex}")
        print(f"    Original Dynamic Blood Pressure (trestbps): {med_record.trestbps} mm Hg")
        print(f"    Original Dynamic Cholesterol (chol): {med_record.chol} mg/dl")

        eval_dict_1 = {
            "age": patient.age, "sex": patient.sex, "cp": med_record.cp,
            "trestbps": med_record.trestbps, "chol": med_record.chol, "fbs": med_record.fbs,
            "restecg": med_record.restecg, "thalach": med_record.thalach, "exang": med_record.exang,
            "oldpeak": med_record.oldpeak, "slope": med_record.slope, "ca": med_record.ca,
            "thal": med_record.thal,
        }
        pred_1 = predict_heart_disease(eval_dict_1)
        print(f"    Original ML Probability: {pred_1['probability']}% ({pred_1['risk_level']})")

        print("\n[2] PUT /api/patients/<id> with a forged date plus dynamic field changes...")
        response = client.put(
            f"/api/patients/{patient.id}",
            json={
                "age": 68,
                "trestbps": 175,
                "chol": 340,
                "created_at": "1999-12-31 00:00:00",
                "record_date": "1999-12-31 00:00:00",
                "record_date_fixed": "1999-01-01 00:00:00",
            },
        )
        assert response.status_code == 200, response.get_json()
        body = response.get_json()
        returned_date = body["patient"]["created_at"]
        print(f"    API returned created_at={returned_date}")
        print(f"    API static_date_status={body['patient'].get('static_date_status')}")

        db.session.refresh(patient)
        db.session.refresh(med_record)

        print("\n[3] Post-Update Verification:")
        print(f"    Updated Dynamic Age: {patient.age}")
        print(f"    Updated Dynamic BP: {med_record.trestbps} mm Hg")
        print(f"    Updated Dynamic Cholesterol: {med_record.chol} mg/dl")
        print(f"    Post-Update Date: {patient.created_at}")

        assert patient.age == 68
        assert float(med_record.trestbps) == 175.0
        assert float(med_record.chol) == 340.0
        assert patient.created_at == original_created_at, (
            f"DATE CHANGED: {original_created_at} -> {patient.created_at}"
        )
        assert returned_date != "1999-12-31 00:00:00"
        assert "1999" not in (returned_date or "")

        eval_dict_2 = {
            "age": patient.age, "sex": patient.sex, "cp": med_record.cp,
            "trestbps": med_record.trestbps, "chol": med_record.chol, "fbs": med_record.fbs,
            "restecg": med_record.restecg, "thalach": med_record.thalach, "exang": med_record.exang,
            "oldpeak": med_record.oldpeak, "slope": med_record.slope, "ca": med_record.ca,
            "thal": med_record.thal,
        }
        pred_2 = predict_heart_disease(eval_dict_2)
        print(f"    Updated ML Risk Probability: {pred_2['probability']}% ({pred_2['risk_level']})")

        if os.path.exists(GUI_CSV):
            import pandas as pd
            gui_df = pd.read_csv(GUI_CSV)
            unique_dates = gui_df["record_date_fixed"].nunique()
            assert unique_dates == 1
            assert gui_df["record_date_fixed"].iloc[0] == STATIC_RECORD_DATE_STR
            assert int((gui_df["target"] == 0).all()) == 1
            print(f"\n[4] GUI CSV check: {len(gui_df)} All OK rows, one static date ({STATIC_RECORD_DATE_STR})")

        # Restore original dynamic values so the GUI dataset is not left mutated.
        patient.age = original_age
        med_record.trestbps = original_bp
        med_record.chol = original_chol
        patient.created_at = original_created_at
        db.session.commit()

        print("\n[SUCCESS] VALIDATION PASSED: Date stayed FIXED; other fields updated dynamically.")
        return True


if __name__ == "__main__":
    test_static_date_and_dynamic_updates()
