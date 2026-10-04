import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.express as px

from database import (
    create_database,
    save_response,
    get_responses
)

from ai_assistant import (
    generate_hr_recommendation
)


# ------------------------------------------------
# CONFIGURATION
# ------------------------------------------------

st.set_page_config(
    page_title="HR PulseMate AI",
    page_icon="🧠",
    layout="wide"
)


# ------------------------------------------------
# INITIALIZATION
# ------------------------------------------------

create_database()

model = joblib.load(
    "models/attrition_model.pkl"
)

FEATURES = [
    "workload",
    "recognition",
    "career_growth",
    "manager_support",
    "work_life_balance",
    "motivation",
    "job_satisfaction"
]


# ------------------------------------------------
# SIDEBAR
# ------------------------------------------------

st.sidebar.title("🧠 HR PulseMate AI")

page = st.sidebar.radio(
    "Navigate",
    [
        "🏠 Dashboard",
        "📝 Employee Pulse",
        "🚨 Risk Monitor",
        "🤖 HR WorkMate",
        "🔮 What-If Simulator"
    ]
)


# =================================================
# EMPLOYEE PULSE
# =================================================

if page == "📝 Employee Pulse":

    st.title("📝 Anonymous Employee Pulse Survey")

    st.info(
        "Your responses are collected without asking for your name."
    )

    department = st.selectbox(
        "Department",
        [
            "HR",
            "Finance",
            "Marketing",
            "Sales",
            "IT",
            "Operations"
        ]
    )

    workload = st.slider(
        "My workload is manageable",
        1, 5, 3
    )

    recognition = st.slider(
        "I feel recognized for my work",
        1, 5, 3
    )

    career_growth = st.slider(
        "I have opportunities for career growth",
        1, 5, 3
    )

    manager_support = st.slider(
        "My manager supports me",
        1, 5, 3
    )

    work_life_balance = st.slider(
        "I have a healthy work-life balance",
        1, 5, 3
    )

    motivation = st.slider(
        "I feel motivated at work",
        1, 5, 3
    )

    job_satisfaction = st.slider(
        "I am satisfied with my job",
        1, 5, 3
    )

    if st.button(
        "Submit Anonymous Response",
        type="primary"
    ):

        pulse_score = (
            (
                recognition
                + career_growth
                + manager_support
                + work_life_balance
                + motivation
                + job_satisfaction
            ) / 30
        ) * 100

        data = {
            "department": department,
            "workload": workload,
            "recognition": recognition,
            "career_growth": career_growth,
            "manager_support": manager_support,
            "work_life_balance": work_life_balance,
            "motivation": motivation,
            "job_satisfaction": job_satisfaction,
            "pulse_score": pulse_score
        }

        save_response(data)

        st.success(
            "Thank you! Your anonymous response has been recorded."
        )

        st.metric(
            "Your Pulse Score",
            f"{pulse_score:.1f}%"
        )


# =================================================
# DASHBOARD
# =================================================

elif page == "🏠 Dashboard":

    st.title("🧠 HR PulseMate AI")
    st.subheader(
        "AI-Powered Employee Intelligence & HR Decision Support"
    )

    df = pd.read_csv(
        "data/employees.csv"
    )

    avg_pulse = df["pulse_score"].mean()

    X = df[FEATURES]

    probabilities = model.predict_proba(X)[:, 1]

    avg_risk = probabilities.mean() * 100

    high_risk = (
        probabilities >= 0.60
    ).sum()

    col1, col2, col3, col4 = st.columns(4)

    col1.metric(
        "Employee Pulse",
        f"{avg_pulse:.1f}%"
    )

    col2.metric(
        "Average Attrition Risk",
        f"{avg_risk:.1f}%"
    )

    col3.metric(
        "High-Risk Employees",
        int(high_risk)
    )

    col4.metric(
        "Employees Analysed",
        len(df)
    )

    st.divider()

    # Department analysis

    dept = df.groupby(
        "department"
    )["pulse_score"].mean().reset_index()

    fig = px.bar(
        dept,
        x="department",
        y="pulse_score",
        title="Employee Pulse by Department",
        labels={
            "pulse_score": "Pulse Score (%)",
            "department": "Department"
        }
    )

    st.plotly_chart(
        fig,
        use_container_width=True
    )


# =================================================
# RISK MONITOR
# =================================================

