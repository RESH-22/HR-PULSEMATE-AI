import os

from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

client = None

if API_KEY:
    client = genai.Client(
        api_key=API_KEY
    )


def generate_hr_recommendation(
    pulse_score,
    attrition_risk,
    department,
    factors
):

    if client is None:
        return (
            "AI API key is not configured. "
            "Please add GEMINI_API_KEY to your .env file."
        )

    prompt = f"""
You are an HR decision-support assistant.

Do not make employment decisions about individuals.
Provide recommendations at a team or organizational level.

Department:
{department}

Employee Pulse Score:
{pulse_score:.1f}%

Estimated Attrition Risk:
{attrition_risk:.1f}%

Main contributing factors:
{factors}

Provide:

1. Main workplace concern
2. Possible reason
3. Immediate HR action
4. Medium-term HR action
5. Employee development recommendation

Keep the response practical and concise.
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return response.text
