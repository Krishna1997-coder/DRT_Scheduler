import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Associate {
  id: string;
  full_name: string;
}

interface ShiftSchedule {
  id: string;
  user_id: string;
  shift_start: string;
  shift_end: string;
  weekoff_days: string;
}

interface Leave {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  comments?: string;
}

const Dashboard: React.FC = () => {
  const { session, role, userId } = useAuth();  // Use role from AuthContext
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [weekoffDays, setWeekoffDays] = useState<string[]>(['', '']);
  const [shiftStart, setShiftStart] = useState<string>('09:00');
  const [shiftEnd, setShiftEnd] = useState<string>('17:00');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [leaveType, setLeaveType] = useState<string>('Casual Leave');
  const [comments, setComments] = useState<string>('');

  // Fetch data based on user role
  useEffect(() => {
    if (role === 'manager') {
      fetchAssociates();
      fetchShiftSchedules();
    } else if (role === 'associate') {
      fetchShiftSchedule();
      fetchLeaves();
    }
  }, [role]);

  const fetchAssociates = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('manager_id', userId); // Fetch associates for the current manager
    if (data) setAssociates(data);
    if (error) console.error('Error fetching associates:', error);
  };

  const fetchShiftSchedules = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('manager_id', userId); // Fetch schedules for all associates under the manager
    if (data) setShiftSchedules(data);
    if (error) console.error('Error fetching schedules:', error);
  };

  const fetchShiftSchedule = async () => {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', userId); // Fetch shift schedule for the associate
    if (data) setShiftSchedules(data);
    if (error) console.error('Error fetching schedule:', error);
  };

  const fetchLeaves = async () => {
    const { data, error } = await supabase
      .from('leaves')
      .select('*')
      .eq('user_id', userId); // Fetch leaves for the associate
    if (data) setLeaves(data);
    if (error) console.error('Error fetching leaves:', error);
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from('leaves')
      .insert([
        {
          user_id: userId,
          leave_type: leaveType,
          start_date: selectedDate,
          end_date: selectedDate,
          status: 'pending',
          comments: comments,
        },
      ]);
    if (error) console.error('Error submitting leave:', error);
    else alert('Leave request submitted!');
  };

  const handleSubmitSchedule = async (e: React.FormEvent, associateId: string) => {
    e.preventDefault();
    const { error } = await supabase
      .from('schedules')
      .upsert({
        user_id: associateId,
        weekoff_days: weekoffDays.join(', '), // Storing weekoff days as a comma-separated string
        shift_start: shiftStart,
        shift_end: shiftEnd,
      });
    if (error) console.error('Error updating schedule:', error);
    else alert('Schedule updated!');
  };

  if (!session) {
    return <div>Please log in to view your dashboard.</div>;
  }

  return (
    <div>
      {role === 'manager' ? (
        <div>
          <h2>Manager Dashboard</h2>

          {/* List of Associates */}
          <h3>List of Associates</h3>
          <ul>
            {associates.map((associate) => (
              <li key={associate.id}>{associate.full_name}</li>
            ))}
          </ul>

          {/* Edit Weekoff Days & Shift Timings */}
          <h3>Edit Weekoff Days & Shift Timings</h3>
          {associates.map((associate) => (
            <form key={associate.id} onSubmit={(e) => handleSubmitSchedule(e, associate.id)}>
              <label>
                Weekoff Days:
                <select
                  value={weekoffDays[0]}
                  onChange={(e) => setWeekoffDays([e.target.value, weekoffDays[1]])}
                >
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  {/* Add all weekdays here */}
                </select>
                <select
                  value={weekoffDays[1]}
                  onChange={(e) => setWeekoffDays([weekoffDays[0], e.target.value])}
                >
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  {/* Add all weekdays here */}
                </select>
              </label>
              <label>
                Shift Start Time:
                <input
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                />
              </label>
              <label>
                Shift End Time:
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                />
              </label>
              <button type="submit">Save Changes</button>
            </form>
          ))}

          {/* View Shift Schedules & Leaves */}
          <h3>View Shift Schedules & Leaves</h3>
          <table>
            <thead>
              <tr>
                <th>Associate Name</th>
                <th>Shift Start</th>
                <th>Shift End</th>
                <th>Weekoff Days</th>
                <th>Leave Status</th>
              </tr>
            </thead>
            <tbody>
              {shiftSchedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>{schedule.user_id}</td>
                  <td>{schedule.shift_start}</td>
                  <td>{schedule.shift_end}</td>
                  <td>{schedule.weekoff_days}</td>
                  <td>{leaves.find((leave) => leave.user_id === schedule.user_id)?.status || 'No leave'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : role === 'associate' ? (
        <div>
          <h2>Associate Dashboard</h2>

          {/* Update Leaves */}
          <h3>Update Leaves</h3>
          <form onSubmit={handleSubmitLeave}>
            <label>
              Select Date:
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </label>
            <label>
              Leave Type:
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
              >
                <option value="Casual Leave">Casual Leave</option>
                <option value="Sick Leave">Sick Leave</option>
                {/* Add more leave types */}
              </select>
            </label>
            <label>
              Comments:
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </label>
            <button type="submit">Submit Leave Request</button>
          </form>

          {/* View Shift Schedule */}
          <h3>View Shift Schedule</h3>
          <table>
            <thead>
              <tr>
                <th>Shift Start</th>
                <th>Shift End</th>
                <th>Weekoff Days</th>
              </tr>
            </thead>
            <tbody>
              {shiftSchedules.map((schedule) => (
                <tr key={schedule.id}>
                  <td>{schedule.shift_start}</td>
                  <td>{schedule.shift_end}</td>
                  <td>{schedule.weekoff_days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default Dashboard;
