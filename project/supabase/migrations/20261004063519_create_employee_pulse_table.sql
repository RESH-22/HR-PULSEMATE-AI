/*
# Create employee_pulse table for HR PulseMate AI

1. New Tables
- `employee_pulse`
- `id` (uuid, primary key)
- `employee_id` (text, not null) — synthetic ID like "EMP-001", not a real person
- `department` (text, not null) — one of: Sales, Operations, IT, Finance, Marketing, HR
- `workload` (int 1-5) — "My workload is manageable" agreement score
- `recognition` (int 1-5) — "I feel recognized for my work"
- `career_growth` (int 1-5) — "I have opportunities for career growth"
- `manager_support` (int 1-5) — "My manager supports me"
- `work_life_balance` (int 1-5) — "I have a healthy work-life balance"
- `motivation` (int 1-5) — "I feel motivated at work"
- `job_satisfaction` (int 1-5) — "I am satisfied with my job"
- `pulse_score` (numeric 0-100) — aggregate health score computed from 7 factors
- `estimated_attrition_risk` (numeric 0-100) — prototype risk estimate (NOT a prediction of resignation)
- `created_at` (timestamptz)

2. Security
- Enable RLS on employee_pulse.
- Single-tenant demo app (no sign-in) — allow anon + authenticated full CRUD.
- All data is synthetic and intentionally public for the demo.

3. Important Notes
- This table stores SYNTHETIC data only. No real employee PII.
- pulse_score and estimated_attrition_risk are computed by a transparent scoring formula, NOT a trained ML model. They are labelled "Estimated" throughout the UI.
*/

CREATE TABLE IF NOT EXISTS employee_pulse (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL,
  department text NOT NULL,
  workload int NOT NULL DEFAULT 3,
  recognition int NOT NULL DEFAULT 3,
  career_growth int NOT NULL DEFAULT 3,
  manager_support int NOT NULL DEFAULT 3,
  work_life_balance int NOT NULL DEFAULT 3,
  motivation int NOT NULL DEFAULT 3,
  job_satisfaction int NOT NULL DEFAULT 3,
  pulse_score numeric NOT NULL DEFAULT 50,
  estimated_attrition_risk numeric NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE employee_pulse ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_pulse" ON employee_pulse;
CREATE POLICY "anon_select_pulse" ON employee_pulse FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_pulse" ON employee_pulse;
CREATE POLICY "anon_insert_pulse" ON employee_pulse FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_pulse" ON employee_pulse;
CREATE POLICY "anon_update_pulse" ON employee_pulse FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_pulse" ON employee_pulse;
CREATE POLICY "anon_delete_pulse" ON employee_pulse FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_employee_pulse_department ON employee_pulse(department);