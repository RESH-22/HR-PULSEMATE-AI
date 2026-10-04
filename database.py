import sqlite3
import pandas as pd

DB_NAME = "hr_pulsemate.db"


def create_database():

    conn = sqlite3.connect(DB_NAME)

    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pulse_responses (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            department TEXT,

            workload INTEGER,

            recognition INTEGER,

            career_growth INTEGER,

            manager_support INTEGER,

            work_life_balance INTEGER,

            motivation INTEGER,

            job_satisfaction INTEGER,

            pulse_score REAL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

        )
    """)

    conn.commit()
    conn.close()


def save_response(data):

    conn = sqlite3.connect(DB_NAME)

    query = """
        INSERT INTO pulse_responses
        (
            department,
            workload,
            recognition,
            career_growth,
            manager_support,
            work_life_balance,
            motivation,
            job_satisfaction,
            pulse_score
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    conn.execute(
        query,
        (
            data["department"],
            data["workload"],
            data["recognition"],
            data["career_growth"],
            data["manager_support"],
            data["work_life_balance"],
            data["motivation"],
            data["job_satisfaction"],
            data["pulse_score"]
        )
    )

    conn.commit()
    conn.close()


def get_responses():

    conn = sqlite3.connect(DB_NAME)

    df = pd.read_sql_query(
        "SELECT * FROM pulse_responses",
        conn
    )

    conn.close()

    return df
