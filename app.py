from flask import Flask, render_template, request, jsonify
import pandas as pd
import joblib
from pathlib import Path

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "student_performance_model.pkl"

# Load the trained ML pipeline
try:
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully!")
except Exception as error:
    model = None
    print(f"Model loading failed: {error}")


# Dataset ke input features
FEATURES = [
    "school", "sex", "age", "address", "famsize", "Pstatus",
    "Medu", "Fedu", "Mjob", "Fjob", "reason", "guardian",
    "traveltime", "studytime", "failures", "schoolsup",
    "famsup", "paid", "activities", "nursery", "higher",
    "internet", "romantic", "famrel", "freetime", "goout",
    "Dalc", "Walc", "health", "absences", "G1", "G2"
]

NUMERIC_FEATURES = [
    "age", "Medu", "Fedu", "traveltime", "studytime",
    "failures", "famrel", "freetime", "goout",
    "Dalc", "Walc", "health", "absences", "G1", "G2"
]


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/health")
def health():
    return jsonify({
        "status": "success",
        "model_loaded": model is not None,
        "message": "Student Performance Prediction API"
    })


@app.route("/predict", methods=["POST"])
def predict():

    if model is None:
        return jsonify({
            "status": "error",
            "message": (
                "Model load nahi hua. Check karo ki "
                "student_performance_model.pkl sahi folder mein hai."
            )
        }), 500

    try:
        data = request.get_json(silent=True)

        if not isinstance(data, dict):
            return jsonify({
                "status": "error",
                "message": "Invalid JSON data received."
            }), 400

        missing = [
            feature for feature in FEATURES
            if feature not in data or data[feature] in (None, "")
        ]

        if missing:
            return jsonify({
                "status": "error",
                "message": "Missing fields: " + ", ".join(missing)
            }), 400

        input_data = {}

        for feature in FEATURES:
            if feature in NUMERIC_FEATURES:
                input_data[feature] = float(data[feature])
            else:
                input_data[feature] = str(data[feature])

        # Feature order and names match the dataset
        df = pd.DataFrame([input_data], columns=FEATURES)

        # Predict final grade G3
        prediction = float(model.predict(df)[0])

        # Grade range: 0 to 20
        prediction = max(0.0, min(20.0, prediction))

        return jsonify({
            "status": "success",
            "predicted_grade": round(prediction, 2),
            "scale": "0-20"
        })

    except (ValueError, TypeError) as error:
        return jsonify({
            "status": "error",
            "message": f"Invalid input value: {error}"
        }), 400

    except Exception as error:
        app.logger.exception("Prediction failed")

        return jsonify({
            "status": "error",
            "message": (
                "Prediction failed. Check model preprocessing, "
                "feature names and categories."
            )
        }), 500


if __name__ == "__main__":
    app.run(debug=False)
