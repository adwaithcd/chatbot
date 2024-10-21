-- Survey Responses Table
CREATE TABLE IF NOT EXISTS survey_responses (
  survey_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_completed INT NOT NULL DEFAULT 0,
  application_year INT,
  city TEXT,
  state TEXT,
  zipcode TEXT,
  country TEXT,
  high_school_name TEXT,
  high_school_gpa NUMERIC(3,2),
  max_gpa NUMERIC(3,2),
  current_enrolled_program TEXT,
  reason_for_choosing_asu TEXT,
  financial_support_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Test Scores Table
CREATE TABLE IF NOT EXISTS test_scores (
  score_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES survey_responses(survey_id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_score TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- College Applications Table
CREATE TABLE IF NOT EXISTS college_applications (
  application_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES survey_responses(survey_id) ON DELETE CASCADE,
  college_name TEXT NOT NULL,
  major TEXT,
  offer_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Impact factors Table
CREATE TABLE IF NOT EXISTS impact_factors (
  impact_factor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES survey_responses(survey_id) ON DELETE CASCADE,
  impact_factor TEXT NOT NULL,
  is_important BOOLEAN,
  rank INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_test_scores_survey_id ON test_scores (survey_id);
CREATE INDEX idx_college_applications_survey_id ON college_applications (survey_id);
CREATE INDEX idx_impact_factors_survey_id ON impact_factors (survey_id);

-- RLS
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own survey responses"
ON survey_responses
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE test_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own test scores"
ON test_scores
USING (survey_id IN (SELECT survey_id FROM survey_responses WHERE user_id = auth.uid()));

ALTER TABLE college_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own college applications"
ON college_applications
USING (survey_id IN (SELECT survey_id FROM survey_responses WHERE user_id = auth.uid()));

ALTER TABLE impact_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow full access to own impact factors"
ON impact_factors
USING (survey_id IN (SELECT survey_id FROM survey_responses WHERE user_id = auth.uid()));

-- Triggers
CREATE TRIGGER update_survey_responses_updated_at
BEFORE UPDATE ON survey_responses
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_test_scores_updated_at
BEFORE UPDATE ON test_scores
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_college_applications_updated_at
BEFORE UPDATE ON college_applications
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_impact_factors_updated_at
BEFORE UPDATE ON impact_factors
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();