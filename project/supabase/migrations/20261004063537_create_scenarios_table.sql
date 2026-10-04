/*
# Create scenarios table for What-If HR Simulator

1. New Tables
- `scenarios`
- `id` (uuid, primary key)
- `name` (text, not null) — e.g. "Reduce workload"
- `department` (text) — optional department scope
- `workload_adjustment` (int, default 0) — slider adjustment -3..+3
- `recognition_adjustment` (int, default 0)
- `career_growth_adjustment` (int, default 0)
- `manager_support_adjustment` (int, default 0)
- `work_life_balance_adjustment` (int, default 0)
- `training_adjustment` (int, default 0)
- `simulated_pulse_score` (numeric)
- `simulated_attrition_risk` (numeric)
- `simulated_workload_label` (text)
- `simulated_satisfaction` (numeric)
- `created_at` (timestamptz)

2. Security
- Enable RLS. Single-tenant demo — anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text,
  workload_adjustment int NOT NULL DEFAULT 0,
  recognition_adjustment int NOT NULL DEFAULT 0,
  career_growth_adjustment int NOT NULL DEFAULT 0,
  manager_support_adjustment int NOT NULL DEFAULT 0,
  work_life_balance_adjustment int NOT NULL DEFAULT 0,
  training_adjustment int NOT NULL DEFAULT 0,
  simulated_pulse_score numeric NOT NULL DEFAULT 50,
  simulated_attrition_risk numeric NOT NULL DEFAULT 50,
  simulated_workload_label text NOT NULL DEFAULT 'Medium',
  simulated_satisfaction numeric NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scenarios" ON scenarios;
CREATE POLICY "anon_select_scenarios" ON scenarios FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scenarios" ON scenarios;
CREATE POLICY "anon_insert_scenarios" ON scenarios FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scenarios" ON scenarios;
CREATE POLICY "anon_delete_scenarios" ON scenarios FOR DELETE
TO anon, authenticated USING (true);