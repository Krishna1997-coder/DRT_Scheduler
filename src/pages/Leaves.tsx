import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Leave {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  user_id: string;
  user?: {
    full_name: string;
  };
}

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Annual Leave',
  'Optional Off',
  'HD CL',
  'HD SL',
  'Pre/Post Shift OT',
  '6th Day OT'
];

const Leaves = () => {
  const { session, isManager } = useAuth();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [newLeave, setNewLeave] = useState({
    leave_type: LEAVE_TYPES[0],
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaves();
  }, [session?.user?.id, isManager]);

  const fetchLeaves = async () => {
    try {
      const query = supabase
        .from('leaves')
        .select(`
          *,
          user:users(full_name)
        `)
        .order('created_at', { ascending: false });

      if (!isManager) {
        query.eq('user_id', session?.user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLeaves(data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('leaves').insert({
        ...newLeave,
        user_id: session?.user?.id
      });
      if (error) throw error;
      fetchLeaves();
      // Reset form
      setNewLeave({
        leave_type: LEAVE_TYPES[0],
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error creating leave:', error);
    }
  };

  const handleStatusUpdate = async (leaveId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({ status: newStatus })
        .eq('id', leaveId);
      if (error) throw error;
      fetchLeaves();
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {!isManager && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Request Leave</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Leave Type</label>
              <select
                value={newLeave.leave_type}
                onChange={e => setNewLeave(prev => ({ ...prev, leave_type: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {LEAVE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={newLeave.start_date}
                  onChange={e => setNewLeave(prev => ({ ...prev, start_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={newLeave.end_date}
                  onChange={e => setNewLeave(prev => ({ ...prev, end_date: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit Request
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Leave Requests</h2>
        </div>
        <div className="divide-y">
          {leaves.map(leave => (
            <div key={leave.id} className="p-6 flex items-center justify-between">
              <div>
                {isManager && (
                  <div className="text-sm text-gray-500">
                    {leave.user?.full_name}
                  </div>
                )}
                <div className="font-medium">{leave.leave_type}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(leave.start_date), 'MMM d, yyyy')} - {format(new Date(leave.end_date), 'MMM d, yyyy')}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                  {leave.status}
                </span>
              </div>
              {isManager && leave.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleStatusUpdate(leave.id, 'approved')}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm hover:bg-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                    className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-sm hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
          {leaves.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              No leave requests found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaves;