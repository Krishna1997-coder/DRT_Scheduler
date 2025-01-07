import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Associate {
  id: string;
  full_name: string;
  email: string;
  schedule?: {
    weekoff_1: number;
    weekoff_2: number;
    shift_start: string;
    shift_end: string;
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const Associates = () => {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState({
    weekoff_1: 0,
    weekoff_2: 6,
    shift_start: '09:00',
    shift_end: '18:00'
  });

  useEffect(() => {
    fetchAssociates();
  }, []);

  const fetchAssociates = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          schedule:schedules(
            weekoff_1,
            weekoff_2,
            shift_start,
            shift_end
          )
        `)
        .eq('role', 'associate')
        .order('full_name');
      
      if (error) throw error;
      setAssociates(data?.map(associate => ({
        ...associate,
        schedule: associate.schedule?.[0]
      })) || []);
    } catch (error) {
      console.error('Error fetching associates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (associate: Associate) => {
    setEditingId(associate.id);
    setSchedule(associate.schedule || {
      weekoff_1: 0,
      weekoff_2: 6,
      shift_start: '09:00',
      shift_end: '18:00'
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .upsert({
          user_id: editingId,
          ...schedule
        });

      if (error) throw error;
      fetchAssociates();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b">
        <h2 className="text-lg font-semibold">Associates</h2>
      </div>
      <div className="divide-y">
        {associates.map(associate => (
          <div key={associate.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium">{associate.full_name}</h3>
                <p className="text-sm text-gray-500">{associate.email}</p>
              </div>
              {editingId === associate.id ? (
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                >
                  Save
                </button>
              ) : (
                <button
                  onClick={() => handleEdit(associate)}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Edit Schedule
                </button>
              )}
            </div>
            
            {editingId === associate.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Week Off</label>
                    <select
                      value={schedule.weekoff_1}
                      onChange={e => setSchedule(prev => ({ ...prev, weekoff_1: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {DAYS.map((day, index) => (
                        <option key={day} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Second Week Off</label>
                    <select
                      value={schedule.weekoff_2}
                      onChange={e => setSchedule(prev => ({ ...prev, weekoff_2: parseInt(e.target.value) }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      {DAYS.map((day, index) => (
                        <option key={day} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Shift Start</label>
                    <input
                      type="time"
                      value={schedule.shift_start}
                      onChange={e => setSchedule(prev => ({ ...prev, shift_start: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Shift End</label>
                    <input
                      type="time"
                      value={schedule.shift_end}
                      onChange={e => setSchedule(prev => ({ ...prev, shift_end: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Week Offs</p>
                  <p>{associate.schedule ? `${DAYS[associate.schedule.weekoff_1]}, ${DAYS[associate.schedule.weekoff_2]}` : 'Not set'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Shift Timing</p>
                  <p>{associate.schedule ? `${associate.schedule.shift_start} - ${associate.schedule.shift_end}` : 'Not set'}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Associates;