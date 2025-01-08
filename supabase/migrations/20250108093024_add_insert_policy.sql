-- Allow authenticated users to insert new rows into the users table
CREATE POLICY "Authenticated users can insert new rows"
  ON users
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);