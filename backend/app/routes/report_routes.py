from flask import Blueprint, send_file, jsonify, request
from app.models.db_models import Patient, MedicalRecord, Prediction, Doctor
from app.services.pdf_service import generate_patient_pdf_report
from io import BytesIO

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@report_bp.route('/patient/<int:patient_id>', methods=['GET'])
def download_patient_report(patient_id):
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    med_record = MedicalRecord.query.filter_by(patient_id=patient.id).order_by(MedicalRecord.created_at.desc()).first()
    prediction = Prediction.query.filter_by(patient_id=patient.id).order_by(Prediction.created_at.desc()).first()

    if not med_record:
        return jsonify({"error": "No medical record available for patient report"}), 400

    doctor = Doctor.query.first()
    doctor_name = doctor.name if doctor else "Dr. CardioCare"

    try:
        pdf_bytes = generate_patient_pdf_report(patient, med_record, prediction, doctor_name)
        filename = f"CardioCare_Report_{patient.patient_id}.pdf"

        return send_file(
            BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"error": f"PDF report generation failed: {str(e)}"}), 500
