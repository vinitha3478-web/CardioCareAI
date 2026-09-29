import os
import pandas as pd
import numpy as np

def generate_cleveland_dataset(output_path):
    np.random.seed(42)
    n_samples = 303

    # Generate realistic clinical values based on UCI Cleveland heart disease dataset distributions
    age = np.random.normal(54.4, 9.0, n_samples).astype(int)
    age = np.clip(age, 29, 77)

    sex = np.random.choice([1, 0], size=n_samples, p=[0.68, 0.32])

    cp = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.47, 0.16, 0.28, 0.09])

    trestbps = np.random.normal(131.6, 17.5, n_samples).astype(int)
    trestbps = np.clip(trestbps, 94, 200)

    chol = np.random.normal(246.3, 51.8, n_samples).astype(int)
    chol = np.clip(chol, 126, 564)

    fbs = np.random.choice([0, 1], size=n_samples, p=[0.85, 0.15])

    restecg = np.random.choice([0, 1, 2], size=n_samples, p=[0.49, 0.48, 0.03])

    # Maximum heart rate achieved (negatively correlated with heart disease)
    thalach = np.random.normal(149.6, 22.9, n_samples).astype(int)
    thalach = np.clip(thalach, 71, 202)

    exang = np.random.choice([0, 1], size=n_samples, p=[0.67, 0.33])

    oldpeak = np.random.exponential(1.0, n_samples).round(1)
    oldpeak = np.clip(oldpeak, 0.0, 6.2)

    slope = np.random.choice([0, 1, 2], size=n_samples, p=[0.46, 0.46, 0.08])

    ca = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.58, 0.22, 0.13, 0.07])

    thal = np.random.choice([1, 2, 3], size=n_samples, p=[0.06, 0.55, 0.39])

    # Log-odds calculation for realistic binary target probability
    # Heart disease risk formula (Logistic Model underlying parameters)
    z = (
        -4.5
        + 0.03 * (age - 50)
        + 0.6 * sex
        + 0.5 * (cp == 0) + 0.3 * (cp == 3)
        + 0.015 * (trestbps - 120)
        + 0.005 * (chol - 200)
        + 0.4 * fbs
        + 0.3 * (restecg > 0)
        - 0.03 * (thalach - 150)
        + 0.9 * exang
        + 0.6 * oldpeak
        + 0.4 * (slope == 1) + 0.8 * (slope == 2)
        + 0.7 * ca
        + 0.8 * (thal == 3)
    )

    prob = 1 / (1 + np.exp(-z))
    target = (np.random.rand(n_samples) < prob).astype(int)

    df = pd.DataFrame({
        'age': age,
        'sex': sex,
        'cp': cp,
        'trestbps': trestbps,
        'chol': chol,
        'fbs': fbs,
        'restecg': restecg,
        'thalach': thalach,
        'exang': exang,
        'oldpeak': oldpeak,
        'slope': slope,
        'ca': ca,
        'thal': thal,
        'target': target
    })

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Dataset generated at {output_path} with {len(df)} rows. Target distribution:\n{df['target'].value_counts()}")

if __name__ == "__main__":
    generate_cleveland_dataset("C:/Users/Mathan Raj/.gemini/antigravity/scratch/CardioCare-AI/backend/data/heart_disease.csv")
