import os
import sys
import joblib
import json
import pandas as pd
import numpy as np

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ml.preprocessing import FEATURE_NAMES

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
METRICS_PATH = os.path.join(os.path.dirname(__file__), "metrics.json")

_model = None
_metrics = None

def get_loaded_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            from train_model import train_and_save_model
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_file = os.path.join(base_dir, "data", "heart_disease.csv")
            _model, _ = train_and_save_model(data_file, MODEL_PATH, METRICS_PATH)
        else:
            _model = joblib.load(MODEL_PATH)
    return _model

def get_loaded_metrics():
    global _metrics
    if _metrics is None:
        if os.path.exists(METRICS_PATH):
            with open(METRICS_PATH, 'r') as f:
                _metrics = json.load(f)
        else:
            get_loaded_model()
            with open(METRICS_PATH, 'r') as f:
                _metrics = json.load(f)
    return _metrics

def determine_risk_level(probability):
    """
    Categorizes calculated probability into application-defined risk bands.
    These bands are designed for decision-support triage.
    """
    if probability < 0.35:
        return "Low Risk"
    elif probability <= 0.65:
        return "Moderate Risk"
    else:
        return "High Risk"

def predict_heart_disease(medical_dict):
    """
    Receives medical record dict, runs Logistic Regression prediction,
    and calculates risk score & contributing feature factors.
    """
    model = get_loaded_model()
    metrics = get_loaded_metrics()

    # Build single row dataframe with exact feature ordering
    input_data = {feat: [float(medical_dict.get(feat, 0))] for feat in FEATURE_NAMES}
    input_df = pd.DataFrame(input_data)

    # Calculate prediction and probability
    raw_pred = model.predict(input_df)[0]
    prob_array = model.predict_proba(input_df)[0]
    disease_prob = float(prob_array[1])
    risk_level = determine_risk_level(disease_prob)

    # Extract individual feature contributions
    # Get preprocessed sample values
    preprocessor = model.named_steps['preprocessor']
    classifier = model.named_steps['classifier']
    transformed_sample = preprocessor.transform(input_df)[0]
    coefs = classifier.coef_[0]

    feature_contributions = []
    for feat_name, val, coef in zip(FEATURE_NAMES, transformed_sample, coefs):
        contrib = val * coef
        feature_contributions.append({
            "feature": feat_name,
            "raw_value": float(medical_dict.get(feat_name, 0)),
            "weight": round(float(contrib), 4),
            "coefficient": round(float(coef), 4),
            "impact": "Increased Risk Factor" if contrib > 0 else "Protective / Decreased Risk Factor"
        })

    # Sort contributions by absolute impact magnitude
    feature_contributions.sort(key=lambda x: abs(x["weight"]), reverse=True)

    result = {
        "prediction": int(raw_pred),
        "prediction_label": "Possible Heart Disease Risk" if raw_pred == 1 else "No Detected Heart Disease",
        "probability": round(disease_prob * 100, 1), # percentage e.g. 78.4
        "probability_raw": round(disease_prob, 4),
        "risk_level": risk_level,
        "model_version": metrics.get("model_info", {}).get("model_version", "1.0.0"),
        "top_contributing_factors": feature_contributions[:6],
        "all_feature_contributions": feature_contributions
    }

    return result
