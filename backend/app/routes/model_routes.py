from flask import Blueprint, jsonify
from ml.predict import get_loaded_metrics

model_bp = Blueprint('model', __name__, url_prefix='/api/model')

@model_bp.route('/metrics', methods=['GET'])
def get_model_metrics():
    """
    Returns actual calculated evaluation metrics from trained Logistic Regression model.
    """
    try:
        metrics = get_loaded_metrics()
        return jsonify({"metrics": metrics})
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve model metrics: {str(e)}"}), 500
