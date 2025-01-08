-- Create managers table if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'managers') THEN
    CREATE TABLE managers (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      department text NOT NULL,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Enable RLS on the managers table
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- Policies for managers table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Managers can view their own data' AND tablename = 'managers') THEN
    CREATE POLICY "Managers can view their own data"
      ON managers
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to check if user is a manager
CREATE OR REPLACE FUNCTION check_manager_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT role FROM users WHERE id = NEW.user_id) != 'manager' THEN
    RAISE EXCEPTION 'User must be a manager';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce manager role on insert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'enforce_manager_role') THEN
    CREATE TRIGGER enforce_manager_role
    BEFORE INSERT ON managers
    FOR EACH ROW
    EXECUTE FUNCTION check_manager_role();
  END IF;
END $$;