import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score


FEATURES = [
    "workload",
    "recognition",
    "career_growth",
    "manager_support",
    "work_life_balance",
    "motivation",
    "job_satisfaction"
]

TARGET = "attrition"


def train_model():

    df = pd.read_csv("data/employees.csv")

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        random_state=42
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    print("Model Accuracy:", accuracy)

    joblib.dump(
        model,
        "models/attrition_model.pkl"
    )

    print("Model saved successfully!")


if __name__ == "__main__":
    train_model()
