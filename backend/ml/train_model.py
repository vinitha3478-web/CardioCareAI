import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold, cross_val_score
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from ml.preprocessing import create_preprocessing_pipeline, FEATURE_NAMES
from ml.evaluate_model import evaluate_classification_model

def train_and_save_model(data_path, model_path, metrics_path):
    print("--- Starting CardioCare AI Model Training ---")

    if not os.path.exists(data_path):
        from data.make_dataset import generate_cleveland_dataset
        generate_cleveland_dataset(data_path)

    df = pd.read_csv(data_path)
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    # Clean missing values if any
    df = df.dropna()

    X = df[FEATURE_NAMES]
    y = df['target']

    # Stratified Train-Test Split to avoid data leakage
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train split: {len(X_train)} samples | Test split: {len(X_test)} samples")

    # Build preprocessing pipeline
    preprocessor, feat_names = create_preprocessing_pipeline()

    # Define full model pipeline
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', LogisticRegression(random_state=42, max_iter=1000))
    ])

    # Hyperparameter Grid Search
    param_grid = {
        'classifier__C': [0.01, 0.1, 1.0, 10.0],
        'classifier__solver': ['lbfgs', 'liblinear'],
        'classifier__class_weight': [None, 'balanced']
    }

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    grid_search = GridSearchCV(
        pipeline, param_grid, cv=cv, scoring='f1', n_jobs=-1
    )

    grid_search.fit(X_train, y_train)
    best_model = grid_search.best_estimator_

    print(f"Best Hyperparameters: {grid_search.best_params_}")

    # Stratified Cross-Validation Score
    cv_scores = cross_val_score(best_model, X_train, y_train, cv=cv, scoring='accuracy')
    cv_mean = round(float(np.mean(cv_scores)), 4)
    cv_std = round(float(np.std(cv_scores)), 4)

    print(f"5-Fold CV Accuracy: {cv_mean} +/- {cv_std}")

    # Evaluate on held-out test set
    metrics = evaluate_classification_model(best_model, X_test, y_test, FEATURE_NAMES)

    # Attach metadata
    metrics["cross_validation_score"] = cv_mean
    metrics["cross_validation_std"] = cv_std
    metrics["best_parameters"] = {
        k.replace("classifier__", ""): v for k, v in grid_search.best_params_.items()
    }
    metrics["model_info"] = {
        "algorithm": "Logistic Regression",
        "dataset": "UCI Cleveland Heart Disease Dataset",
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": FEATURE_NAMES,
        "model_version": "1.0.0",
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    # Ensure directories exist
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    os.makedirs(os.path.dirname(metrics_path), exist_ok=True)

    # Save trained pipeline and metrics
    joblib.dump(best_model, model_path)
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=4)

    print(f"Model successfully saved to: {model_path}")
    print(f"Metrics successfully saved to: {metrics_path}")
    print(f"Final Test Accuracy: {metrics['accuracy']} | ROC AUC: {metrics['roc_auc']} | F1: {metrics['f1_score']}")

    return best_model, metrics

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_file = os.path.join(base_dir, "data", "heart_disease.csv")
    model_file = os.path.join(base_dir, "ml", "model.pkl")
    metrics_file = os.path.join(base_dir, "ml", "metrics.json")
    train_and_save_model(data_file, model_file, metrics_file)
