"""Shared configuration for the Kaggle GUI dataset and the frozen record date."""
from datetime import datetime

# Registration / record date is a constant. It is written once at import/seed
# time and is never updated by the API or GUI.
STATIC_RECORD_DATE = datetime(2026, 1, 15, 9, 0, 0)
STATIC_RECORD_DATE_STR = STATIC_RECORD_DATE.strftime("%Y-%m-%d %H:%M:%S")

# Primary Kaggle dataset (UCI Cleveland 14-feature subset).
# target = 0  -> All OK / no heart disease
# target = 1  -> heart disease present
KAGGLE_DATASET_SLUGS = [
    "johnsmith88/heart-disease-dataset",
    "rashikrahmanpritom/heart-attack-analysis-prediction-dataset",
]

# Public mirror of the same Kaggle CSV (used when kaggle.json is not configured).
KAGGLE_PUBLIC_MIRROR_URL = (
    "https://raw.githubusercontent.com/kb22/Heart-Disease-Prediction/master/dataset.csv"
)

KAGGLE_COLUMN_MAP = {
    "age": "age",
    "sex": "sex",
    "cp": "cp",
    "trestbps": "trestbps",
    "trtbps": "trestbps",
    "chol": "chol",
    "fbs": "fbs",
    "restecg": "restecg",
    "thalach": "thalach",
    "thalachh": "thalach",
    "exang": "exang",
    "exng": "exang",
    "oldpeak": "oldpeak",
    "slope": "slope",
    "slp": "slope",
    "ca": "ca",
    "caa": "ca",
    "thal": "thal",
    "thall": "thal",
    "target": "target",
    "output": "target",
    "num": "target",
}

REQUIRED_FEATURE_COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal", "target",
]

# Keys the API must ignore so the date cannot be overwritten.
IMMUTABLE_DATE_FIELDS = frozenset({
    "created_at",
    "record_date",
    "record_date_fixed",
    "registration_date",
    "date",
})
