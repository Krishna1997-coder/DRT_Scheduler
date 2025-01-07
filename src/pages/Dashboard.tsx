import React, { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Schedule {
  weekoff_1: number;
  weekoff_2: number;
  shift_start: string;
  shift_end: string;
}

interface Leave {
  start_date: string;
  end_date: string;
  leave_type: string;
  status: string;
}

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      fetchSchedule();
      fetchLeaves();
    }
  }, [session?.user?.id]);

  const fetchSchedule = async () => {
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('user_id', session?.user?.id)
      .single();
    setSchedule(data);
  };

  const fetchLeaves = async () => {
    const { data } = await supabase
      .from('leaves')
      .select('*')
      .eq('user_id', session?.user?.id)
      .gte('start_date', format(startOfMonth(currentDate), 'yyyy-MM-dd'))
      .lte('end_date', format(endOfMonth(currentDate), 'yyyy-MM-dd'));
    setLeaves(data || []);
  };

  const getDayStatus = (date: Date) => {
    if (!schedule) return { type: 'loading', label: 'Loading...' };

    const dayOfWeek = date.getDay();
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Check if it's a week off
    if (dayOfWeek === schedule.weekoff_1 || dayOfWeek === schedule.weekoff_2) {
      return { type: 'weekoff', label: 'Week Off' };
    }

    // Check if there's a leave on this day
    const leave = leaves.find(l => 
      dateStr >= l.start_date && 
      dateStr <= l.end_date
    );

    if (leave) {
      return { 
        type: leave.status === 'approved' ? 'leave-approved' : 'leave-pending',
        label: leave.leave_type
      };
    }

    // Regular working day
    return { 
      type: 'working',
      label: `${schedule.shift_start} - ${schedule.shift_end}`
    };
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'weekoff': return 'bg-gray-100';
      case 'leave-approved': return 'bg-green-100';
      case 'leave-pending': return 'bg-yellow-100';
      case 'working': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {format(currentDate, 'MMMM yyyy')}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
            className="px-3 py-1 rounded border hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
            className="px-3 py-1 rounded border hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center font-semibold py-2">
            {day}
          </div>
        ))}
        
        {days.map(day => {
          const status = getDayStatus(day);
          return (
            <div
              key={day.toString()}
              className={`p-2 min-h-[100px] rounded ${getStatusColor(status.type)}`}
            >
              <div className="font-semibold">{format(day, 'd')}</div>
              <div className="text-sm mt-1">{status.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;