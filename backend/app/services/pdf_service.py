import os
from io import BytesIO
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

def generate_patient_pdf_report(patient, medical_record, prediction, doctor_name="Dr. CardioCare"):
    """
    Generates downloadable PDF report using ReportLab with light purple header styling,
    patient metadata, full medical parameters matrix, AI prediction metrics, and disclaimer.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom Color Palette (Light Purple Neumorphism theme)
    PRIMARY_VIOLET = colors.HexColor("#6c47ff")
    DARK_TEXT = colors.HexColor("#2d2b42")
    LIGHT_PURPLE_BG = colors.HexColor("#f3effa")
    BORDER_COLOR = colors.HexColor("#d5cced")
    HIGH_RISK_COLOR = colors.HexColor("#e53e3e")
    MODERATE_RISK_COLOR = colors.HexColor("#dd6b20")
    LOW_RISK_COLOR = colors.HexColor("#38a169")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY_VIOLET,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.HexColor("#6b7280"),
        spaceAfter=15
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=PRIMARY_VIOLET,
        spaceBefore=12,
        spaceAfter=8
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=DARK_TEXT
    )

    bold_body_style = ParagraphStyle(
        'BodyDarkBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=DARK_TEXT
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#4a5568")
    )

    # Header Section
    story.append(Paragraph("CardioCare AI", title_style))
    story.append(Paragraph("Clinical Decision-Support & Patient Heart Disease Prediction Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY_VIOLET, spaceAfter=15))

    # Patient Information Header Block
    gender_text = "Male" if patient.sex == 1 else "Female"
    patient_info_data = [
        [
            Paragraph("<b>Patient Name:</b> " + str(patient.name), body_style),
            Paragraph("<b>Patient ID:</b> " + str(patient.patient_id), body_style)
        ],
        [
            Paragraph("<b>Age / Gender:</b> " + f"{patient.age} yrs / {gender_text}", body_style),
            Paragraph("<b>Contact:</b> " + str(patient.phone or "N/A"), body_style)
        ],
        [
            Paragraph("<b>Attending Doctor:</b> " + str(doctor_name), body_style),
            Paragraph("<b>Report Date:</b> " + datetime.now().strftime("%B %d, %Y %H:%M"), body_style)
        ]
    ]

    patient_table = Table(patient_info_data, colWidths=[270, 270])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_PURPLE_BG),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 15))

    # AI Prediction Result Block
    story.append(Paragraph("AI Prediction Result", section_heading))

    prob_val = prediction.probability if prediction else 0.0
    risk_lvl = prediction.risk_level if prediction else "N/A"
    pred_lbl = prediction.to_dict().get("prediction_label", "N/A") if prediction else "N/A"

    risk_color = LOW_RISK_COLOR
    if risk_lvl == "High Risk":
        risk_color = HIGH_RISK_COLOR
    elif risk_lvl == "Moderate Risk":
        risk_color = MODERATE_RISK_COLOR

    risk_style = ParagraphStyle(
        'RiskBadge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=risk_color
    )

    pred_summary_data = [
        [Paragraph("<b>Model Classification:</b>", body_style), Paragraph(f"<b>{pred_lbl}</b>", risk_style)],
        [Paragraph("<b>Estimated Probability:</b>", body_style), Paragraph(f"<b>{prob_val}%</b>", bold_body_style)],
        [Paragraph("<b>Assigned Risk Band:</b>", body_style), Paragraph(f"<b>{risk_lvl}</b>", risk_style)],
        [Paragraph("<b>Algorithm / Version:</b>", body_style), Paragraph(f"Logistic Regression (scikit-learn) | v{prediction.model_version if prediction else '1.0.0'}", body_style)],
        [Paragraph("<b>Prediction Date:</b>", body_style), Paragraph(prediction.created_at.strftime("%Y-%m-%d %H:%M:%S") if prediction else "N/A", body_style)]
    ]

    pred_table = Table(pred_summary_data, colWidths=[180, 360])
    pred_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#ffffff")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 1, BORDER_COLOR),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
    ]))
    story.append(pred_table)
    story.append(Spacer(1, 15))

    # Medical Input Parameters Matrix
    story.append(Paragraph("Clinical Medical Parameters (Model Inputs)", section_heading))

    cp_labels = ["Typical Angina", "Atypical Angina", "Non-anginal Pain", "Asymptomatic"]
    ecg_labels = ["Normal", "ST-T Abnormality", "LV Hypertrophy"]
    slope_labels = ["Upsloping", "Flat", "Downsloping"]
    thal_labels = ["Normal", "Fixed Defect", "Reversible Defect"]

    med = medical_record
    med_params_data = [
        [Paragraph("<b>Parameter</b>", bold_body_style), Paragraph("<b>Recorded Value</b>", bold_body_style), Paragraph("<b>Clinical Description</b>", bold_body_style)],
        [Paragraph("Chest Pain Type (cp)", body_style), Paragraph(str(med.cp if med else "N/A"), body_style), Paragraph(cp_labels[int(med.cp)] if med and 0 <= int(med.cp) <= 3 else "N/A", body_style)],
        [Paragraph("Resting BP (trestbps)", body_style), Paragraph(f"{med.trestbps if med else 'N/A'} mm Hg", body_style), Paragraph("Resting Blood Pressure", body_style)],
        [Paragraph("Serum Cholesterol (chol)", body_style), Paragraph(f"{med.chol if med else 'N/A'} mg/dl", body_style), Paragraph("Serum Cholesterol Level", body_style)],
        [Paragraph("Fasting Blood Sugar (fbs)", body_style), Paragraph(str(med.fbs if med else "N/A"), body_style), Paragraph("1: >120 mg/dl | 0: Normal", body_style)],
        [Paragraph("Resting ECG (restecg)", body_style), Paragraph(str(med.restecg if med else "N/A"), body_style), Paragraph(ecg_labels[int(med.restecg)] if med and 0 <= int(med.restecg) <= 2 else "N/A", body_style)],
        [Paragraph("Max Heart Rate (thalach)", body_style), Paragraph(f"{med.thalach if med else 'N/A'} bpm", body_style), Paragraph("Maximum Achieved Heart Rate", body_style)],
        [Paragraph("Exercise Angina (exang)", body_style), Paragraph(str(med.exang if med else "N/A"), body_style), Paragraph("1: Yes | 0: No", body_style)],
        [Paragraph("ST Depression (oldpeak)", body_style), Paragraph(str(med.oldpeak if med else "N/A"), body_style), Paragraph("ST depression induced by exercise", body_style)],
        [Paragraph("ST Slope (slope)", body_style), Paragraph(str(med.slope if med else "N/A"), body_style), Paragraph(slope_labels[int(med.slope)] if med and 0 <= int(med.slope) <= 2 else "N/A", body_style)],
        [Paragraph("Major Vessels (ca)", body_style), Paragraph(str(med.ca if med else "N/A"), body_style), Paragraph("Colored by fluoroscopy (0-3)", body_style)],
        [Paragraph("Thalassemia (thal)", body_style), Paragraph(str(med.thal if med else "N/A"), body_style), Paragraph(thal_labels[int(med.thal)-1] if med and 1 <= int(med.thal) <= 3 else "N/A", body_style)]
    ]

    med_table = Table(med_params_data, colWidths=[160, 120, 260])
    med_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LIGHT_PURPLE_BG),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER_COLOR),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(med_table)
    story.append(Spacer(1, 20))

    # Medical Disclaimer Block
    disclaimer_text = (
        "<b>CLINICAL DISCLAIMER:</b> AI-generated prediction for educational/decision-support purposes only. "
        "This result should not be considered a medical diagnosis. Clinical decisions should be made by "
        "qualified healthcare professionals following established medical protocols."
    )
    disc_table = Table([[Paragraph(disclaimer_text, disclaimer_style)]], colWidths=[540])
    disc_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#fff5f5")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#feb2b2")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(disc_table)

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
