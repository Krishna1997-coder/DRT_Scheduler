import { Outlet, Link, useLocation } from 'react-router-dom';
import { Calendar, Users, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Layout = () => {
  const location = useLocation();
  const { role } = useAuth();  // Using role from AuthContext

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-4 font-semibold text-gray-900">
                Shift Schedule Manager
              </Link>
              <div className="flex space-x-4 ml-10">
                <Link
                  to="/"
                  className={`inline-flex items-center px-4 py-2 border-b-2 ${location.pathname === '/'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule
                </Link>
                {role === 'manager' && (
                  <Link
                    to="/associates"
                    className={`inline-flex items-center px-4 py-2 border-b-2 ${location.pathname === '/associates'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Associates
                  </Link>
                )}
                <Link
                  to="/leaves"
                  className={`inline-flex items-center px-4 py-2 border-b-2 ${location.pathname === '/leaves'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Leaves
                </Link>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
