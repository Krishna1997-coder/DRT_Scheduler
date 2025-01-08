/*
  # Initial Schema for Shift Schedule Management

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `full_name` (text)
      - `role` (text)
      - `created_at` (timestamp)
    
    - `managers`
      - `user_id` (uuid, primary key, foreign key)
      - `department` (text)
      - `created_at` (timestamp)

    - `schedules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `weekoff_1` (integer, 0-6 for Sun-Sat)
      - `weekoff_2` (integer, 0-6 for Sun-Sat)
      - `shift_start` (time)
      - `shift_end` (time)
      - `updated_at` (timestamp)

    - `leaves`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `leave_type` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `status` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'associate')),
  created_at timestamptz DEFAULT now()
);

-- Create managers table
CREATE TABLE managers (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  department text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK ((SELECT role FROM users WHERE id = user_id) = 'manager')
);

-- Create schedules table
CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  weekoff_1 integer NOT NULL CHECK (weekoff_1 BETWEEN 0 AND 6),
  weekoff_2 integer NOT NULL CHECK (weekoff_2 BETWEEN 0 AND 6),
  shift_start time NOT NULL,
  shift_end time NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create leaves table
CREATE TABLE leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  leave_type text NOT NULL CHECK (
    leave_type IN (
      'Casual Leave',
      'Sick Leave',
      'Annual Leave',
      'Optional Off',
      'HD CL',
      'HD SL',
      'Pre/Post Shift OT',
      '6th Day OT'
    )
  ),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Policies for users table
CREATE POLICY "Users can view their own data and managers can view all"
  ON users
  FOR SELECT
  USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM managers WHERE user_id = auth.uid()
    )
  );

-- Policies for managers table
CREATE POLICY "Managers can view their own data"
  ON managers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for schedules table
CREATE POLICY "Associates can view their schedule and managers can view all"
  ON schedules
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM managers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Only managers can update schedules"
  ON schedules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM managers WHERE user_id = auth.uid()
    )
  );

-- Policies for leaves table
CREATE POLICY "Associates can view their leaves and managers can view all"
  ON leaves
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM managers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Associates can create their own leaves"
  ON leaves
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Associates can update their pending leaves"
  ON leaves
  FOR UPDATE
  USING (
    user_id = auth.uid() AND status = 'pending'
  );

CREATE POLICY "Managers can update all leaves"
  ON leaves
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM managers WHERE user_id = auth.uid()
    )
  );