import numpy as np
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve, classification_report
)

def evaluate_classification_model(model, X_test, y_test, feature_names):
    """
    Evaluates Logistic Regression model on test set.
    Calculates Accuracy, Precision, Recall, F1, ROC-AUC,
    Confusion Matrix (TP, TN, FP, FN), ROC Curve FPR/TPR, and Feature Influence.
    """
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_test, y_prob)

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # ROC Curve points
    fpr, tpr, thresholds = roc_curve(y_test, y_prob)
    # Downsample points for light payload if needed
    roc_points = [
        {"fpr": round(float(f), 4), "tpr": round(float(t), 4)}
        for f, t in zip(fpr, tpr)
    ]

    # Detailed Classification Report
    clf_report_dict = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Logistic Regression feature coefficients
    classifier = model.named_steps['classifier'] if hasattr(model, 'named_steps') else model
    if hasattr(classifier, 'coef_'):
        coefs = classifier.coef_[0]
    else:
        coefs = np.zeros(len(feature_names))

    feature_influence = []
    for name, coef in zip(feature_names, coefs):
        feature_influence.append({
            "feature": name,
            "coefficient": round(float(coef), 4),
            "impact": "Positive (Increases Risk)" if coef > 0 else "Negative (Decreases Risk)",
            "abs_impact": round(abs(float(coef)), 4)
        })

    # Sort feature influence by magnitude
    feature_influence.sort(key=lambda x: x["abs_impact"], reverse=True)

    metrics = {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
            "matrix": [[int(tn), int(fp)], [int(fn), int(tp)]]
        },
        "roc_curve": roc_points,
        "classification_report": clf_report_dict,
        "feature_influence": feature_influence
    }

    return metrics
