import pandas as pd
import numpy as np

np.random.seed(42)

N = 1000

departments = [
    "HR",
    "Finance",
    "Marketing",
    "Sales",
    "IT",
    "Operations"
]

data = {
    "employee_id": [f"EMP{i:04d}" for i in range(1, N + 1)],
    "department": np.random.choice(departments, N),
    "workload": np.random.randint(1, 6, N),
    "recognition": np.random.randint(1, 6, N),
    "career_growth": np.random.randint(1, 6, N),
    "manager_support": np.random.randint(1, 6, N),
    "work_life_balance": np.random.randint(1, 6, N),
    "motivation": np.random.randint(1, 6, N),
    "job_satisfaction": np.random.randint(1, 6, N)
}

df = pd.DataFrame(data)

# Calculate pulse score
positive_factors = [
    "recognition",
    "career_growth",
    "manager_support",
    "work_life_balance",
    "motivation",
    "job_satisfaction"
]

df["pulse_score"] = (
    df[positive_factors].sum(axis=1) /
    (len(positive_factors) * 5)
) * 100

# Workload is treated differently:
# higher workload = higher risk
risk_score = (
    (6 - df["recognition"]) * 0.18 +
    (6 - df["career_growth"]) * 0.18 +
    (6 - df["manager_support"]) * 0.14 +
    (6 - df["work_life_balance"]) * 0.14 +
    (6 - df["motivation"]) * 0.12 +
    (6 - df["job_satisfaction"]) * 0.14 +
    df["workload"] * 0.10
)

risk_probability = risk_score / risk_score.max()

df["attrition"] = (
    risk_probability > 0.50
).astype(int)

# Add some randomness
noise = np.random.random(N)

df.loc[
    (noise < 0.08),
    "attrition"
] = 1 - df.loc[
    (noise < 0.08),
    "attrition"
]

df.to_csv("data/employees.csv", index=False)

print("Dataset created successfully!")
print(df.head())