elif page == "🚨 Risk Monitor":

    st.title("🚨 Attrition Risk Monitor")

    df = pd.read_csv(
        "data/employees.csv"
    )

    X = df[FEATURES]

    df["risk_probability"] = (
        model.predict_proba(X)[:, 1] * 100
    )

    df["risk_level"] = pd.cut(
        df["risk_probability"],
        bins=[0, 30, 60, 100],
        labels=[
            "🟢 Low",
            "🟡 Medium",
            "🔴 High"
        ]
    )

    display_columns = [
        "employee_id",
        "department",
        "pulse_score",
        "risk_probability",
        "risk_level"
    ]

    st.dataframe(
        df[display_columns]
        .sort_values(
            "risk_probability",
            ascending=False
        ),
        use_container_width=True
    )


# =================================================
# HR WORKMATE
# =================================================

elif page == "🤖 HR WorkMate":

    st.title("🤖 AI HR WorkMate")

    df = pd.read_csv(
        "data/employees.csv"
    )

    department = st.selectbox(
        "Select Department",
        df["department"].unique()
    )

    dept_df = df[
        df["department"] == department
    ]

    avg_values = dept_df[FEATURES].mean()

    X = dept_df[FEATURES]

    risk = (
        model.predict_proba(X)[:, 1].mean()
        * 100
    )

    pulse = dept_df[
        "pulse_score"
    ].mean()

    # Identify weakest factors

    factors = avg_values.sort_values()

    factor_text = "\n".join(
        [
            f"{name}: {value:.1f}/5"
            for name, value in factors.head(3).items()
        ]
    )

    st.metric(
        "Department Pulse",
        f"{pulse:.1f}%"
    )

    st.metric(
        "Estimated Attrition Risk",
        f"{risk:.1f}%"
    )

    if st.button(
        "Generate AI HR Recommendations",
        type="primary"
    ):

        with st.spinner(
            "AI is analysing workplace signals..."
        ):

            result = generate_hr_recommendation(
                pulse,
                risk,
                department,
                factor_text
            )

        st.markdown(
            "### 🤖 AI HR Recommendation"
        )

        st.write(result)


# =================================================
# WHAT IF SIMULATOR
# =================================================

elif page == "🔮 What-If Simulator":

    st.title("🔮 What-If HR Simulator")

    st.write(
        "Test how HR interventions could influence "
        "workplace risk."
    )

    df = pd.read_csv(
        "data/employees.csv"
    )

    department = st.selectbox(
        "Choose Department",
        df["department"].unique()
    )

    dept_df = df[
        df["department"] == department
    ]

    base = dept_df[FEATURES].mean()

    baseline_risk = (
        model.predict_proba(
            dept_df[FEATURES]
        )[:, 1].mean()
        * 100
    )

    st.subheader(
        "Current Situation"
    )

    col1, col2 = st.columns(2)

    col1.metric(
        "Pulse Score",
        f"{dept_df['pulse_score'].mean():.1f}%"
    )

    col2.metric(
        "Attrition Risk",
        f"{baseline_risk:.1f}%"
    )

    st.divider()

    st.subheader(
        "Test an HR Intervention"
    )

    workload_change = st.slider(
        "Reduce workload",
        0.0,
        2.0,
        0.0,
        0.5
    )

    recognition_change = st.slider(
        "Increase recognition",
        0.0,
        2.0,
        0.0,
        0.5
    )

    growth_change = st.slider(
        "Increase career growth",
        0.0,
        2.0,
        0.0,
        0.5
    )

    manager_change = st.slider(
        "Improve manager support",
        0.0,
        2.0,
        0.0,
        0.5
    )

    simulated = base.copy()

    simulated["workload"] = max(
        1,
        simulated["workload"] - workload_change
    )

    simulated["recognition"] = min(
        5,
        simulated["recognition"] + recognition_change
    )

    simulated["career_growth"] = min(
        5,
        simulated["career_growth"] + growth_change
    )

    simulated["manager_support"] = min(
        5,
        simulated["manager_support"] + manager_change
    )

    original_risk = (
        model.predict_proba(
            [base[FEATURES].values]
        )[0][1] * 100
    )

    simulated_risk = (
        model.predict_proba(
            [simulated[FEATURES].values]
        )[0][1] * 100
    )

    st.divider()

    col1, col2 = st.columns(2)

    col1.metric(
        "Current Risk",
        f"{original_risk:.1f}%"
    )

    col2.metric(
        "Simulated Risk",
        f"{simulated_risk:.1f}%",
        delta=f"{simulated_risk - original_risk:.1f}%"
    )

    if simulated_risk < original_risk:

        st.success(
            "✅ This intervention may reduce estimated risk."
        )

    elif simulated_risk > original_risk:

        st.warning(
            "⚠️ This scenario increases estimated risk."
        )

    else:

        st.info(
            "This scenario produces little change."
        )
