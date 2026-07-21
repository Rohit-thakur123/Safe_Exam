import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, BarChart3, Plus, ListChecks, FileText, Eye, Code2, BookOpen, LogOut, Menu, X, User
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/teacher', label: 'Dashboard', icon: BarChart3, exact: true },
  { to: '/teacher/exams', label: 'Assessments', icon: Eye },
  { to: '/teacher/mcq', label: 'MCQ Library', icon: ListChecks },
  { to: '/teacher/coding-questions', label: 'Coding Challenges', icon: Code2 },
  { to: '/teacher/subjective-questions', label: 'Subjective', icon: BookOpen },
  { to: '/teacher/create-question', label: 'New Question', icon: Plus },
  { to: '/teacher/create-exam', label: 'New Exam', icon: FileText },
];

export const TeacherNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (to: string, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <Link to="/teacher" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Shield size={18} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-900 leading-none">SecureExam</span>
                <span className="text-[11px] font-medium text-violet-600 leading-none mt-1">Enterprise Console</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => {
                const active = isActive(to, exact);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active
                        ? 'bg-violet-50 text-violet-700 shadow-xs'
                        : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-violet-600' : 'text-gray-400'} />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3 border-r border-gray-200 pr-4">
              <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-semibold text-xs border border-violet-200">
                {user?.name?.slice(0, 2).toUpperCase() || <User size={14} />}
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-gray-900">{user?.name}</span>
                <span className="text-[10px] text-gray-500 capitalize">{user?.role || 'Instructor'}</span>
              </div>
            </div>

            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span>Logout</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-gray-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {NAV_LINKS.map(({ to, label, icon: Icon, exact }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                isActive(to, exact) ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Logged in as {user?.email}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 bg-rose-50"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default TeacherNavbar;
