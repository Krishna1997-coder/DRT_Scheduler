-- Insert initial data into the users table
INSERT INTO users (id, email, full_name, role, created_at)
VALUES
  ('uuid-1', 'manager@example.com', 'Manager One', 'manager', NOW()),
  ('uuid-2', 'associate@example.com', 'Associate One', 'associate', NOW());

-- Insert initial data into the managers table
INSERT INTO managers (user_id, department, created_at)
VALUES
  ('uuid-1', 'HR', NOW());

-- Insert initial data into the schedules table
INSERT INTO schedules (id, user_id, weekoff_1, weekoff_2, shift_start, shift_end, updated_at)
VALUES
  ('uuid-1', 'uuid-2', 0, 6, '09:00', '18:00', NOW());

-- Insert initial data into the leaves table
INSERT INTO leaves (id, user_id, leave_type, start_date, end_date, status, created_at)
VALUES
  ('uuid-1', 'uuid-2', 'Casual Leave', '2025-01-01', '2025-01-02', 'approved', NOW());